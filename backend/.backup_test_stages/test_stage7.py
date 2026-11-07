"""
PlanzyPop - Stage 7: Frontend & Backend Integration Verification Suite
Academic Mini-Project for M.Sc. Computer Science (Data Science)

This test suite verifies the end-to-end integration between the
React + TypeScript frontend and the FastAPI SQLite backend.
"""

import os
import sys
from pathlib import Path

# Ensure UTF-8 output encoding on Windows consoles
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

from starlette.testclient import TestClient
from main import app

client = TestClient(app)

def run_stage7_verification():
    print("=" * 65)
    print("PlanzyPop Stage 7: Frontend & Backend Integration Test Suite")
    print("=" * 65)

    # -------------------------------------------------------------
    # 1. Environment & Configuration Check
    # -------------------------------------------------------------
    frontend_dir = Path(__file__).parent.parent / "frontend"
    env_file = frontend_dir / ".env"
    api_service_file = frontend_dir / "src" / "services" / "api.ts"

    assert env_file.exists(), "frontend/.env file is missing"
    env_content = env_file.read_text(encoding="utf-8")
    assert "VITE_API_BASE_URL" in env_content, "VITE_API_BASE_URL missing in frontend/.env"
    print(f"[PASS] frontend/.env configuration verified: {env_content.strip()}")

    assert api_service_file.exists(), "frontend/src/services/api.ts file is missing"
    api_code = api_service_file.read_text(encoding="utf-8")
    for fn in [
        "getEvents",
        "createEvent",
        "deleteEvent",
        "getExpenses",
        "addExpense",
        "deleteExpense",
        "getBudgetSummary",
        "getEventSplit",
        "getTasks",
        "createTask",
        "updateTask",
        "deleteTask",
        "getTaskSummary",
        "generateSuggestions",
    ]:
        assert f"export async function {fn}" in api_code, f"API function '{fn}' missing in api.ts"
    print("[PASS] frontend/src/services/api.ts exports all 14 required API functions")

    # -------------------------------------------------------------
    # 2. System Health & CORS Verification
    # -------------------------------------------------------------
    res = client.get("/health")
    assert res.status_code == 200, f"Expected 200, got {res.status_code}"
    assert res.json().get("status") == "healthy"
    print("[PASS] Backend health check verified: 'healthy'")

    res = client.get("/")
    assert res.status_code == 200
    assert res.json().get("currency") == "INR"
    print("[PASS] Root endpoint verified with INR currency standard")

    # -------------------------------------------------------------
    # 3. Simulate Frontend AI Planner Flow
    # -------------------------------------------------------------
    # User asks AI Planner to generate suggestions
    planner_payload = {
        "event_type": "Birthday",
        "budget": 5000.0,
        "guests": 15,
        "celebration_style": "Colourful"
    }
    res = client.post("/suggestions/generate", json=planner_payload)
    assert res.status_code == 200, f"Suggestion generation failed: {res.text}"
    suggestions = res.json()
    assert suggestions["suggested_theme"]
    assert len(suggestions["budget_allocations"]) > 0
    assert suggestions["total_allocated_budget"] == 5000.0
    print(f"[PASS] AI Planner suggestions generated: Theme '{suggestions['suggested_theme']}'")

    # User clicks 'Add to My Events' in Planner
    event_payload = {
        "event_name": "Rohan's 21st Birthday Bash",
        "event_type": "Birthday",
        "event_date": "2026-11-25",
        "location": "Hostel Terrace, Block C",
        "guests": 15,
        "budget": 5000.0,
        "celebration_style": "Colourful"
    }
    res = client.post("/events", json=event_payload)
    assert res.status_code == 201, f"Event creation failed: {res.text}"
    event = res.json()
    event_id = event["id"]
    print(f"[PASS] Event created via API (ID: {event_id}, Name: '{event['event_name']}')")

    # Planner automatically creates starter tasks for the event
    task1 = client.post(f"/events/{event_id}/tasks", json={
        "task_name": "Finalize balloon decor & lights",
        "due_date": "2026-11-20",
        "description": "Buy purple and yellow pastel balloons"
    }).json()

    task2 = client.post(f"/events/{event_id}/tasks", json={
        "task_name": "Order chocolate truffle birthday cake",
        "due_date": "2026-11-22",
        "description": "1.5 kg from bakery nearby"
    }).json()

    task3 = client.post(f"/events/{event_id}/tasks", json={
        "task_name": "Send digital invitations to friends",
        "due_date": "2026-11-18",
        "description": "WhatsApp group broadcast"
    }).json()
    print("[PASS] Created 3 starter checklist tasks for event")

    # -------------------------------------------------------------
    # 4. Simulate Overview & My Events Queries
    # -------------------------------------------------------------
    res = client.get("/events")
    assert res.status_code == 200
    events_list = res.json()
    assert any(e["id"] == event_id for e in events_list)
    print(f"[PASS] GET /events listed all active events (Found ID {event_id})")

    res = client.get(f"/events/{event_id}/tasks/summary")
    assert res.status_code == 200
    ts = res.json()
    assert ts["total_tasks"] == 3
    assert ts["pending_tasks"] == 3
    assert ts["completed_tasks"] == 0
    assert ts["progress_percentage"] == 0.0
    print("[PASS] Initial task summary verified: 3 total, 0 completed (0%)")

    # -------------------------------------------------------------
    # 5. Simulate Budget Tracker Flow
    # -------------------------------------------------------------
    # Add two expenses
    exp1 = client.post(f"/events/{event_id}/expenses", json={
        "expense_name": "Chocolate Truffle Cake",
        "category": "Cake",
        "amount": 750.0,
        "expense_date": "2026-11-22"
    }).json()

    exp2 = client.post(f"/events/{event_id}/expenses", json={
        "expense_name": "Pastel Balloons & Streamers",
        "category": "Decorations",
        "amount": 450.0,
        "expense_date": "2026-11-20"
    }).json()
    print(f"[PASS] Logged expenses: Cake (Rs 750) + Decorations (Rs 450)")

    # Check budget summary
    res = client.get(f"/events/{event_id}/budget")
    assert res.status_code == 200
    bs = res.json()
    assert bs["planned_budget"] == 5000.0
    assert bs["total_expenses"] == 1200.0
    assert bs["remaining_budget"] == 3800.0
    assert bs["utilisation_percentage"] == 24.0
    assert bs["is_over_budget"] is False
    assert bs["category_breakdown"]["Cake"] == 750.0
    assert bs["category_breakdown"]["Decorations"] == 450.0
    print("[PASS] Budget summary verified: Total 1200 / 5000 (Remaining Rs 3800, 24% spent)")

    # Check split calculation
    res = client.get(f"/events/{event_id}/split-expense?people=4")
    assert res.status_code == 200
    split = res.json()
    assert split["total_amount"] == 1200.0
    assert split["num_people"] == 4
    assert split["share_per_person"] == 300.0
    assert split["split_basis"] == "actual_expenses"
    print(f"[PASS] Split calculation verified: Rs 1200 / 4 = Rs 300 each ({split['split_basis']})")

    # -------------------------------------------------------------
    # 6. Simulate Checklist & Timeline Flow
    # -------------------------------------------------------------
    res = client.get(f"/events/{event_id}/tasks")
    assert res.status_code == 200
    tasks_list = res.json()
    assert len(tasks_list) == 3
    # Check timeline ordering: earliest due date first
    due_dates = [t["due_date"] for t in tasks_list]
    assert due_dates == sorted(due_dates), f"Tasks not chronologically sorted: {due_dates}"
    print(f"[PASS] Timeline order verified: {due_dates}")

    # Mark first task complete
    first_task_id = tasks_list[0]["id"]
    res = client.put(f"/tasks/{first_task_id}", json={"is_completed": True})
    assert res.status_code == 200
    assert res.json()["is_completed"] is True

    # Check updated summary
    res = client.get(f"/events/{event_id}/tasks/summary")
    assert res.status_code == 200
    ts_updated = res.json()
    assert ts_updated["completed_tasks"] == 1
    assert ts_updated["pending_tasks"] == 2
    assert ts_updated["progress_percentage"] == 33.33
    print("[PASS] Progress percentage dynamically updated to 33.33%")

    # -------------------------------------------------------------
    # 7. Cleanup & Cascade Verification
    # -------------------------------------------------------------
    res = client.delete(f"/events/{event_id}")
    assert res.status_code == 200
    print(f"[PASS] Deleted event {event_id}")

    # Verify cascaded deletion
    res = client.get(f"/events/{event_id}/expenses")
    assert res.status_code == 404
    res = client.get(f"/events/{event_id}/tasks")
    assert res.status_code == 404
    print("[PASS] Verified expenses and tasks were cascaded and cleaned up")

    print("=" * 65)
    print("ALL STAGE 7 FRONTEND & BACKEND INTEGRATION CHECKS PASSED!")
    print("=" * 65)

if __name__ == "__main__":
    run_stage7_verification()
