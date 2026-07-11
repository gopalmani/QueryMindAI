import re

from sqlglot import exp, parse
from sqlglot.errors import ParseError

from app.core.config import settings
from app.core.exceptions import UnsafeSQLError

FORBIDDEN_NODES = (
    exp.Insert, exp.Update, exp.Delete, exp.Drop, exp.Alter, exp.Create,
    exp.Command, exp.Copy, exp.Merge, exp.Transaction,
)


def validate_sql(sql: str, max_rows: int | None = None) -> str:
    if not sql or not sql.strip():
        raise UnsafeSQLError("The provider returned empty SQL")
    if len(sql) > settings.MAX_SQL_LENGTH:
        raise UnsafeSQLError("Generated SQL exceeds the configured maximum length")
    if "/*" in sql or "*/" in sql or re.search(r"--[^\n\r]*", sql):
        raise UnsafeSQLError("SQL comments are not allowed")
    try:
        statements = [statement for statement in parse(sql, read="postgres") if statement]
    except ParseError as exc:
        raise UnsafeSQLError("Generated SQL could not be parsed") from exc
    if len(statements) != 1:
        raise UnsafeSQLError("Exactly one SQL statement is required")
    statement = statements[0]
    if not isinstance(statement, exp.Query):
        raise UnsafeSQLError("Only read-only SELECT queries are allowed")
    if any(statement.find(node_type) is not None for node_type in FORBIDDEN_NODES):
        raise UnsafeSQLError("Write and administrative SQL statements are not allowed")
    if statement.find(exp.Select) is None:
        raise UnsafeSQLError("Only SELECT queries and WITH ... SELECT queries are allowed")

    limit = max_rows or settings.MAX_QUERY_ROWS
    existing = statement.args.get("limit")
    if existing is None:
        statement = statement.limit(limit)
    else:
        expression = existing.expression
        try:
            current = int(expression.this)
        except (AttributeError, TypeError, ValueError) as exc:
            raise UnsafeSQLError("LIMIT must be a positive integer literal") from exc
        if current < 1:
            raise UnsafeSQLError("LIMIT must be positive")
        if current > limit:
            statement = statement.limit(limit, copy=False)
    return statement.sql(dialect="postgres")
