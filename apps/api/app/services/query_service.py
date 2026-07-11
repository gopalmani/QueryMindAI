import logging
import time

from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.exceptions import DependencyError, ProviderError, UnsafeSQLError
from app.core.logger import request_id_context
from app.services.golden_record_service import get_golden_record
from app.services.llm_service import generate_sql
from app.services.schema_service import get_relevant_schema
from app.services.validation_service import validate_sql

logger = logging.getLogger(__name__)


async def execute_query(db: Session, question: str, schema_override: str | None = None) -> dict:
    started = time.perf_counter()
    schema = schema_override or await get_relevant_schema(question, db)
    if not schema:
        raise DependencyError("No database schema is available")
    example = await get_golden_record(question, db)
    last_error: Exception | None = None

    for attempt in range(1, settings.QUERY_MAX_ATTEMPTS + 1):
        try:
            generated = await generate_sql(
                question, schema, temperature=0.0,
                error_message=str(last_error)[:200] if last_error else None,
                golden_record=example,
            )
            safe_sql = validate_sql(generated.sql)
            # Defense in depth: validation always precedes this execution.
            db.rollback()  # End schema/retrieval reads before opening the protected query transaction.
            db.execute(text("SET LOCAL TRANSACTION READ ONLY"))
            db.execute(text("SELECT set_config('statement_timeout', :timeout, true)"),
                       {"timeout": str(settings.STATEMENT_TIMEOUT_MS)})
            result = db.execute(text(safe_sql))
            columns = list(result.keys())
            rows = [dict(row._mapping) for row in result.fetchall()]
            db.commit()
            duration = round((time.perf_counter() - started) * 1000)
            response = {
                "sql": safe_sql, "columns": columns, "rows": rows, "row_count": len(rows),
                "explanation": generated.explanation,
                "warnings": list(generated.assumptions),
                "metadata": {"attempts": attempt, "duration_ms": duration,
                             "verified_example_used": example is not None,
                             "request_id": request_id_context.get()},
            }
            try:
                db.execute(text("""
                    INSERT INTO query_history (connection_key, question, generated_sql, row_count,
                      duration_ms, verified_example_used, status)
                    VALUES (:key, :question, :sql, :rows, :duration, :verified, 'success')
                """), {"key": settings.DEFAULT_CONNECTION_KEY, "question": question, "sql": safe_sql,
                       "rows": len(rows), "duration": duration, "verified": example is not None})
                db.commit()
            except SQLAlchemyError:
                db.rollback()
                response["warnings"].append("Query history could not be recorded")
            return response
        except ProviderError:
            raise
        except UnsafeSQLError as exc:
            db.rollback()
            logger.warning("Generated SQL rejected", extra={"stage": "validation", "attempt": attempt})
            raise exc
        except SQLAlchemyError as exc:
            db.rollback()
            last_error = exc
            logger.warning("Query execution failed", extra={"stage": "execution", "attempt": attempt})

    if isinstance(last_error, UnsafeSQLError):
        raise last_error
    raise DependencyError("The query could not be executed safely")
