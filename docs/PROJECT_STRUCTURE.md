# Project Directory Structure & Codebase Guide

This document provides a comprehensive breakdown of the PlanzyPop codebase, explaining the role of every key directory, Python module, React component, database file, and utility script.

---

## 1. High-Level Directory Overview

```
PlanzyPop AI/
├── backend/                  # Python FastAPI REST API & SQLite Database
│   ├── routers/              # Modular endpoint routers
│   │   ├── __init__.py       # Package marker
│   │   ├── events.py         # Event CRUD endpoints
│   │   ├── expenses.py       # Expense CRUD, budget calculations & splits
│   │   ├── tasks.py          # Checklist tasks, timeline & summaries
│   │   └── suggestions.py    # Rule-based recommendation engine endpoint
│   ├── database.py           # Database engine & session maker
│   ├── models.py             # SQLAlchemy ORM table definitions
│   ├── schemas.py            # Pydantic validation and serialization schemas
│   ├── suggestions.py        # Rule-based heuristic decision engine logic
│   ├── main.py               # Application factory & router registration
│   ├── planzypop.db          # Embedded SQLite database storage
│   ├── requirements.txt      # Python dependencies list (FastAPI, SQLAlchemy, Pytest, etc.)
│   ├── conftest.py           # Shared Pytest fixtures and isolated test database setup
│   ├── test_health_and_api.py        # System diagnostics, root/health endpoints & SQLite schema
│   ├── test_event_management.py      # Event CRUD, validations & 404 handling
│   ├── test_budget_and_expenses.py   # Expense tracking, budget calculations & split logic
│   ├── test_checklist_and_tasks.py   # Checklist tasks, timeline sorting & progress metrics
│   ├── test_recommendations.py       # Rule-based suggestion engine heuristics & tiers
│   └── test_integration_workflow.py # Full end-to-end integration & 11-step audit workflow
│
├── frontend/                 # React 19 + TypeScript + Vite Client
│   ├── public/               # Static assets & favicon
│   ├── src/
│   │   ├── components/       # Reusable React UI components
│   │   │   ├── common/       # Global atom & molecule components
│   │   │   │   ├── Icon.tsx
│   │   │   │   ├── Button.tsx
│   │   │   │   ├── IconButton.tsx
│   │   │   │   ├── Header.tsx
│   │   │   │   ├── SectionTitle.tsx
│   │   │   │   ├── Progress.tsx
│   │   │   │   ├── BottomNav.tsx
│   │   │   │   ├── DesktopSidebar.tsx
│   │   │   │   └── NotificationDrawer.tsx
│   │   │   └── nearby/       # Venue & café discovery components
│   │   │       └── CafeSuggestions.tsx # Geolocation & Google Maps café finder
│   │   ├── pages/            # View screens
│   │   │   ├── Overview.tsx       # Primary workspace dashboard
│   │   │   ├── MyEvents.tsx       # Event list, creation, editing & deletion
│   │   │   ├── EventDetail.tsx    # Single event hub with quick stats
│   │   │   ├── Planner.tsx        # Smart event suggestion wizard & results
│   │   │   ├── Budget.tsx         # Expense logging, budget donut & splits
│   │   │   ├── Checklist.tsx      # Task list, completion toggle & timeline
│   │   │   ├── Nearby.tsx         # Google Maps café suggestions & party stores
│   │   │   ├── Inspiration.tsx    # Curated celebration themes & ideas
│   │   │   ├── IdeaDetail.tsx     # Deep-dive idea guide & shopping list
│   │   │   ├── Profile.tsx        # Host personalization & academic project info
│   │   │   └── SettingsScreen.tsx # App preferences & theme toggles
│   │   ├── services/         # API integration layer
│   │   │   └── api.ts        # Typed fetch client connecting to FastAPI backend
│   │   ├── types/            # Centralized TypeScript interfaces
│   │   │   └── index.ts      # Domain models, screen types & navigation enums
│   │   ├── utils/            # Shared helper functions and constants
│   │   │   ├── constants.tsx # Stock photos, SVG icon paths & categories
│   │   │   └── formatters.ts # INR currency formatting & date parsers
│   │   ├── App.tsx           # Master layout orchestrator & screen switcher
│   │   ├── main.tsx          # React application root entry point
│   │   └── index.css         # Global styling & Tailwind CSS imports
│   ├── package.json          # Node.js project manifest & scripts
│   ├── tsconfig.json         # TypeScript compiler configuration
│   └── vite.config.ts        # Vite build tool configuration
│
├── docs/                     # University Viva & Inspection Documentation
│   ├── PROJECT_OVERVIEW.md   # Problem statement, objectives, tech stack
│   ├── PROJECT_STRUCTURE.md  # Detailed folder & file explanations
│   ├── DATABASE_DESIGN.md    # ER diagrams, schemas, foreign keys
│   ├── API_DOCUMENTATION.md  # Complete endpoint reference & examples
│   ├── WORKING_METHODOLOGY.md# In-depth algorithmic & feature walk-through
│   └── VIVA_PREPARATION.md   # Oral exam Q&A for M.Sc. CS evaluation
│
└── README.md                 # Root project guide & startup instructions
```

