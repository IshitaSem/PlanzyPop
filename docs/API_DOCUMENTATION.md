# API Documentation: PlanzyPop REST API

**Base URL:** `http://127.0.0.1:8000`  
**Swagger UI Interactive Docs:** `http://127.0.0.1:8000/docs`  
**ReDoc Alternative Docs:** `http://127.0.0.1:8000/redoc`  
**Content-Type:** `application/json`  
**Standard Currency:** Indian Rupee (INR / ₹)  

---

## 1. Overview of HTTP Methods Used

- **`GET`**: Retrieve resources (events, expenses, tasks, budget calculations, health check). Safe and idempotent.
- **`POST`**: Create new entities (create event, add expense, add task, generate suggestions, calculate custom split). Returns HTTP `201 Created` on creation.
- **`PUT`**: Update existing resources completely or partially (edit event, modify expense, update task completion status). Returns HTTP `200 OK`.
- **`DELETE`**: Remove resources permanently (delete event with cascade, delete individual expense, delete task). Returns HTTP `200 OK`.

---

## 2. Interactive Swagger UI Testing

FastAPI automatically generates interactive OpenAPI documentation:
1. Start the backend server (`uvicorn main:app --reload`).
2. Open your web browser and navigate to:  
   `http://127.0.0.1:8000/docs`
3. Click on any route to expand it.
4. Click **"Try it out"**, fill in the parameters or sample JSON body, and click **"Execute"**.
5. Swagger displays the real curl command, response status code (e.g. `200 OK`, `201 Created`, `422 Unprocessable Entity`), and the JSON response body.

---

## 3. Complete Endpoints Reference

### Category A: General & System Endpoints

#### 1. Root Information
- **Endpoint:** `GET /`
- **Purpose:** System identification and basic operational verification.
- **Response:**
  ```json
  {
    "app": "PlanzyPop - Event Planning and Budget Management System",
    "status": "online",
    "currency": "INR",
    "message": "Welcome to the PlanzyPop Event Planning and Budget Management API!"
  }
  ```

#### 2. Health Check
- **Endpoint:** `GET /health`
- **Purpose:** Health ping used by frontend to verify that the Python backend is active.
- **Response:**
  ```json
  {
    "status": "healthy",
    "service": "PlanzyPop Backend"
  }
  ```

---

### Category B: Event Management Endpoints

#### 3. Create Event
- **Endpoint:** `POST /events`
- **Status Code:** `201 Created`
- **Request Body:**
  ```json
  {
    "event_name": "Rohan's 21st Birthday Bash",
    "event_type": "Birthday",
    "event_date": "2026-11-20",
    "location": "Hostel Terrace, Block C",
    "guests": 15,
    "budget": 5000.0,
    "celebration_style": "Hostel & Casual"
  }
  ```
- **Response:** Returns the created `EventResponse` object with generated `id` and `created_at`.

#### 4. List All Events
- **Endpoint:** `GET /events`
- **Purpose:** Retrieves all events, sorted chronologically with the newest ID first.
- **Response:** Array of `EventResponse` objects.

#### 5. Get Event by ID
- **Endpoint:** `GET /events/{event_id}`
- **Purpose:** Fetches single event details by its primary key ID.
- **Response:** `EventResponse` object, or `404 Not Found` if missing.

#### 6. Update Event
- **Endpoint:** `PUT /events/{event_id}`
- **Request Body:** `EventUpdate` (partial updates allowed; any omitted fields remain unchanged).
- **Response:** Updated `EventResponse` object.

#### 7. Delete Event
- **Endpoint:** `DELETE /events/{event_id}`
- **Purpose:** Removes an event. Automatically cascades and deletes linked expenses and tasks.
- **Response:**
  ```json
  {
    "message": "Event 'Rohan's 21st Birthday Bash' (ID: 1) successfully deleted",
    "deleted_id": 1
  }
  ```

---

### Category C: Expenses & Budget Endpoints

#### 8. Add Expense to Event
- **Endpoint:** `POST /events/{event_id}/expenses`
- **Status Code:** `201 Created`
- **Request Body:**
  ```json
  {
    "expense_name": "Chocolate Truffle Birthday Cake",
    "category": "Cake",
    "amount": 850.0,
    "expense_date": "2026-11-19"
  }
  ```
- **Validation:** `amount` must be greater than 0; `category` must match one of the 8 supported categories.

#### 9. List Expenses for Event
- **Endpoint:** `GET /events/{event_id}/expenses`
- **Purpose:** Returns all itemized expenses logged under the specified event ID.

#### 10. Update Expense
- **Endpoint:** `PUT /expenses/{expense_id}`
- **Purpose:** Modifies name, amount, category, or date for an individual expense.

#### 11. Delete Expense
- **Endpoint:** `DELETE /expenses/{expense_id}`
- **Purpose:** Deletes an individual expense item. Automatically adjusts the budget summary.

