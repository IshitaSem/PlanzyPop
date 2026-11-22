"""
PlanzyPop - PopSpots API Integration Tests
Tests for location geocoding, nearby place discovery, honest price/rating handling,
coordinate validation, guest favorites session isolation, and strict budget filtering.

NOTE ON LIVE VS MOCKED TESTING:
- In this test suite, client calls execute against the FastAPI application mounted with
  in-memory / test SQLite databases and local curated fallback datasets.
- Network calls to Overpass / Nominatim fail over to curated local spots when external
  APIs are unavailable or rate-limited, ensuring deterministic and reproducible tests.
- Live external API availability (Nominatim and Overpass mirrors) is separately audited
  and reported in the integration audit document.
"""

import pytest
from unittest.mock import patch
from starlette.testclient import TestClient
from main import app
import geoapify_client
import chandigarh_boundary

client = TestClient(app)


def test_get_spot_categories():
    """
    Verifies that the categories endpoint returns the supported local hangout categories.
    """
    response = client.get("/api/spots/categories")
    assert response.status_code == 200
    categories = response.json()
    assert isinstance(categories, list)
    cat_ids = [c["id"] for c in categories]
    assert "all" in cat_ids
    assert "cafes" in cat_ids
    assert "street_food" in cat_ids
    assert "parks" in cat_ids
    assert "book_cafes" in cat_ids


SAMPLE_MOCK_SPOTS = [
    {
        "id": "places/ChIJbQ8y5VbvDzkR3HlK34n7Wf0",
        "name": "Garg Chaat Corner",
        "category": "street_food",
        "category_label": "Street Food",
        "latitude": 30.7305,
        "longitude": 76.7621,
        "address": "Sector 23, Chandigarh",
        "distance_km": 1.2,
        "opening_hours": "12:00 - 22:00",
        "price_info": "Under ₹100",
        "rating": "4.4",
        "review_count": 850,
        "vibe": "Lively",
        "occasion": "Friends Hangout",
        "is_independent": True
    },
    {
        "id": "places/ChIJc5_u817vDzkRw4y72V2Vp0c",
        "name": "Indian Coffee House",
        "category": "cafes",
        "category_label": "Café & Hangout",
        "latitude": 30.7401,
        "longitude": 76.7826,
        "address": "Sector 17, Chandigarh",
        "distance_km": 0.8,
        "opening_hours": "09:00 - 22:00",
        "price_info": "Under ₹200",
        "rating": "4.2",
        "review_count": 1200,
        "vibe": "Cozy",
        "occasion": "After College",
        "is_independent": True
    },
    {
        "id": "places/ChIJd6_v928wEzkRx5z83W3Wq1d",
        "name": "Rose Garden Promenade",
        "category": "parks",
        "category_label": "Park & Garden",
        "latitude": 30.7466,
        "longitude": 76.7820,
        "address": "Sector 16, Chandigarh",
        "distance_km": 1.5,
        "opening_hours": "06:00 - 20:00",
        "price_info": "Free entry",
        "rating": "4.6",
        "review_count": 3500,
        "vibe": "Peaceful",
        "occasion": "Solo Visit",
        "is_independent": True
    }
]


def test_search_spots_osm_fallback_when_geoapify_unconfigured():
    """
    Verifies that when GEOAPIFY_API_KEY is not configured:
    PopSpots automatically falls back to OpenStreetMap / curated Chandigarh venues,
    returning status="ok" with genuine Chandigarh spots.
    """
    with patch("geoapify_client.get_geoapify_api_key", return_value=None):
        response = client.get("/api/spots/search?location=Sector%2017%20Chandigarh&category=all")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "ok"
        assert len(data["spots"]) > 0
        for s in data["spots"]:
            assert s["latitude"] is not None
            assert s["longitude"] is not None


def test_search_spots_with_location():
    """
    Verifies searching spots by city/locality name with configured places.
    Ensures coordinates, distance calculation, and honest fallbacks for prices/ratings.
    """
    with patch("spots_service.fetch_nearby_places", return_value=SAMPLE_MOCK_SPOTS):
        response = client.get("/api/spots/search?location=Sector%2017%20Chandigarh&category=all")
        assert response.status_code == 200
        data = response.json()
        assert "spots" in data
        assert "latitude" in data
        assert "longitude" in data
        assert data["latitude"] != 0.0
        assert data["longitude"] != 0.0
        assert len(data["spots"]) > 0

        first_spot = data["spots"][0]
        assert "name" in first_spot
        assert "category" in first_spot
        assert "latitude" in first_spot
        assert "longitude" in first_spot
        assert "distance_km" in first_spot
        assert first_spot["price_info"] in ("Price not available", "Free entry") or "₹" in first_spot["price_info"]
        assert first_spot["rating"] in ("Not available",) or first_spot["rating"] is not None


