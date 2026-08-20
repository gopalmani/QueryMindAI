# QueryMindAI web

Next.js 15, React 19, TypeScript, and Tailwind UI for QueryMindAI.

## Architecture and implemented pages

`src/app` contains routes, `src/lib/api.ts` is the typed authenticated fetch boundary, and `src/types` contains contracts. Data Connections creates/tests/deletes encrypted PostgreSQL connections; Schema Explorer renders normalized live catalog snapshots; AI Query Workspace separates generation from explicit execution; Query History lists approved executions without stored rows. The client stores a signed anonymous workspace token in browser local storage; this is ownership isolation, not account login.

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

Use AI Query Assistant, Generated SQL, Verified Example, Schema Explorer, Query History, and Data Connections. Label every non-API data source `Demo data` or `Coming soon`; never describe stored examples as model training.
