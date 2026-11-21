"""
PlanzyPop - PopSpots Discovery Router
Endpoints for discovering, searching, filtering, and bookmarking local hangout spots.
Strictly restricted to Chandigarh Union Territory (India).
Powered by Geoapify Places API v2 and OpenStreetMap (Overpass & Curated Sector POIs).
Academic Mini-Project for M.Sc. Computer Science (Data Science)
"""

from typing import List, Optional
import math
import logging
from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session

from database import get_db
import models
import schemas
import spots_service
import geoapify_client
import chandigarh_boundary

logger = logging.getLogger("planzypop.spots_router")

router = APIRouter(prefix="/api/spots", tags=["PopSpots"])


@router.get(
    "/categories",
    response_model=List[schemas.SpotCategoryItem],
    summary="Get supported PopSpots categories"
)
def get_categories():
    """
    Returns the list of curated spot categories for hangout discovery.
    """
    return spots_service.CATEGORY_DEFINITIONS


@router.get(
    "/search",
    response_model=schemas.SpotSearchResponse,
    summary="Search or automatically discover spots across Chandigarh"
)
def search_spots(
    location: Optional[str] = Query(None, description="Chandigarh sector, locality, or landmark (optional)"),
    latitude: Optional[float] = Query(None, description="Search center latitude (within Chandigarh)"),
    longitude: Optional[float] = Query(None, description="Search center longitude (within Chandigarh)"),
    radius: Optional[float] = Query(3.0, ge=0.5, le=15.0, description="Search radius in kilometers"),
    category: Optional[str] = Query("all", description="Category filter (cafes, street_food, restaurants, etc.)"),
    sector: Optional[str] = Query(None, description="Optional sector filter (e.g. Sector 17, Sector 35)"),
    budget: Optional[str] = Query("Any budget", description="Budget filter (e.g. Under ₹100)"),
    min_rating: Optional[float] = Query(None, description="Minimum customer rating (only applies to places with ratings)"),
    vibe: Optional[str] = Query("Any vibe", description="Vibe filter"),
    occasion: Optional[str] = Query(None, description="Occasion filter"),
    page: Optional[int] = Query(1, ge=1, description="Page number for pagination"),
    page_size: Optional[int] = Query(15, ge=1, le=50, description="Items per page"),
    user_id: Optional[str] = Query("guest_default", description="User or guest session identifier"),
    db: Session = Depends(get_db)
):
    """
    Search or automatically discover spots across Chandigarh Union Territory:
    1. Automatic Territory Discovery: If location is omitted or 'Chandigarh', returns places
       across all Chandigarh sectors without requiring a sector selection.
    2. Specific Sector / Coordinate Search: If a specific sector or GPS coordinates are provided,
       locates places around that specific area.
    3. Strict Chandigarh Geofencing: Point-in-polygon enforcement ensures zero places outside Chandigarh.
    4. Rejects outside towns (Mohali, Panchkula, Zirakpur, Kharar) with HTTP 400 Bad Request.
    5. Deduplication across Geoapify, OpenStreetMap, and authentic curated venues.
    6. Server-side pagination and honest data handling.
    """
    uid = user_id or "guest_default"
    clean_loc = (location or "").strip()

    # Pre-fetch saved favorite IDs for this user
    saved_spot_ids = set()
    try:
        fav_records = db.query(models.SavedSpot.spot_id).filter(
            models.SavedSpot.user_id == uid
        ).all()
        saved_spot_ids = {r[0] for r in fav_records}
    except Exception:
        pass

    # CASE A: GPS / Explicit coordinate search
    if latitude is not None or longitude is not None:
        if latitude is None or longitude is None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Both latitude and longitude must be provided for coordinate search."
            )
        if not (-90.0 <= latitude <= 90.0 and -180.0 <= longitude <= 180.0):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Coordinates out of range. Latitude must be -90..90 and Longitude -180..180."
            )
        center_lat = float(latitude)
        center_lon = float(longitude)
        location_name = clean_loc or f"Coordinates ({center_lat:.4f}, {center_lon:.4f})"

        # Strict validation: Coordinates must lie within Chandigarh UT boundary polygon
        if not chandigarh_boundary.is_point_in_chandigarh(center_lat, center_lon):
            return schemas.SpotSearchResponse(
                status="outside_chandigarh",
                message=(
                    f"Selected location ({center_lat:.4f}, {center_lon:.4f}) is outside Chandigarh "
                    "Union Territory. PopSpots is strictly restricted to Chandigarh (excluding Mohali, "
                    "Panchkula, and Zirakpur)."
                ),
                query_location=location_name,
                latitude=center_lat,
                longitude=center_lon,
                radius_km=float(radius or 3.0),
                total_found=0,
                page=1,
                page_size=page_size or 15,
                total_pages=1,
                has_more=False,
                spots=[]
            )

        raw_spots = spots_service.fetch_nearby_places(
            center_lat=center_lat,
            center_lon=center_lon,
            radius_km=radius or 3.0,
            category=category or "all",
            location_name=location_name
        )
        dist_filter = f"Within {int(radius + 0.5)} km" if (radius and radius > 2.0) else "Nearby"
        ranked = spots_service.rank_and_filter_spots(
            spots=raw_spots,
            category=category,
            budget=budget,
            distance_filter=dist_filter,
            vibe=vibe,
            occasion=occasion
        )
        total_found = len(ranked)
        ps = page_size or 15
        p = page or 1
        total_pages = max(1, math.ceil(total_found / ps)) if total_found > 0 else 1
        start_idx = (p - 1) * ps
        end_idx = start_idx + ps
        page_slice = ranked[start_idx:end_idx]
        has_more = end_idx < total_found

        spot_items: List[schemas.SpotBase] = []
        for s in page_slice:
            spot_id_str = str(s.get("id"))
            place_id_str = s.get("place_id") or spot_id_str
            is_fav = spot_id_str in saved_spot_ids or place_id_str in saved_spot_ids or s.get("osm_id") in saved_spot_ids
            source = s.get("source") or "openstreetmap"
            rating_source = s.get("rating_source") or ("Geoapify" if source == "geoapify" else "OpenStreetMap Community")
            spot_items.append(
                schemas.SpotBase(
                    id=spot_id_str,
                    place_id=place_id_str,
                    osm_id=str(s.get("osm_id")) if s.get("osm_id") else None,
                    osm_type=str(s.get("osm_type")) if s.get("osm_type") else None,
                    name=s["name"],
                    category=s["category"],
                    category_label=s.get("category_label", s["category"].capitalize()),
                    latitude=float(s["latitude"]),
                    longitude=float(s["longitude"]),
                    address=s.get("address"),
                    sector=s.get("sector") or spots_service.extract_sector(s.get("address", ""), s.get("tags")),
                    photo_url=s.get("photo_url"),
                    description=s.get("description"),
                    price_level=s.get("price_level") or s.get("price_info"),
                    data_origin=s.get("data_origin", "curated"),
                    is_cached=s.get("is_cached", False),
                    distance_km=float(s.get("distance_km", 0.0)) if s.get("distance_km") is not None else None,
                    opening_hours=s.get("opening_hours") or "Not available",
                    price_info=s.get("price_info") or "Price not available",
                    rating=s.get("rating") or "Not available",
                    review_count=s.get("review_count"),
                    rating_source=rating_source,
                    source=source,
                    photo_name=s.get("photo_name"),
                    website_uri=s.get("website_uri"),
                    vibe=s.get("vibe"),
                    occasion=s.get("occasion"),
                    tags=s.get("tags"),
                    is_favorite=is_fav,
                    menu_status="unavailable",
                    menu_disclaimer="Menu/prices unavailable from official API.",
                    reviews_disclaimer="No customer reviews available for this venue."
                )
            )

        return schemas.SpotSearchResponse(
            status="ok",
            query_location=location_name,
            latitude=center_lat,
            longitude=center_lon,
            radius_km=float(radius or 3.0),
            total_found=total_found,
            page=p,
            page_size=ps,
            total_pages=total_pages,
            has_more=has_more,
            spots=spot_items
        )

    # CASE B: AUTOMATIC TERRITORY-WIDE DISCOVERY
    # If location is explicitly passed as empty or whitespace (e.g. '?location='), reject with 400
    if location is not None and not clean_loc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Please provide a valid location name or geographic coordinates (latitude and longitude)."
        )

    # Triggers automatic discovery when location is omitted, or generic 'Chandigarh'
    is_territory_discovery = (
        location is None or
        clean_loc.lower() in (
            "chandigarh", "chandigarh, india", "chandigarh ut",
            "chandigarh union territory", "all chandigarh", "entire chandigarh"
        )
    )

    if is_territory_discovery:
        all_places = spots_service.fetch_all_chandigarh_places()
        paged_spots, total_found, total_pages, has_more = spots_service.filter_and_paginate_vendors(
            places=all_places,
            category=category,
            sector=sector,
            budget=budget,
            min_rating=min_rating,
            vibe=vibe,
            occasion=occasion,
            page=page or 1,
            page_size=page_size or 15
        )

        spot_items: List[schemas.SpotBase] = []
        for s in paged_spots:
            spot_id_str = str(s.get("id"))
            place_id_str = s.get("place_id") or spot_id_str
            is_fav = spot_id_str in saved_spot_ids or place_id_str in saved_spot_ids or s.get("osm_id") in saved_spot_ids
            source = s.get("source") or "openstreetmap"
            rating_source = s.get("rating_source") or ("Geoapify" if source == "geoapify" else "OpenStreetMap Community")

            spot_items.append(
                schemas.SpotBase(
                    id=spot_id_str,
                    place_id=place_id_str,
                    osm_id=str(s.get("osm_id")) if s.get("osm_id") else None,
                    osm_type=str(s.get("osm_type")) if s.get("osm_type") else None,
                    name=s["name"],
                    category=s["category"],
                    category_label=s.get("category_label", s["category"].capitalize()),
                    latitude=float(s["latitude"]),
                    longitude=float(s["longitude"]),
                    address=s.get("address"),
                    sector=s.get("sector") or spots_service.extract_sector(s.get("address", ""), s.get("tags")),
                    photo_url=s.get("photo_url"),
                    description=s.get("description"),
                    price_level=s.get("price_level") or s.get("price_info"),
                    data_origin=s.get("data_origin", "curated"),
                    is_cached=s.get("is_cached", False),
                    distance_km=float(s.get("distance_km", 0.0)) if s.get("distance_km") is not None else None,
                    opening_hours=s.get("opening_hours") or "Not available",
                    price_info=s.get("price_info") or "Price not available",
                    rating=s.get("rating") or "Not available",
                    review_count=s.get("review_count"),
                    rating_source=rating_source,
                    source=source,
                    photo_name=s.get("photo_name"),
                    website_uri=s.get("website_uri"),
                    vibe=s.get("vibe"),
                    occasion=s.get("occasion"),
                    tags=s.get("tags"),
                    is_favorite=is_fav,
                    menu_status="unavailable",
                    menu_disclaimer="Menu/prices unavailable from official API.",
                    reviews_disclaimer="No customer reviews available for this venue."
                )
            )

        return schemas.SpotSearchResponse(
            status="ok",
            query_location="Chandigarh Union Territory",
            latitude=30.7333,
            longitude=76.7794,
            radius_km=12.0,
            total_found=total_found,
            page=page or 1,
            page_size=page_size or 15,
            total_pages=total_pages,
            has_more=has_more,
            spots=spot_items
        )

    # CASE C: Explicit Sector or Landmark Search
    search_query = clean_loc

    # Reject explicitly excluded neighboring cities upfront
    if chandigarh_boundary.is_explicitly_excluded_text(search_query):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                f"Location '{search_query}' is outside Chandigarh. PopSpots is strictly restricted "
                "to Chandigarh Union Territory (excluding Mohali, Panchkula, Zirakpur, Kharar, etc.)."
            )
        )

    geocoded = spots_service.geocode_location(search_query)
    if geocoded is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Location '{search_query}' could not be resolved within Chandigarh Union Territory. Please enter a valid Chandigarh sector or landmark."
        )
    center_lat, center_lon, location_name = geocoded

    raw_spots = spots_service.fetch_nearby_places(
        center_lat=center_lat,
        center_lon=center_lon,
        radius_km=radius or 3.0,
        category=category or "all",
        location_name=location_name
    )

    dist_filter = f"Within {int(radius + 0.5)} km" if (radius and radius > 2.0) else "Nearby"
    ranked_spots = spots_service.rank_and_filter_spots(
        spots=raw_spots,
        category=category,
        budget=budget,
        distance_filter=dist_filter,
        vibe=vibe,
        occasion=occasion
    )

    total_found = len(ranked_spots)
    ps = page_size or 15
    p = page or 1
    total_pages = max(1, math.ceil(total_found / ps)) if total_found > 0 else 1
    start_idx = (p - 1) * ps
    end_idx = start_idx + ps
    page_slice = ranked_spots[start_idx:end_idx]
    has_more = end_idx < total_found

    spot_items: List[schemas.SpotBase] = []
    for s in page_slice:
        spot_id_str = str(s.get("id"))
        place_id_str = s.get("place_id") or spot_id_str
        is_fav = spot_id_str in saved_spot_ids or place_id_str in saved_spot_ids or s.get("osm_id") in saved_spot_ids
        source = s.get("source") or "openstreetmap"
        rating_source = s.get("rating_source") or ("Geoapify" if source == "geoapify" else "OpenStreetMap Community")

        spot_items.append(
            schemas.SpotBase(
                id=spot_id_str,
                place_id=place_id_str,
                osm_id=str(s.get("osm_id")) if s.get("osm_id") else None,
                osm_type=str(s.get("osm_type")) if s.get("osm_type") else None,
                name=s["name"],
                category=s["category"],
                category_label=s.get("category_label", s["category"].capitalize()),
                latitude=float(s["latitude"]),
                longitude=float(s["longitude"]),
                address=s.get("address"),
                sector=s.get("sector") or spots_service.extract_sector(s.get("address", ""), s.get("tags")),
                photo_url=s.get("photo_url"),
                description=s.get("description"),
                price_level=s.get("price_level") or s.get("price_info"),
                data_origin=s.get("data_origin", "curated"),
                is_cached=s.get("is_cached", False),
                distance_km=float(s.get("distance_km", 0.0)) if s.get("distance_km") is not None else None,
                opening_hours=s.get("opening_hours") or "Not available",
                price_info=s.get("price_info") or "Price not available",
                rating=s.get("rating") or "Not available",
                review_count=s.get("review_count"),
                rating_source=rating_source,
                source=source,
                photo_name=s.get("photo_name"),
                website_uri=s.get("website_uri"),
                vibe=s.get("vibe"),
                occasion=s.get("occasion"),
                tags=s.get("tags"),
                is_favorite=is_fav,
                menu_status="unavailable",
                menu_disclaimer="Menu/prices unavailable from official API.",
                reviews_disclaimer="No customer reviews available for this venue."
            )
        )

    return schemas.SpotSearchResponse(
        status="ok",
        query_location=location_name,
        latitude=center_lat,
        longitude=center_lon,
        radius_km=float(radius or 3.0),
        total_found=total_found,
        page=p,
        page_size=ps,
        total_pages=total_pages,
        has_more=has_more,
        spots=spot_items
    )


