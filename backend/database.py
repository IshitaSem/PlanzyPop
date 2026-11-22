"""
PlanzyPop - Database Configuration
Academic Mini-Project for M.Sc. Computer Science (Data Science)

Database Connection and Session Management:
Supports Neon PostgreSQL with connection pooling, pre-ping reconnection,
and graceful fallback to SQLite for local development and testing.
"""

import os
from pathlib import Path
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

# Load environment variables from backend/.env and project root .env
BACKEND_DIR = Path(__file__).resolve().parent
load_dotenv(BACKEND_DIR / ".env", override=True)
load_dotenv(BACKEND_DIR.parent / ".env", override=True)

raw_db_url = os.getenv("DATABASE_URL") or os.getenv("NEON_DATABASE_URL") or ""

if raw_db_url and not raw_db_url.strip().startswith("#"):
    db_url = raw_db_url.strip()
    # Normalize legacy postgres:// to postgresql:// for SQLAlchemy 1.4+ / 2.0+
    if db_url.startswith("postgres://"):
        db_url = db_url.replace("postgres://", "postgresql://", 1)

    # Configure Neon PostgreSQL connection engine
    # pool_pre_ping=True: Health-checks stale/idle serverless connections before query execution
    # pool_recycle=300: Recycles connection objects after 5 minutes to prevent SSL timeout dropouts
    # pool_size=10, max_overflow=20: Handles concurrent web requests reliably
    engine = create_engine(
        db_url,
        pool_pre_ping=True,
        pool_recycle=300,
        pool_size=10,
        max_overflow=20,
    )
    IS_POSTGRES = True
else:
    # Fallback to local SQLite when DATABASE_URL is not set
    SQLALCHEMY_DATABASE_URL = f"sqlite:///{BACKEND_DIR / 'planzypop.db'}"
    engine = create_engine(
        SQLALCHEMY_DATABASE_URL,
        connect_args={"check_same_thread": False}
    )
    IS_POSTGRES = False

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    """
    Yields an independent database session for an incoming request and
    guarantees that the session is closed when the request is completed.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
