import uuid
from datetime import datetime, timezone

from sqlalchemy import JSON, DateTime, ForeignKey, Integer, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


def new_id(prefix: str) -> str:
    return f"{prefix}_{uuid.uuid4().hex}"


def now() -> datetime:
    return datetime.now(timezone.utc)


class DatabaseConnection(Base):
    __tablename__ = "database_connections"
    id: Mapped[str] = mapped_column(String(64), primary_key=True, default=lambda: new_id("conn"))
    user_id: Mapped[str] = mapped_column(String(128), index=True)
    name: Mapped[str] = mapped_column(String(128))
    database_type: Mapped[str] = mapped_column(String(32), default="postgresql")
    encrypted_connection_data: Mapped[str] = mapped_column(Text)
    masked_host: Mapped[str] = mapped_column(String(255))
    database_name: Mapped[str] = mapped_column(String(128))
    username: Mapped[str] = mapped_column(String(128))
    ssl_mode: Mapped[str] = mapped_column(String(32))
    status: Mapped[str] = mapped_column(String(32), default="pending")
    last_connected_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now, onupdate=now)


class SchemaSnapshot(Base):
    __tablename__ = "schema_snapshots"
    __table_args__ = (UniqueConstraint("connection_id", "schema_hash", name="uq_connection_schema_hash"),)
    id: Mapped[str] = mapped_column(String(64), primary_key=True, default=lambda: new_id("schema"))
    connection_id: Mapped[str] = mapped_column(ForeignKey("database_connections.id", ondelete="CASCADE"), index=True)
    schema_name: Mapped[str] = mapped_column(String(128), default="all")
    normalized_metadata: Mapped[dict] = mapped_column(JSON)
    schema_hash: Mapped[str] = mapped_column(String(64))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now, onupdate=now)


class QueryDraft(Base):
    __tablename__ = "query_drafts"
    id: Mapped[str] = mapped_column(String(64), primary_key=True, default=lambda: new_id("draft"))
    user_id: Mapped[str] = mapped_column(String(128), index=True)
    connection_id: Mapped[str] = mapped_column(ForeignKey("database_connections.id", ondelete="CASCADE"), index=True)
    question: Mapped[str] = mapped_column(Text)
    sql: Mapped[str] = mapped_column(Text)
    explanation: Mapped[str] = mapped_column(Text)
    assumptions: Mapped[list] = mapped_column(JSON, default=list)
    warnings: Mapped[list] = mapped_column(JSON, default=list)
    confidence: Mapped[str] = mapped_column(String(16))
    schema_hash: Mapped[str] = mapped_column(String(64))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))


class AuditLog(Base):
    __tablename__ = "audit_logs"
    id: Mapped[str] = mapped_column(String(64), primary_key=True, default=lambda: new_id("audit"))
    user_id: Mapped[str] = mapped_column(String(128), index=True)
    connection_id: Mapped[str | None] = mapped_column(String(64), index=True)
    action: Mapped[str] = mapped_column(String(64), index=True)
    event_metadata: Mapped[dict] = mapped_column("metadata", JSON, default=dict)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now)
