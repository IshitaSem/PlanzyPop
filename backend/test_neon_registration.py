"""
PlanzyPop - Neon PostgreSQL Live Registration & Authentication Verification
Directly tests FastAPI auth endpoints and database storage against Neon PostgreSQL.
"""

import sys
from pathlib import Path
from datetime import datetime

BACKEND_DIR = Path(__file__).resolve().parent
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from starlette.testclient import TestClient
from main import app
from database import engine, SessionLocal, IS_POSTGRES
import models
from sqlalchemy import text


def test_live_neon_auth():
    print("=" * 65)
    print("Live Neon PostgreSQL Registration & Authentication Test")
    print("=" * 65)

    print(f"[*] Active Database Dialect: {engine.dialect.name.upper()}")
    print(f"[*] Neon Mode: {IS_POSTGRES}")
    assert IS_POSTGRES, "Expected Neon PostgreSQL to be active via DATABASE_URL"

    client = TestClient(app)
    db = SessionLocal()

    test_ts = int(datetime.utcnow().timestamp())
    test_email = f"student_neon_{test_ts}@example.com"
    test_password = "SecurePassword123!"

    try:
        # Step 1: Register New Account
        print(f"\n1. Testing registration with valid email: {test_email}...")
        reg_res = client.post("/auth/register", json={
            "name": "Neon Student Host",
            "email": test_email,
            "password": test_password
        })
        print(f"   Status Code: {reg_res.status_code}")
        assert reg_res.status_code == 201, f"Registration failed: {reg_res.text}"
        reg_data = reg_res.json()
        assert "access_token" in reg_data, "access_token missing in response"
        token = reg_data["access_token"]
        user_id = reg_data["user"]["id"]
        print(f"   [OK] Registration successful! Created User ID={user_id}")

        # Step 2: Verify in Neon PostgreSQL database directly via SQL
        print("\n2. Querying Neon PostgreSQL database directly to verify password hashing...")
        with engine.connect() as conn:
            row = conn.execute(
                text("SELECT id, name, email, hashed_password FROM users WHERE email = :email"),
                {"email": test_email}
            ).fetchone()
            assert row is not None, "User record not found in Neon database!"
            assert row.hashed_password != test_password, "CRITICAL: Password stored in plaintext!"
            assert ":" in row.hashed_password, "Password not PBKDF2 hashed!"
            print(f"   [OK] Verified in Neon table 'users': ID={row.id}, Email={row.email}")
            print(f"   [OK] Password properly salted and hashed: {row.hashed_password[:20]}... (length={len(row.hashed_password)})")

        # Step 3: Test Duplicate Email Registration
        print("\n3. Testing duplicate registration rejection...")
        dup_res = client.post("/auth/register", json={
            "name": "Another Host",
            "email": test_email.upper(),  # Test case-insensitivity
            "password": test_password
        })
        print(f"   Status Code: {dup_res.status_code}")
        print(f"   Detail Message: {dup_res.json().get('detail')}")
        assert dup_res.status_code == 400, f"Expected 400, got {dup_res.status_code}"
        assert dup_res.json()["detail"] == "Account already exists. Please log in.", "Unexpected duplicate error message"
        print("   [OK] Duplicate email correctly rejected with 'Account already exists. Please log in.'")

        # Step 4: Test Invalid Email Format
        print("\n4. Testing invalid email rejection...")
        inv_res = client.post("/auth/register", json={
            "name": "Invalid User",
            "email": "not-an-email-format",
            "password": test_password
        })
        print(f"   Status Code: {inv_res.status_code}")
        assert inv_res.status_code == 422, f"Expected 422, got {inv_res.status_code}"
        print("   [OK] Malformed email rejected with HTTP 422 Unprocessable Entity.")

        # Step 5: Test Login with Registered Account
        print("\n5. Testing login with registered credentials...")
        login_res = client.post("/auth/login", json={
            "email": test_email,
            "password": test_password
        })
        print(f"   Status Code: {login_res.status_code}")
        assert login_res.status_code == 200, f"Login failed: {login_res.text}"
        login_data = login_res.json()
        assert "access_token" in login_data
        print(f"   [OK] Login successful! New token issued.")

        # Step 6: Test Login with Non-Existent Account (Must return 401, NOT 404)
        print("\n6. Testing login with non-existent email...")
        ghost_login = client.post("/auth/login", json={
            "email": "ghost_user_9999@example.com",
            "password": test_password
        })
        print(f"   Status Code: {ghost_login.status_code}")
        print(f"   Detail Message: {ghost_login.json().get('detail')}")
        assert ghost_login.status_code == 401, f"Expected 401, got {ghost_login.status_code}"
        assert ghost_login.json()["detail"] == "Invalid email or password"
        print("   [OK] Unregistered login returned HTTP 401 'Invalid email or password' (never 404).")

        # Step 7: Test Event Creation for Registered Account
        print("\n7. Testing user-specific event creation and empty dashboard...")
        auth_headers = {"Authorization": f"Bearer {token}"}
        # First check events list: must be empty
        events_list = client.get("/events", headers=auth_headers).json()
        assert len(events_list) == 0, f"New user should have 0 events, got {len(events_list)}"
        print("   [OK] New user starts with empty dashboard (0 events).")

        # Create an event in Neon
        ev_res = client.post("/events", headers=auth_headers, json={
            "event_name": "Neon Launch Celebration",
            "event_type": "Birthday",
            "event_date": "2026-12-31",
            "location": "Chandigarh Sector 35",
            "guests": 8,
            "budget": 3500.0,
            "celebration_style": "Chill Dinner"
        })
        assert ev_res.status_code == 201
        ev_id = ev_res.json()["id"]
        print(f"   [OK] Event created in Neon PostgreSQL: ID={ev_id}")

        # Fetch events list again: must have 1 event
        events_list2 = client.get("/events", headers=auth_headers).json()
        assert len(events_list2) == 1
        assert events_list2[0]["id"] == ev_id
        print("   [OK] Persisted event retrieved for authenticated user.")

        # Step 8: Verify Guest Mode has separate data
        print("\n8. Testing guest mode separation...")
        guest_events = client.get("/events").json()
        assert all(e["id"] != ev_id for e in guest_events), "Data isolation breach: User event visible to guest!"
        print("   [OK] Guest mode cannot see registered user's event.")

        # Cleanup test data from Neon
        print("\n9. Cleaning up test data from Neon PostgreSQL...")
        user_to_delete = db.query(models.User).filter(models.User.id == user_id).first()
        if user_to_delete:
            db.delete(user_to_delete)
        event_to_delete = db.query(models.Event).filter(models.Event.id == ev_id).first()
        if event_to_delete:
            db.delete(event_to_delete)
        db.commit()
        print("   [OK] Cleaned up test user and event from Neon.")

        print("\n" + "=" * 65)
        print("RESULT: ALL NEON REGISTRATION & AUTHENTICATION CHECKS PASSED!")
        print("=" * 65)
        return True

    except Exception as e:
        db.rollback()
        print(f"\n[FAIL] Test encountered error: {e}")
        import traceback
        traceback.print_exc()
        return False
    finally:
        db.close()


if __name__ == "__main__":
    success = test_live_neon_auth()
    sys.exit(0 if success else 1)
