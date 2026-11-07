"""
PlanzyPop - Rule-Based Recommendation Engine Verification Suite
Academic Mini-Project for M.Sc. Computer Science (Data Science)

Test Coverage:
1. Event-type-specific heuristics (Birthday, College Party, Farewell, Picnic, Hostel Party)
2. Celebration style themes & decor reflection (Aesthetic, DIY, Traditional, Fun, Casual)
3. Budget tiers (Zero-Budget, Very Low, Low, Moderate, Higher)
4. Guest scaling heuristics (bulk catering advice >15, group activity teams >20)
5. Mathematical integrity: Category allocation rules sum to 100%
6. Exact rounding reconciliation: sum(allocations) == input budget
7. Input validation: Negative budget, negative guests, and blank event types (HTTP 422)
8. Graceful fallbacks for unknown event types and unlisted celebration styles
9. Full REST API endpoint verification (POST /suggestions/generate)
10. Database independence check: Verifies suggestion engine is stateless (0 database records created)
"""

import sys
from pathlib import Path
import pytest
from starlette.testclient import TestClient

BACKEND_DIR = Path(__file__).resolve().parent
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

import models
from suggestions import (
    generate_event_suggestions,
    CATEGORY_ALLOCATION_RULES,
    compute_budget_allocation,
)


def test_event_type_heuristics():
    """Verify suggestions for Birthday, College Party, Farewell, Picnic, and Hostel Party."""
    # Birthday
    bday = generate_event_suggestions("Birthday", 3000.0, 10, "Aesthetic")
    assert any("cake" in f.lower() for f in bday["food_suggestions"])
    assert any("cake" in a.lower() for a in bday["activity_suggestions"])
    assert bday["budget_tier"] == "Low Budget (₹1,500 – ₹4,000)"

    # College Party
    college = generate_event_suggestions("College Party", 6000.0, 25, "Fun / Party")
    assert "Neon" in college["suggested_theme"] or "College" in college["suggested_theme"]
    assert any("playlist" in a.lower() or "mafia" in a.lower() for a in college["activity_suggestions"])
    assert college["budget_tier"] == "Moderate Budget (₹4,000 – ₹10,000)"

    # Farewell
    farewell = generate_event_suggestions("Farewell", 4000.0, 20, "Casual")
    assert any("tribute" in a.lower() or "scrapbook" in a.lower() or "roast" in a.lower() for a in farewell["activity_suggestions"])

    # Picnic
    picnic = generate_event_suggestions("Picnic", 2000.0, 6, "Casual")
    assert any("mat" in d.lower() or "cushion" in d.lower() for d in picnic["decoration_suggestions"])
    assert any("frisbee" in a.lower() or "badminton" in a.lower() for a in picnic["activity_suggestions"])

    # Hostel Party
    hostel = generate_event_suggestions("Hostel Party", 1200.0, 8, "DIY / Budget-Friendly")
    assert any("maggi" in f.lower() or "samosa" in f.lower() or "popcorn" in f.lower() for f in hostel["food_suggestions"])


def test_celebration_styles():
    """Verify that all 5 celebration styles reflect distinct decor keywords and themes."""
    styles = {
        "Aesthetic": "fairy lights",
        "DIY / Budget-Friendly": "origami",
        "Traditional": "marigold",
        "Fun / Party": "fringe",
        "Casual": "banners"
    }
    for style, keyword in styles.items():
        res = generate_event_suggestions("Birthday", 2500.0, 5, style)
        decor_str = " ".join(res["decoration_suggestions"]).lower()
        theme_str = res["suggested_theme"].lower()
        assert keyword in decor_str or keyword in theme_str, f"Keyword '{keyword}' missing for style '{style}'"


def test_budget_tiers_and_guest_scaling():
    """Verify budget tier classifications and guest count scaling advice."""
    # Very Low Budget
    low = generate_event_suggestions("Birthday", 800.0, 5, "DIY / Budget-Friendly")
    assert low["budget_tier"] == "Very Low Budget (Under ₹1,500)"
    assert any("samosa" in f.lower() or "popcorn" in f.lower() or "bakery" in f.lower() for f in low["food_suggestions"])

    # Zero Budget
    zero = generate_event_suggestions("Get-together", 0.0, 6, "Casual")
    assert zero["budget_tier"] == "Zero Budget / Free Celebration"
    assert any("potluck" in f.lower() or "homemade" in f.lower() for f in zero["food_suggestions"])
    for alloc in zero["budget_allocations"]:
        assert alloc["allocated_amount"] == 0.0
    assert zero["total_allocated_budget"] == 0.0

    # Higher Budget
    high = generate_event_suggestions("Birthday", 15000.0, 30, "Aesthetic")
    assert high["budget_tier"] == "Higher Budget (Above ₹10,000)"

    # Guest scaling: >20 gets team advice, >15 gets bulk order advice
    large = generate_event_suggestions("College Party", 5000.0, 25, "Fun / Party")
    assert any("teams" in a.lower() or "relay" in a.lower() for a in large["activity_suggestions"])
    assert any("bulk" in f.lower() for f in large["food_suggestions"])


