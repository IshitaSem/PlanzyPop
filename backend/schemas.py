"""
PlanzyPop – Event Planning and Budget Management System
Academic Mini-Project for M.Sc. Computer Science (Data Science)

Stage 3, 4, 5 & 6: Pydantic Validation Schemas (Events, Expenses, Budget, Tasks & Suggestions)
"""

from datetime import datetime
from typing import Optional, Dict, List, Any
from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator

# Valid student-friendly expense categories
EXPENSE_CATEGORIES = [
    "Food",
    "Decorations",
    "Cake",
    "Venue",
    "Gifts",
    "Travel",
    "Entertainment",
    "Other"
]


# ============================================================================
# Event Schemas (Stage 3)
# ============================================================================

class EventBase(BaseModel):
    """
    Base schema containing shared event fields and validation rules.
    """
    event_name: str = Field(..., min_length=1, description="Name of the celebration or event")
    event_type: str = Field(..., min_length=1, description="Type of celebration, e.g., Birthday, Fresher, Farewell, Hostel Party")
    event_date: str = Field(..., min_length=1, description="Event date string, e.g., 2026-11-20")
    location: Optional[str] = Field(default=None, description="Event venue or location (e.g. Hostel Common Room, Campus Hall)")
    guests: int = Field(default=0, ge=0, description="Expected number of attendees (must be >= 0)")
    budget: float = Field(default=0.0, ge=0.0, description="Planned budget in INR (must be >= 0.0)")
    celebration_style: Optional[str] = Field(default=None, description="Theme or vibe, e.g., DIY, Casual, Aesthetic")

    @field_validator("event_name", "event_type", "event_date")
    @classmethod
    def check_not_blank(cls, value: str) -> str:
        """
        Validates that text fields are not just empty whitespace.
        """
        if not value or not value.strip():
            raise ValueError("Field cannot be empty or only spaces")
        return value.strip()


class EventCreate(EventBase):
    pass


class EventUpdate(BaseModel):
    event_name: Optional[str] = None
    event_type: Optional[str] = None
    event_date: Optional[str] = None
    location: Optional[str] = None
    guests: Optional[int] = Field(default=None, ge=0, description="Guests must be >= 0 if provided")
    budget: Optional[float] = Field(default=None, ge=0.0, description="Budget in INR must be >= 0.0 if provided")
    celebration_style: Optional[str] = None

    @field_validator("event_name", "event_type", "event_date")
    @classmethod
    def check_not_blank(cls, value: Optional[str]) -> Optional[str]:
        if value is not None and not value.strip():
            raise ValueError("Field cannot be empty or only spaces")
        return value.strip() if value is not None else None


class EventResponse(EventBase):
    id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ============================================================================
# Expense Schemas (Stage 4)
# ============================================================================

class ExpenseBase(BaseModel):
    """
    Base schema for event expenses.
    """
    expense_name: str = Field(..., min_length=1, description="Description of the expense item, e.g., Chocolate Cake")
    category: str = Field(default="Other", description="Expense category (Food, Decorations, Cake, Venue, etc.)")
    amount: float = Field(..., ge=0.0, description="Expense amount in INR (must be >= 0.0)")
    expense_date: Optional[str] = Field(default=None, description="Date when expense was incurred")

    @field_validator("expense_name")
    @classmethod
    def check_name_not_blank(cls, value: str) -> str:
        if not value or not value.strip():
            raise ValueError("Expense name cannot be empty or only spaces")
        return value.strip()

    @field_validator("category")
    @classmethod
    def validate_and_normalize_category(cls, value: str) -> str:
        if not value or not value.strip():
            raise ValueError("Category cannot be empty or only spaces")
        cleaned = value.strip().title()
        matched = next((c for c in EXPENSE_CATEGORIES if c.lower() == cleaned.lower()), None)
        if not matched:
            allowed = ", ".join(EXPENSE_CATEGORIES)
            raise ValueError(f"Invalid category '{value}'. Allowed categories: {allowed}")
        return matched


class ExpenseCreate(ExpenseBase):
    pass


class ExpenseUpdate(BaseModel):
    """
    Schema for updating an existing expense.
    Enforces non-null for required fields, non-blank names, valid categories, and non-negative amounts.
    """
    expense_name: Optional[str] = None
    category: Optional[str] = None
    amount: Optional[float] = Field(default=None, ge=0.0, description="Amount must be >= 0.0 if provided")
    expense_date: Optional[str] = None

    @model_validator(mode="before")
    @classmethod
    def check_required_fields_not_explicit_null(cls, data: Any) -> Any:
        if isinstance(data, dict):
            for field in ("expense_name", "category", "amount"):
                if field in data and data[field] is None:
                    raise ValueError(f"Field '{field}' cannot be null.")
        return data

    @field_validator("expense_name")
    @classmethod
    def check_name_not_blank(cls, value: Optional[str]) -> Optional[str]:
        if value is not None and not value.strip():
            raise ValueError("Expense name cannot be empty or only spaces")
        return value.strip() if value is not None else None

    @field_validator("category")
    @classmethod
    def validate_and_normalize_category(cls, value: Optional[str]) -> Optional[str]:
        if value is not None:
            if not value.strip():
                raise ValueError("Category cannot be empty or only spaces")
            cleaned = value.strip().title()
            matched = next((c for c in EXPENSE_CATEGORIES if c.lower() == cleaned.lower()), None)
            if not matched:
                allowed = ", ".join(EXPENSE_CATEGORIES)
                raise ValueError(f"Invalid category '{value}'. Allowed categories: {allowed}")
            return matched
        return None


