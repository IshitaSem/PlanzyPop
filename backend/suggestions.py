"""
PlanzyPop – Event Planning and Budget Management System
Academic Mini-Project for M.Sc. Computer Science (Data Science)

Stage 6: Rule-Based Event Suggestion Engine
This module implements a transparent, deterministic Rule-Based Expert System (Inference Engine)
that provides personalized, affordable celebration recommendations for students.

Viva Concept (Data Science & Expert Systems):
- Knowledge Base: Predefined domain facts regarding celebration styles, budget tiers, and category proportions.
- Rule Base: IF-THEN heuristic production rules mapping (Event Type, Budget, Guests, Style) to recommendations.
- Inference Engine: Forward-chaining evaluation that classifies inputs, resolves constraints,
  and synthesizes personalized themes, menus, DIY decor, activities, and budget allocations.
"""

from typing import Dict, List, Any



TIER_ZERO = "Zero Budget / Free Celebration"
TIER_VERY_LOW = "Very Low Budget (Under ₹1,500)"
TIER_LOW = "Low Budget (₹1,500 – ₹4,000)"
TIER_MODERATE = "Moderate Budget (₹4,000 – ₹10,000)"
TIER_HIGH = "Higher Budget (Above ₹10,000)"

# Budget Allocation Ratios per Event Type (Each set must sum to 100%)
CATEGORY_ALLOCATION_RULES: Dict[str, Dict[str, float]] = {
    "birthday": {
        "Food": 40.0,
        "Cake / Gifts": 25.0,
        "Decorations": 15.0,
        "Entertainment": 10.0,
        "Miscellaneous": 10.0
    },
    "college party": {
        "Food": 45.0,
        "Entertainment": 25.0,
        "Decorations": 15.0,
        "Cake / Gifts": 5.0,
        "Miscellaneous": 10.0
    },
    "farewell": {
        "Food": 40.0,
        "Cake / Gifts": 25.0,  # Mementos, personalized farewell gifts
        "Decorations": 15.0,
        "Entertainment": 10.0,
        "Miscellaneous": 10.0
    },
    "picnic": {
        "Food": 55.0,
        "Entertainment": 20.0,  # Outdoor games, frisbees, bluetooth speaker
        "Decorations": 5.0,    # Minimal outdoor mat setup
        "Cake / Gifts": 5.0,
        "Miscellaneous": 15.0  # Travel, park entry, ice
    },
    "hostel party": {
        "Food": 50.0,
        "Decorations": 15.0,
        "Entertainment": 15.0,
        "Cake / Gifts": 10.0,
        "Miscellaneous": 10.0
    },
    "get-together": {
        "Food": 50.0,
        "Entertainment": 20.0,
        "Decorations": 10.0,
        "Cake / Gifts": 10.0,
        "Miscellaneous": 10.0
    },
    "other": {
        "Food": 45.0,
        "Decorations": 20.0,
        "Entertainment": 15.0,
        "Cake / Gifts": 10.0,
        "Miscellaneous": 10.0
    }
}



def normalize_event_type(raw_type: str) -> str:
    """
    Normalizes user input to recognized canonical event types.
    """
    cleaned = raw_type.strip().lower()
    if "birth" in cleaned:
        return "birthday"
    elif "college" in cleaned or "fresh" in cleaned or "fest" in cleaned:
        return "college party"
    elif "farewell" in cleaned or "goodbye" in cleaned:
        return "farewell"
    elif "picnic" in cleaned or "outdoor" in cleaned:
        return "picnic"
    elif "hostel" in cleaned or "dorm" in cleaned:
        return "hostel party"
    elif "together" in cleaned or "meet" in cleaned or "reunion" in cleaned:
        return "get-together"
    return "other"


def normalize_style(raw_style: str) -> str:
    """
    Normalizes celebration style to canonical categories.
    """
    cleaned = raw_style.strip().lower()
    if "aesth" in cleaned:
        return "aesthetic"
    elif "diy" in cleaned or "budget" in cleaned:
        return "diy / budget-friendly"
    elif "trad" in cleaned or "ethnic" in cleaned:
        return "traditional"
    elif "fun" in cleaned or "party" in cleaned or "dj" in cleaned:
        return "fun / party"
    return "casual"


def classify_budget_tier(budget: float) -> str:
    """
    Classifies available monetary budget into standardized student tiers.
    """
    if budget <= 0.0:
        return TIER_ZERO
    elif budget <= 1500.0:
        return TIER_VERY_LOW
    elif budget <= 4000.0:
        return TIER_LOW
    elif budget <= 10000.0:
        return TIER_MODERATE
    else:
        return TIER_HIGH



