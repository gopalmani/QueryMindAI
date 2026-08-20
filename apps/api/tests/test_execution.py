from datetime import datetime, timedelta, timezone
from types import SimpleNamespace
from unittest.mock import patch

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.exceptions import DependencyError, NotFoundError
from app.execution.service import execute_draft
from app.db.base import Base
from app.models.byod import QueryDraft, SchemaSnapshot
from app.query_planner.service import owned_draft
from test_byod_services import METADATA, add_connection, schema_hash


@pytest.fixture
def byod_db():
    engine=create_engine("sqlite+pysqlite:///:memory:"); Base.metadata.create_all(engine)
    with Session(engine) as session: yield session


def add_draft(db, connection, user="usr_owner"):
    draft=QueryDraft(user_id=user,connection_id=connection.id,question="Show orders",sql="SELECT id FROM orders LIMIT 500",
      explanation="Reads orders",assumptions=[],warnings=[],confidence="0.9",schema_hash=schema_hash(METADATA),
      expires_at=datetime.now(timezone.utc)+timedelta(minutes=5))
    db.add(draft);db.add(SchemaSnapshot(connection_id=connection.id,normalized_metadata=METADATA,schema_hash=schema_hash(METADATA)));db.commit();return draft


def test_execution_requires_owned_valid_draft(byod_db):
    connection=add_connection(byod_db);draft=add_draft(byod_db,connection)
    with pytest.raises(NotFoundError): owned_draft(byod_db,draft.id,"usr_attacker")


def test_execution_timeout_is_safely_wrapped(byod_db):
    connection=add_connection(byod_db);draft=add_draft(byod_db,connection)
    class Engine:
        def connect(self): raise TimeoutError("connect timeout")
        def dispose(self): pass
    with patch("app.execution.service.decrypt_config",return_value={}),patch("app.execution.service.external_engine",return_value=Engine()),pytest.raises(DependencyError,match="failed or timed out"):
        execute_draft(byod_db,"usr_owner",draft.id)


def test_execution_revalidates_and_caps_rows(byod_db,monkeypatch):
    monkeypatch.setattr(settings,"DATABASE_MAX_RESULT_ROWS",2)
    connection=add_connection(byod_db);draft=add_draft(byod_db,connection)
    class Result:
        def keys(self): return ["id"]
        def fetchmany(self,size): assert size==2; return [SimpleNamespace(_mapping={"id":1}),SimpleNamespace(_mapping={"id":2})]
    class Tx:
        def rollback(self): pass
    class Conn:
        def __enter__(self): return self
        def __exit__(self,*args): pass
        def begin(self): return Tx()
        def execute(self,statement,params=None):
            if str(statement).startswith("SELECT id"): return Result()
            return SimpleNamespace()
    class Engine:
        def connect(self): return Conn()
        def dispose(self): pass
    original=byod_db.execute
    def execute(statement,params=None,*args,**kwargs):
        if "INSERT INTO query_history" in str(statement): return SimpleNamespace(scalar_one=lambda:7)
        return original(statement,params,*args,**kwargs)
    byod_db.execute=execute
    with patch("app.execution.service.decrypt_config",return_value={}),patch("app.execution.service.external_engine",return_value=Engine()):
        output=execute_draft(byod_db,"usr_owner",draft.id)
    assert output["row_count"]==2 and output["sql"].endswith("LIMIT 2")
