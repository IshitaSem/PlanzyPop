# PlanzyPop - Backend Testing & Quality Assurance Guide
**Academic Mini-Project for M.Sc. Computer Science (Data Science)**

---

## 1. Why Testing is Required in Software Engineering

In professional software development and academic software engineering, testing is the systematic process of validating that a software system satisfies its specified functional and non-functional requirements.

Testing ensures:
1. **Correctness & Reliability:** Confirms that business logic (such as budget utilisation percentages, timeline chronological sorting, and expense splitting) performs mathematical calculations without rounding discrepancies or `ZeroDivisionError` crashes.
2. **Regression Prevention:** When code is refactored, extended, or modularized, automated regression tests immediately detect whether existing features were inadvertently broken.
3. **API Contract Verification:** Ensures that all HTTP status codes (`200 OK`, `201 Created`, `404 Not Found`, `422 Unprocessable Entity`) and JSON schema payloads match the expectations of frontend clients.
4. **Data Isolation & Safety:** Verifies that testing operations run in a sandbox without polluting, modifying, or deleting real student data or production database files (`planzypop.db`).
5. **Teacher / Examiner Confidence:** Demonstrates that the M.Sc. project was developed with professional quality assurance practices, test automation, and verifiable test coverage.

---

## 2. Test Classification: Unit, API, and Integration Testing

PlanzyPop employs a standard multi-tiered software testing pyramid:

```
          / \
         /   \       Integration Testing
        /     \      (Simulates complete user journeys & API audits)
       /-------\
      /         \    API / Functional Testing
     /           \   (HTTP endpoints, input validations, status codes)
    /-------------\
   /               \  Unit Testing
  /                 \ (Pure algorithms, schema rules, math formulas)
 /-------------------\
```

### 1. Unit Testing
- **Definition:** Tests individual functions, methods, or components in complete isolation without running a web server or database transactions.
- **In PlanzyPop:** Testing recommendation engine heuristics (`compute_budget_allocation`, `CATEGORY_ALLOCATION_RULES`), checking that budget allocation ratios sum to exactly 100%, and verifying that rounding compensation ensures `sum(allocations) == budget`.
- **Found in:** `test_recommendations.py`.

### 2. API / Component Testing
- **Definition:** Tests individual REST API routes by sending simulated HTTP requests (`GET`, `POST`, `PUT`, `DELETE`) via an in-memory ASGI client (`TestClient`) and asserting HTTP response codes, JSON bodies, and error formats.
- **In PlanzyPop:** Testing `POST /events` with negative budget values returning HTTP `422`, testing `PUT /expenses/{id}` with null parameters, and testing timeline sorting on `GET /events/{id}/tasks`.
- **Found in:** `test_event_management.py`, `test_budget_and_expenses.py`, `test_checklist_and_tasks.py`.

### 3. Integration Testing
- **Definition:** Tests the end-to-end interaction between multiple subsystems working together: database tables, modular routers, cascade deletion constraints, and frontend service contracts.
- **In PlanzyPop:** Simulating a user generating AI suggestions, creating an event, adding tasks, logging expenses, calculating bill splits, and deleting the event while verifying that all related expenses and tasks are cascade-deleted.
- **Found in:** `test_integration_workflow.py`.

---

## 3. Directory & File Overview

All backend tests reside in the `backend/` directory and use descriptive, domain-aligned filenames:

