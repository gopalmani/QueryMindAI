from fastapi import APIRouter, Depends, status
from sqlalchemy import inspect, text
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.exceptions import FeatureDisabledError
from app.db.dynamic_session import get_dynamic_session
from app.db.session import get_db
from app.schemas.query_schema import (ConnectQueryRequest, QueryRequest, QueryResponse,
                                      VerifiedExampleRequest, VerifiedExampleResponse)
from app.services.golden_record_service import save_golden_record
from app.services.query_service import execute_query
from app.services.schema_introspect_service import get_dynamic_schema

router = APIRouter()


@router.post("/query", response_model=QueryResponse)
async def query_db(request: QueryRequest, db: Session = Depends(get_db)):
    return await execute_query(db, request.question)


@router.get("/schema")
def schema(db: Session = Depends(get_db)):
    inspector = inspect(db.bind)
    tables = []
    for name in inspector.get_table_names(schema="public"):
        if name in {"alembic_version", "golden_records", "schema_embeddings", "query_history"}:
            continue
        tables.append({"name": name, "columns": [
            {"name": col["name"], "type": str(col["type"]), "nullable": col["nullable"]}
            for col in inspector.get_columns(name, schema="public")
        ]})
    return {"connection_key": settings.DEFAULT_CONNECTION_KEY, "tables": tables, "source": "real_api_data"}


@router.get("/query-history")
def query_history(limit: int = 20, db: Session = Depends(get_db)):
    rows = db.execute(text("""
        SELECT id, question, generated_sql AS sql, row_count, duration_ms, status, created_at
        FROM query_history ORDER BY created_at DESC LIMIT :limit
    """), {"limit": min(max(limit, 1), 100)}).mappings().all()
    return {"items": [dict(row) for row in rows], "source": "real_api_data"}


@router.post("/connect-and-query", response_model=QueryResponse)
async def connect_and_query(request: ConnectQueryRequest):
    if not settings.ENABLE_EXTERNAL_CONNECTIONS:
        raise FeatureDisabledError("External database connections are disabled")
    db = get_dynamic_session(request.db_config.model_dump())
    try:
        return await execute_query(db, request.question, schema_override=get_dynamic_schema(db))
    finally:
        db.close()


@router.post("/verified-examples", response_model=VerifiedExampleResponse, status_code=status.HTTP_201_CREATED)
async def add_verified_example(request: VerifiedExampleRequest, db: Session = Depends(get_db)):
    row = await save_golden_record(request, db)
    return {"id": row.id, "created_at": row.created_at, "status": "saved",
            "message": "Verified example saved for semantic retrieval."}


@router.post("/golden-record", response_model=VerifiedExampleResponse, status_code=status.HTTP_201_CREATED, deprecated=True)
async def legacy_golden_record(request: VerifiedExampleRequest, db: Session = Depends(get_db)):
    return await add_verified_example(request, db)
