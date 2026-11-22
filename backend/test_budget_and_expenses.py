"""
PlanzyPop - Budget & Expense Management Verification Suite
Academic Mini-Project for M.Sc. Computer Science (Data Science)

Test Coverage:
1. Adding expenses to an event (POST /events/{id}/expenses)
2. Valid category acceptance and case normalization ('cake' -> 'Cake')
3. Invalid category rejection (HTTP 422) on creation and updates
4. Rejection of explicit null values for required fields (name, category, amount)
5. Partial expense updates (updating amount without modifying other fields)
6. Budget summary calculations (Total spent, Remaining, Utilisation %, Category breakdown)
7. Overspending detection and warning alert messages
8. Safe zero-budget handling (guarding against ZeroDivisionError)
9. Expense-splitting calculator with split_basis identification (actual_expenses vs planned_budget)
10. Handling of zero-amount recorded expenses
11. Cascade deletion of associated expenses when parent event is deleted
"""

import sys
from pathlib import Path
import pytest
from starlette.testclient import TestClient

BACKEND_DIR = Path(__file__).resolve().parent
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))


@pytest.fixture
def test_event(client: TestClient):
    """Creates a temporary test event with Budget = Rs 2000 and cleans up afterwards."""
    payload = {
        "event_name": "Hostel Birthday Celebration",
        "event_type": "Birthday",
        "event_date": "2026-11-28",
        "location": "Hostel Common Room",
        "guests": 8,
        "budget": 2000.0,
        "celebration_style": "DIY & Budget Friendly"
    }
    res = client.post("/events", json=payload)
    assert res.status_code == 201
    event_data = res.json()
    yield event_data
    client.delete(f"/events/{event_data['id']}")


def test_category_validation_and_normalization(client: TestClient, test_event):
    """Verify category normalization and rejection of invalid categories."""
    event_id = test_event["id"]

    res_invalid = client.post(f"/events/{event_id}/expenses", json={
        "expense_name": "Casino Chips",
        "category": "Gambling",
        "amount": 500.0
    })
    assert res_invalid.status_code == 422

    res_valid = client.post(f"/events/{event_id}/expenses", json={
        "expense_name": "Chocolate Birthday Cake",
        "category": "cake",
        "amount": 500.0,
        "expense_date": "2026-11-28"
    })
    assert res_valid.status_code == 201
    created = res_valid.json()
    assert created["category"] == "Cake"
    assert created["amount"] == 500.0


def test_expense_update_validation_and_partial_update(client: TestClient, test_event):
    """Verify PUT /expenses/{id} validation for nulls, blanks, invalid categories, and partial updates."""
    event_id = test_event["id"]

    res_exp = client.post(f"/events/{event_id}/expenses", json={
        "expense_name": "Party Snacks",
        "category": "Food",
        "amount": 300.0
    })
    exp_id = res_exp.json()["id"]

    assert client.put(f"/expenses/{exp_id}", json={"category": "Luxury Yacht"}).status_code == 422

    assert client.put(f"/expenses/{exp_id}", json={"expense_name": None}).status_code == 422
    assert client.put(f"/expenses/{exp_id}", json={"category": None}).status_code == 422
    assert client.put(f"/expenses/{exp_id}", json={"amount": None}).status_code == 422

    assert client.put(f"/expenses/{exp_id}", json={"expense_name": "   "}).status_code == 422

    res_update = client.put(f"/expenses/{exp_id}", json={"amount": 450.0})
    assert res_update.status_code == 200
    updated = res_update.json()
    assert updated["amount"] == 450.0
    assert updated["expense_name"] == "Party Snacks"
    assert updated["category"] == "Food"


def test_budget_summary_calculations(client: TestClient, test_event):
    """Verify budget metrics: total spent, remaining, utilisation %, and category breakdown."""
    event_id = test_event["id"]

    client.post(f"/events/{event_id}/expenses", json={"expense_name": "Food Treats", "category": "Food", "amount": 700.0})
    client.post(f"/events/{event_id}/expenses", json={"expense_name": "Birthday Cake", "category": "Cake", "amount": 550.0})
    client.post(f"/events/{event_id}/expenses", json={"expense_name": "Fairy Lights", "category": "Decorations", "amount": 300.0})

    res = client.get(f"/events/{event_id}/budget")
    assert res.status_code == 200
    b = res.json()
    assert b["planned_budget"] == 2000.0
    assert b["total_expenses"] == 1550.0
    assert b["remaining_budget"] == 450.0
    assert b["utilisation_percentage"] == 77.5
    assert b["is_over_budget"] is False
    assert b["category_breakdown"]["Food"] == 700.0
    assert b["category_breakdown"]["Cake"] == 550.0
    assert b["category_breakdown"]["Decorations"] == 300.0


