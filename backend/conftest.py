"""
PlanzyPop - Shared Pytest Configuration and Test Fixtures
Academic Mini-Project for M.Sc. Computer Science (Data Science)

This module provides test isolation fixtures:
- Creates an isolated temporary SQLite database for testing.
- Overrides the FastAPI get_db dependency so tests NEVER modify planzypop.db.
- Provides a reusable Starlette/FastAPI TestClient fixture.
- Automatically cleans up test artifacts upon test session completion.
"""

import os
import sys
from pathlib import Path
import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from starlette.testclient import TestClient

BACKEND_DIR = Path(__file__).resolve().parent
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from database import Base, get_db
import models
from main import app

TEST_DB_FILE = BACKEND_DIR / "test_planzypop_isolated.db"
TEST_DATABASE_URL = f"sqlite:///{TEST_DB_FILE}"

test_engine = create_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False}
)

TestingSessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=test_engine
)


@pytest.fixture(scope="session", autouse=True)
def setup_test_environment():
    """
    Session-level fixture that prepares the isolated test database
    and overrides FastAPI's get_db dependency.
    Guarantees production 'planzypop.db' and student records remain 100% untouched.
    """
    Base.metadata.drop_all(bind=test_engine)
    Base.metadata.create_all(bind=test_engine)

    def override_get_db():
        db = TestingSessionLocal()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = override_get_db

    yield

    app.dependency_overrides.clear()
    Base.metadata.drop_all(bind=test_engine)
    test_engine.dispose()
    if TEST_DB_FILE.exists():
        try:
            TEST_DB_FILE.unlink()
        except OSError:
            pass


@pytest.fixture
def client():
    """
    Yields a TestClient instance bound to the FastAPI application.
    """
    with TestClient(app) as test_client:
        yield test_client


@pytest.fixture
def db_session():
    """
    Yields an independent SQLAlchemy session bound to the isolated test database.
    """
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()
