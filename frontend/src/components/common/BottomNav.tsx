import type { NavItem, Screen } from "../../types"
import { Icon } from "./Icon"

export function BottomNav({
  screen,
  onNavigate,
}: {
  screen: Screen
  onNavigate: (screen: Screen) => void
}) {
  const items: NavItem[] = [
    { screen: "overview", icon: "home", label: "Overview" },
    { screen: "events", icon: "calendar", label: "My Events" },
    { screen: "planner", icon: "sparkle", label: "Suggestions" },
    { screen: "nearby", icon: "pin", label: "Nearby" },
    { screen: "profile", icon: "user", label: "Preferences" },
  ]
  return (
    <nav className="bottom-nav">
      {items.map((item) => (
        <button
          type="button"
          key={item.screen}
          className={`${screen === item.screen ? "active" : ""} ${
            item.screen === "planner" ? "planner-nav" : ""
          }`}
          onClick={() => onNavigate(item.screen)}
        >
          <span className="nav-icon">
            <Icon name={item.icon} filled={screen === item.screen} />
          </span>
          <span>{item.label}</span>
        </button>
      ))}
    </nav>
  )
}
