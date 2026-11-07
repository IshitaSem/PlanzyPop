"""
PlanzyPop - Event Management & Validation Verification Suite
Academic Mini-Project for M.Sc. Computer Science (Data Science)

Test Coverage:
1. Event Creation (POST /events)
2. Retrieve All Events (GET /events)
3. Retrieve Event by ID (GET /events/{id})
4. Update Event (PUT /events/{id})
5. Delete Event (DELETE /events/{id})
6. 404 Not Found error responses for non-existent events
7. Data validation handling (HTTP 422 for negative budget/guests, empty names, missing fields)
"""

import sys
from pathlib import Path
import pytest
from starlette.testclient import TestClient

BACKEND_DIR = Path(__file__).resolve().parent
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))


@pytest.fixture
def sample_event_payload():
    return {
        "event_name": "Rohan's Hostel Birthday Party",
        "event_type": "Birthday",
        "event_date": "2026-11-25",
        "location": "Hostel Common Room, Block B",
        "guests": 15,
        "budget": 2500.0,
        "celebration_style": "DIY & Funky"
    }


def test_create_event(client: TestClient, sample_event_payload):
    """Verify that a valid event can be created via POST /events."""
    res = client.post("/events", json=sample_event_payload)
    assert res.status_code == 201, f"Expected 201, got {res.status_code}: {res.text}"
    created = res.json()
    assert created["id"] is not None
    assert created["event_name"] == sample_event_payload["event_name"]
    assert created["event_type"] == "Birthday"
    assert created["guests"] == 15
    assert created["budget"] == 2500.0
    assert created["location"] == sample_event_payload["location"]

    # Cleanup
    client.delete(f"/events/{created['id']}")


def test_get_all_events(client: TestClient, sample_event_payload):
    """Verify retrieving list of all events via GET /events."""
    res_create = client.post("/events", json=sample_event_payload)
    event_id = res_create.json()["id"]

    res = client.get("/events")
    assert res.status_code == 200
    events = res.json()
    assert isinstance(events, list)
    assert any(e["id"] == event_id for e in events)

    # Cleanup
    client.delete(f"/events/{event_id}")


def test_get_event_by_id(client: TestClient, sample_event_payload):
    """Verify retrieving a specific event by ID via GET /events/{id}."""
    res_create = client.post("/events", json=sample_event_payload)
    event_id = res_create.json()["id"]

    res = client.get(f"/events/{event_id}")
    assert res.status_code == 200
    event = res.json()
    assert event["id"] == event_id
    assert event["event_name"] == sample_event_payload["event_name"]
    assert event["location"] == "Hostel Common Room, Block B"

    # Cleanup
    client.delete(f"/events/{event_id}")


def test_update_event(client: TestClient, sample_event_payload):
    """Verify updating event details via PUT /events/{id}."""
    res_create = client.post("/events", json=sample_event_payload)
    event_id = res_create.json()["id"]

    update_payload = {
        "budget": 3000.0,
        "guests": 18,
        "location": "Hostel Rooftop Garden"
    }
    res = client.put(f"/events/{event_id}", json=update_payload)
    assert res.status_code == 200
    updated = res.json()
    assert updated["budget"] == 3000.0
    assert updated["guests"] == 18
    assert updated["location"] == "Hostel Rooftop Garden"
    assert updated["event_name"] == sample_event_payload["event_name"]

    # Cleanup
    client.delete(f"/events/{event_id}")


def test_event_not_found_errors(client: TestClient):
    """Verify 404 responses for GET, PUT, DELETE with non-existent IDs."""
    ghost_id = 999999
    assert client.get(f"/events/{ghost_id}").status_code == 404
    assert client.put(f"/events/{ghost_id}", json={"event_name": "Ghost"}).status_code == 404
    assert client.delete(f"/events/{ghost_id}").status_code == 404


def test_event_validation_errors(client: TestClient):
    """Verify that invalid inputs return HTTP 422 Unprocessable Entity."""
    # Negative budget
    res = client.post("/events", json={
        "event_name": "Invalid Budget Event",
        "event_type": "Party",
        "event_date": "2026-12-01",
        "budget": -500.0
    })
    assert res.status_code == 422

    # Negative guests
    res = client.post("/events", json={
        "event_name": "Invalid Guests Event",
        "event_type": "Party",
        "event_date": "2026-12-01",
        "guests": -5
    })
    assert res.status_code == 422

    # Blank event_name
    res = client.post("/events", json={
        "event_name": "   ",
        "event_type": "Party",
        "event_date": "2026-12-01"
    })
    assert res.status_code == 422

    # Missing required event_type
    res = client.post("/events", json={"event_name": "No Type Event"})
    assert res.status_code == 422


def test_delete_event(client: TestClient, sample_event_payload):
    """Verify deleting an event and confirming it is no longer retrievable."""
    res_create = client.post("/events", json=sample_event_payload)
    event_id = res_create.json()["id"]

    res_del = client.delete(f"/events/{event_id}")
    assert res_del.status_code == 200

    # Ensure event no longer exists
    assert client.get(f"/events/{event_id}").status_code == 404


if __name__ == "__main__":
    import pytest
    sys.exit(pytest.main([__file__, "-v"]))
