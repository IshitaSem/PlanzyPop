"""
PlanzyPop - AI Planner & AI Chat Assistant Router
Provides AI celebration planning, structured concept generation, and party advice endpoints.
Academic Mini-Project for M.Sc. Computer Science (Data Science)
"""

from typing import Optional, List, Dict, Any
from fastapi import APIRouter
from pydantic import BaseModel, Field

from suggestions import generate_event_suggestions

router = APIRouter(prefix="/api", tags=["AI Planner & Chat"])



class BudgetAllocationItem(BaseModel):
    category: str
    amount: float
    percentage: float


class TimelinePhase(BaseModel):
    phase: str
    items: List[str]


class ChecklistItem(BaseModel):
    id: int
    title: str
    category: str
    isDone: bool = False


class PlanRequest(BaseModel):
    eventName: str = Field(..., max_length=150, min_length=1, description="Name of the celebration")
    eventType: str = Field(..., max_length=100, min_length=1, description="Type of event")
    date: Optional[str] = Field("2026-05-15", description="Target celebration date (YYYY-MM-DD)")
    location: Optional[str] = Field("Jaipur, Rajasthan", description="City or venue name")
    guests: int = Field(..., ge=1, le=100000, description="Expected guest count")
    budgetInr: int = Field(..., ge=0, description="Total budget in INR")
    celebrationStyle: Optional[str] = Field("Warm & intimate", description="Style mood or vibe")
    setting: Optional[str] = Field("Outdoor", description="Outdoor, Indoor, or Open to either")
    dietaryPreferences: Optional[Any] = Field("Mixed menu", description="Dietary preferences")
    mainPriority: Optional[str] = Field("Guest experience", description="Primary focus")
    preferences: Optional[List[str]] = Field(None, description="Additional custom preference tags")


class PlanResponse(BaseModel):
    conceptTitle: str
    conceptDescription: str
    vibe: str
    colorPalette: List[str]
    budgetAllocation: List[BudgetAllocationItem]
    preparationTimeline: List[TimelinePhase]
    checklist: List[ChecklistItem]
    menuIdeas: List[str]
    vendorCategories: List[str]
    costSavingSuggestions: List[str]
    isDemo: bool = False
    source: str = "planzy_engine"
    errorMessage: Optional[str] = None



class ChatRequest(BaseModel):
    message: str = Field(..., max_length=2000, min_length=1, description="User question or request")
    eventId: Optional[int] = Field(None, description="Associated event ID")
    eventContext: Optional[Dict[str, Any]] = Field(None, description="Context about the event")


class ChatResponse(BaseModel):
    response: str
    suggestions: List[str] = []
    isDemo: bool = False
    source: str = "planzy_assistant"
    errorMessage: Optional[str] = None



