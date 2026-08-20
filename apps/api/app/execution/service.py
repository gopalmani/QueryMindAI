import time

from sqlalchemy import text
from sqlalchemy.orm import Session

from app.audit.service import record_audit
from app.catalog.service import qualified_tables
from app.connections.security import decrypt_config
from app.connections.service import external_engine, latest_snapshot, owned_connection
from app.core.config import settings
from app.core.exceptions import DependencyError
from app.query_planner.service import owned_draft
from app.services.validation_service import validate_sql


def execute_draft(db: Session, user_id: str, draft_id: str) -> dict:
    draft = owned_draft(db, draft_id, user_id)
    saved = owned_connection(db, draft.connection_id, user_id)
    snapshot = latest_snapshot(db, saved.id)
    safe_sql = validate_sql(draft.sql, max_rows=settings.DATABASE_MAX_RESULT_ROWS,
                            allowed_tables=qualified_tables(snapshot.normalized_metadata),
                            max_sql_length=settings.DATABASE_MAX_SQL_LENGTH)
    config = decrypt_config(saved.encrypted_connection_data)
    engine = external_engine(config)
    started = time.perf_counter()
    try:
        with engine.connect() as conn:
            transaction = conn.begin()
            try:
                conn.execute(text("SET TRANSACTION READ ONLY"))
                conn.execute(text("SELECT set_config('statement_timeout', :timeout, true)"),
                             {"timeout": f"{settings.DATABASE_STATEMENT_TIMEOUT_MS}ms"})
                # Safety invariant: safe_sql was revalidated immediately before this call.
                result = conn.execute(text(safe_sql))
                columns = list(result.keys())
                rows = [dict(row._mapping) for row in result.fetchmany(settings.DATABASE_MAX_RESULT_ROWS)]
            finally:
                transaction.rollback()
    except Exception as exc:
        raise DependencyError("The customer database query failed or timed out") from exc
    finally:
        engine.dispose()
    duration = round((time.perf_counter() - started) * 1000)
    history = db.execute(text("""
      INSERT INTO query_history
        (connection_key, connection_id, user_id, question, generated_sql, execution_status,
         row_count, duration_ms, warnings, status, verified_example_used)
      VALUES (:key, :connection_id, :user_id, :question, :sql, 'success', :rows, :duration,
              CAST(:warnings AS jsonb), 'success', false)
      RETURNING id
    """), {"key": saved.id, "connection_id": saved.id, "user_id": user_id, "question": draft.question,
           "sql": safe_sql, "rows": len(rows), "duration": duration, "warnings": "[]"}).scalar_one()
    record_audit(db, user_id, "query_executed", saved.id, {"query_id": history, "row_count": len(rows), "duration_ms": duration})
    db.commit()
    return {"query_id": history, "sql": safe_sql, "columns": columns, "rows": rows,
            "row_count": len(rows), "duration_ms": duration, "warnings": draft.warnings or []}
