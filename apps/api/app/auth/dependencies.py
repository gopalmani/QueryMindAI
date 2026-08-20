import base64
import hashlib
import hmac
import json
import time
import uuid
from typing import Annotated

from fastapi import Header

from app.core.config import settings
from app.core.exceptions import AuthenticationError, DependencyError


def _key() -> bytes:
    if not settings.AUTH_SIGNING_KEY:
        raise DependencyError("AUTH_SIGNING_KEY is required for saved connection sessions")
    return settings.AUTH_SIGNING_KEY.encode()


def issue_session() -> tuple[str, str, int]:
    user_id = f"usr_{uuid.uuid4().hex}"
    expires_at = int(time.time()) + settings.AUTH_SESSION_TTL_SECONDS
    body = base64.urlsafe_b64encode(json.dumps({"sub": user_id, "exp": expires_at}, separators=(",", ":")).encode()).decode().rstrip("=")
    signature = base64.urlsafe_b64encode(hmac.new(_key(), body.encode(), hashlib.sha256).digest()).decode().rstrip("=")
    return f"{body}.{signature}", user_id, expires_at


def get_current_user_id(authorization: Annotated[str | None, Header(max_length=4096)] = None) -> str:
    if not authorization or not authorization.startswith("Bearer "):
        raise AuthenticationError("A signed workspace session is required")
    try:
        body, supplied = authorization[7:].split(".", 1)
        expected = base64.urlsafe_b64encode(hmac.new(_key(), body.encode(), hashlib.sha256).digest()).decode().rstrip("=")
        if not hmac.compare_digest(supplied, expected):
            raise ValueError
        payload = json.loads(base64.urlsafe_b64decode(body + "=" * (-len(body) % 4)))
        if int(payload["exp"]) <= int(time.time()) or not str(payload["sub"]).startswith("usr_"):
            raise ValueError
        return str(payload["sub"])
    except (ValueError, KeyError, json.JSONDecodeError) as exc:
        raise AuthenticationError("The workspace session is invalid or expired") from exc