| Test File | Scope & Type | Description |
| :--- | :--- | :--- |
| `conftest.py` | Fixtures & Config | Sets up an isolated test SQLite database (`test_planzypop_isolated.db`) and overrides FastAPI's `get_db` dependency to protect `planzypop.db`. |
| `test_health_and_api.py` | System Diagnostics | Verifies Python dependencies, application metadata, root (`/`) & `/health` endpoints, SQLite table presence, and SQLAlchemy ORM session lifecycle. |
| `test_event_management.py` | API / CRUD | Verifies Event creation, retrieval, updates, deletions, 404 responses for non-existent IDs, and 422 validation rejections. |
| `test_budget_and_expenses.py` | Financial & Logic | Verifies expense logging, category normalization (`cake` -> `Cake`), budget summary calculations, overspending warnings, safe zero-budget handling, and expense-sharing calculators. |
| `test_checklist_and_tasks.py` | Timeline & Tasks | Verifies task creation, chronological ordering (due dates ascending, nulls at end), completion toggling, overdue calculation math, and dynamic progress metrics. |
| `test_recommendations.py` | Algorithmic Heuristics | Verifies rule-based suggestion engine heuristics for all event types, 5 celebration styles, 5 budget tiers, guest scaling, 100% allocation sum math, and stateless execution. |
| `test_integration_workflow.py` | End-to-End Audit | Verifies frontend `.env` and `api.ts` contracts, full multi-step user journey, and all 11 core functional workflows from the integration audit. |

---

## 4. How Test Isolation Protects Student Data

A common mistake in beginner student projects is running automated tests directly against the primary application database (`planzypop.db`). This can cause tests to delete or overwrite project data created during teacher demonstrations.

PlanzyPop resolves this using **Dependency Injection Overriding** in `backend/conftest.py`:

```python
# conftest.py
@pytest.fixture(scope="session", autouse=True)
def setup_test_environment():
    # 1. Create a dedicated isolated test database
    Base.metadata.create_all(bind=test_engine)

    # 2. Instruct FastAPI to route all database requests to the test DB
    def override_get_db():
        db = TestingSessionLocal()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = override_get_db
    yield
    # 3. Clean up and remove test DB after testing
```

**Result:** Your actual student database `planzypop.db` is **never modified, written to, or cleared** during test execution.

---

## 5. How to Run the Tests

### Option A: Run All Backend Tests (Recommended)
Open a terminal in the project directory and run:

```powershell
cd backend
.\.venv\Scripts\pytest -v
```

Or using python module syntax:
```powershell
cd backend
.\.venv\Scripts\python.exe -m pytest -v
```

**Expected Result:**
```
collected 37 items

test_budget_and_expenses.py::test_category_validation_and_normalization PASSED
test_budget_and_expenses.py::test_expense_update_validation_and_partial_update PASSED
...
test_recommendations.py::test_stateless_database_independence PASSED
======================= 37 passed in ~1.8s =======================
```

---

### Option B: Run a Single Test File
You can run any individual test module using `pytest` or directly using `python`:

#### Using Pytest:
```powershell
cd backend
.\.venv\Scripts\pytest test_event_management.py -v
```

#### Using Python Directly:
```powershell
cd backend
.\.venv\Scripts\python.exe test_event_management.py
```

---

### Option C: Run a Specific Test Function
To test only a single function (e.g. overspending detection):

```powershell
cd backend
.\.venv\Scripts\pytest test_budget_and_expenses.py::test_overspending_detection_and_warning -v
```

---

## 6. What a Passing Test Means

When a test displays `PASSED` (green):
1. **Assertion Success:** Every `assert` condition in that function evaluated to `True`.
2. **Correct Status Code:** Endpoints returned the expected HTTP status (`200 OK`, `201 Created`, `404 Not Found`, `422 Unprocessable Entity`).
3. **Schema Compliance:** The JSON response payload matches the required Pydantic model fields and data types.
4. **Boundary Safety:** Division by zero, negative amounts, blank inputs, and non-existent IDs were gracefully handled without uncaught exceptions or server crashes.
5. **Clean Teardown:** All created test records were safely committed or cleaned up without side effects.

---

## 7. Frontend Verification Commands

In addition to backend Python tests, the frontend React + TypeScript application can be verified at any time using:

```powershell
cd frontend

# 1. Verify TypeScript types across all components and services
npx tsc --noEmit

# 2. Verify complete production build
npm run build
```

Both commands should complete with zero errors.