---

## 2. Backend Files Explanation

All backend code follows standard Python conventions (`snake_case.py`) and is organized into distinct layers:

### `backend/main.py`
- **Role:** Application entry point and server orchestrator.
- **Responsibilities:**
  - Instantiates the `FastAPI` application with project title, description, and version.
  - Automatically initializes relational database tables using `models.Base.metadata.create_all(bind=engine)`.
  - Configures `CORSMiddleware` to allow local cross-origin HTTP calls from the Vite dev server (`http://localhost:5173`).
  - Defines the root (`/`) and health check (`/health`) endpoints.
  - Mounts domain routers from `routers/` (`events`, `expenses`, `tasks`, `suggestions`).
  - Re-exports router endpoint functions to preserve complete backward compatibility with older test suites.

### `backend/database.py`
- **Role:** Database configuration and connection management.
- **Responsibilities:**
  - Defines the SQLite database URL (`sqlite:///./planzypop.db`).
  - Creates the SQLAlchemy database engine with `check_same_thread=False` (required for SQLite concurrency in FastAPI).
  - Configures `SessionLocal` for transactional database sessions.
  - Declares the declarative base class (`Base = declarative_base()`).
  - Provides the `get_db()` dependency generator that yields an isolated DB session per HTTP request and guarantees session closure in a `finally` block.

### `backend/models.py`
- **Role:** SQLAlchemy database models representing relational tables.
- **Responsibilities:**
  - Defines the **`Event`** model (`events` table): Primary key `id`, `event_name`, `event_type`, `event_date`, `location`, `guests`, `budget`, `celebration_style`, and `created_at`.
  - Defines the **`Expense`** model (`expenses` table): Primary key `id`, foreign key `event_id` referencing `events.id` with `cascade="all, delete-orphan"`, `expense_name`, `category`, `amount`, and `expense_date`.
  - Defines the **`Task`** model (`tasks` table): Primary key `id`, foreign key `event_id` referencing `events.id` with `cascade="all, delete-orphan"`, `task_name`, `description`, `due_date`, and `is_completed`.

### `backend/schemas.py`
- **Role:** Pydantic validation and serialization models.
- **Responsibilities:**
  - Enforces data integrity before input reaches database operations (e.g. non-blank event names, positive guest counts, valid expense categories, non-negative amounts).
  - Defines request bodies: `EventCreate`, `EventUpdate`, `ExpenseCreate`, `ExpenseUpdate`, `TaskCreate`, `TaskUpdate`, `SuggestionRequest`, `ExpenseSplitRequest`.
  - Defines response bodies: `EventResponse`, `ExpenseResponse`, `TaskResponse`, `BudgetSummaryResponse`, `TaskSummaryResponse`, `ExpenseSplitResponse`, `SuggestionResponse`.