def compute_budget_allocation(event_type_key: str, budget: float) -> List[Dict[str, Any]]:
    """
    Calculates exact category allocation from predefined weight ratios.
    Enforces exact rounding so that sum(allocations) == budget without discrepancies.
    """
    ratios = CATEGORY_ALLOCATION_RULES.get(event_type_key, CATEGORY_ALLOCATION_RULES["other"])
    allocations = []
    accumulated_amount = 0.0

    if budget <= 0.0:
        for category, pct in ratios.items():
            allocations.append({
                "category": category,
                "percentage": pct,
                "allocated_amount": 0.0
            })
        return allocations

    for category, pct in ratios.items():
        amount = round(budget * (pct / 100.0), 2)
        allocations.append({
            "category": category,
            "percentage": pct,
            "allocated_amount": amount
        })
        accumulated_amount = round(accumulated_amount + amount, 2)

    # Rounding compensation: reconcile floating-point rounding difference with the primary category
    diff = round(budget - accumulated_amount, 2)
    if diff != 0.0 and allocations:
        # Add residual paisa/cents to the largest allocation category (usually Food)
        allocations[0]["allocated_amount"] = round(allocations[0]["allocated_amount"] + diff, 2)

    return allocations



def generate_event_suggestions(
    event_type: str,
    budget: float,
    guests: int,
    celebration_style: str
) -> Dict[str, Any]:
    """
    Main Rule-Based Suggestion Pipeline.
    Synthesizes tailored student celebration suggestions using forward-chaining rules.
    """
    event_key = normalize_event_type(event_type)
    style_key = normalize_style(celebration_style)
    budget_tier = classify_budget_tier(budget)

    theme = _rule_theme(event_key, style_key, budget_tier)

    food = _rule_food(event_key, style_key, budget_tier, guests)

    decorations = _rule_decorations(event_key, style_key, budget_tier)

    activities = _rule_activities(event_key, style_key, guests)

    allocations = compute_budget_allocation(event_key, budget)
    total_allocated = round(sum(item["allocated_amount"] for item in allocations), 2)

    saving_tips = _rule_budget_tips(budget_tier, guests, event_key)

    disclaimer = (
        "These are rule-based student planning estimates and practical recommendations. "
        "Actual costs may vary based on local store prices, group sizes, and DIY effort."
    )

    return {
        "event_type": event_type.strip(),
        "budget": round(budget, 2),
        "guests": guests,
        "celebration_style": celebration_style.strip(),
        "budget_tier": budget_tier,
        "suggested_theme": theme,
        "food_suggestions": food,
        "decoration_suggestions": decorations,
        "activity_suggestions": activities,
        "budget_allocations": allocations,
        "total_allocated_budget": total_allocated,
        "budget_saving_tips": saving_tips,
        "disclaimer": disclaimer
    }



def _rule_theme(event_key: str, style_key: str, tier: str) -> str:
    """Selects an affordable, stylish event theme based on event type, style, and budget."""
    if tier == TIER_ZERO:
        return "DIY Zero-Cost Friendship Hangout & Memory Celebration"

    if event_key == "birthday":
        if style_key == "aesthetic":
            return "Pastel Balloons & Fairy-Light Polaroid Photo Vibe"
        elif style_key == "diy / budget-friendly":
            return "Handmade Paper Crafts, Origami & Hostel Room Glow"
        elif style_key == "traditional":
            return "Ethnic Celebration with Floral Accents & Classic Sweets"
        elif style_key == "fun / party":
            return "Retro Disco Karaoke & Glow-Stick Party"
        return "Cozy Birthday Gathering with Friends & Cake"

    elif event_key == "college party":
        if style_key == "fun / party":
            return "College Beats & Neon Street Glow Jam"
        elif style_key == "aesthetic":
            return "Minimalist Sunset Acoustic & Chai Lounge"
        return "Campus Activity Hall Friendly Social & Games"

    elif event_key == "farewell":
        return "Nostalgia Corner: Memory Photo Wall & Senior Tributes"

    elif event_key == "picnic":
        return "Sunny Green Park Mat Setup with Board Games & Acoustic Jams"

    elif event_key == "hostel party":
        return "Hostel Corridor Lights, Floor Cushions & Midnight Maggi Vibe"

    elif event_key == "get-together":
        return "Casual Potluck, Board Games & Living Room Catch-Up"

    return "Affordable Everyday Celebration with Close Friends"


def _rule_food(event_key: str, style_key: str, tier: str, guests: int) -> List[str]:
    """Generates food items considering budget tier, event type, and guest scaling."""
    food_list = []

    if tier == TIER_ZERO:
        return [
            "Potluck style: Each friend brings one homemade snack or finger food",
            "Homemade lemonade / iced tea station",
            "Sharing favorite hostel snacks or homemade cookies"
        ]

    if tier == TIER_VERY_LOW:
        food_list.append("Affordable local samosas, kachoris, or aloo patties")
        food_list.append("Homemade popcorn, spiced chips, and mixed biscuits")
        food_list.append("Refreshing Rooh Afza, cold drinks, or homemade iced tea")
        if event_key == "birthday":
            food_list.append("Budget-friendly local bakery sponge cake or cupcakes")
        elif event_key == "hostel party":
            food_list.append("Late-night customized Maggi noodles bar with toppings")

    elif tier == TIER_LOW:
        food_list.append("Pani Puri / Chaat DIY DIY table or sandwich platter")
        food_list.append("Spring rolls, crispy fries, and dips")
        food_list.append("Chilled soft drinks and fruit mocktails")
        if event_key == "birthday":
            food_list.append("1kg personalized chocolate truffle cake from a local bakery")
        elif event_key == "picnic":
            food_list.append("Easy-to-pack veg club sandwiches, fruit skewers, and juice boxes")

    else:
        food_list.append("Mini burger sliders, pizza slices, or momos platter")
        food_list.append("Paneer tikka skewers, loaded nachos with cheese salsa")
        food_list.append("Artisanal mocktails and iced coolers")
        if event_key == "birthday":
            food_list.append("Premium designer custom birthday cake (chocolate/red velvet)")
        elif event_key == "college party":
            food_list.append("Bulk biryani combo or buffet snack combo boxes")

    if guests > 15:
        food_list.append(f"Pro-tip for {guests} guests: Order finger-food combos in bulk to reduce cost per head")

    return food_list