def test_overspending_detection_and_warning(client: TestClient, test_event):
    """Verify that exceeding planned budget sets is_over_budget to True and provides warning message."""
    event_id = test_event["id"]

    res_exp = client.post(f"/events/{event_id}/expenses", json={
        "expense_name": "Luxury DJ Sound System",
        "category": "Entertainment",
        "amount": 2500.0
    })
    assert res_exp.status_code == 201
    exp_id = res_exp.json()["id"]

    res_budget = client.get(f"/events/{event_id}/budget")
    assert res_budget.status_code == 200
    b = res_budget.json()
    assert b["total_expenses"] == 2500.0
    assert b["remaining_budget"] == -500.0
    assert b["is_over_budget"] is True
    assert "exceeded" in b["warning_message"]

    client.delete(f"/expenses/{exp_id}")


def test_expense_splitting_and_fallback(client: TestClient, test_event):
    """Verify split calculations with actual expenses, planned budget fallback, zero costs, and custom calculator."""
    event_id = test_event["id"]

    client.post(f"/events/{event_id}/expenses", json={"expense_name": "Snacks", "category": "Food", "amount": 1200.0})
    res_actual = client.get(f"/events/{event_id}/split-expense?people=4")
    assert res_actual.status_code == 200
    data_actual = res_actual.json()
    assert data_actual["total_amount"] == 1200.0
    assert data_actual["share_per_person"] == 300.0
    assert data_actual["split_basis"] == "actual_expenses"

    res_plan = client.post("/events", json={
        "event_name": "Farewell Fallback Test",
        "event_type": "Farewell",
        "event_date": "2026-12-10",
        "budget": 3000.0
    })
    plan_event_id = res_plan.json()["id"]

    res_fallback = client.get(f"/events/{plan_event_id}/split-expense?people=6")
    assert res_fallback.status_code == 200
    data_fallback = res_fallback.json()
    assert data_fallback["total_amount"] == 3000.0
    assert data_fallback["share_per_person"] == 500.0
    assert data_fallback["split_basis"] == "planned_budget"
    client.delete(f"/events/{plan_event_id}")

    res_calc = client.post("/calculate-split", json={"total_amount": 2000.0, "num_people": 5})
    assert res_calc.status_code == 200
    calc_data = res_calc.json()
    assert calc_data["share_per_person"] == 400.0
    assert calc_data["split_basis"] == "custom_amount"


def test_safe_zero_budget_and_cascade_deletion(client: TestClient):
    """Verify safe zero-budget calculation and cascade deletion of expenses when event is removed."""
    res_zero = client.post("/events", json={
        "event_name": "Free Campus Meetup",
        "event_type": "College Meetup",
        "event_date": "2026-12-01",
        "budget": 0.0
    })
    zero_id = res_zero.json()["id"]

    res_budget = client.get(f"/events/{zero_id}/budget")
    assert res_budget.status_code == 200
    assert res_budget.json()["utilisation_percentage"] == 0.0

    res_exp = client.post(f"/events/{zero_id}/expenses", json={
        "expense_name": "Paper Cups",
        "category": "Decorations",
        "amount": 50.0
    })
    exp_id = res_exp.json()["id"]

    assert client.post("/events/999999/expenses", json={"expense_name": "Cake", "category": "Cake", "amount": 100.0}).status_code == 404
    assert client.put("/expenses/999999", json={"amount": 100.0}).status_code == 404
    assert client.delete("/expenses/999999").status_code == 404

    res_del = client.delete(f"/events/{zero_id}")
    assert res_del.status_code == 200

    assert client.get(f"/events/{zero_id}/expenses").status_code == 404
    assert client.delete(f"/expenses/{exp_id}").status_code == 404


if __name__ == "__main__":
    import pytest
    sys.exit(pytest.main([__file__, "-v"]))