### `backend/suggestions.py`
- **Role:** Deterministic rule-based recommendation engine.
- **Responsibilities:**
  - Implements an expert decision tree taking four parameters: event type, budget, guest count, and celebration style.
  - Classifies budget into tiers: `Zero-Budget` (₹0), `Ultra-Budget` (≤ ₹1,000), `Student-Budget` (₹1,001–₹3,000), `Mid-Budget` (₹3,001–₹7,000), and `Premium` (> ₹7,000).
  - Computes exact category budget allocations (`compute_budget_allocation`) ensuring mathematical invariant: `sum(allocated_amounts) == planned_budget`.
  - Selects personalized themes, budget-friendly DIY decor suggestions, snack menus, and crowd activities.
  - Generates zero database records and requires zero external paid AI APIs.

### `backend/routers/`
- **`events.py`:** Handles `POST /events`, `GET /events`, `GET /events/{id}`, `PUT /events/{id}`, `DELETE /events/{id}`.
- **`expenses.py`:** Handles `POST /events/{id}/expenses`, `GET /events/{id}/expenses`, `PUT /expenses/{id}`, `DELETE /expenses/{id}`, `GET /events/{id}/budget`, `POST /calculate-split`, `GET /events/{id}/split-expense`.
- **`tasks.py`:** Handles `POST /events/{id}/tasks`, `GET /events/{id}/tasks`, `PUT /tasks/{id}`, `DELETE /tasks/{id}`, `GET /events/{id}/tasks/summary`.
- **`suggestions.py`:** Handles `POST /suggestions/generate`.

---

## 3. Frontend Files Explanation

The React 19 frontend is structured into modular components, pages, services, types, and utilities:

### `frontend/src/App.tsx`
- **Role:** Master application shell and state orchestrator.
- **Responsibilities:**
  - Manages active screen state (`screen`) across 11 application views.
  - Fetches and stores the list of events and currently active event.
  - Performs backend health monitoring (`live-data-badge` vs `offline-data-badge`).
  - Manages host profile data and global notifications.
  - Renders the responsive desktop sidebar layout on large screens and the bottom navigation bar on mobile/tablet viewports.

### `frontend/src/services/api.ts`
- **Role:** Centralized HTTP service communicating with the FastAPI backend.
- **Responsibilities:**
  - Reads backend URL from `VITE_API_BASE_URL` (defaults to `http://127.0.0.1:8000`).
  - Implements `apiRequest<T>()` with custom HTTP error extraction and status code handling.
  - Exports 14 typed asynchronous functions: `checkHealth`, `getEvents`, `getEvent`, `createEvent`, `updateEvent`, `deleteEvent`, `getExpenses`, `addExpense`, `updateExpense`, `deleteExpense`, `getBudgetSummary`, `calculateSplit`, `getEventSplit`, `getTasks`, `createTask`, `updateTask`, `deleteTask`, `getTaskSummary`, `generateSuggestions`.

### `frontend/src/types/index.ts`
- **Role:** Single source of truth for TypeScript interfaces.
- **Responsibilities:** Re-exports backend entity interfaces and defines UI-specific types (`Screen`, `IconName`, `NavItem`, `EventCategory`, `NearbyCategory`, `NotificationItem`, `CafeSearchCategory`).

### `frontend/src/utils/`
- **`constants.tsx`:** Contains stock image URLs, the complete SVG path dictionary for 36 icons (including the newly added `coffee` icon), and static resource definitions (`NEARBY_CATEGORIES`, `categories`, `plannerCategories`).
- **`formatters.ts`:** `formatINR(amount)` for Indian Rupee notation (e.g. `₹5,000`), `getEventImage()` for event type thumbnail matching, and `parseDateParts()` for calendar badge breakdown.

