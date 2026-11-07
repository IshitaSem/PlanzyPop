"""
PlanzyPop - Rule-Based Suggestions Router
Handles rule-based event theme, menu, decor, and budget allocation synthesis.
Academic Mini-Project for M.Sc. Computer Science (Data Science)
"""

from fastapi import APIRouter
import schemas
from suggestions import generate_event_suggestions

router = APIRouter(tags=["Suggestions Engine"])


@router.post(
    "/suggestions/generate",
    response_model=schemas.SuggestionResponse,
    summary="Synthesize rule-based celebration recommendations"
)
def get_event_suggestions(request: schemas.SuggestionRequest):
    """
    GENERATE RULE-BASED EVENT SUGGESTIONS:
    - Synthesizes personalized themes, menus, DIY decor, activities, and budget allocations.
    - Purely rule-based heuristic inference without external paid APIs or database writes.
    - Handles zero-budget, varying guest counts, and diverse celebration styles.
    """
    suggestions = generate_event_suggestions(
        event_type=request.event_type,
        budget=request.budget,
        guests=request.guests,
        celebration_style=request.celebration_style
    )
    return suggestions
