"""
PlanzyPop - Database Schema Initialization & Verification Script
Academic Mini-Project for M.Sc. Computer Science (Data Science)

Initializes relational database tables in Neon PostgreSQL (or SQLite fallback)
and verifies that all required models and columns exist.
"""

import sys
from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parent
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from sqlalchemy import inspect, text
from database import engine, Base, IS_POSTGRES
import models


def init_database():
    dialect_name = engine.dialect.name
    print(f"[*] Target Database Engine: {dialect_name.upper()} ({'Neon PostgreSQL' if IS_POSTGRES else 'Local SQLite'})")

    if IS_POSTGRES:
        url_safe = str(engine.url).split("@")[-1] if "@" in str(engine.url) else "PostgreSQL"
        print(f"[*] Connected Host/DB: {url_safe}")
    else:
        print(f"[*] Database File: {engine.url.database}")

    print("[*] Creating tables from SQLAlchemy ORM metadata...")
    Base.metadata.create_all(bind=engine)
    print("[+] Base.metadata.create_all executed successfully.")

    inspector = inspect(engine)
    tables = inspector.get_table_names()
    print(f"[+] Total tables found in database: {len(tables)}")
    print(f"[+] Table list: {tables}")

    # Check and migrate columns if needed
    if "events" in tables:
        cols = [c["name"] for c in inspector.get_columns("events")]
        if "user_id" not in cols:
            print("[*] Adding missing column 'user_id' to 'events' table...")
            with engine.begin() as conn:
                conn.execute(text("ALTER TABLE events ADD COLUMN user_id VARCHAR(100)"))
            print("[+] Column 'user_id' added successfully.")

    required_tables = ["users", "user_tokens", "events", "expenses", "tasks", "saved_spots"]
    missing = [t for t in required_tables if t not in tables]

    if missing:
        print(f"[!] WARNING: Missing required tables: {missing}")
        return False
    else:
        print("[+] All 6 required application tables are present and verified!")

    # Verify column structures
    print("\n--- Schema Verification ---")
    for tbl in required_tables:
        cols = inspector.get_columns(tbl)
        col_names = [f"{c['name']} ({c['type']})" for c in cols]
        print(f"Table '{tbl}': {', '.join(col_names)}")

    print("\n[+] Database initialization completed successfully!")
    return True


if __name__ == "__main__":
    success = init_database()
    sys.exit(0 if success else 1)
