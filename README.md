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
- Discover authentic local cafés, bakeries, and party venues using browser geolocation and Google Maps searches without paid API keys.

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
| **Google Maps Café Finder** | Browser geolocation-powered discovery for cafés near me, budget cafés, birthday spots, bakeries, and small party venues. |
| **Host Preferences** | Host profile personalization, group naming, default celebration styles, and notification panel. |

---

## 3. Technology Stack

### Backend
- **Framework:** FastAPI 0.162.0 (Python 3.14)
- **ASGI Server:** Uvicorn 0.54.0
- **Database Engine:** SQLite 3 (Stored at `backend/planzypop.db`)
- **ORM:** SQLAlchemy 2.0 with foreign key cascade deletion
- **Data Validation:** Pydantic 2.x
- **Testing:** Python `unittest` & `TestClient` (Starlette/HTTPX)

### Frontend
- **Framework:** React 19 (SPA Architecture)
- **Language:** TypeScript 5.7 (Strict Mode)
- **Build Tool:** Vite 8
- **Styling:** Tailwind CSS v4 + Custom Neo-Brutalist CSS Design System
- **Geolocation:** Browser Geolocation API (`navigator.geolocation`)
- **Maps Integration:** Google Maps Universal Search URLs

---

## 4. Project Directory Structure

```
PlanzyPop AI/
├── backend/                  # FastAPI Backend & SQLite Database
│   ├── routers/              # Modular API route controllers
│   │   ├── __init__.py       # Package marker
│   │   ├── events.py         # Event CRUD endpoints
│   │   ├── expenses.py       # Expense CRUD, budget summary & splits
│   │   ├── tasks.py          # Checklist tasks, timeline & summaries
│   │   └── suggestions.py    # Rule-based recommendation engine endpoint
│   ├── database.py           # Database connection & session factory
│   ├── models.py             # SQLAlchemy ORM table definitions
│   ├── schemas.py            # Pydantic validation & response models
│   ├── suggestions.py        # Rule-based decision heuristics logic
│   ├── main.py               # Application factory & router registration
│   ├── planzypop.db          # Embedded SQLite database
│   ├── requirements.txt      # Python dependencies
│   └── test_stage*.py        # Automated test suites (Stage 1 to 8)
│
├── frontend/                 # React 19 + TypeScript + Vite Client
│   ├── public/               # Static assets & favicon
│   ├── src/
│   │   ├── components/       # Reusable React UI components
│   │   │   ├── common/       # Global atom components (Button, Icon, Header, etc.)
│   │   │   └── nearby/       # CafeSuggestions.tsx (Google Maps finder)
│   │   ├── pages/            # View screens (Overview, MyEvents, Budget, etc.)
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

### Running Backend Unit & Integration Tests (Stages 1 to 8)

Run all 8 automated verification suites using the project Python environment:

```powershell
& "D:\PlanzyPop AI\backend\.venv\Scripts\python.exe" -c "
import subprocess, sys
tests = [
    'test_stage1.py', 'test_stage2.py', 'test_stage3.py', 'test_stage4.py',
    'test_stage5.py', 'test_stage6.py', 'test_stage7.py', 'test_stage8_audit.py'
]
for t in tests:
    res = subprocess.run([sys.executable, f'D:/PlanzyPop AI/backend/{t}'], capture_output=True, text=True)
    status = '[PASS]' if res.returncode == 0 else '[FAIL]'
    print(f'{status} {t}')
"
```

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
  - `events`: Stores celebration titles, dates, locations, guests, and planned budgets.
  - `expenses`: Stores itemized receipts linked to events with foreign key cascade deletion.
  - `tasks`: Stores preparation checklist items, due dates, priorities, and completion flags.
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
- **Google Maps Nearby Café Suggestions:**  
  `[Screenshot Placeholder: Nearby Screen with Geolocation GPS badge and 6 Google Maps search categories]`

---

## 12. Project Limitations

1. **Single-User Workspace:** Designed as a single-host application without multi-user password login or authentication tokens.
2. **Local Storage Database:** Uses SQLite on the local file system; horizontal multi-server database scaling is not implemented.
3. **No Direct SMS/Push Gateway:** Notifications are tracked inside the application drawer rather than sent via external SMS/WhatsApp webhooks.

---

## 13. Future Scope

1. **User Authentication:** Implementing user sign-up, JWT token-based authentication, and password hashing with bcrypt.
2. **UPI Payment Gateway:** Integrating UPI QR code generation or Razorpay webhooks to allow friends to settle their split shares instantly.
3. **Automated WhatsApp Invitations:** Sending RSVP invitation links and task delegation alerts to attendees via WhatsApp Business API.
4. **Cloud Database Migration:** Transitioning from SQLite to PostgreSQL for multi-region hosting and concurrent scaling.
