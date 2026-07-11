# QueryMindAI evaluations

`datasets/demo.json` contains transparent question/reference-SQL cases. Run `python evaluations/runner.py` from the repository root after installing backend requirements. The runner checks PostgreSQL parser validity, expected tables, row caps, latency, and unsafe-query rejection without an LLM key. `execution_success` is deliberately `null` unless a future opt-in database adapter is supplied; CI does not pretend to execute SQL.
