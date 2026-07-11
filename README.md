# QueryMindAI
> Ask questions, not SQL.

QueryMindAI is an open-source AI data workspace that lets users connect a read-only database and query it safely using natural language.

## Current status

QueryMindAI is an early production-minded release. Implemented today: encrypted saved PostgreSQL connections, public-host SSRF checks, SSL connections, catalog snapshots, structured SQL generation, explicit approval drafts, parser/table validation, read-only execution, verified examples, history, audit events, Docker Compose, and Render configuration. Signed anonymous workspace sessions provide ownership isolation for the public demo; account login and enterprise identity integration remain roadmap work.

## Screenshots

![AI Query Assistant placeholder](docs/screenshots/ai-query-assistant-placeholder.svg)

## Core capabilities and differentiators

- Schema-aware generation using live introspection, with optional pgvector retrieval.
- Exactly-one-statement PostgreSQL parsing and read-only enforcement through `sqlglot`.
- Transparent Generated SQL, explanation, warnings, limits, timeout, and request metadata.
- Semantic retrieval of human-verified prompt/SQL examples—no training or fine-tuning claim.
- A deterministic evaluation foundation that requires no paid API.
- PostgreSQL, Docker-based local development, and a single-repository Render Blueprint.

## Architecture

```mermaid
flowchart LR
  B[Browser] --> W[QueryMindAI Web] --> A[QueryMindAI API]
  A --> C[Connection Manager] --> S[Schema Catalog]
  S --> L[LLM Query Planner] --> V[SQL Validator]
  V --> E[Execution Engine] --> D[(Customer PostgreSQL Database)]
```

### Query lifecycle

```mermaid
flowchart LR
  Q[Validate question] --> S[Retrieve bounded schema] --> L[Generate structured SQL]
  L --> V[Parse, table-check, cap LIMIT] --> D[Store expiring draft]
  D --> H[Human review and approval] --> R[Revalidate SQL]
  R --> X[Read-only execute with timeout] --> O[Results and history]
```

## Tech stack

FastAPI, SQLAlchemy, Alembic, PostgreSQL, sqlglot, OpenAI-compatible provider API, Next.js 15, React 19, TypeScript, Tailwind CSS, Docker Compose, GitHub Actions, and Render.

## Repository structure

```text
apps/api       FastAPI service, migrations, scripts, tests
apps/web       Next.js application
docs           Architecture, deployment, and security guidance
evaluations    Small deterministic dataset and runner
scripts        Operator helpers
.github        CI and issue templates
```

## Quickstart

Prerequisites: Python 3.12, Node 20, PostgreSQL 16+, and optionally Ollama.

```bash
cp apps/api/.env.example apps/api/.env
cd apps/api
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
alembic upgrade head
psql "$DATABASE_URL" -f scripts/seed_data.sql
uvicorn app.main:app --reload --port 8000
```

In a second terminal:

```bash
cp apps/web/.env.example apps/web/.env.local
cd apps/web
npm ci
npm run dev
```

Open `http://localhost:4028`.

## Docker quickstart

The default stack runs PostgreSQL, API, and web. Because no LLM is bundled by default, configure a reachable remote provider or use the Ollama profile.

```bash
docker compose up --build
docker compose --profile ollama up --build
docker compose exec ollama ollama pull sqlcoder
```

For the default Compose stack, optional vector features are off so schema introspection still works; generation requires a configured provider. Set feature flags to `true` after installing the embedding model and seeding embeddings.

