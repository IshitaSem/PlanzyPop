"""
PlanzyPop - Database Configuration
Academic Mini-Project for M.Sc. Computer Science (Data Science)

Stage 2: SQLite Connection and Session Management
This module sets up our connection to the SQLite database using SQLAlchemy ORM.
"""

from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

# 1. Database Connection URL
# In your viva:
# SQLite is a lightweight, serverless relational database engine stored as a single file.
# "sqlite:///./planzypop.db" instructs SQLAlchemy to store the database in a file named planzypop.db
# located in the current working directory.
SQLALCHEMY_DATABASE_URL = "sqlite:///./planzypop.db"

# 2. Database Engine
# The engine is the core interface that manages connections to the SQLite database.
# "check_same_thread": False is required for SQLite in FastAPI because FastAPI handles
# API requests concurrently across multiple threads, and SQLite by default restricts
# communication to the single thread that created the connection.
engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False}
)

# 3. Session Maker
# Each call to SessionLocal creates an isolated database session (a workspace for executing queries).
# autocommit=False ensures transactions are explicitly committed when operations succeed.
# autoflush=False prevents sending incomplete changes to the database before we are ready.
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# 4. Declarative Base
# Base is the parent class from which all database models (tables) inherit.
# SQLAlchemy uses it to register and map Python classes to database tables.
Base = declarative_base()


# 5. Dependency for API endpoints (will be used in Stage 3)
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
