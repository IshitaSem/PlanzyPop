# Database Design & Architecture: PlanzyPop

**Database Engine:** SQLite 3  
**Database File Location:** `backend/planzypop.db`  
**ORM Framework:** SQLAlchemy 2.x  
**Schema Creation Strategy:** Automated code-first initialization via `models.Base.metadata.create_all(bind=engine)`

---

## 1. Why SQLite Was Selected

For an M.Sc. Computer Science academic mini-project, SQLite offers significant architectural advantages:
1. **Serverless & Zero Configuration:** SQLite runs embedded in the Python process without requiring a separate database daemon process, user credentials, or network port binding.
2. **ACID Compliant:** SQLite fully supports Atomic, Consistent, Isolated, and Durable transactions, ensuring transactional reliability during event, expense, and task updates.
3. **Single File Storage:** The entire database resides in `backend/planzypop.db`, making backup, project distribution, and teacher evaluation straightforward.
4. **Relational Integrity:** SQLite enforces table constraints, primary keys, and foreign keys when properly configured with SQLAlchemy.

---

## 2. Entity-Relationship (ER) Diagram

```mermaid
erDiagram
    USERS ||--o{ USER_TOKENS : "has many (1:N)"
    USERS ||--o{ EVENTS : "owns (1:N)"
    USERS ||--o{ SAVED_SPOTS : "bookmarks (1:N)"
    EVENTS ||--o{ EXPENSES : "has many (1:N)"
    EVENTS ||--o{ TASKS : "has many (1:N)"

    USERS {
        INTEGER id PK "Auto-increment primary key"
        VARCHAR(100) name "Host full name"
        VARCHAR(100) email "Unique email address"
        VARCHAR(200) hashed_password "Bcrypt password hash"
        DATETIME created_at "Registration timestamp"
    }

    USER_TOKENS {
        INTEGER id PK "Auto-increment primary key"
        VARCHAR(100) token "Unique session token"
        INTEGER user_id FK "References USERS.id (ON DELETE CASCADE)"
        DATETIME created_at "Token issuance timestamp"
    }

    EVENTS {
        INTEGER id PK "Auto-increment primary key"
        VARCHAR(100) user_id FK "Owner user ID or guest identifier"
        VARCHAR(100) event_name "Name of celebration (required)"
        VARCHAR(50) event_type "Category e.g. Birthday, Fresher (required)"
        VARCHAR(50) event_date "Date string YYYY-MM-DD (required)"
        VARCHAR(200) location "Celebration venue or area (optional)"
        INTEGER guests "Expected attendees count (default: 1)"
        FLOAT budget "Target planned budget in INR (default: 0.0)"
        VARCHAR(100) celebration_style "Vibe e.g. Casual, Aesthetic"
        DATETIME created_at "Timestamp of record creation"
    }

    EXPENSES {
        INTEGER id PK "Auto-increment primary key"
        INTEGER event_id FK "References EVENTS.id (ON DELETE CASCADE)"
        VARCHAR(100) expense_name "Item purchased e.g. Cake (required)"
        VARCHAR(50) category "Food, Cake, Decorations, etc. (required)"
        FLOAT amount "Cost in INR (required, > 0)"
        VARCHAR(50) expense_date "Purchase date string (optional)"
        DATETIME created_at "Timestamp of record creation"
    }

    TASKS {
        INTEGER id PK "Auto-increment primary key"
        INTEGER event_id FK "References EVENTS.id (ON DELETE CASCADE)"
        VARCHAR(150) task_name "Action item description (required)"
        TEXT description "Priority or details e.g. HIGH (optional)"
        VARCHAR(50) due_date "Target completion date (optional)"
        BOOLEAN is_completed "Completion flag (default: False)"
        DATETIME created_at "Timestamp of record creation"
    }

    SAVED_SPOTS {
        INTEGER id PK "Auto-increment primary key"
        VARCHAR(50) user_id "Owner user ID or guest identifier"
        VARCHAR(100) spot_id "Unique venue identifier"
        VARCHAR(150) name "Venue business name"
        VARCHAR(50) category "Cafe, Bakery, Restaurant, etc."
        FLOAT latitude "Geographic latitude"
        FLOAT longitude "Geographic longitude"
        VARCHAR(250) address "Local address / Sector"
        VARCHAR(100) opening_hours "Operational schedule"
        VARCHAR(50) price_info "Price tier"
        VARCHAR(50) vibe "Ambiance tag"
        TEXT tags_json "Additional amenity tags"
        DATETIME saved_at "Bookmark timestamp"
    }
```

