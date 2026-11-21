"""
PlanzyPop AI - Food & Review Intelligence Service
M.Sc. Computer Science (Data Science) Mini-Project

Extracts explainable review intelligence and verified food recommendations from
official Google Places API (New) review payloads without web-scraping or data fabrication.

Guiding Principles:
1. Zero Data Fabrication: Ratings, review counts, author attributions, and dish mentions
   must come exclusively from real Google Places payloads or verified official sources.
2. Honest Sample Labeling: Google Places returns at most 5 sample reviews. The system must
   clearly state that this is a limited sample, not an exhaustive census of all customer feedback.
3. Traceable Dish Extraction: Dishes are only extracted if genuinely mentioned in available
   customer review text or verified menus. Unsupported claims are strictly avoided.
4. Menu Transparency: If no verified menu exists, displays "Menu/prices unavailable."
"""

import re
from typing import Dict, List, Optional, Any, Tuple


# Known common food items to detect in authentic review comments
COMMON_FOOD_ITEMS = [
    "cold coffee", "hazelnut cold coffee", "filter coffee", "masala chai", "adrak chai",
    "paneer tikka", "paneer roll", "butter chicken", "dal makhani", "chole bhature",
    "samosa", "samosa chaat", "kachori", "golgappe", "pani puri", "dahi bhalla", "chaat",
    "steamed momos", "fried momos", "kurkure momos", "tandoori momos", "spring rolls",
    "french fries", "peri peri fries", "cheese garlic bread", "pasta", "white sauce pasta",
    "red sauce pasta", "pizza", "margherita pizza", "burger", "veg burger",
    "aloo tikki burger", "maggi", "cheese maggi", "grilled sandwich", "club sandwich",
    "aloo parantha", "paneer parantha", "sweet lassi", "mango shake", "chocolate shake",
    "softy", "bento cake", "chocolate truffle cake", "red velvet cake", "cupcake",
    "cheesecake", "brownie", "hot chocolate brownie", "waffle", "pastry"
]

# Negative sentiment indicator patterns for common complaints
COMPLAINT_PATTERNS = [
    (r"\b(slow|delayed|waiting|wait time|waited too long)\b", "Slow service / long wait times during rush"),
    (r"\b(overpriced|expensive|not worth|pricey|costly)\b", "Priced higher than average for portion size"),
    (r"\b(unhygienic|dirty|cleanliness|insects|flies)\b", "Cleanliness / hygiene concerns reported"),
    (r"\b(parking|no parking|park)\b", "Limited parking space available nearby"),
    (r"\b(cold food|stale|not fresh|tasteless|bland)\b", "Food freshness or temperature inconsistency"),
    (r"\b(rude|arrogant|poor service|unprofessional)\b", "Staff responsiveness could be improved"),
    (r"\b(noisy|loud|cramped|small seating|no space)\b", "Limited seating or noisy environment during peak hours")
]

POSITIVE_PATTERNS = [
    (r"\b(delicious|tasty|yummy|flavorful|mouthwatering)\b", "Praised for great taste and authentic flavor"),
    (r"\b(affordable|pocket friendly|budget friendly|cheap|value for money)\b", "Great value for money / student-friendly pricing"),
    (r"\b(cozy|aesthetic|ambience|vibe|vibes|peaceful|beautiful)\b", "Pleasant ambience and relaxing vibe"),
    (r"\b(friendly|polite|courteous|quick service|fast)\b", "Quick and courteous staff service"),
    (r"\b(must try|highly recommend|best in town|favorite|favourite)\b", "Customer favorite / highly recommended"),
    (r"\b(hygienic|clean|neat|well maintained)\b", "Clean and well-maintained environment")
]


def extract_dish_recommendations(reviews: List[Dict[str, Any]]) -> List[Dict[str, str]]:
    """
    Scans real Google review text for explicit dish mentions praised in 4-5 star reviews.
    Returns a list of dicts with 'dish', 'quote', and 'author'.
    Never generates synthetic dishes.
    """
    recommendations: List[Dict[str, str]] = []
    seen_dishes = set()

    for rev in reviews:
        rating = rev.get("rating", 0)
        # Only consider positive reviews (rating >= 4 or rating is absent)
        if rating is not None and rating < 4:
            continue

        raw_text = ""
        text_obj = rev.get("text")
        if isinstance(text_obj, dict):
            raw_text = text_obj.get("text", "")
        elif isinstance(text_obj, str):
            raw_text = text_obj

        if not raw_text:
            continue

        text_lower = raw_text.lower()
        author = rev.get("authorAttribution", {}).get("displayName", "Customer") if isinstance(rev.get("authorAttribution"), dict) else "Customer"

        for dish in COMMON_FOOD_ITEMS:
            if dish in text_lower and dish not in seen_dishes:
                # Find matching sentence
                sentences = re.split(r"[.!?\n]", raw_text)
                matching_sentence = ""
                for s in sentences:
                    if dish in s.lower():
                        matching_sentence = s.strip()
                        break

                seen_dishes.add(dish)
                recommendations.append({
                    "dish": dish.title(),
                    "quote": matching_sentence if matching_sentence else f"Recommended by {author}",
                    "author": author
                })

                if len(recommendations) >= 5:
                    break

    return recommendations


def extract_sentiment_highlights(reviews: List[Dict[str, Any]]) -> Tuple[List[str], List[str]]:
    """
    Extracts evidence-based positive feedback and common complaints from genuine review text.
    Returns (positive_highlights, common_complaints).
    """
    positives = []
    complaints = []
    seen_pos = set()
    seen_neg = set()

    for rev in reviews:
        raw_text = ""
        text_obj = rev.get("text")
        if isinstance(text_obj, dict):
            raw_text = text_obj.get("text", "")
        elif isinstance(text_obj, str):
            raw_text = text_obj

        if not raw_text:
            continue

        text_lower = raw_text.lower()
        rating = rev.get("rating")

        # Positives
        if rating is None or rating >= 4:
            for pattern, label in POSITIVE_PATTERNS:
                if label not in seen_pos and re.search(pattern, text_lower):
                    seen_pos.add(label)
                    positives.append(label)

        # Complaints
        if rating is None or rating <= 3:
            for pattern, label in COMPLAINT_PATTERNS:
                if label not in seen_neg and re.search(pattern, text_lower):
                    seen_neg.add(label)
                    complaints.append(label)

    return positives, complaints


def format_google_reviews(raw_reviews: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Extracts author attribution, rating, publication time, and source link
    in strict compliance with Google Maps Platform attribution terms.
    """
    formatted = []
    for r in raw_reviews:
        author_info = r.get("authorAttribution", {})
        if not isinstance(author_info, dict):
            author_info = {}

        raw_text = ""
        text_obj = r.get("text")
        if isinstance(text_obj, dict):
            raw_text = text_obj.get("text", "")
        elif isinstance(text_obj, str):
            raw_text = text_obj

        formatted.append({
            "author_name": author_info.get("displayName", "Google Reviewer"),
            "author_photo_url": author_info.get("photoUri"),
            "google_maps_profile_url": author_info.get("uri"),
            "rating": r.get("rating"),
            "relative_time": r.get("relativePublishTimeDescription", "Recent"),
            "text": raw_text,
            "publish_time": r.get("publishTime")
        })

    return formatted