class ExpenseResponse(ExpenseBase):
    id: int
    event_id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ============================================================================
# Budget Management & Calculation Schemas (Stage 4)
# ============================================================================

class BudgetSummaryResponse(BaseModel):
    """
    Summary calculation of planned budget vs actual expenses for an event.
    """
    event_id: int
    event_name: str
    currency: str = "INR"
    planned_budget: float
    total_expenses: float
    remaining_budget: float
    utilisation_percentage: float
    is_over_budget: bool
    warning_message: Optional[str] = None
    category_breakdown: Dict[str, float]


class ExpenseSplitRequest(BaseModel):
    """
    Input schema for equal expense-sharing calculation.
    """
    total_amount: float = Field(..., ge=0.0, description="Total expense amount in INR to divide (>= 0.0)")
    num_people: int = Field(..., gt=0, description="Number of contributing friends (must be > 0)")


class ExpenseSplitResponse(BaseModel):
    """
    Output schema for equal expense sharing.
    Clearly indicates whether the split basis is 'actual_expenses', 'planned_budget', or 'custom_amount'.
    """
    total_amount: float
    num_people: int
    share_per_person: float
    currency: str = "INR"
    split_basis: str = Field(default="actual_expenses", description="Basis for calculation: 'actual_expenses', 'planned_budget', or 'custom_amount'")
    explanation: str


# ============================================================================
# Task Schemas (Stage 5: Checklist & Timeline)
# ============================================================================

class TaskBase(BaseModel):
    """
    Base schema for event preparation tasks.
    """
    task_name: str = Field(..., min_length=1, description="Name or description of the task, e.g., Order Cake")
    description: Optional[str] = Field(default=None, description="Optional details or instructions")
    due_date: Optional[str] = Field(default=None, description="Due date in YYYY-MM-DD format (e.g., 2026-11-20)")
    is_completed: bool = Field(default=False, description="Completion status (True if task is completed)")

    @field_validator("task_name")
    @classmethod
    def check_name_not_blank(cls, value: str) -> str:
        if not value or not value.strip():
            raise ValueError("Task name cannot be empty or only spaces")
        return value.strip()

    @field_validator("due_date")
    @classmethod
    def validate_due_date_format(cls, value: Optional[str]) -> Optional[str]:
        if value is not None:
            if not value.strip():
                return None
            try:
                datetime.strptime(value.strip(), "%Y-%m-%d")
            except ValueError:
                raise ValueError("Due date must be in YYYY-MM-DD format (e.g., 2026-11-20)")
            return value.strip()
        return None


class TaskCreate(TaskBase):
    pass


class TaskUpdate(BaseModel):
    """
    Schema for updating an existing task.
    Rejects explicit null values for required fields (task_name, is_completed).
    """
    task_name: Optional[str] = None
    description: Optional[str] = None
    due_date: Optional[str] = None
    is_completed: Optional[bool] = None

    @model_validator(mode="before")
    @classmethod
    def check_required_fields_not_explicit_null(cls, data: Any) -> Any:
        if isinstance(data, dict):
            for field in ("task_name", "is_completed"):
                if field in data and data[field] is None:
                    raise ValueError(f"Field '{field}' cannot be null.")
        return data

    @field_validator("task_name")
    @classmethod
    def check_name_not_blank(cls, value: Optional[str]) -> Optional[str]:
        if value is not None and not value.strip():
            raise ValueError("Task name cannot be empty or only spaces")
        return value.strip() if value is not None else None

    @field_validator("due_date")
    @classmethod
    def validate_due_date_format(cls, value: Optional[str]) -> Optional[str]:
        if value is not None:
            if not value.strip():
                return None
            try:
                datetime.strptime(value.strip(), "%Y-%m-%d")
            except ValueError:
                raise ValueError("Due date must be in YYYY-MM-DD format (e.g., 2026-11-20)")
            return value.strip()
        return None


class TaskResponse(TaskBase):
    id: int
    event_id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class TaskSummaryResponse(BaseModel):
    """
    Summary calculation of checklist tasks and preparation progress.
    """
    event_id: int
    total_tasks: int
    completed_tasks: int
    pending_tasks: int
    overdue_tasks: int
    progress_percentage: float


# ============================================================================
# Suggestion Engine Schemas (Stage 6: Rule-Based Suggestions)
# ============================================================================

