# Deployment

## Docker Compose

```bash
cp .env.example .env
# Generate backend-only secrets and paste them into .env:
python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
python -c "import secrets; print(secrets.token_urlsafe(48))"
docker compose up --build
# Optional local provider:
docker compose --profile ollama up --build
docker compose exec ollama ollama pull sqlcoder
```

Use the first generated value for `CONNECTION_ENCRYPTION_KEY` and the second for `AUTH_SIGNING_KEY`. Open web at `http://localhost:4028`, API docs at `http://localhost:8000/docs`, and check `/health` then `/ready`. Configure a provider for generation. BYOD databases must be publicly reachable PostgreSQL on port 5432 with SSL and a read-only role.

## Render Blueprint procedure

1. Push this repository to GitHub. In Render choose **New → Blueprint**, connect that repository, and select `render.yaml`.
2. Review creation of `querymind-postgres`, `querymind-api`, and `querymind-web`. Select paid plans where the Blueprint/free availability differs for your account or region.
3. Enter backend secrets in the non-synced fields: Groq `LLM_API_KEY`, a Fernet `CONNECTION_ENCRYPTION_KEY`, and an independent random `AUTH_SIGNING_KEY`. Never reuse or commit these values.
4. Set `CORS_ALLOW_ORIGINS` on the API to the final HTTPS web origin, without a trailing slash.
5. Deploy the API. On the free tier, the API start command runs `alembic upgrade head` before starting Uvicorn because Render does not support pre-deploy commands for free services. Confirm `https://<api-host>/health` and `/ready`.
6. Set `NEXT_PUBLIC_API_URL` on `querymind-web` to `https://<api-host>/api/v1`, then trigger a clean frontend deploy. Render does not provide a supported Blueprint interpolation from another web service’s eventual public hostname into a Next.js build variable; this manual build-time step is required.
7. Open the web service, create a public PostgreSQL connection, review its read-only warning, generate SQL, and explicitly run it. Some database providers require Render outbound IP allow-listing; availability and stable ranges depend on the Render plan.
8. Keep `ALLOW_PRIVATE_DATABASE_HOSTS=false`. Render cannot use this feature for localhost or private/VPC-only databases. Do not bypass this flag merely to work around network architecture.

The Blueprint keeps local embedding features disabled because the standard API build omits the large SentenceTransformer runtime. To enable them, change the API build command to `pip install -r requirements-embeddings.txt`, provision adequate memory, then set the feature flags true. Groq announced free/developer-tier retirement of `llama-3.3-70b-versatile` for August 16, 2026; replace `LLM_FALLBACK_MODEL` before that date if the deployment is affected.

Build filters deploy the API for backend/shared deployment changes and the web for frontend/shared deployment changes. `render.yaml` contains no real API keys. This repository has been prepared and syntax-checked locally; no Render account or live deployment has been connected by this work.

## Customer read-only PostgreSQL role

Run an equivalent reviewed policy as a database administrator, replacing names and the generated password:

```sql
CREATE ROLE querymind_reader LOGIN PASSWORD 'strong-generated-password';
GRANT CONNECT ON DATABASE analytics TO querymind_reader;
GRANT USAGE ON SCHEMA public TO querymind_reader;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO querymind_reader;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO querymind_reader;
ALTER ROLE querymind_reader SET default_transaction_read_only = on;
ALTER ROLE querymind_reader SET statement_timeout = '10s';
```

Prefer `sslmode=verify-full` with valid CA trust. `require` encrypts transit but does not provide the same hostname/CA verification guarantees.

## Rollback and operations

Use Render deploy rollback for application revisions. Database downgrade scripts are intentionally conservative; test backups and migrations in staging. Monitor 5xx rates, provider latency, validation rejections, query duration, and database statement cancellations without logging secrets or raw credentials.
