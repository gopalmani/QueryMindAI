from sqlalchemy import inspect


def get_dynamic_schema(db) -> str:
    inspector = inspect(db.bind)
    blocks = []
    for table in inspector.get_table_names(schema="public"):
        columns = inspector.get_columns(table, schema="public")
        column_text = ", ".join(f"{column['name']} {column['type']}" for column in columns)
        blocks.append(f"CREATE TABLE {table} ({column_text});")
    return "\n".join(blocks)