def _rule_decorations(event_key: str, style_key: str, tier: str) -> List[str]:
    """Recommends realistic, low-cost decor matching style and budget."""
    if tier == TIER_ZERO:
        return [
            "Use fairy lights borrowed from friends' hostel rooms",
            "Printed photos pinned on strings using wooden clips",
            "Handmade paper bunting and chalkboard welcome messages"
        ]

    decor = []
    if style_key == "aesthetic":
        decor.extend([
            "Warm-white fairy lights draped across walls or curtains",
            "Polaroid photos clipped to twine string as a memory wall",
            "Pastel balloon cluster (peach, lavender, cream) in one focal corner"
        ])
    elif style_key == "diy / budget-friendly":
        decor.extend([
            "DIY origami cranes and paper tassels made with craft sheets",
            "Repurposed glass bottles with fairy lights or wildflowers inside",
            "Handwritten milestone banners and colorful paper ribbons"
        ])
    elif style_key == "traditional":
        decor.extend([
            "Fresh marigold flower torans and brass diya/candle holders",
            "Traditional rangoli design at the entrance with vibrant colors",
            "Bright yellow and orange dupattas used as elegant drapes"
        ])
    else:  # casual or fun/party
        decor.extend([
            "Metallic foil fringe backdrop for selfies and photo ops",
            "Dual-color balloon arch or wall bunches (e.g. blue and silver)",
            "Festive party banners ('Celebrate', 'Happy Birthday' or 'Cheers')"
        ])

    if event_key == "farewell":
        decor.append("Interactive 'Wall of Memories' where juniors write heartfelt sticky notes")
    elif event_key == "picnic":
        decor.append("Aesthetic checkered picnic mat with floor cushions and a wicker basket")

    return decor


def _rule_activities(event_key: str, style_key: str, guests: int) -> List[str]:
    """Generates engaging, zero-equipment or low-cost activities."""
    activities = []

    if event_key == "birthday":
        activities.extend([
            "Cake cutting countdown with party poppers and birthday anthem",
            "Trivia quiz: 'How well do you really know the birthday star?'",
            "Blindfolded cake feeding or gift-unwrapping challenge"
        ])
    elif event_key == "farewell":
        activities.extend([
            "Senior spotlight: 2-minute memory roast and video tribute montage",
            "Passing around a signature scrapbook / farewell t-shirt signing",
            "Best Title Awards (e.g., 'Most Likely to Sleep in Class')"
        ])
    elif event_key == "picnic":
        activities.extend([
            "Frisbee toss, badminton rally, or mini box-cricket match",
            "Acoustic guitar sing-along and group dumb charades",
            "Nature walk and candid photography golden-hour session"
        ])
    elif event_key == "college party" or event_key == "hostel party":
        activities.extend([
            "Curated Spotify collaborative playlist with hostel dance face-offs",
            "Mafia or Undercover card game (engaging for large groups)",
            "Rapid fire party dares and dumb charades"
        ])
    else:  # get-together / other
        activities.extend([
            "Board games marathon (Monopoly, Uno, Codenames, or Jenga)",
            "Guess the throwback photos from college days",
            "Storytelling circle and relaxed conversation session"
        ])

    if guests > 20:
        activities.append("Divide guests into two teams for high-energy relay or quiz battles")

    return activities


def _rule_budget_tips(tier: str, guests: int, event_key: str) -> List[str]:
    """Provides actionable financial saving tips suited for college students."""
    tips = [
        "Host at home, a hostel terrace, or a free public park to avoid venue rental fees."
    ]

    if tier in (TIER_ZERO, TIER_VERY_LOW, TIER_LOW):
        tips.append("Opt for DIY balloon arches and fairy lights rather than hiring event planners.")
        tips.append("Purchase snacks, chips, and drinks in bulk wholesale packs instead of single retail cans.")

    if guests > 10:
        tips.append(f"Split non-perishable costs (lights, games, decor) equally among {guests} friends.")

    if event_key == "birthday":
        tips.append("Pre-order your cake from a local neighborhood bakery rather than expensive online portals.")
    elif event_key == "picnic":
        tips.append("Carry refillable water flasks and homemade snacks to cut food expenses in half.")

    tips.append("Keep the focus on music, photos, and laughs—shared memories matter more than luxury spending!")
    return tips