def test_search_spots_with_coordinates():
    """
    Verifies searching spots with explicit GPS coordinates (latitude, longitude).
    """
    with patch("spots_service.fetch_nearby_places", return_value=SAMPLE_MOCK_SPOTS):
        response = client.get("/api/spots/search?latitude=30.7401&longitude=76.7826&radius=3.0")
        assert response.status_code == 200
        data = response.json()
        assert data["latitude"] == 30.7401
        assert data["longitude"] == 76.7826
        assert len(data["spots"]) > 0


def test_search_spots_coordinates_validation():
    """
    Verifies robust validation of coordinates:
    - Only latitude provided -> 400 Bad Request
    - Latitude or longitude out of range -> 400 Bad Request
    """
    resp_lat_only = client.get("/api/spots/search?latitude=12.9716")
    assert resp_lat_only.status_code == 400
    assert "Both latitude and longitude must be provided" in resp_lat_only.json()["detail"]

    resp_bad_lat = client.get("/api/spots/search?latitude=120.5&longitude=77.5")
    assert resp_bad_lat.status_code == 400

    resp_bad_lon = client.get("/api/spots/search?latitude=12.5&longitude=250.0")
    assert resp_bad_lon.status_code == 400


def test_search_spots_category_filter():
    """
    Verifies category filtering returns spots matching the requested category.
    """
    with patch("spots_service.fetch_nearby_places", return_value=SAMPLE_MOCK_SPOTS):
        response = client.get("/api/spots/search?location=Chandigarh&category=cafes")
        assert response.status_code == 200
        data = response.json()
        assert len(data["spots"]) > 0
        for s in data["spots"]:
            assert s["category"] in ("cafes", "book_cafes")


def test_search_spots_empty_location_returns_400():
    """
    Verifies that an empty or whitespace location query returns a clear 400 Bad Request.
    Silent fallback to unrelated cities is strictly avoided.
    """
    response = client.get("/api/spots/search?location=")
    assert response.status_code == 400
    assert "Please provide a valid location name" in response.json()["detail"]

    response_spaces = client.get("/api/spots/search?location=   ")
    assert response_spaces.status_code == 400


def test_search_spots_invalid_location_returns_404():
    """
    Verifies that an unresolvable or fictional locality returns a 404 Not Found error
    instead of silently returning results from another major city.
    """
    response = client.get("/api/spots/search?location=nonexistent_fictional_place_xyz999")
    assert response.status_code == 404
    assert "could not be resolved" in response.json()["detail"]


def test_strict_budget_filter_excludes_unknown_price():
    """
    Verifies data accuracy: Unknown prices ('Price not available') must NOT be
    included as confirmed matches when a strict budget filter (e.g. Under ₹100) is applied.
    """
    with patch("spots_service.fetch_nearby_places", return_value=SAMPLE_MOCK_SPOTS):
        response = client.get("/api/spots/search?location=Chandigarh&budget=Under%20%E2%82%B9100")
        assert response.status_code == 200
        data = response.json()
        assert len(data["spots"]) > 0
        for spot in data["spots"]:
            # Spot must be either Free entry or have explicit numeric price <= 100
            assert spot["price_info"] != "Price not available"
            if spot["price_info"] != "Free entry":
                import re
                nums = re.findall(r"\d+", spot["price_info"].replace(",", ""))
                if nums:
                    assert int(nums[0]) <= 100


def test_guest_favourites_session_isolation():
    """
    Verifies that guest favorites are isolated by session identifier and never
    leak across unauthenticated users.
    """
    user_alpha = "guest_session_alpha_123"
    user_beta = "guest_session_beta_456"
    spot_id = "test/spot/isolation_check"

    fav_payload = {
        "spot_id": spot_id,
        "name": "Alpha Private Hangout",
        "category": "cafes",
        "latitude": 30.7408,
        "longitude": 76.7828,
        "address": "Sector 17, Chandigarh",
        "price_info": "Under ₹100",
        "user_id": user_alpha
    }
    save_resp = client.post("/api/spots/favorites", json=fav_payload)
    assert save_resp.status_code == 201

    beta_list = client.get(f"/api/spots/favorites?user_id={user_beta}").json()
    assert not any(f["spot_id"] == spot_id for f in beta_list)

    alpha_list = client.get(f"/api/spots/favorites?user_id={user_alpha}").json()
    assert any(f["spot_id"] == spot_id for f in alpha_list)

    client.delete(f"/api/spots/favorites/{spot_id}?user_id={user_alpha}")


