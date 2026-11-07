import type { NavItem, Screen } from "../../types"
import { Icon } from "./Icon"

export function DesktopSidebar({
  screen,
  onNavigate,
  userName,
}: {
  screen: Screen
  onNavigate: (screen: Screen) => void
  userName: string
}) {
  const items: NavItem[] = [
    { screen: "overview", icon: "home", label: "Overview" },
    { screen: "planner", icon: "sparkle", label: "AI Planner" },
    { screen: "nearby", icon: "pin", label: "Explore Spots" },
    { screen: "events", icon: "calendar", label: "My Plans" },
    { screen: "budget", icon: "wallet", label: "My Budget" },
    { screen: "insights", icon: "star", label: "Insights" },
    { screen: "settings", icon: "settings", label: "Settings" },
  ]
  const activeScreen =
    screen === "event-detail" || screen === "checklist"
      ? "events"
      : screen === "place-detail"
        ? "nearby"
        : screen === "profile"
          ? "settings"
          : screen

  return (
    <aside className="desktop-sidebar">
      <div className="sidebar-brand">
        <span className="brand-mark">
          <Icon name="sparkle" size={18} />
        </span>
        <div>
          <strong>PlanzyPop</strong>
          <span>Event workspace</span>
        </div>
      </div>
      <nav className="sidebar-nav">
        <span className="sidebar-label">WORKSPACE</span>
        {items.map((item) => (
          <button
            type="button"
            key={item.screen}
            className={activeScreen === item.screen ? "active" : ""}
            onClick={() => onNavigate(item.screen)}
          >
            <span>
              <Icon name={item.icon} size={20} />
            </span>
            <strong>{item.label}</strong>
          </button>
        ))}
      </nav>
      <div className="sidebar-spacer" />
      <div
        className="sidebar-user"
        onClick={() => onNavigate("profile")}
        style={{ cursor: "pointer" }}
      >
        <span className="avatar">{userName.charAt(0).toUpperCase()}</span>
        <div>
          <strong>{userName}</strong>
          <small>Student Host</small>
        </div>
        <Icon name="chevron" size={16} />
      </div>
    </aside>
  )
}
