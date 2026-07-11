from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field, model_validator


SSLMode = Literal["require", "verify-ca", "verify-full"]


class ConnectionCreate(BaseModel):
    name: str = Field(min_length=1, max_length=128)
    connection_string: str | None = Field(default=None, min_length=1, max_length=2048)
    host: str | None = Field(default=None, max_length=253)
    port: int = Field(default=5432, ge=1, le=65535)
    database: str | None = Field(default=None, min_length=1, max_length=128)
    username: str | None = Field(default=None, min_length=1, max_length=128)
    password: str | None = Field(default=None, min_length=1, max_length=512)
    ssl_mode: SSLMode = "require"

    @model_validator(mode="after")
    def one_input_mode(self):
        structured = all([self.host, self.database, self.username, self.password])
        if bool(self.connection_string) == bool(structured):
            raise ValueError("Provide either a connection string or all structured connection fields")
        return self


class ConnectionResponse(BaseModel):
    id: str
    name: str
    database_type: str
    host: str
    database: str
    username: str
    ssl_mode: str
    status: str
    last_connected_at: datetime | None
    created_at: datetime
    warnings: list[str] = []


class ConnectionTestResponse(BaseModel):
    status: str
    read_only: bool | None
    warnings: list[str]


class SchemaResponse(BaseModel):
    connection_id: str
    schema_hash: str
    metadata: dict
    updated_at: datetime
