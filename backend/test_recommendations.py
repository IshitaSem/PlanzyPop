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
    validate_celebration_plan,
    generate_synchronized_shopping_items,
)


def test_event_type_heuristics():
    """Verify suggestions for Birthday, College Party, Farewell, Picnic, and Hostel Party."""
    bday = generate_event_suggestions("Birthday", 3000.0, 10, "Aesthetic")
    assert any("cake" in f.lower() for f in bday["food_suggestions"])
    assert any("cake" in a.lower() for a in bday["activity_suggestions"])
    assert bday["budget_tier"] == "Low Budget (₹1,500 – ₹4,000)"

    college = generate_event_suggestions("College Party", 6000.0, 25, "Fun / Party")
    assert "Neon" in college["suggested_theme"] or "College" in college["suggested_theme"]
    assert any("playlist" in a.lower() or "mafia" in a.lower() for a in college["activity_suggestions"])
    assert college["budget_tier"] == "Moderate Budget (₹4,000 – ₹10,000)"

    farewell = generate_event_suggestions("Farewell", 4000.0, 20, "Casual")
    assert any("tribute" in a.lower() or "scrapbook" in a.lower() or "roast" in a.lower() for a in farewell["activity_suggestions"])

    picnic = generate_event_suggestions("Picnic", 2000.0, 6, "Casual")
    assert any("mat" in d.lower() or "cushion" in d.lower() for d in picnic["decoration_suggestions"])
    assert any("frisbee" in a.lower() or "badminton" in a.lower() for a in picnic["activity_suggestions"])

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
    low = generate_event_suggestions("Birthday", 800.0, 5, "DIY / Budget-Friendly")
    assert low["budget_tier"] == "Very Low Budget (Under ₹1,500)"
    assert any("samosa" in f.lower() or "popcorn" in f.lower() or "bakery" in f.lower() for f in low["food_suggestions"])

    zero = generate_event_suggestions("Get-together", 0.0, 6, "Casual")
    assert zero["budget_tier"] == "Zero Budget / Free Celebration"
    assert any("potluck" in f.lower() or "homemade" in f.lower() for f in zero["food_suggestions"])
    for alloc in zero["budget_allocations"]:
        assert alloc["allocated_amount"] == 0.0
    assert zero["total_allocated_budget"] == 0.0

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

    client.post("/suggestions/generate", json={"event_type": "Hostel Party", "budget": 2500.0, "guests": 12})
    client.post("/suggestions/generate", json={"event_type": "Picnic", "budget": 1500.0, "guests": 6})
    client.post("/suggestions/generate", json={"event_type": "Birthday", "budget": 0.0, "guests": 10})

    events_count_after = db_session.query(models.Event).count()
    expenses_count_after = db_session.query(models.Expense).count()
    tasks_count_after = db_session.query(models.Task).count()

    assert events_count_before == events_count_after
    assert expenses_count_before == expenses_count_after
    assert tasks_count_before == tasks_count_after


def test_low_budget_range_500_to_1000():
    """Verify that budget range ₹500–₹1,000 sets realistic allocations and affordable recommendations."""
    for budget in [500.0, 750.0, 1000.0]:
        res = generate_event_suggestions("Birthday", budget, 1, "Casual")
        assert res["total_allocated_budget"] <= budget
        assert res["budget_tier"] == "Very Low Budget (Under ₹1,500)"
        # Affordable recommendations instead of premium
        assert any("samosa" in f.lower() or "popcorn" in f.lower() or "bakery" in f.lower() for f in res["food_suggestions"])
        assert not any("premium designer custom birthday cake" in f.lower() for f in res["food_suggestions"])
        # Mathematical consistency
        sum_alloc = round(sum(a["allocated_amount"] for a in res["budget_allocations"]), 2)
        assert sum_alloc == round(budget, 2)
        # Shopping items match allocations
        if budget > 0:
            assert res["shopping_items"] is not None
            sum_shopping = round(sum(i["cost"] for i in res["shopping_items"]), 2)
            assert sum_shopping == round(res["total_allocated_budget"], 2)
            # Safety buffer is present
            assert res["safety_buffer"] >= 0.0


def test_solo_guest_count_consistency():
    """Verify that guests=1 suggests solo-appropriate activities and scaled food without large-group games."""
    res = generate_event_suggestions("Birthday", 1000.0, 1, "Casual")
    # Must not contain 10-25 or team-based games
    for act in res["activity_suggestions"]:
        act_l = act.lower()
        assert "10–25" not in act_l and "10-25" not in act_l
        assert "two teams" not in act_l and "large groups" not in act_l
    # Must contain solo/personal celebration activities
    act_str = " ".join(res["activity_suggestions"]).lower()
    assert "solo" in act_str or "personal" in act_str or "reflection" in act_str or "video call" in act_str or "movie" in act_str
    # Food is scaled for 1 person (mini cake / personal portion)
    food_str = " ".join(res["food_suggestions"]).lower()
    assert "mini" in food_str or "cupcake" in food_str or "personal" in food_str or "samosa" in food_str
    # Per-guest cost equals estimated total / 1
    assert res["per_guest_cost"] == res["estimated_expense"]


