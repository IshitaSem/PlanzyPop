# PlanzyPop – Event Planning and Budget Management System

**Academic Degree:** Master of Science in Computer Science (Data Science)  
**Academic Work:** Semester Mini-Project  
**Domain:** Full-Stack Web Development, Relational Database Systems & Decision Heuristics  
**Currency Standard:** Indian Rupee (INR / ₹)  

---

## 1. Project Overview

**PlanzyPop** is an event planning and budget management system engineered specifically for college students, roommates, and young hosts organizing budget-conscious celebrations. It bridges the gap between chaotic, uncoordinated party preparations and expensive commercial event management tools.

The platform provides a centralized, interactive workspace where hosts can:
- Plan celebrations (Birthdays, College Fresher Parties, Farewells, Potlucks, Movie Nights).
- Track itemized expenditures with automated category-wise summaries and overspending warnings.
- Split bills equally among contributing friends based on actual receipts or planned budgets.
- Manage preparation checklists with due dates, overdue detection, and chronological timelines.
- Synthesize balanced celebration themes, DIY decor plans, and budget allocations via a deterministic rule-based engine.
- Discover authentic local cafés, bakeries, and hangout venues geofenced to Chandigarh Union Territory using Geoapify and OpenStreetMap with interactive map visualization.
- Maintain independent personal celebration data with secure user authentication, while offering a rich Guest Demo Mode.

---

## 2. Key Features

| Feature | Description |
| :--- | :--- |
| **Workspace Dashboard** | High-level metrics tracking total events, aggregate budget, completed tasks, and upcoming milestones. |
| **Event Lifecycle (CRUD)** | Full Create, Read, Update, and Delete operations for events with guest counts and target budgets. |
| **Budget & Expense Tracking** | Itemized purchase logging across 8 standard categories with real-time percentage utilization and overspending alerts. |
| **Equal Expense Splitting** | Automated split calculator dividing actual recorded costs or fallback planned budgets among friends. |
| **Checklist & Timeline** | Prioritized preparation checklist with toggleable completion states, due dates, overdue detection, and a chronological timeline. |
| **Rule-Based Suggestions** | Expert decision engine synthesizing themes, DIY decor, menus, and balanced budget allocations (0 database writes, no paid AI API). |
| **PopSpots Venue Discovery** | Real local café, bakery, and party venue explorer geofenced to Chandigarh UT with interactive Leaflet map, distance sorting, and bookmarks. |
| **User Authentication & Guest Mode** | User registration and login with bcrypt password hashing and token authentication, with full data isolation and a rich guest demo mode. |
| **Host Preferences** | Host profile personalization, group naming, default celebration styles, and notification panel. |

---

## 3. Technology Stack

### Backend
- **Framework:** FastAPI 0.162.0 (Python 3.10+)
- **ASGI Server:** Uvicorn 0.54.0
- **Database Engine:** SQLite 3 (Stored at `backend/planzypop.db`)
- **ORM:** SQLAlchemy 2.0 with foreign key cascade deletion
- **Authentication:** Token-based session authentication with bcrypt password hashing
- **Data Validation:** Pydantic 2.x
- **Geodata & Venues:** Geoapify Places API + OpenStreetMap Overpass API, geofenced with Shapely polygon ray-casting
- **Testing:** Pytest (10 test suites, 74 tests) & `TestClient` (Starlette/HTTPX)

### Frontend
- **Framework:** React 19 (SPA Architecture)
- **Language:** TypeScript 5.7 (Strict Mode)
- **Build Tool:** Vite 8
- **Styling:** Tailwind CSS v4 + Custom Neo-Brutalist CSS Design System
- **Mapping:** Leaflet & React-Leaflet with OpenStreetMap tiles
- **Session State:** Authentication Context with guest demo fallback
- **Geolocation:** Browser Geolocation API (`navigator.geolocation`)

---

## 4. Project Directory Structure

