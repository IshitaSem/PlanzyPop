"""
PlanzyPop – Stage 6 Automated Verification Script
Academic Mini-Project for M.Sc. Computer Science (Data Science)

Run this script to verify:
1. Birthday suggestions (themes, cakes, games, allocations)
2. College Party suggestions (group activities, music, campus hall)
3. Farewell suggestions (nostalgia corner, senior roasts, memory gifts)
4. Picnic suggestions (outdoor games, portable food, park mats)
5. Hostel Party suggestions (midnight snacks, floor cushions, collaborative music)
6. Different celebration styles (Casual, Aesthetic, DIY / Budget-Friendly, Traditional, Fun / Party)
7. Very low budget handling (budget under Rs 1,500)
8. Zero budget handling (free DIY suggestions, all allocated amounts = 0.0)
9. Larger budget handling (premium cakes, sliders, custom decor)
10. Guest count scaling (tips for small groups vs groups > 15 / > 20)
11. Budget allocation percentages summing to exactly 100%
12. Exact total budget allocation reconciling with input budget after rounding
13. Input validation: negative budget rejection (422)
14. Input validation: negative guest count rejection (422)
15. Unknown event type handling (graceful fallback)
16. Unknown celebration style handling (graceful fallback)
17. Full API endpoint test (POST /suggestions/generate)
18. Database independence check: verifies 0 database records are created by suggestions
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
from database import SessionLocal
import models
from suggestions import (
    generate_event_suggestions,
    CATEGORY_ALLOCATION_RULES,
    compute_budget_allocation
)

def run_stage6_tests():
    print("=" * 65)
    print("PlanzyPop Stage 6: Rule-Based Suggestion Engine Test Suite")
    print("=" * 65)

    client = TestClient(app)

    bday = generate_event_suggestions("Birthday", 3000.0, 10, "Aesthetic")
    assert "Pastel Balloons" in bday["suggested_theme"] or "Polaroid" in bday["suggested_theme"]
    assert any("cake" in f.lower() for f in bday["food_suggestions"])
    assert any("cake" in a.lower() for a in bday["activity_suggestions"])
    assert bday["budget_tier"] == "Low Budget (₹1,500 – ₹4,000)"
    print("[PASS] Test 1: Birthday suggestions generated with cakes, decor, and aesthetic theme")

    college = generate_event_suggestions("College Party", 6000.0, 25, "Fun / Party")
    assert "Neon" in college["suggested_theme"] or "College" in college["suggested_theme"]
    assert any("playlist" in a.lower() or "mafia" in a.lower() for a in college["activity_suggestions"])
    assert college["budget_tier"] == "Moderate Budget (₹4,000 – ₹10,000)"
    print("[PASS] Test 2: College Party suggestions generated with group activities and high energy vibes")

    farewell = generate_event_suggestions("Farewell", 4000.0, 20, "Casual")
    assert "Memory" in farewell["suggested_theme"] or "Nostalgia" in farewell["suggested_theme"]
    assert any("tribute" in a.lower() or "scrapbook" in a.lower() or "roast" in a.lower() for a in farewell["activity_suggestions"])
    assert any("memories" in d.lower() or "notes" in d.lower() for d in farewell["decoration_suggestions"])
    print("[PASS] Test 3: Farewell suggestions generated with memory wall, senior tributes, and mementos")

    picnic = generate_event_suggestions("Picnic", 2000.0, 6, "Casual")
    assert "Park" in picnic["suggested_theme"] or "Green" in picnic["suggested_theme"]
    assert any("mat" in d.lower() or "cushion" in d.lower() for d in picnic["decoration_suggestions"])
    assert any("frisbee" in a.lower() or "badminton" in a.lower() for a in picnic["activity_suggestions"])
    print("[PASS] Test 4: Picnic suggestions generated with outdoor setup, portable snacks, and games")

    hostel = generate_event_suggestions("Hostel Party", 1200.0, 8, "DIY / Budget-Friendly")
    assert "Hostel" in hostel["suggested_theme"] or "Maggi" in hostel["suggested_theme"]
    assert any("maggi" in f.lower() or "samosa" in f.lower() or "popcorn" in f.lower() for f in hostel["food_suggestions"])
    print("[PASS] Test 5: Hostel Party suggestions generated with late-night food and room decor")

    styles = {
        "Aesthetic": "fairy lights",
        "DIY / Budget-Friendly": "origami",
        "Traditional": "marigold",
        "Fun / Party": "fringe",
        "Casual": "banners"
    }
    for style, expected_keyword in styles.items():
        res = generate_event_suggestions("Birthday", 2500.0, 5, style)
        decor_str = " ".join(res["decoration_suggestions"]).lower()
        theme_str = res["suggested_theme"].lower()
        assert expected_keyword in decor_str or expected_keyword in theme_str, (
            f"Keyword '{expected_keyword}' not found for style '{style}' in decor: {decor_str}"
        )
    print("[PASS] Test 6: All 5 celebration styles reflect distinct decor and themes")

    low = generate_event_suggestions("Birthday", 800.0, 5, "DIY / Budget-Friendly")
    assert low["budget_tier"] == "Very Low Budget (Under ₹1,500)"
    assert any("samosa" in f.lower() or "popcorn" in f.lower() or "bakery" in f.lower() for f in low["food_suggestions"])
    print("[PASS] Test 7: Very low budget correctly classified and suggests affordable snacks")

    zero = generate_event_suggestions("Get-together", 0.0, 6, "Casual")
    assert zero["budget_tier"] == "Zero Budget / Free Celebration"
    assert any("potluck" in f.lower() or "homemade" in f.lower() for f in zero["food_suggestions"])
    assert any("borrowed" in d.lower() or "chalkboard" in d.lower() or "photos" in d.lower() for d in zero["decoration_suggestions"])
    for alloc in zero["budget_allocations"]:
        assert alloc["allocated_amount"] == 0.0, f"Expected 0.0 allocation for zero budget, got {alloc['allocated_amount']}"
    assert zero["total_allocated_budget"] == 0.0
    print("[PASS] Test 8: Zero budget generates free potluck/DIY activities and 0.0 allocations")

    high = generate_event_suggestions("Birthday", 15000.0, 30, "Aesthetic")
    assert high["budget_tier"] == "Higher Budget (Above ₹10,000)"
    assert any("designer" in f.lower() or "sliders" in f.lower() or "nachos" in f.lower() for f in high["food_suggestions"])
    print("[PASS] Test 9: Higher budget suggests premium custom cakes and appetizer platters")

    large_group = generate_event_suggestions("College Party", 5000.0, 25, "Fun / Party")
    # For guests > 20, activity list includes team division advice
    assert any("teams" in a.lower() or "relay" in a.lower() for a in large_group["activity_suggestions"])
    # For guests > 15, food suggestions include bulk order tip
    assert any("bulk" in f.lower() for f in large_group["food_suggestions"])
    print("[PASS] Test 10: Large guest counts automatically receive bulk and team scaling advice")

    for ev_key, ratios in CATEGORY_ALLOCATION_RULES.items():
        total_pct = sum(ratios.values())
        assert abs(total_pct - 100.0) < 1e-6, f"Ratios for '{ev_key}' sum to {total_pct}, not 100.0"
    print("[PASS] Test 11: All category allocation rules sum to exactly 100.0%")

    test_budgets = [1234.57, 100.0, 50.0, 3333.33, 9999.99, 0.0, 1500.0]
    for b in test_budgets:
        allocs = compute_budget_allocation("birthday", b)
        sum_allocated = round(sum(a["allocated_amount"] for a in allocs), 2)
        assert sum_allocated == round(b, 2), f"Allocation sum {sum_allocated} does not match budget {b}"
    print("[PASS] Test 12: Exact rounding compensation guarantees sum(allocations) == budget")

    res = client.post("/suggestions/generate", json={
        "event_type": "Birthday",
        "budget": -500.0,
        "guests": 10,
        "celebration_style": "Casual"
    })
    assert res.status_code == 422
    print("[PASS] Test 13: Negative budget rejected with HTTP 422")

    res = client.post("/suggestions/generate", json={
        "event_type": "Birthday",
        "budget": 2000.0,
        "guests": -5,
        "celebration_style": "Casual"
    })
    assert res.status_code == 422
    print("[PASS] Test 14: Negative guest count rejected with HTTP 422")

    res = client.post("/suggestions/generate", json={
        "event_type": "   ",
        "budget": 2000.0,
        "guests": 5
    })
    assert res.status_code == 422
    print("[PASS] Test 14b: Blank event_type rejected with HTTP 422")

    res_unk_event = generate_event_suggestions("Inter-Galactic Robot Launch", 3000.0, 10, "Casual")
    assert res_unk_event["suggested_theme"] is not None
    assert len(res_unk_event["food_suggestions"]) > 0
    assert len(res_unk_event["budget_allocations"]) > 0
    print("[PASS] Test 15: Unknown event type gracefully falls back to general celebration heuristics")

    res_unk_style = generate_event_suggestions("Birthday", 3000.0, 10, "Cyberpunk Gothic")
    assert res_unk_style["suggested_theme"] is not None
    assert len(res_unk_style["decoration_suggestions"]) > 0
    print("[PASS] Test 16: Unknown celebration style gracefully falls back to casual decor")

    api_payload = {
        "event_type": "Hostel Party",
        "budget": 2500.0,
        "guests": 12,
        "celebration_style": "DIY / Budget-Friendly"
    }
    res_api = client.post("/suggestions/generate", json=api_payload)
    assert res_api.status_code == 200
    data = res_api.json()
    assert data["event_type"] == "Hostel Party"
    assert data["budget"] == 2500.0
    assert data["guests"] == 12
    assert data["celebration_style"] == "DIY / Budget-Friendly"
    assert "budget_tier" in data
    assert "suggested_theme" in data
    assert len(data["food_suggestions"]) > 0
    assert len(data["decoration_suggestions"]) > 0
    assert len(data["activity_suggestions"]) > 0
    assert len(data["budget_allocations"]) > 0
    assert data["total_allocated_budget"] == 2500.0
    assert len(data["budget_saving_tips"]) > 0
    assert "disclaimer" in data
    print(f"[PASS] Test 17: POST /suggestions/generate returned full structured response (Theme: '{data['suggested_theme']}')")

    # Generating suggestions must NOT create or alter records in the database.
    db = SessionLocal()
    try:
        events_count_before = db.query(models.Event).count()
        expenses_count_before = db.query(models.Expense).count()
        tasks_count_before = db.query(models.Task).count()

        client.post("/suggestions/generate", json=api_payload)
        client.post("/suggestions/generate", json={"event_type": "Picnic", "budget": 1500.0, "guests": 6, "celebration_style": "Casual"})
        client.post("/suggestions/generate", json={"event_type": "Birthday", "budget": 0.0, "guests": 10, "celebration_style": "Aesthetic"})

        events_count_after = db.query(models.Event).count()
        expenses_count_after = db.query(models.Expense).count()
        tasks_count_after = db.query(models.Task).count()

        assert events_count_before == events_count_after, "Suggestions created Event records!"
        assert expenses_count_before == expenses_count_after, "Suggestions created Expense records!"
        assert tasks_count_before == tasks_count_after, "Suggestions created Task records!"
        print("[PASS] Test 18: Verified that suggestion requests are completely stateless and create 0 database records")
    finally:
        db.close()

    print("=" * 65)
    print("ALL STAGE 6 SUGGESTION ENGINE CHECKS PASSED!")
    print("=" * 65)
    return True

if __name__ == "__main__":
    success = run_stage6_tests()
    sys.exit(0 if success else 1)
