def test_question_validation(client):
    response = client.post("/api/v1/query", json={"question": "   "})
    assert response.status_code == 422


def test_external_connections_disabled(client):
    response = client.post("/api/v1/connect-and-query", json={"question": "count rows", "db_config": {
        "host": "example.test", "port": 5432, "database": "demo", "user": "reader", "password": "secret"
    }})
    assert response.status_code == 404


def test_legacy_combined_query_is_disabled(client):
    response = client.post("/api/v1/query", json={"question": "Show orders"})
    assert response.status_code == 403