def test_dietary_and_setting_preferences():
    """Verify that dietary preference (Vegetarian) and setting (Outdoor/Indoor) are respected."""
    res_veg = generate_event_suggestions(
        "Birthday", 2000.0, 4, "Casual",
        dietary_preference="Vegetarian", setting="Outdoor"
    )
    food_str = " ".join(res_veg["food_suggestions"]).lower()
    assert "samosa" in food_str or "veg" in food_str or "chaat" in food_str
    # Outdoor setting reflection in decor / activities
    assert len(res_veg["decoration_suggestions"]) > 0
    assert len(res_veg["activity_suggestions"]) > 0


def test_plan_validation_and_integrity():
    """Verify backend celebration plan validation logic catches inconsistencies and handles missing values."""
    valid_plan = {
        "budget": 1000.0,
        "guests": 1,
        "total_allocated_budget": 1000.0,
        "estimated_expense": 950.0,
        "per_guest_cost": 950.0,
        "suggested_theme": "Cozy Birthday Celebration",
        "food_suggestions": ["Mini bento cake", "Personal samosa combo"],
        "decoration_suggestions": ["Pastel balloons (15 pcs)"],
        "activity_suggestions": ["Solo cake cutting & movie marathon"],
        "budget_allocations": [
            {"category": "Food", "allocated_amount": 400.0, "percentage": 40.0},
            {"category": "Cake / Gifts", "allocated_amount": 250.0, "percentage": 25.0},
            {"category": "Decorations", "allocated_amount": 150.0, "percentage": 15.0},
            {"category": "Entertainment", "allocated_amount": 100.0, "percentage": 10.0},
            {"category": "Miscellaneous", "allocated_amount": 100.0, "percentage": 10.0},
        ],
        "budget_saving_tips": ["Pre-order local cake"]
    }
    # Valid plan passes
    assert validate_celebration_plan(valid_plan) == valid_plan

    # Budget exceeded raises ValueError
    invalid_overbudget = dict(valid_plan, total_allocated_budget=1500.0)
    with pytest.raises(ValueError, match="exceeds target budget"):
        validate_celebration_plan(invalid_overbudget)

    # Category allocations mismatch raises ValueError
    invalid_alloc = dict(valid_plan, budget_allocations=[
        {"category": "Food", "allocated_amount": 100.0, "percentage": 10.0}
    ])
    with pytest.raises(ValueError, match="Sum of allocations"):
        validate_celebration_plan(invalid_alloc)

    # 1 guest with 10-25 group game raises ValueError
    invalid_guest_activity = dict(
        valid_plan,
        activity_suggestions=["Ideal for 10–25 friends in living room"]
    )
    with pytest.raises(ValueError, match="incompatible with single guest count"):
        validate_celebration_plan(invalid_guest_activity)

    # Missing AI values safely handled with fallbacks
    incomplete_plan = {
        "budget": 500.0,
        "guests": 2,
        "total_allocated_budget": 500.0,
        "estimated_expense": 500.0,
        "budget_allocations": [
            {"category": "Food", "allocated_amount": 500.0, "percentage": 100.0}
        ],
        "food_suggestions": None,
        "decoration_suggestions": None,
        "activity_suggestions": None,
        "budget_saving_tips": None,
        "suggested_theme": None
    }
    validated = validate_celebration_plan(incomplete_plan)
    assert len(validated["food_suggestions"]) > 0
    assert validated["suggested_theme"] is not None


def test_api_endpoint_with_new_fields_and_synchronized_shopping(client: TestClient):
    """Verify POST /suggestions/generate with location, dietary, setting returns synchronized shopping list."""
    payload = {
        "event_type": "Birthday",
        "budget": 1000.0,
        "guests": 1,
        "celebration_style": "Casual",
        "location": "Sector 17, Chandigarh",
        "dietary_preference": "Vegetarian",
        "setting": "Indoor"
    }
    res = client.post("/suggestions/generate", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["target_budget"] == 1000.0
    assert data["total_allocated_budget"] == 1000.0
    assert data["per_guest_cost"] is not None
    assert data["category_estimates"] is not None

    # Verify shopping items synchronize with categories
    items = data["shopping_items"]
    assert items is not None and len(items) > 0
    # Total of shopping items equals total allocated budget
    total_shopping = round(sum(i["cost"] for i in items), 2)
    assert total_shopping == 1000.0

    # Food shopping items sum to Food category estimate
    food_items_sum = round(sum(i["cost"] for i in items if i["category"] == "Food"), 2)
    assert food_items_sum == round(data["category_estimates"]["Food"], 2)

    # Cake shopping items sum to Cake / Gifts category estimate
    cake_items_sum = round(sum(i["cost"] for i in items if i["category"] == "Cake"), 2)
    assert cake_items_sum == round(data["category_estimates"]["Cake / Gifts"], 2)

    # Decor shopping items sum to Decorations category estimate
    decor_items_sum = round(sum(i["cost"] for i in items if i["category"] == "Decor"), 2)
    assert decor_items_sum == round(data["category_estimates"]["Decorations"], 2)


if __name__ == "__main__":
    import pytest
    sys.exit(pytest.main([__file__, "-v"]))
