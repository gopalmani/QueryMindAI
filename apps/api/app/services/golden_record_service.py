import logging

from sqlalchemy import text
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.exceptions import DependencyError
from app.core.embedding_provider import as_pgvector, embed_text
from app.schemas.query_schema import VerifiedExampleRequest
from app.services.validation_service import validate_sql

logger = logging.getLogger(__name__)


async def _embedding(value: str) -> str:
    return as_pgvector(await embed_text(value))


async def get_golden_record(question: str, db: Session, connection_key: str | None = None) -> dict | None:
    if not settings.ENABLE_GOLDEN_RECORDS:
        return None
    try:
        vector = await _embedding(question)
        row = db.execute(text("""
            SELECT question, sql_query, 1 - (embedding <=> CAST(:vector AS vector)) AS similarity
            FROM golden_records WHERE connection_key = :key
            ORDER BY embedding <=> CAST(:vector AS vector) LIMIT 1
        """), {"key": connection_key or settings.DEFAULT_CONNECTION_KEY, "vector": vector}).fetchone()
        if row and float(row.similarity) >= settings.GOLDEN_RECORD_SIMILARITY_THRESHOLD:
            return {"question": row.question, "sql": row.sql_query, "similarity": float(row.similarity)}
    except Exception:
        db.rollback()
        logger.warning("Verified-example retrieval unavailable", extra={"stage": "verified_example_retrieval"})
    return None


async def save_golden_record(request: VerifiedExampleRequest, db: Session):
    if not settings.ENABLE_GOLDEN_RECORDS:
        raise DependencyError("Verified examples are disabled")
    safe_sql = validate_sql(request.sql)
    try:
        vector = await _embedding(request.question)
        row = db.execute(text("""
            INSERT INTO golden_records
              (connection_key, question, sql_query, embedding, reviewer, source)
            VALUES (:key, :question, :sql, CAST(:vector AS vector), :reviewer, :source)
            ON CONFLICT (connection_key, question, sql_query) DO UPDATE
              SET reviewer = COALESCE(EXCLUDED.reviewer, golden_records.reviewer),
                  source = COALESCE(EXCLUDED.source, golden_records.source), updated_at = NOW()
            RETURNING id, created_at
        """), {"key": request.connection_key, "question": request.question.strip(), "sql": safe_sql,
                 "vector": vector, "reviewer": request.reviewer, "source": request.source}).fetchone()
        db.commit()
        return row
    except Exception as exc:
        db.rollback()
        raise DependencyError("Could not save the verified example") from exc
