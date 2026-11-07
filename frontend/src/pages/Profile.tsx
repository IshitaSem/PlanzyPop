/**
 * PlanzyPop - User Preferences Screen
 * Academic Mini-Project for M.Sc. Computer Science (Data Science)
 */

import { useState } from "react"
import type { Screen } from "../types"
import { formatINR } from "../utils/formatters"
import { Header } from "../components/common/Header"
import { Icon } from "../components/common/Icon"
import { SectionTitle } from "../components/common/SectionTitle"

export function Profile({
  go,
  notify,
  userName,
  onUpdateUserName,
  eventsCount,
  totalBudget,
}: {
  go: (s: Screen) => void
  notify: (m: string) => void
  userName: string
  onUpdateUserName: (name: string) => void
  eventsCount: number
  totalBudget: number
}) {
  const [editingName, setEditingName] = useState(false)
  const [tempName, setTempName] = useState(userName)
  const [collegeGroup, setCollegeGroup] = useState(
    () =>
      localStorage.getItem("planzypop_group") || "Hostel Batch / University",
  )
  const [editingGroup, setEditingGroup] = useState(false)
  const [tempGroup, setTempGroup] = useState(collegeGroup)
  const [defaultStyle, setDefaultStyle] = useState(
    () => localStorage.getItem("planzypop_style") || "Hostel & Casual",
  )
  const [reminders, setReminders] = useState(
    () => localStorage.getItem("planzypop_reminders") !== "false",
  )
  const [tips, setTips] = useState(
    () => localStorage.getItem("planzypop_tips") !== "false",
  )

  const handleSaveName = () => {
    if (tempName.trim()) {
      onUpdateUserName(tempName.trim())
      setEditingName(false)
      notify("Host name updated!")
    }
  }

  const handleSaveGroup = () => {
    if (tempGroup.trim()) {
      setCollegeGroup(tempGroup.trim())
      localStorage.setItem("planzypop_group", tempGroup.trim())
      setEditingGroup(false)
      notify("Group details updated!")
    }
  }

  const handleStyleChange = (newStyle: string) => {
    setDefaultStyle(newStyle)
    localStorage.setItem("planzypop_style", newStyle)
    notify(`Default style set to ${newStyle}`)
  }

  const handleToggleReminders = () => {
    const next = !reminders
    setReminders(next)
    localStorage.setItem("planzypop_reminders", String(next))
    notify(next ? "Event reminders enabled" : "Event reminders paused")
  }

  const handleToggleTips = () => {
    const next = !tips
    setTips(next)
    localStorage.setItem("planzypop_tips", String(next))
    notify(
      next ? "Smart suggestion tips enabled" : "Smart suggestion tips paused",
    )
  }

  return (
    <div className="screen profile-screen">
      <Header title="Preferences" eyebrow="STUDENT HOST SETTINGS" />

      <div className="profile-card">
        <div className="profile-avatar">
          {userName.charAt(0).toUpperCase()}
          <span>
            <Icon name="sparkle" size={14} />
          </span>
        </div>
        <div style={{ flex: 1 }}>
          {editingName ? (
            <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
              <input
                className="text-field"
                value={tempName}
                onChange={(e) => setTempName(e.target.value)}
                placeholder="Enter host name"
                style={{ padding: "6px 10px", fontSize: 15 }}
                autoFocus
              />
              <button
                type="button"
                className="button"
                style={{ padding: "6px 12px", fontSize: 13 }}
                onClick={handleSaveName}
              >
                Save
              </button>
            </div>
          ) : (
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div className="profile-name">{userName}</div>
              <button
                type="button"
                onClick={() => {
                  setTempName(userName)
                  setEditingName(true)
                }}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "var(--purple)",
                  padding: 2,
                }}
                title="Edit name"
              >
                <Icon name="edit" size={15} />
              </button>
            </div>
          )}

          {editingGroup ? (
            <div
              style={{
                display: "flex",
                gap: 6,
                alignItems: "center",
                marginTop: 4,
              }}
            >
              <input
                className="text-field"
                value={tempGroup}
                onChange={(e) => setTempGroup(e.target.value)}
                placeholder="e.g. Hostel Wing / Batch"
                style={{ padding: "4px 8px", fontSize: 12 }}
              />
              <button
                type="button"
                className="button"
                style={{ padding: "4px 8px", fontSize: 12 }}
                onClick={handleSaveGroup}
              >
                Save
              </button>
            </div>
          ) : (
            <p
              style={{
                margin: "2px 0 0",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 4,
                color: "var(--muted)",
              }}
              onClick={() => {
                setTempGroup(collegeGroup)
                setEditingGroup(true)
              }}
            >
              <span>{collegeGroup}</span>
              <Icon name="edit" size={12} />
            </p>
          )}
          <span
            className="plan-badge"
            style={{ marginTop: 6, display: "inline-block" }}
          >
            STUDENT HOST
          </span>
        </div>
      </div>

      <div className="profile-stats">
        <div>
          <strong>{eventsCount}</strong>
          <span>Events</span>
        </div>
        <div>
          <strong>{formatINR(totalBudget)}</strong>
          <span>Budget</span>
        </div>
        <div>
          <strong style={{ color: "var(--purple)" }}>FastAPI</strong>
          <span>SQLite DB</span>
        </div>
      </div>

      <SectionTitle title="App Preferences" />
      <div className="menu-card">
        <div
          className="setting-row"
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "14px 16px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span className="menu-icon">
              <Icon name="bell" size={20} />
            </span>
            <div>
              <strong>Event Reminders</strong>
              <small
                style={{
                  display: "block",
                  color: "var(--muted)",
                  fontSize: 11,
                }}
              >
                Active alerts in notification panel
              </small>
            </div>
          </div>
          <button
            type="button"
            className={`toggle ${reminders ? "on" : ""}`}
            onClick={handleToggleReminders}
          >
            <span />
          </button>
        </div>

        <div
          className="setting-row"
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "14px 16px",
            borderTop: "1px solid var(--line)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span className="menu-icon">
              <Icon name="sparkle" size={20} />
            </span>
            <div>
              <strong>Rule Engine Guidance</strong>
              <small
                style={{
                  display: "block",
                  color: "var(--muted)",
                  fontSize: 11,
                }}
              >
                Smart celebration & budget tips
              </small>
            </div>
          </div>
          <button
            type="button"
            className={`toggle ${tips ? "on" : ""}`}
            onClick={handleToggleTips}
          >
            <span />
          </button>
        </div>

        <div
          style={{ padding: "14px 16px", borderTop: "1px solid var(--line)" }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              marginBottom: 8,
            }}
          >
            <span className="menu-icon">
              <Icon name="party" size={20} />
            </span>
            <strong>Default Celebration Style</strong>
          </div>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 6,
              marginLeft: 32,
            }}
          >
            {[
              "Hostel & Casual",
              "Potluck & DIY",
              "Aesthetic & Cozy",
              "Rooftop Party",
              "Campus Farewell",
            ].map((s) => (
              <button
                type="button"
                key={s}
                onClick={() => handleStyleChange(s)}
                style={{
                  fontSize: 11.5,
                  padding: "5px 10px",
                  borderRadius: 14,
                  border:
                    defaultStyle === s
                      ? "1.5px solid var(--ink)"
                      : "1px solid var(--line)",
                  background:
                    defaultStyle === s ? "var(--yellow)" : "var(--paper)",
                  fontWeight: defaultStyle === s ? 700 : 500,
                  cursor: "pointer",
                }}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "14px 16px",
            borderTop: "1px solid var(--line)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span className="menu-icon">
              <Icon name="wallet" size={20} />
            </span>
            <div>
              <strong>Currency Standard</strong>
              <small
                style={{
                  display: "block",
                  color: "var(--muted)",
                  fontSize: 11,
                }}
              >
                Standard Indian Rupee formatting
              </small>
            </div>
          </div>
          <strong style={{ fontSize: 13, color: "var(--ink)" }}>INR (₹)</strong>
        </div>
      </div>

      <SectionTitle title="Academic Mini-Project Information" />
      <div className="menu-card" style={{ padding: 16 }}>
        <div style={{ fontSize: 13, lineHeight: 1.6, color: "var(--ink)" }}>
          <div style={{ fontWeight: 800, fontSize: 14, marginBottom: 4 }}>
            PlanzyPop – Event Planning & Budget Management System
          </div>
          <p style={{ margin: "0 0 8px", color: "var(--muted)", fontSize: 12 }}>
            M.Sc. Computer Science (Data Science) University Mini-Project.
          </p>
          <ul
            style={{
              margin: "4px 0 0",
              paddingLeft: 18,
              fontSize: 12,
              color: "var(--muted)",
            }}
          >
            <li>
              <strong>Backend:</strong> Python 3.14 + FastAPI REST API
            </li>
            <li>
              <strong>Database:</strong> SQLite with SQLAlchemy ORM and cascade
              constraints
            </li>
            <li>
              <strong>Recommendation Engine:</strong> Rule-based heuristic
              expert engine
            </li>
            <li>
              <strong>Frontend:</strong> React 19 + TypeScript + Vite responsive
              SPA
            </li>
          </ul>
        </div>
      </div>

      <div className="profile-footer">Your Plans. Your Party. Your Budget.</div>
    </div>
  )
}
