"""
PlanzyPop - Stage 3 Automated Verification Script
Academic Mini-Project for M.Sc. Computer Science (Data Science)

Run this script to verify:
1. Event Creation (POST /events)
2. Retrieve All Events (GET /events)
3. Retrieve Event by ID (GET /events/{id})
4. Update Event (PUT /events/{id})
5. Delete Event (DELETE /events/{id})
6. Proper 404 error responses for non-existent events
7. Data validation error handling (422 for negative budget/guests or empty strings)
"""

import sys
import os

# Safe UTF-8 console output on Windows
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8")

# Ensure backend directory is in the module search path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from starlette.testclient import TestClient
from main import app

def run_stage3_tests():
    print("=" * 65)
    print("PlanzyPop Stage 3: Event CRUD & Validation Test Suite")
    print("=" * 65)

    client = TestClient(app)

    # 1. CREATE an Event (POST /events)
    payload = {
        "event_name": "Rohan's Hostel Birthday Party",
        "event_type": "Birthday",
        "event_date": "2026-11-25",
        "location": "Hostel Common Room, Block B",
        "guests": 15,
        "budget": 2500.0,
        "celebration_style": "DIY & Funky"
    }
    res = client.post("/events", json=payload)
    assert res.status_code == 201, f"Expected 201, got {res.status_code}: {res.text}"
    created = res.json()
    event_id = created["id"]
    assert created["event_name"] == payload["event_name"]
    assert created["guests"] == 15
    assert created["budget"] == 2500.0
    print(f"[PASS] POST /events created event successfully (ID: {event_id})")

    # 2. GET All Events (GET /events)
    res = client.get("/events")
    assert res.status_code == 200, f"Expected 200, got {res.status_code}"
    events = res.json()
    assert isinstance(events, list)
    assert any(e["id"] == event_id for e in events)
    print(f"[PASS] GET /events returned {len(events)} event(s)")

    # 3. GET Event by ID (GET /events/{id})
    res = client.get(f"/events/{event_id}")
    assert res.status_code == 200, f"Expected 200, got {res.status_code}"
    event = res.json()
    assert event["id"] == event_id
    assert event["location"] == "Hostel Common Room, Block B"
    print(f"[PASS] GET /events/{event_id} retrieved matching record")

    # 4. UPDATE Event (PUT /events/{id})
    update_payload = {
        "budget": 3000.0,
        "guests": 18,
        "location": "Hostel Rooftop Garden"
    }
    res = client.put(f"/events/{event_id}", json=update_payload)
    assert res.status_code == 200, f"Expected 200, got {res.status_code}"
    updated = res.json()
    assert updated["budget"] == 3000.0
    assert updated["guests"] == 18
    assert updated["location"] == "Hostel Rooftop Garden"
    assert updated["event_name"] == payload["event_name"]
    print(f"[PASS] PUT /events/{event_id} updated fields correctly")

    # 5. 404 NOT FOUND for non-existent event ID
    ghost_id = 999999
    res = client.get(f"/events/{ghost_id}")
    assert res.status_code == 404, f"Expected 404, got {res.status_code}"
    print(f"[PASS] GET /events/{ghost_id} correctly returned 404 Not Found")

    res = client.put(f"/events/{ghost_id}", json={"event_name": "Ghost"})
    assert res.status_code == 404, f"Expected 404, got {res.status_code}"
    print(f"[PASS] PUT /events/{ghost_id} correctly returned 404 Not Found")

    res = client.delete(f"/events/{ghost_id}")
    assert res.status_code == 404, f"Expected 404, got {res.status_code}"
    print(f"[PASS] DELETE /events/{ghost_id} correctly returned 404 Not Found")

    # 6. DATA VALIDATION (422 Unprocessable Entity)
    res = client.post("/events", json={
        "event_name": "Invalid Budget Event",
        "event_type": "Party",
        "event_date": "2026-12-01",
        "budget": -500.0
    })
    assert res.status_code == 422, f"Expected 422, got {res.status_code}"
    print("[PASS] Rejected negative budget with HTTP 422")

    res = client.post("/events", json={
        "event_name": "Invalid Guests Event",
        "event_type": "Party",
        "event_date": "2026-12-01",
        "guests": -5
    })
    assert res.status_code == 422, f"Expected 422, got {res.status_code}"
    print("[PASS] Rejected negative guests with HTTP 422")

    res = client.post("/events", json={
        "event_name": "   ",
        "event_type": "Party",
        "event_date": "2026-12-01"
    })
    assert res.status_code == 422, f"Expected 422, got {res.status_code}"
    print("[PASS] Rejected blank event_name with HTTP 422")

    res = client.post("/events", json={"event_name": "No Type Event"})
    assert res.status_code == 422, f"Expected 422, got {res.status_code}"
    print("[PASS] Rejected missing required fields with HTTP 422")

    # 7. DELETE Event (DELETE /events/{id})
    res = client.delete(f"/events/{event_id}")
    assert res.status_code == 200, f"Expected 200, got {res.status_code}"
    print(f"[PASS] DELETE /events/{event_id} deleted successfully")

    # Verify event no longer exists
    res = client.get(f"/events/{event_id}")
    assert res.status_code == 404
    print(f"[PASS] Verified event {event_id} no longer exists in database")

    print("=" * 65)
    print("ALL STAGE 3 CRUD & VALIDATION CHECKS PASSED!")
    print("=" * 65)
    return True

if __name__ == "__main__":
    success = run_stage3_tests()
    sys.exit(0 if success else 1)
