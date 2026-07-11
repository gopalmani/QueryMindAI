# QueryMindAI API

The modular FastAPI service turns validated questions into schema-aware PostgreSQL, validates it, executes it read-only, and returns structured results.

## Architecture and lifecycle

`api/v1` defines HTTP routes; `core` owns settings, provider creation, errors, logging; `db` owns engines/sessions; `schemas` owns API models; `services` owns introspection, retrieval, generation, validation, and orchestration. The lifecycle is question validation → live schema/optional RAG → optional verified example → provider generation → cleanup → sqlglot validation → read-only execution → history and response.

## Endpoints

`GET /health` is liveness. `GET /ready` checks PostgreSQL. Under `/api/v1`: `GET /schema`, `GET /query-history`, `POST /query`, `POST /verified-examples`; `/golden-record` is a deprecated compatibility alias. `/connect-and-query` returns 403 unless explicitly enabled.

## Configuration and providers

Copy `.env.example` to `.env`. Settings are parsed by Pydantic. Hosted generation uses the OpenAI-compatible asynchronous client behind `core/provider.py`; Groq is the public Render default and Ollama remains the local default. The provider returns a Pydantic-validated JSON object with SQL, explanation, tables, assumptions, and confidence. Retryable timeouts, connection errors, rate limits, and selected 5xx responses use at most two jittered exponential-backoff retries and switch to `LLM_FALLBACK_MODEL`. Malformed output and unsafe SQL do not trigger fallback.

Embeddings are a separate local provider in `core/embedding_provider.py`. Install `pip install -r requirements-embeddings.txt` before enabling schema RAG or verified examples. The SentenceTransformer model is loaded lazily and cached for the process lifetime. Both embedding features default off.

## Database, migrations, and demo data

```bash
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
alembic upgrade head
psql "$DATABASE_URL" -f scripts/seed_data.sql
uvicorn app.main:app --reload --port 8000
```

Production startup never creates tables. Alembic creates application tables and pgvector. The demo seed is idempotent. Use `../../scripts/create_readonly_role.sql` as a reviewed template and run query traffic with that role.

## Safety model

`sqlglot` parses PostgreSQL and enforces one read-only query, accepts SELECT/CTE SELECT, rejects comments, multiple/write/admin statements, caps LIMIT, and limits SQL size. Execution uses `SET LOCAL TRANSACTION READ ONLY` plus statement timeout. Database permissions remain the primary boundary.

## Verified examples

Verified examples are human-reviewed question/SQL pairs. The question embedding retrieves the closest pair above a configurable threshold. Unique connection/question/SQL identity prevents duplicates. Reviewer/source/timestamps are stored. Retrieval fails open to generation when embeddings are unavailable; saving reports 503. This is semantic retrieval, not training.

## Testing

`pytest` uses mocked services and no paid API. Tests cover health, input/config parsing, SQL safety and limits, provider/error statuses, retry behavior, and verified-example models. Run `python ../../evaluations/runner.py` for deterministic dataset checks.

## Deployment

The Dockerfile is non-root and binds `$PORT`. Render runs `alembic upgrade head` as pre-deploy. Set secrets in the platform and use `/health` for liveness. See `../../docs/deployment.md`.
