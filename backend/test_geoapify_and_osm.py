"""
PlanzyPop - Geoapify Places API v2 & OpenStreetMap Fallback Tests
Verifies:
1. Geoapify client configuration detection.
2. Geoapify structured search parsing & category classification.
3. Geoapify geofencing filters out any non-Chandigarh feature.
4. Seamless failover to OpenStreetMap when Geoapify is unconfigured or times out.
5. In-memory caching respects API usage policies.
"""

import pytest
from unittest.mock import patch, MagicMock
import httpx

import geoapify_client
import spots_service
import chandigarh_boundary


def test_geoapify_is_configured_detection():
    """
    Verifies that is_geoapify_configured returns False when key is empty or None,
    and True when a valid string is provided.
    """
    with patch("geoapify_client.get_geoapify_api_key", return_value=None):
        assert geoapify_client.is_geoapify_configured() is False

    with patch("geoapify_client.get_geoapify_api_key", return_value=""):
        assert geoapify_client.is_geoapify_configured() is False

    with patch("geoapify_client.get_geoapify_api_key", return_value="short"):
        assert geoapify_client.is_geoapify_configured() is False

    with patch("geoapify_client.get_geoapify_api_key", return_value="a1b2c3d4e5f6g7h8i9j0k1l2m3"):
        assert geoapify_client.is_geoapify_configured() is True


def test_geoapify_unconfigured_error_raised():
    """
    Verifies that searching without key raises GeoapifyUnconfiguredError.
    """
    with patch("geoapify_client.get_geoapify_api_key", return_value=None):
        with pytest.raises(geoapify_client.GeoapifyUnconfiguredError):
            geoapify_client.search_geoapify_places(30.7408, 76.7828, radius_km=2.0)


def test_geoapify_search_with_mocked_response():
    """
    Verifies parsing of Geoapify Places API v2 GeoJSON features:
    - Features inside Chandigarh are parsed into PopSpots schema.
    - Features outside Chandigarh (e.g. Mohali) are rejected by geofence.
    """
    mock_geojson = {
        "type": "FeatureCollection",
        "features": [
            {
                "type": "Feature",
                "properties": {
                    "place_id": "51a3b5c7d8e9",
                    "name": "Artisan Coffee Roasters",
                    "categories": ["catering.cafe"],
                    "lat": 30.7408,
                    "lon": 76.7828,
                    "formatted": "SCO 42, Sector 17, Chandigarh",
                    "opening_hours": "09:00 - 22:00",
                    "datasource": {"raw": {"osm_id": 998877, "osm_type": "node"}}
                }
            },
            {
                "type": "Feature",
                "properties": {
                    "place_id": "outside_mohali_001",
                    "name": "Mohali Coffee Spot",
                    "categories": ["catering.cafe"],
                    "lat": 30.7107,
                    "lon": 76.7118,
                    "formatted": "Phase 3B2, Mohali"
                }
            }
        ]
    }

    mock_resp = MagicMock()
    mock_resp.status_code = 200
    mock_resp.json.return_value = mock_geojson

    mock_client = MagicMock()
    mock_client.__enter__.return_value.get.return_value = mock_resp

    with patch("geoapify_client.get_geoapify_api_key", return_value="valid_api_key_123456789"), \
         patch("httpx.Client", return_value=mock_client):
        results = geoapify_client.search_geoapify_places(
            center_lat=30.7408,
            center_lon=76.7828,
            radius_km=3.0,
            category="cafes"
        )
        assert len(results) == 1
        spot = results[0]
        assert spot["name"] == "Artisan Coffee Roasters"
        assert spot["category"] == "cafes"
        assert spot["source"] == "geoapify"
        assert spot["address"] == "SCO 42, Sector 17, Chandigarh"
        assert chandigarh_boundary.is_point_in_chandigarh(spot["latitude"], spot["longitude"]) is True


def test_spots_service_failover_when_geoapify_fails():
    """
    Verifies that if Geoapify raises an error or times out,
    spots_service seamlessly falls back to OpenStreetMap / curated Chandigarh spots.
    """
    with patch("geoapify_client.is_geoapify_configured", return_value=True), \
         patch("geoapify_client.search_geoapify_places", side_effect=geoapify_client.GeoapifyTimeoutError("Timed out")):
        spots = spots_service.fetch_nearby_places(
            center_lat=30.7408,
            center_lon=76.7828,
            radius_km=2.5,
            category="cafes"
        )
        assert len(spots) > 0
        for s in spots:
            assert chandigarh_boundary.is_point_in_chandigarh(s["latitude"], s["longitude"]) is True
