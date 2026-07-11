from sqlalchemy import URL, create_engine
from sqlalchemy.orm import sessionmaker

from app.core.config import settings


def get_dynamic_session(db_config):
    url = URL.create("postgresql+psycopg2", username=db_config["user"], password=db_config["password"],
                     host=db_config["host"], port=db_config["port"], database=db_config["database"])
    engine = create_engine(url, connect_args={"connect_timeout": settings.DATABASE_CONNECT_TIMEOUT_SECONDS}, pool_pre_ping=True)
    return sessionmaker(bind=engine)()
