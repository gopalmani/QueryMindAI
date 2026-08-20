# QueryMindAI web

Next.js 15, React 19, TypeScript, and Tailwind UI for QueryMindAI.

## Product routes

The frontend intentionally has three product routes:

- `/connections` creates, tests, lists, refreshes, and deletes encrypted PostgreSQL connections. Its expandable Schema Catalog renders live introspection data.
- `/query` generates validated SQL and requires a separate **Run query** approval before execution. It renders real results and can save a successful execution as a verified example.
- `/history` lists real approved executions and their metadata. Result rows are not persisted.

Old generated dashboard, login, browser, editor, and history URLs redirect to these routes. There are no fake metrics, login forms, connection records, schemas, results, or history entries.

`src/features` owns workflow UI, `src/lib/api.ts` is the typed authenticated fetch boundary, and `src/types` contains API contracts. The client stores a signed anonymous workspace token in browser local storage; this is ownership isolation, not account login.

## Configuration and API integration

Copy `.env.example` to `.env.local`. `NEXT_PUBLIC_API_URL` must include `/api/v1`; `NEXT_PUBLIC_API_TIMEOUT_MS` controls browser timeout. The client centralizes JSON parsing, typed responses, API errors, abort handling, and request IDs. No production URL is hardcoded.

## Development and production

```bash
npm ci
npm run dev          # port 4028
npm run lint
npm run type-check
npm run build
npm run start -- -p 4028
```

`npm run format` formats `src`. Production uses `next start`, never the dev server.

## Docker and Render

The multi-stage Dockerfile builds a standalone, non-root image. Pass `NEXT_PUBLIC_API_URL` at build time because it is compiled into browser assets. Render uses `npm ci && npm run build` and `npm run start -- -p $PORT`. Manually set the deployed API URL before the first frontend build; see `../../docs/deployment.md`.

## UI conventions

Use Connections, AI Query Assistant, Generated SQL, Verified Example, Schema Catalog, and Query History. Product data must come from the API. Do not add sample metrics or fabricated operational records. Never describe stored examples as model training.

For the complete repository setup, database role, local-database caveat, and troubleshooting steps, read [Run QueryMindAI locally](../../docs/local-development.md).
