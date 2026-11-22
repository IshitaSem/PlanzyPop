"""
PlanzyPop - Event Planning and Budget Management System
Academic Mini-Project for M.Sc. Computer Science (Data Science)

Core FastAPI Application Entry Point:
- Initializes FastAPI application with metadata and Swagger/OpenAPI docs.
- Configures Cross-Origin Resource Sharing (CORS) for frontend client.
- Mounts modular routers: Events, Expenses & Budget, Tasks & Timeline, Suggestions.
- Provides system root and health check endpoints.
"""

import sys
from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parent
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database import engine
import models
from routers import events, expenses, tasks, suggestions, spots, ai, auth

def init_db():
    models.Base.metadata.create_all(bind=engine)
    try:
        from sqlalchemy import inspect, text
        inspector = inspect(engine)
        if "events" in inspector.get_table_names():
            cols = [c["name"] for c in inspector.get_columns("events")]
            if "user_id" not in cols:
                with engine.begin() as conn:
                    conn.execute(text("ALTER TABLE events ADD COLUMN user_id VARCHAR(100)"))
    except Exception:
        pass

init_db()

app = FastAPI(
    title="PlanzyPop - Event Planning and Budget Management System",
    description=(
        "A student-friendly event planning and budget management REST API designed "
        "for affordable celebrations and small events in INR (₹)."
    ),
    version="1.0.0"
)

origins = [
    "https://planzy-pop.vercel.app",
    "https://planzy-pop.vercel.app/",
    "https://planzy-pop-ai.vercel.app",
    "https://planzy-pop-ai.vercel.app/",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:8443",
    "http://127.0.0.1:8443",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "*"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_origin_regex=r"https:\/\/.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)



@app.get("/", tags=["General"], summary="Root endpoint & service information")
def read_root():
    """
    Root endpoint: Provides a welcome message and system status.
    """
    return {
        "app": "PlanzyPop - Event Planning and Budget Management System",
        "status": "online",
        "currency": "INR",
        "message": "Welcome to the PlanzyPop Event Planning and Budget Management API!"
    }


@app.get("/health", tags=["General"], summary="Health check endpoint")
def health_check():
    """
    Health check endpoint: Verifies that the API service is active and responsive.
    """
    return {
        "status": "healthy",
        "service": "PlanzyPop Backend"
    }



app.include_router(events.router)
app.include_router(expenses.router)
app.include_router(tasks.router)
app.include_router(suggestions.router)
app.include_router(spots.router)
app.include_router(ai.router)
app.include_router(auth.router)



create_event = events.create_event
get_all_events = events.get_all_events
get_event_by_id = events.get_event_by_id
update_event = events.update_event
delete_event = events.delete_event

add_expense = expenses.add_expense
get_event_expenses = expenses.get_event_expenses
update_expense = expenses.update_expense
delete_expense = expenses.delete_expense
get_event_budget_summary = expenses.get_event_budget_summary
calculate_expense_split = expenses.calculate_expense_split
split_event_expenses = expenses.split_event_expenses

create_task = tasks.create_task
get_event_tasks = tasks.get_event_tasks
update_task = tasks.update_task
delete_task = tasks.delete_task
get_task_summary = tasks.get_task_summary

get_event_suggestions = suggestions.get_event_suggestions
generate_ai_plan = ai.generate_ai_plan
chat_with_assistant = ai.chat_with_assistant
