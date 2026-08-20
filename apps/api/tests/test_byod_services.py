from types import SimpleNamespace
from unittest.mock import AsyncMock, patch

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import Session

from app.catalog.service import introspect_postgresql, qualified_tables, schema_hash
from app.connections.service import masked, owned_connection
from app.core.config import settings
from app.core.exceptions import NotFoundError, UnsafeSQLError
from app.db.base import Base
from app.models.byod import DatabaseConnection, SchemaSnapshot
from app.query_planner.service import generate_draft
from app.schemas.llm_schema import SQLGeneration
from app.services.validation_service import validate_sql


METADATA = {"database_type":"postgresql","schemas":[{"name":"public","objects":[
    {"name":"orders","type":"table","columns":[{"name":"id","type":"INTEGER","nullable":False}],
     "primary_key":["id"],"foreign_keys":[],"indexes":[]}
]}]}


@pytest.fixture
def byod_db():
    engine=create_engine("sqlite+pysqlite:///:memory:"); Base.metadata.create_all(engine)
    with Session(engine) as session: yield session


def add_connection(db, user="usr_owner"):
    value=DatabaseConnection(user_id=user,name="Analytics",encrypted_connection_data="ciphertext",masked_host="db.example.com",
      database_name="analytics",username="reader",ssl_mode="require",status="connected")
    db.add(value);db.flush();return value


def test_masked_output_never_contains_encrypted_credentials(byod_db):
    value=add_connection(byod_db); output=masked(value)
    assert "encrypted_connection_data" not in output and "password" not in output and "ciphertext" not in str(output)


def test_ownership_enforced(byod_db):
    value=add_connection(byod_db)
    assert owned_connection(byod_db,value.id,"usr_owner") is value
    with pytest.raises(NotFoundError): owned_connection(byod_db,value.id,"usr_attacker")


def test_schema_hash_is_stable_and_tables_normalized():
    assert schema_hash(METADATA)==schema_hash({"schemas":METADATA["schemas"],"database_type":"postgresql"})
    assert qualified_tables(METADATA)=={"orders","public.orders"}


def test_schema_introspection_normalization():
    inspector=SimpleNamespace(
      get_schema_names=lambda:["public","pg_catalog"], get_table_names=lambda schema:["orders"],
      get_view_names=lambda schema:[], get_columns=lambda name,schema:[{"name":"id","type":"INTEGER","nullable":False}],
      get_pk_constraint=lambda name,schema:{"constrained_columns":["id"]}, get_foreign_keys=lambda name,schema:[],
      get_indexes=lambda name,schema:[{"name":"ix_orders_id","column_names":["id"],"unique":True}])
    with patch("app.catalog.service.inspect",return_value=inspector): metadata=introspect_postgresql(object())
    assert metadata["schemas"][0]["objects"][0]["primary_key"]==["id"]


def test_allowed_table_validation():
    assert "LIMIT" in validate_sql("SELECT * FROM public.orders",allowed_tables={"orders","public.orders"})
    with pytest.raises(UnsafeSQLError): validate_sql("SELECT * FROM secrets",allowed_tables={"orders","public.orders"})


@pytest.mark.asyncio
async def test_generation_creates_draft_without_database_execution(byod_db, monkeypatch):
    monkeypatch.setattr(settings,"DATABASE_MAX_RESULT_ROWS",50)
    connection=add_connection(byod_db); snapshot=SchemaSnapshot(connection_id=connection.id,normalized_metadata=METADATA,schema_hash=schema_hash(METADATA));byod_db.add(snapshot);byod_db.commit()
    generated=SQLGeneration(sql="SELECT id FROM orders",explanation="Reads orders",tables_used=["orders"],assumptions=[],confidence=.9)
    with patch("app.query_planner.service.generate_sql",new=AsyncMock(return_value=generated)), \
         patch("app.connections.service.external_engine") as external:
        draft=await generate_draft(byod_db,"usr_owner",connection.id,"Show orders")
    assert draft.sql.endswith("LIMIT 50") and external.call_count==0