---

## 3. Relational Table Specifications

### Table 1: `events`
Stores core celebration records created by the host.

| Column Name | SQLite Data Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `INTEGER` | Primary Key, Auto-increment | Unique synthetic identifier for the event. |
| `user_id` | `VARCHAR(100)` | Nullable, Index=True | Owner user ID or guest session identifier. |
| `event_name` | `VARCHAR(100)` | Not Null, Index=True | Title of the event (e.g. "Rohan's 21st Birthday"). |
| `event_type` | `VARCHAR(50)` | Not Null | Classification (e.g. Birthday, Fresher, House Party). |
| `event_date` | `VARCHAR(50)` | Not Null | Date of celebration in ISO format (`YYYY-MM-DD`). |
| `location` | `VARCHAR(200)` | Nullable | Venue address or hostel block. |
| `guests` | `INTEGER` | Not Null, Default = 1 | Total number of participating friends. |
| `budget` | `FLOAT` | Not Null, Default = 0.0 | Host's targeted total expenditure limit in INR. |
| `celebration_style` | `VARCHAR(100)` | Nullable | Aesthetic preference (e.g. "Casual", "DIY"). |
| `created_at` | `DATETIME` | Not Null, Default = `utcnow` | Audit timestamp of when the event was registered. |

### Table 2: `expenses`
Stores individual expenditure line items linked to a parent event.

| Column Name | SQLite Data Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `INTEGER` | Primary Key, Auto-increment | Unique identifier for each expense item. |
| `event_id` | `INTEGER` | Foreign Key (`events.id`), Not Null | Links expense directly to its parent event. |
| `expense_name` | `VARCHAR(100)` | Not Null | Description of purchase (e.g. "Chocolate Truffle Cake"). |
| `category` | `VARCHAR(50)` | Not Null | Standard category (`Food`, `Decorations`, `Cake`, etc.). |
| `amount` | `FLOAT` | Not Null | Transaction cost in Indian Rupees (₹). |
| `expense_date` | `VARCHAR(50)` | Nullable | Date when the purchase occurred. |
| `created_at` | `DATETIME` | Not Null, Default = `utcnow` | Audit timestamp of expense creation. |

### Table 3: `tasks`
Stores checklist items and timeline milestones for an event.

| Column Name | SQLite Data Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `INTEGER` | Primary Key, Auto-increment | Unique identifier for each checklist task. |
| `event_id` | `INTEGER` | Foreign Key (`events.id`), Not Null | Links task directly to its parent event. |
| `task_name` | `VARCHAR(150)` | Not Null | Action description (e.g. "Pick up balloons from market"). |
| `description` | `TEXT` | Nullable | Priority badge (`HIGH`, `MEDIUM`, `LOW`) or note. |
| `due_date` | `VARCHAR(50)` | Nullable | Milestone deadline date (`YYYY-MM-DD`). |
| `is_completed` | `BOOLEAN` | Not Null, Default = `False` | Boolean toggle representing task completion. |
| `created_at` | `DATETIME` | Not Null, Default = `utcnow` | Audit timestamp of task creation. |

### Table 4: `users`
Stores registered user credentials and profile records.

| Column Name | SQLite Data Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `INTEGER` | Primary Key, Auto-increment | Unique synthetic identifier for the user. |
| `name` | `VARCHAR(100)` | Not Null | Host's display name. |
| `email` | `VARCHAR(100)` | Unique, Index=True, Not Null | Account email address used for login. |
| `hashed_password` | `VARCHAR(200)` | Not Null | Cryptographic salted hash of user password (bcrypt). |
| `created_at` | `DATETIME` | Not Null, Default = `utcnow` | Timestamp of account registration. |