class BudgetAllocationItem(BaseModel):
    """
    Category-wise percentage and calculated monetary allocation.
    """
    category: str
    percentage: float
    allocated_amount: float


class SuggestionRequest(BaseModel):
    """
    Input schema for requesting event planning suggestions.
    """
    event_type: str = Field(..., min_length=1, description="Event type, e.g., Birthday, Picnic, Farewell")
    budget: float = Field(default=0.0, ge=0.0, description="Available budget in INR (must be >= 0.0)")
    guests: int = Field(default=0, ge=0, description="Expected guest count (must be >= 0)")
    celebration_style: str = Field(default="Casual", min_length=1, description="Style, e.g., Aesthetic, DIY / Budget-Friendly, Casual")

    @field_validator("event_type", "celebration_style")
    @classmethod
    def check_text_not_blank(cls, value: str) -> str:
        if not value or not value.strip():
            raise ValueError("Field cannot be empty or only spaces")
        return value.strip()


class SuggestionResponse(BaseModel):
    """
    Structured output returned by the rule-based suggestion engine.
    """
    event_type: str
    budget: float
    guests: int
    celebration_style: str
    budget_tier: str
    suggested_theme: str
    food_suggestions: List[str]
    decoration_suggestions: List[str]
    activity_suggestions: List[str]
    budget_allocations: List[BudgetAllocationItem]
    total_allocated_budget: float
    budget_saving_tips: List[str]
    disclaimer: str


# ============================================================================
# PopSpots Schemas (Real Local Hangout Discovery System & Google Places)
# ============================================================================

class SpotCategoryItem(BaseModel):
    id: str
    label: str
    icon: str
    description: str


class SpotReview(BaseModel):
    author_name: str
    author_photo_url: Optional[str] = None
    google_maps_profile_url: Optional[str] = None
    rating: Optional[float] = None
    relative_time: Optional[str] = None
    text: Optional[str] = None
    publish_time: Optional[str] = None


class SpotDishRecommendation(BaseModel):
    dish: str
    quote: str
    author: str


class SpotBase(BaseModel):
    id: str
    place_id: Optional[str] = None
    osm_id: Optional[str] = None
    osm_type: Optional[str] = None
    name: str
    category: str
    category_label: str
    latitude: float
    longitude: float
    address: Optional[str] = None
    distance_km: Optional[float] = None
    opening_hours: Optional[str] = None
    price_info: Optional[str] = "Price not available"
    rating: Optional[str] = "Not available"
    review_count: Optional[int] = None
    google_rating: Optional[float] = None
    rating_source: Optional[str] = "OpenStreetMap Community"
    vibe: Optional[str] = None
    occasion: Optional[str] = None
    source: Optional[str] = "openstreetmap"
    photo_name: Optional[str] = None
    photo_url: Optional[str] = None
    sector: Optional[str] = None
    description: Optional[str] = None
    price_level: Optional[str] = None
    data_origin: Optional[str] = "curated"
    is_cached: Optional[bool] = False
    website_uri: Optional[str] = None
    google_maps_uri: Optional[str] = None
    editorial_summary: Optional[str] = None
    reviews: Optional[List[SpotReview]] = None
    reviews_analyzed_count: Optional[int] = 0
    reviews_disclaimer: Optional[str] = None
    recommended_dishes: Optional[List[str]] = None
    dish_recommendation_quotes: Optional[List[SpotDishRecommendation]] = None
    positive_feedback_highlights: Optional[List[str]] = None
    common_complaints: Optional[List[str]] = None
    menu_status: Optional[str] = "unavailable"
    menu_disclaimer: Optional[str] = None
    photo_names: Optional[List[str]] = None
    tags: Optional[Dict[str, Any]] = None
    is_favorite: Optional[bool] = False

    model_config = ConfigDict(from_attributes=True)


class SpotSearchResponse(BaseModel):
    status: Optional[str] = "ok"
    message: Optional[str] = None
    query_location: str
    latitude: float
    longitude: float
    radius_km: float
    total_found: int
    page: Optional[int] = 1
    page_size: Optional[int] = 20
    total_pages: Optional[int] = 1
    has_more: Optional[bool] = False
    spots: List[SpotBase]


class FavoriteCreate(BaseModel):
    spot_id: str
    name: str
    category: str
    latitude: float
    longitude: float
    osm_id: Optional[str] = None
    osm_type: Optional[str] = None
    address: Optional[str] = None
    opening_hours: Optional[str] = None
    price_info: Optional[str] = None
    vibe: Optional[str] = None
    tags_json: Optional[str] = None
    user_id: Optional[str] = "guest"


class FavoriteResponse(BaseModel):
    id: int
    user_id: Optional[str] = "guest"
    spot_id: str
    name: str
    category: str
    latitude: float
    longitude: float
    address: Optional[str] = None
    opening_hours: Optional[str] = None
    price_info: Optional[str] = None
    vibe: Optional[str] = None
    saved_at: datetime

    model_config = ConfigDict(from_attributes=True)
