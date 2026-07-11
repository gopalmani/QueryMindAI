from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field

from app.core.config import settings


class QueryGenerateRequest(BaseModel):
    connection_id: str = Field(min_length=1, max_length=64)
    question: str = Field(min_length=1, max_length=settings.MAX_QUESTION_LENGTH)


class QueryDraftResponse(BaseModel):
    draft_id: str
    connection_id: str
    sql: str
    explanation: str
    assumptions: list[str]
    warnings: list[str]
    confidence: float
    expires_at: datetime


class QueryExecuteRequest(BaseModel):
    draft_id: str = Field(min_length=1, max_length=64)


class QueryExecutionResponse(BaseModel):
    query_id: int
    sql: str
    columns: list[str]
    rows: list[dict[str, Any]]
    row_count: int
    duration_ms: int
    warnings: list[str]


class QueryHistoryItem(BaseModel):
    id: int
    connection_id: str | None
    question: str
    sql: str
    execution_status: str | None
    row_count: int
    duration_ms: int
    warnings: list[str]
    created_at: datetime
