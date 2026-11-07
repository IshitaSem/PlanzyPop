# Viva Preparation & Academic Q&A: PlanzyPop

**Project Title:** PlanzyPop – Event Planning and Budget Management System  
**Academic Degree:** Master of Science in Computer Science (Data Science)  
**Academic Focus:** Full-Stack Software Engineering, Relational Database Modeling, and Rule-Based Decision Systems  

---

## 1. Project Background & Motivation

### Q1: Why did you choose this project for your semester mini-project?
**Answer:**  
College and university students frequently host small celebrations—such as birthday parties, fresher welcomes, hostel farewells, and potluck dinners. However, students operate with limited pocket-money budgets and lack dedicated tools for cost tracking, expense splitting, and task timelines. Existing event planning platforms are geared towards expensive commercial weddings or corporate events.  
PlanzyPop was selected to address this practical gap by creating an affordable, student-centric event workspace combining relational database storage, dynamic budget calculations, a rule-based planning engine, and Google Maps venue search.

### Q2: What are the primary objectives of the system?
**Answer:**  
The project achieves five core objectives:
1. Provide full CRUD operations to plan and manage celebrations.
2. Track itemized expenses across standardized categories and alert the host in case of overspending.
3. Automatically split bills equally among friends based on actual expenses or budget estimates.
4. Manage a preparation checklist with deadlines, overdue tracking, and a visual timeline.
5. Provide personalized theme, menu, and budget allocation recommendations through a rule-based expert engine.

---

## 2. Architecture & Technical Choices

### Q3: Why did you choose React for the frontend?
**Answer:**  
React (version 19 with TypeScript and Vite) was selected because:
- **Component Reusability:** Complex UI elements like progress rings, modals, icon buttons, and expense rows are built as modular, reusable components.
- **Declarative State Management:** React’s virtual DOM efficiently re-renders only the changed portions of the interface when an expense is added or a task is checked off.
- **Type Safety:** Using TypeScript ensures that API data structures (events, budgets, tasks) are strictly typed, reducing runtime bugs.
- **Fast Development Cycle:** Vite provides near-instantaneous Hot Module Replacement (HMR) and rapid production builds.

### Q4: Why did you choose FastAPI for the backend instead of Flask or Django?
**Answer:**  
FastAPI was selected for three principal reasons:
1. **High Performance & Asynchronous Support:** Built on Starlette and ASGI, FastAPI is one of the fastest Python web frameworks available.
2. **Automatic Data Validation:** By integrating Pydantic, request payloads are automatically validated against predefined schemas. Invalid data types or negative numbers are rejected with clear HTTP 422 error messages.
3. **Automated Interactive Documentation:** FastAPI automatically generates OpenAPI-compliant Swagger documentation (`/docs`) and ReDoc (`/redoc`), allowing teachers and examiners to test every endpoint directly without third-party tools like Postman.

### Q5: Why was SQLite selected as the database?
**Answer:**  
SQLite is an embedded, serverless, zero-configuration relational database engine.
- For an academic mini-project, it eliminates the overhead of managing a separate database daemon (like MySQL or PostgreSQL).
- The entire database is stored locally in a single file (`backend/planzypop.db`), making project evaluation, demonstration, and backup seamless.
- It is fully ACID-compliant and supports relational constraints including primary keys and foreign keys with cascade deletion.

---

## 3. Core Software Engineering Concepts

### Q6: What is a REST API and how does PlanzyPop implement it?
**Answer:**  
REST (Representational State Transfer) is an architectural style for designing networked applications using standard HTTP protocols:
- **Statelessness:** Each request contains all information needed to process it; the server stores no client session context.
- **Uniform Interface:** Resources are identified by URLs (e.g. `/events`, `/events/{id}/expenses`) and manipulated using standard HTTP verbs:
  - `GET` to read resources.
  - `POST` to create resources.
  - `PUT` to update resources.
  - `DELETE` to delete resources.
- **Standard Status Codes:** The API returns standard HTTP status codes: `200 OK`, `201 Created`, `404 Not Found`, and `422 Unprocessable Entity`.

### Q7: What are CRUD operations? Give an example from your project.
**Answer:**  
CRUD stands for **Create, Read, Update, Delete**—the four foundational data persistence operations:
1. **Create:** Adding a new event (`POST /events`) or expense (`POST /events/{id}/expenses`).
2. **Read:** Fetching all events (`GET /events`) or a single event (`GET /events/{id}`).
3. **Update:** Editing an event date or budget (`PUT /events/{id}`) or marking a task done (`PUT /tasks/{id}`).
4. **Delete:** Removing an event (`DELETE /events/{id}`) or deleting an expense (`DELETE /expenses/{id}`).

