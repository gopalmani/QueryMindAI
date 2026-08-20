from typing import Annotated

from fastapi import APIRouter, Depends, status
from sqlalchemy import select, text
from sqlalchemy.orm import Session

from app.audit.service import record_audit
from app.auth.dependencies import get_current_user_id, issue_session
from app.auth.schemas import SessionResponse
from app.connections.schemas import (ConnectionCreate, ConnectionResponse, ConnectionTestResponse,
                                     SchemaResponse)
from app.connections.security import decrypt_config, normalize_connection_input
from app.connections.service import (create_saved_connection, inspect_and_check, latest_snapshot, masked,
                                     owned_connection, refresh_owned_schema)
from app.core.config import settings
from app.core.exceptions import DependencyError, FeatureDisabledError, NotFoundError, QueryMindError
from app.db.session import get_db
from app.models.byod import DatabaseConnection
from app.query_planner.schemas import (QueryDraftResponse, QueryExecuteRequest, QueryExecutionResponse,
                                       QueryGenerateRequest)
from app.query_planner.service import generate_draft
from app.execution.service import execute_draft
from app.schemas.query_schema import VerifiedExampleRequest
from app.services.golden_record_service import save_golden_record

router = APIRouter()
UserId = Annotated[str, Depends(get_current_user_id)]
Db = Annotated[Session, Depends(get_db)]


def enabled():
    if not settings.ENABLE_EXTERNAL_CONNECTIONS:
        raise FeatureDisabledError("Saved external database connections are disabled")


@router.post("/auth/session", response_model=SessionResponse)
def create_workspace_session():
    enabled(); token, _, expires_at = issue_session()
    return {"access_token": token, "expires_at": expires_at}


@router.post("/connections", response_model=ConnectionResponse, status_code=status.HTTP_201_CREATED)
def create_connection(request: ConnectionCreate, user_id: UserId, db: Db):
    enabled()
    config = normalize_connection_input(request)
    try:
        connection, warnings = create_saved_connection(db, user_id, request.name, config)
        return masked(connection, warnings)
    except QueryMindError:
        db.rollback(); raise
    except Exception as exc:
        db.rollback()
        raise DependencyError("The database connection could not be established") from exc


@router.get("/connections", response_model=list[ConnectionResponse])
def list_connections(user_id: UserId, db: Db):
    enabled()
    items = db.scalars(select(DatabaseConnection).where(DatabaseConnection.user_id == user_id)
                       .order_by(DatabaseConnection.created_at.desc())).all()
    return [masked(item) for item in items]


@router.get("/connections/{connection_id}", response_model=ConnectionResponse)
def get_connection(connection_id: str, user_id: UserId, db: Db):
    enabled(); return masked(owned_connection(db, connection_id, user_id))


@router.post("/connections/{connection_id}/test", response_model=ConnectionTestResponse)
def test_connection(connection_id: str, user_id: UserId, db: Db):
    enabled(); saved = owned_connection(db, connection_id, user_id)
    try:
        _, read_only, warnings = inspect_and_check(decrypt_config(saved.encrypted_connection_data))
    except Exception as exc:
        saved.status = "failed"; record_audit(db, user_id, "connection_tested", saved.id, {"status": "failed"}); db.commit()
        raise DependencyError("The database connection test failed") from exc
    saved.status = "connected"; record_audit(db, user_id, "connection_tested", saved.id, {"status": "connected"}); db.commit()
    return {"status": "connected", "read_only": read_only, "warnings": warnings}


@router.post("/connections/{connection_id}/refresh-schema", response_model=SchemaResponse)
def refresh_schema(connection_id: str, user_id: UserId, db: Db):
    enabled(); saved = owned_connection(db, connection_id, user_id)
    snapshot = refresh_owned_schema(db, saved, user_id)
    return {"connection_id": saved.id, "schema_hash": snapshot.schema_hash,
            "metadata": snapshot.normalized_metadata, "updated_at": snapshot.updated_at}


@router.get("/connections/{connection_id}/schema", response_model=SchemaResponse)
def get_schema(connection_id: str, user_id: UserId, db: Db):
    enabled(); saved = owned_connection(db, connection_id, user_id); snapshot = latest_snapshot(db, saved.id)
    return {"connection_id": saved.id, "schema_hash": snapshot.schema_hash,
            "metadata": snapshot.normalized_metadata, "updated_at": snapshot.updated_at}


@router.delete("/connections/{connection_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_connection(connection_id: str, user_id: UserId, db: Db):
    enabled(); saved = owned_connection(db, connection_id, user_id)
    record_audit(db, user_id, "connection_deleted", saved.id, {"name": saved.name})
    db.execute(text("DELETE FROM golden_records WHERE connection_key = :key"), {"key": saved.id})
    db.execute(text("DELETE FROM schema_embeddings WHERE connection_key = :key"), {"key": saved.id})
    db.delete(saved); db.commit()


@router.post("/queries/generate", response_model=QueryDraftResponse)
async def generate_query(request: QueryGenerateRequest, user_id: UserId, db: Db):
    enabled(); draft = await generate_draft(db, user_id, request.connection_id, request.question)
    return {"draft_id": draft.id, "connection_id": draft.connection_id, "sql": draft.sql,
            "explanation": draft.explanation, "assumptions": draft.assumptions, "warnings": draft.warnings,
            "confidence": float(draft.confidence), "expires_at": draft.expires_at}


@router.post("/queries/execute", response_model=QueryExecutionResponse)
def run_query(request: QueryExecuteRequest, user_id: UserId, db: Db):
    enabled(); return execute_draft(db, user_id, request.draft_id)


@router.get("/queries/history")
def byod_history(user_id: UserId, db: Db, limit: int = 50):
    enabled()
    rows = db.execute(text("""
      SELECT id, connection_id, question, generated_sql AS sql, execution_status, row_count,
             duration_ms, warnings, created_at FROM query_history
      WHERE user_id = :user_id ORDER BY created_at DESC LIMIT :limit
    """), {"user_id": user_id, "limit": min(max(limit, 1), 100)}).mappings().all()
    return {"items": [dict(row) for row in rows]}


@router.post("/queries/{query_id}/verified-example", status_code=status.HTTP_201_CREATED)
async def save_query_as_verified(query_id: int, user_id: UserId, db: Db):
    enabled()
    row = db.execute(text("""SELECT connection_id, question, generated_sql FROM query_history
      WHERE id = :id AND user_id = :user_id AND execution_status = 'success'"""),
      {"id": query_id, "user_id": user_id}).mappings().first()
    if not row: raise NotFoundError("Successful query history item was not found")
    owned_connection(db, row["connection_id"], user_id)
    saved = await save_golden_record(VerifiedExampleRequest(question=row["question"], sql=row["generated_sql"],
                                      connection_key=row["connection_id"], source="approved_execution"), db)
    return {"id": saved.id, "status": "saved", "message": "Verified example saved."}


@router.get("/queries/{query_id}")
def get_query(query_id: int, user_id: UserId, db: Db):
    enabled()
    row = db.execute(text("""
      SELECT id, connection_id, question, generated_sql AS sql, execution_status, row_count,
             duration_ms, warnings, created_at FROM query_history WHERE id = :id AND user_id = :user_id
    """), {"id": query_id, "user_id": user_id}).mappings().first()
    if not row: raise NotFoundError("Query history item was not found")
    return dict(row)
