from app.schemas.query_schema import VerifiedExampleRequest


def test_verified_example_request_is_typed():
    value = VerifiedExampleRequest(question="Top customers", sql="SELECT 1", reviewer="maintainer")
    assert value.connection_key == "demo_ecom_db"


def test_duplicate_identity_is_connection_question_and_sql():
    first = VerifiedExampleRequest(question="Top customers", sql="SELECT 1")
    second = VerifiedExampleRequest(question="Top customers", sql="SELECT 1")
    assert first.model_dump() == second.model_dump()