```
PlanzyPop AI/
├── backend/                  # FastAPI Backend & SQLite Database
│   ├── routers/              # Modular API route controllers
│   │   ├── __init__.py       # Package marker
│   │   ├── auth.py           # User authentication & token session endpoints
│   │   ├── events.py         # Event CRUD endpoints with user isolation
│   │   ├── expenses.py       # Expense CRUD, budget summary & splits
│   │   ├── spots.py          # PopSpots Chandigarh venue explorer endpoints
│   │   ├── tasks.py          # Checklist tasks, timeline & summaries
│   │   └── suggestions.py    # Rule-based recommendation engine endpoint
│   ├── auth_utils.py         # Password hashing & session token utilities
│   ├── chandigarh_boundary.py# Ray-casting geofencing polygon for Chandigarh UT
│   ├── database.py           # Database connection & session factory
│   ├── geoapify_client.py    # Geoapify Places API client
│   ├── models.py             # SQLAlchemy ORM table definitions
│   ├── schemas.py            # Pydantic validation & response models
│   ├── spots_service.py      # Venue aggregation, filtering & fallback logic
│   ├── suggestions.py        # Rule-based decision heuristics logic
│   ├── main.py               # Application factory & router registration
│   ├── planzypop.db          # Embedded SQLite database
│   ├── requirements.txt      # Python dependencies
│   ├── conftest.py           # Pytest fixtures and isolated testing setup
│   └── test_*.py             # Automated test suites (10 pytest modules)
│
├── frontend/                 # React 19 + TypeScript + Vite Client
│   ├── public/               # Static assets & favicon
│   ├── src/
│   │   ├── components/       # Reusable React UI components
│   │   │   ├── common/       # Global atom components (Button, Icon, Header, etc.)
│   │   │   ├── nearby/       # CafeSuggestions.tsx (Google Maps finder)
│   │   │   └── spots/        # PopSpots venue cards, filters & Leaflet map
│   │   ├── context/          # AuthContext.tsx (User authentication & guest session)
│   │   ├── pages/            # View screens (Overview, MyEvents, Budget, PopSpots, etc.)
│   │   ├── services/         # api.ts (Typed fetch client to backend)
│   │   ├── types/            # Central TypeScript interfaces (index.ts)
│   │   ├── utils/            # formatters.ts & constants.tsx
│   │   ├── App.tsx           # Master layout orchestrator & screen router
│   │   ├── main.tsx          # React application entry point
│   │   └── index.css         # Global styling & Tailwind CSS
│   ├── package.json          # Node.js dependencies & scripts
│   ├── tsconfig.json         # TypeScript compiler configuration
│   └── vite.config.ts        # Vite configuration
│
├── docs/                     # University Viva & Inspection Documentation
│   ├── PROJECT_OVERVIEW.md   # Problem statement, objectives, architecture
│   ├── PROJECT_STRUCTURE.md  # Detailed file & component breakdown
│   ├── DATABASE_DESIGN.md    # ER diagrams, schemas, cascade rules
│   ├── API_DOCUMENTATION.md  # Complete endpoint reference & examples
│   ├── TESTING_GUIDE.md      # Testing architecture & verification guide
│   ├── WORKING_METHODOLOGY.md# In-depth algorithmic & feature walk-through
│   └── VIVA_PREPARATION.md   # Oral examination Q&A for M.Sc. CS
│
└── README.md                 # Root project guide & startup instructions
```

---

## 5. Prerequisites

Before running the project on Windows, verify that the following tools are installed:

1. **Python 3.10+** (Python 3.14 used in development)
2. **Node.js 18+** or **Node.js 20+**
3. **PowerShell** (Default terminal in Windows 10/11)

---

## 6. Installation & Setup Instructions

Open a Windows PowerShell terminal and navigate to the project directory:

```powershell
Set-Location "D:\PlanzyPop AI"
```

### Backend Virtual Environment Setup

If setting up the backend environment for the first time:

```powershell
Set-Location "D:\PlanzyPop AI\backend"
& "D:\PlanzyPop AI\backend\.venv\Scripts\python.exe" -m pip install -r requirements.txt
```

### Frontend Dependencies Installation

```powershell
Set-Location "D:\PlanzyPop AI\frontend"
npm install
```

---

## 7. Starting the Application

To run the complete application, you will need two separate PowerShell windows (one for the backend, one for the frontend).

### Terminal 1: Start Backend Server (FastAPI)

```powershell
Set-Location "D:\PlanzyPop AI\backend"
& "D:\PlanzyPop AI\backend\.venv\Scripts\python.exe" -m uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

The backend will start and display:
```
INFO:     Uvicorn running on http://127.0.0.1:8000 (Press CTRL+C to quit)
INFO:     Started reloader process using WatchFiles
INFO:     Application startup complete.
```

### Terminal 2: Start Frontend Development Server (React + Vite)

```powershell
Set-Location "D:\PlanzyPop AI\frontend"
npm run dev
```

The frontend will start and display:
```
  VITE v8.3.5  ready in 150 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