@router.get(
    "/sectors",
    summary="Get all available Chandigarh sectors"
)
def get_chandigarh_sectors():
    """
    Returns unique canonical Chandigarh sectors and landmarks.
    """
    return spots_service.get_all_chandigarh_sectors()


@router.post(
    "/favorites",
    response_model=schemas.FavoriteResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Save a favorite hangout spot"
)
def save_favorite(
    fav: schemas.FavoriteCreate,
    db: Session = Depends(get_db)
):
    """
    Saves a spot to SQLite favorites. Supports isolated guest sessions without forcing auth.
    Validates that the saved spot coordinates lie within Chandigarh UT.
    """
    if not chandigarh_boundary.is_point_in_chandigarh(fav.latitude, fav.longitude):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot bookmark spot: venue coordinates are outside Chandigarh Union Territory."
        )

    uid = fav.user_id or "guest_default"
    existing = db.query(models.SavedSpot).filter(
        models.SavedSpot.user_id == uid,
        models.SavedSpot.spot_id == fav.spot_id
    ).first()

    if existing:
        return existing

    new_fav = models.SavedSpot(
        user_id=uid,
        spot_id=fav.spot_id,
        osm_id=fav.osm_id,
        osm_type=fav.osm_type,
        name=fav.name,
        category=fav.category,
        latitude=fav.latitude,
        longitude=fav.longitude,
        address=fav.address,
        opening_hours=fav.opening_hours,
        price_info=fav.price_info,
        vibe=fav.vibe,
        tags_json=fav.tags_json
    )
    db.add(new_fav)
    db.commit()
    db.refresh(new_fav)
    return new_fav


