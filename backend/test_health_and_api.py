"""
PlanzyPop - System Health, Database & Environment Verification Suite
Academic Mini-Project for M.Sc. Computer Science (Data Science)

Test Coverage:
1. Environment and dependencies (FastAPI, Uvicorn, Starlette, HTTPX, SQLAlchemy)
2. FastAPI application initialization and metadata
3. System root ('/') and health check ('/health') endpoints
4. SQLite database file structure and table schema inspection
5. SQLAlchemy ORM session lifecycle (add, commit, query, rollback, cleanup)
"""

import os
import sys
import sqlite3
from pathlib import Path
import pytest
from starlette.testclient import TestClient

BACKEND_DIR = Path(__file__).resolve().parent
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from main import app
import models
from database import engine, SessionLocal


def test_environment_dependencies():
    """Verify that all core backend packages are installed and report their versions."""
    import fastapi
    import uvicorn
    import starlette
    import httpx
    import sqlalchemy

    assert fastapi.__version__ is not None
    assert uvicorn.__version__ is not None
    assert starlette.__version__ is not None
    assert httpx.__version__ is not None
    assert sqlalchemy.__version__ is not None


def test_main_app_initialization():
    """Verify that the FastAPI application initializes with correct metadata."""
    assert app.title == "PlanzyPop - Event Planning and Budget Management System"
    assert app.version == "1.0.0"
    assert "INR" in app.description


def test_health_and_root_endpoints(client: TestClient):
    """Verify root endpoint and health check endpoint return 200 OK and valid JSON."""
    res_root = client.get("/")
    assert res_root.status_code == 200
    root_data = res_root.json()
    assert root_data.get("status") == "online"
    assert root_data.get("currency") == "INR"
    assert "PlanzyPop" in root_data.get("app")

    res_health = client.get("/health")
    assert res_health.status_code == 200
    health_data = res_health.json()
    assert health_data.get("status") == "healthy"
    assert health_data.get("service") == "PlanzyPop Backend"


def test_cors_headers_for_vercel(client: TestClient):
    """Verify that requests from https://planzy-pop.vercel.app receive proper CORS headers."""
    response = client.options(
        "/health",
        headers={
            "Origin": "https://planzy-pop.vercel.app",
            "Access-Control-Request-Method": "GET"
        }
    )
    assert response.status_code == 200
    assert response.headers.get("access-control-allow-origin") == "https://planzy-pop.vercel.app"


def test_ai_planner_endpoint(client: TestClient):
    """Verify POST /api/plan synthesizes a complete celebration plan."""
    payload = {
        "eventName": "Hostel Farewell Party",
        "eventType": "Farewell",
        "guests": 20,
        "budgetInr": 6000,
        "celebrationStyle": "Casual"
    }
    response = client.post("/api/plan", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "conceptTitle" in data
    assert "budgetAllocation" in data
    assert len(data["budgetAllocation"]) > 0
    assert "preparationTimeline" in data
    assert "checklist" in data
    assert data["source"] == "planzy_engine"


def test_ai_chat_endpoint(client: TestClient):
    """Verify POST /api/chat responds to party planning queries."""
    payload = {
        "message": "How do I split budget for a birthday party?",
        "eventContext": {"name": "Birthday Bash", "budget": 4000}
    }
    response = client.post("/api/chat", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "response" in data
    assert len(data["suggestions"]) > 0
    assert data["source"] == "planzy_assistant"


def test_sqlite_database_and_schema():
    """
    Verify that the SQLite database file exists and contains the required tables
    and column schema definitions.
    """
    models.Base.metadata.create_all(bind=engine)

    db_path = BACKEND_DIR / "planzypop.db"
    assert db_path.exists(), f"Database file not found at: {db_path}"

    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
    tables = [row[0] for row in cursor.fetchall()]

    assert "events" in tables, "'events' table missing from SQLite database"
    assert "expenses" in tables, "'expenses' table missing from SQLite database"
    assert "tasks" in tables, "'tasks' table missing from SQLite database"

    cursor.execute("PRAGMA table_info(events);")
    columns_info = cursor.fetchall()
    conn.close()

    found_columns = {col[1]: col[2] for col in columns_info}
    expected_fields = [
        "id",
        "event_name",
        "event_type",
        "event_date",
        "location",
        "guests",
        "budget",
        "celebration_style",
        "created_at",
    ]
    for field in expected_fields:
        assert field in found_columns, f"Missing expected column '{field}' in 'events' table"


def test_orm_session_transaction(db_session):
    """
    Verify that SQLAlchemy ORM session properly handles transactional operations:
    inserting, querying, refreshing, and deleting records.
    Uses the isolated test database session to avoid touching student data.
    """
    test_event = models.Event(
        event_name="Diagnostic Fresher Party",
        event_type="Fresher",
        event_date="2026-11-20",
        location="Campus Activity Hall",
        guests=25,
        budget=5000.0,
        celebration_style="Casual & Fun"
    )
    db_session.add(test_event)
    db_session.commit()
    db_session.refresh(test_event)

    assert test_event.id is not None
    assert test_event.event_name == "Diagnostic Fresher Party"

    queried = db_session.query(models.Event).filter(models.Event.id == test_event.id).first()
    assert queried is not None
    assert queried.guests == 25
    assert queried.budget == 5000.0

    db_session.delete(queried)
    db_session.commit()

    check_deleted = db_session.query(models.Event).filter(models.Event.id == test_event.id).first()
    assert check_deleted is None


if __name__ == "__main__":
    import pytest
    sys.exit(pytest.main([__file__, "-v"]))
