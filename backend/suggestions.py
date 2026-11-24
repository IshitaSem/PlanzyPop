"""
PlanzyPop – Event Planning and Budget Management System
Academic Mini-Project for M.Sc. Computer Science (Data Science)

Stage 6: Rule-Based Event Suggestion Engine & Validated Budget Heuristics
This module implements a transparent, deterministic Rule-Based Expert System (Inference Engine)
that provides personalized, affordable celebration recommendations for students.

Viva Concept (Data Science & Expert Systems):
- Knowledge Base: Predefined domain facts regarding celebration styles, budget tiers, and category proportions.
- Rule Base: IF-THEN heuristic production rules mapping (Event Type, Budget, Guests, Style, Setting, Dietary) to recommendations.
- Inference Engine: Forward-chaining evaluation that classifies inputs, resolves constraints,
  and synthesizes personalized themes, menus, DIY decor, activities, and budget allocations.
- Mathematical Consistency Guarantee:
  Total Estimated Expense = sum(Category Expenses) <= Target Budget
  Remaining Cushion = Target Budget - Estimated Expense >= 0
  Per-Guest Cost = Estimated Expense / max(1, Guests)
"""

from typing import Dict, List, Any, Optional


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
    cleaned = (raw_type or "").strip().lower()
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
    cleaned = (raw_style or "").strip().lower()
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


