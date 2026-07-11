import logging
import time
import uuid

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy import text

from app.api.v1.endpoints.query import router as query_router
from app.core.config import settings
from app.core.exceptions import QueryMindError
from app.core.logger import configure_logging, request_id_context
from app.db.session import engine

configure_logging()
logger = logging.getLogger(__name__)
app = FastAPI(title="QueryMindAI API", version="0.1.0")
app.add_middleware(CORSMiddleware, allow_origins=settings.CORS_ALLOW_ORIGINS,
                   allow_credentials=True, allow_methods=["*"], allow_headers=["*"])
app.include_router(query_router, prefix="/api/v1", tags=["analytics"])


@app.middleware("http")
async def request_context(request: Request, call_next):
    request_id = request.headers.get("X-Request-ID", str(uuid.uuid4()))[:128]
    token = request_id_context.set(request_id)
    started = time.perf_counter()
    try:
        response = await call_next(request)
        response.headers["X-Request-ID"] = request_id
        return response
    finally:
        logger.info("Request completed", extra={"route": request.url.path,
                    "duration_ms": round((time.perf_counter() - started) * 1000)})
        request_id_context.reset(token)


@app.exception_handler(QueryMindError)
async def application_error(_: Request, exc: QueryMindError):
    return JSONResponse(status_code=exc.status_code,
                        content={"error": {"code": exc.code, "message": exc.message,
                                           "request_id": request_id_context.get()}})


@app.exception_handler(Exception)
async def unexpected_error(_: Request, exc: Exception):
    logger.exception("Unexpected application error")
    return JSONResponse(status_code=500, content={"error": {"code": "internal_error",
                        "message": "An unexpected error occurred", "request_id": request_id_context.get()}})


@app.get("/health")
def health():
    return {"status": "ok", "service": "querymind-api"}


@app.get("/ready")
def ready():
    try:
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))
        return {"status": "ready", "database": "ok"}
    except Exception:
        return JSONResponse(status_code=503, content={"status": "not_ready", "database": "unavailable"})
