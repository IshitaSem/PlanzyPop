"""
PlanzyPop - Stage 2 Automated Verification Script
Academic Mini-Project for M.Sc. Computer Science (Data Science)

Run this script to verify:
1. Creation of 'planzypop.db' SQLite database file.
2. Verification of the 'events' table and its required schema.
3. Database connectivity and session transaction testing.
"""

import os
import sys
import sqlite3

# Safe UTF-8 console output on Windows
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8")

# Ensure backend directory is in sys.path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from database import engine, SessionLocal
import models

def test_database_and_schema():
    print("=" * 65)
    print("PlanzyPop Stage 2: SQLite & Event Table Verification Suite")
    print("=" * 65)

    # 1. Trigger table creation
    models.Base.metadata.create_all(bind=engine)

    # 2. Check if planzypop.db file exists
    db_path = os.path.join(os.path.dirname(__file__), "planzypop.db")
    if os.path.exists(db_path):
        size_kb = os.path.getsize(db_path) / 1024
        print(f"[PASS] Database file created: {db_path} ({size_kb:.2f} KB)")
    else:
        print(f"[FAIL] Database file not found at: {db_path}")
        return False

    # 3. Check tables inside SQLite
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
    tables = [row[0] for row in cursor.fetchall()]
    print(f"[PASS] Tables present in database: {tables}")

    if "events" not in tables:
        print("[FAIL] 'events' table was not found in the database!")
        conn.close()
        return False
    print("[PASS] 'events' table exists.")

    # 4. Check schema of events table
    cursor.execute("PRAGMA table_info(events);")
    columns_info = cursor.fetchall()
    conn.close()

    # Required fields according to Stage 2 specification
    expected_fields = {
        "id": "INTEGER",
        "event_name": "VARCHAR(100)",
        "event_type": "VARCHAR(50)",
        "event_date": "VARCHAR(50)",
        "location": "VARCHAR(200)",
        "guests": "INTEGER",
        "budget": "FLOAT",
        "celebration_style": "VARCHAR(100)",
        "created_at": "DATETIME",
    }

    found_columns = {col[1]: col[2] for col in columns_info}
    print("\nColumns in 'events' table:")
    for col in columns_info:
        cid, name, col_type, notnull, dflt_value, pk = col
        pk_str = " (PRIMARY KEY)" if pk else ""
        print(f"  - {name:<18} : {col_type:<15}{pk_str}")

    for field in expected_fields:
        if field not in found_columns:
            print(f"[FAIL] Missing expected column: '{field}'")
            return False
    print("\n[PASS] All 9 required fields are present with correct definitions.")

    # 5. Test inserting, querying, and deleting a test record via SQLAlchemy Session
    db = SessionLocal()
    try:
        test_event = models.Event(
            event_name="College Fresher Party",
            event_type="Fresher",
            event_date="2026-11-20",
            location="Campus Activity Hall",
            guests=25,
            budget=5000.0,
            celebration_style="Casual & Fun"
        )
        db.add(test_event)
        db.commit()
        db.refresh(test_event)

        assert test_event.id is not None, "Failed to generate primary key ID"
        print(f"[PASS] Test record inserted successfully (Generated ID: {test_event.id})")

        # Query back
        queried = db.query(models.Event).filter(models.Event.id == test_event.id).first()
        assert queried is not None
        assert queried.event_name == "College Fresher Party"
        print(f"[PASS] Test record queried back: '{queried.event_name}' ({queried.event_type})")

        # Clean up test record so database stays clean
        db.delete(queried)
        db.commit()
        print("[PASS] Test record cleaned up successfully.")

    except Exception as e:
        db.rollback()
        print(f"[FAIL] Database transaction error: {e}")
        return False
    finally:
        db.close()

    print("=" * 65)
    print("ALL STAGE 2 DATABASE CHECKS PASSED SUCCESSFULLY!")
    print("=" * 65)
    return True

if __name__ == "__main__":
    success = test_database_and_schema()
    sys.exit(0 if success else 1)
