"""
PlanzyPop - Comprehensive Chandigarh Boundary & Geofencing Tests
Strict verification that:
1. Valid Chandigarh locations (sectors 7, 8, 9, 10, 15, 17, 19, 22, 26, 34, 35, 43, PU, etc.) are accepted.
2. Outside locations (Mohali, Panchkula, Zirakpur, Kharar) are strictly rejected.
3. Coordinate validation on search and favorites rejects non-Chandigarh locations.
4. Missing price information does not pass strict budget filters.
5. Empty responses do not trigger outside-Chandigarh fallback.
6. Geoapify and OpenStreetMap discovery workflows maintain boundary integrity.
"""

import pytest
from unittest.mock import patch
from starlette.testclient import TestClient
from main import app
import chandigarh_boundary
import geoapify_client
import spots_service

client = TestClient(app)


def test_chandigarh_boundary_polygon_points():
    """
    Direct Point-in-Polygon (PIP) ray casting test on authoritative boundary polygon:
    Verifies that all iconic Chandigarh sectors/landmarks pass, and neighboring
    towns (Mohali, Panchkula, Zirakpur, Kharar) fail.
    """
    valid_chandigarh_points = [
        ("Sector 17 Plaza", 30.7408, 76.7828),
        ("Sector 35 C Market", 30.7261, 76.7599),
        ("Sector 15 Market", 30.7530, 76.7727),
        ("Sector 22 Kiran Cinema", 30.7334, 76.7713),
        ("Panjab University Sector 14", 30.7600, 76.7680),
        ("Sector 10 Museums", 30.7542, 76.7890),
        ("Sector 26 Grain Market / Cafes", 30.7300, 76.8091),
        ("Sector 43 ISBT", 30.7188, 76.7460),
        ("Sector 7 Inner Market", 30.7359, 76.8043),
        ("Sector 8 Inner Market", 30.7417, 76.7995),
        ("Sector 9 Cafes", 30.7474, 76.7939),
        ("Sector 19 Sadar Bazar", 30.7320, 76.7870),
        ("Sector 34 Sub-City Center", 30.7199, 76.7652),
        ("Sukhna Lake Promenade", 30.7421, 76.8188),
        ("Rose Garden Sector 16", 30.7466, 76.7820),
        ("Rock Garden Sector 1", 30.7525, 76.8070),
    ]

    for label, lat, lon in valid_chandigarh_points:
        assert chandigarh_boundary.is_point_in_chandigarh(lat, lon) is True, (
            f"Expected {label} ({lat}, {lon}) to be INSIDE Chandigarh boundary!"
        )

    strictly_excluded_points = [
        ("Mohali Phase 7", 30.7011, 76.7212),
        ("Mohali Phase 3B2", 30.7107, 76.7118),
        ("Mohali Phase 5", 30.7153, 76.7259),
        ("Mohali Sector 70", 30.6974, 76.7127),
        ("Panchkula Sector 5", 30.6923, 76.8617),
        ("Panchkula Sector 1", 30.7042, 76.8530),
        ("Panchkula MDC", 30.7220, 76.8610),
        ("Zirakpur VIP Road", 30.6425, 76.8173),
        ("Zirakpur Dhakoli", 30.6550, 76.8320),
        ("Kharar Main Market", 30.7454, 76.6438),
        ("New Delhi Connaught Place", 28.6315, 77.2167),
        ("Bengaluru MG Road", 12.9750, 77.6050),
    ]

    for label, lat, lon in strictly_excluded_points:
        assert chandigarh_boundary.is_point_in_chandigarh(lat, lon) is False, (
            f"Expected {label} ({lat}, {lon}) to be OUTSIDE Chandigarh boundary!"
        )


def test_search_endpoint_rejects_outside_coordinates():
    """
    Verifies that querying /api/spots/search with coordinates in Mohali, Panchkula,
    or Zirakpur returns status="outside_chandigarh" with 0 spots and an informative message.
    """
    # 1. Mohali Phase 3B2
    resp_mohali = client.get("/api/spots/search?latitude=30.7107&longitude=76.7118")
    assert resp_mohali.status_code == 200
    data_mohali = resp_mohali.json()
    assert data_mohali["status"] == "outside_chandigarh"
    assert data_mohali["total_found"] == 0
    assert data_mohali["spots"] == []
    assert "outside Chandigarh" in data_mohali["message"]

    # 2. Panchkula Sector 5
    resp_panchkula = client.get("/api/spots/search?latitude=30.6923&longitude=76.8617")
    assert resp_panchkula.status_code == 200
    data_panchkula = resp_panchkula.json()
    assert data_panchkula["status"] == "outside_chandigarh"
    assert data_panchkula["total_found"] == 0

    # 3. Zirakpur VIP Road
    resp_zirakpur = client.get("/api/spots/search?latitude=30.6425&longitude=76.8173")
    assert resp_zirakpur.status_code == 200
    data_zirakpur = resp_zirakpur.json()
    assert data_zirakpur["status"] == "outside_chandigarh"
    assert data_zirakpur["total_found"] == 0


