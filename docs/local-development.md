# Run QueryMindAI locally

This guide covers a local open-source installation with the real Connections → Query → History workflow. QueryMindAI supports PostgreSQL in the current release. It does not ship fake connection, schema, result, or history data.

## What runs locally

| Service | Local address | Purpose |
|---|---|---|
| Web | `http://localhost:4028` | Connections, Query, and History workspaces |
| API | `http://localhost:8000` | FastAPI application and `/api/v1` endpoints |
| Application PostgreSQL | `localhost:5432` | QueryMindAI metadata, encrypted connections, catalogs, drafts, and history |
| Ollama (optional profile) | `localhost:11434` | Local SQL-generation provider |

The application PostgreSQL database is QueryMindAI's internal store. The PostgreSQL database you add from the Connections page is a separate, read-only data source.

## Docker Compose setup

Prerequisites: Git, Docker Engine or Docker Desktop, and Docker Compose v2.

```bash
git clone https://github.com/gopalmani/QueryMindAI.git
cd QueryMindAI
cp .env.example .env
```

Generate two independent backend secrets:

```bash
python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
python -c "import secrets; print(secrets.token_urlsafe(48))"
```

Put the first value in `CONNECTION_ENCRYPTION_KEY` and the second in `AUTH_SIGNING_KEY` in your local `.env`. Never commit that file.

### Option A: local Ollama

Keep the default Ollama provider values in `.env`, then run:

```bash
docker compose --profile ollama up --build -d
docker compose exec ollama ollama pull sqlcoder
docker compose restart api
```

### Option B: hosted OpenAI-compatible provider

Set `LLM_PROVIDER`, `LLM_BASE_URL`, `LLM_API_KEY`, `LLM_MODEL`, and optionally `LLM_FALLBACK_MODEL` in `.env`, then run:

```bash
docker compose up --build -d
```

Open `http://localhost:4028`. Confirm the API separately with:

```bash
curl http://localhost:8000/health
curl http://localhost:8000/ready
```

## Connect your PostgreSQL database

Create a dedicated read-only role as a database administrator. Review and adjust the schema names before running this example:

```sql
CREATE ROLE querymind_reader LOGIN PASSWORD 'replace-with-a-generated-password';
GRANT CONNECT ON DATABASE analytics TO querymind_reader;
GRANT USAGE ON SCHEMA public TO querymind_reader;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO querymind_reader;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO querymind_reader;
ALTER ROLE querymind_reader SET default_transaction_read_only = on;
ALTER ROLE querymind_reader SET statement_timeout = '10s';
```

Then open **Connections** and use either the structured form or a `postgresql://` connection URL. The API tests connectivity, checks read-only posture where feasible, introspects the schema, encrypts the credentials, and returns only masked connection fields.

For a hosted QueryMindAI deployment, the target database must be publicly reachable on PostgreSQL port 5432 and use SSL. Keep `ALLOW_PRIVATE_DATABASE_HOSTS=false`.

### Connecting to a database on your own development machine

Private and localhost targets are intentionally blocked by default. For a trusted local development environment only, set:

```dotenv
ALLOW_PRIVATE_DATABASE_HOSTS=true
```

When the API runs in Docker, `localhost` means the API container—not your computer. Use a Docker-reachable hostname such as `host.docker.internal` where your platform supports it, ensure PostgreSQL listens on the Docker-facing interface, and restrict access with PostgreSQL/firewall rules. Never enable private hosts on a public QueryMindAI instance; it weakens the SSRF boundary.

## Use the product

1. **Connections:** add the read-only PostgreSQL database, test it, and inspect or refresh its real schema catalog.
2. **Query:** select the connection, enter a business question, and click **Generate SQL**.
3. Review the SQL, explanation, assumptions, and warnings. Generation does not execute anything.
4. Click **Run query** to approve the exact server-stored draft. The API revalidates it and runs it in a read-only transaction with a timeout and row cap.
5. **History:** review actual approved executions. QueryMindAI stores SQL and execution metadata but not result rows.

## Run without Docker

Start PostgreSQL 16+, create an empty application database, and configure `apps/api/.env`:

```bash
cp apps/api/.env.example apps/api/.env
cd apps/api
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
alembic upgrade head
uvicorn app.main:app --reload --port 8000
```

At minimum, set the application `DATABASE_URL`, `ENABLE_EXTERNAL_CONNECTIONS=true`, and the two generated `CONNECTION_ENCRYPTION_KEY` and `AUTH_SIGNING_KEY` values in `apps/api/.env`. Keep `CORS_ALLOW_ORIGINS=http://localhost:4028` for the default frontend port.

In another terminal:

```bash
cp apps/web/.env.example apps/web/.env.local
cd apps/web
npm ci
npm run dev
```

The browser API URL must include `/api/v1`. `CORS_ALLOW_ORIGINS` on the API must contain the exact web origin, for example `http://localhost:4028`.

## Troubleshooting

- **Connections are disabled:** set `ENABLE_EXTERNAL_CONNECTIONS=true` in the API environment and restart it.
- **Encryption/signing configuration error:** provide valid, different `CONNECTION_ENCRYPTION_KEY` and `AUTH_SIGNING_KEY` values.
- **Host rejected:** public mode rejects localhost, private, link-local, reserved, and metadata IP ranges. Use a public hostname or opt into private hosts only in a trusted local environment.
- **Browser reports a network or CORS error:** verify `NEXT_PUBLIC_API_URL`, `CORS_ALLOW_ORIGINS`, and `/health`. Next.js public variables are embedded at build time, so rebuild the web image after changing the API URL.
- **Generation fails but schema browsing works:** verify the LLM provider URL, model, and backend-only key. Database credentials and LLM keys must never be added to `NEXT_PUBLIC_*` variables.
- **A query is absent from History:** SQL generation alone is intentionally not history. The entry is created after an approved execution reaches the execution service.

See [Security](security.md) for the threat model and [Deployment](deployment.md) for Render configuration.
