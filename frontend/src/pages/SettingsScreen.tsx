/**
 * PlanzyPop - Settings Screen
 * Academic Mini-Project for M.Sc. Computer Science (Data Science)
 */

import { useState } from "react"
import type { Screen } from "../types"
import { Header } from "../components/common/Header"
import { Icon } from "../components/common/Icon"

export function SettingsScreen({
  go,
  notify,
}: {
  go: (s: Screen) => void
  notify: (m: string) => void
}) {
  const [notifications, setNotifications] = useState(true)
  const [tips, setTips] = useState(true)

  return (
    <div className="screen">
      <Header
        title="Settings"
        eyebrow="PLANZYPOP"
        onBack={() => go("profile")}
      />
      <div className="settings-group">
        <div className="settings-label">PREFERENCES</div>
        <div className="menu-card">
          <div className="setting-row">
            <span className="menu-icon">
              <Icon name="bell" size={20} />
            </span>
            <div>
              <strong>Event reminders</strong>
              <small>Tasks, dates and budgets</small>
            </div>
            <button
              type="button"
              className={`toggle ${notifications ? "on" : ""}`}
              onClick={() => setNotifications(!notifications)}
            >
              <span />
            </button>
          </div>
          <div className="setting-row">
            <span className="menu-icon">
              <Icon name="sparkle" size={20} />
            </span>
            <div>
              <strong>Smart suggestion tips</strong>
              <small>Helpful ideas for your events</small>
            </div>
            <button
              type="button"
              className={`toggle ${tips ? "on" : ""}`}
              onClick={() => setTips(!tips)}
            >
              <span />
            </button>
          </div>
        </div>
      </div>
      <div className="settings-group">
        <div className="settings-label">APP SETTINGS</div>
        <div className="menu-card">
          <button type="button" onClick={() => notify("Theme set to Light")}>
            <span className="menu-icon">
              <Icon name="moon" size={20} />
            </span>
            <strong>Theme</strong>
            <small>Light</small>
            <Icon name="chevron" size={17} />
          </button>
          <button type="button" onClick={() => notify("Currency set to INR (₹)")}>
            <span className="menu-icon">
              <Icon name="wallet" size={20} />
            </span>
            <strong>Currency</strong>
            <small>INR (₹)</small>
            <Icon name="chevron" size={17} />
          </button>
        </div>
      </div>
      <div className="settings-group">
        <div className="settings-label">SUPPORT</div>
        <div className="menu-card">
          <button type="button" onClick={() => notify("Contact campus host support")}>
            <span className="menu-icon">
              <Icon name="help" size={20} />
            </span>
            <strong>Help centre</strong>
            <Icon name="chevron" size={17} />
          </button>
          <button type="button" onClick={() => notify("Thank you for using PlanzyPop!")}>
            <span className="menu-icon">
              <Icon name="edit" size={20} />
            </span>
            <strong>Send feedback</strong>
            <Icon name="chevron" size={17} />
          </button>
        </div>
      </div>
      <p className="settings-note">
        PlanzyPop stores your event data locally in your SQLite database.
        Zero third-party tracking.
      </p>
    </div>
  )
}
