import logging

from sqlalchemy import text
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.embedding_provider import as_pgvector, embed_text
from app.services.schema_introspect_service import get_dynamic_schema

logger = logging.getLogger(__name__)


async def get_relevant_schema(question: str, db: Session, connection_key: str | None = None, top_k: int = 6) -> str:
    fallback = get_dynamic_schema(db)
    if not settings.ENABLE_SCHEMA_RAG:
        return fallback
    try:
        vector = as_pgvector(await embed_text(question))
        rows = db.execute(text("""
            SELECT schema_ddl FROM schema_embeddings
            WHERE connection_key = :key
            ORDER BY embedding <=> CAST(:vector AS vector)
            LIMIT :limit
        """), {"key": connection_key or settings.DEFAULT_CONNECTION_KEY, "vector": vector, "limit": top_k})
        schemas = [row[0] for row in rows]
        return "\n".join(schemas) if schemas else fallback
    except Exception:
        db.rollback()
        logger.warning("Schema RAG unavailable; using live introspection", extra={"stage": "schema_retrieval"})
        return fallback