def test_budget_allocation_mathematical_precision():
    """Verify category allocation rules sum to 100% and rounding compensation guarantees exact budget reconciliation."""
    for ev_key, ratios in CATEGORY_ALLOCATION_RULES.items():
        assert abs(sum(ratios.values()) - 100.0) < 1e-6, f"Allocation rules for '{ev_key}' must sum to 100%"

    test_budgets = [1234.57, 100.0, 50.0, 3333.33, 9999.99, 0.0, 1500.0]
    for b in test_budgets:
        allocs = compute_budget_allocation("birthday", b)
        sum_allocated = round(sum(a["allocated_amount"] for a in allocs), 2)
        assert sum_allocated == round(b, 2), f"Allocation sum {sum_allocated} != budget {b}"


def test_recommendation_input_validation(client: TestClient):
    """Verify HTTP 422 for negative budget, negative guests, and blank event types."""
    assert client.post("/suggestions/generate", json={"event_type": "Birthday", "budget": -500.0, "guests": 10}).status_code == 422
    assert client.post("/suggestions/generate", json={"event_type": "Birthday", "budget": 2000.0, "guests": -5}).status_code == 422
    assert client.post("/suggestions/generate", json={"event_type": "   ", "budget": 2000.0, "guests": 5}).status_code == 422


def test_unknown_event_and_style_fallbacks():
    """Verify graceful heuristics fallback for unknown event types and celebration styles."""
    res_ev = generate_event_suggestions("Inter-Galactic Robot Launch", 3000.0, 10, "Casual")
    assert res_ev["suggested_theme"] is not None
    assert len(res_ev["food_suggestions"]) > 0

    res_st = generate_event_suggestions("Birthday", 3000.0, 10, "Cyberpunk Gothic")
    assert res_st["suggested_theme"] is not None
    assert len(res_st["decoration_suggestions"]) > 0


def test_recommendation_api_endpoint(client: TestClient):
    """Verify POST /suggestions/generate REST endpoint returns full structured payload."""
    payload = {
        "event_type": "Hostel Party",
        "budget": 2500.0,
        "guests": 12,
        "celebration_style": "DIY / Budget-Friendly"
    }
    res = client.post("/suggestions/generate", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["event_type"] == "Hostel Party"
    assert data["budget"] == 2500.0
    assert data["total_allocated_budget"] == 2500.0
    assert len(data["budget_allocations"]) > 0
    assert len(data["food_suggestions"]) > 0
    assert len(data["decoration_suggestions"]) > 0
    assert len(data["activity_suggestions"]) > 0
    assert len(data["budget_saving_tips"]) > 0
    assert "disclaimer" in data


def test_stateless_database_independence(client: TestClient, db_session):
    """Verify that generating suggestions is completely stateless and produces 0 database records."""
    events_count_before = db_session.query(models.Event).count()
    expenses_count_before = db_session.query(models.Expense).count()
    tasks_count_before = db_session.query(models.Task).count()

    # Generate several suggestions
    client.post("/suggestions/generate", json={"event_type": "Hostel Party", "budget": 2500.0, "guests": 12})
    client.post("/suggestions/generate", json={"event_type": "Picnic", "budget": 1500.0, "guests": 6})
    client.post("/suggestions/generate", json={"event_type": "Birthday", "budget": 0.0, "guests": 10})

    events_count_after = db_session.query(models.Event).count()
    expenses_count_after = db_session.query(models.Expense).count()
    tasks_count_after = db_session.query(models.Task).count()

    assert events_count_before == events_count_after
    assert expenses_count_before == expenses_count_after
    assert tasks_count_before == tasks_count_after


if __name__ == "__main__":
    import pytest
    sys.exit(pytest.main([__file__, "-v"]))
