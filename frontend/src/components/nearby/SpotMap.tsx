/**
 * PlanzyPop - PopSpots Leaflet Map Component
 * Academic Mini-Project for M.Sc. Computer Science (Data Science)
 *
 * Interactive map powered exclusively by Leaflet and OpenStreetMap tiles.
 * - Displays authentic Chandigarh POI markers with student-friendly neo-brutalist styling.
 * - Outlines official Chandigarh UT administrative boundary.
 * - Provides popups with details, pricing, distance, and direct navigation links.
 * - 100% free, open-source, and compliant with all usage policies.
 */

import React, { useEffect, useRef } from "react"
import L from "leaflet"
import type { SpotItem } from "../../types"
import { CHANDIGARH_BOUNDARY, CHANDIGARH_CENTER } from "../../utils/chandigarhBoundary"

interface SpotMapProps {
  spots: SpotItem[]
  centerLat: number
  centerLon: number
  zoom?: number
  selectedSpotId?: string | null
  onSelectSpot: (spot: SpotItem) => void
  onOpenDetails: (spot: SpotItem) => void
  height?: string
}

const CATEGORY_STYLES: Record<string, { bg: string; emoji: string }> = {
  cafes: { bg: "#fef08a", emoji: "☕" },
  street_food: { bg: "#fed7aa", emoji: "🌮" },
  restaurants: { bg: "#fecdd3", emoji: "🍽️" },
  desserts: { bg: "#fbcfe8", emoji: "🍰" },
  parks: { bg: "#bbf7d0", emoji: "🌳" },
  book_cafes: { bg: "#e9d5ff", emoji: "📚" },
  activities: { bg: "#fed7aa", emoji: "🎯" },
}

function getPinStyle(category: string): { bg: string; emoji: string } {
  const norm = (category || "").toLowerCase()
  return CATEGORY_STYLES[norm] || { bg: "#ede9fe", emoji: "📍" }
}

export const SpotMap: React.FC<SpotMapProps> = ({
  spots,
  centerLat,
  centerLon,
  zoom = 14,
  selectedSpotId,
  onSelectSpot,
  onOpenDetails,
  height,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<L.Map | null>(null)
  const markersRef = useRef<Map<string, L.Marker>>(new Map())
  const boundaryLayerRef = useRef<L.Polygon | null>(null)

  useEffect(() => {
    if (!mapContainerRef.current) return
    if (mapInstanceRef.current) return

    const initialLat = centerLat || CHANDIGARH_CENTER[0]
    const initialLon = centerLon || CHANDIGARH_CENTER[1]

    const map = L.map(mapContainerRef.current, {
      center: [initialLat, initialLon],
      zoom: zoom,
      zoomControl: true,
      attributionControl: true,
      maxBounds: [
        [30.60, 76.60],
        [30.85, 76.95],
      ],
      minZoom: 11,
    })

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors',
    }).addTo(map)

    const boundaryPolygon = L.polygon(CHANDIGARH_BOUNDARY, {
      color: "#7c3aed",
      weight: 2,
      dashArray: "5, 5",
      fillColor: "#7c3aed",
      fillOpacity: 0.04,
      interactive: false,
    }).addTo(map)
    boundaryLayerRef.current = boundaryPolygon

    mapInstanceRef.current = map

    return () => {
      map.remove()
      mapInstanceRef.current = null
      markersRef.current.clear()
    }
  }, [])

  useEffect(() => {
    const map = mapInstanceRef.current
    if (!map) return

    if (centerLat && centerLon) {
      const current = map.getCenter()
      const dist = Math.hypot(current.lat - centerLat, current.lng - centerLon)
      if (dist > 0.005) {
        map.setView([centerLat, centerLon], zoom, { animate: true })
      }
    }
  }, [centerLat, centerLon, zoom])

  useEffect(() => {
    const map = mapInstanceRef.current
    if (!map) return

    markersRef.current.forEach((marker) => marker.remove())
    markersRef.current.clear()

    const onDetailsClick = (spot: SpotItem) => {
      onOpenDetails(spot)
    }

    ;(window as any)._planzypop_open_spot_details = (spotId: string) => {
      const match = spots.find((s) => s.id === spotId)
      if (match) onDetailsClick(match)
    }

    spots.forEach((spot) => {
      const { bg, emoji } = getPinStyle(spot.category)
      const isSelected = spot.id === selectedSpotId

      const customIcon = L.divIcon({
        className: "popspot-custom-marker",
        html: `
          <div class="popspot-pin ${isSelected ? "selected-pin" : ""}" style="background-color: ${bg};" title="${spot.name}">
            <span class="pin-emoji">${emoji}</span>
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 32],
        popupAnchor: [0, -32],
      })

      const marker = L.marker([spot.latitude, spot.longitude], {
        icon: customIcon,
        title: spot.name,
      }).addTo(map)

      const distLabel =
        spot.distance_km != null ? `${spot.distance_km} km away` : "Nearby"
      const priceLabel = spot.price_info || "Price not available"
      const catLabel = spot.category_label || spot.category

      const popupContent = `
        <div class="popspot-popup-card">
          <span class="popup-cat-badge" style="background: ${bg};">${catLabel}</span>
          <strong class="popup-title">${spot.name}</strong>
          <p class="popup-address">${spot.address || "Chandigarh, India"}</p>
          <div class="popup-meta">
            <span>📍 ${distLabel}</span>
            <span>💰 ${priceLabel}</span>
          </div>
          <div class="popup-actions">
            <button
              type="button"
              class="popup-details-btn"
              onclick="window._planzypop_open_spot_details('${spot.id}')"
            >
              View Place Details ➔
            </button>
          </div>
        </div>
      `

      marker.bindPopup(popupContent, {
        maxWidth: 260,
        className: "popspots-custom-popup",
      })

      marker.on("click", () => {
        onSelectSpot(spot)
      })

      markersRef.current.set(spot.id, marker)
    })

    if (selectedSpotId && markersRef.current.has(selectedSpotId)) {
      const targetMarker = markersRef.current.get(selectedSpotId)
      if (targetMarker) {
        targetMarker.openPopup()
      }
    }
    const timer = setTimeout(() => {
      map.invalidateSize()
    }, 150)
    return () => clearTimeout(timer)
  }, [spots, selectedSpotId, onSelectSpot, onOpenDetails])

  return (
    <div className="popspots-map-wrapper" style={{ height: height || "100%" }}>
      <div
        ref={mapContainerRef}
        className="popspots-leaflet-map"
        style={{ width: "100%", height: height || "100%" }}
      />
    </div>
  )
}
