from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from app.core.config import settings

# PostgreSQL connection configuration
connect_args = {
    "connect_timeout": 10,
}

engine = create_engine(
    settings.DATABASE_URL, 
    pool_pre_ping=True,
    pool_timeout=10,
    pool_recycle=3600,
    connect_args=connect_args
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()
