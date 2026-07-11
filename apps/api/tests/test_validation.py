import pytest

from app.core.exceptions import UnsafeSQLError
from app.services.validation_service import validate_sql


def test_accepts_select_and_adds_limit():
    assert validate_sql("SELECT id FROM users").endswith("LIMIT 100")


def test_accepts_cte():
    assert validate_sql("WITH totals AS (SELECT 1 AS n) SELECT n FROM totals").startswith("WITH")


def test_preserves_lower_limit():
    assert validate_sql("SELECT * FROM users LIMIT 5").endswith("LIMIT 5")


def test_caps_high_limit():
    assert validate_sql("SELECT * FROM users LIMIT 500").endswith("LIMIT 100")


@pytest.mark.parametrize("sql", [
    "DELETE FROM users", "UPDATE users SET name='x'", "INSERT INTO users VALUES (1)",
    "DROP TABLE users", "CREATE TABLE x (id int)", "TRUNCATE users", "COPY users TO '/tmp/x'",
])
def test_rejects_write_or_admin(sql):
    with pytest.raises(UnsafeSQLError):
        validate_sql(sql)


@pytest.mark.parametrize("sql", ["SELECT 1; SELECT 2", "SELECT 1 -- append", "SELECT 1 /* comment */"])
def test_rejects_multiple_statements_or_comments(sql):
    with pytest.raises(UnsafeSQLError):
        validate_sql(sql)