def generate_synchronized_shopping_items(
    budget: float,
    guests: int,
    allocations: List[Dict[str, Any]],
    event_key: str,
    tier: str,
    dietary_preference: Optional[str] = None
) -> List[Dict[str, Any]]:
    """
    Generates itemized shopping items whose category sums exactly match the category allocations.
    Guarantees that:
    1. Food items sum to Food allocation.
    2. Cake items sum to Cake / Gifts allocation.
    3. Decor items sum to Decorations allocation.
    4. Activity items sum to Entertainment allocation.
    5. Supplies/Misc items sum to Miscellaneous allocation.
    6. Overall sum of shopping items == total_allocated_budget <= budget.
    """
    if budget <= 0.0:
        return []

    alloc_map = {a["category"]: a["allocated_amount"] for a in allocations}
    items: List[Dict[str, Any]] = []
    item_id = 1

    diet = (dietary_preference or "").lower().strip()
    is_veg = "veg" in diet and "non" not in diet and "mix" not in diet

    # 1. Food items
    food_total = alloc_map.get("Food", 0.0)
    if food_total > 0:
        if guests == 1:
            snack_cost = round(food_total * 0.65)
            drink_cost = round(food_total - snack_cost, 2)
            items.append({
                "id": f"s-{item_id}",
                "name": "Personal veg samosa / patty & snack platter" if is_veg else "Personal savory snack platter & dip",
                "category": "Food",
                "quantity": "1 platter",
                "cost": snack_cost,
                "completed": False
            })
            item_id += 1
            items.append({
                "id": f"s-{item_id}",
                "name": "Chilled beverage / iced tea",
                "category": "Food",
                "quantity": "1 bottle",
                "cost": drink_cost,
                "completed": False
            })
            item_id += 1
        else:
            snack_cost = round(food_total * 0.65)
            drink_cost = round(food_total - snack_cost, 2)
            items.append({
                "id": f"s-{item_id}",
                "name": "Crowd-favorite savory snack platters" if is_veg else "Party finger foods & snack platters",
                "category": "Food",
                "quantity": f"{max(1, round(guests / 4))} platters",
                "cost": snack_cost,
                "completed": False
            })
            item_id += 1
            items.append({
                "id": f"s-{item_id}",
                "name": "Beverages & refreshment cartons",
                "category": "Food",
                "quantity": f"{max(2, round(guests / 3))} cartons",
                "cost": drink_cost,
                "completed": False
            })
            item_id += 1

    # 2. Cake / Gifts items
    cake_total = alloc_map.get("Cake / Gifts", 0.0)
    if cake_total > 0:
        if event_key == "birthday":
            if guests == 1:
                cake_cost = round(cake_total * 0.80)
                prop_cost = round(cake_total - cake_cost, 2)
                items.append({
                    "id": f"s-{item_id}",
                    "name": "Single mini celebration bento cake (250g)",
                    "category": "Cake",
                    "quantity": "1 mini cake",
                    "cost": cake_cost,
                    "completed": False
                })
                item_id += 1
                items.append({
                    "id": f"s-{item_id}",
                    "name": "Celebration birthday candle & greeting card",
                    "category": "Cake",
                    "quantity": "1 set",
                    "cost": prop_cost,
                    "completed": True
                })
                item_id += 1
            else:
                cake_cost = round(cake_total * 0.80)
                prop_cost = round(cake_total - cake_cost, 2)
                cake_weight = "500g" if guests <= 5 else ("1.2 kg" if guests <= 15 else "2.0 kg")
                items.append({
                    "id": f"s-{item_id}",
                    "name": f"Bakery celebration cake ({cake_weight})",
                    "category": "Cake",
                    "quantity": "1 cake",
                    "cost": cake_cost,
                    "completed": False
                })
                item_id += 1
                items.append({
                    "id": f"s-{item_id}",
                    "name": "Party candles & celebration sparklers",
                    "category": "Cake",
                    "quantity": "1 pack",
                    "cost": prop_cost,
                    "completed": True
                })
                item_id += 1
        else:
            gift_cost = round(cake_total * 0.80)
            wrap_cost = round(cake_total - gift_cost, 2)
            items.append({
                "id": f"s-{item_id}",
                "name": "Celebration dessert / memento tribute gift",
                "category": "Cake",
                "quantity": "1 set",
                "cost": gift_cost,
                "completed": False
            })
            item_id += 1
            items.append({
                "id": f"s-{item_id}",
                "name": "Gift packaging & greeting card",
                "category": "Cake",
                "quantity": "1 set",
                "cost": wrap_cost,
                "completed": True
            })
            item_id += 1

    # 3. Decorations items
    decor_total = alloc_map.get("Decorations", 0.0)
    if decor_total > 0:
        balloon_cost = round(decor_total * 0.50)
        diy_cost = round(decor_total - balloon_cost, 2)
        balloon_count = "15 pcs" if guests == 1 else ("30 pcs" if guests <= 10 else "50 pcs")
        items.append({
            "id": f"s-{item_id}",
            "name": f"Pastel celebration balloons ({balloon_count})",
            "category": "Decor",
            "quantity": "1 pack",
            "cost": balloon_cost,
            "completed": True
        })
        item_id += 1
        items.append({
            "id": f"s-{item_id}",
            "name": "Crepe paper streamer rolls & fairy lights",
            "category": "Decor",
            "quantity": "1 kit",
            "cost": diy_cost,
            "completed": False
        })
        item_id += 1

    # 4. Activities / Entertainment items
    act_total = alloc_map.get("Entertainment", 0.0)
    if act_total > 0:
        items.append({
            "id": f"s-{item_id}",
            "name": "Solo celebration photo prints & playlist setup" if guests == 1 else "Party games kit, quiz printouts & speaker props",
            "category": "Activities",
            "quantity": "1 kit",
            "cost": act_total,
            "completed": False
        })
        item_id += 1

    # 5. Supplies / Miscellaneous items
    misc_total = alloc_map.get("Miscellaneous", 0.0)
    if misc_total > 0:
        supplies_cost = round(misc_total * 0.60)
        buffer_cost = round(misc_total - supplies_cost, 2)
        items.append({
            "id": f"s-{item_id}",
            "name": "Eco-friendly plates, cups & party napkins",
            "category": "Supplies",
            "quantity": f"{max(1, guests)} sets",
            "cost": supplies_cost,
            "completed": True
        })
        item_id += 1
        if buffer_cost > 0:
            items.append({
                "id": f"s-{item_id}",
                "name": "Safety reserve cushion for unexpected essentials",
                "category": "Supplies",
                "quantity": "1 reserve",
                "cost": buffer_cost,
                "completed": False
            })
            item_id += 1

    return items


