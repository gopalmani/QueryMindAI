from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.core.config import settings


class SQLGeneration(BaseModel):
    model_config = ConfigDict(extra="forbid")

    sql: str = Field(min_length=1, max_length=settings.MAX_SQL_LENGTH)
    explanation: str = Field(min_length=1, max_length=4000)
    tables_used: list[str] = Field(default_factory=list, max_length=100)
    assumptions: list[str] = Field(default_factory=list, max_length=50)
    confidence: float = Field(ge=0, le=1)

    @field_validator("sql", "explanation")
    @classmethod
    def strip_text(cls, value: str) -> str:
        return value.strip()
