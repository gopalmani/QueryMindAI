# Architecture

QueryMindAI is a two-service monorepo: a browser-rendered Next.js application and a modular FastAPI API backed by PostgreSQL/pgvector. The API is the trust boundary; the browser cannot execute SQL directly.

```mermaid
sequenceDiagram
  participant W as Web
  participant A as API
  participant P as LLM provider
  participant D as PostgreSQL
  W->>A: POST /api/v1/query
  A->>D: Introspect schema / optional vector lookup
  A->>P: Question + bounded schema + optional verified example
  P-->>A: Candidate SQL
  A->>A: Cleanup + sqlglot safety validation
  A->>D: Read-only, timeout-bound SELECT
  D-->>A: Rows
  A-->>W: SQL, rows, explanation, warnings, metadata
```

The provider is OpenAI API compatible and constructed once from settings. If embedding functionality fails, live schema introspection remains available and verified-example retrieval is skipped. Migrations, not app startup, own production schema changes. Query history is implemented as best-effort recording after successful execution.

Static frontend management surfaces were retained to avoid an unnecessary visual rewrite. Their datasets are demo presentation data; only the query assistant currently completes the product journey end to end.
