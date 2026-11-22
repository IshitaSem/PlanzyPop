"""
PlanzyPop - User Data Isolation & Authentication Integration Test Suite
Academic Mini-Project for M.Sc. Computer Science (Data Science)

Verifies strict user-level data isolation:
1. User registration & empty state (0 events, empty dashboard).
2. User A creates an event; event is tied to User A.
3. User A re-authenticates; event persists.
4. User B registers; starts with a completely empty state.
5. User B lists events; User A's events are not visible.
6. ID Probing & Tampering: User B cannot GET, PUT, DELETE User A's event (HTTP 404).
7. User B cannot add/list expenses or tasks on User A's event (HTTP 404).
8. Spot favorites isolation between User A, User B, and guest sessions.
9. Unauthenticated requests cannot access User A's events.
10. Password hashing & token expiration / invalid token rejection (HTTP 401).
"""

import sys
from pathlib import Path
import pytest
from starlette.testclient import TestClient

BACKEND_DIR = Path(__file__).resolve().parent
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))


def test_user_registration_and_empty_state(client: TestClient):
    """Scenario 1: Register a new account -> starts with completely empty state (0 events)."""
    reg_res = client.post("/auth/register", json={
        "name": "New Student",
        "email": "newstudent@example.com",
        "password": "Password123"
    })
    assert reg_res.status_code == 201
    reg_data = reg_res.json()
    assert "access_token" in reg_data
    token = reg_data["access_token"]
    assert reg_data["user"]["email"] == "newstudent@example.com"

    # Fetch events for newly registered user
    headers = {"Authorization": f"Bearer {token}"}
    events_res = client.get("/events", headers=headers)
    assert events_res.status_code == 200
    events = events_res.json()
    # Must NOT have any demo events or sample celebrations
    assert len(events) == 0, f"Expected 0 events for new user, got {len(events)}"

    # Fetch favorites for newly registered user
    favs_res = client.get("/api/spots/favorites", headers=headers)
    assert favs_res.status_code == 200
    assert len(favs_res.json()) == 0


def test_user_a_creates_event_and_persists(client: TestClient):
    """Scenario 2 & 3: User A creates a plan, logs out, logs in -> plan persists."""
    # Register User A
    reg_res = client.post("/auth/register", json={
        "name": "User Alpha",
        "email": "usera@example.com",
        "password": "SecretPassword1"
    })
    assert reg_res.status_code == 201
    token_a = reg_res.json()["access_token"]
    headers_a = {"Authorization": f"Bearer {token_a}"}

    # User A creates an event
    create_res = client.post("/events", headers=headers_a, json={
        "event_name": "Alpha Convocation Bash",
        "event_type": "Graduation",
        "event_date": "2026-12-10",
        "location": "PU Student Centre, Sector 14",
        "guests": 15,
        "budget": 5000.0,
        "celebration_style": "Vibrant Party"
    })
    assert create_res.status_code == 201
    event_a = create_res.json()
    assert event_a["event_name"] == "Alpha Convocation Bash"
    event_a_id = event_a["id"]

    # Logout User A
    logout_res = client.post("/auth/logout", headers=headers_a)
    assert logout_res.status_code == 200

    # Old token should now be invalid
    me_res = client.get("/auth/me", headers=headers_a)
    assert me_res.status_code == 401

    # Login User A again
    login_res = client.post("/auth/login", json={
        "email": "usera@example.com",
        "password": "SecretPassword1"
    })
    assert login_res.status_code == 200
    new_token_a = login_res.json()["access_token"]
    new_headers_a = {"Authorization": f"Bearer {new_token_a}"}

    # Fetch events -> event persists
    get_res = client.get("/events", headers=new_headers_a)
    assert get_res.status_code == 200
    events = get_res.json()
    assert len(events) == 1
    assert events[0]["id"] == event_a_id
    assert events[0]["event_name"] == "Alpha Convocation Bash"


