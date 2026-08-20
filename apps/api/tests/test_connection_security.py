import socket
from unittest.mock import patch

import pytest
from cryptography.fernet import Fernet

from app.connections.schemas import ConnectionCreate
from app.connections.security import (_fernet, decrypt_config, encrypt_config, normalize_connection_input,
                                      validate_public_host)
from app.core.config import settings
from app.core.exceptions import ConnectionSecurityError, DependencyError


def test_structured_connection_input():
    request = ConnectionCreate(name="Analytics", host="db.example.com", database="analytics",
                               username="reader", password="secret", ssl_mode="require")
    config = normalize_connection_input(request)
    assert config == {"host":"db.example.com","port":5432,"database":"analytics","username":"reader","password":"secret","ssl_mode":"require"}


def test_postgresql_connection_string_parsing():
    request = ConnectionCreate(name="Analytics", connection_string="postgresql://reader:secret@db.example.com:5432/analytics?sslmode=verify-full")
    config = normalize_connection_input(request)
    assert config["host"] == "db.example.com" and config["ssl_mode"] == "verify-full"


@pytest.mark.parametrize("url", ["mysql://u:p@db.example.com/db", "sqlite:///tmp/db"])
def test_non_postgresql_scheme_rejected(url):
    with pytest.raises(ConnectionSecurityError): normalize_connection_input(ConnectionCreate(name="x", connection_string=url))


@pytest.mark.parametrize("host", ["localhost", "127.0.0.1", "10.1.2.3", "172.16.1.2", "192.168.1.5", "169.254.169.254", "::1", "fc00::1"])
def test_private_local_and_link_local_hosts_rejected(host, monkeypatch):
    monkeypatch.setattr(settings, "ALLOW_PRIVATE_DATABASE_HOSTS", False)
    with pytest.raises(ConnectionSecurityError): validate_public_host(host)


def test_public_dns_host_accepted(monkeypatch):
    monkeypatch.setattr(settings, "ALLOW_PRIVATE_DATABASE_HOSTS", False)
    answer = [(socket.AF_INET, socket.SOCK_STREAM, 6, "", ("203.0.113.10", 5432))]
    # TEST-NET is reserved and correctly blocked; use a real globally routable-shaped address.
    answer[0] = (socket.AF_INET, socket.SOCK_STREAM, 6, "", ("8.8.8.8", 5432))
    with patch("app.connections.security.socket.getaddrinfo", return_value=answer):
        assert validate_public_host("db.example.com") == ["8.8.8.8"]


def test_encryption_round_trip_and_wrong_key_failure(monkeypatch):
    first = Fernet.generate_key().decode(); second = Fernet.generate_key().decode()
    monkeypatch.setattr(settings, "CONNECTION_ENCRYPTION_KEY", first); _fernet.cache_clear()
    encrypted = encrypt_config({"host":"db.example.com","password":"secret"})
    assert "secret" not in encrypted and decrypt_config(encrypted)["password"] == "secret"
    monkeypatch.setattr(settings, "CONNECTION_ENCRYPTION_KEY", second); _fernet.cache_clear()
    with pytest.raises(DependencyError): decrypt_config(encrypted)
    _fernet.cache_clear()
