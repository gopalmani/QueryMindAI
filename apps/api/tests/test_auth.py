import pytest
from cryptography.fernet import Fernet

from app.auth.dependencies import get_current_user_id, issue_session
from app.core.config import settings
from app.core.exceptions import AuthenticationError, DependencyError


def test_signed_session_subject_cannot_be_forged(monkeypatch):
    monkeypatch.setattr(settings, "CONNECTION_ENCRYPTION_KEY", Fernet.generate_key().decode())
    token,user_id,_=issue_session()
    assert get_current_user_id(f"Bearer {token}")==user_id
    with pytest.raises(AuthenticationError): get_current_user_id(f"Bearer {token}tampered")


def test_session_requires_connection_encryption_key(monkeypatch):
    monkeypatch.setattr(settings, "CONNECTION_ENCRYPTION_KEY", None)
    with pytest.raises(DependencyError, match="CONNECTION_ENCRYPTION_KEY"):
        issue_session()
