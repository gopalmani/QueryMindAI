from datetime import datetime, timezone

from sqlalchemy import create_engine, select, text
from sqlalchemy.orm import Session
from sqlalchemy.pool import NullPool

from app.audit.service import record_audit
from app.catalog.service import introspect_postgresql, schema_hash
from app.connections.security import decrypt_config, encrypt_config, sqlalchemy_url, validate_public_host
from app.core.config import settings
from app.core.exceptions import DependencyError, NotFoundError
from app.models.byod import DatabaseConnection, SchemaSnapshot


def owned_connection(db: Session, connection_id: str, user_id: str) -> DatabaseConnection:
    connection = db.scalar(select(DatabaseConnection).where(DatabaseConnection.id == connection_id,
                                                             DatabaseConnection.user_id == user_id))
    if not connection:
        raise NotFoundError("Database connection was not found")
    return connection


def masked(connection: DatabaseConnection, warnings: list[str] | None = None) -> dict:
    return {"id": connection.id, "name": connection.name, "database_type": connection.database_type,
            "host": connection.masked_host, "database": connection.database_name, "username": connection.username,
            "ssl_mode": connection.ssl_mode, "status": connection.status,
            "last_connected_at": connection.last_connected_at, "created_at": connection.created_at,
            "warnings": warnings or []}


def external_engine(config: dict):
    validate_public_host(config["host"])  # DNS rebinding defense: re-check immediately before connect.
    return create_engine(sqlalchemy_url(config), poolclass=NullPool, pool_pre_ping=True,
                         connect_args={"connect_timeout": settings.DATABASE_CONNECTION_TIMEOUT_SECONDS})


def inspect_and_check(config: dict) -> tuple[dict, bool | None, list[str]]:
    engine = external_engine(config)
    warnings = []
    try:
        with engine.connect() as conn:
            metadata = introspect_postgresql(conn)
            write_privilege = conn.execute(text("""
              SELECT EXISTS (
                SELECT 1 FROM information_schema.table_privileges
                WHERE grantee = current_user AND privilege_type IN ('INSERT','UPDATE','DELETE','TRUNCATE','TRIGGER','REFERENCES')
              )
            """)).scalar()
            default_read_only = str(conn.execute(text("SHOW default_transaction_read_only")).scalar()).lower() == "on"
            if write_privilege:
                read_only = False
                warnings.append("The database role appears to have write privileges; use a dedicated read-only role.")
            elif default_read_only:
                read_only = True
            else:
                read_only = None
                warnings.append("No direct table write grants were found, but read-only status could not be conclusively verified.")
            if not metadata["schemas"]:
                warnings.append("No accessible application schemas were found.")
            return metadata, read_only, warnings
    finally:
        engine.dispose()


def save_snapshot(db: Session, connection_id: str, metadata: dict) -> SchemaSnapshot:
    digest = schema_hash(metadata)
    existing = db.scalar(select(SchemaSnapshot).where(SchemaSnapshot.connection_id == connection_id,
                                                       SchemaSnapshot.schema_hash == digest))
    if existing:
        return existing
    snapshot = SchemaSnapshot(connection_id=connection_id, normalized_metadata=metadata, schema_hash=digest)
    db.add(snapshot); db.flush()
    return snapshot


def latest_snapshot(db: Session, connection_id: str) -> SchemaSnapshot:
    snapshot = db.scalar(select(SchemaSnapshot).where(SchemaSnapshot.connection_id == connection_id)
                         .order_by(SchemaSnapshot.created_at.desc()))
    if not snapshot:
        raise NotFoundError("No schema snapshot is available; refresh the schema first")
    return snapshot


def create_saved_connection(db: Session, user_id: str, name: str, config: dict) -> tuple[DatabaseConnection, list[str]]:
    validate_public_host(config["host"])
    metadata, _, warnings = inspect_and_check(config)
    connection = DatabaseConnection(user_id=user_id, name=name, encrypted_connection_data=encrypt_config(config),
        masked_host=config["host"], database_name=config["database"], username=config["username"],
        ssl_mode=config["ssl_mode"], status="connected", last_connected_at=datetime.now(timezone.utc))
    db.add(connection); db.flush()
    save_snapshot(db, connection.id, metadata)
    record_audit(db, user_id, "connection_created", connection.id, {"database_type": "postgresql"})
    record_audit(db, user_id, "connection_tested", connection.id, {"status": "connected"})
    db.commit(); db.refresh(connection)
    return connection, warnings


def refresh_owned_schema(db: Session, connection: DatabaseConnection, user_id: str) -> SchemaSnapshot:
    config = decrypt_config(connection.encrypted_connection_data)
    metadata, _, _ = inspect_and_check(config)
    snapshot = save_snapshot(db, connection.id, metadata)
    connection.status = "connected"; connection.last_connected_at = datetime.now(timezone.utc)
    record_audit(db, user_id, "schema_refreshed", connection.id, {"schema_hash": snapshot.schema_hash})
    db.commit(); db.refresh(snapshot)
    return snapshot
