import logging
import math

from sqlalchemy import text
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.embedding_provider import embed_text
from app.services.schema_introspect_service import get_dynamic_schema

logger = logging.getLogger(__name__)


async def get_relevant_schema(question: str, db: Session, connection_key: str | None = None, top_k: int = 6) -> str:
    fallback = get_dynamic_schema(db)
    if not settings.ENABLE_SCHEMA_RAG:
        return fallback
    try:
        vector = await embed_text(question)
        rows = db.execute(text("SELECT schema_ddl, embedding FROM schema_embeddings WHERE connection_key = :key AND embedding IS NOT NULL"),
                          {"key": connection_key or settings.DEFAULT_CONNECTION_KEY}).fetchall()
        def cosine(other):
            dot=sum(a*b for a,b in zip(vector,other)); denom=math.sqrt(sum(a*a for a in vector))*math.sqrt(sum(b*b for b in other)); return dot/denom if denom else 0
        schemas = [row.schema_ddl for row in sorted(rows, key=lambda row: cosine(row.embedding), reverse=True)[:top_k]]
        return "\n".join(schemas) if schemas else fallback
    except Exception:
        db.rollback()
        logger.warning("Schema RAG unavailable; using live introspection", extra={"stage": "schema_retrieval"})
        return fallback
