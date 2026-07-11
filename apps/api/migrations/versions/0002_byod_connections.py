"""Saved BYOD connections, catalog snapshots, drafts, history ownership, and audit."""
from alembic import op

revision = "0002_byod_connections"
down_revision = "0001_initial"
branch_labels = None
depends_on = None


def upgrade():
    op.execute("""
      ALTER TABLE golden_records ALTER COLUMN embedding TYPE JSONB USING embedding::text::jsonb;
      ALTER TABLE schema_embeddings ALTER COLUMN embedding TYPE JSONB USING embedding::text::jsonb;
      CREATE TABLE database_connections (
        id VARCHAR(64) PRIMARY KEY, user_id VARCHAR(128) NOT NULL, name VARCHAR(128) NOT NULL,
        database_type VARCHAR(32) NOT NULL, encrypted_connection_data TEXT NOT NULL,
        masked_host VARCHAR(255) NOT NULL, database_name VARCHAR(128) NOT NULL,
        username VARCHAR(128) NOT NULL, ssl_mode VARCHAR(32) NOT NULL, status VARCHAR(32) NOT NULL,
        last_connected_at TIMESTAMPTZ, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE INDEX ix_database_connections_user_id ON database_connections(user_id);
      CREATE TABLE schema_snapshots (
        id VARCHAR(64) PRIMARY KEY, connection_id VARCHAR(64) NOT NULL REFERENCES database_connections(id) ON DELETE CASCADE,
        schema_name VARCHAR(128) NOT NULL, normalized_metadata JSONB NOT NULL, schema_hash VARCHAR(64) NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CONSTRAINT uq_connection_schema_hash UNIQUE(connection_id, schema_hash)
      );
      CREATE INDEX ix_schema_snapshots_connection_id ON schema_snapshots(connection_id);
      CREATE TABLE query_drafts (
        id VARCHAR(64) PRIMARY KEY, user_id VARCHAR(128) NOT NULL,
        connection_id VARCHAR(64) NOT NULL REFERENCES database_connections(id) ON DELETE CASCADE,
        question TEXT NOT NULL, sql TEXT NOT NULL, explanation TEXT NOT NULL,
        assumptions JSONB NOT NULL DEFAULT '[]', warnings JSONB NOT NULL DEFAULT '[]', confidence VARCHAR(16) NOT NULL,
        schema_hash VARCHAR(64) NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), expires_at TIMESTAMPTZ NOT NULL
      );
      CREATE INDEX ix_query_drafts_user_id ON query_drafts(user_id);
      CREATE INDEX ix_query_drafts_connection_id ON query_drafts(connection_id);
      CREATE TABLE audit_logs (
        id VARCHAR(64) PRIMARY KEY, user_id VARCHAR(128) NOT NULL, connection_id VARCHAR(64),
        action VARCHAR(64) NOT NULL, metadata JSONB NOT NULL DEFAULT '{}', created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE INDEX ix_audit_logs_user_id ON audit_logs(user_id);
      CREATE INDEX ix_audit_logs_connection_id ON audit_logs(connection_id);
      ALTER TABLE query_history ADD COLUMN IF NOT EXISTS connection_id VARCHAR(64) REFERENCES database_connections(id) ON DELETE CASCADE;
      ALTER TABLE query_history ADD COLUMN IF NOT EXISTS user_id VARCHAR(128);
      ALTER TABLE query_history ADD COLUMN IF NOT EXISTS execution_status VARCHAR(32);
      ALTER TABLE query_history ADD COLUMN IF NOT EXISTS warnings JSONB NOT NULL DEFAULT '[]';
      ALTER TABLE query_history ADD COLUMN IF NOT EXISTS error_code VARCHAR(64);
    """)


def downgrade():
    op.execute("""
      ALTER TABLE query_history DROP COLUMN IF EXISTS error_code;
      ALTER TABLE query_history DROP COLUMN IF EXISTS warnings;
      ALTER TABLE query_history DROP COLUMN IF EXISTS execution_status;
      ALTER TABLE query_history DROP COLUMN IF EXISTS user_id;
      ALTER TABLE query_history DROP COLUMN IF EXISTS connection_id;
      DROP TABLE IF EXISTS audit_logs, query_drafts, schema_snapshots, database_connections;
    """)
