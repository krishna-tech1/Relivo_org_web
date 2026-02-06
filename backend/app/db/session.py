from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from sqlalchemy.pool import NullPool
from app.core.config import settings

engine = create_engine(
    settings.DATABASE_URL,
    poolclass=NullPool,
    connect_args={
        "connect_timeout": 60,
    }
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()
