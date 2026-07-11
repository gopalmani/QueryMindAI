# Contributing

Thank you for improving QueryMindAI. Open an issue for significant behavior or schema changes. Fork the repository, branch from the default branch, keep changes focused, and add tests for safety-sensitive behavior.

Before a pull request, run:

```bash
cd apps/api && pytest
cd ../web && npm ci && npm run lint && npm run type-check && npm run build
cd ../.. && python evaluations/runner.py && docker compose config
```

Never commit `.env` files, credentials, production schema/data, or customer prompts/results. Describe implemented behavior precisely and label demos/roadmap. Security reports should not include exploitable secrets in a public issue; contact the repository owner privately until a formal policy is added.
