import asyncio
import json
import logging
import random
from functools import lru_cache
from typing import Awaitable, Callable

import openai
from openai import AsyncOpenAI
from pydantic import ValidationError

from app.core.config import settings
from app.core.exceptions import ProviderError
from app.schemas.llm_schema import SQLGeneration

logger = logging.getLogger(__name__)
Sleep = Callable[[float], Awaitable[None]]


def _is_retryable(exc: Exception) -> bool:
    if isinstance(exc, (openai.APITimeoutError, openai.APIConnectionError, openai.RateLimitError)):
        return True
    return isinstance(exc, openai.APIStatusError) and exc.status_code in {408, 409, 429, 500, 502, 503, 504}


@lru_cache
def get_llm_client() -> AsyncOpenAI:
    return AsyncOpenAI(
        base_url=settings.LLM_BASE_URL or None,
        api_key=settings.LLM_API_KEY,
        timeout=settings.LLM_TIMEOUT_SECONDS,
        max_retries=0,  # Retry policy is centralized below.
    )


class LLMProvider:
    def __init__(self, client: AsyncOpenAI | None = None, sleep: Sleep = asyncio.sleep):
        self.client = client or get_llm_client()
        self.sleep = sleep

    async def generate(self, messages: list[dict[str, str]]) -> SQLGeneration:
        models = [settings.LLM_MODEL]
        if settings.LLM_FALLBACK_MODEL and settings.LLM_FALLBACK_MODEL != settings.LLM_MODEL:
            models.extend([settings.LLM_FALLBACK_MODEL] * settings.LLM_MAX_RETRIES)
        else:
            models.extend([settings.LLM_MODEL] * settings.LLM_MAX_RETRIES)

        last_error: Exception | None = None
        for attempt, model in enumerate(models, start=1):
            try:
                response = await self.client.chat.completions.create(
                    model=model,
                    messages=messages,
                    temperature=0,
                    response_format={"type": "json_object"},
                )
                content = response.choices[0].message.content or ""
                return SQLGeneration.model_validate(json.loads(content))
            except (json.JSONDecodeError, ValidationError, KeyError, IndexError, TypeError) as exc:
                raise ProviderError("The LLM provider returned malformed structured output") from exc
            except Exception as exc:
                last_error = exc
                if not _is_retryable(exc) or attempt >= len(models):
                    break
                delay = settings.LLM_RETRY_BASE_SECONDS * (2 ** (attempt - 1))
                delay += random.uniform(0, max(delay * 0.25, 0.001))
                logger.warning(
                    "Retrying LLM provider request",
                    extra={"stage": "generation", "attempt": attempt, "provider": settings.LLM_PROVIDER,
                           "model": model},
                )
                await self.sleep(delay)
        raise ProviderError("The configured LLM provider is unavailable") from last_error


@lru_cache
def get_llm_provider() -> LLMProvider:
    return LLMProvider()