### Table 5: `user_tokens`
Stores active session tokens for authenticated users.

| Column Name | SQLite Data Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `INTEGER` | Primary Key, Auto-increment | Unique synthetic identifier for the session. |
| `token` | `VARCHAR(100)` | Unique, Index=True, Not Null | Cryptographically random session bearer token. |
| `user_id` | `INTEGER` | Foreign Key (`users.id`), Not Null | References the authenticated user account. |
| `created_at` | `DATETIME` | Not Null, Default = `utcnow` | Timestamp of session issuance. |

### Table 6: `saved_spots`
Stores bookmarked venues and favourite cafés from PopSpots.

| Column Name | SQLite Data Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `INTEGER` | Primary Key, Auto-increment | Unique identifier for each bookmarked venue. |
| `user_id` | `VARCHAR(50)` | Index=True, Default = `'guest'` | User ID or guest session identifier. |
| `spot_id` | `VARCHAR(100)` | Index=True, Not Null | Unique venue identifier. |
| `osm_type` | `VARCHAR(20)` | Nullable | OpenStreetMap element type (`node`, `way`). |
| `osm_id` | `VARCHAR(50)` | Nullable | OpenStreetMap identifier. |
| `name` | `VARCHAR(150)` | Not Null | Venue business name. |
| `category` | `VARCHAR(50)` | Not Null | Venue category (Café, Bakery, Restaurant, etc.). |
| `latitude` | `FLOAT` | Not Null | Venue latitude coordinate. |
| `longitude` | `FLOAT` | Not Null | Venue longitude coordinate. |
| `address` | `VARCHAR(250)` | Nullable | Physical street or sector address. |
| `opening_hours` | `VARCHAR(100)` | Nullable | Operational hours description. |
| `price_info` | `VARCHAR(50)` | Nullable | Cost indicator (e.g. `₹₹`). |
| `vibe` | `VARCHAR(50)` | Nullable | Aesthetic / ambiance descriptor. |
| `tags_json` | `TEXT` | Nullable | JSON string containing amenity tags. |
| `saved_at` | `DATETIME` | Not Null, Default = `utcnow` | Timestamp when venue was bookmarked. |

---

## 4. Primary Key & Foreign Key Relationships

### Primary Keys
- Every table has an integer primary key column named `id`.
- SQLite assigns `id` as an `AUTOINCREMENT` sequence, ensuring each entity has an immutable, unique identifier.

### Foreign Keys & Referential Integrity
- `expenses.event_id` references `events.id` with `ON DELETE CASCADE`.
- `tasks.event_id` references `events.id` with `ON DELETE CASCADE`.
- `user_tokens.user_id` references `users.id` with `ON DELETE CASCADE`.
- **Cascade Deletion (`ON DELETE CASCADE`):**  
  In `models.py`, relationships are defined with `cascade="all, delete-orphan"`:
  ```python
  tokens = relationship("UserToken", back_populates="user", cascade="all, delete-orphan")
  expenses = relationship("Expense", back_populates="event", cascade="all, delete-orphan")
  tasks = relationship("Task", back_populates="event", cascade="all, delete-orphan")
  ```
  When an event is deleted via `DELETE /events/{id}`, SQLAlchemy and SQLite automatically delete all associated expense rows and task rows. Similarly, when a user account is removed, its active session tokens are automatically deleted. This prevents orphaned records and maintains database cleanliness.

---

## 5. Supported Expense Categories

To ensure consistency in category breakdowns, both the backend validation layer (`schemas.py`) and frontend interfaces (`types/index.ts`) enforce an identical list of 8 standard categories:
1. `Food` (snacks, platters, pizzas, rolls)
2. `Decorations` (balloons, fairy lights, streamers, photo backdrops)
3. `Cake` (custom cakes, pastries, cupcakes)
4. `Venue` (cafe table booking, cover charges, hall rent)
5. `Gifts` (party favors, return gifts, birthday surprises)
6. `Travel` (auto-rickshaw, cab pool, transit)
7. `Entertainment` (speaker rentals, board games, movie tickets)
8. `Other` (paper plates, napkins, miscellaneous supplies)
