from functools import lru_cache
from typing import Annotated, Literal

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, NoDecode, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore", case_sensitive=True)

    APP_ENV: Literal["development", "test", "production"] = "development"
    LOG_LEVEL: str = "INFO"
    DATABASE_URL: str = "postgresql+psycopg2://querymind:querymind@localhost:5432/querymind"
    LLM_PROVIDER: Literal["ollama", "groq", "openai"] = "ollama"
    LLM_BASE_URL: str | None = "http://ollama:11434/v1"
    LLM_API_KEY: str = "ollama"
    LLM_MODEL: str = "sqlcoder"
    LLM_FALLBACK_MODEL: str | None = None
    EMBEDDING_PROVIDER: Literal["local"] = "local"
    EMBEDDING_MODEL: str = "sentence-transformers/all-MiniLM-L6-v2"
    ENABLE_SCHEMA_RAG: bool = False
    ENABLE_GOLDEN_RECORDS: bool = False
    ENABLE_EXTERNAL_CONNECTIONS: bool = False
    MAX_QUESTION_LENGTH: int = Field(1000, ge=1, le=10000)
    MAX_SQL_LENGTH: int = Field(20000, ge=100, le=100000)
    MAX_QUERY_ROWS: int = Field(100, ge=1, le=10000)
    STATEMENT_TIMEOUT_MS: int = Field(10000, ge=100, le=300000)
    LLM_TIMEOUT_SECONDS: float = Field(30, ge=1, le=300)
    LLM_MAX_RETRIES: int = Field(2, ge=0, le=2)
    LLM_RETRY_BASE_SECONDS: float = Field(0.5, ge=0, le=30)
    DATABASE_CONNECT_TIMEOUT_SECONDS: int = Field(5, ge=1, le=30)
    QUERY_MAX_ATTEMPTS: int = Field(3, ge=1, le=5)
    GOLDEN_RECORD_SIMILARITY_THRESHOLD: float = Field(0.70, ge=0, le=1)
    DEFAULT_CONNECTION_KEY: str = "demo_ecom_db"
    CORS_ALLOW_ORIGINS: Annotated[list[str], NoDecode] = ["http://localhost:4028"]

    @field_validator("CORS_ALLOW_ORIGINS", mode="before")
    @classmethod
    def parse_origins(cls, value):
        if isinstance(value, str) and not value.lstrip().startswith("["):
            return [item.strip() for item in value.split(",") if item.strip()]
        return value


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
