from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field, field_validator

from app.core.config import settings


class QueryRequest(BaseModel):
    question: str = Field(min_length=1, max_length=settings.MAX_QUESTION_LENGTH)

    @field_validator("question")
    @classmethod
    def meaningful_question(cls, value: str) -> str:
        value = value.strip()
        if not value or not any(char.isalnum() for char in value):
            raise ValueError("Question must contain letters or numbers")
        return value


class QueryMetadata(BaseModel):
    attempts: int
    duration_ms: int
    verified_example_used: bool
    request_id: str | None = None


class QueryResponse(BaseModel):
    sql: str
    columns: list[str]
    rows: list[dict[str, Any]]
    row_count: int
    explanation: str
    warnings: list[str] = []
    metadata: QueryMetadata


class DBConfig(BaseModel):
    host: str = Field(min_length=1, max_length=253, pattern=r"^[A-Za-z0-9._:-]+$")
    port: int = Field(ge=1, le=65535)
    database: str = Field(min_length=1, max_length=63, pattern=r"^[A-Za-z0-9_-]+$")
    user: str = Field(min_length=1, max_length=63)
    password: str = Field(min_length=1, max_length=512)


class ConnectQueryRequest(BaseModel):
    db_config: DBConfig
    question: str = Field(min_length=1, max_length=settings.MAX_QUESTION_LENGTH)


class VerifiedExampleRequest(BaseModel):
    question: str = Field(min_length=1, max_length=settings.MAX_QUESTION_LENGTH)
    sql: str = Field(min_length=1, max_length=settings.MAX_SQL_LENGTH)
    connection_key: str = Field(default=settings.DEFAULT_CONNECTION_KEY, min_length=1, max_length=128)
    reviewer: str | None = Field(default=None, max_length=128)
    source: str | None = Field(default="user", max_length=128)


class VerifiedExampleResponse(BaseModel):
    id: int
    status: str
    message: str
    created_at: datetime


GoldenRecordRequest = VerifiedExampleRequest