---

## 8. Application Access URLs

| Interface | Local URL | Description |
| :--- | :--- | :--- |
| **Web Application** | `http://localhost:5173` | React 19 user workspace interface |
| **API Root** | `http://127.0.0.1:8000/` | Backend health & welcome payload |
| **API Health Check** | `http://127.0.0.1:8000/health` | Service health status |
| **Swagger UI Documentation** | `http://127.0.0.1:8000/docs` | Interactive OpenAPI testing console |
| **ReDoc Documentation** | `http://127.0.0.1:8000/redoc` | Clean, formal API reference guide |

---

## 9. Running Verification & Regression Tests

### Running Backend Pytest Suites (10 Modules, 74 Tests)

Run all backend automated tests with pytest:

```powershell
pytest backend/ -v
```

All 74 tests execute against an isolated test SQLite database configured in `backend/conftest.py`, ensuring zero modification or pollution of the live database file (`planzypop.db`).

### Running Frontend Type-Checking & Production Build

```powershell
Set-Location "D:\PlanzyPop AI\frontend"
npx tsc --noEmit
npm run build
```

---

## 10. Database Information

- **Database Engine:** SQLite 3
- **File Location:** `D:\PlanzyPop AI\backend\planzypop.db`
- **Tables:**
  - `users`: Stores registered user accounts with bcrypt-hashed passwords.
  - `user_tokens`: Stores active authentication session tokens with user foreign keys.
  - `events`: Stores celebration titles, dates, locations, guests, planned budgets, and host user ID.
  - `expenses`: Stores itemized receipts linked to events with foreign key cascade deletion.
  - `tasks`: Stores preparation checklist items, due dates, priorities, and completion flags.
  - `saved_spots`: Stores bookmarked venues and favourite cafés for registered users and guest sessions.
- **ORM:** SQLAlchemy models define relationships with `cascade="all, delete-orphan"` to guarantee that deleting an event cleans up all associated records without leaving orphan rows.

---

## 11. Screenshots & Demonstration Placeholders

> *Note: Place screenshots of your running application here for your viva presentation report.*

- **Dashboard & Workspace Overview:**  
  `[Screenshot Placeholder: Overview Screen showing Planned Events, Budget Summary & Active Celebration Card]`
- **Event Detail & Quick Action Tools:**  
  `[Screenshot Placeholder: Event Detail View with attendee avatar stack and planning progress bar]`
- **Budget Tracker & Overspending Warning:**  
  `[Screenshot Placeholder: Budget Screen showing spent donut, category breakdown & overspending alert banner]`
- **Checklist & Chronological Timeline:**  
  `[Screenshot Placeholder: Checklist View with completed checkboxes and timeline milestones]`
- **Rule-Based Suggestions Generator:**  
  `[Screenshot Placeholder: Planner Wizard displaying theme synthesis and balanced budget allocations]`
- **PopSpots Venue Discovery & Interactive Map:**  
  `[Screenshot Placeholder: PopSpots Screen with Chandigarh geofenced search, sector filters & Leaflet map]`

---

## 12. Project Limitations

1. **Local SQLite File Storage:** Uses an embedded SQLite database on the local file system; horizontal multi-server database replication is not implemented.
2. **Chandigarh UT Geofencing:** PopSpots venue discovery is specifically geofenced to the Chandigarh Union Territory boundary polygon for curated local accuracy.
3. **No Direct SMS/Push Gateway:** Notifications are tracked inside the application drawer rather than sent via external SMS/WhatsApp webhooks.

---

## 13. Future Scope

1. **UPI Payment Settlement:** Integrating UPI QR code generation or Razorpay webhooks to allow friends to settle their split shares instantly.
2. **Automated WhatsApp Invitations:** Sending RSVP invitation links and task delegation alerts to attendees via WhatsApp Business API.
3. **Cloud Database Migration:** Transitioning from SQLite to PostgreSQL for multi-region hosting and concurrent scaling.
4. **Multi-City Geofencing:** Expanding boundary definitions and local venue data to support additional student hubs and university towns across India.
