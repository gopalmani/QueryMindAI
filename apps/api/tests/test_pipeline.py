from types import SimpleNamespace
from unittest.mock import AsyncMock, patch

import pytest
from sqlalchemy.exc import SQLAlchemyError

from app.core.config import settings
from app.schemas.llm_schema import SQLGeneration
from app.services.query_service import execute_query


class FakeResult:
    def keys(self): return ["count"]
    def fetchall(self): return [SimpleNamespace(_mapping={"count": 2})]


class FakeDB:
    def __init__(self): self.query_calls = 0
    def execute(self, statement, params=None):
        sql = str(statement)
        if "set_config" in sql: return FakeResult()
        if sql.startswith("SELECT"):
            self.query_calls += 1
            if self.query_calls == 1: raise SQLAlchemyError("missing column")
            return FakeResult()
        return FakeResult()
    def rollback(self): pass
    def commit(self): pass


@pytest.mark.asyncio
async def test_pipeline_retries_execution_failure():
    db = FakeDB()
    generated = AsyncMock(side_effect=[
        SQLGeneration(sql="SELECT missing FROM users", explanation="first", tables_used=["users"], assumptions=[], confidence=0.5),
        SQLGeneration(sql="SELECT COUNT(*) AS count FROM users", explanation="fixed", tables_used=["users"], assumptions=[], confidence=0.9),
    ])
    with patch("app.services.query_service.get_golden_record", new=AsyncMock(return_value=None)), \
         patch("app.services.query_service.generate_sql", new=generated):
        result = await execute_query(db, "How many?", schema_override="CREATE TABLE users (id int);")
    assert result["metadata"]["attempts"] == 2
    assert result["row_count"] == 1


@pytest.mark.asyncio
async def test_pipeline_does_not_retry_unsafe_sql():
    generated = AsyncMock(return_value=SQLGeneration(
        sql="DELETE FROM users", explanation="unsafe", tables_used=["users"], assumptions=[], confidence=0.5
    ))
    with patch("app.services.query_service.get_golden_record", new=AsyncMock(return_value=None)), \
         patch("app.services.query_service.generate_sql", new=generated), \
         pytest.raises(Exception) as raised:
        await execute_query(FakeDB(), "Delete users", schema_override="CREATE TABLE users (id int);")
    assert raised.value.__class__.__name__ == "UnsafeSQLError"
    generated.assert_awaited_once()
