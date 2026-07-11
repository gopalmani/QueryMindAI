import hashlib

schema_cache = {}

def get_connection_key(db_config):
    raw = f"{db_config['host']}:{db_config['port']}:{db_config['database']}"
    return hashlib.md5(raw.encode()).hexdigest()


def get_cached_schema(key):
    return schema_cache.get(key)


def set_cached_schema(key, schema):
    schema_cache[key] = schema