@router.post(
    "/plan",
    response_model=PlanResponse,
    summary="Generate structured celebration plan"
)
def generate_ai_plan(req: PlanRequest):
    """
    Synthesizes a structured celebration plan including vibe, color palette,
    budget allocations, checklist items, and timeline phases.
    """
    raw_suggestions = generate_event_suggestions(
        event_type=req.eventType,
        budget=float(req.budgetInr),
        guests=req.guests,
        celebration_style=req.celebrationStyle or "Casual"
    )

    budget_allocations = [
        BudgetAllocationItem(
            category=item["category"],
            amount=item["allocated_amount"],
            percentage=item["percentage"]
        )
        for item in raw_suggestions.get("budget_allocations", [])
    ]

    palette_map = {
        "birthday": ["#EC4899", "#F43F5E", "#FB7185", "#FDA4AF"],
        "college party": ["#8B5CF6", "#A855F7", "#D946EF", "#EC4899"],
        "farewell": ["#3B82F6", "#60A5FA", "#93C5FD", "#BFDBFE"],
        "hostel party": ["#F59E0B", "#FBBF24", "#FCD34D", "#FDE68A"],
    }
    palette = palette_map.get(
        req.eventType.lower().strip(),
        ["#EC4899", "#A855F7", "#3B82F6", "#10B981"]
    )

    checklist_items: List[ChecklistItem] = []
    c_id = 1
    for dec in raw_suggestions.get("decoration_suggestions", [])[:3]:
        checklist_items.append(ChecklistItem(id=c_id, title=f"Decor: {dec}", category="Decorations"))
        c_id += 1
    for food in raw_suggestions.get("food_suggestions", [])[:2]:
        checklist_items.append(ChecklistItem(id=c_id, title=f"Catering: {food}", category="Food"))
        c_id += 1
    for act in raw_suggestions.get("activity_suggestions", [])[:2]:
        checklist_items.append(ChecklistItem(id=c_id, title=f"Activity: {act}", category="Entertainment"))
        c_id += 1

    timeline = [
        TimelinePhase(
            phase="Phase 1: 2 Weeks Prior",
            items=[
                f"Confirm guest count ({req.guests} guests) and ₹{req.budgetInr:,.0f} budget cap",
                f"Finalize event venue or spot near {req.location or 'Chandigarh'}"
            ]
        ),
        TimelinePhase(
            phase="Phase 2: 1 Week Prior",
            items=[
                "Order customized cake and finalize party menu items",
                "Assign volunteer tasks among friends and prepare shared playlist"
            ]
        ),
        TimelinePhase(
            phase="Phase 3: Day of Celebration",
            items=[
                "Set up ambient lighting, banners, and sound gear",
                "Pick up fresh bakery orders and welcome guests"
            ]
        )
    ]

    return PlanResponse(
        conceptTitle=raw_suggestions.get("suggested_theme") or f"{req.eventName} Celebration",
        conceptDescription=(
            f"Tailored {req.eventType} plan for '{req.eventName}' hosting {req.guests} guests "
            f"with an optimized budget of ₹{req.budgetInr:,.0f}."
        ),
        vibe=req.celebrationStyle or "Festive & Vibrant",
        colorPalette=palette,
        budgetAllocation=budget_allocations,
        preparationTimeline=timeline,
        checklist=checklist_items,
        menuIdeas=raw_suggestions.get("food_suggestions", []),
        vendorCategories=["Bakery & Cake", "Snacks & Refreshments", "DIY Decorations", "Sound & Lighting"],
        costSavingSuggestions=raw_suggestions.get("budget_saving_tips", []),
        isDemo=False,
        source="planzy_engine"
    )


@router.post(
    "/chat",
    response_model=ChatResponse,
    summary="Chat with PlanzyPop Event Planning Assistant"
)
def chat_with_assistant(req: ChatRequest):
    """
    Provides interactive conversational party-planning suggestions and budget advice.
    """
    msg = req.message.lower().strip()
    event_context = req.eventContext or {}
    event_name = event_context.get("name", "your celebration")
    budget = event_context.get("budget", 5000)

    if any(k in msg for k in ["budget", "cost", "money", "split", "expensive"]):
        reply = (
            f"For {event_name}, allocating your budget across clear buckets prevents surprise deficits. "
            f"We recommend earmarking roughly 40% for food, 20% for cake, 15% for decor, and keeping 10% as emergency buffer. "
            f"You can also use our 'Split Expenses' feature under the My Budget tab to split shared costs equally!"
        )
        suggestions = [
            "How do I split expenses with 5 friends?",
            "What are the best low-budget decor hacks?",
            "Find budget-friendly cafes nearby"
        ]
    elif any(k in msg for k in ["food", "cake", "menu", "snack", "drink", "eat"]):
        reply = (
            f"For student celebrations, finger foods (sliders, momos, spring rolls, samosas) deliver great satisfaction at "
            f"reasonable cost without needing sit-down service. Order cakes from local neighborhood bakeries directly rather "
            f"than delivery aggregators to save 20-30%!"
        )
        suggestions = [
            "Suggest affordable cake options",
            "What finger foods work best for 15 people?",
            "How much drink cartons should I buy?"
        ]
    elif any(k in msg for k in ["spot", "cafe", "place", "venue", "hangout", "where"]):
        reply = (
            f"You can explore verified student hangouts and cafes directly in the 'Explore Spots' tab! "
            f"Filter by Sector or Vibe (Cozy, Aesthetic, Lively) to find student-friendly spots in Chandigarh."
        )
        suggestions = [
            "Show cafes in Sector 35",
            "Find aesthetic birthday spots",
            "Check outdoor hangout places"
        ]
    else:
        reply = (
            f"Hey there! I'm your PlanzyPop AI Assistant. I can help you plan themes, draft preparation checklists, "
            f"break down spending for {event_name}, or discover local hangout spots in Chandigarh. What's on your mind?"
        )
        suggestions = [
            "Generate a theme for my party",
            "Help me plan a ₹3,000 budget",
            "Explore spots in Chandigarh"
        ]

    return ChatResponse(
        response=reply,
        suggestions=suggestions,
        isDemo=False,
        source="planzy_assistant"
    )
