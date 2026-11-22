# Project Overview: PlanzyPop

**Project Title:** PlanzyPop – Event Planning and Budget Management System  
**Academic Degree:** Master of Science in Computer Science (Data Science)  
**Academic Nature:** Semester Academic Mini-Project  
**Currency Standard:** Indian Rupee (INR / ₹)  

---

## 1. Problem Statement

Planning small-to-medium celebrations—such as college fresher parties, hostel farewells, birthdays, potlucks, and casual get-togethers—presents persistent practical hurdles for university students and young hosts:
- **Budget Uncertainty & Overspending:** Student hosts often lack a clear plan for category-level allocations (e.g., cake vs. snacks vs. decorations), resulting in uncoordinated purchases and surprise budget deficits.
- **Unorganized Preparation Checklists:** Tasks, timelines, and deadlines are typically tracked in fragmented WhatsApp chats or paper notes, leading to forgotten items like candles, sound adapters, or balloons.
- **Awkward Expense Splitting:** Calculating shared costs manually across contributing friends is error-prone, opaque, and causes social friction.
- **Fragmented Venue Discovery:** Finding student-friendly hangout spots, bakeries, or group cafes often exposes hosts to sponsored listings, unverified data, or expensive booking agents.

---

## 2. Project Objectives

PlanzyPop was engineered as a reliable, responsive, full-stack event workspace that addresses these issues directly:
1. **End-to-End Event Management:** Enable hosts to perform full CRUD operations (Create, Read, Update, Delete) on celebration events with customizable guest counts, venues, and dates.
2. **Transparent Budget & Expense Tracking:** Maintain itemized expenditure logging across standard categories, track remaining balance in real time, and trigger proactive overspending warnings.
3. **Fair Expense Splitting:** Provide an automated splitting mechanism that divides actual recorded expenses or planned budgets equally among contributing participants.
4. **Timeline-Driven Checklist:** Organize preparation tasks chronologically, calculate completion progress dynamically, and flag overdue items.
5. **Rule-Based Recommendation Engine:** Provide a deterministic, expert-rules-driven synthesis of event themes, food menus, DIY decor concepts, and percentage-based budget allocations without incurring paid API costs.
6. **Live Google Maps & PopSpots Integration:** Utilize browser geolocation and direct Google Maps query generation alongside PopSpots—a geofenced venue discovery system for Chandigarh UT with interactive Leaflet mapping and bookmarking.
7. **Secure User Authentication & Data Isolation:** Provide registered user sign-up and login with bcrypt password hashing and token-based data isolation, alongside an interactive Guest Demo Mode.

---

## 3. Target Users

- **University & College Students:** Organizing hostel parties, wing celebrations, birthday bashes, and club farewells with fixed pocket-money budgets.
- **Roommates & Student Cohorts:** Sharing household celebrations, movie nights, and weekend potlucks requiring transparent bill splitting.
- **Young Independent Hosts:** Planning first-time casual celebrations needing structured checklists and rule-guided ideas.

---

## 4. Main Features

| Feature Module | Key Capabilities |
| :--- | :--- |
| **Workspace Dashboard** | High-level metrics: total planned events, aggregate planned budget, completed tasks ratio, and quick celebration shortcuts. |
| **Event Lifecycle (CRUD)** | Create events with custom themes, dates, guest counts, and target budgets; edit details; delete with cascading cleanup. |
| **Budget & Expense Tracking** | Log itemized purchases with standardized categories (`Food`, `Cake`, `Decorations`, `Venue`, `Gifts`, `Travel`, `Entertainment`, `Other`); real-time utilization progress bar and overspending alert banner. |
| **Expense Splitting** | Automated calculator dividing actual recorded event expenses or fallback planned budgets evenly among invited friends. |
| **Checklist & Timeline** | Prioritized preparation checklist with toggleable completion states, due dates, overdue detection, and a chronological timeline view. |
| **Rule-Based Planner** | Heuristic expert engine evaluating event type, guest size, celebration vibe, and budget tier to output balanced allocations and DIY tips. |
| **PopSpots Venue Discovery** | Real local café, bakery, and party venue explorer geofenced to Chandigarh UT with interactive Leaflet map, distance sorting, and bookmarks. |
| **User Authentication & Guest Mode** | User registration and login with bcrypt password hashing and token authentication, with full data isolation and a rich guest demo mode. |
| **Nearby Café & Venue Suggestions** | Browser geolocation-enabled Google Maps integration with 6 curated categories, fallback manual city entry, and authentic live listings. |
| **Host Preferences** | Local profile personalization, host name and group customization, notification drawer, and application settings. |