## Environment variables

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | Application/demo PostgreSQL URL |
| `LLM_PROVIDER` | `ollama`, `groq`, or `openai` |
| `LLM_BASE_URL` | OpenAI-compatible API base URL |
| `LLM_API_KEY` | Provider secret; never commit it |
| `LLM_MODEL`, `LLM_FALLBACK_MODEL` | Primary and retry fallback generation models |
| `EMBEDDING_PROVIDER`, `EMBEDDING_MODEL` | Local semantic-retrieval configuration |
| `ENABLE_SCHEMA_RAG`, `ENABLE_GOLDEN_RECORDS` | Optional embedding features |
| `ENABLE_EXTERNAL_CONNECTIONS`, `ALLOW_PRIVATE_DATABASE_HOSTS` | BYOD and SSRF policy flags |
| `CONNECTION_ENCRYPTION_KEY`, `AUTH_SIGNING_KEY` | Backend-only Fernet and session signing secrets |
| `DATABASE_*` | Connect timeout, statement timeout, SQL length, and result caps |
| `SCHEMA_*_TABLE_LIMIT` | Full-context and retrieval bounds |
| `NEXT_PUBLIC_API_URL` | Browser-visible API `/api/v1` URL |

See the component `.env.example` files for all defaults.

## Provider setup

For local Ollama use `LLM_BASE_URL=http://ollama:11434/v1` in Compose (or `http://localhost:11434/v1` when the API runs directly), `LLM_API_KEY=ollama`, and `LLM_MODEL=sqlcoder`. Render defaults to Groq with `openai/gpt-oss-120b` and the configurable `llama-3.3-70b-versatile` fallback; enter `LLM_API_KEY` only in Render's secret environment field. Generation uses temperature zero, structured JSON, at most two retries, jittered exponential backoff, and fallback only for retryable provider errors.

Semantic retrieval uses lazy, process-cached `sentence-transformers/all-MiniLM-L6-v2` embeddings and never sends embedding inputs to Groq. Install `apps/api/requirements-embeddings.txt` only when enabling schema RAG or verified examples; both are disabled by default.

## API overview

- `GET /health`, `GET /ready`
- `POST /api/v1/auth/session`
- `POST/GET/DELETE /api/v1/connections[...]`
- `POST /api/v1/queries/generate`, `POST /api/v1/queries/execute`
- `GET /api/v1/queries/history`, `GET /api/v1/queries/{id}`
- `GET /api/v1/schema`, `GET /api/v1/query-history`
- `POST /api/v1/query`
- `POST /api/v1/verified-examples`
- `POST /api/v1/connect-and-query` (disabled by default)

Interactive OpenAPI documentation is at `/docs`.

## Safety and correctness model

The API validates question size, limits generated SQL length, rejects comments/multiple statements, parses PostgreSQL SQL, permits only read-only query trees, caps rows, applies a statement timeout, and starts a read-only transaction before executing. Deploy with the separate read-only role described in [security guidance](docs/security.md); application checks are defense in depth, not a substitute for database permissions.

## Evaluation approach

`python evaluations/runner.py` performs deterministic parser, table, limit, latency, and unsafe-query checks. The dataset includes reference SQL and never calls a paid LLM. Semantic equivalence and live execution scoring remain intentionally small roadmap work.

## Render deployment

`render.yaml` defines the API, web app, and PostgreSQL database. Secrets and the browser API URL require dashboard entry. Follow [the exact Blueprint procedure](docs/deployment.md); this repository prepares deployment but has not deployed or connected a Render account.

## Limitations and roadmap

Current limitations include PostgreSQL-only execution, publicly reachable hosts only, provider-dependent SQL quality, application-level encryption rather than a managed vault, anonymous browser-bound sessions rather than account authentication, no rate limiter, and no guaranteed detection of inherited write privileges.

Roadmap: OIDC accounts and organizations, MySQL, richer history review, execution-backed evaluations, observability exports, and a customer-side connector for private databases: `Customer Database → QueryMind Connector inside customer network → outbound TLS → QueryMindAI Cloud`. The connector is documented only and is not implemented.

## Contributing and license

Read [CONTRIBUTING.md](CONTRIBUTING.md) and the [Code of Conduct](CODE_OF_CONDUCT.md). QueryMindAI is available under the [MIT License](LICENSE).