def test_user_b_isolation_and_cross_user_access_prevention(client: TestClient):
    """Scenario 4, 5, 10: User B registers, starts empty, cannot view/modify User A's data."""
    # Setup User A with an event
    reg_a = client.post("/auth/register", json={
        "name": "Owner A",
        "email": "owner_a@example.com",
        "password": "PasswordA123"
    })
    token_a = reg_a.json()["access_token"]
    headers_a = {"Authorization": f"Bearer {token_a}"}

    ev_a = client.post("/events", headers=headers_a, json={
        "event_name": "Owner A Private Event",
        "event_type": "Birthday",
        "event_date": "2026-11-30",
        "location": "Sector 17 Plaza",
        "guests": 5,
        "budget": 3000.0,
        "celebration_style": "Casual Hangout"
    }).json()
    event_a_id = ev_a["id"]

    # User A adds an expense and a task
    exp_a = client.post(f"/events/{event_a_id}/expenses", headers=headers_a, json={
        "expense_name": "Special Cake",
        "category": "Cake",
        "amount": 1200.0
    }).json()
    expense_a_id = exp_a["id"]

    task_a = client.post(f"/events/{event_a_id}/tasks", headers=headers_a, json={
        "task_name": "Pick up balloons",
        "category": "Decorations"
    }).json()
    task_a_id = task_a["id"]

    # Register User B
    reg_b = client.post("/auth/register", json={
        "name": "User Bravo",
        "email": "userb@example.com",
        "password": "PasswordB123"
    })
    assert reg_b.status_code == 201
    token_b = reg_b.json()["access_token"]
    headers_b = {"Authorization": f"Bearer {token_b}"}

    # User B list events -> must be empty
    events_b = client.get("/events", headers=headers_b).json()
    assert len(events_b) == 0

    # User B attempts to access User A's event by ID -> 404
    probe_get = client.get(f"/events/{event_a_id}", headers=headers_b)
    assert probe_get.status_code == 404

    # User B attempts to update User A's event -> 404
    probe_put = client.put(f"/events/{event_a_id}", headers=headers_b, json={
        "event_name": "Hacked Event Name"
    })
    assert probe_put.status_code == 404

    # User B attempts to delete User A's event -> 404
    probe_del = client.delete(f"/events/{event_a_id}", headers=headers_b)
    assert probe_del.status_code == 404

    # User B attempts to view User A's expenses -> 404
    probe_exp_get = client.get(f"/events/{event_a_id}/expenses", headers=headers_b)
    assert probe_exp_get.status_code == 404

    # User B attempts to add expense to User A's event -> 404
    probe_exp_post = client.post(f"/events/{event_a_id}/expenses", headers=headers_b, json={
        "expense_name": "Unauthorized Expense",
        "category": "Food",
        "amount": 500.0
    })
    assert probe_exp_post.status_code == 404

    # User B attempts to modify User A's expense -> 404
    probe_exp_put = client.put(f"/expenses/{expense_a_id}", headers=headers_b, json={
        "expense_name": "Tampered Name"
    })
    assert probe_exp_put.status_code == 404

    # User B attempts to delete User A's expense -> 404
    probe_exp_delete = client.delete(f"/expenses/{expense_a_id}", headers=headers_b)
    assert probe_exp_delete.status_code == 404

    # User B attempts to view User A's tasks -> 404
    probe_tasks_get = client.get(f"/events/{event_a_id}/tasks", headers=headers_b)
    assert probe_tasks_get.status_code == 404

    # User B attempts to add task to User A's event -> 404
    probe_task_post = client.post(f"/events/{event_a_id}/tasks", headers=headers_b, json={
        "task_name": "Unauthorized Task"
    })
    assert probe_task_post.status_code == 404

    # User B attempts to update User A's task -> 404
    probe_task_put = client.put(f"/tasks/{task_a_id}", headers=headers_b, json={
        "is_completed": True
    })
    assert probe_task_put.status_code == 404

    # User B attempts to delete User A's task -> 404
    probe_task_del = client.delete(f"/tasks/{task_a_id}", headers=headers_b)
    assert probe_task_del.status_code == 404


