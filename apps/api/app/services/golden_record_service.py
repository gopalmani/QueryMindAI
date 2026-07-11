import logging
import json
import math

from sqlalchemy import text
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.exceptions import DependencyError
from app.core.embedding_provider import embed_text
from app.schemas.query_schema import VerifiedExampleRequest
from app.services.validation_service import validate_sql

logger = logging.getLogger(__name__)


async def _embedding(value: str) -> str:
    return await embed_text(value)


async def get_golden_record(question: str, db: Session, connection_key: str | None = None) -> dict | None:
    if not settings.ENABLE_GOLDEN_RECORDS:
        return None
    try:
        vector = await _embedding(question)
        rows = db.execute(text("SELECT question, sql_query, embedding FROM golden_records WHERE connection_key = :key AND embedding IS NOT NULL"),
                          {"key": connection_key or settings.DEFAULT_CONNECTION_KEY}).fetchall()
        def cosine(other):
            dot=sum(a*b for a,b in zip(vector,other)); denom=math.sqrt(sum(a*a for a in vector))*math.sqrt(sum(b*b for b in other)); return dot/denom if denom else 0
        best = max(((cosine(row.embedding), row) for row in rows), default=None, key=lambda item:item[0])
        if best and best[0] >= settings.GOLDEN_RECORD_SIMILARITY_THRESHOLD:
            return {"question": best[1].question, "sql": best[1].sql_query, "similarity": best[0]}
    except Exception:
        db.rollback()
        logger.warning("Verified-example retrieval unavailable", extra={"stage": "verified_example_retrieval"})
    return None


async def save_golden_record(request: VerifiedExampleRequest, db: Session):
    safe_sql = validate_sql(request.sql)
    try:
        vector = await _embedding(request.question) if settings.ENABLE_GOLDEN_RECORDS else None
        row = db.execute(text("""
            INSERT INTO golden_records
              (connection_key, question, sql_query, embedding, reviewer, source)
            VALUES (:key, :question, :sql, CAST(:vector AS jsonb), :reviewer, :source)
            ON CONFLICT (connection_key, question, sql_query) DO UPDATE
              SET reviewer = COALESCE(EXCLUDED.reviewer, golden_records.reviewer),
                  source = COALESCE(EXCLUDED.source, golden_records.source), updated_at = NOW()
            RETURNING id, created_at
        """), {"key": request.connection_key, "question": request.question.strip(), "sql": safe_sql,
                 "vector": json.dumps(vector) if vector is not None else None, "reviewer": request.reviewer, "source": request.source}).fetchone()
        db.commit()
        return row
    except Exception as exc:
        db.rollback()
        raise DependencyError("Could not save the verified example") from exc
