from datetime import datetime, timedelta, timezone

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.audit.service import record_audit
from app.catalog.service import qualified_tables, schema_context
from app.connections.service import latest_snapshot, owned_connection
from app.core.config import settings
from app.core.exceptions import NotFoundError
from app.models.byod import QueryDraft
from app.services.llm_service import generate_sql
from app.services.validation_service import validate_sql


async def generate_draft(db: Session, user_id: str, connection_id: str, question: str) -> QueryDraft:
    owned_connection(db, connection_id, user_id)
    snapshot = latest_snapshot(db, connection_id)
    context = schema_context(snapshot.normalized_metadata, question, settings.SCHEMA_FULL_CONTEXT_TABLE_LIMIT,
                             settings.SCHEMA_RETRIEVAL_TABLE_LIMIT)
    generated = await generate_sql(question, context)
    safe_sql = validate_sql(generated.sql, max_rows=settings.DATABASE_MAX_RESULT_ROWS,
                            allowed_tables=qualified_tables(snapshot.normalized_metadata),
                            max_sql_length=settings.DATABASE_MAX_SQL_LENGTH)
    draft = QueryDraft(user_id=user_id, connection_id=connection_id, question=question.strip(), sql=safe_sql,
        explanation=generated.explanation, assumptions=generated.assumptions, warnings=[],
        confidence=str(generated.confidence), schema_hash=snapshot.schema_hash,
        expires_at=datetime.now(timezone.utc) + timedelta(seconds=settings.QUERY_DRAFT_TTL_SECONDS))
    db.add(draft); db.flush()
    record_audit(db, user_id, "query_generated", connection_id, {"draft_id": draft.id})
    db.commit(); db.refresh(draft)
    return draft


def owned_draft(db: Session, draft_id: str, user_id: str) -> QueryDraft:
    draft = db.scalar(select(QueryDraft).where(QueryDraft.id == draft_id, QueryDraft.user_id == user_id))
    if not draft:
        raise NotFoundError("Query draft was not found")
    expires = draft.expires_at
    if expires.tzinfo is None:
        expires = expires.replace(tzinfo=timezone.utc)
    if expires <= datetime.now(timezone.utc):
        raise NotFoundError("Query draft has expired; generate SQL again")
    owned_connection(db, draft.connection_id, user_id)
    return draft
