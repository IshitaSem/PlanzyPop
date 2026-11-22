/**
 * PlanzyPop - Nearby Café Suggestions Component
 * Academic Mini-Project for M.Sc. Computer Science (Data Science)
 *
 * Implements Google Maps-powered Café and Venue suggestions:
 * 1. Requests browser geolocation with user permission.
 * 2. Uses verified coordinates to form targeted Google Maps searches.
 * 3. Provides graceful fallback to manual city/locality input when location is unavailable.
 * 4. Transparently explains that real results and reviews are provided directly by Google Maps.
 * 5. Fully responsive on desktop, tablet, and Android mobile browsers.
 */

import { useState, useId } from "react"
import type { CafeSearchCategory } from "../../types"
import { Icon } from "../common/Icon"
import { Button } from "../common/Button"

const CAFE_CATEGORIES: CafeSearchCategory[] = [
  {
    id: "cafe-near-me",
    title: "Cafés Near Me",
    subtitle: "Casual Hangouts & Coffee Spots",
    tag: "POPULAR HANGOUTS",
    icon: "coffee",
    color: "yellow",
    badge: "Most Visited",
    searchQuery: "cafes near me",
    description:
      "Discover top-rated local cafes, coffee shops, and cozy hangout spots around your current location for casual meetups.",
    studentTip:
      "Check Google Maps photos for seating space and reviews for WiFi and charging outlets if studying together.",
  },
  {
    id: "budget-cafes",
    title: "Budget-Friendly Cafés",
    subtitle: "Pocket-Friendly Bites & Sips",
    tag: "STUDENT SAVER",
    icon: "wallet",
    color: "peach",
    badge: "Under ₹250/head",
    searchQuery: "budget friendly pocket friendly student cafes near me",
    description:
      "Affordable tea rooms, student cafes, and quick-bite joints that keep your celebration expenses light.",
    studentTip:
      "Combos, snack platters, and student meal hours give you the highest value without exceeding your planned budget.",
  },
  {
    id: "birthday-cafes",
    title: "Birthday Celebration Cafés",
    subtitle: "Cake Cutting & Party Ambience",
    tag: "BIRTHDAY SPECIAL",
    icon: "cake",
    color: "lavender",
    badge: "Party Vibes",
    searchQuery: "birthday celebration cafes private area party near me",
    description:
      "Spots with aesthetic lighting, cozy corners, background tunes, and space for cake cutting with friends.",
    studentTip:
      "Call the number on Google Maps beforehand to verify if outside cakes and mini balloon decor are permitted without extra charges.",
  },
  {
    id: "group-cafes",
    title: "Group-Friendly Cafés",
    subtitle: "Spacious Seating & Board Games",
    tag: "LARGE GROUPS",
    icon: "people",
    color: "yellow",
    badge: "6+ Seating",
    searchQuery: "large group friendly cafes board games rooftop near me",
    description:
      "Spacious venues, rooftop coffee lounges, and gaming cafes designed to comfortably seat large friend circles.",
    studentTip:
      "Pre-book tables 1–2 days early on Friday and Saturday evenings to guarantee contiguous group seating.",
  },
  {
    id: "bakeries-cakes",
    title: "Bakeries & Cake Shops",
    subtitle: "Custom Cakes & Sweet Treats",
    tag: "CAKES & PASTRIES",
    icon: "cake",
    color: "lavender",
    badge: "Custom Orders",
    searchQuery: "bakery and cake shop custom birthday cakes near me",
    description:
      "Nearby artisanal bakeries, pastry studios, and dessert counters for custom photo cakes and fresh treats.",
    studentTip:
      "Order customized cakes 24 to 48 hours in advance. Inquire if sparkler candles and disposable cutlery are included.",
  },
  {
    id: "small-celebrations",
    title: "Restaurants for Small Celebrations",
    subtitle: "Group Diners & Party Corners",
    tag: "MINI CELEBRATIONS",
    icon: "food",
    color: "peach",
    badge: "Family & Friends",
    searchQuery: "restaurants for small party celebration group dining near me",
    description:
      "Casual dining restaurants with private party sections, buffet deals, and platter meals for mini-gatherings.",
    studentTip:
      "Pre-fixed set menus and family sharing platters help maintain predictable per-head expenses.",
  },
]

