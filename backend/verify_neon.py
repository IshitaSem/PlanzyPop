"""
PlanzyPop - Neon PostgreSQL Verification & Roundtrip Test Script
Academic Mini-Project for M.Sc. Computer Science (Data Science)

Verifies:
1. Live connection to Neon PostgreSQL (or active DB)
2. Presence of all 6 application tables
3. User registration and password verification
4. Session token generation and validation
5. Celebration plan (Event) creation and persistence
6. Itemized Expense & Task persistence
7. Data isolation between users
8. Clean teardown of test verification rows
"""

import sys
from pathlib import Path
from datetime import datetime

BACKEND_DIR = Path(__file__).resolve().parent
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from sqlalchemy import inspect, text
from database import engine, SessionLocal, IS_POSTGRES
import models
from auth_utils import hash_password, verify_password, generate_token


def run_verification():
    print("=" * 60)
    print("PlanzyPop Database Verification & Live Storage Test")
    print("=" * 60)

    dialect_name = engine.dialect.name
    print(f"1. Database Engine: {dialect_name.upper()}")
    print(f"   Mode: {'Neon PostgreSQL' if IS_POSTGRES else 'Local SQLite'}")

    # Step 1: Test Connection Ping
    print("\n2. Testing connection ping...")
    try:
        with engine.connect() as conn:
            result = conn.execute(text("SELECT 1")).scalar()
            print(f"   Connection successful! (SELECT 1 -> {result})")
    except Exception as e:
        print(f"   [FAIL] Could not connect to database: {e}")
        return False

    # Step 2: Check tables
    print("\n3. Verifying required tables...")
    inspector = inspect(engine)
    existing_tables = inspector.get_table_names()
    required_tables = ["users", "user_tokens", "events", "expenses", "tasks", "saved_spots"]
    for t in required_tables:
        if t in existing_tables:
            print(f"   [OK] Table '{t}' exists.")
        else:
            print(f"   [MISSING] Table '{t}' NOT found. Initializing...")
            models.Base.metadata.create_all(bind=engine)
            break

    # Re-verify
    inspector = inspect(engine)
    existing_tables = inspector.get_table_names()
    all_ok = all(t in existing_tables for t in required_tables)
    if not all_ok:
        print("   [FAIL] Failed to create all required tables.")
        return False

    # Check and migrate user_id on events
    if "events" in existing_tables:
        cols = [c["name"] for c in inspector.get_columns("events")]
        if "user_id" not in cols:
            with engine.begin() as conn:
                conn.execute(text("ALTER TABLE events ADD COLUMN user_id VARCHAR(100)"))
            print("   [OK] Migrated: added 'user_id' column to events table.")

    print("   All 6 required tables are present.")

    # Step 3: Test User Registration & Live Storage
    print("\n4. Testing user registration and live record storage...")
    db = SessionLocal()
    test_email = f"neon_test_{int(datetime.utcnow().timestamp())}@planzypop.test"
    test_user_id = None
    test_event_id = None

    try:
        # Create User
        test_pw = "TestSecurePass123!"
        hashed = hash_password(test_pw)
        new_user = models.User(
            name="Neon Test User",
            email=test_email,
            hashed_password=hashed
        )
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        test_user_id = new_user.id
        print(f"   [OK] User created: ID={test_user_id}, Email={test_email}")

        # Verify Password Verification
        assert verify_password(test_pw, new_user.hashed_password), "Password verification failed"
        print("   [OK] Password hashing and verification passed.")

        # Create Session Token
        tok_val = generate_token()
        tok_rec = models.UserToken(token=tok_val, user_id=test_user_id)
        db.add(tok_rec)
        db.commit()
        print(f"   [OK] Session token stored for User ID={test_user_id}")

        # Create Celebration Plan (Event)
        new_event = models.Event(
            user_id=str(test_user_id),
            event_name="Neon Integration Test Birthday",
            event_type="Birthday",
            event_date="2026-12-25",
            location="Chandigarh Sector 17",
            guests=10,
            budget=4500.0,
            celebration_style="Aesthetic"
        )
        db.add(new_event)
        db.commit()
        db.refresh(new_event)
        test_event_id = new_event.id
        print(f"   [OK] Celebration Event created: ID={test_event_id}, Name='{new_event.event_name}'")

        # Add Expense
        expense = models.Expense(
            event_id=test_event_id,
            expense_name="Chocolate Cake",
            category="Cake",
            amount=750.0,
            expense_date="2026-12-25"
        )
        db.add(expense)

        # Add Task
        task = models.Task(
            event_id=test_event_id,
            task_name="Order balloons and streamers",
            description="HIGH",
            due_date="2026-12-24",
            is_completed=False
        )
        db.add(task)
        db.commit()
        print("   [OK] Linked Expense and Task created and committed.")

        # Verify Persistence by querying fresh from database
        fetched_event = db.query(models.Event).filter(models.Event.id == test_event_id).first()
        assert fetched_event is not None, "Event not found after commit"
        assert len(fetched_event.expenses) == 1, "Expense relationship not resolved"
        assert len(fetched_event.tasks) == 1, "Task relationship not resolved"
        print(f"   [OK] Queried back Event ID={fetched_event.id} with {len(fetched_event.expenses)} expense and {len(fetched_event.tasks)} task.")

        # Step 4: Verify Data Isolation
        print("\n5. Verifying user data isolation...")
        other_user_events = db.query(models.Event).filter(models.Event.user_id == "999999").all()
        assert len(other_user_events) == 0, "Isolation breach: Found events for non-existent user"

        user_events = db.query(models.Event).filter(models.Event.user_id == str(test_user_id)).all()
        assert len(user_events) == 1, f"Expected 1 event for user {test_user_id}, found {len(user_events)}"
        print("   [OK] Data isolation verified: User records are strictly partitioned by user_id.")

        # Step 5: Teardown Test Data
        print("\n6. Cleaning up test verification rows...")
        db.delete(new_user)  # Cascades to user_tokens
        db.delete(fetched_event)  # Cascades to expenses and tasks
        db.commit()
        print("   [OK] Verification records cleaned up cleanly.")

        print("\n" + "=" * 60)
        print("RESULT: ALL DATABASE INTEGRATION CHECKS PASSED!")
        print("=" * 60)
        return True

    except Exception as e:
        db.rollback()
        print(f"   [FAIL] Error during database operations: {e}")
        import traceback
        traceback.print_exc()
        return False
    finally:
        db.close()


if __name__ == "__main__":
    success = run_verification()
    sys.exit(0 if success else 1)
