-- Run as a PostgreSQL administrator after replacing the placeholder password.
DO $$ BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'querymind_reader') THEN
    CREATE ROLE querymind_reader LOGIN PASSWORD 'replace-with-a-strong-password';
  END IF;
END $$;
GRANT CONNECT ON DATABASE querymind TO querymind_reader;
GRANT USAGE ON SCHEMA public TO querymind_reader;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO querymind_reader;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO querymind_reader;
ALTER ROLE querymind_reader SET default_transaction_read_only = on;
ALTER ROLE querymind_reader SET statement_timeout = '10s';
