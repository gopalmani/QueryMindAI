import pytest

from app.auth.dependencies import get_current_user_id, issue_session
from app.core.config import settings
from app.core.exceptions import AuthenticationError


def test_signed_session_subject_cannot_be_forged(monkeypatch):
    monkeypatch.setattr(settings,"AUTH_SIGNING_KEY","test-signing-key-not-for-production")
    token,user_id,_=issue_session()
    assert get_current_user_id(f"Bearer {token}")==user_id
    with pytest.raises(AuthenticationError): get_current_user_id(f"Bearer {token}tampered")
