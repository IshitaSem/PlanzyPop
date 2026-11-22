# Project Directory Structure & Codebase Guide

This document provides a comprehensive breakdown of the PlanzyPop codebase, explaining the role of every key directory, Python module, React component, database file, and utility script.

---

## 1. High-Level Directory Overview

```
PlanzyPop AI/
├── backend/                  # Python FastAPI REST API & SQLite Database
│   ├── routers/              # Modular endpoint routers
│   │   ├── __init__.py       # Package marker
│   │   ├── auth.py           # User authentication & token session endpoints
│   │   ├── events.py         # Event CRUD endpoints with user isolation
│   │   ├── expenses.py       # Expense CRUD, budget calculations & splits
│   │   ├── spots.py          # PopSpots Chandigarh venue explorer endpoints
│   │   ├── tasks.py          # Checklist tasks, timeline & summaries
│   │   └── suggestions.py    # Rule-based recommendation engine endpoint
│   ├── auth_utils.py         # Password hashing & session token utilities
│   ├── chandigarh_boundary.py# Ray-casting geofencing polygon for Chandigarh UT
│   ├── database.py           # Database engine & session maker
│   ├── geoapify_client.py    # Geoapify Places API client
│   ├── models.py             # SQLAlchemy ORM table definitions
│   ├── schemas.py            # Pydantic validation and serialization schemas
│   ├── spots_service.py      # Venue aggregation, filtering & fallback logic
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
│   ├── test_integration_workflow.py # Full end-to-end integration & 11-step audit workflow
│   ├── test_chandigarh_boundary.py   # Point-in-polygon verification for Chandigarh UT
│   ├── test_geoapify_and_osm.py      # Geoapify & OSM mock integration verification
│   ├── test_spots_api.py             # PopSpots venue discovery and favorites API
│   └── test_user_isolation.py        # User data isolation and guest mode separation
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
│   │   │   ├── nearby/       # Venue & café discovery components
│   │   │   │   └── CafeSuggestions.tsx # Geolocation & Google Maps café finder
│   │   │   └── spots/        # PopSpots venue discovery components
│   │   │       ├── SpotCard.tsx        # Venue card with badges, vibes and bookmark
│   │   │       ├── SpotsMap.tsx        # Leaflet interactive map with markers
│   │   │       ├── FilterDrawer.tsx    # Category & sector filter sheet
│   │   │       └── SpotDetailModal.tsx # Full venue details modal
│   │   ├── context/          # State management contexts
│   │   │   └── AuthContext.tsx # User session, token storage & guest mode state
│   │   ├── pages/            # View screens
│   │   │   ├── Overview.tsx       # Primary workspace dashboard
│   │   │   ├── MyEvents.tsx       # Event list, creation, editing & deletion
│   │   │   ├── EventDetail.tsx    # Single event hub with quick stats
│   │   │   ├── Planner.tsx        # Smart event suggestion wizard & results
│   │   │   ├── Budget.tsx         # Expense logging, budget donut & splits
│   │   │   ├── Checklist.tsx      # Task list, completion toggle & timeline
│   │   │   ├── Nearby.tsx         # Google Maps café suggestions & party stores
│   │   │   ├── PopSpots.tsx       # Local Chandigarh hangout venue discovery
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
│   ├── TESTING_GUIDE.md      # Testing architecture & verification guide
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
  - Mounts domain routers from `routers/` (`events`, `expenses`, `tasks`, `suggestions`, `auth`, `spots`).
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
  - Defines **`User`** (`users` table): User accounts with unique `email`, `name`, and bcrypt `hashed_password`.
  - Defines **`UserToken`** (`user_tokens` table): Active session tokens referencing `users.id` with cascade deletion.
  - Defines **`Event`** (`events` table): Primary key `id`, `user_id` owner identifier, `event_name`, `event_type`, `event_date`, `location`, `guests`, `budget`, `celebration_style`, and `created_at`.
  - Defines **`Expense`** (`expenses` table): Primary key `id`, foreign key `event_id` referencing `events.id` with `cascade="all, delete-orphan"`, `expense_name`, `category`, `amount`, and `expense_date`.
  - Defines **`Task`** (`tasks` table): Primary key `id`, foreign key `event_id` referencing `events.id` with `cascade="all, delete-orphan"`, `task_name`, `description`, `due_date`, and `is_completed`.
  - Defines **`SavedSpot`** (`saved_spots` table): Bookmarked venues from PopSpots with `user_id`, `spot_id`, `name`, `category`, coordinates, and vibe metadata.

### `backend/schemas.py`
- **Role:** Pydantic validation and serialization models.
- **Responsibilities:**
  - Enforces data integrity before input reaches database operations (e.g. non-blank event names, positive guest counts, valid expense categories, non-negative amounts).
  - Defines authentication models: `UserRegister`, `UserLogin`, `TokenResponse`, `UserResponse`.
  - Defines event & expense models: `EventCreate`, `EventUpdate`, `EventResponse`, `ExpenseCreate`, `ExpenseUpdate`, `ExpenseResponse`, `BudgetSummaryResponse`, `ExpenseSplitResponse`.
  - Defines task & suggestion models: `TaskCreate`, `TaskUpdate`, `TaskResponse`, `TaskSummaryResponse`, `SuggestionRequest`, `SuggestionResponse`.
  - Defines PopSpots models: `SpotCategoryItem`, `SpotBase`, `SpotSearchResponse`, `FavoriteCreate`, `FavoriteResponse`.

### `backend/auth_utils.py`
- **Role:** Cryptographic security and authentication utilities.
- **Responsibilities:**
  - Password hashing and verification using `bcrypt` / `passlib`.
  - Cryptographically secure session token generation.
  - FastAPI dependency providers `get_current_user` and `get_current_user_optional` for endpoint route protection and guest fallback.

### `backend/chandigarh_boundary.py`
- **Role:** Geographic boundary definition and geofence verification.
- **Responsibilities:**
  - Implements ray-casting point-in-polygon algorithm (`is_point_in_chandigarh`).
  - Contains polygon boundary coordinates covering Chandigarh Union Territory (UT).
  - Enforces strict rejection of venues outside Chandigarh boundaries (e.g., Mohali, Panchkula, Zirakpur).

### `backend/geoapify_client.py`
- **Role:** External geodata integration client.
- **Responsibilities:**
  - Communicates with the Geoapify Places API v2 to fetch local cafés, bakeries, and venues.
  - Normalizes external venue payloads into standard PlanzyPop schema formats.

### `backend/spots_service.py`
- **Role:** Venue curation, aggregation, and fallback engine.
- **Responsibilities:**
  - Merges and deduplicates places from Geoapify, OpenStreetMap, and curated Chandigarh POIs.
  - Filters by category, sector, budget, and vibe tags.
  - Calculates Haversine distances from user or sector coordinates.

### `backend/suggestions.py`
- **Role:** Deterministic rule-based recommendation engine.
- **Responsibilities:**
  - Implements an expert decision tree taking four parameters: event type, budget, guest count, and celebration style.
  - Classifies budget into tiers: `Zero-Budget` (₹0), `Ultra-Budget` (≤ ₹1,000), `Student-Budget` (₹1,001–₹3,000), `Mid-Budget` (₹3,001–₹7,000), and `Premium` (> ₹7,000).
  - Computes exact category budget allocations (`compute_budget_allocation`) ensuring mathematical invariant: `sum(allocated_amounts) == planned_budget`.
  - Selects personalized themes, budget-friendly DIY decor suggestions, snack menus, and crowd activities.
  - Generates zero database records and requires zero external paid AI APIs.

### `backend/routers/`
- **`auth.py`:** Handles `POST /auth/register`, `POST /auth/login`, `GET /auth/me`, `POST /auth/logout`.
- **`events.py`:** Handles `POST /events`, `GET /events`, `GET /events/{id}`, `PUT /events/{id}`, `DELETE /events/{id}` with authenticated user data isolation.
- **`expenses.py`:** Handles `POST /events/{id}/expenses`, `GET /events/{id}/expenses`, `PUT /expenses/{id}`, `DELETE /expenses/{id}`, `GET /events/{id}/budget`, `POST /calculate-split`, `GET /events/{id}/split-expense`.
- **`spots.py`:** Handles `GET /api/spots/categories`, `GET /api/spots/sectors`, `GET /api/spots/search`, `GET /api/spots/favorites`, `POST /api/spots/favorites`, `DELETE /api/spots/favorites/{id}`, `GET /api/spots/{id}`.
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

### `frontend/src/context/AuthContext.tsx`
- **Role:** Authentication state provider and user session coordinator.
- **Responsibilities:**
  - Manages active user authentication state, JWT/bearer token persistence in `localStorage`, and guest demo toggle.
  - Exposes `login`, `register`, `logout`, and `continueAsGuest` helper functions.
  - Ensures clean state separation between registered users and guest demo mode.

### `frontend/src/services/api.ts`
- **Role:** Centralized HTTP service communicating with the FastAPI backend.
- **Responsibilities:**
  - Reads backend URL from `VITE_API_BASE_URL` (defaults to `http://127.0.0.1:8000`).
  - Automatically attaches `Authorization: Bearer <token>` headers when an authenticated session is active.
  - Implements `apiRequest<T>()` with custom HTTP error extraction and status code handling.
  - Exports authentication functions: `registerUser`, `loginUser`, `getCurrentUser`, `logoutUser`.
  - Exports event & budget functions: `checkHealth`, `getEvents`, `getEvent`, `createEvent`, `updateEvent`, `deleteEvent`, `getExpenses`, `addExpense`, `updateExpense`, `deleteExpense`, `getBudgetSummary`, `calculateSplit`, `getEventSplit`, `getTasks`, `createTask`, `updateTask`, `deleteTask`, `getTaskSummary`, `generateSuggestions`.
  - Exports PopSpots functions: `getSpotCategories`, `getChandigarhSectors`, `searchSpots`, `getFavorites`, `saveFavorite`, `removeFavorite`, `getSpotDetails`.

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

