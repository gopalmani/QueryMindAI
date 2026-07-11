from unittest.mock import AsyncMock, patch

from app.core.exceptions import ProviderError, UnsafeSQLError


def test_question_validation(client):
    response = client.post("/api/v1/query", json={"question": "   "})
    assert response.status_code == 422


def test_external_connections_disabled(client):
    response = client.post("/api/v1/connect-and-query", json={"question": "count rows", "db_config": {
        "host": "example.test", "port": 5432, "database": "demo", "user": "reader", "password": "secret"
    }})
    assert response.status_code == 403


def test_provider_error_status(client):
    with patch("app.api.v1.endpoints.query.execute_query", new=AsyncMock(side_effect=ProviderError("provider unavailable"))):
        response = client.post("/api/v1/query", json={"question": "Show orders"})
    assert response.status_code == 502


def test_unsafe_sql_status(client):
    with patch("app.api.v1.endpoints.query.execute_query", new=AsyncMock(side_effect=UnsafeSQLError("rejected"))):
        response = client.post("/api/v1/query", json={"question": "Show orders"})
    assert response.status_code == 422
