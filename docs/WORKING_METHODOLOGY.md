# Working Methodology & Algorithmic Workflow: PlanzyPop

This document outlines the step-by-step operational workflows, mathematical calculations, rule algorithms, and integration patterns powering the PlanzyPop Event Planning and Budget Management System.

---

## 1. Event Creation & Management Workflow

```
[Host in React Frontend] ──> Fills Event Form (Name, Type, Date, Location, Guests, Budget)
                                       │
                                       ▼ HTTP POST /events
[FastAPI Backend]        ──> Validates with Pydantic EventCreate Schema
                                       │
                                       ▼ SQLAlchemy ORM
[SQLite Database]        ──> Inserts row into 'events' table
                                       │
                                       ▼ Returns HTTP 201 Created
[React State]            ──> Updates events list, sets active event, triggers toast
```

1. **User Interaction:** The student host opens the event creation sheet via the top-level "Add event" button or the quick-start button in `MyEvents.tsx`.
2. **Client Validation:** React verifies that the title is non-empty and that numeric inputs for guests (≥ 1) and budget (≥ 0) are valid.
3. **Payload Dispatch:** `api.ts:createEvent()` dispatches a JSON `POST` request to `/events`.
4. **Backend Processing:** FastAPI validates the payload against `schemas.EventCreate`. SQLAlchemy creates an `Event` ORM instance, commits the transaction to SQLite, and performs `db.refresh(new_event)`.
5. **Cascading State Update:** The frontend receives the persisted event with its auto-generated `id` and `created_at` timestamp, refreshes the events list, and selects the new event as the active celebration.

---

## 2. Budget Tracking & Overspending Detection

The budget engine continuously computes key fiscal metrics dynamically whenever an expense is logged, edited, or removed:

### Mathematical Formulas:
$$\text{Total Expenses} = \sum_{i=1}^{n} \text{amount}_i$$

$$\text{Remaining Budget} = \text{Planned Budget} - \text{Total Expenses}$$

$$\text{Utilisation Percentage} = \begin{cases} \left(\frac{\text{Total Expenses}}{\text{Planned Budget}}\right) \times 100, & \text{if Planned Budget} > 0 \\ 0.0, & \text{if Planned Budget} = 0 \text{ and Total Expenses} = 0 \\ 100.0, & \text{if Planned Budget} = 0 \text{ and Total Expenses} > 0 \end{cases}$$

### Overspending Detection Logic:
$$\text{is\_over\_budget} = \text{Total Expenses} > \text{Planned Budget}$$

If `is_over_budget` is true, the backend constructs an explicit alert:
$$\text{Warning Message} = \text{"Warning: Spending has exceeded your planned budget by Rs } (\text{Total Expenses} - \text{Planned Budget})\text{!"}$$

In the React UI:
- When $\text{is\_over\_budget}$ is false: A soothing yellow or purple progress ring is displayed, showing remaining funds.
- When $\text{is\_over\_budget}$ is true: The progress bar turns coral/red, and a high-visibility warning card displays the deficit.

---

## 3. Expense Management & Category Breakdown

Expenses are recorded as itemized transactions linked to an `event_id`.

1. **Category Normalization:** The user selects a category from the 8 supported options (`Food`, `Cake`, `Decorations`, `Venue`, `Gifts`, `Travel`, `Entertainment`, `Other`). Pydantic normalizes inputs (e.g. `'cake'` $\rightarrow$ `'Cake'`).
2. **Category-wise Aggregation:** The backend groups all expenses for that event by category:
   ```python
   category_breakdown: Dict[str, float] = {}
   for exp in expenses:
       category_breakdown[exp.category] = round(
           category_breakdown.get(exp.category, 0.0) + exp.amount, 2
       )
   ```
3. **UI Visualization:** In `Budget.tsx`, horizontal progress bars visualize each category's expenditure relative to the overall budget.

---

## 4. Fair Expense Splitting Methodology

PlanzyPop supports two modes of equal cost sharing:

### Mode 1: Event-Specific Split (`GET /events/{id}/split-expense?people=N`)
- **Primary Source:** If actual expense records exist in the database, the split is calculated using real recorded receipts:
  $$\text{Share per Person} = \text{round}\left(\frac{\text{Total Expenses}}{N}, 2\right)$$
  The response explicitly flags `split_basis: "actual_expenses"`.
- **Fallback Source:** If no expense records have been logged yet, the system gracefully falls back to the host's planned budget:
  $$\text{Share per Person} = \text{round}\left(\frac{\text{Planned Budget}}{N}, 2\right)$$
  The response flags `split_basis: "planned_budget"`.

### Mode 2: Custom Split Calculator (`POST /calculate-split`)
A standalone utility that allows dividing any ad-hoc bill among any group size:
$$\text{Share} = \text{round}\left(\frac{\text{Total Amount}}{\text{Number of People}}, 2\right)$$