def test_favorites_crud_lifecycle():
    """
    Verifies saving, retrieving, checking, and deleting favorites in SQLite.
    Supports guest mode without requiring authentication.
    """
    test_spot_id = "test/spot/999"
    test_user = "guest_test_runner"

    fav_payload = {
        "spot_id": test_spot_id,
        "name": "Test Student Tea Stall",
        "category": "street_food",
        "latitude": 30.7334,
        "longitude": 76.7713,
        "address": "Sector 22, Chandigarh",
        "opening_hours": "07:00 - 22:00",
        "price_info": "Price not available",
        "vibe": "Lively",
        "user_id": test_user
    }
    create_resp = client.post("/api/spots/favorites", json=fav_payload)
    assert create_resp.status_code == 201
    created = create_resp.json()
    assert created["spot_id"] == test_spot_id
    assert created["name"] == "Test Student Tea Stall"

    list_resp = client.get(f"/api/spots/favorites?user_id={test_user}")
    assert list_resp.status_code == 200
    favs = list_resp.json()
    assert any(f["spot_id"] == test_spot_id for f in favs)

    detail_resp = client.get(f"/api/spots/{test_spot_id}?user_id={test_user}")
    assert detail_resp.status_code == 200
    detail = detail_resp.json()
    assert detail["name"] == "Test Student Tea Stall"
    assert detail["is_favorite"] is True

    del_resp = client.delete(f"/api/spots/favorites/{test_spot_id}?user_id={test_user}")
    assert del_resp.status_code == 200

    list_after = client.get(f"/api/spots/favorites?user_id={test_user}").json()
    assert not any(f["spot_id"] == test_spot_id for f in list_after)

    del_again = client.delete(f"/api/spots/favorites/{test_spot_id}?user_id={test_user}")
    assert del_again.status_code == 404


def test_outside_chandigarh_favorite_rejected():
    """
    Verifies that attempting to save a favorite with coordinates outside Chandigarh
    (e.g., Mohali or Bengaluru) is strictly rejected with 400 Bad Request.
    """
    fav_payload = {
        "spot_id": "outside/test/1",
        "name": "Mohali Cafe Outside Boundary",
        "category": "cafes",
        "latitude": 30.7107,
        "longitude": 76.7118,
        "address": "Phase 3B2, Mohali",
        "price_info": "Under ₹150",
        "user_id": "guest_boundary_test"
    }
    resp = client.post("/api/spots/favorites", json=fav_payload)
    assert resp.status_code == 400
    assert "outside Chandigarh Union Territory" in resp.json()["detail"]


def test_automatic_territory_discovery_on_empty_location():
    """
    Verifies that requesting /api/spots/search without a location parameter
    automatically discovers and returns places across Chandigarh UT without requiring
    the user to pick a sector first.
    """
    resp = client.get("/api/spots/search")
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "ok"
    assert data["total_found"] > 0
    assert len(data["spots"]) > 0

    sectors_represented = set()
    for s in data["spots"]:
        assert chandigarh_boundary.is_point_in_chandigarh(s["latitude"], s["longitude"])
        if s.get("sector"):
            sectors_represented.add(s["sector"])
        assert s["data_origin"] in ("live_api", "cached", "curated")

    assert len(sectors_represented) >= 3, f"Expected multiple sectors, got: {sectors_represented}"


def test_sector_filtering():
    """
    Verifies optional sector filtering narrows results down to that specific sector.
    """
    resp = client.get("/api/spots/search?sector=Sector 35")
    assert resp.status_code == 200
    data = resp.json()
    assert len(data["spots"]) > 0
    for s in data["spots"]:
        sec_str = (s.get("sector") or "") + " " + (s.get("address") or "")
        assert "35" in sec_str


def test_pagination_and_load_more():
    """
    Verifies pagination parameters (page, page_size) and has_more flag.
    """
    resp1 = client.get("/api/spots/search?page=1&page_size=5")
    assert resp1.status_code == 200
    d1 = resp1.json()
    assert len(d1["spots"]) == 5
    assert d1["page"] == 1
    assert d1["page_size"] == 5
    assert d1["has_more"] is True

    resp2 = client.get("/api/spots/search?page=2&page_size=5")
    assert resp2.status_code == 200
    d2 = resp2.json()
    assert len(d2["spots"]) == 5
    assert d2["page"] == 2

    ids1 = {s["id"] for s in d1["spots"]}
    ids2 = {s["id"] for s in d2["spots"]}
    assert ids1.isdisjoint(ids2)


def test_get_chandigarh_sectors_endpoint():
    """
    Verifies /api/spots/sectors returns canonical Chandigarh sectors.
    """
    resp = client.get("/api/spots/sectors")
    assert resp.status_code == 200
    sectors = resp.json()
    assert isinstance(sectors, list)
    assert len(sectors) > 5
    assert any("Sector 17" in s for s in sectors)
    assert any("Sector 35" in s for s in sectors)