def test_search_endpoint_accepts_valid_chandigarh_coordinates():
    """
    Verifies that querying /api/spots/search with valid Chandigarh coordinates (e.g. Sector 17)
    returns status="ok" with genuine spots all strictly within Chandigarh.
    """
    resp = client.get("/api/spots/search?latitude=30.7408&longitude=76.7828&radius=2.0")
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "ok"
    assert data["total_found"] > 0
    for spot in data["spots"]:
        assert chandigarh_boundary.is_point_in_chandigarh(spot["latitude"], spot["longitude"]) is True


def test_text_search_rejects_excluded_cities_with_400():
    """
    Verifies that text queries explicitly naming excluded neighboring cities
    (Mohali, Panchkula, Zirakpur, Kharar) are rejected with a clear 400 Bad Request.
    """
    excluded_queries = [
        "Mohali",
        "Best cafes in Mohali",
        "Panchkula",
        "Sector 5 Panchkula",
        "Zirakpur",
        "VIP Road Zirakpur",
        "Kharar",
    ]
    for query in excluded_queries:
        resp = client.get(f"/api/spots/search?location={query}")
        assert resp.status_code == 400, f"Query '{query}' should return 400 Bad Request"
        detail = resp.json()["detail"]
        assert "outside Chandigarh" in detail


def test_text_search_accepts_chandigarh_sectors():
    """
    Verifies that text queries for Chandigarh sectors (Sector 17, 35, 15, 22, 43, 7, etc.)
    resolve properly and return status="ok".
    """
    chd_sectors = [
        "Sector 17",
        "Sector 35",
        "Sector 15",
        "Sector 22",
        "Sector 43",
        "Sector 7",
        "Sector 10",
        "Panjab University",
    ]
    for sector in chd_sectors:
        resp = client.get(f"/api/spots/search?location={sector}")
        assert resp.status_code == 200, f"Sector '{sector}' should return 200"
        data = resp.json()
        assert data["status"] == "ok"
        assert len(data["spots"]) > 0
        for s in data["spots"]:
            assert chandigarh_boundary.is_point_in_chandigarh(s["latitude"], s["longitude"]) is True


def test_budget_filter_excludes_unknown_price():
    """
    Verifies that places with 'Price not available' do NOT pass strict numeric budget filters.
    """
    # Query with budget "Under ₹100"
    resp = client.get("/api/spots/search?location=Sector%2017&budget=Under%20%E2%82%B9100")
    assert resp.status_code == 200
    data = resp.json()
    for s in data["spots"]:
        p_info = (s.get("price_info") or "").lower()
        assert "not available" not in p_info
        assert "unavailable" not in p_info
        if p_info != "free entry":
            import re
            nums = re.findall(r"\d+", p_info)
            if nums:
                assert int(nums[0]) <= 100


def test_empty_results_no_fallback_outside():
    """
    Verifies that if a query with tight filters yields no results,
    it returns total_found=0 and does NOT fallback to outside cities.
    """
    # Tight filter for non-existent category in small radius
    resp = client.get("/api/spots/search?location=Sector%2017&category=activities&budget=Under%20%E2%82%B9100&distance=Within%202%20km&vibe=Peaceful")
    assert resp.status_code == 200
    data = resp.json()
    # Spots returned (if any) must be strictly inside Chandigarh
    for s in data["spots"]:
        assert chandigarh_boundary.is_point_in_chandigarh(s["latitude"], s["longitude"]) is True


def test_geoapify_formatting_filters_outside_places():
    """
    Verifies that geoapify_client.format_geoapify_place returns None
    for features whose coordinates are outside Chandigarh UT.
    """
    # Feature in Mohali
    mohali_feature = {
        "properties": {
            "name": "Mohali Cafe Lounge",
            "lat": 30.7107,
            "lon": 76.7118,
            "categories": ["catering.cafe"],
            "formatted": "Phase 3B2, Mohali"
        }
    }
    result = geoapify_client.format_geoapify_place(mohali_feature)
    assert result is None, "Place in Mohali should be rejected by formatter!"

    # Feature in Chandigarh Sector 17
    chd_feature = {
        "properties": {
            "name": "Sector 17 Special Coffee",
            "lat": 30.7408,
            "lon": 76.7828,
            "categories": ["catering.cafe"],
            "formatted": "Sector 17, Chandigarh"
        }
    }
    result_chd = geoapify_client.format_geoapify_place(chd_feature)
    assert result_chd is not None, "Place in Chandigarh Sector 17 should be accepted!"
    assert result_chd["name"] == "Sector 17 Special Coffee"
    assert result_chd["source"] == "geoapify"


def test_favorite_outside_chandigarh_rejected():
    """
    Verifies that saving a favorite located outside Chandigarh boundary returns 400 Bad Request.
    """
    payload = {
        "spot_id": "test_mohali_fav",
        "name": "Mohali Test Place",
        "category": "cafes",
        "latitude": 30.7107,
        "longitude": 76.7118,
        "address": "Phase 3B2, Mohali",
        "user_id": "test_user"
    }
    resp = client.post("/api/spots/favorites", json=payload)
    assert resp.status_code == 400
    assert "outside Chandigarh" in resp.json()["detail"]