@router.get(
    "/favorites",
    response_model=List[schemas.FavoriteResponse],
    summary="List all saved favorite spots"
)
def get_favorites(
    user_id: Optional[str] = Query("guest_default", description="User or guest session identifier"),
    db: Session = Depends(get_db)
):
    """
    Retrieves all bookmarked spots for the specific user or isolated guest session.
    """
    uid = user_id or "guest_default"
    favs = db.query(models.SavedSpot).filter(
        models.SavedSpot.user_id == uid
    ).order_by(models.SavedSpot.saved_at.desc()).all()
    return favs


@router.delete(
    "/favorites/{spot_id:path}",
    summary="Remove a spot from favorites"
)
def remove_favorite(
    spot_id: str,
    user_id: Optional[str] = Query("guest_default", description="User or guest session identifier"),
    db: Session = Depends(get_db)
):
    """
    Deletes a saved spot from the user's favorites by spot_id or database ID.
    """
    uid = user_id or "guest_default"
    query = db.query(models.SavedSpot).filter(models.SavedSpot.user_id == uid)
    if spot_id.isdigit():
        fav = query.filter((models.SavedSpot.id == int(spot_id)) | (models.SavedSpot.spot_id == spot_id)).first()
    else:
        fav = query.filter(models.SavedSpot.spot_id == spot_id).first()

    if not fav:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Saved spot '{spot_id}' not found for session '{uid}'"
        )

    db.delete(fav)
    db.commit()
    return {"message": "Spot removed from favorites", "spot_id": spot_id}


