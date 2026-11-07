"""
PlanzyPop - Stage 8: Integration Audit Verification Suite
Academic Mini-Project for M.Sc. Computer Science (Data Science)

Specifically audits and tests the 11 core workflows required for Stage 8:
1. Fetch events.
2. Create an event.
3. Fetch an individual event.
4. Update an event.
5. Delete an event.
6. Generate suggestions.
7. Add and delete expenses.
8. Fetch budget summary.
9. Calculate expense split.
10. Create, update and delete tasks.
11. Fetch task summary.
"""

import sys
from pathlib import Path

# Ensure UTF-8 output encoding on Windows consoles
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

from starlette.testclient import TestClient
from main import app

client = TestClient(app)

def run_stage8_audit():
    print("=" * 65)
    print("PlanzyPop Stage 8: Final API Integration Audit Verification Suite")
    print("=" * 65)

    # 1. Fetch events
    res = client.get("/events")
    assert res.status_code == 200, f"GET /events failed: {res.text}"
    initial_events = res.json()
    print(f"[PASS] Workflow 1 - Fetch events: Found {len(initial_events)} existing event(s)")

    # 2. Create an event
    new_event_data = {
        "event_name": "Audit Test Celebration",
        "event_type": "Birthday",
        "event_date": "2026-11-25",
        "location": "Indiranagar Rooftop",
        "guests": 12,
        "budget": 4500.0,
        "celebration_style": "Casual"
    }
    res = client.post("/events", json=new_event_data)
    assert res.status_code == 201, f"POST /events failed: {res.text}"
    created_event = res.json()
    event_id = created_event["id"]
    assert created_event["event_name"] == "Audit Test Celebration"
    print(f"[PASS] Workflow 2 - Create an event: Created Event ID {event_id} ('{created_event['event_name']}')")

    # 3. Fetch an individual event
    res = client.get(f"/events/{event_id}")
    assert res.status_code == 200, f"GET /events/{event_id} failed: {res.text}"
    fetched = res.json()
    assert fetched["id"] == event_id
    assert fetched["budget"] == 4500.0
    print(f"[PASS] Workflow 3 - Fetch individual event: Retrieved ID {event_id} successfully")

    # 4. Update an event (PUT /events/{id})
    update_data = {
        "event_name": "Updated Audit Celebration",
        "budget": 5200.0,
        "guests": 15
    }
    res = client.put(f"/events/{event_id}", json=update_data)
    assert res.status_code == 200, f"PUT /events/{event_id} failed: {res.text}"
    updated = res.json()
    assert updated["event_name"] == "Updated Audit Celebration"
    assert updated["budget"] == 5200.0
    assert updated["guests"] == 15
    print(f"[PASS] Workflow 4 - Update an event: Event updated to '{updated['event_name']}', Budget Rs {updated['budget']}")

    # 6. Generate suggestions (POST /suggestions/generate)
    sugg_request = {
        "event_type": "Birthday",
        "budget": 5000.0,
        "guests": 15,
        "celebration_style": "Aesthetic"
    }
    res = client.post("/suggestions/generate", json=sugg_request)
    assert res.status_code == 200, f"POST /suggestions/generate failed: {res.text}"
    sugg = res.json()
    assert "suggested_theme" in sugg
    assert "total_allocated_budget" in sugg
    assert "food_suggestions" in sugg
    assert "decoration_suggestions" in sugg
    assert "activity_suggestions" in sugg
    assert "budget_allocations" in sugg
    print(f"[PASS] Workflow 6 - Generate suggestions: Theme '{sugg['suggested_theme']}' (Allocated Rs {sugg['total_allocated_budget']})")

    # 7. Add and delete expenses (POST /events/{id}/expenses and DELETE /expenses/{id})
    exp_data = {
        "expense_name": "Custom Birthday Cake",
        "category": "Cake",
        "amount": 850.0
    }
    res = client.post(f"/events/{event_id}/expenses", json=exp_data)
    assert res.status_code == 201, f"POST /events/{event_id}/expenses failed: {res.text}"
    cake_exp = res.json()
    cake_exp_id = cake_exp["id"]
    print(f"[PASS] Workflow 7a - Add expense: Logged Cake Rs 850 (Expense ID {cake_exp_id})")

    exp_data2 = {
        "expense_name": "Fairy Lights & Streamers",
        "category": "Decorations",
        "amount": 400.0
    }
    res = client.post(f"/events/{event_id}/expenses", json=exp_data2)
    assert res.status_code == 201, f"POST /events/{event_id}/expenses failed: {res.text}"
    decor_exp = res.json()
    decor_exp_id = decor_exp["id"]
    print(f"[PASS] Workflow 7b - Add second expense: Logged Decorations Rs 400 (Expense ID {decor_exp_id})")

    # 8. Fetch budget summary (GET /events/{id}/budget)
    res = client.get(f"/events/{event_id}/budget")
    assert res.status_code == 200, f"GET /events/{event_id}/budget failed: {res.text}"
    budget_sum = res.json()
    assert budget_sum["planned_budget"] == 5200.0
    assert budget_sum["total_expenses"] == 1250.0
    assert budget_sum["remaining_budget"] == 3950.0
    assert budget_sum["category_breakdown"]["Cake"] == 850.0
    assert budget_sum["category_breakdown"]["Decorations"] == 400.0
    print(f"[PASS] Workflow 8 - Fetch budget summary: Spent Rs {budget_sum['total_expenses']} / {budget_sum['planned_budget']} (Remaining Rs {budget_sum['remaining_budget']})")

    # 9. Calculate expense split (GET /events/{id}/split-expense?people=... and POST /calculate-split)
    # 9a: GET /events/{id}/split-expense with default and custom people count
    res = client.get(f"/events/{event_id}/split-expense?people=5")
    assert res.status_code == 200, f"GET /events/{event_id}/split-expense failed: {res.text}"
    split_info = res.json()
    assert split_info["num_people"] == 5
    assert split_info["total_amount"] == 1250.0
    assert split_info["share_per_person"] == 250.0
    assert split_info["split_basis"] == "actual_expenses"
    print(f"[PASS] Workflow 9a - Event split: Rs {split_info['total_amount']} / 5 people = Rs {split_info['share_per_person']} each")

    # 9b: POST /calculate-split
    res = client.post("/calculate-split", json={"total_amount": 3000.0, "num_people": 6})
    assert res.status_code == 200, f"POST /calculate-split failed: {res.text}"
    custom_split = res.json()
    assert custom_split["share_per_person"] == 500.0
    print(f"[PASS] Workflow 9b - Custom calculator split: Rs 3000 / 6 = Rs {custom_split['share_per_person']} each")

    # 7c. Delete expense
    res = client.delete(f"/expenses/{decor_exp_id}")
    assert res.status_code == 200, f"DELETE /expenses/{decor_exp_id} failed: {res.text}"
    print(f"[PASS] Workflow 7c - Delete expense: Deleted Expense ID {decor_exp_id}")

    # Verify budget summary updated after deletion
    res = client.get(f"/events/{event_id}/budget")
    assert res.status_code == 200
    assert res.json()["total_expenses"] == 850.0
    print(f"[PASS] Verified budget dynamically adjusted to Rs 850 after deletion")

    # 10. Create, update and delete tasks
    # 10a: Create tasks
    res = client.post(f"/events/{event_id}/tasks", json={
        "task_name": "Order the cake",
        "due_date": "2026-11-21",
        "description": "HIGH"
    })
    assert res.status_code == 201, f"POST /events/{event_id}/tasks failed: {res.text}"
    t1 = res.json()
    t1_id = t1["id"]

    res = client.post(f"/events/{event_id}/tasks", json={
        "task_name": "Buy balloons & fairy lights",
        "due_date": "2026-11-22",
        "description": "MEDIUM"
    })
    assert res.status_code == 201
    t2 = res.json()
    t2_id = t2["id"]
    print(f"[PASS] Workflow 10a - Create tasks: Created Task {t1_id} and Task {t2_id}")

    # 10b: Update task (mark complete)
    res = client.put(f"/tasks/{t1_id}", json={"is_completed": True})
    assert res.status_code == 200, f"PUT /tasks/{t1_id} failed: {res.text}"
    assert res.json()["is_completed"] is True
    print(f"[PASS] Workflow 10b - Update task: Task {t1_id} marked as completed")

    # 11. Fetch task summary
    res = client.get(f"/events/{event_id}/tasks/summary")
    assert res.status_code == 200, f"GET /events/{event_id}/tasks/summary failed: {res.text}"
    tsum = res.json()
    assert tsum["total_tasks"] == 2
    assert tsum["completed_tasks"] == 1
    assert tsum["pending_tasks"] == 1
    assert tsum["progress_percentage"] == 50.0
    print(f"[PASS] Workflow 11 - Fetch task summary: 1/2 tasks completed ({tsum['progress_percentage']}%)")

    # 10c: Delete task
    res = client.delete(f"/tasks/{t2_id}")
    assert res.status_code == 200, f"DELETE /tasks/{t2_id} failed: {res.text}"
    print(f"[PASS] Workflow 10c - Delete task: Deleted Task ID {t2_id}")

    # 5. Delete an event (DELETE /events/{id})
    res = client.delete(f"/events/{event_id}")
    assert res.status_code == 200, f"DELETE /events/{event_id} failed: {res.text}"
    print(f"[PASS] Workflow 5 - Delete event: Event ID {event_id} deleted successfully")

    # Verify event and its cascade are gone
    assert client.get(f"/events/{event_id}").status_code == 404
    assert client.get(f"/events/{event_id}/budget").status_code == 404
    assert client.get(f"/events/{event_id}/tasks").status_code == 404
    print("[PASS] Verified cascade cleanup: Event, budget, and tasks fully cleaned up")

    print("=" * 65)
    print("ALL 11 STAGE 8 INTEGRATION AUDIT WORKFLOWS VERIFIED 100%!")
    print("=" * 65)

if __name__ == "__main__":
    run_stage8_audit()