#### 12. Get Event Budget Summary
- **Endpoint:** `GET /events/{event_id}/budget`
- **Purpose:** Calculates total expenditure, remaining budget, percentage utilization, overspending flags, and category breakdown.
- **Response Example:**
  ```json
  {
    "event_id": 1,
    "event_name": "Rohan's 21st Birthday Bash",
    "currency": "INR",
    "planned_budget": 5000.0,
    "total_expenses": 1250.0,
    "remaining_budget": 3750.0,
    "utilisation_percentage": 25.0,
    "is_over_budget": false,
    "warning_message": null,
    "category_breakdown": {
      "Cake": 850.0,
      "Decorations": 400.0
    }
  }
  ```

#### 13. Event-Specific Equal Expense Split
- **Endpoint:** `GET /events/{event_id}/split-expense?people=5`
- **Purpose:** Divides actual recorded expenses equally among contributing friends. If zero expenses are recorded yet, falls back gracefully to dividing the planned budget.
- **Response Example:**
  ```json
  {
    "total_amount": 1250.0,
    "num_people": 5,
    "share_per_person": 250.0,
    "currency": "INR",
    "split_basis": "actual_expenses",
    "explanation": "Based on actual recorded expenses: Total of Rs 1250.0 divided equally among 5 friends is Rs 250.0 per person."
  }
  ```

#### 14. Custom Standalone Split Calculator
- **Endpoint:** `POST /calculate-split`
- **Request Body:**
  ```json
  {
    "total_amount": 3000.0,
    "num_people": 6
  }
  ```
- **Response:**
  ```json
  {
    "total_amount": 3000.0,
    "num_people": 6,
    "share_per_person": 500.0,
    "currency": "INR",
    "split_basis": "custom_amount",
    "explanation": "Total Rs 3000.0 divided equally among 6 friends is Rs 500.0 per person."
  }
  ```

---

### Category D: Checklist & Timeline Endpoints

#### 15. Create Task
- **Endpoint:** `POST /events/{event_id}/tasks`
- **Status Code:** `201 Created`
- **Request Body:**
  ```json
  {
    "task_name": "Pick up balloons from market",
    "description": "HIGH",
    "due_date": "2026-11-18",
    "is_completed": false
  }
  ```

#### 16. Get Event Tasks (Chronological Timeline)
- **Endpoint:** `GET /events/{event_id}/tasks`
- **Purpose:** Returns all tasks sorted chronologically by `due_date` ascending, with unscheduled tasks placed at the end.

#### 17. Update Task
- **Endpoint:** `PUT /tasks/{task_id}`
- **Purpose:** Allows toggling `is_completed: true` or editing deadline dates.

#### 18. Delete Task
- **Endpoint:** `DELETE /tasks/{task_id}`
- **Purpose:** Removes an individual checklist item.

#### 19. Task Summary & Progress
- **Endpoint:** `GET /events/{event_id}/tasks/summary`
- **Purpose:** Returns total tasks, completed count, pending count, overdue count (due date < today), and progress percentage.
- **Response Example:**
  ```json
  {
    "event_id": 1,
    "total_tasks": 3,
    "completed_tasks": 1,
    "pending_tasks": 2,
    "overdue_tasks": 0,
    "progress_percentage": 33.33
  }
  ```

---

### Category E: Rule-Based Suggestions Engine

#### 20. Synthesize Event Suggestions
- **Endpoint:** `POST /suggestions/generate`
- **Request Body:**
  ```json
  {
    "event_type": "Birthday",
    "budget": 5000.0,
    "guests": 15,
    "celebration_style": "Hostel & Casual"
  }
  ```
- **Response:**
  ```json
  {
    "event_type": "Birthday",
    "budget": 5000.0,
    "guests": 15,
    "celebration_style": "Hostel & Casual",
    "budget_tier": "Mid-Budget (Rs 3,001 - Rs 7,000)",
    "suggested_theme": "Hostel Corridor Lights, Floor Cushions & Midnight Maggi Vibe",
    "food_suggestions": [
      "Customised Birthday Cake (1.5 kg)",
      "Assorted snack boxes (samosas, rolls, chips)",
      "Cold drinks & juice cartons"
    ],
    "decoration_suggestions": [
      "Metallic birthday banner & foil number balloons",
      "Warm fairy lights criss-crossed across room",
      "Instant polaroid photo clothesline"
    ],
    "activity_suggestions": [
      "Birthday countdown & cake cutting ritual",
      "Curated party playlist & sing-along sessions",
      "Party trivia / 'Who knows the birthday host best?' quiz"
    ],
    "budget_allocations": [
      { "category": "Food", "percentage": 40.0, "allocated_amount": 2000.0 },
      { "category": "Cake", "percentage": 25.0, "allocated_amount": 1250.0 },
      { "category": "Decorations", "percentage": 20.0, "allocated_amount": 1000.0 },
      { "category": "Entertainment", "percentage": 10.0, "allocated_amount": 500.0 },
      { "category": "Other", "percentage": 5.0, "allocated_amount": 250.0 }
    ],
    "total_allocated_budget": 5000.0,
    "budget_saving_tips": [
      "Order bakery cakes directly rather than via food delivery apps to save 20-30% on markup.",
      "Reusable fairy lights and streamers save significant money over disposable single-use props."
    ],
    "disclaimer": "All recommendations and budget allocations are computed using deterministic heuristics."
  }
  ```