type LocationState = { status: "idle" } | { status: "loading" } | {
  status: "granted"
  latitude: number
  longitude: number
} | { status: "denied"; message: string } | { status: "error"; message: string }

export function CafeSuggestions() {
  const [locationState, setLocationState] = useState<LocationState>({
    status: "idle",
  })
  const [manualCity, setManualCity] = useState("")
  const [appliedCity, setAppliedCity] = useState("")
  const manualCityInputId = useId()

  const handleRequestLocation = () => {
    if (!("geolocation" in navigator)) {
      setLocationState({
        status: "error",
        message:
          "Browser geolocation is not supported on this device. Please enter your city or area manually.",
      })
      return
    }

    setLocationState({ status: "loading" })

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocationState({
          status: "granted",
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        })
      },
      (error) => {
        let msg = "Could not access location."
        if (error.code === error.PERMISSION_DENIED) {
          msg =
            "Location permission was denied. You can enter your city or area manually below."
          setLocationState({ status: "denied", message: msg })
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          msg =
            "Location information is unavailable on your device. Please enter your city manually."
          setLocationState({ status: "error", message: msg })
        } else if (error.code === error.TIMEOUT) {
          msg =
            "Location request timed out. Please try again or enter your city manually."
          setLocationState({ status: "error", message: msg })
        } else {
          setLocationState({ status: "error", message: msg })
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      },
    )
  }

  const handleApplyManualCity = (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!manualCity.trim()) return
    setAppliedCity(manualCity.trim())
  }

  const handleClearLocation = () => {
    setLocationState({ status: "idle" })
    setAppliedCity("")
    setManualCity("")
  }

  /**
   * Generates a Google Maps URL based on user coordinates or manual city input.
   * Universal format opens either the Google Maps app on Android or the browser tab on desktop/tablet.
   */
  const getMapsUrl = (category: CafeSearchCategory): string => {
    const rawQuery = category.searchQuery

    if (locationState.status === "granted") {
      const lat = locationState.latitude.toFixed(6)
      const lng = locationState.longitude.toFixed(6)
      return `https://www.google.com/maps/search/${encodeURIComponent(rawQuery)}/@${lat},${lng},15z`
    }

    if (appliedCity.trim()) {
      const targetedQuery = `${rawQuery} in ${appliedCity.trim()}`
      return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(targetedQuery)}`
    }

    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(rawQuery)}`
  }

  return (
    <div
      className="cafe-suggestions-section"
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 20,
        width: "100%",
      }}
    >
      <div
        className="cafe-hero-card"
        style={{
          background: "linear-gradient(135deg, #fff9e6 0%, #fff 100%)",
          border: "1.5px solid var(--ink)",
          borderRadius: 20,
          padding: "20px 24px",
          boxShadow: "3px 4px 0 var(--ink)",
          width: "100%",
          boxSizing: "border-box",
        }}
      >
        <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
          <span
            style={{
              width: 44,
              height: 44,
              borderRadius: 14,
              background: "var(--yellow)",
              border: "1.5px solid var(--ink)",
              display: "grid",
              placeItems: "center",
              flexShrink: 0,
            }}
          >
            <Icon name="coffee" size={24} />
          </span>
          <div style={{ flex: 1 }}>
            <span
              style={{
                fontSize: 10,
                fontWeight: 800,
                letterSpacing: 0.8,
                color: "var(--coral)",
                textTransform: "uppercase",
              }}
            >
              GOOGLE MAPS VERIFIED FINDER
            </span>
            <h3
              style={{
                margin: "2px 0 6px",
                fontSize: 18,
                color: "var(--ink)",
                fontWeight: 800,
              }}
            >
              Nearby Café & Venue Suggestions
            </h3>
            <p
              style={{
                margin: 0,
                fontSize: 13,
                color: "var(--muted)",
                lineHeight: 1.45,
              }}
            >
              Explore real local venues for cake cutting, group hangouts, budget
              coffee, and celebration catering. PlanzyPop opens verified Google
              Maps searches so you always see authentic operating hours, real
              customer photos, and genuine reviews.
            </p>
          </div>
        </div>

        <div
          style={{
            marginTop: 14,
            padding: "12px 14px",
            background: "rgba(255, 255, 255, 0.85)",
            border: "1px solid var(--line)",
            borderRadius: 14,
            display: "flex",
            flexDirection: "column",
            gap: 10,
          }}
        >
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 8,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span
                style={{ fontSize: 13, fontWeight: 700, color: "var(--ink)" }}
              >
                Search Location:
              </span>
              {locationState.status === "granted" && (
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 5,
                    fontSize: 12,
                    fontWeight: 700,
                    color: "#0f766e",
                    background: "#ccfbf1",
                    padding: "3px 8px",
                    borderRadius: 8,
                    border: "1px solid #99f6e4",
                  }}
                >
                  <Icon name="pin" size={13} />
                  GPS Active ({locationState.latitude.toFixed(3)}°,{" "}
                  {locationState.longitude.toFixed(3)}°)
                </span>
              )}
              {locationState.status === "loading" && (
                <span
                  style={{
                    fontSize: 12,
                    color: "var(--coral)",
                    fontWeight: 600,
                  }}
                >
                  Detecting current coordinates…
                </span>
              )}
              {appliedCity && locationState.status !== "granted" && (
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 5,
                    fontSize: 12,
                    fontWeight: 700,
                    color: "#4338ca",
                    background: "#e0e7ff",
                    padding: "3px 8px",
                    borderRadius: 8,
                    border: "1px solid #c7d2fe",
                  }}
                >
                  <Icon name="location" size={13} />
                  City: {appliedCity}
                </span>
              )}
              {locationState.status === "idle" && !appliedCity && (
                <span style={{ fontSize: 12, color: "var(--muted)" }}>
                  Default (Near Current Area)
                </span>
              )}
            </div>

            <div style={{ display: "flex", gap: 8 }}>
              {locationState.status !== "granted" && (
                <Button
                  variant="secondary"
                  onClick={handleRequestLocation}
                  disabled={locationState.status === "loading"}
                  style={{ padding: "6px 12px", fontSize: 12 }}
                >
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 5,
                    }}
                  >
                    <Icon name="pin" size={14} />
                    {locationState.status === "loading"
                      ? "Detecting…"
                      : "Use My Location"}
                  </span>
                </Button>
              )}
              {(locationState.status === "granted" || appliedCity) && (
                <button
                  type="button"
                  onClick={handleClearLocation}
                  style={{
                    background: "none",
                    border: "none",
                    color: "var(--muted)",
                    fontSize: 12,
                    cursor: "pointer",
                    textDecoration: "underline",
                  }}
                >
                  Reset Location
                </button>
              )}
            </div>
          </div>

          {(locationState.status === "denied" ||
            locationState.status === "error") && (
            <div
              style={{
                fontSize: 12,
                color: "#991b1b",
                background: "#fee2e2",
                padding: "8px 12px",
                borderRadius: 8,
                border: "1px solid #fecaca",
                lineHeight: 1.35,
              }}
            >
              <strong>Notice:</strong> {locationState.message}
            </div>
          )}

          <form
            onSubmit={handleApplyManualCity}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginTop: 2,
            }}
          >
            <label
              htmlFor={manualCityInputId}
              className="sr-only"
              style={{
                position: "absolute",
                width: 1,
                height: 1,
                overflow: "hidden",
                clip: "rect(0 0 0 0)",
              }}
            >
              Search city or area
            </label>
            <input
              id={manualCityInputId}
              type="text"
              value={manualCity}
              onChange={(e) => setManualCity(e.target.value)}
              placeholder="Or enter city / area (e.g., Dehradun, Koramangala, Connaught Place)…"
              style={{
                flex: 1,
                padding: "8px 12px",
                borderRadius: 10,
                border: "1.5px solid var(--line)",
                fontSize: 12.5,
                background: "#fff",
              }}
            />
            <Button
              type="submit"
              variant="dark"
              style={{
                padding: "8px 14px",
                fontSize: 12,
                whiteSpace: "nowrap",
              }}
            >
              Set Area
            </Button>
          </form>
        </div>
      </div>

      <div
        className="cafe-cards-grid"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
          gap: 16,
          width: "100%",
        }}
      >
        {CAFE_CATEGORIES.map((cat) => {
          const destinationUrl = getMapsUrl(cat)
          return (
            <div
              key={cat.id}
              className="cafe-card"
              style={{
                background: "var(--paper)",
                border: "1.5px solid var(--ink)",
                borderRadius: 18,
                padding: 16,
                boxShadow: "3px 4px 0 var(--ink)",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                gap: 12,
              }}
            >
              <div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    gap: 8,
                  }}
                >
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 10 }}
                  >
                    <span
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 12,
                        background:
                          cat.color === "yellow"
                            ? "var(--yellow)"
                            : cat.color === "peach"
                              ? "var(--peach)"
                              : "var(--lavender)",
                        border: "1.5px solid var(--ink)",
                        display: "grid",
                        placeItems: "center",
                        flexShrink: 0,
                      }}
                    >
                      <Icon name={cat.icon} size={20} />
                    </span>
                    <div>
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 800,
                          letterSpacing: 0.8,
                          color: "var(--coral)",
                          textTransform: "uppercase",
                        }}
                      >
                        {cat.tag}
                      </span>
                      <strong
                        style={{
                          display: "block",
                          fontSize: 15,
                          color: "var(--ink)",
                          lineHeight: 1.25,
                        }}
                      >
                        {cat.title}
                      </strong>
                    </div>
                  </div>
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      padding: "2px 7px",
                      borderRadius: 6,
                      background: "#f1edf7",
                      border: "1px solid var(--line)",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {cat.badge}
                  </span>
                </div>

                <p
                  style={{
                    margin: "10px 0 8px",
                    fontSize: 13,
                    color: "var(--muted)",
                    lineHeight: 1.4,
                  }}
                >
                  {cat.description}
                </p>

                <div
                  style={{
                    background: "rgba(255, 140, 115, 0.08)",
                    borderLeft: "3px solid var(--coral)",
                    padding: "7px 10px",
                    borderRadius: 6,
                    fontSize: 12,
                    color: "var(--ink)",
                    lineHeight: 1.35,
                  }}
                >
                  <strong>💡 Student Tip:</strong> {cat.studentTip}
                </div>
              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginTop: 4,
                }}
              >
                <span style={{ fontSize: 11, color: "var(--muted)" }}>
                  {locationState.status === "granted"
                    ? "📍 Nearest to your GPS"
                    : appliedCity
                      ? `🔍 In ${appliedCity}`
                      : "🗺️ Local search"}
                </span>
                <a
                  href={destinationUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="button button-primary"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    textDecoration: "none",
                    fontSize: 12,
                    padding: "7px 12px",
                  }}
                >
                  <span>Search on Maps</span>
                  <Icon name="arrow" size={13} />
                </a>
              </div>
            </div>
          )
        })}
      </div>

      <div
        style={{
          padding: "12px 14px",
          background: "#f8f9fa",
          border: "1px dashed var(--line)",
          borderRadius: 12,
          fontSize: 12,
          color: "var(--muted)",
          lineHeight: 1.4,
          display: "flex",
          alignItems: "flex-start",
          gap: 8,
        }}
      >
        <span style={{ fontSize: 15 }}>ℹ️</span>
        <div>
          <strong>Authentic Google Maps Results:</strong> PlanzyPop initiates
          direct Google Maps search queries to provide live, real-time venue
          listings, verified business hours, real customer reviews, and actual
          photos. PlanzyPop does not fabricate listings or invent artificial
          star ratings. Venue results will vary depending on your current
          geographic location.
        </div>
      </div>
    </div>
  )
}
