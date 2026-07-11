import asyncio
from functools import lru_cache
from typing import Protocol

from app.core.config import settings
from app.core.exceptions import DependencyError


class EmbeddingModel(Protocol):
    def encode(self, sentences, **kwargs): ...


@lru_cache
def get_embedding_model() -> EmbeddingModel:
    if settings.EMBEDDING_PROVIDER != "local":
        raise DependencyError("The configured embedding provider is not supported")
    try:
        from sentence_transformers import SentenceTransformer
    except ImportError as exc:
        raise DependencyError(
            "Local embeddings require dependencies from requirements-embeddings.txt"
        ) from exc
    return SentenceTransformer(settings.EMBEDDING_MODEL)


async def embed_text(value: str) -> list[float]:
    model = get_embedding_model()
    vector = await asyncio.to_thread(model.encode, value, normalize_embeddings=True)
    return [float(item) for item in vector]


def as_pgvector(vector: list[float]) -> str:
    return "[" + ",".join(map(str, vector)) + "]"
