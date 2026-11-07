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
    <nav className="bottom-nav">
      {items.map((item) => (
        <button
          type="button"
          key={item.screen}
          className={`${activeScreen === item.screen ? "active" : ""} ${
            item.screen === "planner" ? "planner-nav" : ""
          }`}
          onClick={() => onNavigate(item.screen)}
        >
          <span className="nav-icon">
            <Icon name={item.icon} filled={activeScreen === item.screen} />
          </span>
          <span>{item.label}</span>
        </button>
      ))}
    </nav>
  )
}
