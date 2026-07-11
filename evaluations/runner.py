#!/usr/bin/env python3
"""Small deterministic SQL evaluation runner; no LLM or database is required by default."""
import json
import sys
import time
from pathlib import Path

from sqlglot import exp, parse_one

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "apps" / "api"))
from app.core.exceptions import UnsafeSQLError  # noqa: E402
from app.services.validation_service import validate_sql  # noqa: E402


def evaluate(case):
    started = time.perf_counter()
    safe = validate_sql(case["reference_sql"], max_rows=case["max_rows"])
    tree = parse_one(safe, read="postgres")
    tables = {table.name for table in tree.find_all(exp.Table)}
    unsafe_rejected = False
    try:
        validate_sql("DELETE FROM orders")
    except UnsafeSQLError:
        unsafe_rejected = True
    return {"id": case["id"], "parser_valid": True,
            "expected_tables": set(case["expected_tables"]).issubset(tables),
            "max_rows": f"LIMIT {case['max_rows']}" in safe,
            "unsafe_rejected": unsafe_rejected,
            "execution_success": None,
            "latency_ms": round((time.perf_counter() - started) * 1000, 2)}


if __name__ == "__main__":
    cases = json.loads((ROOT / "evaluations/datasets/demo.json").read_text())
    results = [evaluate(case) for case in cases]
    print(json.dumps(results, indent=2))
    if not all(item["parser_valid"] and item["expected_tables"] and item["max_rows"] and item["unsafe_rejected"] for item in results):
        raise SystemExit(1)
