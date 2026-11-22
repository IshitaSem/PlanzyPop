"""
PlanzyPop - Stage 1 Automated Verification Script
Academic Mini-Project for M.Sc. Computer Science (Data Science)

Run this script to verify:
1. Environment and dependencies (FastAPI, Starlette, Uvicorn, HTTPX)
2. Correct loading of main.py
3. Functional tests for '/' and '/health' endpoints using TestClient
"""

import sys
import os

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8")

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

def run_checks():
    print("=" * 60)
    print("PlanzyPop Stage 1: Diagnostic & Verification Suite")
    print("=" * 60)
    print(f"Python Interpreter : {sys.executable}")
    print(f"Python Version     : {sys.version.split()[0]}")
    print("-" * 60)

    try:
        import fastapi
        print(f"[PASS] FastAPI installed (version: {fastapi.__version__})")
    except ImportError as e:
        print(f"[FAIL] FastAPI not found: {e}")
        return False

    try:
        import uvicorn
        print(f"[PASS] Uvicorn installed (version: {uvicorn.__version__})")
    except ImportError as e:
        print(f"[FAIL] Uvicorn not found: {e}")
        return False

    try:
        import starlette
        print(f"[PASS] Starlette installed (version: {starlette.__version__})")
    except ImportError as e:
        print(f"[FAIL] Starlette not found: {e}")
        return False

    try:
        import httpx
        print(f"[PASS] HTTPX installed (version: {httpx.__version__})")
    except ImportError as e:
        print(f"[FAIL] HTTPX not found: {e}")
        return False

    try:
        from main import app
        print(f"[PASS] Successfully loaded 'app' from main.py ('{app.title}')")
    except Exception as e:
        print(f"[FAIL] Could not import 'app' from main.py: {e}")
        return False

    try:
        from starlette.testclient import TestClient
        client = TestClient(app)

        res_root = client.get("/")
        assert res_root.status_code == 200, f"Expected 200, got {res_root.status_code}"
        assert res_root.json().get("status") == "online"
        print(f"[PASS] GET '/' returned 200 OK -> {res_root.json()}")

        res_health = client.get("/health")
        assert res_health.status_code == 200, f"Expected 200, got {res_health.status_code}"
        assert res_health.json().get("status") == "healthy"
        print(f"[PASS] GET '/health' returned 200 OK -> {res_health.json()}")

    except Exception as e:
        print(f"[FAIL] TestClient endpoint test failed: {e}")
        return False

    print("=" * 60)
    print("ALL STAGE 1 CHECKS PASSED SUCCESSFULLY!")
    print("=" * 60)
    return True

if __name__ == "__main__":
    success = run_checks()
    sys.exit(0 if success else 1)
