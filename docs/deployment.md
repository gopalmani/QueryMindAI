# Deployment

## Docker Compose

```bash
cp .env.example .env
docker compose up --build
# Optional local provider:
docker compose --profile ollama up --build
docker compose exec ollama ollama pull sqlcoder
```

Open web at `http://localhost:4028`, API docs at `http://localhost:8000/docs`, and check `/health` then `/ready`. The default Compose flags disable vector features; configure a provider for generation. Compose credentials are local-only examples.

## Render Blueprint procedure

1. Push this repository to GitHub. In Render choose **New → Blueprint**, connect that repository, and select `render.yaml`.
2. Review creation of `querymind-postgres`, `querymind-api`, and `querymind-web`. Select paid plans where the Blueprint/free availability differs for your account or region.
3. Before deploying the API, enter the Groq key only in the non-synced `LLM_API_KEY` field. The Blueprint sets the hosted base URL, primary model, and fallback model; no key is stored in Git. A Render service cannot reach Ollama on a developer laptop.
4. Set `CORS_ALLOW_ORIGINS` on the API to the final HTTPS web origin, without a trailing slash.
5. Deploy the API. On the free tier, the API start command runs `alembic upgrade head` before starting Uvicorn because Render does not support pre-deploy commands for free services. Confirm `https://<api-host>/health` and `/ready`.
6. Set `NEXT_PUBLIC_API_URL` on `querymind-web` to `https://<api-host>/api/v1`, then trigger a clean frontend deploy. Render does not provide a supported Blueprint interpolation from another web service’s eventual public hostname into a Next.js build variable; this manual build-time step is required.
7. Open the web service and run a safe demo question. Seed demo tables separately from Render Shell with `psql "$DATABASE_URL" -f scripts/seed_data.sql` from `apps/api` if the database is empty.
8. Keep external connections disabled. For production, create/review a least-privilege reader role and change the query execution connection design so application metadata migrations and query traffic do not share broad credentials.

The Blueprint keeps local embedding features disabled because the standard API build omits the large SentenceTransformer runtime. To enable them, change the API build command to `pip install -r requirements-embeddings.txt`, provision adequate memory, then set the feature flags true. Groq announced free/developer-tier retirement of `llama-3.3-70b-versatile` for August 16, 2026; replace `LLM_FALLBACK_MODEL` before that date if the deployment is affected.

Build filters deploy the API for backend/shared deployment changes and the web for frontend/shared deployment changes. `render.yaml` contains no real API keys. This repository has been prepared and syntax-checked locally; no Render account or live deployment has been connected by this work.

## Rollback and operations

Use Render deploy rollback for application revisions. Database downgrade scripts are intentionally conservative; test backups and migrations in staging. Monitor 5xx rates, provider latency, validation rejections, query duration, and database statement cancellations without logging secrets or raw credentials.
