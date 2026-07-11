from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.core.config import settings

connect_args = ({"connect_timeout": settings.DATABASE_CONNECT_TIMEOUT_SECONDS}
                if settings.DATABASE_URL.startswith("postgresql") else {})
engine = create_engine(settings.DATABASE_URL, pool_pre_ping=True, pool_recycle=300, connect_args=connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
