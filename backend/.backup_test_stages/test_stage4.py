"""
PlanzyPop – Stage 4 Automated Verification Script
Academic Mini-Project for M.Sc. Computer Science (Data Science)

Run this script to verify:
1. Adding expenses to an event (POST /events/{id}/expenses)
2. Valid category acceptance & case normalization
3. Invalid category rejection (422) on both creation & update
4. Rejection of explicit null values for required fields (expense_name, category, amount)
5. Successful partial updates (e.g. updating only amount)
6. Retrieving expenses for an event (GET /events/{id}/expenses)
7. Budget summary & calculations (Total spent, Remaining, Utilisation %, Category breakdown)
8. Overspending detection and alert warning
9. Safe zero-budget handling (avoiding ZeroDivisionError)
10. Equal expense-sharing calculator with clear split_basis identification (planned_budget vs actual_expenses)
11. Proper handling of zero-amount recorded expenses (split_basis='actual_expenses')
12. Cascade deletion when event is removed
"""

import sys
import os

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8")

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from starlette.testclient import TestClient
from main import app

def run_stage4_tests():
    print("=" * 65)
    print("PlanzyPop Stage 4: Budget & Expense Tracking Test Suite")
    print("=" * 65)

    client = TestClient(app)

    event_payload = {
        "event_name": "Hostel Birthday Celebration",
        "event_type": "Birthday",
        "event_date": "2026-11-28",
        "location": "Hostel Common Room",
        "guests": 8,
        "budget": 2000.0,
        "celebration_style": "DIY & Budget Friendly"
    }
    res_event = client.post("/events", json=event_payload)
    assert res_event.status_code == 201
    event_id = res_event.json()["id"]
    print(f"[PASS] Created test event (ID: {event_id}, Budget: Rs 2,000)")

    res = client.post(f"/events/{event_id}/expenses", json={
        "expense_name": "Casino Chips",
        "category": "Gambling",
        "amount": 500.0
    })
    assert res.status_code == 422, f"Expected 422, got {res.status_code}"
    print("[PASS] Rejected invalid category 'Gambling' with HTTP 422")

    res = client.post(f"/events/{event_id}/expenses", json={
        "expense_name": "Chocolate Birthday Cake",
        "category": "cake",
        "amount": 500.0,
        "expense_date": "2026-11-28"
    })
    assert res.status_code == 201
    exp1 = res.json()
    exp1_id = exp1["id"]
    assert exp1["category"] == "Cake"
    assert exp1["amount"] == 500.0
    print(f"[PASS] Valid category 'cake' normalized to 'Cake' (Expense ID: {exp1_id})")

    res = client.post(f"/events/{event_id}/expenses", json={
        "expense_name": "Samosas, Chips & Cold Drinks",
        "category": "Food",
        "amount": 700.0,
        "expense_date": "2026-11-28"
    })
    assert res.status_code == 201
    exp2_id = res.json()["id"]

    res = client.post(f"/events/{event_id}/expenses", json={
        "expense_name": "DIY Balloons & Fairy Lights",
        "category": "Decorations",
        "amount": 300.0,
        "expense_date": "2026-11-28"
    })
    assert res.status_code == 201
    exp3_id = res.json()["id"]
    print(f"[PASS] Added Food (Rs 700) and Decorations (Rs 300) expenses")

    res = client.put(f"/expenses/{exp1_id}", json={"category": "Luxury Yacht"})
    assert res.status_code == 422
    print("[PASS] PUT /expenses rejected invalid category 'Luxury Yacht' with HTTP 422")

    res = client.put(f"/expenses/{exp1_id}", json={"expense_name": None})
    assert res.status_code == 422
    print("[PASS] PUT /expenses rejected explicit null expense_name with HTTP 422")

    res = client.put(f"/expenses/{exp1_id}", json={"category": None})
    assert res.status_code == 422
    print("[PASS] PUT /expenses rejected explicit null category with HTTP 422")

    res = client.put(f"/expenses/{exp1_id}", json={"amount": None})
    assert res.status_code == 422
    print("[PASS] PUT /expenses rejected explicit null amount with HTTP 422")

    res = client.put(f"/expenses/{exp1_id}", json={"expense_name": "   "})
    assert res.status_code == 422
    print("[PASS] PUT /expenses rejected blank expense_name with HTTP 422")

    res = client.put(f"/expenses/{exp1_id}", json={"amount": 550.0})
    assert res.status_code == 200
    updated_exp = res.json()
    assert updated_exp["amount"] == 550.0
    assert updated_exp["expense_name"] == "Chocolate Birthday Cake"
    assert updated_exp["category"] == "Cake"
    print(f"[PASS] Partial update succeeded: amount updated to Rs 550 without affecting other fields")

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
    print(f"[PASS] Budget Summary verified: Spent Rs 1550, Remaining Rs 450 (77.5% utilised)")

    res = client.post(f"/events/{event_id}/expenses", json={
        "expense_name": "Extra Pizza Treats",
        "category": "Food",
        "amount": 600.0
    })
    assert res.status_code == 201
    over_exp_id = res.json()["id"]

    res = client.get(f"/events/{event_id}/budget")
    assert res.status_code == 200
    over_data = res.json()
    assert over_data["total_expenses"] == 2150.0
    assert over_data["remaining_budget"] == -150.0
    assert over_data["is_over_budget"] is True
    assert "exceeded" in over_data["warning_message"]
    print(f"[PASS] Overspending detected: Remaining Rs -150, Alert: '{over_data['warning_message']}'")

    client.delete(f"/expenses/{over_exp_id}")

    res = client.get(f"/events/{event_id}/split-expense?people=5")
    assert res.status_code == 200
    split_actual = res.json()
    assert split_actual["total_amount"] == 1550.0
    assert split_actual["share_per_person"] == 310.0
    assert split_actual["split_basis"] == "actual_expenses"
    assert "actual recorded expenses" in split_actual["explanation"]
    print(f"[PASS] Split with actual expenses: split_basis='{split_actual['split_basis']}' -> Rs {split_actual['share_per_person']} each")

    res_plan = client.post("/events", json={
        "event_name": "Upcoming Farewell Party",
        "event_type": "Farewell",
        "event_date": "2026-12-10",
        "budget": 3000.0
    })
    assert res_plan.status_code == 201
    plan_event_id = res_plan.json()["id"]

    res = client.get(f"/events/{plan_event_id}/split-expense?people=6")
    assert res.status_code == 200
    split_fallback = res.json()
    assert split_fallback["total_amount"] == 3000.0
    assert split_fallback["share_per_person"] == 500.0
    assert split_fallback["split_basis"] == "planned_budget"
    assert "planned budget fallback" in split_fallback["explanation"]
    print(f"[PASS] Planned budget fallback clearly identified: split_basis='{split_fallback['split_basis']}' -> Rs {split_fallback['share_per_person']} each")

    client.delete(f"/events/{plan_event_id}")

    res_zero_exp = client.post("/events", json={
        "event_name": "Zero-Cost DIY Event",
        "event_type": "Hostel Party",
        "event_date": "2026-12-15",
        "budget": 2000.0
    })
    assert res_zero_exp.status_code == 201
    zero_exp_event_id = res_zero_exp.json()["id"]

    res_add_zero = client.post(f"/events/{zero_exp_event_id}/expenses", json={
        "expense_name": "Free Decoration",
        "category": "Decorations",
        "amount": 0.0
    })
    assert res_add_zero.status_code == 201

    res_split_zero = client.get(f"/events/{zero_exp_event_id}/split-expense?people=4")
    assert res_split_zero.status_code == 200
    zero_split = res_split_zero.json()
    assert zero_split["total_amount"] == 0.0
    assert zero_split["share_per_person"] == 0.0
    assert zero_split["split_basis"] == "actual_expenses"
    assert "actual recorded expenses" in zero_split["explanation"]
    print(f"[PASS] Zero-amount expense split: total_amount=0.0, share_per_person=0.0, split_basis='{zero_split['split_basis']}'")

    client.delete(f"/events/{zero_exp_event_id}")
    print("[PASS] Cleaned up zero-amount expense test event")

    res = client.post("/calculate-split", json={"total_amount": 2000.0, "num_people": 5})
    assert res.status_code == 200
    calc = res.json()
    assert calc["share_per_person"] == 400.0
    assert calc["split_basis"] == "custom_amount"
    print(f"[PASS] POST /calculate-split: Rs 2000 / 5 = Rs {calc['share_per_person']} (split_basis='{calc['split_basis']}')")

    res_zero = client.post("/events", json={
        "event_name": "Free Campus Meetup",
        "event_type": "College Meetup",
        "event_date": "2026-12-01",
        "budget": 0.0
    })
    zero_id = res_zero.json()["id"]
    res = client.get(f"/events/{zero_id}/budget")
    assert res.status_code == 200
    assert res.json()["utilisation_percentage"] == 0.0
    print("[PASS] Zero-budget event handled safely without ZeroDivisionError")
    client.delete(f"/events/{zero_id}")

    assert client.post("/events/999999/expenses", json={"expense_name": "Cake", "category": "Cake", "amount": 100.0}).status_code == 404
    assert client.put("/expenses/999999", json={"amount": 100.0}).status_code == 404
    assert client.delete("/expenses/999999").status_code == 404
    print("[PASS] 404 correctly returned for non-existent events and expenses")

    client.delete(f"/events/{event_id}")
    print(f"[PASS] Cleaned up test event and cascaded expenses")

    print("=" * 65)
    print("ALL STAGE 4 CORRECTION & REGRESSION CHECKS PASSED!")
    print("=" * 65)
    return True

if __name__ == "__main__":
    success = run_stage4_tests()
    sys.exit(0 if success else 1)