---

### Category F: User Authentication Endpoints

PlanzyPop supports registered user authentication via Bearer session tokens alongside Guest Demo Mode. When a valid token is provided in the `Authorization` header (`Authorization: Bearer <access_token>`), events and favourites are automatically isolated to that user account.

#### 21. User Registration
- **Endpoint:** `POST /auth/register`
- **Status Code:** `201 Created`
- **Request Body:**
  ```json
  {
    "name": "Aarav Sharma",
    "email": "aarav@example.com",
    "password": "securepassword123"
  }
  ```
- **Response:**
  ```json
  {
    "access_token": "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6",
    "token_type": "bearer",
    "user": {
      "id": 1,
      "name": "Aarav Sharma",
      "email": "aarav@example.com",
      "created_at": "2026-11-20T10:00:00"
    }
  }
  ```
- **Notes:** Newly registered accounts start with an empty dashboard (no demo events, tasks, or expenses).

#### 22. User Login
- **Endpoint:** `POST /auth/login`
- **Status Code:** `200 OK`
- **Request Body:**
  ```json
  {
    "email": "aarav@example.com",
    "password": "securepassword123"
  }
  ```
- **Response:** Returns `TokenResponse` with `access_token` and `user` details. Returns `401 Unauthorized` for invalid credentials.

#### 23. Current User Profile
- **Endpoint:** `GET /auth/me`
- **Headers:** `Authorization: Bearer <token>`
- **Response:** `UserResponse` with `id`, `name`, `email`, and `created_at`. Returns `401 Unauthorized` if token is missing or expired.

#### 24. User Logout
- **Endpoint:** `POST /auth/logout`
- **Headers:** `Authorization: Bearer <token>`
- **Response:**
  ```json
  {
    "message": "Logged out successfully"
  }
  ```

---

### Category G: PopSpots Chandigarh Venue Discovery Endpoints

PopSpots enables discovery of authentic local cafés, bakeries, and party spots strictly geofenced within Chandigarh Union Territory (UT).

#### 25. Get Supported Spot Categories
- **Endpoint:** `GET /api/spots/categories`
- **Response:** Array of category objects (`id`, `name`, `icon`, `count`).

#### 26. Get Available Chandigarh Sectors
- **Endpoint:** `GET /api/spots/sectors`
- **Response:** List of valid sectors and landmarks (e.g. `["Sector 10", "Sector 17", "Sector 35", ...]`).

#### 27. Search & Discover Spots
- **Endpoint:** `GET /api/spots/search`
- **Query Parameters:**
  - `location` (optional string): Sector name or landmark (e.g. `Sector 35`).
  - `latitude`, `longitude` (optional float): Geographic coordinates.
  - `radius` (optional float, 0.5–15.0 km, default `3.0`).
  - `category` (optional string, e.g. `cafes`, `bakeries`, `street_food`, default `all`).
  - `sector` (optional string): Filter by sector.
  - `budget` (optional string, e.g. `Under ₹100`, `₹100 - ₹300`).
  - `vibe` (optional string): Filter by ambiance.
  - `page` (optional int, default `1`).
  - `page_size` (optional int, default `15`).
  - `user_id` (optional string): Guest identifier or user session for bookmark indicator.
- **Geofence Enforcement:** Coordinates or locations outside Chandigarh Union Territory return HTTP `400 Bad Request`.

#### 28. Save Favorite Spot
- **Endpoint:** `POST /api/spots/favorites`
- **Status Code:** `201 Created`
- **Request Body:** `FavoriteCreate` (includes `spot_id`, `name`, `category`, `latitude`, `longitude`, `address`, `user_id`).
- **Response:** Persisted `SavedSpot` record.

#### 29. List Saved Favorite Spots
- **Endpoint:** `GET /api/spots/favorites?user_id=guest_default`
- **Headers:** Optional `Authorization: Bearer <token>`.
- **Response:** List of `FavoriteResponse` objects bookmarked by the user or guest session.

#### 30. Remove Spot from Favorites
- **Endpoint:** `DELETE /api/spots/favorites/{spot_id}`
- **Response:**
  ```json
  {
    "message": "Spot removed from favorites",
    "spot_id": "spot_123"
  }
  ```

#### 31. Get Single Spot Details
- **Endpoint:** `GET /api/spots/{spot_id}`
- **Response:** `SpotBase` object with comprehensive metadata, opening hours, coordinates, address, and vibe tags.
