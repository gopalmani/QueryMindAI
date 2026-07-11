"""Initial application and demo schema."""
from alembic import op

revision = "0001_initial"
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    op.execute("CREATE EXTENSION IF NOT EXISTS vector")
    op.execute("""
      CREATE TABLE golden_records (
        id BIGSERIAL PRIMARY KEY, connection_key VARCHAR(128) NOT NULL,
        question TEXT NOT NULL, sql_query TEXT NOT NULL, embedding vector,
        reviewer VARCHAR(128), source VARCHAR(128), created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CONSTRAINT uq_verified_example UNIQUE (connection_key, question, sql_query)
      );
      CREATE TABLE schema_embeddings (
        id BIGSERIAL PRIMARY KEY, connection_key VARCHAR(128) NOT NULL,
        table_name VARCHAR(128) NOT NULL, schema_ddl TEXT NOT NULL, embedding vector,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CONSTRAINT uq_schema_embedding UNIQUE (connection_key, table_name)
      );
      CREATE TABLE query_history (
        id BIGSERIAL PRIMARY KEY, connection_key VARCHAR(128) NOT NULL,
        question TEXT NOT NULL, generated_sql TEXT NOT NULL, row_count INTEGER NOT NULL DEFAULT 0,
        duration_ms INTEGER NOT NULL DEFAULT 0, verified_example_used BOOLEAN NOT NULL DEFAULT FALSE,
        status VARCHAR(32) NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    """)


def downgrade():
    op.execute("DROP TABLE IF EXISTS query_history, schema_embeddings, golden_records")
