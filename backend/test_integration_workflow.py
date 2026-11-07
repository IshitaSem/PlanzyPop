"""
PlanzyPop - End-to-End Integration & Workflow Audit Verification Suite
Academic Mini-Project for M.Sc. Computer Science (Data Science)

Test Coverage:
1. Frontend contracts & configuration (frontend/.env, frontend/src/services/api.ts)
2. System health, status, and currency standard (GET /health, GET /)
3. End-to-end user lifecycle flow:
   - AI Planner suggestion generation
   - Event creation & starter checklist generation
   - Expense tracking, budget summary & split calculations
   - Timeline sorting, task status toggling & dynamic progress %
   - Event deletion and cascade cleanup
4. Stage 8 Audit of 11 Core Functional Workflows:
   - Workflow 1: Fetch events
   - Workflow 2: Create an event
   - Workflow 3: Fetch an individual event
   - Workflow 4: Update an event
   - Workflow 5: Delete an event
   - Workflow 6: Generate suggestions
   - Workflow 7: Add and delete expenses
   - Workflow 8: Fetch budget summary
   - Workflow 9: Calculate expense splits (event-based & custom amount)
   - Workflow 10: Create, update, and delete tasks
   - Workflow 11: Fetch task summary
"""

import sys
from pathlib import Path
import pytest
from starlette.testclient import TestClient

BACKEND_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = BACKEND_DIR.parent
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))


def test_frontend_contracts_and_config():
    """Verify frontend environment configuration and TypeScript API service contract."""
    frontend_dir = PROJECT_ROOT / "frontend"
    env_file = frontend_dir / ".env"
    api_service_file = frontend_dir / "src" / "services" / "api.ts"

    assert env_file.exists(), "frontend/.env file is missing"
    assert "VITE_API_BASE_URL" in env_file.read_text(encoding="utf-8")

    assert api_service_file.exists(), "frontend/src/services/api.ts file is missing"
    api_code = api_service_file.read_text(encoding="utf-8")
    expected_functions = [
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
    ]
    for fn in expected_functions:
        assert f"export async function {fn}" in api_code, f"API function '{fn}' missing in api.ts"


def test_system_health_and_root(client: TestClient):
    """Verify backend health and currency standardization."""
    res_health = client.get("/health")
    assert res_health.status_code == 200
    assert res_health.json().get("status") == "healthy"

    res_root = client.get("/")
    assert res_root.status_code == 200
    assert res_root.json().get("currency") == "INR"


def test_end_to_end_user_journey(client: TestClient):
    """
    Simulate full user interaction:
    1. User asks AI Planner for suggestions.
    2. User adds event from suggestions.
    3. User creates starter tasks.
    4. User logs expenses and checks budget & split.
    5. User marks tasks complete and verifies dynamic progress percentage.
    6. User deletes event and verifies cascade deletion.
    """
    # 1. AI Planner suggestions
    res_sugg = client.post("/suggestions/generate", json={
        "event_type": "Birthday",
        "budget": 5000.0,
        "guests": 15,
        "celebration_style": "Colourful"
    })
    assert res_sugg.status_code == 200
    sugg = res_sugg.json()
    assert sugg["suggested_theme"]
    assert sugg["total_allocated_budget"] == 5000.0

    # 2. Add event
    res_ev = client.post("/events", json={
        "event_name": "Rohan's 21st Birthday Bash",
        "event_type": "Birthday",
        "event_date": "2026-11-25",
        "location": "Hostel Terrace, Block C",
        "guests": 15,
        "budget": 5000.0,
        "celebration_style": "Colourful"
    })
    assert res_ev.status_code == 201
    event_id = res_ev.json()["id"]

    # 3. Create starter tasks
    client.post(f"/events/{event_id}/tasks", json={"task_name": "Finalize balloon decor", "due_date": "2026-11-20"})
    client.post(f"/events/{event_id}/tasks", json={"task_name": "Order cake", "due_date": "2026-11-22"})
    client.post(f"/events/{event_id}/tasks", json={"task_name": "Send invitations", "due_date": "2026-11-18"})

    # 4. Check initial task summary
    ts1 = client.get(f"/events/{event_id}/tasks/summary").json()
    assert ts1["total_tasks"] == 3
    assert ts1["completed_tasks"] == 0
    assert ts1["progress_percentage"] == 0.0

    # 5. Log expenses
    client.post(f"/events/{event_id}/expenses", json={"expense_name": "Cake", "category": "Cake", "amount": 750.0})
    client.post(f"/events/{event_id}/expenses", json={"expense_name": "Decorations", "category": "Decorations", "amount": 450.0})

    # Check budget summary
    b_sum = client.get(f"/events/{event_id}/budget").json()
    assert b_sum["planned_budget"] == 5000.0
    assert b_sum["total_expenses"] == 1200.0
    assert b_sum["remaining_budget"] == 3800.0
    assert b_sum["utilisation_percentage"] == 24.0

    # Check split: 1200 / 4 = 300 each
    split = client.get(f"/events/{event_id}/split-expense?people=4").json()
    assert split["share_per_person"] == 300.0
    assert split["split_basis"] == "actual_expenses"

    # 6. Timeline order check
    tasks_res = client.get(f"/events/{event_id}/tasks").json()
    assert len(tasks_res) == 3
    dates = [t["due_date"] for t in tasks_res]
    assert dates == sorted(dates)

    # Complete first task and check progress
    client.put(f"/tasks/{tasks_res[0]['id']}", json={"is_completed": True})
    ts2 = client.get(f"/events/{event_id}/tasks/summary").json()
    assert ts2["completed_tasks"] == 1
    assert ts2["progress_percentage"] == 33.33

    # 7. Delete event & verify cascade cleanup
    assert client.delete(f"/events/{event_id}").status_code == 200
    assert client.get(f"/events/{event_id}").status_code == 404
    assert client.get(f"/events/{event_id}/expenses").status_code == 404
    assert client.get(f"/events/{event_id}/tasks").status_code == 404


