/**
 * PlanzyPop - Nearby Finds & Google Maps Suggestions Screen
 * M.Sc. Computer Science (Data Science) Mini-Project
 *
 * Integrates:
 * 1. Google Maps-powered Nearby Café & Venue Suggestions with Geolocation
 * 2. Curated Celebration Supplies & Local Party Service Categories
 */

import { useState, useMemo } from "react"
import { Header } from "../components/common/Header"
import { Icon } from "../components/common/Icon"
import { Button } from "../components/common/Button"
import { CafeSuggestions } from "../components/nearby/CafeSuggestions"
import { NEARBY_CATEGORIES } from "../utils/constants"

export function Nearby() {
  const [activeTab, setActiveTab] = useState<"cafes" | "supplies">("cafes")
  const [filter, setFilter] = useState("All")
  const [search, setSearch] = useState("")

  const filteredCategories = useMemo(() => {
    return NEARBY_CATEGORIES.filter((cat) => {
      const matchesFilter =
        filter === "All" || cat.category.toLowerCase() === filter.toLowerCase()
      const matchesSearch =
        !search.trim() ||
        cat.title.toLowerCase().includes(search.toLowerCase()) ||
        cat.description.toLowerCase().includes(search.toLowerCase()) ||
        cat.studentTip.toLowerCase().includes(search.toLowerCase())
      return matchesFilter && matchesSearch
    })
  }, [filter, search])

  return (
    <div className="screen nearby-screen">
      <Header
        title="Nearby Finds & Cafés"
        eyebrow="LOCAL VENUES & GOOGLE MAPS SEARCH"
      />

      {/* Top View Toggle Tabs */}
      <div
        className="nearby-tabs"
        style={{
          display: "flex",
          gap: 8,
          background: "#f0edf7",
          padding: 5,
          borderRadius: 14,
          border: "1.5px solid var(--line)",
          marginBottom: 20,
          width: "100%",
          maxWidth: 640,
        }}
      >
        <button
          type="button"
          onClick={() => setActiveTab("cafes")}
          style={{
            flex: 1,
            padding: "9px 14px",
            borderRadius: 10,
            border: activeTab === "cafes" ? "1.5px solid var(--ink)" : "none",
            background: activeTab === "cafes" ? "var(--yellow)" : "transparent",
            fontWeight: 700,
            fontSize: 13,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
            boxShadow: activeTab === "cafes" ? "2px 2px 0 var(--ink)" : "none",
            transition: "all 0.15s ease",
          }}
        >
          <Icon name="coffee" size={17} />
          <span>Nearby Cafés (Google Maps)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("supplies")}
          style={{
            flex: 1,
            padding: "9px 14px",
            borderRadius: 10,
            border:
              activeTab === "supplies" ? "1.5px solid var(--ink)" : "none",
            background:
              activeTab === "supplies" ? "var(--lavender)" : "transparent",
            fontWeight: 700,
            fontSize: 13,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
            boxShadow:
              activeTab === "supplies" ? "2px 2px 0 var(--ink)" : "none",
            transition: "all 0.15s ease",
          }}
        >
          <Icon name="gift" size={17} />
          <span>Party Supplies & Services</span>
        </button>
      </div>

      {/* View 1: Nearby Café Suggestions (PART 2) */}
      {activeTab === "cafes" && <CafeSuggestions />}

      {/* View 2: Existing Celebration Supplies & Local Categories */}
      {activeTab === "supplies" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div className="search-bar">
            <Icon name="search" size={19} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search bakeries, party supplies, snacks, rentals…"
            />
            {search ? (
              <button
                type="button"
                onClick={() => setSearch("")}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "var(--muted)",
                  padding: 4,
                }}
              >
                ✕
              </button>
            ) : (
              <Icon name="location" size={18} />
            )}
          </div>

          <div className="filter-row">
            {[
              "All",
              "Bakery",
              "Decor",
              "Food",
              "Venues",
              "Printing",
              "Audio",
            ].map((item) => (
              <button
                type="button"
                key={item}
                className={filter === item ? "active" : ""}
                onClick={() => setFilter(item)}
              >
                {item}
              </button>
            ))}
          </div>

          <div className="nearby-heading">
            <div>
              <strong>Celebration Supply Categories</strong>
              <span>Practical local resources for college celebrations</span>
            </div>
          </div>

          <div
            className="nearby-categories-list"
            style={{ display: "flex", flexDirection: "column", gap: 14 }}
          >
            {filteredCategories.map((cat) => (
              <div
                key={cat.id}
                className="nearby-category-card"
                style={{
                  background: "var(--paper)",
                  border: "1.5px solid var(--ink)",
                  borderRadius: 20,
                  padding: 16,
                  boxShadow: "3px 4px 0 var(--ink)",
                  display: "flex",
                  flexDirection: "column",
                  gap: 10,
                }}
              >
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
                          fontSize: 16,
                          color: "var(--ink)",
                        }}
                      >
                        {cat.title}
                      </strong>
                    </div>
                  </div>
                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: 700,
                      padding: "3px 8px",
                      borderRadius: 8,
                      background: "#f1edf7",
                      border: "1px solid var(--line)",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {cat.priceRange}
                  </span>
                </div>

                <p
                  style={{
                    margin: 0,
                    fontSize: 13,
                    color: "var(--muted)",
                    lineHeight: 1.4,
                  }}
                >
                  {cat.description}
                </p>

                <div
                  style={{
                    background: "rgba(255, 140, 115, 0.1)",
                    borderLeft: "3px solid var(--coral)",
                    padding: "8px 12px",
                    borderRadius: 8,
                    fontSize: 12,
                    color: "var(--ink)",
                    lineHeight: 1.35,
                  }}
                >
                  <strong>💡 Student Tip:</strong> {cat.studentTip}
                </div>

                <div
                  style={{
                    display: "flex",
                    justifyContent: "flex-end",
                    marginTop: 4,
                  }}
                >
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                      cat.mapsQuery,
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="button button-secondary"
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                      textDecoration: "none",
                      fontSize: 12.5,
                      padding: "8px 14px",
                    }}
                  >
                    <span>Search on Google Maps</span>
                    <Icon name="arrow" size={13} />
                  </a>
                </div>
              </div>
            ))}
            {filteredCategories.length === 0 && (
              <div
                style={{
                  textAlign: "center",
                  padding: "40px 16px",
                  color: "var(--muted)",
                }}
              >
                <p>No matching categories found for &quot;{search}&quot;.</p>
                <Button
                  variant="secondary"
                  onClick={() => {
                    setSearch("")
                    setFilter("All")
                  }}
                >
                  Reset Filters
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