### `frontend/src/components/common/`
- **`Icon.tsx`:** Unified SVG icon component supporting stroke, fill, and custom sizes.
- **`Button.tsx`:** Reusable button supporting `primary`, `secondary`, `ghost`, and `dark` variants, loading states, and embedded icons.
- **`IconButton.tsx`:** Circular icon action button with hover and active states.
- **`Header.tsx`:** Standardized page header with eyebrow breadcrumbs and back navigation.
- **`SectionTitle.tsx`:** Section heading with optional right-aligned action links.
- **`Progress.tsx`:** Dual-color progress bar for budget utilization and task completion.
- **`BottomNav.tsx`:** Touch-friendly mobile navigation bar with active state highlights.
- **`DesktopSidebar.tsx`:** Fixed left desktop workspace sidebar with host profile preview.
- **`NotificationDrawer.tsx`:** Slide-over modal displaying celebration reminders and alerts.

### `frontend/src/components/nearby/CafeSuggestions.tsx`
- **Role:** Dedicated Google Maps nearby café suggestions component.
- **Responsibilities:**
  - Requests user location permission using `navigator.geolocation.getCurrentPosition()`.
  - Captures verified latitude and longitude coordinates.
  - Implements fallback manual city/locality entry when permission is denied or device GPS is unavailable.
  - Generates targeted Google Maps universal search URLs with zero paid API keys.
  - Displays 6 curated celebration venue categories: Cafés near me, Budget-friendly cafés, Birthday celebration cafés, Group-friendly cafés, Bakeries & cake shops, and Restaurants for small celebrations.
  - Transparently informs users that actual ratings and listings are fetched authentically from Google Maps.

### `frontend/src/pages/`
- **`Overview.tsx`:** Workspace metrics (events, total budget, tasks), upcoming event feature card, quick category links, and inspirational ideas.
- **`MyEvents.tsx`:** List of all planned celebrations with status filtering, inline edit sheet, and event creation modal.
- **`EventDetail.tsx`:** Hub for a selected celebration showing attendee count, progress bar, quick tool links, next upcoming task, and mini timeline.
- **`Planner.tsx`:** 3-step celebration planning wizard invoking the rule-based engine and adding starter checklist tasks directly into the database.
- **`Budget.tsx`:** Visual budget tracker with spent donut, remaining funds, overspending warnings, category breakdown, itemized expense logging, and equal splitting calculation.
- **`Checklist.tsx`:** Interactive task manager with completion checkboxes, due dates, priority tags, and a chronological timeline view.
- **`Nearby.tsx`:** Integrated local venue explorer with top tabs toggling between Google Maps Café Suggestions and Celebration Supplies.
- **`Inspiration.tsx`:** Visual gallery of low-cost celebration ideas, party themes, and snack arrangements.
- **`IdeaDetail.tsx`:** Detailed breakdown of a specific theme with shopping lists, required time, and student saver tips.
- **`Profile.tsx`:** Host personalization screen with name editing, group affiliation, default celebration style preferences, and project specifications.
- **`SettingsScreen.tsx`:** Application settings, theme preferences, currency indicators, and support notes.

---

## 4. Key System Questions Answered

### Where is the database stored?
The database is stored locally as an embedded SQLite file at:  
`D:\PlanzyPop AI\backend\planzypop.db`  
No separate database server (such as MySQL or PostgreSQL) needs to be installed or maintained.

### Where are API requests handled?
API requests are received by the Uvicorn ASGI server and handled by FastAPI route controllers inside:  
`D:\PlanzyPop AI\backend\routers/` (`events.py`, `expenses.py`, `tasks.py`, `suggestions.py`) and `backend/main.py`.

### How do frontend and backend communicate?
Communication occurs over standard HTTP REST requests. The React frontend initiates asynchronous `fetch()` requests from `frontend/src/services/api.ts` to `http://127.0.0.1:8000`. The FastAPI backend parses the JSON payload, queries the SQLite database via SQLAlchemy, and returns structured JSON responses.