---

## 5. Technology Stack

### Frontend Architecture
- **Framework & Runtime:** React 19 (Single Page Application architecture)
- **Language:** TypeScript 5.7 (Strict type-checking)
- **Build & Dev Tooling:** Vite 8 (Hot Module Replacement, fast bundling)
- **Styling:** Tailwind CSS v4 + Custom Neo-Brutalist CSS Design System (solid inks, pastel palettes, responsive cards)
- **Mapping:** Leaflet & React-Leaflet with OpenStreetMap tiles
- **Session Management:** React Authentication Context (`AuthContext`)
- **Navigation:** State-driven SPA screen router with desktop sidebar and mobile bottom navigation bar

### Backend Architecture
- **Web Framework:** FastAPI (Python 3.10+)
- **Authentication:** Token-based session authentication with bcrypt password hashing
- **Geodata & Venues:** Geoapify Places API v2 + OpenStreetMap Overpass API, geofenced with Shapely ray-casting
- **API Paradigm:** RESTful Architecture with standard HTTP verbs (`GET`, `POST`, `PUT`, `DELETE`)
- **Documentation:** Interactive OpenAPI (Swagger UI) at `/docs` and ReDoc at `/redoc`
- **CORS Middleware:** Enabled for local frontend origins (`http://localhost:5173`, `http://127.0.0.1:5173`)
- **Validation Engine:** Pydantic v2 (Strict request/response schema modeling)
- **Testing:** Pytest (10 test suites, 74 tests)

### Database Layer
- **Database Engine:** SQLite (Embedded relational database stored at `backend/planzypop.db`)
- **ORM (Object Relational Mapping):** SQLAlchemy 2.x
- **Tables:** `users`, `user_tokens`, `events`, `expenses`, `tasks`, `saved_spots`
- **Integrity Constraints:** Foreign keys with `ON DELETE CASCADE` between Events, Expenses, Tasks, and User Tokens

---

## 6. Frontend / Backend Communication Model

```
+--------------------------------------------------------------------+
|                         React 19 Frontend                          |
|  (Components, Pages, AuthContext, Leaflet Map, Geolocation, Vite)   |
+--------------------------------------------------------------------+
                                  |
                                  | HTTP / JSON (Fetch API + Bearer Token)
                                  v
+--------------------------------------------------------------------+
|                         FastAPI Backend                            |
|       (Routers: auth, events, expenses, spots, tasks, suggestions)  |
|               (Pydantic Schemas & Request Validation)              |
+--------------------------------------------------------------------+
                                  |
                                  | SQLAlchemy 2.0 ORM
                                  v
+--------------------------------------------------------------------+
|                         SQLite Database                            |
| (planzypop.db: users, user_tokens, events, expenses, tasks, spots) |
+--------------------------------------------------------------------+
```

1. **Client-Side Initiates:** The React UI triggers asynchronous HTTP requests via `src/services/api.ts` using the browser standard `fetch()` API.
2. **Server Validates:** FastAPI intercepts requests, checks headers, and validates JSON payloads against Pydantic models in `schemas.py`. Invalid requests return HTTP 422 with descriptive field errors.
3. **ORM Executes:** SQLAlchemy translates Python operations into parameterized SQL queries against `planzypop.db`.
4. **JSON Response:** Database entities are converted into JSON response models and sent back to the frontend with appropriate HTTP status codes (200, 201, 204, 404, 422).
5. **UI Updates Reactively:** React hooks (`useState`, `useEffect`, `useMemo`) receive the JSON payloads, trigger atomic UI re-renders, and display confirmation toasts.