def validate_celebration_plan(plan_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Centralized validation engine:
    1. Budget constraint: total estimated expense never exceeds selected budget.
    2. Category allocations: sum of allocations equals total allocated budget without rounding drift.
    3. Per-guest estimates: accurate division (estimated_total / max(1, guests)).
    4. Guest count consistency: when guests == 1, rejects incompatible large-group games/quantities.
    5. Missing/invalid values: safe fallbacks for missing lists or null fields.
    """
    budget = float(plan_data.get("budget", 0.0))
    if budget < 0.0:
        raise ValueError("Budget cannot be negative")

    total_alloc = float(plan_data.get("total_allocated_budget", 0.0))
    if total_alloc > budget + 0.01:
        raise ValueError(f"Total allocated budget (₹{total_alloc}) exceeds target budget (₹{budget})")

    allocations = plan_data.get("budget_allocations", [])
    if not isinstance(allocations, list):
        raise ValueError("budget_allocations must be a list")

    if budget > 0.0:
        sum_alloc = round(sum(a.get("allocated_amount", 0.0) for a in allocations), 2)
        if abs(sum_alloc - total_alloc) > 0.05:
            raise ValueError(f"Sum of allocations (₹{sum_alloc}) does not match total allocated budget (₹{total_alloc})")

    guests = int(plan_data.get("guests", 1))
    if guests < 0:
        raise ValueError("Guest count cannot be negative")

    # Guest count consistency check
    if guests == 1:
        for act in plan_data.get("activity_suggestions", []):
            act_l = act.lower()
            if "10–25" in act_l or "10-25" in act_l or "two teams" in act_l or "large groups" in act_l:
                raise ValueError(f"Activity recommendation '{act}' is incompatible with single guest count")

    # Safe defaults for missing/invalid fields
    for list_key in ("food_suggestions", "decoration_suggestions", "activity_suggestions", "budget_saving_tips"):
        val = plan_data.get(list_key)
        if not val or not isinstance(val, list):
            plan_data[list_key] = ["PlanzyPop curated recommendation"]

    if not plan_data.get("suggested_theme"):
        plan_data["suggested_theme"] = "Affordable Celebration with Friends"

    return plan_data


def generate_event_suggestions(
    event_type: str,
    budget: float,
    guests: int,
    celebration_style: str = "Casual",
    location: Optional[str] = None,
    dietary_preference: Optional[str] = None,
    setting: Optional[str] = None,
    notes: Optional[str] = None
) -> Dict[str, Any]:
    """
    Main Rule-Based Suggestion Pipeline.
    Synthesizes tailored student celebration suggestions using forward-chaining rules.
    Respects budget constraints, guest counts, dietary choices, and settings.
    """
    safe_budget = max(0.0, float(budget)) if budget is not None else 0.0
    safe_guests = max(0, int(guests)) if guests is not None else 1
    safe_event_type = event_type.strip() if event_type and event_type.strip() else "Celebration"
    safe_style = celebration_style.strip() if celebration_style and celebration_style.strip() else "Casual"

    event_key = normalize_event_type(safe_event_type)
    style_key = normalize_style(safe_style)
    budget_tier = classify_budget_tier(safe_budget)

    theme = _rule_theme(event_key, style_key, budget_tier, setting)
    food = _rule_food(event_key, style_key, budget_tier, safe_guests, dietary_preference, setting)
    decorations = _rule_decorations(event_key, style_key, budget_tier, setting)
    activities = _rule_activities(event_key, style_key, safe_guests, setting)

    allocations = compute_budget_allocation(event_key, safe_budget)
    total_allocated = round(sum(item["allocated_amount"] for item in allocations), 2)

    saving_tips = _rule_budget_tips(budget_tier, safe_guests, event_key)

    disclaimer = (
        "These are rule-based student planning estimates and practical recommendations. "
        "Actual costs may vary based on local store prices, group sizes, and DIY effort."
    )

    # Generate synchronized shopping items & category estimates
    shopping_items = generate_synchronized_shopping_items(
        safe_budget,
        safe_guests,
        allocations,
        event_key,
        budget_tier,
        dietary_preference
    )

    category_estimates = {a["category"]: a["allocated_amount"] for a in allocations}

    # Safety buffer calculation
    # If budget > 0, reserve part of Miscellaneous as safety buffer (e.g. 5-10% of total)
    misc_alloc = category_estimates.get("Miscellaneous", 0.0)
    safety_buffer = round(misc_alloc * 0.5, 2) if safe_budget > 0 else 0.0
    estimated_expense = round(total_allocated - safety_buffer, 2) if safe_budget > 0 else 0.0
    per_guest_cost = round(estimated_expense / max(1, safe_guests), 2) if safe_budget > 0 else 0.0

    raw_plan: Dict[str, Any] = {
        "event_type": safe_event_type,
        "budget": round(safe_budget, 2),
        "guests": safe_guests,
        "celebration_style": safe_style,
        "budget_tier": budget_tier,
        "suggested_theme": theme,
        "food_suggestions": food,
        "decoration_suggestions": decorations,
        "activity_suggestions": activities,
        "budget_allocations": allocations,
        "total_allocated_budget": total_allocated,
        "budget_saving_tips": saving_tips,
        "disclaimer": disclaimer,
        "target_budget": round(safe_budget, 2),
        "estimated_expense": estimated_expense,
        "safety_buffer": safety_buffer,
        "per_guest_cost": per_guest_cost,
        "category_estimates": category_estimates,
        "shopping_items": shopping_items
    }

    # Run backend validation
    validated_plan = validate_celebration_plan(raw_plan)
    return validated_plan


def _rule_theme(event_key: str, style_key: str, tier: str, setting: Optional[str] = None) -> str:
    """Selects an affordable, stylish event theme based on event type, style, budget, and setting."""
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


def _rule_food(
    event_key: str,
    style_key: str,
    tier: str,
    guests: int,
    dietary_preference: Optional[str] = None,
    setting: Optional[str] = None
) -> List[str]:
    """Generates food items considering budget tier, event type, guest scaling, dietary choice, and setting."""
    food_list = []
    diet = (dietary_preference or "").lower().strip()
    is_veg = "veg" in diet and "non" not in diet and "mix" not in diet
    is_vegan = "vegan" in diet

    if tier == TIER_ZERO:
        if guests == 1:
            return [
                "Homemade comfort meal or favorite snack",
                "Homemade iced tea or fresh lemonade",
                "Personal homemade sweet treat or cookie"
            ]
        return [
            "Potluck style: Each friend brings one homemade snack or finger food",
            "Homemade lemonade / iced tea station",
            "Sharing favorite hostel snacks or homemade cookies"
        ]

    # Solo celebration scaling (guests == 1)
    if guests == 1:
        if tier == TIER_VERY_LOW:
            food_list.append("Affordable local bakery sponge cake or cupcakes")
            if is_veg:
                food_list.append("Affordable local samosas, kachoris, or aloo patties (personal portion)")
            elif is_vegan:
                food_list.append("Crispy spiced potato wedges or vegetable cutlets")
            else:
                food_list.append("Affordable local samosas or savory snack puff (personal portion)")
            food_list.append("Homemade popcorn, spiced chips, or mixed biscuits")
            food_list.append("Refreshing Rooh Afza, cold drinks, or homemade iced tea")
        elif tier == TIER_LOW:
            food_list.append("1.2 kg personalized chocolate truffle cake from a local bakery" if event_key == "birthday" else "Personal bakery dessert")
            food_list.append("Pani Puri / Chaat DIY portion or grilled sandwich combo")
            food_list.append("Crispy fries and chilled mocktail")
        else:
            food_list.append("Custom designer mini cake or gourmet pastry" if event_key == "birthday" else "Artisanal dessert platter")
            food_list.append("Personal combo meal: mini burgers, fries, or momos")
            food_list.append("Artisanal mocktail or iced cooler")
        return food_list

    # Group scaling (guests > 1)
    if tier == TIER_VERY_LOW:
        if is_veg:
            food_list.append("Affordable local samosas, kachoris, or aloo patties")
        elif is_vegan:
            food_list.append("Crispy spiced fries, potato patties, and vegetable spring rolls")
        else:
            food_list.append("Affordable local samosas, kachoris, or mixed savory patties")
        food_list.append("Homemade popcorn, spiced chips, and mixed biscuits")
        food_list.append("Refreshing Rooh Afza, cold drinks, or homemade iced tea")
        if event_key == "birthday":
            food_list.append("Budget-friendly local bakery sponge cake or cupcakes")
        elif event_key == "hostel party":
            food_list.append("Late-night customized Maggi noodles bar with toppings")

    elif tier == TIER_LOW:
        food_list.append("Pani Puri / Chaat DIY table or sandwich platter")
        food_list.append("Spring rolls, crispy fries, and dips")
        food_list.append("Chilled soft drinks and fruit mocktails")
        if event_key == "birthday":
            food_list.append("1kg personalized chocolate truffle cake from a local bakery")
        elif event_key == "picnic":
            food_list.append("Easy-to-pack veg club sandwiches, fruit skewers, and juice boxes")

    else:
        food_list.append("Mini burger sliders, pizza slices, or momos platter")
        food_list.append("Paneer tikka skewers, loaded nachos with cheese salsa" if is_veg else "Assorted tikka skewers, loaded nachos with cheese salsa")
        food_list.append("Artisanal mocktails and iced coolers")
        if event_key == "birthday":
            food_list.append("Premium designer custom birthday cake (chocolate/red velvet)")
        elif event_key == "college party":
            food_list.append("Bulk biryani combo or buffet snack combo boxes")

    if guests > 15:
        food_list.append(f"Pro-tip for {guests} guests: Order finger-food combos in bulk to reduce cost per head")

    return food_list


def _rule_decorations(
    event_key: str,
    style_key: str,
    tier: str,
    setting: Optional[str] = None
) -> List[str]:
    """Recommends realistic, low-cost decor matching style, budget tier, and setting."""
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


def _rule_activities(
    event_key: str,
    style_key: str,
    guests: int,
    setting: Optional[str] = None
) -> List[str]:
    """Generates engaging activities respecting guest count (solo vs group) and setting."""
    activities = []

    # Solo celebration activities (guests == 1)
    if guests == 1:
        if event_key == "birthday":
            activities.extend([
                "Cake cutting countdown with celebration candle and birthday anthem playlist",
                "Solo milestone reflection, gratitude recap, and photo memory journal",
                "Cozy movie or series marathon with favorite snacks and treats",
                "Video call celebration and digital toast with distant close friends and family"
            ])
        elif event_key == "farewell":
            activities.extend([
                "Personal senior tribute reflection and batch memory scrapbook review",
                "Virtual video call farewell catch-up with close batchmates and mentors"
            ])
        elif event_key == "picnic":
            activities.extend([
                "Relaxed nature walk, candid photography, and acoustic playlist session on a picnic mat",
                "Outdoor reading, sketch session, and badminton rally practice"
            ])
        elif event_key in ("college party", "hostel party"):
            activities.extend([
                "Curated Spotify celebration playlist and high-energy solo dance jam",
                "Late-night movie or online gaming session with favorite snacks"
            ])
        else:
            activities.extend([
                "Relaxing celebration playlist, personal memory journal, and favorite movie stream"
            ])
        return activities

    # Group activities (guests > 1)
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
    elif event_key in ("college party", "hostel party"):
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

    if guests == 1:
        tips.append("For a solo celebration, treat yourself to a mini bakery bento cake and favorite comfort snacks.")
        tips.append("Create an ambient room vibe with warm fairy lights and a personalized playlist for a cozy milestone memory.")
        return tips

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
