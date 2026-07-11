from types import SimpleNamespace
from unittest.mock import AsyncMock

import httpx
import openai
import pytest

from app.core.config import settings
from app.core.exceptions import ProviderError, UnsafeSQLError
from app.core.provider import LLMProvider
from app.services.validation_service import validate_sql


def completion(content: str):
    return SimpleNamespace(choices=[SimpleNamespace(message=SimpleNamespace(content=content))])


def client_with(side_effect):
    create = AsyncMock(side_effect=side_effect)
    return SimpleNamespace(chat=SimpleNamespace(completions=SimpleNamespace(create=create))), create


def timeout_error():
    return openai.APITimeoutError(request=httpx.Request("POST", "https://provider.test/chat"))


def rate_limit_error():
    response = httpx.Response(429, request=httpx.Request("POST", "https://provider.test/chat"))
    return openai.RateLimitError("rate limited", response=response, body={"error": {"message": "limited"}})


VALID = '{"sql":"SELECT id FROM users LIMIT 5","explanation":"Reads users","tables_used":["users"],"assumptions":[],"confidence":0.9}'


@pytest.fixture(autouse=True)
def provider_settings(monkeypatch):
    monkeypatch.setattr(settings, "LLM_MODEL", "primary")
    monkeypatch.setattr(settings, "LLM_FALLBACK_MODEL", "fallback")
    monkeypatch.setattr(settings, "LLM_MAX_RETRIES", 2)
    monkeypatch.setattr(settings, "LLM_RETRY_BASE_SECONDS", 0)


@pytest.mark.asyncio
async def test_successful_structured_response():
    client, create = client_with([completion(VALID)])
    result = await LLMProvider(client=client, sleep=AsyncMock()).generate([{"role": "user", "content": "query"}])
    assert result.sql.startswith("SELECT")
    assert result.tables_used == ["users"]
    assert create.await_args.kwargs["temperature"] == 0
    assert create.await_args.kwargs["response_format"] == {"type": "json_object"}


@pytest.mark.asyncio
async def test_malformed_json_is_rejected_without_retry():
    client, create = client_with([completion("not json")])
    with pytest.raises(ProviderError, match="malformed"):
        await LLMProvider(client=client, sleep=AsyncMock()).generate([])
    assert create.await_count == 1


@pytest.mark.asyncio
async def test_provider_timeout_exhausts_retries():
    client, create = client_with([timeout_error(), timeout_error(), timeout_error()])
    with pytest.raises(ProviderError, match="unavailable"):
        await LLMProvider(client=client, sleep=AsyncMock()).generate([])
    assert create.await_count == 3


@pytest.mark.asyncio
async def test_rate_limit_is_retryable():
    client, create = client_with([rate_limit_error(), completion(VALID)])
    result = await LLMProvider(client=client, sleep=AsyncMock()).generate([])
    assert result.confidence == 0.9
    assert create.await_count == 2


@pytest.mark.asyncio
async def test_primary_failure_then_fallback_success():
    client, create = client_with([timeout_error(), completion(VALID)])
    await LLMProvider(client=client, sleep=AsyncMock()).generate([])
    assert [call.kwargs["model"] for call in create.await_args_list] == ["primary", "fallback"]


@pytest.mark.asyncio
async def test_primary_and_fallback_both_fail():
    client, create = client_with([timeout_error(), timeout_error(), timeout_error()])
    with pytest.raises(ProviderError):
        await LLMProvider(client=client, sleep=AsyncMock()).generate([])
    assert [call.kwargs["model"] for call in create.await_args_list] == ["primary", "fallback", "fallback"]


@pytest.mark.asyncio
async def test_invalid_sql_from_provider_is_never_trusted():
    invalid = '{"sql":"DROP TABLE users","explanation":"bad","tables_used":["users"],"assumptions":[],"confidence":0.8}'
    client, _ = client_with([completion(invalid)])
    generated = await LLMProvider(client=client, sleep=AsyncMock()).generate([])
    with pytest.raises(UnsafeSQLError):
        validate_sql(generated.sql)