---

## 5. Checklist & Timeline Organization

1. **Task Prioritization:** Tasks support custom priority descriptors (`HIGH`, `MEDIUM`, `LOW`) and optional due dates.
2. **Chronological Sorting Algorithm:**  
   When fetching tasks via `GET /events/{id}/tasks`, the backend sorts tasks so scheduled items appear in chronological order, while unscheduled tasks appear at the end:
   ```python
   tasks.sort(key=lambda t: (1 if t.due_date is None else 0, t.due_date or "", t.id))
   ```
3. **Overdue Detection:**  
   The backend compares each task's `due_date` against the server's current date ($\text{today}$):
   $$\text{is\_overdue} = (\text{task.is\_completed} == \text{False}) \land (\text{task.due\_date} < \text{today})$$
4. **Dual UI Modes:**  
   In `Checklist.tsx`, the user can toggle between:
   - **Checklist View:** Interactive checkboxes to mark items done.
   - **Timeline View:** Step-by-step milestone progression leading up to the celebration date.

---

## 6. Rule-Based Recommendation Engine

PlanzyPop intentionally avoids costly or unpredictable black-box Large Language Model (LLM) APIs. Instead, it features an **expert rule-based heuristic inference engine** designed specifically for Indian student celebrations:

```
[Input Request]
(Event Type, Budget, Guests, Celebration Style)
         │
         ▼
[Budget Tier Classifier]
Classifies into: Zero-Budget (0), Ultra-Budget (<=1k), Student-Budget (1k-3k),
                 Mid-Budget (3k-7k), Premium (>7k)
         │
         ▼
[Category Allocation Matrix]
Selects percentage weight profile (e.g., Birthday: Food 40%, Cake 25%, Decor 20%, ...)
         │
         ▼
[Allocation Balancer (compute_budget_allocation)]
Computes rounded rupee amounts and balances difference to guarantee:
sum(allocations) == budget
         │
         ▼
[Theme & Decor Heuristic Selector]
Matches style ('Hostel & Casual', 'Aesthetic', 'DIY') to curated themes,
snack menus, and low-cost party activities.
         │
         ▼
[Output JSON Response]
Stateless output returned in milliseconds with 0 DB writes.
```

- **Speed:** Generates responses in under 5 milliseconds.
- **Explainability:** Every allocation and tip is deterministic and fully explainable during a university viva examination.
- **Direct Integration:** Users can click "Add to My Events" to automatically insert the recommended theme, budget, and starter checklist tasks into the database.

---

## 7. Nearby Finds & Google Maps Café Suggestions

The café and venue discovery feature connects hosts to verified local businesses without maintaining a stale or fabricated internal database:

```
[User Clicks "Use My Location"]
         │
         ▼
[Browser Geolocation API: navigator.geolocation.getCurrentPosition]
         ├── If Permission Granted ──> Captures (latitude, longitude)
         │                             Generates targeted Google Maps query:
         │                             https://www.google.com/maps/search/{query}/@{lat},{lng},15z
         │
         └── If Permission Denied ───> Displays informative notice
                                       Prompts user for manual City/Area input
                                       Generates targeted query:
                                       https://www.google.com/maps/search/?api=1&query={query} in {city}
```

### Curated Search Categories:
1. **Cafés near me** $\rightarrow$ `cafes near me`
2. **Budget-friendly cafés** $\rightarrow$ `budget friendly pocket friendly student cafes near me`
3. **Birthday celebration cafés** $\rightarrow$ `birthday celebration cafes private area party near me`
4. **Group-friendly cafés** $\rightarrow$ `large group friendly cafes board games rooftop near me`
5. **Bakeries and cake shops** $\rightarrow$ `bakery and cake shop custom birthday cakes near me`
6. **Restaurants suitable for small celebrations** $\rightarrow$ `restaurants for small party celebration group dining near me`

- **Privacy & Permissions:** Geolocation is only accessed after the user clicks the explicit button.
- **Universal Maps Links:** Links open in a new tab (`target="_blank" rel="noopener noreferrer"`). On Android devices, these links trigger the native Google Maps app intent; on desktop and tablets, they open Google Maps in the browser.
- **Academic Integrity:** Transparent disclaimers inform users that live ratings, opening hours, photos, and reviews are sourced authentically and directly from Google Maps.

---

## 8. Frontend and Backend Integration

1. **Strict Types Alignment:** Frontend interfaces in `frontend/src/types/index.ts` match backend Pydantic models in `backend/schemas.py`.
2. **Error Translation:** Network errors and HTTP 422 validation details are parsed by `api.ts` into clean, human-readable toast messages.
3. **Real-time Connection Indicator:** The global desktop header checks the backend `/health` endpoint and displays a live indicator:
   - Green `LIVE API` badge when the server is connected.
   - Amber `OFFLINE` badge if the backend is paused.
