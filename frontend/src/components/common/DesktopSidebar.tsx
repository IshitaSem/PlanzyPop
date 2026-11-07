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
    { screen: "events", icon: "calendar", label: "My Events" },
    { screen: "planner", icon: "sparkle", label: "Smart Suggestions" },
    { screen: "nearby", icon: "pin", label: "Nearby Finds" },
    { screen: "profile", icon: "user", label: "Preferences" },
  ]
  const activeScreen =
    screen === "event-detail" || screen === "budget" || screen === "checklist"
      ? "events"
      : screen === "settings"
        ? "profile"
        : screen === "inspiration" || screen === "idea-detail"
          ? "overview"
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
