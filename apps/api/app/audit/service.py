from sqlalchemy.orm import Session

from app.models.byod import AuditLog


def record_audit(db: Session, user_id: str, action: str, connection_id: str | None = None, metadata: dict | None = None):
    # Metadata must contain identifiers/status only—never credentials, URLs, SQL results, or decrypted config.
    db.add(AuditLog(user_id=user_id, connection_id=connection_id, action=action, event_metadata=metadata or {}))
