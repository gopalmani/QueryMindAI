import ipaddress
import json
import socket
from functools import lru_cache

from cryptography.fernet import Fernet, InvalidToken
from sqlalchemy.engine import URL, make_url

from app.core.config import settings
from app.core.exceptions import ConnectionSecurityError, DependencyError


def normalize_connection_input(request) -> dict:
    if request.connection_string:
        try:
            url = make_url(request.connection_string)
        except Exception as exc:
            raise ConnectionSecurityError("Invalid PostgreSQL connection string") from exc
        if url.drivername not in {"postgresql", "postgres", "postgresql+psycopg2"}:
            raise ConnectionSecurityError("Only PostgreSQL connection strings are supported")
        if not all([url.host, url.database, url.username, url.password]):
            raise ConnectionSecurityError("Connection string must include host, database, username, and password")
        query = dict(url.query)
        ssl_mode = query.get("sslmode", request.ssl_mode)
        config = {"host": url.host, "port": url.port or 5432, "database": url.database,
                  "username": url.username, "password": url.password, "ssl_mode": ssl_mode}
    else:
        config = {"host": request.host, "port": request.port, "database": request.database,
                  "username": request.username, "password": request.password, "ssl_mode": request.ssl_mode}
    if config["port"] != 5432:
        raise ConnectionSecurityError("Only the standard PostgreSQL port 5432 is supported")
    if config["ssl_mode"] not in {"require", "verify-ca", "verify-full"}:
        raise ConnectionSecurityError("SSL mode must be require, verify-ca, or verify-full")
    return config


def _blocked(ip: ipaddress.IPv4Address | ipaddress.IPv6Address) -> bool:
    return ip.is_loopback or ip.is_private or ip.is_link_local or ip.is_unspecified or ip.is_reserved or ip.is_multicast


def validate_public_host(host: str) -> list[str]:
    if not host or host.rstrip(".").lower() == "localhost":
        raise ConnectionSecurityError("Localhost database hosts are not allowed")
    try:
        literal = ipaddress.ip_address(host.strip("[]"))
        addresses = [literal]
    except ValueError:
        try:
            addresses = list({ipaddress.ip_address(item[4][0]) for item in socket.getaddrinfo(host, 5432, type=socket.SOCK_STREAM)})
        except (socket.gaierror, ValueError) as exc:
            raise ConnectionSecurityError("Database hostname could not be resolved") from exc
    if not addresses:
        raise ConnectionSecurityError("Database hostname did not resolve")
    if not settings.ALLOW_PRIVATE_DATABASE_HOSTS and any(_blocked(ip) for ip in addresses):
        raise ConnectionSecurityError("Private, local, link-local, and reserved database hosts are blocked")
    return [str(ip) for ip in addresses]


@lru_cache
def _fernet() -> Fernet:
    if not settings.CONNECTION_ENCRYPTION_KEY:
        raise DependencyError("CONNECTION_ENCRYPTION_KEY is required for saved connections")
    try:
        return Fernet(settings.CONNECTION_ENCRYPTION_KEY.encode())
    except Exception as exc:
        raise DependencyError("CONNECTION_ENCRYPTION_KEY is invalid") from exc


def encrypt_config(config: dict) -> str:
    return _fernet().encrypt(json.dumps(config, separators=(",", ":")).encode()).decode()


def decrypt_config(value: str) -> dict:
    try:
        return json.loads(_fernet().decrypt(value.encode()).decode())
    except (InvalidToken, ValueError, json.JSONDecodeError) as exc:
        raise DependencyError("Stored connection credentials could not be decrypted") from exc


def sqlalchemy_url(config: dict) -> URL:
    return URL.create("postgresql+psycopg2", username=config["username"], password=config["password"],
                      host=config["host"], port=config["port"], database=config["database"],
                      query={"sslmode": config["ssl_mode"]})