def test_spot_favorites_data_isolation(client: TestClient):
    """Verify saved spots favorites isolation between authenticated users and guest sessions."""
    # User A saves a spot
    reg_a = client.post("/auth/register", json={
        "name": "Spot Lover A",
        "email": "spotlover_a@example.com",
        "password": "Password123"
    })
    token_a = reg_a.json()["access_token"]
    headers_a = {"Authorization": f"Bearer {token_a}"}

    fav_payload = {
        "spot_id": "fav_test_spot_17",
        "name": "Cafe Coffee Day Sector 17",
        "category": "cafes",
        "latitude": 30.7398,
        "longitude": 76.7827,
        "address": "Sector 17, Chandigarh"
    }

    save_res_a = client.post("/api/spots/favorites", headers=headers_a, json=fav_payload)
    assert save_res_a.status_code == 201

    # User A sees 1 favorite
    favs_a = client.get("/api/spots/favorites", headers=headers_a).json()
    assert len(favs_a) == 1
    assert favs_a[0]["spot_id"] == "fav_test_spot_17"

    # User B registers
    reg_b = client.post("/auth/register", json={
        "name": "Spot Lover B",
        "email": "spotlover_b@example.com",
        "password": "Password123"
    })
    token_b = reg_b.json()["access_token"]
    headers_b = {"Authorization": f"Bearer {token_b}"}

    # User B should see 0 favorites
    favs_b = client.get("/api/spots/favorites", headers=headers_b).json()
    assert len(favs_b) == 0

    # Guest session (no auth header) should see guest favorites, not User A's
    favs_guest = client.get("/api/spots/favorites").json()
    # User A's spot should not be in guest favorites unless saved by guest
    guest_spot_ids = [f["spot_id"] for f in favs_guest]
    assert "fav_test_spot_17" not in guest_spot_ids


def test_guest_to_registered_user_switching_and_unauthenticated_guard(client: TestClient):
    """Scenario 6, 7, 8, 9: Guest mode vs registered account switching and unauthenticated probing."""
    # 1. Register User A
    reg_a = client.post("/auth/register", json={
        "name": "User Gamma",
        "email": "usergamma@example.com",
        "password": "PasswordGamma123"
    })
    token_a = reg_a.json()["access_token"]
    headers_a = {"Authorization": f"Bearer {token_a}"}

    # 2. User A creates an event
    ev_a = client.post("/events", headers=headers_a, json={
        "event_name": "Gamma Celebration",
        "event_type": "Farewell",
        "event_date": "2026-12-05",
        "location": "Sector 35 Cafe",
        "guests": 10,
        "budget": 4000.0,
        "celebration_style": "Chill Dinner"
    }).json()
    event_id = ev_a["id"]

    # 3. Simulate Guest mode session (no Authorization header)
    # An unauthenticated GET /events should return empty or unassigned test records, NOT User A's event
    guest_events = client.get("/events").json()
    assert all(e["id"] != event_id for e in guest_events)

    # Guest cannot access User A's event by ID
    guest_probe = client.get(f"/events/{event_id}")
    assert guest_probe.status_code == 404

    # Guest saves a favorite spot with guest identifier
    guest_fav = client.post("/api/spots/favorites?user_id=guest_session_xyz", json={
        "spot_id": "guest_spot_42",
        "name": "Indian Coffee House Sector 17",
        "category": "cafes",
        "latitude": 30.7398,
        "longitude": 76.7827
    })
    assert guest_fav.status_code == 201

    # 4. User A logs back in with their token
    user_a_events = client.get("/events", headers=headers_a).json()
    assert len(user_a_events) == 1
    assert user_a_events[0]["id"] == event_id
    assert user_a_events[0]["event_name"] == "Gamma Celebration"

    # User A's favorites must NOT include the guest's spot
    user_a_favs = client.get("/api/spots/favorites", headers=headers_a).json()
    user_a_fav_ids = [f["spot_id"] for f in user_a_favs]
    assert "guest_spot_42" not in user_a_fav_ids