### Q8: What is an ORM and what role does SQLAlchemy play?
**Answer:**  
ORM stands for **Object-Relational Mapping**. It is a software technique that bridges object-oriented programming (Python classes) and relational databases (SQL tables):
- In PlanzyPop, SQLAlchemy translates Python objects (`Event`, `Expense`, `Task`) into SQL statements (`INSERT`, `SELECT`, `UPDATE`, `DELETE`) without requiring manual raw SQL string concatenation.
- It prevents SQL injection attacks through automatic query parameterization.
- It enforces relational integrity and handles cascade deletion (`cascade="all, delete-orphan"`), so deleting an event automatically removes its associated expenses and tasks.

---

## 4. Algorithmic Logic & Features

### Q9: What is the Rule-Based Recommendation Engine? Does it use Machine Learning or AI?
**Answer:**  
No, the recommendation engine **does not use machine learning, deep learning, neural networks, or external generative AI APIs**.  
Instead, it is a **deterministic rule-based expert system** implemented in `backend/suggestions.py`:
- It evaluates four structured inputs: event type, budget, guest count, and celebration style.
- It categorizes the budget into tiers (`Zero-Budget`, `Ultra-Budget`, `Student-Budget`, `Mid-Budget`, `Premium`).
- It applies a predefined domain-expert allocation matrix to determine budget percentages for Food, Cake, Decorations, Entertainment, etc.
- A balancing algorithm (`compute_budget_allocation`) rounds amounts and adjusts rounding remainders so the sum of category allocations exactly equals the user's total budget:
  $$\sum \text{allocated\_amount} = \text{total\_budget}$$
- This approach is predictable, transparent, explainable, runs in under 5ms, and requires no paid third-party API subscriptions.

### Q10: How do budget calculations and overspending detection work?
**Answer:**  
When `GET /events/{id}/budget` is requested:
1. The backend sums all expense records linked to `event_id`: $\text{Total Expenses} = \sum \text{amount}$.
2. It subtracts total expenses from the planned budget: $\text{Remaining} = \text{Planned} - \text{Total Expenses}$.
3. It computes percentage utilization: $\text{Utilisation} = (\text{Total Expenses} / \text{Planned}) \times 100$.
4. It safely checks for zero-budget events to prevent runtime `ZeroDivisionError`.
5. If $\text{Total Expenses} > \text{Planned Budget}$, the boolean flag `is_over_budget` is set to `True`, and a detailed warning message with the exact overspent amount is generated.

### Q11: How does equal expense splitting work?
**Answer:**  
PlanzyPop offers two splitting methods:
- **Event-Specific Split (`GET /events/{id}/split-expense?people=N`):** If real expense records exist, it divides actual recorded spending among $N$ friends: $\text{Share} = \text{Total Expenses} / N$. If no expenses have been recorded yet, it divides the planned budget as a fallback: $\text{Share} = \text{Planned Budget} / N$.
- **Custom Split (`POST /calculate-split`):** Divides any ad-hoc bill amount by the number of contributing people.

### Q12: How does the browser geolocation and Google Maps café suggestions feature work?
**Answer:**  
1. When the user clicks "Use My Location", the React frontend calls `navigator.geolocation.getCurrentPosition()`.
2. The browser presents a native permission dialog.
3. If permission is granted, the browser provides the user's geographic coordinates (latitude and longitude).
4. The system constructs a targeted Google Maps search URL centered on those coordinates at zoom level 15:
   `https://www.google.com/maps/search/{query}/@{latitude},{longitude},15z`
5. If permission is denied or unavailable, the user can manually type their city or neighborhood (e.g. "Dehradun" or "Koramangala"), and the URL is formed as:
   `https://www.google.com/maps/search/?api=1&query={query} in {city}`
6. When clicked, the link opens Google Maps in a new tab. No paid Google Cloud API keys are required, and the system never shows fake or fabricated venue ratings.

---

## 5. Limitations & Future Scope

### Q13: What are the current limitations of this project?
**Answer:**  
1. **Single-User Workspace:** The application does not currently implement multi-user authentication (JWT / OAuth2); all data belongs to the local host.
2. **Local Database:** The SQLite database is hosted locally on the server machine, which is ideal for single-instance hosting but not distributed multi-server clusters.
3. **No Direct SMS/Push Gateways:** Reminders and notifications are managed inside the application drawer rather than via external SMS or WhatsApp APIs.

### Q14: What is the future scope for expanding this system?
**Answer:**  
1. **Multi-User Authentication:** Adding user registration and login using JWT tokens and password hashing (bcrypt).
2. **Payment Gateway Integration:** Integrating UPI/Razorpay webhooks to allow contributing friends to settle their split shares directly through UPI QR codes.
3. **WhatsApp / Email RSVP Bot:** Sending automated RSVP invitation links and task delegation alerts to attendees via the WhatsApp Business API.
4. **Cloud Migration:** Transitioning the database from SQLite to PostgreSQL for multi-region scalability.