### `frontend/src/components/spots/`
- **Role:** PopSpots interactive venue discovery and mapping components.
- **Responsibilities:**
  - **`SpotCard.tsx`:** Venue card showing photos, vibe badges, distance calculation, operational status, and interactive bookmark toggle.
  - **`SpotsMap.tsx`:** Leaflet/OpenStreetMap interactive map centering on Chandigarh with interactive pins and popups.
  - **`FilterDrawer.tsx`:** Sliding filter sheet to filter by category, Chandigarh sector, budget, and vibe tags.
  - **`SpotDetailModal.tsx`:** Full-screen modal showing venue address, tags, and map directions.

### `frontend/src/pages/`
- **`Overview.tsx`:** Workspace metrics (events, total budget, tasks), upcoming event feature card, quick category links, and inspirational ideas.
- **`MyEvents.tsx`:** List of all planned celebrations with status filtering, inline edit sheet, and event creation modal.
- **`EventDetail.tsx`:** Hub for a selected celebration showing attendee count, progress bar, quick tool links, next upcoming task, and mini timeline.
- **`Planner.tsx`:** 3-step celebration planning wizard invoking the rule-based engine and adding starter checklist tasks directly into the database.
- **`Budget.tsx`:** Visual budget tracker with spent donut, remaining funds, overspending warnings, category breakdown, itemized expense logging, and equal splitting calculation.
- **`Checklist.tsx`:** Interactive task manager with completion checkboxes, due dates, priority tags, and a chronological timeline view.
- **`Nearby.tsx`:** Integrated local venue explorer with top tabs toggling between Google Maps Café Suggestions and Celebration Supplies.
- **`PopSpots.tsx`:** Geofenced Chandigarh café and bakery explorer with Leaflet map, live search, and favorites.
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
