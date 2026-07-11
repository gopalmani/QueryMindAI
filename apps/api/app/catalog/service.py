import hashlib
import json

from sqlalchemy import inspect


SYSTEM_SCHEMAS = {"information_schema", "pg_catalog", "pg_toast"}


def introspect_postgresql(connection) -> dict:
    inspector = inspect(connection)
    schemas = []
    for schema_name in sorted(name for name in inspector.get_schema_names() if name not in SYSTEM_SCHEMAS and not name.startswith("pg_")):
        objects = []
        table_names = [(name, "table") for name in inspector.get_table_names(schema=schema_name)]
        view_names = [(name, "view") for name in inspector.get_view_names(schema=schema_name)]
        for object_name, object_type in sorted(table_names + view_names):
            columns = [{"name": column["name"], "type": str(column["type"]), "nullable": bool(column["nullable"])}
                       for column in inspector.get_columns(object_name, schema=schema_name)]
            pk = inspector.get_pk_constraint(object_name, schema=schema_name) or {}
            fks = []
            for fk in inspector.get_foreign_keys(object_name, schema=schema_name):
                fks.append({"columns": fk.get("constrained_columns", []), "referred_schema": fk.get("referred_schema") or schema_name,
                            "referred_table": fk.get("referred_table"), "referred_columns": fk.get("referred_columns", [])})
            indexes = [{"name": index.get("name"), "columns": index.get("column_names", []), "unique": bool(index.get("unique"))}
                       for index in inspector.get_indexes(object_name, schema=schema_name)] if object_type == "table" else []
            objects.append({"name": object_name, "type": object_type, "columns": columns,
                            "primary_key": pk.get("constrained_columns", []), "foreign_keys": fks, "indexes": indexes})
        schemas.append({"name": schema_name, "objects": objects})
    return {"database_type": "postgresql", "schemas": schemas}


def schema_hash(metadata: dict) -> str:
    encoded = json.dumps(metadata, sort_keys=True, separators=(",", ":")).encode()
    return hashlib.sha256(encoded).hexdigest()


def qualified_tables(metadata: dict) -> set[str]:
    result = set()
    for schema in metadata.get("schemas", []):
        for obj in schema.get("objects", []):
            result.add(obj["name"].lower())
            result.add(f"{schema['name']}.{obj['name']}".lower())
    return result


def schema_context(metadata: dict, question: str, full_limit: int, retrieval_limit: int) -> str:
    objects = [(schema["name"], obj) for schema in metadata.get("schemas", []) for obj in schema.get("objects", [])]
    if len(objects) > full_limit:
        terms = {term.lower() for term in question.replace("_", " ").split() if len(term) > 2}
        scored = []
        for schema_name, obj in objects:
            haystack = " ".join([obj["name"], *(col["name"] for col in obj["columns"])]).lower()
            scored.append((sum(term in haystack for term in terms), schema_name, obj))
        selected = [(schema, obj) for _, schema, obj in sorted(scored, key=lambda item: (-item[0], item[1], item[2]["name"]))[:retrieval_limit]]
        selected_names = {(schema, obj["name"]) for schema, obj in selected}
        # Add directly related tables while respecting the same bounded context budget.
        for schema, obj in list(selected):
            for fk in obj.get("foreign_keys", []):
                target = (fk["referred_schema"], fk["referred_table"])
                if target not in selected_names:
                    match = next(((s, candidate) for s, candidate in objects if (s, candidate["name"]) == target), None)
                    if match and len(selected) < retrieval_limit:
                        selected.append(match); selected_names.add(target)
        objects = selected
    lines = []
    for schema, obj in objects:
        cols = ", ".join(f"{col['name']} {col['type']}" for col in obj["columns"])
        lines.append(f"{schema}.{obj['name']} ({cols})")
        for fk in obj.get("foreign_keys", []):
            lines.append(f"FK {schema}.{obj['name']}.{','.join(fk['columns'])} -> {fk['referred_schema']}.{fk['referred_table']}.{','.join(fk['referred_columns'])}")
    return "\n".join(lines)