@router.get(
    "/photos/{photo_ref:path}",
    summary="Get spot photo stream/placeholder"
)
def get_spot_photo(photo_ref: str):
    """
    Provides safe photo redirect or placeholder for venue photos.
    """
    clean_ref = photo_ref.strip()
    if clean_ref.startswith("http://") or clean_ref.startswith("https://"):
        return RedirectResponse(url=clean_ref, status_code=307)

    raise HTTPException(status_code=404, detail="Photo not found")


@router.get(
    "/{spot_id:path}",
    response_model=schemas.SpotBase,
    summary="Get single spot details"
)
def get_spot_details(
    spot_id: str,
    user_id: Optional[str] = Query("guest_default"),
    db: Session = Depends(get_db)
):
    """
    Retrieves information for a single spot by ID.
    Looks up in SQLite saved spots, Geoapify, or curated Chandigarh spots dataset.
    """
    uid = user_id or "guest_default"
    saved = db.query(models.SavedSpot).filter(
        models.SavedSpot.spot_id == spot_id,
        models.SavedSpot.user_id == uid
    ).first()
    is_fav = saved is not None

    if saved:
        return schemas.SpotBase(
            id=saved.spot_id,
            place_id=saved.spot_id,
            osm_id=saved.osm_id,
            osm_type=saved.osm_type,
            name=saved.name,
            category=saved.category,
            category_label=saved.category.capitalize(),
            latitude=saved.latitude,
            longitude=saved.longitude,
            address=saved.address,
            opening_hours=saved.opening_hours or "Not available",
            price_info=saved.price_info or "Price not available",
            rating="Not available",
            rating_source="OpenStreetMap Community",
            source="openstreetmap",
            vibe=saved.vibe,
            is_favorite=True,
            menu_status="unavailable",
            menu_disclaimer="Menu/prices unavailable.",
            reviews_disclaimer="No customer reviews available for this venue."
        )

    for s in spots_service.CURATED_LOCAL_SPOTS:
        if s["id"] == spot_id or s.get("osm_id") == spot_id or s.get("place_id") == spot_id:
            return schemas.SpotBase(
                id=s["id"],
                osm_id=s.get("osm_id"),
                osm_type=s.get("osm_type"),
                name=s["name"],
                category=s["category"],
                category_label=s["category_label"],
                latitude=s["latitude"],
                longitude=s["longitude"],
                address=s.get("address"),
                distance_km=None,
                opening_hours=s.get("opening_hours") or "Not available",
                price_info=s.get("price_info") or "Price not available",
                rating=s.get("rating") or "Not available",
                review_count=s.get("review_count"),
                rating_source=s.get("rating_source") or "OpenStreetMap Community",
                source=s.get("source") or "openstreetmap",
                vibe=s.get("vibe"),
                occasion=s.get("occasion"),
                tags=s.get("tags"),
                is_favorite=is_fav,
                menu_status="unavailable",
                menu_disclaimer="Menu/prices unavailable.",
                reviews_disclaimer="No customer reviews available for this venue."
            )

    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail=f"Spot with ID '{spot_id}' not found"
    )