def test_stage8_11_audit_workflows(client: TestClient):
    """Systematically audit all 11 core functional workflows in sequential order."""
    # Workflow 1: Fetch events
    res = client.get("/events")
    assert res.status_code == 200

    # Workflow 2: Create an event
    res = client.post("/events", json={
        "event_name": "Audit Test Celebration",
        "event_type": "Birthday",
        "event_date": "2026-11-25",
        "location": "Indiranagar Rooftop",
        "guests": 12,
        "budget": 4500.0,
        "celebration_style": "Casual"
    })
    assert res.status_code == 201
    event_id = res.json()["id"]

    # Workflow 3: Fetch individual event
    res = client.get(f"/events/{event_id}")
    assert res.status_code == 200
    assert res.json()["budget"] == 4500.0

    # Workflow 4: Update an event
    res = client.put(f"/events/{event_id}", json={
        "event_name": "Updated Audit Celebration",
        "budget": 5200.0,
        "guests": 15
    })
    assert res.status_code == 200
    assert res.json()["budget"] == 5200.0

    # Workflow 6: Generate suggestions
    res = client.post("/suggestions/generate", json={
        "event_type": "Birthday",
        "budget": 5000.0,
        "guests": 15,
        "celebration_style": "Aesthetic"
    })
    assert res.status_code == 200

    # Workflow 7a & 7b: Add expenses
    exp1 = client.post(f"/events/{event_id}/expenses", json={"expense_name": "Cake", "category": "Cake", "amount": 850.0}).json()
    exp2 = client.post(f"/events/{event_id}/expenses", json={"expense_name": "Lights", "category": "Decorations", "amount": 400.0}).json()

    # Workflow 8: Fetch budget summary
    b = client.get(f"/events/{event_id}/budget").json()
    assert b["total_expenses"] == 1250.0
    assert b["remaining_budget"] == 3950.0

    # Workflow 9a & 9b: Calculate expense splits
    split_ev = client.get(f"/events/{event_id}/split-expense?people=5").json()
    assert split_ev["share_per_person"] == 250.0
    calc_res = client.post("/calculate-split", json={"total_amount": 3000.0, "num_people": 6}).json()
    assert calc_res["share_per_person"] == 500.0

    # Workflow 7c: Delete expense
    assert client.delete(f"/expenses/{exp2['id']}").status_code == 200
    assert client.get(f"/events/{event_id}/budget").json()["total_expenses"] == 850.0

    # Workflow 10a: Create tasks
    t1 = client.post(f"/events/{event_id}/tasks", json={"task_name": "Order cake", "due_date": "2026-11-21"}).json()
    t2 = client.post(f"/events/{event_id}/tasks", json={"task_name": "Buy decor", "due_date": "2026-11-22"}).json()

    # Workflow 10b: Update task
    assert client.put(f"/tasks/{t1['id']}", json={"is_completed": True}).status_code == 200

    # Workflow 11: Fetch task summary
    tsum = client.get(f"/events/{event_id}/tasks/summary").json()
    assert tsum["total_tasks"] == 2
    assert tsum["completed_tasks"] == 1
    assert tsum["progress_percentage"] == 50.0

    # Workflow 10c: Delete task
    assert client.delete(f"/tasks/{t2['id']}").status_code == 200

    # Workflow 5: Delete event & cascade check
    assert client.delete(f"/events/{event_id}").status_code == 200
    assert client.get(f"/events/{event_id}").status_code == 404
    assert client.get(f"/events/{event_id}/budget").status_code == 404
    assert client.get(f"/events/{event_id}/tasks").status_code == 404


if __name__ == "__main__":
    import pytest
    sys.exit(pytest.main([__file__, "-v"]))
