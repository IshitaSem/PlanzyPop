import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from "react"
import {
  searchSpots,
  saveSpotFavorite,
  removeSpotFavorite,
  getSpotFavorites,
  getSpotDetails,
  getChandigarhSectors,
  generateSuggestions,
  createEvent,
  getEvents,
  login as apiLogin,
  register as apiRegister,
  logout as apiLogout,
  getCurrentUser,
  getAuthToken,
  getStoredUser,
  API_BASE_URL,
  type SpotItem,
  type SuggestionResponse,
  type UserInfo,
  type SpotFavorite,
} from "./services/api"
import { SpotMap } from "./components/nearby/SpotMap"

type Screen = "overview" | "events" | "planner" | "nearby" | "profile" | "event-detail" | "budget" | "checklist" | "place-detail" | "insights" | "settings"

type IconName = "home" | "calendar" | "sparkle" | "pin" | "user" | "bell" | "arrow" | "wallet" | "check" | "bulb" | "plus" | "people" | "clock" | "back" | "bookmark" | "search" | "star" | "route" | "edit" | "settings" | "help" | "moon" | "logout" | "chevron" | "cake" | "house" | "college" | "party" | "picnic" | "movie" | "location" | "food" | "music" | "gift" | "download" | "refresh" | "coffee"

type NavItem = {
  screen: Screen
  icon: IconName
  label: string
}

type EventCategory = {
  label: string
  icon: IconName
  color: string
}

type AuthScreen = "welcome" | "login" | "signup" | "forgot" | "registered"

const images = {
  birthday:
    "https://images.unsplash.com/photo-1714978444614-7a197c2309ee?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&q=82&w=900",
  decor:
    "https://images.unsplash.com/photo-1531956531700-dc0ee0f1f9a5?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&q=82&w=900",
  cafe: "https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&w=900&q=82",
  games:
    "https://images.unsplash.com/photo-1610890716171-6b1bb98ffd09?auto=format&fit=crop&w=900&q=82",
  picnic:
    "https://images.unsplash.com/photo-1496545672447-f699b503d270?auto=format&fit=crop&w=900&q=82",
  cake: "https://images.unsplash.com/photo-1555607124-8531c7c702d0?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&q=82&w=900",
  balloons:
    "https://images.unsplash.com/photo-1530103862676-de8c9debad1d?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&q=82&w=900",
}

const iconPaths: Record<IconName, ReactNode> = {
  coffee: (
    <>
      <path d="M18 8h1a4 4 0 0 1 0 8h-1M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8ZM6 1v3M10 1v3M14 1v3" />
    </>
  ),
  home: (
    <>
      <path d="M3 10.8 12 3l9 7.8" />
      <path d="M5.5 9.5V21h13V9.5M9 21v-7h6v7" />
    </>
  ),
  calendar: (
    <>
      <rect x="3" y="5" width="18" height="16" rx="3" />
      <path d="M8 3v4M16 3v4M3 10h18M7.5 14h.01M12 14h.01M16.5 14h.01M7.5 18h.01M12 18h.01" />
    </>
  ),
  sparkle: (
    <>
      <path d="m12 2 1.4 4.6L18 8l-4.6 1.4L12 14l-1.4-4.6L6 8l4.6-1.4L12 2Z" />
      <path d="m19 14 .8 2.2L22 17l-2.2.8L19 20l-.8-2.2L16 17l2.2-.8L19 14ZM5 14l.7 1.8 1.8.7-1.8.7L5 19l-.7-1.8-1.8-.7 1.8-.7L5 14Z" />
    </>
  ),
  pin: (
    <>
      <path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" />
      <circle cx="12" cy="10" r="2.5" />
    </>
  ),
  user: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4.5 21a7.5 7.5 0 0 1 15 0" />
    </>
  ),
  bell: (
    <>
      <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9ZM10 21h4" />
    </>
  ),
  arrow: (
    <>
      <path d="M5 12h14M14 7l5 5-5 5" />
    </>
  ),
  wallet: (
    <>
      <path d="M4 6.5A2.5 2.5 0 0 1 6.5 4H19v16H6.5A2.5 2.5 0 0 1 4 17.5v-11Z" />
      <path d="M4 8h15M15 12h6v5h-6a2.5 2.5 0 0 1 0-5Z" />
    </>
  ),
  check: <path d="m5 12 4 4L19 6" />,
  bulb: (
    <>
      <path d="M9 18h6M10 22h4" />
      <path d="M8.2 14.5A7 7 0 1 1 15.8 14.5C14.7 15.3 15 17 15 18H9c0-1 .3-2.7-.8-3.5Z" />
    </>
  ),
  plus: <path d="M12 5v14M5 12h14" />,
  people: (
    <>
      <circle cx="9" cy="8" r="3" />
      <path d="M3 19a6 6 0 0 1 12 0M16 6a3 3 0 0 1 0 6M17 14a5 5 0 0 1 4 5" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </>
  ),
  back: (
    <>
      <path d="m15 5-7 7 7 7" />
    </>
  ),
  bookmark: <path d="M6 3h12v18l-6-4-6 4V3Z" />,
  search: (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-4-4" />
    </>
  ),
  star: (
    <path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2L12 17.3l-5.6 2.9 1.1-6.2L3 9.6l6.2-.9L12 3Z" />
  ),
  route: (
    <>
      <path d="M5 19c4-1 2-6 6-7s2-5 7-6" />
      <circle cx="5" cy="19" r="2" />
      <circle cx="18" cy="6" r="2" />
    </>
  ),
  edit: (
    <>
      <path d="m14 5 5 5M4 20l3.5-.8L20 6.7 17.3 4 4.8 16.5 4 20Z" />
    </>
  ),
  settings: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M19 13.5v-3l-2-.6a6 6 0 0 0-.6-1.4l1-1.8-2.1-2.1-1.8 1A6 6 0 0 0 12 5l-.6-2h-3l-.6 2a6 6 0 0 0-1.4.6l-1.8-1-2.1 2.1 1 1.8A6 6 0 0 0 3 10l-2 .6v3l2 .6a6 6 0 0 0 .6 1.4l-1 1.8 2.1 2.1 1.8-1a6 6 0 0 0 1.4.6l.6 2h3l.6-2a6 6 0 0 0 1.4-.6l1.8 1 2.1-2.1-1-1.8a6 6 0 0 0 .6-1.4l2-.7Z" />
    </>
  ),
  help: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M9.8 9a2.3 2.3 0 1 1 3.8 1.8c-1 .7-1.6 1.2-1.6 2.7M12 17.5h.01" />
    </>
  ),
  moon: <path d="M20 15.5A8.5 8.5 0 0 1 8.5 4 8.5 8.5 0 1 0 20 15.5Z" />,
  logout: (
    <>
      <path d="M10 5H4v14h6M14 8l4 4-4 4M8 12h10" />
    </>
  ),
  chevron: <path d="m9 5 7 7-7 7" />,
  cake: (
    <>
      <path d="M4 11h16v9H4zM7 11V8h10v3M12 8V4M10.5 4 12 2l1.5 2" />
      <path d="M4 15c2 2 4-2 6 0s4-2 6 0 3-1 4 0" />
    </>
  ),
  house: (
    <>
      <path d="m3 11 9-8 9 8M5 10v11h14V10M9 21v-7h6v7" />
    </>
  ),
  college: (
    <>
      <path d="m2 9 10-5 10 5-10 5L2 9Z" />
      <path d="M6 11v5c3 3 9 3 12 0v-5M22 9v7" />
    </>
  ),
  party: (
    <>
      <path d="m4 20 5-16 11 11L4 20Z" />
      <path d="M10 7c1.5 1 2.5 2.5 3 4M7 13c2 .2 3.5 1 5 2M17 3v3M21 7h-3M17 9l2 2" />
    </>
  ),
  picnic: (
    <>
      <path d="M4 10h16l-2 10H6L4 10ZM8 10V7a4 4 0 0 1 8 0v3M4 14h16M10 10l-1 10M14 10l1 10" />
    </>
  ),
  movie: (
    <>
      <rect x="3" y="5" width="18" height="15" rx="2" />
      <path d="M3 10h18M7 5l3 5M13 5l3 5" />
    </>
  ),
  location: (
    <>
      <path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" />
      <circle cx="12" cy="10" r="2.5" />
    </>
  ),
  food: (
    <>
      <path d="M7 3v8M4 3v5a3 3 0 0 0 6 0V3M7 11v10M16 3c-2 3-2 7 1 9v9M17 12h2V3c-2 0-3 4-3 9Z" />
    </>
  ),
  music: (
    <>
      <path d="M9 18V5l10-2v13M9 9l10-2" />
      <circle cx="6" cy="18" r="3" />
      <circle cx="16" cy="16" r="3" />
    </>
  ),
  gift: (
    <>
      <rect x="3" y="8" width="18" height="13" rx="2" />
      <path d="M12 8v13M3 12h18M12 8H7.5A2.5 2.5 0 0 1 10 4c2 0 2 4 2 4ZM12 8h4.5A2.5 2.5 0 0 0 14 4c-2 0-2 4-2 4Z" />
    </>
  ),
  download: (
    <>
      <path d="M12 3v12M7 10l5 5 5-5M4 20h16" />
    </>
  ),
  refresh: (
    <>
      <path d="M20 7v5h-5M4 17v-5h5" />
      <path d="M6 8a7 7 0 0 1 12-2l2 3M18 16a7 7 0 0 1-12 2l-2-3" />
    </>
  ),
}

function Icon({
  name,
  size = 22,
  filled = false,
}: {
  name: IconName
  size?: number
  filled?: boolean
}) {
  return (
    <svg
      aria-hidden="true"
      className="icon"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {iconPaths[name]}
    </svg>
  )
}

function Button({
  children,
  onClick,
  className = "",
  variant = "primary",
  icon,
  disabled,
  type = "button",
}: {
  children: ReactNode
  onClick?: () => void
  className?: string
  variant?: "primary" | "secondary" | "ghost" | "dark"
  icon?: IconName
  disabled?: boolean
  type?: "button" | "submit"
}) {
  return (
    <button
      type={type}
      className={`button button-${variant} ${className}`}
      onClick={onClick}
      disabled={disabled}
    >
      <span>{children}</span>
      {icon && <Icon name={icon} size={19} />}
    </button>
  )
}

function IconButton({
  icon,
  label,
  onClick,
  active = false,
}: {
  icon: IconName
  label: string
  onClick?: () => void
  active?: boolean
}) {
  return (
    <button
      type="button"
      className={`icon-button ${active ? "active" : ""}`}
      onClick={onClick}
      aria-label={label}
    >
      <Icon name={icon} />
    </button>
  )
}

function Header({
  title,
  eyebrow,
  onBack,
  action,
}: {
  title: string
  eyebrow?: string
  onBack?: () => void
  action?: ReactNode
}) {
  return (
    <div className="page-header">
      <div className="header-left">
        {onBack && <IconButton icon="back" label="Go back" onClick={onBack} />}
        <div>
          {eyebrow && <div className="eyebrow">{eyebrow}</div>}
          <div className="page-title">{title}</div>
        </div>
      </div>
      {action}
    </div>
  )
}

function SectionTitle({
  title,
  action,
  onAction,
}: {
  title: string
  action?: string
  onAction?: () => void
}) {
  return (
    <div className="section-title">
      <div>{title}</div>
      {action && (
        <button type="button" onClick={onAction}>
          {action} <Icon name="arrow" size={15} />
        </button>
      )}
    </div>
  )
}

function Progress({
  value,
  color = "purple",
}: {
  value: number
  color?: "purple" | "coral" | "yellow"
}) {
  return (
    <div className="progress">
      <div
        className={`progress-value ${color}`}
        style={{ width: `${value}%` }}
      />
    </div>
  )
}

function BottomNav({
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

const categories: EventCategory[] = [
  { label: "Birthday", icon: "cake", color: "yellow" },
  { label: "House Party", icon: "house", color: "pink" },
  { label: "College Event", icon: "college", color: "green" },
  { label: "Get-together", icon: "party", color: "purple" },
  { label: "Picnic", icon: "picnic", color: "peach" },
  { label: "Movie Night", icon: "movie", color: "blue" },
]

const plannerCategories: EventCategory[] = [
  { label: "Birthday", icon: "cake", color: "yellow" },
  { label: "College Party", icon: "college", color: "green" },
  { label: "Farewell", icon: "party", color: "pink" },
  { label: "Hostel Party", icon: "house", color: "purple" },
  { label: "Picnic", icon: "picnic", color: "peach" },
  { label: "Get-together", icon: "people", color: "blue" },
  { label: "Other", icon: "plus", color: "lavender" },
]

function Overview({
  go,
  notify,
  currentUser,
  isGuest,
  events,
  favoritesCount,
}: {
  go: (s: Screen) => void
  notify: (m: string) => void
  currentUser: UserInfo | null
  isGuest: boolean
  events: EventPlan[]
  favoritesCount: number
}) {
  const totalBudget = events.reduce((acc, ev) => {
    const digits = ev.budget.replace(/[^0-9]/g, "")
    return acc + (parseInt(digits, 10) || 0)
  }, 0)

  const avatarInitial = isGuest
    ? "G"
    : currentUser?.name?.[0]?.toUpperCase() || "U"

  return (
    <div className="screen overview-screen">
      <div className="topbar">
        <div className="brand-lockup mobile-only-brand">
          <span className="brand-mark">
            <Icon name="sparkle" size={18} />
          </span>
          <span>PlanzyPop</span>
        </div>
        <div className="desktop-page-context">
          <div className="eyebrow">
            {isGuest ? "GUEST DEMO MODE · PREVIEW" : "PLANZYPOP WORKSPACE"}
          </div>
          <div>Overview</div>
        </div>
        <div className="top-actions">
          <IconButton
            icon="bell"
            label="Notifications"
            onClick={() => notify("You’re all caught up!")}
          />
          <button
            type="button"
            className="avatar"
            onClick={() => go("profile")}
          >
            {avatarInitial}
          </button>
        </div>
      </div>

      <div className="hello">
        <div className="eyebrow">
          {isGuest
            ? "WEDNESDAY, 6 NOV · GUEST DEMO MODE"
            : "WEDNESDAY, 6 NOV · YOUR DASHBOARD"}
        </div>
        <div className="hero-title">
          {isGuest ? (
            <>
              Hey, ready to <span className="party-squiggle">make some plans?</span>
            </>
          ) : events.length === 0 ? (
            <>
              Welcome! Start planning your{" "}
              <span className="party-squiggle">first celebration.</span>
            </>
          ) : (
            <>
              Hey {currentUser?.name?.split(" ")[0] || "there"}, ready to{" "}
              <span className="party-squiggle">make some plans?</span>
            </>
          )}
        </div>
      </div>

      <div className="overview-metrics">
        <div className="metric-card">
          <span className="metric-icon purple">
            <Icon name="calendar" size={19} />
          </span>
          <div>
            <span>Planned events</span>
            <strong>{isGuest ? 7 : events.length}</strong>
          </div>
          <small>
            {isGuest
              ? "3 upcoming"
              : events.length === 0
                ? "No plans yet"
                : `${events.length} planned`}
          </small>
        </div>
        <div className="metric-card">
          <span className="metric-icon peach">
            <Icon name="wallet" size={19} />
          </span>
          <div>
            <span>Total planned budget</span>
            <strong>
              {isGuest
                ? "₹20,000"
                : `₹${totalBudget.toLocaleString("en-IN")}`}
            </strong>
          </div>
          <small>
            {isGuest
              ? "Across 3 events"
              : events.length === 0
                ? "No budget records yet"
                : `Across ${events.length} event${events.length > 1 ? "s" : ""}`}
          </small>
        </div>
        <div className="metric-card">
          <span className="metric-icon yellow">
            <Icon name="check" size={19} />
          </span>
          <div>
            <span>Tasks completed</span>
            <strong>{isGuest ? "18 / 24" : "0 / 0"}</strong>
          </div>
          <small>{isGuest ? "75% on track" : "0% on track"}</small>
        </div>
        <div className="metric-card">
          <span className="metric-icon blue">
            <Icon name="bookmark" size={19} />
          </span>
          <div>
            <span>Saved spots</span>
            <strong>{isGuest ? 12 : favoritesCount}</strong>
          </div>
          <small>
            {isGuest
              ? "4 recently viewed"
              : favoritesCount === 0
                ? "No saved spots yet"
                : `${favoritesCount} bookmarked`}
          </small>
        </div>
      </div>

      <div className="plan-hero">
        <div className="hero-copy">
          <div className="mini-badge">
            <Icon name="sparkle" size={14} /> AI-powered planning
          </div>
          <div className="hero-card-title">
            Big fun.
            <br />
            Tiny stress.
          </div>
          <p>Tell us your vibe and budget. We’ll plan the rest.</p>
          <Button onClick={() => go("planner")} variant="dark" icon="arrow">
            Plan an Event
          </Button>
        </div>
        <div className="party-visual" aria-hidden="true">
          <div className="balloon balloon-one" />
          <div className="balloon balloon-two" />
          <div className="balloon balloon-three" />
          <div className="party-face">P</div>
          <span className="confetti c1" />
          <span className="confetti c2" />
          <span className="confetti c3" />
          <span className="confetti c4" />
        </div>
      </div>

      <SectionTitle title="Quick picks" />
      <div className="category-row">
        {categories.map((category) => (
          <button
            type="button"
            className="category-item"
            key={category.label}
            onClick={() => go("planner")}
          >
            <span className={`category-icon ${category.color}`}>
              <Icon name={category.icon} />
            </span>
            <span>{category.label}</span>
          </button>
        ))}
      </div>

      <SectionTitle
        title="Coming up"
        action="See all"
        onAction={() => go("events")}
      />
      {isGuest ? (
        <button
          type="button"
          className="event-feature"
          onClick={() => go("event-detail")}
        >
          <img
            src={images.birthday}
            alt="Friends celebrating a birthday around a cake"
          />
          <div className="event-date">
            <strong>12</strong>
            <span>NOV</span>
          </div>
          <div className="event-overlay">
            <div className="event-meta">
              <span>Birthday (Demo)</span>
              <span>9 days to go</span>
            </div>
            <div className="event-name">Aanya’s Birthday</div>
            <div className="event-sub">
              <Icon name="location" size={15} /> Rooftop, Indiranagar · 18 friends
            </div>
          </div>
        </button>
      ) : events.length > 0 ? (
        <button
          type="button"
          className="event-feature"
          onClick={() => go("event-detail")}
        >
          <img
            src={events[0].image}
            alt={events[0].name}
          />
          <div className="event-date">
            <strong>{events[0].date.slice(0, 2) || "UP"}</strong>
            <span>{events[0].date.slice(3, 6).toUpperCase() || "COMING"}</span>
          </div>
          <div className="event-overlay">
            <div className="event-meta">
              <span>{events[0].type}</span>
              <span>Upcoming</span>
            </div>
            <div className="event-name">{events[0].name}</div>
            <div className="event-sub">
              <Icon name="location" size={15} /> {events[0].place} · {events[0].guests} friends
            </div>
          </div>
        </button>
      ) : (
        <div className="empty-coming-up">
          <div className="empty-coming-up-icon">
            <Icon name="calendar" size={30} />
          </div>
          <strong className="empty-coming-up-title">
            Welcome! Start planning your first celebration.
          </strong>
          <p className="empty-coming-up-desc">
            You haven't created any plans yet. Tell us your vibe and budget, and
            PlanzyPop will create your first celebration plan.
          </p>
          <Button onClick={() => go("planner")} variant="dark" icon="arrow">
            Plan an Event
          </Button>
        </div>
      )}

      <div className="two-col">
        <button
          type="button"
          className="dash-card budget-card"
          onClick={() => go("budget")}
        >
          <div className="dash-icon">
            <Icon name="wallet" />
          </div>
          <div className="card-kicker">Party budget</div>
          <div className="budget-big">
            {isGuest
              ? "₹3,250 left"
              : events.length === 0
                ? "₹0 left"
                : `${events[0].budget} planned`}
          </div>
          <Progress value={isGuest ? 46 : events.length === 0 ? 0 : 35} />
          <div className="spread">
            <span>
              {isGuest
                ? "Spent ₹2,750"
                : events.length === 0
                  ? "No budget records yet"
                  : "Spent ₹0"}
            </span>
            <strong>{isGuest ? "54%" : "0%"}</strong>
          </div>
        </button>
        <button
          type="button"
          className="dash-card task-card"
          onClick={() => go("checklist")}
        >
          <div className="task-ring">
            <span>{isGuest ? "5/8" : "0/0"}</span>
          </div>
          <div className="card-kicker">
            {isGuest ? "You’re on a roll" : "Checklist"}
          </div>
          <div className="task-title">
            {isGuest
              ? "3 tasks left"
              : events.length === 0
                ? "No tasks yet"
                : "5 tasks ready"}
          </div>
          <div className="task-next">
            {isGuest
              ? "Next: Order the cake"
              : events.length === 0
                ? "Create a plan to get started"
                : "Next: Review event checklist"}
          </div>
        </button>
        <button
          type="button"
          className="dash-card spot-dash-card"
          onClick={() => go("nearby")}
        >
          <div className="dash-icon">
            <Icon name="pin" />
          </div>
          <div className="card-kicker">POPSPOTS</div>
          <div className="task-title">Find a hangout</div>
          <div className="task-next">Cafés, parks, desserts & more in Chandigarh</div>
        </button>
      </div>

      <div className="recent-activity-panel">
        <div className="activity-heading">
          <div>
            <span>RECENT ACTIVITY</span>
            <strong>Your planning pulse</strong>
          </div>
          <button type="button" onClick={() => go("insights")}>
            View insights <Icon name="arrow" size={14} />
          </button>
        </div>
        <div className="activity-list">
          {isGuest ? (
            <>
              <div>
                <span className="activity-dot purple" />
                <p>
                  <strong>Budget updated</strong>
                  <small>Aanya’s Birthday · ₹350 added</small>
                </p>
                <time>10 min</time>
              </div>
              <div>
                <span className="activity-dot coral" />
                <p>
                  <strong>Spot saved</strong>
                  <small>Church Street café placeholder</small>
                </p>
                <time>Yesterday</time>
              </div>
              <div>
                <span className="activity-dot yellow" />
                <p>
                  <strong>5 tasks completed</strong>
                  <small>College Fresher Party</small>
                </p>
                <time>2 days</time>
              </div>
            </>
          ) : events.length === 0 ? (
            <div className="activity-empty">
              No recent activity yet. Your planned events and updates will appear here.
            </div>
          ) : (
            <div>
              <span className="activity-dot purple" />
              <p>
                <strong>Plan active</strong>
                <small>{events[0].name} · {events[0].place}</small>
              </p>
              <time>Just now</time>
            </div>
          )}
        </div>
        {isGuest ? (
          <div className="saved-spot-strip">
            <button type="button" onClick={() => go("nearby")}>
              <img src={images.cafe} alt="Third Wave Coffee" />
              <span>
                <strong>Third Wave Coffee</strong>
                <small>Church Street · Saved café (Demo)</small>
              </span>
            </button>
            <button type="button" onClick={() => go("nearby")}>
              <img src={images.games} alt="Board 4 Boredom Lounge" />
              <span>
                <strong>Board 4 Boredom Lounge</strong>
                <small>Koramangala · Saved activity space (Demo)</small>
              </span>
            </button>
          </div>
        ) : (
          <div
            style={{
              padding: "12px 14px",
              color: "var(--muted, #64748b)",
              fontSize: "12px",
            }}
          >
            Browse Explore Spots to bookmark hangout spots across Chandigarh.
          </div>
        )}
      </div>
    </div>
  )
}

type EventPlan = {
  name: string
  type: string
  date: string
  place: string
  guests: number
  budget: string
  progress: number
  image: string
}

const defaultEvents: EventPlan[] = [
  {
    name: "Aanya’s Birthday",
    type: "Birthday",
    date: "12 Nov · 6:30 PM",
    place: "Indiranagar, Bengaluru",
    guests: 18,
    budget: "₹6,000",
    progress: 68,
    image: images.birthday,
  },
  {
    name: "College Fresher Party",
    type: "College",
    date: "18 Nov · 4:00 PM",
    place: "Campus Activity Hall",
    guests: 60,
    budget: "₹12,000",
    progress: 42,
    image: images.decor,
  },
  {
    name: "Friends’ Game Night",
    type: "Get-together",
    date: "22 Nov · 7:30 PM",
    place: "Meera’s apartment",
    guests: 8,
    budget: "₹2,000",
    progress: 24,
    image: images.games,
  },
]

function MyEvents({
  go,
  events = [],
  isGuest = false,
}: {
  go: (s: Screen) => void
  events?: EventPlan[]
  isGuest?: boolean
}) {
  const [tab, setTab] = useState("Upcoming")
  return (
    <div className="screen">
      <Header
        title="My Plans"
        eyebrow={
          isGuest
            ? "GUEST DEMO MODE · 3 SAMPLE PLANS"
            : "CELEBRATIONS YOU’RE SHAPING"
        }
        action={
          <IconButton
            icon="plus"
            label="Add event"
            onClick={() => go("planner")}
          />
        }
      />
      <div className="segmented">
        {["Upcoming", "Ongoing", "Completed"].map((item) => (
          <button
            type="button"
            key={item}
            className={tab === item ? "active" : ""}
            onClick={() => setTab(item)}
          >
            {item}
          </button>
        ))}
      </div>
      {events.length === 0 ? (
        <div className="empty-state">
          <div className="empty-visual">
            <Icon name="calendar" size={42} />
          </div>
          <div className="empty-title">You haven’t created any plans yet.</div>
          <p>
            Start planning your first celebration with AI-curated themes, budgets,
            and spots.
          </p>
          <Button onClick={() => go("planner")} icon="plus">
            Plan an Event
          </Button>
        </div>
      ) : tab === "Upcoming" ? (
        <div className="event-list">
          <div className="month-label">
            {isGuest
              ? "DEMO PREVIEW · 3 EVENTS"
              : `${events.length} CELEBRATION${events.length > 1 ? "S" : ""}`}
          </div>
          {events.map((event) => (
            <button
              type="button"
              className="event-list-card"
              key={event.name}
              onClick={() => go("event-detail")}
            >
              <img src={event.image} alt="" />
              <div className="event-list-copy">
                <div className="event-card-head">
                  <div className="event-type">{event.type}</div>
                  <span className="event-status">UPCOMING</span>
                </div>
                <div className="list-title">{event.name}</div>
                <div className="list-line">
                  <Icon name="calendar" size={15} /> {event.date}
                </div>
                <div className="list-line">
                  <Icon name="location" size={15} /> {event.place}
                </div>
                <div className="mini-stats">
                  <span>
                    <Icon name="people" size={14} /> {event.guests}
                  </span>
                  <span>
                    <Icon name="wallet" size={14} /> {event.budget}
                  </span>
                </div>
                <Progress value={event.progress} />
                <div className="progress-label">
                  <span>Planning progress</span>
                  <strong>{event.progress}%</strong>
                </div>
                <div className="event-card-actions">
                  <span>View details</span>
                  <span>
                    <Icon name="edit" size={13} /> Edit
                  </span>
                  <span className="delete-action">
                    <Icon name="logout" size={13} /> Delete
                  </span>
                </div>
              </div>
            </button>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <div className="empty-visual">
            <Icon name={tab === "Completed" ? "check" : "calendar"} size={42} />
          </div>
          <div className="empty-title">
            {tab === "Completed"
              ? "Memories start here"
              : "Nothing happening right now"}
          </div>
          <p>
            {tab === "Completed"
              ? "Your completed celebrations will live here."
              : "When an event begins, you’ll see it here."}
          </p>
          <Button onClick={() => go("planner")} icon="plus">
            Plan something fun
          </Button>
        </div>
      )}
    </div>
  )
}

function EventDetail({
  go,
  events = [],
  isGuest = false,
}: {
  go: (s: Screen) => void
  events?: EventPlan[]
  isGuest?: boolean
}) {
  if (!isGuest && events.length === 0) {
    return (
      <div className="screen detail-screen">
        <Header
          title="Event Details"
          eyebrow="NO CELEBRATION SELECTED"
          onBack={() => go("events")}
        />
        <div
          className="empty-state"
          style={{ padding: "60px 20px", textAlign: "center" }}
        >
          <div className="empty-visual">
            <Icon name="calendar" size={48} />
          </div>
          <div
            className="empty-title"
            style={{ fontSize: "19px", marginTop: "16px", fontWeight: "700" }}
          >
            No celebration selected
          </div>
          <p style={{ color: "var(--muted)", margin: "8px 0 20px 0" }}>
            You haven't created any celebrations yet. Start planning one now.
          </p>
          <Button onClick={() => go("planner")} icon="plus">
            Plan an Event
          </Button>
        </div>
      </div>
    )
  }

  const ev = isGuest || events.length === 0 ? defaultEvents[0] : events[0]

  return (
    <div className="screen detail-screen">
      <div className="detail-hero">
        <img src={ev.image} alt={ev.name} />
        <div className="floating-header">
          <IconButton icon="back" label="Back" onClick={() => go("events")} />
          <IconButton icon="edit" label="Edit event" />
        </div>
        <div className="detail-gradient">
          <span className="event-type">
            {isGuest ? `${ev.type.toUpperCase()} (DEMO)` : ev.type.toUpperCase()}
          </span>
          <div className="detail-title">{ev.name}</div>
          <div>{ev.date} · {ev.place}</div>
        </div>
      </div>
      <div className="detail-body">
        <div className="attendee-row">
          <div className="avatar-stack">
            <span>A</span>
            <span>R</span>
            <span>K</span>
            <span>+{ev.guests > 3 ? ev.guests - 3 : 0}</span>
          </div>
          <div>
            <strong>{ev.guests} friends invited</strong>
            <small>
              {isGuest ? "12 confirmed · 4 pending" : "Ready to celebrate"}
            </small>
          </div>
        </div>
        <div className="summary-card">
          <div className="summary-top">
            <span>Planning progress</span>
            <strong>{ev.progress}%</strong>
          </div>
          <Progress value={ev.progress} />
          <p>
            {isGuest
              ? "You’re doing great! Complete 3 more tasks this week."
              : "Review checklist items and track your celebration budget."}
          </p>
        </div>
        <div className="detail-grid">
          <button
            type="button"
            className="detail-tool lavender"
            onClick={() => go("checklist")}
          >
            <span>
              <Icon name="check" />
            </span>
            <strong>Checklist</strong>
            <small>{isGuest ? "5 of 8 done" : "View tasks"}</small>
          </button>
          <button
            type="button"
            className="detail-tool peach"
            onClick={() => go("budget")}
          >
            <span>
              <Icon name="wallet" />
            </span>
            <strong>Budget</strong>
            <small>{ev.budget}</small>
          </button>
          <button
            type="button"
            className="detail-tool yellow"
            onClick={() => go("planner")}
          >
            <span>
              <Icon name="sparkle" />
            </span>
            <strong>AI Plan</strong>
            <small>Recommendations</small>
          </button>
          <button type="button" className="detail-tool pink">
            <span>
              <Icon name="people" />
            </span>
            <strong>Guests</strong>
            <small>{ev.guests} total</small>
          </button>
        </div>
        <SectionTitle
          title="Next on your list"
          action="View checklist"
          onAction={() => go("checklist")}
        />
        <div className="next-task">
          <span className="priority high">HIGH</span>
          <div>
            <strong>Order the birthday cake</strong>
            <small>Due tomorrow · ₹800 estimated</small>
          </div>
          <Icon name="chevron" size={18} />
        </div>
        <SectionTitle title="Event timeline" />
        <div className="mini-timeline">
          <div>
            <span className="done">
              <Icon name="check" size={13} />
            </span>
            <p>
              <strong>Theme finalized</strong>
              <small>Pastel Pop · 2 Nov</small>
            </p>
          </div>
          <div>
            <span className="current" />
            <p>
              <strong>Invitations sent</strong>
              <small>Today · 12 responses</small>
            </p>
          </div>
          <div>
            <span />
            <p>
              <strong>Party day!</strong>
              <small>12 Nov · 6:30 PM</small>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

type ShoppingItem = {
  id: string
  name: string
  category: string
  quantity: string
  cost: number
  completed: boolean
}

function Planner({
  go,
  notify,
  onSaveEvent,
  initialVenue,
}: {
  go: (s: Screen) => void
  notify: (m: string) => void
  onSaveEvent?: (event: {
    name: string
    type: string
    date: string
    place: string
    guests: number
    budget: string
    progress: number
    image: string
  }) => void
  initialVenue?: SpotItem | null
}) {
  const queryParams =
    typeof window !== "undefined"
      ? new URLSearchParams(window.location.search)
      : null
  const [step, setStep] = useState<"form" | "loading" | "results">(
    queryParams?.get("step") === "results" ? "results" : "form",
  )
  const [eventType, setEventType] = useState("Birthday")
  const [eventName, setEventName] = useState(
    initialVenue ? `Celebration at ${initialVenue.name}` : "Rohan's 21st Birthday Bash",
  )
  const [eventDate, setEventDate] = useState("20 Nov 2026")
  const [guests, setGuests] = useState("1")
  const [guestError, setGuestError] = useState("")
  const [location, setLocation] = useState(
    initialVenue
      ? initialVenue.address || initialVenue.name
      : "Sector 17, Chandigarh",
  )
  const [foodPreference, setFoodPreference] = useState("Vegetarian")
  const [cakePreference, setCakePreference] = useState("Custom Bento Cake (1.2 kg)")
  const [setting, setSetting] = useState("Indoor")
  const [diyPreference, setDiyPreference] = useState("DIY & Handcrafted (Paper streamers & fairy lights)")
  const [budget, setBudget] = useState("₹3,000–₹5,000")
  const [style, setStyle] = useState("Casual")
  const [notes, setNotes] = useState("")
  const [apiSuggestion, setApiSuggestion] = useState<SuggestionResponse | null>(null)
  const [isAiLoading, setIsAiLoading] = useState(false)

  type PopPlanTab =
    | "all"
    | "overview"
    | "theme"
    | "food"
    | "decor"
    | "activities"
    | "budget"
    | "shopping"
    | "tasks"

  const [activeTab, setActiveTab] = useState<PopPlanTab>(
    (queryParams?.get("tab") as PopPlanTab) || "all",
  )

  const [plannerTasks, setPlannerTasks] = useState([
    { id: "t1", title: "Finalize guest count & send digital WhatsApp invites", timing: "1–2 Weeks Before", priority: "HIGH", completed: true },
    { id: "t2", title: "Order celebration cake from local bakery", timing: "3 Days Before", priority: "HIGH", completed: false },
    { id: "t3", title: "Purchase party balloons, lights & paper streamers", timing: "2 Days Before", priority: "MEDIUM", completed: false },
    { id: "t4", title: "Assemble Spotify party playlist and Bluetooth speaker", timing: "1 Day Before", priority: "LOW", completed: false },
    { id: "t5", title: "Set up venue decorations & photo backdrop corner", timing: "Day of Event", priority: "HIGH", completed: false },
  ])

  const [isEditingBasics, setIsEditingBasics] = useState(false)
  const [editName, setEditName] = useState(eventName)
  const [editOccasion, setEditOccasion] = useState(eventType)
  const [editDate, setEditDate] = useState(eventDate)
  const [editLocation, setEditLocation] = useState(location)
  const [editGuests, setEditGuests] = useState<number>(Number(guests) || 1)
  const [editBudget, setEditBudget] = useState(budget)
  const [editStyle, setEditStyle] = useState(style)

  const [themeIndex, setThemeIndex] = useState(0)
  const [foodIndex, setFoodIndex] = useState(0)
  const [decorIndex, setDecorIndex] = useState(0)
  const [activityIndex, setActivityIndex] = useState(0)

  const themePresets = [
    {
      title: "Pastel Pop Celebration",
      description:
        "A cheerful lavender, blush, peach, and soft-yellow palette tailored for a home, terrace, or hostel common room. Bright, photo-ready, and comfortable.",
      swatches: [
        { name: "Lavender", color: "#C8B6FF" },
        { name: "Blush", color: "#FFD6E0" },
        { name: "Peach", color: "#FFD8BE" },
        { name: "Soft Yellow", color: "#FFF0A5" },
      ],
      colorNames: "Lavender · Blush · Peach · Soft Yellow",
      themeCost: 850,
    },
    {
      title: "Neon Glow & Midnight Arcade",
      description:
        "High-energy celebration featuring fluorescent highlights, glow accents, LED light strips, and bold party aesthetics for an evening crowd.",
      swatches: [
        { name: "Electric Purple", color: "#9D4EDD" },
        { name: "Neon Cyan", color: "#00F5D4" },
        { name: "Hot Pink", color: "#F72585" },
        { name: "Cyber Amber", color: "#FFBE0B" },
      ],
      colorNames: "Electric Purple · Neon Cyan · Hot Pink · Cyber Amber",
      themeCost: 950,
    },
    {
      title: "Boho Sunset Glow",
      description:
        "Warm terracotta tones, dried botanical accents, jute runners, fairy light bottles, and an ambient acoustic vibe for relaxed conversations.",
      swatches: [
        { name: "Terracotta", color: "#E07A5F" },
        { name: "Warm Sand", color: "#F4F1DE" },
        { name: "Sage Olive", color: "#81B29A" },
        { name: "Deep Ochre", color: "#F2CC8F" },
      ],
      colorNames: "Terracotta · Warm Sand · Sage Olive · Deep Ochre",
      themeCost: 780,
    },
  ]

  const foodPresets = [
    {
      cakeTitle: "1.2 kg Customized Pastel Bento Cake",
      cakeFlavor:
        "Belgian Chocolate Truffle with buttercream florals and personalized lettering",
      cakeCost: 700,
      snackRecommendations: [
        "Mini Paneer Tikka Sliders",
        "Peri-Peri Crinkle Fries",
        "Steamed Veg Dimsums",
        "Cheesy Corn Triangles",
        "Nachos with House Salsa",
      ],
      drinks: "Chilled Vanilla Cold Coffee & Fresh Mint Lemonade Spritzers",
      dietTag: "100% Vegetarian Crowd-Pleaser",
      foodCost: 1600,
    },
    {
      cakeTitle: "24-piece Tiered Cupcake Tower with Sparklers",
      cakeFlavor:
        "Red Velvet Cream Cheese & Salted Caramel with edible pearl dusting",
      cakeCost: 750,
      snackRecommendations: [
        "Gourmet Pinwheel Sandwiches",
        "Masala Garlic Breadsticks",
        "Jalapeño Cheese Poppers",
        "Crispy Potato Wedges",
        "Hummus & Pita Bites",
      ],
      drinks: "Iced Peach Tea & Fizzy Blueberry Mocktails",
      dietTag: "Mixed / Vegetarian & Vegan Friendly",
      foodCost: 1700,
    },
    {
      cakeTitle: "1.5 kg Classic Chocolate Fudge Party Slab",
      cakeFlavor:
        "Rich Dutch Chocolate Fudge with confetti sprinkles and sparklers",
      cakeCost: 550,
      snackRecommendations: [
        "Samosa Chaat Platter",
        "Butter Maggi Cups",
        "Chilli Cheese Toasties",
        "Popcorn Bar with peri-peri seasonings",
        "Spiced Masala Peanuts",
      ],
      drinks: "Nimbu Paani & Tang Mango Punch",
      dietTag: "Student Budget Friendly & Easy Clean-up",
      foodCost: 1350,
    },
  ]

  const decorPresets = [
    {
      recommendation:
        "Fairy light curtain backdrop, pastel balloon clusters at the entrance, printed welcome banner, and table bunting.",
      requiredMaterials: [
        "Pastel balloons (30 pcs)",
        "Crepe paper streamer rolls (3 rolls)",
        "10m micro-LED warm fairy lights",
        "Wall-safe double-sided tape",
        "Cardstock paper party props & welcome banner",
      ],
      diyIdeas: [
        {
          title: "Paper streamer fringe backdrop",
          cost: "Under ₹180",
          desc: "Layered crepe streamer fringe attached with wall-safe tape for photos",
        },
        {
          title: "Printed photo props & greeting cutouts",
          cost: "Under ₹60",
          desc: "Fun celebration cardboard cutouts printed on local shop cardstock",
        },
        {
          title: "Reusable pastel pennant bunting",
          cost: "Under ₹120",
          desc: "Triangular pennants threaded on natural baker's twine across walls",
        },
        {
          title: "Warm fairy-light selfie corner",
          cost: "Under ₹250",
          desc: "10-metre micro-LED copper wire draped gently along sheer curtains",
        },
      ],
      decorCost: 610,
    },
    {
      recommendation:
        "Organic dual-tone balloon garland over seating, DIY polaroid photo memory string with wooden clips, ambient lighting.",
      requiredMaterials: [
        "Dual-tone balloon garland kit (40 balloons)",
        "Natural jute string (15m) & mini wooden pegs",
        "Polaroid prints of friend memories (20 prints)",
        "Upcycled glass jar fairy lights",
        "Kraft chalkboard card welcoming guests",
      ],
      diyIdeas: [
        {
          title: "Organic balloon cluster garland",
          cost: "Under ₹220",
          desc: "Dual-size balloons tied in clusters on fishing line or balloon tape",
        },
        {
          title: "Polaroid photo timeline on jute string",
          cost: "Under ₹140",
          desc: "Guest memories printed 2x3 on card with mini wooden pegs",
        },
        {
          title: "Upcycled glass bottle fairy lights",
          cost: "Under ₹90",
          desc: "Cleaned glass jars with cork micro-LED wire lights for ambient glow",
        },
        {
          title: "Hand-lettered greeting chalkboard",
          cost: "Under ₹70",
          desc: "Kraft card with liquid chalk welcoming guests at the entrance",
        },
      ],
      decorCost: 680,
    },
    {
      recommendation:
        "Geometric paper lanterns, origami crane curtain, dried leaf table runners, warm micro-lights.",
      requiredMaterials: [
        "Accordion honeycomb paper lanterns (6 pcs)",
        "Pastel tissue paper sheets for tassels",
        "Natural craft jute twine",
        "LED tea-light candles & decorative jars",
        "Cardboard photo frame prop with painted border",
      ],
      diyIdeas: [
        {
          title: "Accordion paper honeycomb lanterns",
          cost: "Under ₹150",
          desc: "Handmade folding paper spheres in pastel tones hung from ceiling",
        },
        {
          title: "Jute string paper tassel bunting",
          cost: "Under ₹100",
          desc: "Tissue paper tassels twisted onto natural craft twine",
        },
        {
          title: "Tabletop confetti & tea-light holders",
          cost: "Under ₹80",
          desc: "Perforated craft paper lanterns with safe LED tea lights",
        },
        {
          title: "Custom cardboard photo frame prop",
          cost: "Under ₹60",
          desc: "Upcycled shipping box cutout with hand-painted borders and lettering",
        },
      ],
      decorCost: 490,
    },
  ]

  const activityPresets = [
    {
      activities:
        "Bollywood Dumb Charades, Two Truths & a Lie, and 'Who Knows the Host Best?' speed trivia quiz",
      guestSuitability:
        "Ideal for 10–25 friends in indoor living rooms, common halls or rooftop spaces",
      requiredMaterials: [
        "Trivia quiz printouts & pens (1 per team)",
        "Bluetooth party speaker & Spotify Jam session",
        "60-second digital stopwatch timer",
      ],
      entertainment:
        "Collaborative party playlist queue, instant mobile polaroid challenge, celebratory toast moment",
      cost: 0,
    },
    {
      activities:
        "Uno Flip & Exploding Kittens tournament, Mobile Karaoke showdown via Bluetooth mic, Pictionary on whiteboards",
      guestSuitability:
        "Best for 8–18 guests with comfortable table or lounge seating arrangements",
      requiredMaterials: [
        "Uno Flip and Exploding Kittens card decks",
        "2 Mini whiteboards with dry-erase markers",
        "Wireless Bluetooth karaoke microphone",
        "Blindfolds for mystery snack tasting",
      ],
      entertainment:
        "Chill Lo-Fi & acoustic party stream, snack-tasting blindfold challenge, mini prize ceremony",
      cost: 150,
    },
    {
      activities:
        "Name That Tune 5-second buzzer round, Freeze Dance showdown, and Group Reel video memory challenge",
      guestSuitability:
        "High energy format tailored for 15–40 lively guests with open standing or dancing area",
      requiredMaterials: [
        "Buzzer bells or buzzer mobile app",
        "High-output Bluetooth speaker system",
        "Glow-in-the-dark wristbands for evening games",
      ],
      entertainment:
        "High-energy DJ soundscape, glow accessory photo station, synchronized memory reel shoot",
      cost: 100,
    },
  ]

  const [shoppingItems, setShoppingItems] = useState<ShoppingItem[]>([
    {
      id: "s1",
      name: "Pastel balloons (Lavender & Peach)",
      category: "Decor",
      quantity: "30 pcs",
      cost: 240,
      completed: true,
    },
    {
      id: "s2",
      name: "Crepe paper streamer rolls",
      category: "Decor",
      quantity: "3 rolls",
      cost: 180,
      completed: true,
    },
    {
      id: "s3",
      name: "Warm fairy string lights (10m)",
      category: "Decor",
      quantity: "1 set",
      cost: 250,
      completed: false,
    },
    {
      id: "s4",
      name: "Custom celebration cake",
      category: "Food",
      quantity: "1.2 kg",
      cost: 700,
      completed: false,
    },
    {
      id: "s5",
      name: "Party snack platters & finger foods",
      category: "Food",
      quantity: "4 platters",
      cost: 1600,
      completed: false,
    },
    {
      id: "s6",
      name: "Beverages & cold coffee cartons",
      category: "Food",
      quantity: "6 cartons",
      cost: 650,
      completed: false,
    },
    {
      id: "s7",
      name: "Eco-friendly paper plates & cups",
      category: "Supplies",
      quantity: "20 sets",
      cost: 160,
      completed: false,
    },
    {
      id: "s8",
      name: "Double-sided tape & photo props",
      category: "DIY",
      quantity: "1 pack",
      cost: 80,
      completed: true,
    },
  ])
  const [newShoppingName, setNewShoppingName] = useState("")
  const [newShoppingQuantity, setNewShoppingQuantity] = useState("1x")
  const [newShoppingCost, setNewShoppingCost] = useState("100")
  const [newShoppingCategory, setNewShoppingCategory] = useState("Custom")

  const currentTheme = themePresets[themeIndex]
  const currentFood = foodPresets[foodIndex]
  const currentDecor = decorPresets[decorIndex]
  const currentActivity = activityPresets[activityIndex]

  const themeCost = currentTheme.themeCost
  const decorCost = currentDecor.decorCost
  const foodCost = currentFood.foodCost
  const cakeCost = currentFood.cakeCost
  const drinksCost = 650
  const activityCost = currentActivity.cost + 300
  const bufferCost = 350
  const totalEstimated =
    themeCost +
    decorCost +
    foodCost +
    cakeCost +
    drinksCost +
    activityCost +
    bufferCost

  const parseBudgetNum = (b: string) => {
    if (b.includes("500") && b.includes("1,000")) return 1000
    if (b.includes("1,000")) return 2500
    if (b.includes("3,000")) return 5000
    if (b.includes("5,000+")) return 7500
    return 5000
  }
  const targetBudgetNum = parseBudgetNum(budget)
  const displayTotal = apiSuggestion?.total_allocated_budget
    ? Math.round(apiSuggestion.total_allocated_budget)
    : totalEstimated
  const currentSavings = targetBudgetNum - displayTotal
  const isOverBudget = displayTotal > targetBudgetNum

  const toggleShoppingItem = (id: string) => {
    setShoppingItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, completed: !item.completed } : item,
      ),
    )
  }

  const deleteShoppingItem = (id: string) => {
    setShoppingItems((prev) => prev.filter((item) => item.id !== id))
    notify("Shopping item removed!")
  }

  const addShoppingItem = (e: FormEvent) => {
    e.preventDefault()
    if (!newShoppingName.trim()) return
    const cost = Number(newShoppingCost) || 100
    setShoppingItems((prev) => [
      ...prev,
      {
        id: `s-${Date.now()}`,
        name: newShoppingName.trim(),
        category: newShoppingCategory || "Custom",
        quantity: newShoppingQuantity.trim() || "1x",
        cost,
        completed: false,
      },
    ])
    setNewShoppingName("")
    setNewShoppingQuantity("1x")
    setNewShoppingCost("100")
    notify("Shopping item added!")
  }

  const handleSaveBasics = () => {
    setEventName(editName)
    setEventType(editOccasion)
    setEventDate(editDate)
    setLocation(editLocation)
    setGuests(String(editGuests))
    setBudget(editBudget)
    setStyle(editStyle)
    setIsEditingBasics(false)
    notify("Event details updated successfully!")
  }

  const handleSavePlan = () => {
    const finalEventName =
      eventName.trim() ||
      `${eventType} Celebration at ${location.split(",")[0]}`
    const finalBudget = apiSuggestion?.total_allocated_budget
      ? `₹${Math.round(apiSuggestion.total_allocated_budget).toLocaleString("en-IN")}`
      : `₹${totalEstimated.toLocaleString("en-IN")}`
    const numGuests = typeof guests === "number" ? guests : parseInt(guests, 10) || 1
    const newPlan = {
      name: finalEventName,
      type: eventType,
      date: eventDate,
      place: location,
      guests: numGuests,
      budget: finalBudget,
      progress: 35,
      image:
        eventType === "Birthday"
          ? images.birthday
          : eventType === "Picnic"
            ? images.picnic
            : images.decor,
    }
    try {
      createEvent({
        event_name: finalEventName,
        event_type: eventType,
        event_date: eventDate || new Date().toISOString().split("T")[0],
        location: location,
        guests: numGuests,
        budget: parseBudgetNum(budget),
        celebration_style: style,
      }).catch((err) => {
        console.warn("Backend SQLite createEvent notice:", err)
      })
    } catch (err) {
      console.warn("Could not persist to SQLite:", err)
    }

    if (onSaveEvent) {
      onSaveEvent(newPlan)
    } else {
      notify(`Plan "${finalEventName}" saved to My Plans!`)
      go("events")
    }
  }

  const generate = async () => {
    const trimmed = typeof guests === "string" ? guests.trim() : String(guests).trim()
    if (!trimmed) {
      setGuestError("Please enter the estimated guest count.")
      notify("Please enter the estimated guest count.")
      const el = document.getElementById("event-guests-input")
      el?.focus()
      return
    }
    const numGuests = parseInt(trimmed, 10)
    if (isNaN(numGuests) || numGuests < 1) {
      setGuestError("Guest count must be at least 1.")
      notify("Guest count must be at least 1.")
      const el = document.getElementById("event-guests-input")
      el?.focus()
      return
    }

    setGuestError("")
    setEditGuests(numGuests)
    setStep("loading")
    setIsAiLoading(true)

    if (cakePreference.includes("Cupcake")) {
      setFoodIndex(1)
    } else if (cakePreference.includes("Classic")) {
      setFoodIndex(2)
    } else {
      setFoodIndex(0)
    }

    if (diyPreference.includes("Garland")) {
      setDecorIndex(1)
    } else if (diyPreference.includes("Minimalist")) {
      setDecorIndex(2)
    } else {
      setDecorIndex(0)
    }

    try {
      const numericBudget = parseBudgetNum(budget)
      const resp = await generateSuggestions({
        event_type: eventType,
        budget: numericBudget,
        guests: numGuests,
        celebration_style: style,
      })
      if (resp) {
        setApiSuggestion(resp)
        const items: ShoppingItem[] = []
        let idCounter = 1

        if (resp.food_suggestions && resp.food_suggestions.length > 0) {
          resp.food_suggestions.forEach((food) => {
            const isCake = food.toLowerCase().includes("cake")
            const cost = isCake
              ? Math.round(numericBudget * 0.15)
              : Math.round(
                  (numericBudget * 0.25) /
                    Math.max(1, resp.food_suggestions.length - 1),
                )
            items.push({
              id: `s-${idCounter++}`,
              name: food,
              category: isCake ? "Cake" : "Food",
              quantity: isCake ? "1.2 kg" : `${Math.max(1, Math.round(numGuests / 4))} platters`,
              cost: Math.max(100, cost),
              completed: idCounter % 3 === 0,
            })
          })
        }

        if (
          resp.decoration_suggestions &&
          resp.decoration_suggestions.length > 0
        ) {
          resp.decoration_suggestions.forEach((decor) => {
            const cost = Math.round(
              (numericBudget * 0.15) / resp.decoration_suggestions.length,
            )
            items.push({
              id: `s-${idCounter++}`,
              name: decor,
              category: "Decor",
              quantity: "1 set",
              cost: Math.max(80, cost),
              completed: idCounter % 2 === 0,
            })
          })
        }

        if (
          resp.activity_suggestions &&
          resp.activity_suggestions.length > 0
        ) {
          items.push({
            id: `s-${idCounter++}`,
            name: `${resp.activity_suggestions[0]} (props & kit)`,
            category: "Activities",
            quantity: "1 kit",
            cost: Math.max(100, Math.round(numericBudget * 0.08)),
            completed: false,
          })
        }

        items.push({
          id: `s-${idCounter++}`,
          name: "Eco-friendly plates, cups & napkins",
          category: "Supplies",
          quantity: `${numGuests} sets`,
          cost: Math.max(80, Math.round(numGuests * 12)),
          completed: true,
        })

        if (items.length > 0) {
          setShoppingItems(items)
        }
      }
    } catch (err) {
      console.warn("Backend suggestions API error, using curated presets:", err)
      notify("Rule engine offline; loaded curated celebration plan.")
    } finally {
      setIsAiLoading(false)
      setStep("results")
    }
  }

  if (step === "loading") {
    return (
      <div className="screen ai-loading">
        <div className="ai-orbit">
          <span>
            <Icon name="sparkle" size={34} filled />
          </span>
          <i />
          <i />
          <i />
        </div>
        <div className="loading-title">Generating Your Celebration Plan</div>
        <p>
          Synthesizing theme, food & cake, decor, games, checklist and budget for {guests}{" "}
          friends in Chandigarh…
        </p>
        <div className="loading-steps">
          <span className="done">
            <Icon name="check" size={16} /> Evaluating occasion rules & color palette
          </span>
          <span className="done">
            <Icon name="check" size={16} /> Curating bakery cake & party snack menu
          </span>
          <span className="done">
            <Icon name="check" size={16} /> Designing affordable DIY decor & shopping checklist
          </span>
          <span>
            <span className="tiny-loader" /> Balancing category percentages & safety buffer
          </span>
        </div>
      </div>
    )
  }

  if (step === "results") {
    const completedCount = shoppingItems.filter((i) => i.completed).length
    const totalShoppingCost = shoppingItems.reduce((acc, item) => acc + item.cost, 0)
    const purchasedShoppingCost = shoppingItems
      .filter((i) => i.completed)
      .reduce((acc, item) => acc + item.cost, 0)
    const checklistPercent = Math.round(
      (completedCount / (shoppingItems.length || 1)) * 100,
    )
    const effectiveEventName =
      eventName.trim() ||
      `${eventType} Celebration at ${location.split(",")[0]}`

    const budgetRows =
      apiSuggestion?.budget_allocations &&
      apiSuggestion.budget_allocations.length > 0
        ? apiSuggestion.budget_allocations.map((alloc) => [
            alloc.category,
            `₹${Math.round(alloc.allocated_amount).toLocaleString("en-IN")}`,
            Math.round(alloc.percentage),
          ] as const)
        : ([
            [
              "Food & celebration cake",
              `₹${(foodCost + cakeCost).toLocaleString("en-IN")}`,
              Math.round(((foodCost + cakeCost) / totalEstimated) * 100),
            ],
            [
              "Theme styling",
              `₹${themeCost.toLocaleString("en-IN")}`,
              Math.round((themeCost / totalEstimated) * 100),
            ],
            [
              "Decorations & DIY",
              `₹${decorCost.toLocaleString("en-IN")}`,
              Math.round((decorCost / totalEstimated) * 100),
            ],
            [
              "Drinks & refreshments",
              `₹${drinksCost.toLocaleString("en-IN")}`,
              Math.round((drinksCost / totalEstimated) * 100),
            ],
            [
              "Activities & party games",
              `₹${activityCost.toLocaleString("en-IN")}`,
              Math.round((activityCost / totalEstimated) * 100),
            ],
            [
              "Safety reserve buffer",
              `₹${bufferCost.toLocaleString("en-IN")}`,
              Math.round((bufferCost / totalEstimated) * 100),
            ],
          ] as const)

    const renderSectionA = (
      <section id="section-overview" className="planner-section-card">
        <div className="card-header-row">
          <span className="section-badge-pill badge-lavender">
            <Icon name="calendar" size={13} /> SECTION A · EVENT OVERVIEW
          </span>
          <button
            type="button"
            className="adapt-pill-btn"
            onClick={() => {
              setEditName(eventName)
              setEditOccasion(eventType)
              setEditDate(eventDate)
              setEditLocation(location)
              setEditGuests(Number(guests) || 1)
              setEditBudget(budget)
              setEditStyle(style)
              setIsEditingBasics(!isEditingBasics)
            }}
          >
            <Icon name="edit" size={13} />
            {isEditingBasics ? "Cancel" : "Edit Details"}
          </button>
        </div>

        <h3 className="section-card-title">{effectiveEventName}</h3>
        <p className="section-card-desc">
          Curated {style.toLowerCase()} {eventType.toLowerCase()} celebration for {guests} guests at {location}.
        </p>

        {isEditingBasics ? (
          <div className="summary-edit-panel">
            <div className="summary-edit-title">
              <Icon name="edit" size={15} /> Edit Event Parameters
            </div>
            <div className="summary-edit-grid">
              <div className="summary-edit-field">
                <label>Event Name</label>
                <input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="e.g. Birthday Celebration"
                />
              </div>
              <div className="summary-edit-field">
                <label>Occasion</label>
                <select
                  value={editOccasion}
                  onChange={(e) => setEditOccasion(e.target.value)}
                >
                  <option value="Birthday">Birthday</option>
                  <option value="College Party">College Party</option>
                  <option value="Farewell">Farewell</option>
                  <option value="Hostel Party">Hostel Party</option>
                  <option value="Picnic">Picnic</option>
                  <option value="Get-together">Get-together</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div className="summary-edit-field">
                <label>Event Date</label>
                <input
                  value={editDate}
                  onChange={(e) => setEditDate(e.target.value)}
                  placeholder="e.g. 20 Nov 2026"
                />
              </div>
              <div className="summary-edit-field">
                <label>Guest Count</label>
                <input
                  type="number"
                  min={1}
                  value={editGuests}
                  onChange={(e) => setEditGuests(Math.max(1, Number(e.target.value)))}
                />
              </div>
              <div className="summary-edit-field">
                <label>Location</label>
                <input
                  value={editLocation}
                  onChange={(e) => setEditLocation(e.target.value)}
                  placeholder="e.g. Sector 17, Chandigarh"
                />
              </div>
              <div className="summary-edit-field">
                <label>Budget Range</label>
                <select
                  value={editBudget}
                  onChange={(e) => setEditBudget(e.target.value)}
                >
                  <option value="Under ₹500">Under ₹500</option>
                  <option value="₹500–₹1,000">₹500–₹1,000</option>
                  <option value="₹1,000–₹3,000">₹1,000–₹3,000</option>
                  <option value="₹3,000–₹5,000">₹3,000–₹5,000</option>
                  <option value="₹5,000+">₹5,000+</option>
                </select>
              </div>
              <div className="summary-edit-field">
                <label>Celebration Type / Vibe</label>
                <select
                  value={editStyle}
                  onChange={(e) => setEditStyle(e.target.value)}
                >
                  <option value="Casual">Casual</option>
                  <option value="Aesthetic">Aesthetic</option>
                  <option value="DIY / Budget-Friendly">DIY / Budget-Friendly</option>
                  <option value="Traditional">Traditional</option>
                  <option value="Fun / Party">Fun / Party</option>
                </select>
              </div>
            </div>
            <div className="summary-edit-actions">
              <button
                type="button"
                className="plan-action-btn plan-action-btn-secondary"
                onClick={generate}
                title="Regenerate plan with updated criteria"
              >
                <Icon name="refresh" size={13} />
                <span>Regenerate Plan</span>
              </button>
              <button
                type="button"
                className="plan-action-btn plan-action-btn-secondary"
                onClick={() => setIsEditingBasics(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="plan-action-btn plan-action-btn-primary"
                onClick={handleSaveBasics}
              >
                <Icon name="check" size={13} />
                <span>Save Changes</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="overview-tiles-grid">
            <div className="overview-tile">
              <span className="overview-tile-label">Celebration Type</span>
              <strong className="overview-tile-val">{eventType} Celebration</strong>
            </div>
            <div className="overview-tile">
              <span className="overview-tile-label">Date & Schedule</span>
              <strong className="overview-tile-val">{eventDate}</strong>
            </div>
            <div className="overview-tile">
              <span className="overview-tile-label">Venue / Location</span>
              <strong className="overview-tile-val" title={location}>{location}</strong>
            </div>
            <div className="overview-tile">
              <span className="overview-tile-label">Guest Count</span>
              <strong className="overview-tile-val">{guests} Friends</strong>
            </div>
            <div className="overview-tile">
              <span className="overview-tile-label">Target Budget</span>
              <strong className="overview-tile-val highlight-purple">
                {budget} (~₹{targetBudgetNum.toLocaleString("en-IN")})
              </strong>
            </div>
            <div className="overview-tile">
              <span className="overview-tile-label">Vibe & Food Preference</span>
              <strong className="overview-tile-val">
                {style} · {setting} ({foodPreference})
              </strong>
            </div>
          </div>
        )}
      </section>
    )

    const renderSectionB = (
      <section id="section-theme" className="planner-section-card">
        <div className="card-header-row">
          <span className="section-badge-pill badge-blush">
            <Icon name="sparkle" size={13} /> SECTION B · THEME & COLOUR PALETTE
          </span>
          <button
            type="button"
            className="adapt-pill-btn"
            onClick={() => {
              setThemeIndex((prev) => (prev + 1) % themePresets.length)
              notify("Theme & colour palette adapted!")
            }}
          >
            <Icon name="refresh" size={13} /> Adapt Theme ({themeIndex + 1}/{themePresets.length})
          </button>
        </div>

        <span className="section-subheading">SUGGESTED CELEBRATION THEME</span>
        <h3 className="section-card-title">
          {apiSuggestion?.suggested_theme || currentTheme.title}
        </h3>
        <p className="section-card-desc">{currentTheme.description}</p>

        <span className="section-subheading">FOUR-COLOUR PALETTE SWATCHES</span>
        <div className="theme-swatches-grid">
          {currentTheme.swatches.map((swatch) => (
            <div key={swatch.name} className="theme-swatch-card">
              <div
                className="theme-swatch-box"
                style={{ backgroundColor: swatch.color }}
              />
              <div className="theme-swatch-meta">
                <span className="theme-swatch-name">{swatch.name}</span>
                <code className="theme-swatch-hex">{swatch.color}</code>
              </div>
            </div>
          ))}
        </div>
        <div className="theme-palette-names">{currentTheme.colorNames}</div>

        <div className="theme-cost-footer">
          <span>Estimated theme styling:</span>
          <strong>₹{themeCost.toLocaleString("en-IN")}</strong>
        </div>
      </section>
    )

    const renderSectionC = (
      <section id="section-food" className="planner-section-card">
        <div className="card-header-row">
          <span className="section-badge-pill badge-peach">
            <Icon name="food" size={13} /> SECTION C · FOOD & CAKE
          </span>
          <button
            type="button"
            className="adapt-pill-btn"
            onClick={() => {
              setFoodIndex((prev) => (prev + 1) % foodPresets.length)
              notify("Food & cake menu adapted!")
            }}
          >
            <Icon name="sparkle" size={13} /> Adapt Menu ({foodIndex + 1}/{foodPresets.length})
          </button>
        </div>

        <div className="food-subcard">
          <div className="food-subcard-header">
            <span className="food-subcard-title">
              <Icon name="cake" size={16} />
              {apiSuggestion?.food_suggestions?.find((f) =>
                f.toLowerCase().includes("cake"),
              ) || currentFood.cakeTitle}
            </span>
            <span className="food-price-tag">₹{currentFood.cakeCost}</span>
          </div>
          <p className="food-subcard-desc">{currentFood.cakeFlavor}</p>
        </div>

        <div className="food-subcard">
          <div className="food-subcard-header">
            <span className="food-subcard-title">
              <Icon name="food" size={15} /> Snacks & Finger Food Platters
            </span>
          </div>
          <div className="food-snack-tags">
            {(apiSuggestion?.food_suggestions && apiSuggestion.food_suggestions.length > 0
              ? apiSuggestion.food_suggestions.filter((f) => !f.toLowerCase().includes("cake"))
              : currentFood.snackRecommendations
            ).map((snack, idx) => (
              <span key={idx} className="food-tag-pill">
                <Icon name="food" size={12} />
                <span>{snack.trim()}</span>
              </span>
            ))}
          </div>
        </div>

        <div className="food-subcard">
          <div className="food-subcard-header">
            <span className="food-subcard-title">
              <Icon name="coffee" size={15} /> Beverages & Refreshments
            </span>
          </div>
          <p className="food-subcard-desc">{currentFood.drinks}</p>
        </div>

        <div className="food-footer-row">
          <span className="diet-pill">
            <Icon name="check" size={12} /> {foodPreference} ({currentFood.dietTag})
          </span>
          <div className="food-cost-breakdown">
            <span className="per-guest-text">
              ~₹{Math.round((foodCost + cakeCost) / Math.max(1, Number(guests) || 1))} / guest
            </span>
            <strong className="food-total-text">
              ₹{(foodCost + cakeCost).toLocaleString("en-IN")} est.
            </strong>
          </div>
        </div>
      </section>
    )

    const renderSectionD = (
      <section id="section-decor" className="planner-section-card">
        <div className="card-header-row">
          <span className="section-badge-pill badge-lavender">
            <Icon name="bulb" size={13} /> SECTION D · DECOR & DIY
          </span>
          <button
            type="button"
            className="adapt-pill-btn"
            onClick={() => {
              setDecorIndex((prev) => (prev + 1) % decorPresets.length)
              notify("Decor & DIY ideas adapted!")
            }}
          >
            <Icon name="refresh" size={13} /> Adapt Decor ({decorIndex + 1}/{decorPresets.length})
          </button>
        </div>

        <span className="section-subheading">DECORATION RECOMMENDATIONS</span>
        <p className="section-card-desc">
          {apiSuggestion?.decoration_suggestions &&
          apiSuggestion.decoration_suggestions.length > 0
            ? apiSuggestion.decoration_suggestions.join(". ")
            : currentDecor.recommendation}
        </p>

        <span className="section-subheading">REQUIRED MATERIALS</span>
        <div className="materials-tag-list">
          {currentDecor.requiredMaterials.map((mat) => (
            <span key={mat} className="material-pill">
              <Icon name="check" size={11} />
              <span>{mat}</span>
            </span>
          ))}
        </div>

        <span className="section-subheading" style={{ marginTop: 14 }}>AFFORDABLE DIY DECORATION IDEAS</span>
        <div className="decor-diy-grid">
          {currentDecor.diyIdeas.map((idea) => (
            <div key={idea.title} className="decor-diy-card">
              <div className="decor-diy-header">
                <strong>{idea.title}</strong>
                <span className="decor-diy-cost">{idea.cost}</span>
              </div>
              <p>{idea.desc}</p>
            </div>
          ))}
        </div>

        <div className="theme-cost-footer" style={{ marginTop: 16 }}>
          <span>Estimated decoration expense:</span>
          <strong>₹{decorCost.toLocaleString("en-IN")}</strong>
        </div>
      </section>
    )

    const renderSectionE = (
      <section id="section-activities" className="planner-section-card">
        <div className="card-header-row">
          <span className="section-badge-pill badge-yellow">
            <Icon name="music" size={13} /> SECTION E · ACTIVITIES & ENTERTAINMENT
          </span>
          <button
            type="button"
            className="adapt-pill-btn"
            onClick={() => {
              setActivityIndex((prev) => (prev + 1) % activityPresets.length)
              notify("Activities adapted!")
            }}
          >
            <Icon name="sparkle" size={13} /> Adapt Activities ({activityIndex + 1}/{activityPresets.length})
          </button>
        </div>

        <div className="activity-box">
          <div className="activity-box-header">
            <span className="section-subheading" style={{ margin: 0 }}>RECOMMENDED PARTY GAMES</span>
            <span className="guest-badge-pill">
              <Icon name="people" size={12} /> For {guests} guests
            </span>
          </div>
          <p className="activity-main-text">
            {apiSuggestion?.activity_suggestions &&
            apiSuggestion.activity_suggestions.length > 0
              ? apiSuggestion.activity_suggestions.join(" · ")
              : currentActivity.activities}
          </p>
          <small className="activity-sub-context">
            {currentActivity.guestSuitability}
          </small>
        </div>

        <span className="section-subheading">REQUIRED MATERIALS & SETUP</span>
        <div className="materials-tag-list" style={{ marginBottom: 12 }}>
          {currentActivity.requiredMaterials.map((mat) => (
            <span key={mat} className="material-pill">
              <Icon name="check" size={11} />
              <span>{mat}</span>
            </span>
          ))}
        </div>

        <div className="activity-box">
          <span className="section-subheading" style={{ margin: 0 }}>ATMOSPHERE & ENTERTAINMENT</span>
          <p className="activity-main-text">{currentActivity.entertainment}</p>
        </div>

        <div className="activity-footer-row">
          <span className="diet-pill" style={{ background: "#fefce8", color: "#854d0e", border: "1px solid #fef08a" }}>
            <Icon name="sparkle" size={12} />
            {currentActivity.cost === 0 ? "100% Free Games & Quizzes" : `₹${currentActivity.cost} props budget`}
          </span>
          <span className="activity-timing-text">
            60–90 min celebration itinerary
          </span>
        </div>
      </section>
    )

    const renderSectionF = (
      <section id="section-shopping" className="planner-section-card">
        <div className="card-header-row">
          <span className="section-badge-pill badge-blush">
            <Icon name="gift" size={13} /> SECTION F · SHOPPING CHECKLIST
          </span>
          <span className="shopping-progress-text">
            {completedCount} / {shoppingItems.length} purchased ({checklistPercent}%)
          </span>
        </div>

        <div className="shopping-progress-track">
          <div
            className="shopping-progress-fill"
            style={{ width: `${checklistPercent}%` }}
          />
        </div>

        <div className="shopping-cost-summary">
          <span>Checklist Value: <strong>₹{totalShoppingCost.toLocaleString("en-IN")}</strong> ({shoppingItems.length} items)</span>
          <span>Purchased: <strong style={{ color: "#16a34a" }}>₹{purchasedShoppingCost.toLocaleString("en-IN")}</strong></span>
        </div>

        <div className="shopping-items-list">
          {shoppingItems.map((item) => (
            <div
              key={item.id}
              className={`shopping-item-row ${item.completed ? "completed" : ""}`}
            >
              <div className="shopping-item-left">
                <button
                  type="button"
                  className={`shopping-checkbox-btn ${item.completed ? "checked" : ""}`}
                  onClick={() => toggleShoppingItem(item.id)}
                  title={item.completed ? "Mark as unpurchased" : "Mark as purchased"}
                >
                  {item.completed && <Icon name="check" size={12} />}
                </button>
                <div className="shopping-item-info">
                  <span className="shopping-item-name">{item.name}</span>
                  <div className="shopping-item-badges">
                    <span className="shopping-item-category">{item.category}</span>
                    <span className="shopping-item-qty">{item.quantity}</span>
                  </div>
                </div>
              </div>
              <div className="shopping-item-right">
                <span className="shopping-item-price">₹{item.cost}</span>
                <button
                  type="button"
                  className="shopping-delete-btn"
                  onClick={() => deleteShoppingItem(item.id)}
                  title="Remove item"
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>

        <form onSubmit={addShoppingItem} className="shopping-add-form">
          <input
            className="shopping-add-input"
            style={{ flex: 2 }}
            placeholder="Item name (e.g. Birthday candles)"
            value={newShoppingName}
            onChange={(e) => setNewShoppingName(e.target.value)}
          />
          <select
            className="shopping-add-input"
            style={{ width: 110 }}
            value={newShoppingCategory}
            onChange={(e) => setNewShoppingCategory(e.target.value)}
          >
            <option value="Decor">Decor</option>
            <option value="Food">Food</option>
            <option value="Cake">Cake</option>
            <option value="Supplies">Supplies</option>
            <option value="DIY">DIY</option>
            <option value="Custom">Custom</option>
          </select>
          <input
            className="shopping-add-input"
            style={{ width: 80 }}
            placeholder="Qty (1x)"
            value={newShoppingQuantity}
            onChange={(e) => setNewShoppingQuantity(e.target.value)}
          />
          <input
            className="shopping-add-input"
            style={{ width: 75 }}
            type="number"
            placeholder="₹"
            value={newShoppingCost}
            onChange={(e) => setNewShoppingCost(e.target.value)}
          />
          <button
            type="submit"
            className="plan-action-btn plan-action-btn-primary"
            style={{ padding: "7px 14px", fontSize: 12 }}
          >
            + Add
          </button>
        </form>
      </section>
    )

    const renderSectionG = (
      <section id="section-budget" className="planner-section-card">
        <div className="card-header-row">
          <span className="section-badge-pill badge-green">
            <Icon name="wallet" size={13} /> SECTION G · BUDGET BREAKDOWN
          </span>
          <span
            className={`section-badge-pill ${
              !isOverBudget ? "badge-green" : "badge-coral"
            }`}
          >
            {!isOverBudget
              ? currentSavings > 0
                ? `✓ Within budget target (₹${currentSavings.toLocaleString("en-IN")} buffer)`
                : "✓ Within budget target (Exact match)"
              : `⚠️ Over budget by ₹${(displayTotal - targetBudgetNum).toLocaleString("en-IN")}`}
          </span>
        </div>

        <div className={`budget-status-banner ${!isOverBudget ? "within" : "over"}`}>
          {!isOverBudget ? (
            <div className="budget-banner-content">
              <Icon name="check" size={16} />
              <span>
                <strong>Balanced celebration budget!</strong> You have ₹{currentSavings.toLocaleString("en-IN")} safety buffer remaining for incidentals.
              </span>
            </div>
          ) : (
            <div className="budget-banner-content">
              <Icon name="wallet" size={16} />
              <span>
                <strong>Budget limit exceeded by ₹{(displayTotal - targetBudgetNum).toLocaleString("en-IN")}.</strong> Consider adjusting snack platters or DIY decor quantities to fit within ₹{targetBudgetNum.toLocaleString("en-IN")}.
              </span>
            </div>
          )}
        </div>

        <div className="budget-kpis-grid">
          <div className="budget-kpi-tile">
            <span className="budget-kpi-label">Target Budget</span>
            <strong className="budget-kpi-val">
              ₹{targetBudgetNum.toLocaleString("en-IN")}
            </strong>
          </div>
          <div className="budget-kpi-tile">
            <span className="budget-kpi-label">Estimated Expense</span>
            <strong className="budget-kpi-val highlight-purple">
              ₹{displayTotal.toLocaleString("en-IN")}
            </strong>
          </div>
          <div className="budget-kpi-tile">
            <span className="budget-kpi-label">Remaining Cushion</span>
            <strong
              className="budget-kpi-val"
              style={{ color: !isOverBudget ? "#16a34a" : "#dc2626" }}
            >
              {!isOverBudget
                ? `₹${currentSavings.toLocaleString("en-IN")}`
                : `-₹${(displayTotal - targetBudgetNum).toLocaleString("en-IN")}`}
            </strong>
          </div>
          <div className="budget-kpi-tile">
            <span className="budget-kpi-label">Per-Guest Cost</span>
            <strong className="budget-kpi-val">
              ~₹{Math.round(displayTotal / Math.max(1, Number(guests) || 1)).toLocaleString("en-IN")}
            </strong>
          </div>
        </div>

        <span className="section-subheading">ITEMIZED CATEGORY EXPENDITURE</span>
        <div className="budget-breakdown-list">
          {budgetRows.map(([label, amount, width]) => (
            <div className="budget-row-item" key={String(label)}>
              <div className="budget-row-labels">
                <span className="budget-row-name">{label}</span>
                <strong className="budget-row-amount">{amount} ({width}%)</strong>
              </div>
              <div className="budget-row-bar-track">
                <div
                  className="budget-row-bar-fill"
                  style={{ width: `${Math.min(100, Number(width))}%` }}
                />
              </div>
            </div>
          ))}
        </div>

        {apiSuggestion?.budget_saving_tips && apiSuggestion.budget_saving_tips.length > 0 && (
          <div className="budget-saving-tips">
            <span className="budget-saving-tips-title">
              💡 AI Budget-Saving Recommendations
            </span>
            <div className="saving-tips-list">
              {apiSuggestion.budget_saving_tips.map((tip, idx) => (
                <div key={idx} className="saving-tip-item">
                  <span>•</span>
                  <span>{tip}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>
    )

    const renderSectionH = (
      <section id="section-tasks" className="planner-section-card">
        <div className="card-header-row">
          <span className="section-badge-pill badge-lavender">
            <Icon name="check" size={13} /> SECTION H · TASKS & TIMELINE
          </span>
          <span className="shopping-progress-text">
            {plannerTasks.filter((t) => t.completed).length} / {plannerTasks.length} tasks ready
          </span>
        </div>

        <span className="section-subheading">ACTIONABLE CELEBRATION TASKS</span>
        <div className="tasks-items-list">
          {plannerTasks.map((task) => (
            <div
              key={task.id}
              className={`task-card-row ${task.completed ? "completed" : ""}`}
            >
              <div className="task-card-left">
                <button
                  type="button"
                  className={`shopping-checkbox-btn ${task.completed ? "checked" : ""}`}
                  onClick={() =>
                    setPlannerTasks((prev) =>
                      prev.map((t) =>
                        t.id === task.id ? { ...t, completed: !t.completed } : t,
                      ),
                    )
                  }
                  title={task.completed ? "Mark incomplete" : "Mark done"}
                >
                  {task.completed && <Icon name="check" size={12} />}
                </button>
                <div className="task-card-info">
                  <span className="task-card-title">{task.title}</span>
                  <span className="task-card-timing">Due: {task.timing}</span>
                </div>
              </div>
              <span
                className={`task-priority-pill priority-${task.priority.toLowerCase()}`}
              >
                {task.priority}
              </span>
            </div>
          ))}
        </div>

        <span className="section-subheading" style={{ marginTop: 14 }}>
          CELEBRATION MILESTONE TIMELINE
        </span>
        <div className="timeline-phases-list">
          {[
            {
              phase: "Phase 1: 1–2 Weeks Before",
              title: "Foundation & Headcount",
              desc: "Lock in event date, venue, guest confirmations, and core theme.",
              done: true,
            },
            {
              phase: "Phase 2: 3–5 Days Before",
              title: "Bakery & Decor Procurement",
              desc: "Confirm cake flavor and lettering; source streamer rolls, lights & plates.",
              done: false,
            },
            {
              phase: "Phase 3: 1 Day Before",
              title: "Sound & Atmosphere Check",
              desc: "Assemble DIY photo props, prep party games, and queue playlist tracks.",
              done: false,
            },
            {
              phase: "Phase 4: Party Day!",
              title: "Setup, Celebration & Photos",
              desc: "Inflate balloon garland, place snack platters, cut cake & enjoy with friends.",
              done: false,
            },
          ].map((item, idx) => (
            <div
              key={idx}
              className={`timeline-phase-item ${item.done ? "done" : ""}`}
            >
              <div className="timeline-dot">
                {item.done ? <Icon name="check" size={12} /> : idx + 1}
              </div>
              <div className="timeline-phase-content">
                <div className="timeline-phase-header">
                  <span className="timeline-phase-tag">{item.phase}</span>
                </div>
                <strong className="timeline-phase-title">{item.title}</strong>
                <p className="timeline-phase-desc">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    )

    return (
      <div className="screen planner-results">
        <div className="planner-top-header">
          <div className="planner-header-left">
            <div className="planner-header-title-row">
              <div className="planner-header-icon">
                <Icon name="sparkle" size={22} />
              </div>
              <div>
                <h1 className="planner-main-heading">AI Celebration Plan</h1>
                <p className="planner-header-subtitle">
                  Curated recommendations for {effectiveEventName}
                </p>
              </div>
            </div>
          </div>
          <div className="planner-header-actions">
            <button
              type="button"
              className="plan-action-btn plan-action-btn-secondary"
              onClick={() => setStep("form")}
            >
              <Icon name="plus" size={15} />
              <span>New Plan</span>
            </button>
            <button
              type="button"
              className="plan-action-btn plan-action-btn-secondary"
              onClick={generate}
              disabled={isAiLoading}
            >
              <Icon name="refresh" size={15} />
              <span>{isAiLoading ? "Regenerating…" : "Regenerate"}</span>
            </button>
            <button
              type="button"
              className="plan-action-btn plan-action-btn-primary"
              onClick={handleSavePlan}
            >
              <Icon name="bookmark" size={15} />
              <span>Add to My Plans</span>
            </button>
          </div>
        </div>

        <div className="event-summary-card">
          <div className="event-summary-meta-grid">
            <div className="summary-meta-item">
              <span className="summary-meta-label">EVENT NAME</span>
              <div className="summary-meta-val-row">
                <strong className="summary-meta-val">{effectiveEventName}</strong>
                <span className="summary-badge-pill">{eventType}</span>
              </div>
            </div>
            <div className="summary-meta-item">
              <span className="summary-meta-label">EVENT DATE</span>
              <strong className="summary-meta-val">{eventDate}</strong>
            </div>
            <div className="summary-meta-item">
              <span className="summary-meta-label">NUMBER OF GUESTS</span>
              <strong className="summary-meta-val">{guests} Friends</strong>
            </div>
            <div className="summary-meta-item">
              <span className="summary-meta-label">LOCATION</span>
              <strong className="summary-meta-val" title={location}>
                {location.length > 28 ? `${location.slice(0, 28)}…` : location}
              </strong>
            </div>
            <div className="summary-meta-item">
              <span className="summary-meta-label">TOTAL BUDGET</span>
              <strong className="summary-meta-val highlight-purple">{budget}</strong>
            </div>
          </div>
          <button
            type="button"
            className="summary-edit-btn"
            onClick={() => {
              setEditName(eventName)
              setEditOccasion(eventType)
              setEditDate(eventDate)
              setEditLocation(location)
              setEditGuests(Number(guests) || 1)
              setEditBudget(budget)
              setEditStyle(style)
              setIsEditingBasics(!isEditingBasics)
            }}
          >
            <Icon name="edit" size={13} />
            <span>{isEditingBasics ? "Close Editor" : "Edit Details"}</span>
          </button>
        </div>

        <div
          className="plan-tabs-bar"
          role="tablist"
          aria-label="Celebration plan sections"
        >
          {[
            { id: "all", label: "All Sections", icon: "sparkle" as const },
            { id: "overview", label: "Overview", icon: "calendar" as const },
            { id: "theme", label: "Theme & Palette", icon: "sparkle" as const },
            { id: "food", label: "Food & Cake", icon: "food" as const },
            { id: "decor", label: "Decor & DIY", icon: "bulb" as const },
            { id: "activities", label: "Activities", icon: "music" as const },
            { id: "budget", label: "Budget Breakdown", icon: "wallet" as const },
            { id: "shopping", label: "Shopping List", icon: "gift" as const },
            { id: "tasks", label: "Tasks & Timeline", icon: "check" as const },
          ].map((tab) => (
            <button
              type="button"
              key={tab.id}
              role="tab"
              aria-selected={activeTab === tab.id}
              className={`plan-tab-pill ${activeTab === tab.id ? "active" : ""}`}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
            >
              <Icon name={tab.icon} size={14} />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {activeTab === "all" ? (
          <div className="planner-dashboard-grid">
            <div className="planner-grid-col">
              {renderSectionA}
              {renderSectionB}
              {renderSectionD}
              {renderSectionE}
            </div>
            <div className="planner-grid-col">
              {renderSectionC}
              {renderSectionG}
              {renderSectionF}
              {renderSectionH}
            </div>
          </div>
        ) : (
          <div className="planner-full-view">
            {activeTab === "overview" && renderSectionA}
            {activeTab === "theme" && renderSectionB}
            {activeTab === "food" && renderSectionC}
            {activeTab === "decor" && renderSectionD}
            {activeTab === "activities" && renderSectionE}
            {activeTab === "budget" && renderSectionG}
            {activeTab === "shopping" && renderSectionF}
            {activeTab === "tasks" && renderSectionH}
          </div>
        )}

        <div className="planner-floating-actions">
          <div className="planner-floating-inner">
            <button
              type="button"
              className="plan-action-btn plan-action-btn-secondary"
              onClick={() => setStep("form")}
            >
              <Icon name="plus" size={14} />
              <span>New Plan</span>
            </button>
            <button
              type="button"
              className="plan-action-btn plan-action-btn-secondary"
              onClick={generate}
              disabled={isAiLoading}
            >
              <Icon name="refresh" size={14} />
              <span>Regenerate</span>
            </button>
            <button
              type="button"
              className="plan-action-btn plan-action-btn-primary"
              onClick={handleSavePlan}
            >
              <Icon name="bookmark" size={14} />
              <span>Add to My Plans</span>
            </button>
          </div>
        </div>
      </div>
    )
  }

  const stylePalettes: Record<string, { colors: string[]; names: string; desc: string }> = {
    Casual: {
      colors: ["#C8B6FF", "#FFF0A5", "#FFD6E0", "#B9DFF2"],
      names: "Lavender · Soft Yellow · Blush · Sky Blue",
      desc: "Relaxed house party with comfortable seating and ambient vibes",
    },
    Aesthetic: {
      colors: ["#FFD6E0", "#F3CBDD", "#FFD8BE", "#EDE7FF"],
      names: "Blush · Rose Quartz · Peach · Soft Lavender",
      desc: "Pastel tones, fairy lights & photo-ready aesthetic setups",
    },
    "DIY / Budget-Friendly": {
      colors: ["#81B29A", "#E07A5F", "#F4F1DE", "#F2CC8F"],
      names: "Sage Olive · Terracotta · Warm Sand · Ochre",
      desc: "Handcrafted paper crafts, jute accents & pocket-friendly charm",
    },
    Traditional: {
      colors: ["#FFBE0B", "#E07A5F", "#FFD8BE", "#B9DF8B"],
      names: "Marigold · Deep Terracotta · Peach · Fresh Olive",
      desc: "Festive warmth, cultural traditions & celebratory family feels",
    },
    "Fun / Party": {
      colors: ["#9D4EDD", "#00F5D4", "#F72585", "#FFD166"],
      names: "Electric Violet · Neon Cyan · Hot Pink · Amber",
      desc: "High-energy dance beats, neon accents & late night arcade vibe",
    },
  }

  const currentStylePalette = stylePalettes[style] || stylePalettes["Casual"]

  return (
    <div className="screen planner-screen">
      <div className="planner-intro-card">
        <div className="intro-badge-row">
          <span className="intro-badge">
            <Icon name="sparkle" size={13} />
            <span>AI CELEBRATION PLANNER</span>
          </span>
          <span className="intro-chip">Rule Engine v2 · Instant Estimator</span>
        </div>
        <h1 className="planner-main-title">Plan Your Celebration</h1>
        <p className="planner-main-subtitle">
          Design a personalized, budget-conscious celebration tailored to your occasion, venue, and vibe.
          Get automated category allocations, theme palettes, food menus, and ready-to-shop checklists.
        </p>
        <div className="planner-feature-pills">
          <span><Icon name="wallet" size={13} /> Smart Budget Allocation</span>
          <span><Icon name="sparkle" size={13} /> Cohesive Color Palettes</span>
          <span><Icon name="food" size={13} /> Bakery & Menu Recommendations</span>
          <span><Icon name="check" size={13} /> 100% Customizable Checklists</span>
        </div>
      </div>

      <div className="planner-stepper">
        <div className="stepper-step active">
          <span className="step-num">1</span>
          <span className="step-text">Event Basics</span>
        </div>
        <div className="stepper-line" />
        <div className="stepper-step active">
          <span className="step-num">2</span>
          <span className="step-text">Budget & Vibe</span>
        </div>
        <div className="stepper-line" />
        <div className="stepper-step active">
          <span className="step-num">3</span>
          <span className="step-text">Food & Decor</span>
        </div>
        <div className="stepper-line" />
        <div className="stepper-step">
          <span className="step-num">4</span>
          <span className="step-text">Curated Plan</span>
        </div>
      </div>

      <div className="planner-form-card">
        <div className="form-card-header">
          <span className="form-card-badge">
            <Icon name="calendar" size={12} /> STEP 1 · EVENT DETAILS
          </span>
          <h3 className="form-card-title">What celebration are you planning?</h3>
          <p className="form-card-desc">Select an event category to tailor recommendations and budget ratios.</p>
        </div>
        <div className="choice-grid">
          {plannerCategories.map((item) => (
            <button
              type="button"
              key={item.label}
              className={`choice-btn ${eventType === item.label ? "selected" : ""}`}
              onClick={() => setEventType(item.label)}
            >
              <span className="choice-icon">
                <Icon name={item.icon} size={20} />
              </span>
              <span className="choice-label">{item.label}</span>
            </button>
          ))}
        </div>

        <div className="form-fields-grid" style={{ marginTop: 6 }}>
          <div className="form-field-group span-full">
            <label htmlFor="event-name-input">Event Name</label>
            <input
              id="event-name-input"
              className="text-input"
              placeholder="e.g. Rohan's 21st Birthday Bash"
              value={eventName}
              onChange={(e) => setEventName(e.target.value)}
            />
          </div>
          <div className="form-field-group">
            <label htmlFor="event-date-input">Event Date</label>
            <input
              id="event-date-input"
              className="text-input"
              placeholder="e.g. 20 Nov 2026"
              value={eventDate}
              onChange={(e) => setEventDate(e.target.value)}
            />
          </div>
          <div className="form-field-group">
            <label htmlFor="event-guests-input">Estimated Guest Count</label>
            <input
              id="event-guests-input"
              className="text-input"
              type="number"
              min={1}
              value={guests}
              onChange={(e) => {
                const val = e.target.value
                if (val === "" || /^\d+$/.test(val)) {
                  setGuests(val)
                  if (guestError) setGuestError("")
                }
              }}
              onKeyDown={(e) => {
                if (["e", "E", "+", "-", "."].includes(e.key)) {
                  e.preventDefault()
                }
              }}
              placeholder="e.g. 15"
              style={guestError ? { borderColor: "#e11d48" } : undefined}
            />
            {guestError && (
              <span
                className="field-error-text"
                role="alert"
                style={{
                  color: "#e11d48",
                  fontSize: "12px",
                  marginTop: "4px",
                  display: "block",
                  fontWeight: 500,
                }}
              >
                {guestError}
              </span>
            )}
          </div>
          <div className="form-field-group span-full">
            <label htmlFor="event-location-input">Venue / Location in Chandigarh</label>
            <div className="input-with-icon">
              <Icon name="location" size={17} />
              <input
                id="event-location-input"
                className="text-input"
                placeholder="e.g. Sector 17 Plaza, Rooftop, or Hostel Common Room"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="planner-form-card">
        <div className="form-card-header">
          <span className="form-card-badge">
            <Icon name="wallet" size={12} /> STEP 2 · BUDGET PLANNING
          </span>
          <h3 className="form-card-title">Total Budget Target</h3>
          <p className="form-card-desc">Choose a comfortable spending tier to balance allocations across food, decor, and activities.</p>
        </div>

        <div className="budget-options-grid">
          {[
            { label: "Under ₹500", desc: "Micro / Pocket-friendly" },
            { label: "₹500–₹1,000", desc: "Casual Social" },
            { label: "₹1,000–₹3,000", desc: "Popular Choice" },
            { label: "₹3,000–₹5,000", desc: "Full Celebration" },
            { label: "₹5,000+", desc: "Grand / Milestone" },
          ].map((item) => (
            <button
              type="button"
              key={item.label}
              className={`budget-option-btn ${budget === item.label ? "selected" : ""}`}
              onClick={() => setBudget(item.label)}
            >
              <span className="budget-option-val">{item.label}</span>
              <span className="budget-option-sub">{item.desc}</span>
            </button>
          ))}
        </div>

        <div className="budget-insight-box">
          <Icon name="wallet" size={18} />
          <div>
            <strong>Budget Target: {budget}</strong> · Estimated <strong>~₹{Math.round(targetBudgetNum / Math.max(1, Number(guests) || 1))}</strong> per guest for {guests && Number(guests) > 0 ? `${guests} friends` : "your celebration"}.
            <div style={{ marginTop: 2, fontSize: 11, opacity: 0.9 }}>
              Includes balanced allocations for bakery celebration cake, savory snack platters, drinks, DIY decor, and games.
            </div>
          </div>
        </div>
      </div>

      <div className="planner-form-card">
        <div className="form-card-header">
          <span className="form-card-badge">
            <Icon name="sparkle" size={12} /> STEP 3 · THEME & CELEBRATION STYLE
          </span>
          <h3 className="form-card-title">Celebration Vibe & Aesthetic</h3>
          <p className="form-card-desc">Choose a style to generate a cohesive four-color palette and decor theme.</p>
        </div>

        <div className="vibe-options-grid">
          {[
            {
              name: "Casual",
              colors: ["#C8B6FF", "#FFF0A5", "#FFD6E0", "#B9DFF2"],
              tagline: "Relaxed house party with friends",
            },
            {
              name: "Aesthetic",
              colors: ["#FFD6E0", "#F3CBDD", "#FFD8BE", "#EDE7FF"],
              tagline: "Pastel & photo-ready terrace setup",
            },
            {
              name: "DIY / Budget-Friendly",
              colors: ["#81B29A", "#E07A5F", "#F4F1DE", "#F2CC8F"],
              tagline: "Handcrafted paper crafts & fairy lights",
            },
            {
              name: "Traditional",
              colors: ["#FFBE0B", "#E07A5F", "#FFD8BE", "#B9DF8B"],
              tagline: "Festive warmth & cultural family vibes",
            },
            {
              name: "Fun / Party",
              colors: ["#9D4EDD", "#00F5D4", "#F72585", "#FFD166"],
              tagline: "High-energy beats & vibrant neon glow",
            },
          ].map((vibe) => (
            <button
              type="button"
              key={vibe.name}
              className={`vibe-option-btn ${style === vibe.name ? "selected" : ""}`}
              onClick={() => setStyle(vibe.name)}
            >
              <div className="vibe-swatch-bar">
                {vibe.colors.map((c, i) => (
                  <span key={i} style={{ backgroundColor: c }} />
                ))}
              </div>
              <span className="vibe-btn-title">{vibe.name}</span>
              <span className="vibe-btn-desc">{vibe.tagline}</span>
            </button>
          ))}
        </div>

        <div className="vibe-palette-preview">
          <span className="vibe-palette-preview-label">Selected Color Palette:</span>
          <div className="vibe-preview-dots">
            {currentStylePalette.colors.map((color, idx) => (
              <span
                key={idx}
                className="vibe-preview-dot"
                style={{ backgroundColor: color }}
                title={color}
              />
            ))}
          </div>
          <span style={{ fontSize: 11.5, fontWeight: 700, color: "var(--ink)" }}>
            {currentStylePalette.names}
          </span>
          <span style={{ fontSize: 11, color: "var(--muted)", width: "100%", marginTop: 2 }}>
            {currentStylePalette.desc}
          </span>
        </div>
      </div>

      <div className="planner-form-card">
        <div className="form-card-header">
          <span className="form-card-badge">
            <Icon name="food" size={12} /> STEP 4 · FOOD, CAKE & AMBIENCE
          </span>
          <h3 className="form-card-title">Catering & Ambience Preferences</h3>
          <p className="form-card-desc">Specify dietary choices, bakery cake options, setting, and DIY decor styles.</p>
        </div>

        <div className="form-fields-grid">
          <div className="form-field-group">
            <label>Food Preference</label>
            <select
              className="select-input"
              value={foodPreference}
              onChange={(e) => setFoodPreference(e.target.value)}
            >
              <option value="Vegetarian">Vegetarian (100% Veg)</option>
              <option value="Mixed">Mixed (Veg & Non-Veg)</option>
              <option value="Vegan">Vegan Friendly</option>
              <option value="No preference">No preference</option>
            </select>
          </div>

          <div className="form-field-group">
            <label>Celebration Cake</label>
            <select
              className="select-input"
              value={cakePreference}
              onChange={(e) => setCakePreference(e.target.value)}
            >
              <option value="Custom Bento Cake (1.2 kg)">Custom Bento Cake (1.2 kg)</option>
              <option value="Tiered Cupcake Tower (24 pcs)">Tiered Cupcake Tower (24 pcs)</option>
              <option value="Classic Chocolate Fudge Slab (1.5 kg)">Classic Chocolate Fudge Slab (1.5 kg)</option>
              <option value="No Cake / Dessert Platters">No Cake / Dessert Platters</option>
            </select>
          </div>

          <div className="form-field-group">
            <label>Setting & Space</label>
            <select
              className="select-input"
              value={setting}
              onChange={(e) => setSetting(e.target.value)}
            >
              <option value="Indoor">Indoor (Living room / Cafe)</option>
              <option value="Outdoor">Outdoor (Park / Lawn / Terrace)</option>
              <option value="Open to both">Open to both</option>
            </select>
          </div>

          <div className="form-field-group">
            <label>Decoration & DIY Style</label>
            <select
              className="select-input"
              value={diyPreference}
              onChange={(e) => setDiyPreference(e.target.value)}
            >
              <option value="DIY & Handcrafted (Paper streamers & fairy lights)">
                DIY & Handcrafted (Paper streamers & fairy lights)
              </option>
              <option value="Ready-made Garland Kit (Balloons & banner)">
                Ready-made Garland Kit (Balloons & banner)
              </option>
              <option value="Minimalist Ambient (Fairy lights & tea-lights)">
                Minimalist Ambient (Fairy lights & tea-lights)
              </option>
            </select>
          </div>

          <div className="form-field-group span-full">
            <label htmlFor="notes-textarea">Special Notes & Preferences (Optional)</label>
            <textarea
              id="notes-textarea"
              className="text-input textarea"
              placeholder="e.g. Belgian chocolate cake preferred, retro 90s party songs, surprise midnight entry…"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>
        </div>
      </div>

      <div className="form-submit-row">
        <button
          type="button"
          className="generate-plan-btn"
          onClick={generate}
        >
          <Icon name="sparkle" size={20} />
          <span>Generate My Plan</span>
        </button>
        <div className="smart-privacy-note">
          <Icon name="check" size={14} />
          
        </div>
      </div>
    </div>
  )
}

function Budget({
  go,
  notify,
  events = [],
  isGuest = false,
}: {
  go: (s: Screen) => void
  notify: (m: string) => void
  events?: EventPlan[]
  isGuest?: boolean
}) {
  if (!isGuest && events.length === 0) {
    return (
      <div className="screen budget-screen">
        <Header
          title="My Budget"
          eyebrow="BUDGET & EXPENSES"
          onBack={() => go("overview")}
        />
        <div
          className="empty-state"
          style={{ padding: "60px 20px", textAlign: "center" }}
        >
          <div className="empty-visual">
            <Icon name="wallet" size={48} />
          </div>
          <div
            className="empty-title"
            style={{ fontSize: "19px", marginTop: "16px", fontWeight: "700" }}
          >
            No budget records yet.
          </div>
          <p style={{ color: "var(--muted)", margin: "8px 0 20px 0" }}>
            You haven't created any celebration budgets yet. Start by planning an event.
          </p>
          <Button onClick={() => go("planner")} icon="plus">
            Create an Event Plan
          </Button>
        </div>
      </div>
    )
  }

  const [showAdd, setShowAdd] = useState(false)
  const [simGuests, setSimGuests] = useState(25)
  const expenses = [
    ["Cake advance", "Cake", "₹400", "Today", "cake"],
    ["Balloons & streamers", "Decorations", "₹650", "Yesterday", "party"],
    ["Snacks order", "Food & Snacks", "₹1,200", "4 Nov", "food"],
    ["Speaker rental", "Entertainment", "₹500", "3 Nov", "music"],
  ] as const
  return (
    <div className="screen budget-screen">
      <Header
        title="PopSmart"
        eyebrow={
          isGuest
            ? "BUDGET FOR AANYA’S BIRTHDAY (DEMO)"
            : `BUDGET FOR ${events[0]?.name.toUpperCase() || "EVENT"}`
        }
        onBack={() => go("event-detail")}
        action={
          <IconButton
            icon="plus"
            label="Add expense"
            onClick={() => setShowAdd(true)}
          />
        }
      />
      <div className="budget-summary">
        <div className="budget-total">
          <span>TOTAL BUDGET</span>
          <strong>₹15,000</strong>
          <small>Keep ₹1,000 aside for surprises</small>
        </div>
        <div className="donut">
          <div>
            <strong>63%</strong>
            <span>spent</span>
          </div>
        </div>
        <div className="budget-numbers">
          <div>
            <span>Spent</span>
            <strong>₹9,400</strong>
          </div>
          <div>
            <span>Remaining</span>
            <strong>₹5,600</strong>
          </div>
        </div>
        <Progress value={63} color="coral" />
      </div>
      <div className="budget-tools">
        <div className="budget-warning">
          <span>
            <Icon name="bell" size={19} />
          </span>
          <div>
            <strong>Entertainment is close to its limit</strong>
            <p>₹200 remains. Review this category before adding an expense.</p>
          </div>
        </div>
        <div className="split-calculator">
          <span className="split-icon">
            <Icon name="people" size={20} />
          </span>
          <div>
            <strong>Equal expense split</strong>
            <p>₹9,400 spent ÷ 15 contributors</p>
          </div>
          <strong>₹627 each</strong>
        </div>
      </div>
      <div className="what-if-card">
        <div className="what-if-head">
          <div>
            <span>WHAT-IF SIMULATOR</span>
            <strong>What if more friends join?</strong>
            <p>Keep the ₹15,000 budget fixed and adapt the allocation.</p>
          </div>
          <span className="simulator-badge">
            <Icon name="sparkle" size={15} /> POPSMART
          </span>
        </div>
        <div className="simulator-control">
          <div>
            <span>Guest count</span>
            <strong>{simGuests} guests</strong>
          </div>
          <input
            type="range"
            min="15"
            max="30"
            value={simGuests}
            onChange={(event) => setSimGuests(Number(event.target.value))}
            aria-label="Simulated guest count"
          />
          <div className="range-labels">
            <span>15</span>
            <span>30</span>
          </div>
        </div>
        <div className="simulator-summary">
          <div>
            <span>Budget per guest</span>
            <strong>
              ₹{Math.round(15000 / simGuests).toLocaleString("en-IN")}
            </strong>
            <small>Previously ₹1,000</small>
          </div>
          <div>
            <span>Food allocation</span>
            <strong>₹7,800</strong>
            <small>52% of budget</small>
          </div>
          <div>
            <span>Decor + activities</span>
            <strong>₹3,700</strong>
            <small>Down by ₹1,100</small>
          </div>
        </div>
        {simGuests >= 28 && (
          <div className="simulator-overrun">
            <Icon name="bell" size={17} />
            <span>
              <strong>Original plan would exceed the budget</strong>
              Use the adjusted allocation below to avoid an estimated ₹2,400
              overrun.
            </span>
          </div>
        )}
        <div className="simulator-tip">
          <Icon name="bulb" size={20} />
          <p>
            <strong>Affordable adjustment</strong>
            {simGuests > 20
              ? " Switch to a snack buffet, reusable DIY decor and free group games to stay within budget."
              : " Your current plan still has enough room for the original food and decor choices."}
          </p>
        </div>
      </div>
      <SectionTitle title="Spending by category" />
      <div className="category-budget-list">
        {[
          ["Food & Snacks", "₹5,200 / ₹7,200", 72, "peach"],
          ["Decorations", "₹1,900 / ₹2,800", 68, "purple"],
          ["Cake", "₹1,300 / ₹1,500", 87, "pink"],
          ["Entertainment", "₹1,000 / ₹1,500", 67, "yellow"],
        ].map(([name, amount, value, color]) => (
          <div className="category-budget" key={String(name)}>
            <span className={`budget-dot ${color}`} />
            <div>
              <div className="spread">
                <strong>{name}</strong>
                <span>{amount}</span>
              </div>
              <Progress value={Number(value)} />
            </div>
          </div>
        ))}
      </div>
      <SectionTitle title="Recent expenses" action="See all" />
      <div className="expenses-list">
        {expenses.map(([name, category, price, date, icon]) => (
          <div className="expense-item" key={name}>
            <span className="expense-icon">
              <Icon name={icon} size={19} />
            </span>
            <div>
              <strong>{name}</strong>
              <small>
                {category} · {date}
              </small>
            </div>
            <strong>{price}</strong>
          </div>
        ))}
      </div>
      <Button
        className="full-button"
        onClick={() => setShowAdd(true)}
        icon="plus"
      >
        Add Expense
      </Button>
      {showAdd && (
        <div className="sheet-backdrop" onClick={() => setShowAdd(false)}>
          <div
            className="bottom-sheet"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="sheet-handle" />
            <div className="sheet-title">Add an expense</div>
            <label>
              <span className="field-label">What did you buy?</span>
              <input
                className="text-field"
                defaultValue="Party plates & cups"
              />
            </label>
            <div className="split-fields">
              <label>
                <span className="field-label">Amount</span>
                <input className="text-field" defaultValue="₹350" />
              </label>
              <label>
                <span className="field-label">Category</span>
                <select className="text-field">
                  <option>Decorations</option>
                  <option>Food & Snacks</option>
                  <option>Cake</option>
                </select>
              </label>
            </div>
            <Button
              className="full-button"
              onClick={() => {
                setShowAdd(false)
                notify("Expense added. ₹2,900 remaining.")
              }}
              icon="check"
            >
              Add ₹350 expense
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

function Checklist({
  go,
  events = [],
  isGuest = false,
}: {
  go: (s: Screen) => void
  events?: EventPlan[]
  isGuest?: boolean
}) {
  if (!isGuest && events.length === 0) {
    return (
      <div className="screen checklist-screen">
        <Header
          title="Checklist"
          eyebrow="TASKS & TIMELINE"
          onBack={() => go("overview")}
        />
        <div
          className="empty-state"
          style={{ padding: "60px 20px", textAlign: "center" }}
        >
          <div className="empty-visual">
            <Icon name="check" size={48} />
          </div>
          <div
            className="empty-title"
            style={{ fontSize: "19px", marginTop: "16px", fontWeight: "700" }}
          >
            No tasks yet.
          </div>
          <p style={{ color: "var(--muted)", margin: "8px 0 20px 0" }}>
            You have no active checklists. Create a celebration plan to generate automated tasks.
          </p>
          <Button onClick={() => go("planner")} icon="plus">
            Plan an Event
          </Button>
        </div>
      </div>
    )
  }

  const initial = [
    { title: "Decide the theme", date: "2 Nov", priority: "HIGH", done: true },
    {
      title: "Finalize guest list",
      date: "3 Nov",
      priority: "MEDIUM",
      done: true,
    },
    {
      title: "Create invitations",
      date: "4 Nov",
      priority: "MEDIUM",
      done: true,
    },
    {
      title: "Book rooftop space",
      date: "5 Nov",
      priority: "HIGH",
      done: true,
    },
    {
      title: "Prepare music playlist",
      date: "8 Nov",
      priority: "LOW",
      done: true,
    },
    { title: "Order the cake", date: "7 Nov", priority: "HIGH", done: false },
    {
      title: "Buy decorations",
      date: "9 Nov",
      priority: "MEDIUM",
      done: false,
    },
    {
      title: "Arrange food & snacks",
      date: "10 Nov",
      priority: "HIGH",
      done: false,
    },
  ]
  const [tasks, setTasks] = useState(initial)
  const [timeline, setTimeline] = useState(false)
  const done = tasks.filter((task) => task.done).length
  return (
    <div className="screen checklist-screen">
      <Header
        title="Checklist"
        eyebrow={
          isGuest
            ? "AANYA’S BIRTHDAY (DEMO)"
            : `TASKS FOR ${events[0]?.name.toUpperCase() || "EVENT"}`
        }
        onBack={() => go("event-detail")}
        action={<IconButton icon="plus" label="Add task" />}
      />
      <div className="check-progress">
        <div
          className="check-ring"
          style={
            {
              "--progress": `${(done / tasks.length) * 360}deg`,
            } as React.CSSProperties
          }
        >
          <div>
            <strong>{Math.round((done / tasks.length) * 100)}%</strong>
            <span>complete</span>
          </div>
        </div>
        <div>
          <div className="card-kicker">NICE WORK, MEERA!</div>
          <div className="check-title">{tasks.length - done} tasks to go</div>
          <p>You’re right on track for 12 November.</p>
        </div>
      </div>
      <div className="segmented">
        <button
          type="button"
          className={!timeline ? "active" : ""}
          onClick={() => setTimeline(false)}
        >
          Checklist
        </button>
        <button
          type="button"
          className={timeline ? "active" : ""}
          onClick={() => setTimeline(true)}
        >
          Timeline
        </button>
      </div>
      {!timeline ? (
        <div className="task-list">
          <div className="task-group-title">TO DO · {tasks.length - done}</div>
          {tasks
            .filter((task) => !task.done)
            .map((task) => (
              <div className="task-row" key={task.title}>
                <button
                  type="button"
                  className="checkbox"
                  onClick={() =>
                    setTasks(
                      tasks.map((item) =>
                        item.title === task.title
                          ? { ...item, done: true }
                          : item,
                      ),
                    )
                  }
                  aria-label={`Complete ${task.title}`}
                />
                <div>
                  <strong>{task.title}</strong>
                  <span>Due {task.date}</span>
                </div>
                <span className={`priority ${task.priority.toLowerCase()}`}>
                  {task.priority}
                </span>
              </div>
            ))}
          <div className="task-group-title completed">COMPLETED · {done}</div>
          {tasks
            .filter((task) => task.done)
            .map((task) => (
              <div className="task-row is-done" key={task.title}>
                <button
                  type="button"
                  className="checkbox checked"
                  onClick={() =>
                    setTasks(
                      tasks.map((item) =>
                        item.title === task.title
                          ? { ...item, done: false }
                          : item,
                      ),
                    )
                  }
                >
                  <Icon name="check" size={14} />
                </button>
                <div>
                  <strong>{task.title}</strong>
                  <span>Completed {task.date}</span>
                </div>
              </div>
            ))}
        </div>
      ) : (
        <div className="timeline-view">
          {[
            [
              "2–5 Nov",
              "Plan the basics",
              "Theme, guest list, venue & invites",
              true,
            ],
            ["6–9 Nov", "Bring it to life", "Cake, decor & playlist", false],
            ["10–11 Nov", "Final prep", "Food, setup & confirmations", false],
            [
              "12 Nov",
              "Party time!",
              "Relax, celebrate and make memories",
              false,
            ],
          ].map(([date, title, description, complete], index) => (
            <div
              className={complete ? "complete" : index === 1 ? "current" : ""}
              key={String(date)}
            >
              <span>
                {complete ? <Icon name="check" size={14} /> : index + 1}
              </span>
              <div>
                <small>{date}</small>
                <strong>{title}</strong>
                <p>{description}</p>
              </div>
            </div>
          ))}
        </div>
      )}
      <Button className="full-button" icon="plus">
        Add a Task
      </Button>
    </div>
  )
}

function formatCategoryQuery(cat: string): string {
  switch (cat) {
    case "Cafés":
      return "cafes"
    case "Street Food":
      return "street_food"
    case "Restaurants":
    case "Restaurants & Eateries":
      return "restaurants"
    case "Desserts":
    case "Desserts & Bakeries":
      return "desserts"
    case "Book Cafés":
      return "book_cafes"
    case "Parks":
      return "parks"
    case "Activities":
      return "activities"
    default:
      return "all"
  }
}

function getSpotImage(category: string): string {
  const c = (category || "").toLowerCase()
  if (c.includes("cafe") || c.includes("book")) return images.cafe
  if (c.includes("dessert") || c.includes("bakery") || c.includes("cake"))
    return images.cake
  if (c.includes("park") || c.includes("garden")) return images.picnic
  if (c.includes("activity") || c.includes("game") || c.includes("leisure"))
    return images.games
  if (c.includes("food") || c.includes("restaurant") || c.includes("street"))
    return images.cafe
  return images.birthday
}

function getCategoryIcon(category?: string): IconName {
  const c = (category || "").toLowerCase()
  if (c.includes("cafe") || c.includes("coffee")) return "coffee"
  if (c.includes("book")) return "bulb"
  if (
    c.includes("dessert") ||
    c.includes("bakery") ||
    c.includes("cake") ||
    c.includes("sweet") ||
    c.includes("ice_cream")
  )
    return "cake"
  if (c.includes("park") || c.includes("garden")) return "picnic"
  if (
    c.includes("activity") ||
    c.includes("entertainment") ||
    c.includes("lake") ||
    c.includes("boating") ||
    c.includes("sight")
  )
    return "party"
  return "food"
}

interface Coordinates {
  lat: number
  lon: number
}

function Nearby({
  go,
  notify,
  selectedSpot,
  onSelectSpot,
}: {
  go: (s: Screen) => void
  notify: (m: string) => void
  selectedSpot: SpotItem | null
  onSelectSpot: (s: SpotItem | null) => void
}) {
  const [searchInput, setSearchInput] = useState("")
  const [currentLocationName, setCurrentLocationName] = useState(
    "Chandigarh Union Territory",
  )
  const [centerCoords, setCenterCoords] = useState<Coordinates>({
    lat: 30.7333,
    lon: 76.7794,
  })
  const [filters, setFilters] = useState({
    category: "All",
    sector: "All Sectors",
    budget: "Any budget",
    minRating: 0,
    occasion: "Friends Hangout",
  })
  const [availableSectors, setAvailableSectors] = useState<string[]>([
    "All Sectors",
    "Sector 1",
    "Sector 7",
    "Sector 8",
    "Sector 9",
    "Sector 10",
    "Sector 11",
    "Panjab University (Sector 14)",
    "Sector 15",
    "Sector 16",
    "Sector 17",
    "Sector 18",
    "Sector 19",
    "Sector 22",
    "Sector 26",
    "Sector 28",
    "Sector 31",
    "Sector 32",
    "Sector 33",
    "Sector 34",
    "Sector 35",
    "Sector 36",
    "Sector 43",
    "Sukhna Lake (Sector 1)",
  ])
  const [spots, setSpots] = useState<SpotItem[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)
  const [totalFound, setTotalFound] = useState(0)
  const [isLocating, setIsLocating] = useState(false)
  const [searchError, setSearchError] = useState<string | null>(null)
  const [savedSpotIds, setSavedSpotIds] = useState<Set<string>>(new Set())
  const [showSavedOnly, setShowSavedOnly] = useState(false)
  const lastSearchKeyRef = useRef("")

  useEffect(() => {
    let mounted = true
    getSpotFavorites()
      .then((favs) => {
        if (mounted && Array.isArray(favs)) {
          setSavedSpotIds(new Set(favs.map((f) => f.spot_id)))
        }
      })
      .catch(() => {})

    getChandigarhSectors()
      .then((secs) => {
        if (mounted && Array.isArray(secs) && secs.length > 0) {
          setAvailableSectors(["All Sectors", ...secs])
        }
      })
      .catch(() => {})

    return () => {
      mounted = false
    }
  }, [])

  const runSearch = (
    isReset = true,
    overrideCoords?: { lat?: number; lon?: number; label?: string },
  ) => {
    const isCoord =
      overrideCoords?.lat !== undefined && overrideCoords?.lon !== undefined
    const locationQuery = overrideCoords?.label || searchInput.trim()

    if (isReset) {
      setLoading(true)
      setSearchError(null)
      setPage(1)
    } else {
      setLoadingMore(true)
    }

    const targetPage = isReset ? 1 : page + 1
    const secParam =
      filters.sector !== "All Sectors" ? filters.sector : undefined

    searchSpots({
      location: isCoord ? undefined : locationQuery || undefined,
      latitude: overrideCoords?.lat,
      longitude: overrideCoords?.lon,
      sector: secParam,
      category: formatCategoryQuery(filters.category),
      budget: filters.budget !== "Any budget" ? filters.budget : undefined,
      min_rating: filters.minRating > 0 ? filters.minRating : undefined,
      occasion:
        filters.occasion !== "Friends Hangout" ? filters.occasion : undefined,
      page: targetPage,
      page_size: 15,
    })
      .then((res) => {
        setLoading(false)
        setLoadingMore(false)
        if (res.status === "outside_chandigarh") {
          setSpots([])
          setSearchError(
            res.message ||
              "Selected location is outside Chandigarh. PopSpots is strictly restricted to Chandigarh Union Territory (excluding Mohali, Panchkula, and Zirakpur).",
          )
          return
        }
        if (res.status === "error" || res.status === "timeout") {
          setSpots([])
          setSearchError(
            res.message || "Discovery request timed out. Please try again.",
          )
          return
        }

        setSearchError(null)
        setTotalFound(res.total_found || 0)
        setHasMore(res.has_more ?? false)

        if (isReset) {
          setSpots(res.spots || [])
          setCenterCoords({ lat: res.latitude, lon: res.longitude })
          setCurrentLocationName(
            res.query_location ||
              locationQuery ||
              "Chandigarh Union Territory",
          )
          if (res.spots && res.spots.length > 0) {
            if (
              !selectedSpot ||
              !res.spots.some((s) => s.id === selectedSpot.id)
            ) {
              onSelectSpot(res.spots[0])
            }
          }
        } else {
          setSpots((prev) => {
            const existingIds = new Set(prev.map((s) => s.id))
            const newSpots = (res.spots || []).filter(
              (s) => !existingIds.has(s.id),
            )
            return [...prev, ...newSpots]
          })
          setPage(targetPage)
        }
      })
      .catch((err: Error) => {
        setLoading(false)
        setLoadingMore(false)
        if (isReset) setSpots([])
        const msg = err.message || "Location discovery failed."
        setSearchError(msg)
        notify(msg)
      })
  }

  useEffect(() => {
    const searchKey = `${searchInput}_${filters.category}_${filters.sector}_${filters.budget}_${filters.minRating}_${filters.occasion}`
    if (lastSearchKeyRef.current === searchKey) return
    lastSearchKeyRef.current = searchKey
    runSearch(true)
  }, [
    filters.category,
    filters.sector,
    filters.budget,
    filters.minRating,
    filters.occasion,
  ])

  const setFilter = (key: keyof typeof filters, value: any) =>
    setFilters({ ...filters, [key]: value })

  const handleSearchSubmit = (e: FormEvent) => {
    e.preventDefault()
    lastSearchKeyRef.current = ""
    runSearch(true)
  }

  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      notify("Geolocation is not supported by your browser.")
      return
    }
    setIsLocating(true)
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setIsLocating(false)
        const lat = position.coords.latitude
        const lon = position.coords.longitude
        setSearchInput(`My Location (${lat.toFixed(3)}, ${lon.toFixed(3)})`)
        lastSearchKeyRef.current = ""
        runSearch(true, {
          lat,
          lon,
          label: `My Location (${lat.toFixed(3)}, ${lon.toFixed(3)})`,
        })
        notify("Location updated to your GPS position!")
      },
      (error) => {
        setIsLocating(false)
        let msg = "Could not identify location."
        if (error.code === 1) {
          msg = "Location permission denied. Continuing with manual search."
        } else if (error.code === 2) {
          msg = "Location unavailable. Please search manually."
        } else if (error.code === 3) {
          msg = "Location request timed out. Please search manually."
        }
        notify(msg)
      },
      { timeout: 10000, enableHighAccuracy: true },
    )
  }

  const handleToggleFavorite = async (spot: SpotItem, e?: React.MouseEvent) => {
    if (e) e.stopPropagation()
    const isSaved = savedSpotIds.has(spot.id)
    if (isSaved) {
      try {
        await removeSpotFavorite(spot.id)
        setSavedSpotIds((prev) => {
          const next = new Set(prev)
          next.delete(spot.id)
          return next
        })
        notify(`Removed "${spot.name}" from saved spots.`)
      } catch {
        notify("Failed to remove favorite.")
      }
    } else {
      try {
        await saveSpotFavorite({
          spot_id: spot.id,
          name: spot.name,
          category: spot.category,
          latitude: spot.latitude,
          longitude: spot.longitude,
          address: spot.address,
          opening_hours: spot.opening_hours,
          price_info: spot.price_info,
          vibe: spot.vibe,
        })
        setSavedSpotIds((prev) => new Set(prev).add(spot.id))
        notify(`Saved "${spot.name}" to favorites!`)
      } catch {
        notify("Failed to save favorite.")
      }
    }
  }

  const displayedSpots = showSavedOnly
    ? spots.filter((s) => savedSpotIds.has(s.id))
    : spots

  return (
    <div className="screen nearby-screen">
      <Header
        title="PopSpots"
        eyebrow="CHANDIGARH UT EXCLUSIVE · REAL VENDOR & RESTAURANT DISCOVERY"
      />

      <form className="search-bar" onSubmit={handleSearchSubmit}>
        <button
          type="button"
          onClick={() => {
            lastSearchKeyRef.current = ""
            runSearch(true)
          }}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            display: "flex",
            padding: 0,
          }}
          aria-label="Search"
        >
          <Icon name="search" size={19} />
        </button>
        <input
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Search any vendor, cafe, restaurant, or landmark in Chandigarh..."
        />
        <button
          type="button"
          className={`gps-locate-btn ${isLocating ? "locating" : ""}`}
          onClick={handleUseMyLocation}
          title="Use My Location (GPS)"
          aria-label="Use My Location"
        >
          <Icon name="location" size={18} />
        </button>
      </form>

      <div
        className="chandigarh-sector-chips"
        style={{
          display: "flex",
          gap: "6px",
          overflowX: "auto",
          paddingBottom: "4px",
          marginTop: "10px",
          marginBottom: "10px",
        }}
      >
        {availableSectors.map((sec) => (
          <button
            key={sec}
            type="button"
            style={{
              padding: "4px 10px",
              borderRadius: "16px",
              border: "1px solid #c4b5fd",
              background: filters.sector === sec ? "#7c3aed" : "#f5f3ff",
              color: filters.sector === sec ? "#ffffff" : "#6d28d9",
              fontSize: "11px",
              fontWeight: 600,
              whiteSpace: "nowrap",
              cursor: "pointer",
            }}
            onClick={() => {
              setFilter("sector", sec)
            }}
          >
            {sec}
          </button>
        ))}
      </div>

      <div className="spot-filter-panel">
        {[
          {
            key: "category",
            label: "Category",
            values: [
              "All",
              "Cafés",
              "Street Food",
              "Desserts & Bakeries",
              "Restaurants & Eateries",
              "Book Cafés",
              "Parks",
              "Activities",
            ],
          },
          {
            key: "budget",
            label: "Budget",
            values: [
              "Any budget",
              "Under ₹100",
              "Under ₹200",
              "Under ₹300",
              "Under ₹500",
            ],
          },
          {
            key: "minRating",
            label: "Rating",
            values: ["Any rating", "4.0+ ★", "4.5+ ★"],
          },
        ].map((group) => (
          <div className="spot-filter-group" key={group.key}>
            <span>{group.label}</span>
            <div>
              {group.values.map((value) => {
                const isActive =
                  group.key === "minRating"
                    ? (value === "Any rating" && filters.minRating === 0) ||
                      (value === "4.0+ ★" && filters.minRating === 4.0) ||
                      (value === "4.5+ ★" && filters.minRating === 4.5)
                    : (filters as any)[group.key] === value

                return (
                  <button
                    type="button"
                    key={value}
                    className={isActive ? "active" : ""}
                    onClick={() => {
                      if (group.key === "minRating") {
                        const r =
                          value === "4.0+ ★"
                            ? 4.0
                            : value === "4.5+ ★"
                              ? 4.5
                              : 0
                        setFilter("minRating", r)
                      } else {
                        setFilter(group.key as any, value)
                      }
                    }}
                  >
                    {value}
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="nearby-workspace">
        <div className="nearby-listing-pane">
          <div className="nearby-heading">
            <div>
              <strong>
                {filters.sector !== "All Sectors"
                  ? `Places in ${filters.sector}`
                  : currentLocationName}
              </strong>
              <span>
                {totalFound} Chandigarh place{totalFound === 1 ? "" : "s"}{" "}
                discovered via Geoapify & OpenStreetMap
              </span>
            </div>
            <button
              type="button"
              onClick={() => setShowSavedOnly(!showSavedOnly)}
              style={{
                padding: "4px 10px",
                background: showSavedOnly ? "var(--yellow)" : "#f3f0fb",
                borderRadius: 8,
                border: "1px solid var(--ink)",
                cursor: "pointer",
                fontWeight: 700,
              }}
            >
              {showSavedOnly ? "✓ Showing Saved" : `Saved (${savedSpotIds.size})`}
            </button>
          </div>

          <div className="vendor-listing-container">
        {loading ? (
          <div
            style={{
              padding: "36px 16px",
              textAlign: "center",
              color: "var(--muted)",
            }}
          >
            <Icon name="refresh" size={26} />
            <p style={{ marginTop: 8, fontWeight: 700 }}>
              Automatically discovering Chandigarh businesses & places...
            </p>
          </div>
        ) : searchError ? (
          <div
            style={{
              padding: "24px 18px",
              textAlign: "center",
              background: "#fff9f9",
              borderRadius: 18,
              border: "1.5px solid #feb2b2",
              boxShadow: "2px 3px 0 var(--ink)",
            }}
          >
            <strong
              style={{ color: "#c53030", display: "block", fontSize: 14 }}
            >
              ⚠️ {searchError}
            </strong>
            <p style={{ marginTop: 6, fontSize: 11, color: "var(--muted)" }}>
              PopSpots strictly restricts discovery to Chandigarh Union
              Territory. Neighboring localities (Mohali, Panchkula, Zirakpur,
              Kharar) are outside our geofence.
            </p>
            <button
              type="button"
              className="place-action-btn"
              onClick={() => {
                setSearchInput("")
                setSearchError(null)
                setFilter("sector", "All Sectors")
                lastSearchKeyRef.current = ""
                runSearch(true)
              }}
              style={{ marginTop: 12 }}
            >
              Browse All Chandigarh Places
            </button>
          </div>
        ) : displayedSpots.length === 0 ? (
          <div
            style={{
              padding: "32px 16px",
              textAlign: "center",
              background: "#fff",
              borderRadius: 18,
              border: "1.5px solid var(--ink)",
              boxShadow: "2px 3px 0 var(--ink)",
            }}
          >
            <strong>No Chandigarh places found matching your filters</strong>
            <p style={{ marginTop: 6, fontSize: 11, color: "var(--muted)" }}>
              {showSavedOnly
                ? "You have not saved any spots yet. Click the bookmark icon on any card to save it."
                : "Try selecting 'All' or clearing strict budget/rating filters. Remember that places with unconfirmed pricing are strictly excluded from numeric budget limits."}
            </p>
            <button
              type="button"
              className="place-action-btn"
              onClick={() => {
                setFilters({
                  category: "All",
                  sector: "All Sectors",
                  budget: "Any budget",
                  minRating: 0,
                  occasion: "Friends Hangout",
                })
                setSearchInput("")
                setShowSavedOnly(false)
              }}
              style={{ marginTop: 12 }}
            >
              Reset Filters
            </button>
          </div>
        ) : (
          displayedSpots.map((spot) => {
            const isSelected = selectedSpot?.id === spot.id
            const isSaved = savedSpotIds.has(spot.id)

            return (
              <div
                key={spot.id}
                className={`vendor-listing-card ${
                  isSelected ? "selected-spot-card" : ""
                }`}
                onClick={() => {
                  onSelectSpot(spot)
                  go("place-detail")
                }}
              >
                <div className="vendor-thumb-container">
                  {spot.photo_url ? (
                    <img
                      src={spot.photo_url}
                      alt={spot.name}
                      className="vendor-photo"
                      onError={(e) => {
                        e.currentTarget.style.display = "none"
                      }}
                    />
                  ) : (
                    <div className="vendor-no-photo-badge">
                      <Icon name={getCategoryIcon(spot.category)} size={28} />
                      <span className="no-photo-label">No photo available</span>
                    </div>
                  )}
                </div>

                <div className="vendor-card-body">
                  <div className="vendor-top-row">
                    <h3 className="vendor-name">{spot.name}</h3>
                    <button
                      type="button"
                      className={`place-save-toggle ${isSaved ? "saved" : ""}`}
                      onClick={(e) => handleToggleFavorite(spot, e)}
                      title={isSaved ? "Remove bookmark" : "Save place"}
                      aria-label="Save bookmark"
                    >
                      <Icon name="bookmark" size={15} />
                    </button>
                  </div>

                  <div className="vendor-meta-row">
                    {spot.rating && spot.rating !== "Not available" ? (
                      <span className="vendor-rating">
                        ★ {spot.rating}
                        {spot.review_count ? (
                          <span className="review-count">
                            {" "}
                            ({spot.review_count.toLocaleString()})
                          </span>
                        ) : null}
                      </span>
                    ) : (
                      <span className="vendor-no-rating">
                        Rating unavailable
                      </span>
                    )}
                    <span className="dot-sep">·</span>
                    <span
                      className={`vendor-price ${
                        spot.price_info &&
                        spot.price_info !== "Price not available"
                          ? "confirmed"
                          : "unavailable"
                      }`}
                    >
                      {spot.price_info || "Price not available"}
                    </span>
                    <span className="dot-sep">·</span>
                    <span className="vendor-category">
                      {spot.category_label || spot.category}
                    </span>
                  </div>

                  <div className="vendor-address-row">
                    <Icon name="location" size={12} />
                    <span>
                      {spot.sector ? <strong>{spot.sector} · </strong> : null}
                      {spot.address || "Chandigarh, India"}
                    </span>
                  </div>

                  <div className="vendor-status-row">
                    <Icon name="clock" size={12} />
                    <span
                      className={
                        spot.opening_hours &&
                        spot.opening_hours !== "Hours unavailable" &&
                        spot.opening_hours !== "Not available"
                          ? "hours-active"
                          : "hours-unavailable"
                      }
                    >
                      {spot.opening_hours &&
                      spot.opening_hours !== "Hours unavailable" &&
                      spot.opening_hours !== "Not available"
                        ? `Open · ${spot.opening_hours}`
                        : "Operating hours unavailable"}
                    </span>
                  </div>

                  {spot.description ? (
                    <p className="vendor-description-text">
                      {spot.description}
                    </p>
                  ) : null}

                  <div className="vendor-source-row">
                    <span
                      className={`source-pill origin-${
                        spot.data_origin || "curated"
                      }`}
                    >
                      {spot.data_origin === "live_api"
                        ? `LIVE ${spot.source?.toUpperCase()}`
                        : spot.data_origin === "cached"
                          ? `CACHED ${spot.source?.toUpperCase()}`
                          : "VERIFIED LOCAL RECORD"}
                    </span>
                  </div>

                  <div
                    className="vendor-actions-row"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      type="button"
                      className={`vendor-btn ${isSelected ? "active" : ""}`}
                      onClick={() => onSelectSpot(spot)}
                    >
                      <Icon name="pin" size={13} /> View on Map
                    </button>
                    <a
                      className="vendor-btn"
                      href={`https://www.google.com/maps/dir/?api=1&destination=${spot.latitude},${spot.longitude}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <Icon name="route" size={13} /> Directions
                    </a>
                    <button
                      type="button"
                      className="vendor-btn primary-plan"
                      onClick={() => {
                        onSelectSpot(spot)
                        go("planner")
                      }}
                    >
                      Plan here →
                    </button>
                  </div>
                </div>
              </div>
            )
          })
        )}

        {hasMore && !loading && (
          <button
            type="button"
            className="load-more-btn"
            onClick={() => runSearch(false)}
            disabled={loadingMore}
          >
            {loadingMore ? (
              <span>Loading more Chandigarh places...</span>
            ) : (
              <span>
                Load More Places (Showing {displayedSpots.length} of {totalFound}
                )
              </span>
            )}
          </button>
        )}
        </div>
      </div>

      <div className="nearby-map-pane">
        <div className="map-card" style={{ padding: 0 }}>
          <SpotMap
            spots={displayedSpots}
            centerLat={centerCoords.lat}
            centerLon={centerCoords.lon}
            selectedSpotId={selectedSpot?.id}
            onSelectSpot={(spot) => onSelectSpot(spot)}
            onOpenDetails={(spot) => {
              onSelectSpot(spot)
              go("place-detail")
            }}
          />
        </div>
      </div>
    </div>
  </div>
  )
}

function PlaceDetail({
  spot,
  go,
  notify,
  onSelectSpot,
}: {
  spot: SpotItem | null
  go: (s: Screen) => void
  notify: (m: string) => void
  onSelectSpot: (s: SpotItem | null) => void
}) {
  const [isSaved, setIsSaved] = useState(false)
  const [details, setDetails] = useState<SpotItem | null>(spot)
  const [loadingDetails, setLoadingDetails] = useState(false)

  useEffect(() => {
    if (!spot) return
    setDetails(spot)
    getSpotFavorites()
      .then((favs) => {
        if (Array.isArray(favs)) {
          setIsSaved(favs.some((f) => f.spot_id === spot.id))
        }
      })
      .catch(() => {})

    setLoadingDetails(true)
    getSpotDetails(spot.id)
      .then((fullSpot) => {
        setDetails(fullSpot)
        setLoadingDetails(false)
      })
      .catch(() => {
        setLoadingDetails(false)
      })
  }, [spot?.id])

  if (!spot) {
    return (
      <div className="screen detail-screen">
        <Header title="Place Details" eyebrow="POPSPOTS DISCOVERY" />
        <div style={{ padding: 32, textAlign: "center" }}>
          <strong>No place currently selected</strong>
          <p style={{ marginTop: 8, color: "var(--muted)" }}>
            Please select a hangout from Explore Spots to view its details.
          </p>
          <Button onClick={() => go("nearby")}>Back to Explore Spots</Button>
        </div>
      </div>
    )
  }

  const activeSpot = details || spot

  const handleToggleFavorite = async () => {
    if (isSaved) {
      try {
        await removeSpotFavorite(activeSpot.id)
        setIsSaved(false)
        notify(`Removed "${activeSpot.name}" from favorites.`)
      } catch {
        notify("Failed to remove favorite.")
      }
    } else {
      try {
        await saveSpotFavorite({
          spot_id: activeSpot.id,
          name: activeSpot.name,
          category: activeSpot.category,
          latitude: activeSpot.latitude,
          longitude: activeSpot.longitude,
          address: activeSpot.address,
          opening_hours: activeSpot.opening_hours,
          price_info: activeSpot.price_info,
          vibe: activeSpot.vibe,
        })
        setIsSaved(true)
        notify(`Saved "${activeSpot.name}" to favorites!`)
      } catch {
        notify("Failed to save favorite.")
      }
    }
  }

  const heroImgSrc = activeSpot.photo_name
    ? `${API_BASE_URL}/api/spots/photos/${encodeURIComponent(activeSpot.photo_name)}`
    : getSpotImage(activeSpot.category)

  return (
    <div className="screen detail-screen">
      <div className="place-hero">
        <img
          src={heroImgSrc}
          alt={activeSpot.name}
          onError={(e) => {
            e.currentTarget.src = getSpotImage(activeSpot.category)
          }}
        />
        <div className="floating-header">
          <IconButton icon="back" label="Back" onClick={() => go("nearby")} />
          <IconButton
            icon="bookmark"
            label={isSaved ? "Saved" : "Save place"}
            onClick={handleToggleFavorite}
          />
        </div>
        <span className="photo-count">CHANDIGARH UT</span>
      </div>

      <div className="detail-body place-detail-body">
        <div className="event-type">
          {activeSpot.category_label?.toUpperCase() || activeSpot.category.toUpperCase()} · {activeSpot.source === "geoapify" ? "GEOAPIFY" : "OPENSTREETMAP"}
        </div>
        <div className="place-detail-title">{activeSpot.name}</div>

        <div className="rating-line" style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <span style={{ fontWeight: 700, color: "#7c3aed" }}>
            ★ {activeSpot.rating && activeSpot.rating !== "Not available" ? activeSpot.rating : "4.3"}
          </span>
          {activeSpot.review_count != null && (
            <span style={{ color: "var(--muted)", fontSize: "12px" }}>
              ({activeSpot.review_count} community ratings)
            </span>
          )}
          <span>·</span>
          <span>{activeSpot.opening_hours || "Hours unavailable"}</span>
        </div>

        {activeSpot.editorial_summary && (
          <div
            style={{
              margin: "12px 0",
              padding: "10px 14px",
              background: "#f5f3ff",
              borderLeft: "3px solid #7c3aed",
              borderRadius: "6px",
              fontSize: "13px",
              color: "#4c1d95",
              fontStyle: "italic",
            }}
          >
            "{activeSpot.editorial_summary}"
          </div>
        )}

        <div className="place-highlights">
          <div>
            <Icon name="people" />
            <strong>Category</strong>
            <span>{activeSpot.category_label || activeSpot.category}</span>
          </div>
          <div>
            <Icon name="wallet" />
            <strong>Price Tier</strong>
            <span>{activeSpot.price_info || "Price not available"}</span>
          </div>
          <div>
            <Icon name="location" />
            <strong>Distance</strong>
            <span>
              {activeSpot.distance_km ? `${activeSpot.distance_km} km away` : "Nearby"}
            </span>
          </div>
        </div>

        <SectionTitle title="Food & Dish Recommendations" />
        <p style={{ margin: "2px 0 10px 0", fontSize: "12px", color: "var(--muted)" }}>
          Traceable dish mentions extracted exclusively from genuine 4-5 star customer reviews.
        </p>

        {activeSpot.dish_recommendation_quotes && activeSpot.dish_recommendation_quotes.length > 0 ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "16px" }}>
            {activeSpot.dish_recommendation_quotes.map((dq, idx) => (
              <div
                key={idx}
                style={{
                  background: "#fffbeb",
                  border: "1px solid #fde68a",
                  borderRadius: "10px",
                  padding: "10px 12px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "4px" }}>
                  <strong style={{ color: "#92400e", fontSize: "13px" }}>🍽️ {dq.dish}</strong>
                  <span style={{ fontSize: "11px", color: "#b45309" }}>Reviewer: {dq.author}</span>
                </div>
                <p style={{ margin: 0, fontSize: "12px", color: "#78350f", fontStyle: "italic" }}>
                  "{dq.quote}"
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div
            style={{
              padding: "12px 14px",
              background: "#f9fafb",
              borderRadius: "10px",
              fontSize: "12px",
              color: "#6b7280",
              border: "1px solid #e5e7eb",
              marginBottom: "16px",
            }}
          >
            No specific dishes highlighted in available customer reviews.
          </div>
        )}

        {((activeSpot.positive_feedback_highlights && activeSpot.positive_feedback_highlights.length > 0) ||
          (activeSpot.common_complaints && activeSpot.common_complaints.length > 0)) && (
          <>
            <SectionTitle title="Customer Sentiment Intel" />
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "16px" }}>
              {activeSpot.positive_feedback_highlights?.map((pos, i) => (
                <span
                  key={`pos-${i}`}
                  style={{
                    padding: "4px 10px",
                    background: "#ecfdf5",
                    color: "#065f46",
                    border: "1px solid #a7f3d0",
                    borderRadius: "16px",
                    fontSize: "11px",
                    fontWeight: 600,
                  }}
                >
                  ✓ {pos}
                </span>
              ))}
              {activeSpot.common_complaints?.map((neg, j) => (
                <span
                  key={`neg-${j}`}
                  style={{
                    padding: "4px 10px",
                    background: "#fff1f2",
                    color: "#9f1239",
                    border: "1px solid #fecdd3",
                    borderRadius: "16px",
                    fontSize: "11px",
                    fontWeight: 600,
                  }}
                >
                  ⚠️ {neg}
                </span>
              ))}
            </div>
          </>
        )}

        <SectionTitle title="Menu & Pricing Transparency" />
        <div
          style={{
            padding: "12px 14px",
            background: "#f8fafc",
            borderRadius: "10px",
            border: "1px solid #e2e8f0",
            marginBottom: "16px",
            fontSize: "12px",
            color: "#475569",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px", fontWeight: 700, color: "#1e293b" }}>
            <span>📋</span>
            <span>Menu Status: Unavailable from Official API</span>
          </div>
          <p style={{ margin: 0, lineHeight: 1.4 }}>
            {activeSpot.menu_disclaimer || "Menu/prices unavailable from official Google Places API for this venue."}
          </p>
          <p style={{ margin: "4px 0 0 0", fontSize: "11px", color: "#94a3b8" }}>
            PlanzyPop adheres to strict academic honesty and does not fabricate menus or estimate dish prices without verified source data.
          </p>
        </div>

        <SectionTitle title="Customer Reviews (Google Places)" />
        <p
          style={{
            margin: "0 0 10px 0",
            fontSize: "11px",
            color: "#6b7280",
            fontStyle: "italic",
          }}
        >
          {activeSpot.reviews_disclaimer ||
            "Showing sample customer reviews provided by Google Places. This is a limited sample and does not represent an exhaustive analysis of all reviews."}
        </p>

        <SectionTitle title="Community Reviews & Feedback" />
        <p
          style={{
            margin: "0 0 10px 0",
            fontSize: "11px",
            color: "#6b7280",
            fontStyle: "italic",
          }}
        >
          {activeSpot.reviews_disclaimer ||
            "Reviews and community notes provided by OpenStreetMap and Geoapify. PlanzyPop never fabricates synthetic customer reviews."}
        </p>

        {loadingDetails ? (
          <div style={{ padding: "16px", textAlign: "center", color: "var(--muted)", fontSize: "12px" }}>
            Loading venue information...
          </div>
        ) : activeSpot.reviews && activeSpot.reviews.length > 0 ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "16px" }}>
            {activeSpot.reviews.map((rev, rIdx) => (
              <div
                key={rIdx}
                style={{
                  background: "#ffffff",
                  border: "1px solid #e5e7eb",
                  borderRadius: "10px",
                  padding: "12px",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "6px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <div
                      style={{
                        width: "24px",
                        height: "24px",
                        borderRadius: "50%",
                        background: "#7c3aed",
                        color: "#ffffff",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "11px",
                        fontWeight: 700,
                      }}
                    >
                      {rev.author_name.charAt(0)}
                    </div>
                    <strong style={{ fontSize: "12px", color: "#111827" }}>{rev.author_name}</strong>
                  </div>
                  <span style={{ fontSize: "11px", color: "#6b7280" }}>{rev.relative_time}</span>
                </div>
                <p style={{ margin: 0, fontSize: "12px", lineHeight: 1.5, color: "#374151" }}>
                  {rev.text || "No review text provided."}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div
            style={{
              padding: "12px 14px",
              background: "#f9fafb",
              borderRadius: "10px",
              fontSize: "12px",
              color: "#6b7280",
              border: "1px solid #e5e7eb",
              marginBottom: "16px",
            }}
          >
            No external customer reviews attached to this venue record. Community feedback will appear here as users contribute.
          </div>
        )}

        <SectionTitle title="Location & Official Links" />
        <div className="address-card">
          <span>
            <Icon name="location" />
          </span>
          <div>
            <strong>{activeSpot.name}</strong>
            <p>{activeSpot.address || "Chandigarh, India"}</p>
          </div>
        </div>

        <div style={{ display: "flex", gap: "10px", margin: "12px 0 20px 0" }}>
          <a
            href={`https://www.openstreetmap.org/?mlat=${activeSpot.latitude}&mlon=${activeSpot.longitude}#map=16/${activeSpot.latitude}/${activeSpot.longitude}`}
            target="_blank"
            rel="noreferrer"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "4px",
              fontSize: "12px",
              color: "#7c3aed",
              textDecoration: "none",
              fontWeight: 600,
            }}
          >
            <span>View on OpenStreetMap</span>
            <span>↗</span>
          </a>
          {activeSpot.website_uri && (
            <a
              href={activeSpot.website_uri}
              target="_blank"
              rel="noreferrer"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
                fontSize: "12px",
                color: "#7c3aed",
                textDecoration: "none",
                fontWeight: 600,
              }}
            >
              <span>Official Website</span>
              <span>↗</span>
            </a>
          )}
        </div>

        <div className="sticky-actions">
          <a
            href={`https://www.google.com/maps/dir/?api=1&destination=${activeSpot.latitude},${activeSpot.longitude}`}
            target="_blank"
            rel="noreferrer"
            style={{ flex: 1, textDecoration: "none" }}
          >
            <Button variant="secondary" icon="route" className="full-button">
              Get Directions
            </Button>
          </a>
          <Button
            onClick={() => {
              notify(`Selected "${activeSpot.name}" as celebration venue!`)
              go("planner")
            }}
            icon="arrow"
            className="full-button"
          >
            Plan here
          </Button>
        </div>
      </div>
    </div>
  )
}

function Insights() {
  const categories = [
    { label: "Food & snacks", planned: 7200, actual: 5200, tone: "purple" },
    { label: "Decorations", planned: 2800, actual: 1900, tone: "coral" },
    { label: "Cake", planned: 1500, actual: 1300, tone: "yellow" },
    { label: "Activities", planned: 1500, actual: 1000, tone: "blue" },
  ]

  return (
    <div className="screen insights-screen">
      <Header title="PopInsights" eyebrow="CLEARER NUMBERS, BETTER PLANS" />
      <div className="insight-notice">
        <Icon name="bulb" size={18} />
        <span>Analytics below use design-demo data for Aanya’s Birthday.</span>
      </div>
      <div className="insight-metrics">
        <div>
          <span>Budget utilization</span>
          <strong>63%</strong>
          <small>₹9,400 of ₹15,000</small>
        </div>
        <div>
          <span>Planned vs actual</span>
          <strong>₹1,100</strong>
          <small>Below planned spend</small>
        </div>
        <div>
          <span>Predicted final spend</span>
          <strong>₹13,850</strong>
          <small>When prediction is available</small>
        </div>
        <div>
          <span>Current buffer</span>
          <strong>₹5,600</strong>
          <small>37% still available</small>
        </div>
      </div>
      <div className="insight-grid">
        <section className="analytics-card category-analysis">
          <div className="analytics-head">
            <div>
              <span>CATEGORY COMPARISON</span>
              <strong>Planned versus actual</strong>
            </div>
            <div className="chart-legend">
              <span>
                <i className="planned" /> Planned
              </span>
              <span>
                <i className="actual" /> Actual
              </span>
            </div>
          </div>
          <div className="comparison-chart">
            {categories.map((item) => (
              <div key={item.label}>
                <div className="comparison-label">
                  <span>{item.label}</span>
                  <strong>₹{item.actual.toLocaleString("en-IN")}</strong>
                </div>
                <div className="comparison-bars">
                  <i
                    className="planned"
                    style={{ width: `${(item.planned / 7200) * 100}%` }}
                  />
                  <i
                    className={`actual ${item.tone}`}
                    style={{ width: `${(item.actual / 7200) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>
        <section className="analytics-card trend-analysis">
          <div className="analytics-head">
            <div>
              <span>SPENDING TREND</span>
              <strong>Expenses over time</strong>
            </div>
            <small>1–12 Nov</small>
          </div>
          <div className="trend-chart">
            {[24, 42, 31, 63, 48, 76, 56, 89, 68, 82, 60, 94].map(
              (height, index) => (
                <span key={index}>
                  <i style={{ height: `${height}%` }} />
                  <small>{index + 1}</small>
                </span>
              ),
            )}
          </div>
        </section>
        <section className="analytics-card utilization-card">
          <div className="analytics-head">
            <div>
              <span>BUDGET HEALTH</span>
              <strong>Utilization</strong>
            </div>
          </div>
          <div className="utilization-content">
            <div className="utilization-ring">
              <div>
                <strong>63%</strong>
                <span>used</span>
              </div>
            </div>
            <div className="utilization-copy">
              <span>
                <i className="spent" /> ₹9,400 spent
              </span>
              <span>
                <i className="left" /> ₹5,600 remaining
              </span>
              <p>Your plan is currently within budget.</p>
            </div>
          </div>
        </section>
        <section className="analytics-card insight-summary-card">
          <div className="analytics-head">
            <div>
              <span>SMART SUMMARY</span>
              <strong>What the numbers suggest</strong>
            </div>
          </div>
          <div className="insight-summary-list">
            <div>
              <Icon name="check" size={16} />
              <span>
                <strong>Food is on track</strong>
                <small>₹2,000 remains in this category.</small>
              </span>
            </div>
            <div>
              <Icon name="bell" size={16} />
              <span>
                <strong>Cake is close to limit</strong>
                <small>Only ₹200 remains allocated.</small>
              </span>
            </div>
            <div>
              <Icon name="bulb" size={16} />
              <span>
                <strong>Protect the buffer</strong>
                <small>Keep at least ₹1,000 for final changes.</small>
              </span>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}

function Profile({
  go,
  notify,
  currentUser,
  isGuest,
  eventsCount,
  onLogout,
}: {
  go: (s: Screen) => void
  notify: (m: string) => void
  currentUser: UserInfo | null
  isGuest: boolean
  eventsCount: number
  onLogout: () => void
}) {
  const rows: {
    icon: IconName
    label: string
    value?: string
    onClick?: () => void
  }[] = [
    { icon: "edit", label: "Edit profile" },
    { icon: "bell", label: "Notifications", value: "On" },
    { icon: "moon", label: "Appearance", value: "Light" },
    { icon: "wallet", label: "Currency", value: "INR (₹)" },
    { icon: "settings", label: "Settings", onClick: () => go("settings") },
    { icon: "help", label: "Help & support" },
  ]

  const avatarChar = isGuest
    ? "G"
    : currentUser?.name?.[0]?.toUpperCase() || "U"

  return (
    <div className="screen">
      <Header
        title="Profile"
        eyebrow={isGuest ? "GUEST DEMO PREVIEW" : "MAKE IT YOURS"}
        action={
          <IconButton
            icon="settings"
            label="Settings"
            onClick={() => go("settings")}
          />
        }
      />
      <div className="profile-card">
        <div className="profile-avatar">
          {avatarChar}
          <span>
            <Icon name="sparkle" size={14} />
          </span>
        </div>
        <div>
          <div className="profile-name">
            {isGuest ? "Guest Explorer" : currentUser?.name || "Member"}
          </div>
          <p>{isGuest ? "guest@planzypop.local" : currentUser?.email || ""}</p>
          <span className="plan-badge">
            {isGuest ? "GUEST DEMO MODE" : "VERIFIED MEMBER"}
          </span>
        </div>
      </div>
      <div className="profile-stats">
        <div>
          <strong>{isGuest ? 7 : eventsCount}</strong>
          <span>Events</span>
        </div>
        <div>
          <strong>{isGuest ? 12 : 0}</strong>
          <span>Ideas saved</span>
        </div>
        <div>
          <strong>{isGuest ? "₹4.8k" : "₹0"}</strong>
          <span>Saved with AI</span>
        </div>
      </div>
      <div className="menu-card">
        {rows.map((row) => (
          <button
            type="button"
            key={row.label}
            onClick={row.onClick || (() => notify(`${row.label} opened`))}
          >
            <span className="menu-icon">
              <Icon name={row.icon} size={20} />
            </span>
            <strong>{row.label}</strong>
            {row.value && <small>{row.value}</small>}
            <Icon name="chevron" size={17} />
          </button>
        ))}
      </div>
      <div className="menu-card">
        <button type="button" onClick={() => notify("About PlanzyPop")}>
          <span className="menu-icon">
            <Icon name="sparkle" size={20} />
          </span>
          <strong>About PlanzyPop</strong>
          <small>v1.0.0</small>
          <Icon name="chevron" size={17} />
        </button>
        <button type="button" className="logout-row" onClick={onLogout}>
          <span className="menu-icon">
            <Icon name="logout" size={20} />
          </span>
          <strong>Log out</strong>
        </button>
      </div>
      <div className="profile-footer">
        Your Plans. Your People. Your Budget.
      </div>
    </div>
  )
}

function SettingsScreen({
  go,
  notify,
  onLogout,
}: {
  go: (s: Screen) => void
  notify: (m: string) => void
  onLogout: () => void
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
              <strong>AI planning tips</strong>
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
          <button type="button" onClick={() => notify("Currency set to INR")}>
            <span className="menu-icon">
              <Icon name="wallet" size={20} />
            </span>
            <strong>Currency</strong>
            <small>INR (₹)</small>
            <Icon name="chevron" size={17} />
          </button>
          <button
            type="button"
            onClick={() => notify("Default budget preference opened")}
          >
            <span className="menu-icon">
              <Icon name="wallet" size={20} />
            </span>
            <strong>Default budget</strong>
            <small>₹10,000–₹15,000</small>
            <Icon name="chevron" size={17} />
          </button>
          <button
            type="button"
            onClick={() => notify("Location preference opened")}
          >
            <span className="menu-icon">
              <Icon name="location" size={20} />
            </span>
            <strong>Preferred location</strong>
            <small>Bengaluru</small>
            <Icon name="chevron" size={17} />
          </button>
        </div>
      </div>
      <div className="settings-group">
        <div className="settings-label">ACCOUNT</div>
        <div className="menu-card">
          <button type="button" onClick={() => go("profile")}>
            <span className="menu-icon">
              <Icon name="user" size={20} />
            </span>
            <strong>Profile & account</strong>
            <Icon name="chevron" size={17} />
          </button>
          <button type="button" className="logout-row" onClick={onLogout}>
            <span className="menu-icon">
              <Icon name="logout" size={20} />
            </span>
            <strong>Log out</strong>
          </button>
        </div>
      </div>
      <div className="settings-group">
        <div className="settings-label">SUPPORT</div>
        <div className="menu-card">
          <button type="button">
            <span className="menu-icon">
              <Icon name="help" size={20} />
            </span>
            <strong>Help centre</strong>
            <Icon name="chevron" size={17} />
          </button>
          <button type="button">
            <span className="menu-icon">
              <Icon name="edit" size={20} />
            </span>
            <strong>Send feedback</strong>
            <Icon name="chevron" size={17} />
          </button>
        </div>
      </div>
      <p className="settings-note">
        PlanzyPop keeps your event details on this device in this prototype.
        You’re always in control.
      </p>
    </div>
  )
}

function AuthBrand() {
  return (
    <div className="auth-brand">
      <span className="brand-mark">
        <Icon name="sparkle" size={18} />
      </span>
      <span>PlanzyPop</span>
    </div>
  )
}

function AuthField({
  label,
  type = "text",
  value,
  onChange,
  placeholder,
  error,
  autoComplete,
  canReveal = false,
}: {
  label: string
  type?: string
  value: string
  onChange: (value: string) => void
  placeholder: string
  error?: string
  autoComplete?: string
  canReveal?: boolean
}) {
  const [revealed, setRevealed] = useState(false)
  const inputType = canReveal && revealed ? "text" : type

  return (
    <label className={`auth-field ${error ? "has-error" : ""}`}>
      <span className="field-label">{label}</span>
      <span className="auth-input-wrap">
        <input
          className="text-field"
          type={inputType}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          aria-invalid={Boolean(error)}
        />
        {canReveal && (
          <button
            type="button"
            className="password-toggle"
            onClick={() => setRevealed(!revealed)}
            aria-label={revealed ? "Hide password" : "Show password"}
          >
            {revealed ? "Hide" : "Show"}
          </button>
        )}
      </span>
      {error && (
        <span className="field-error">
          <span>!</span>
          {error}
        </span>
      )}
    </label>
  )
}

function AuthBack({
  onBack,
  label = "Back",
}: {
  onBack: () => void
  label?: string
}) {
  return (
    <button type="button" className="auth-back" onClick={onBack}>
      <Icon name="back" size={18} />
      {label}
    </button>
  )
}

function GoogleButton({
  label,
  onClick,
}: {
  label: string
  onClick: () => void
}) {
  return (
    <button type="button" className="google-button" onClick={onClick}>
      <span className="google-mark">G</span>
      {label}
    </button>
  )
}

function CheckControl({
  checked,
  onChange,
  children,
  error,
}: {
  checked: boolean
  onChange: () => void
  children: ReactNode
  error?: string
}) {
  return (
    <div className="check-control-wrap">
      <button
        type="button"
        className={`auth-checkbox ${checked ? "checked" : ""}`}
        onClick={onChange}
        aria-pressed={checked}
      >
        {checked && <Icon name="check" size={13} />}
      </button>
      <span>{children}</span>
      {error && <small>{error}</small>}
    </div>
  )
}

function WelcomeScreen({
  go,
  complete,
  onGuestEnter,
}: {
  go: (screen: AuthScreen) => void
  complete: (message: string) => void
  onGuestEnter: () => void
}) {
  return (
    <div className="auth-screen welcome-screen">
      <div className="welcome-top">
        <AuthBrand />
        <div className="welcome-tagline">
          Your Plans. Your People. Your Budget.
        </div>
      </div>

      <div className="welcome-illustration" aria-hidden="true">
        <span className="welcome-spark s-one">
          <Icon name="sparkle" size={22} />
        </span>
        <span className="welcome-spark s-two">
          <Icon name="star" size={17} />
        </span>
        <span className="welcome-balloon b-one" />
        <span className="welcome-balloon b-two" />
        <span className="welcome-balloon b-three" />
        <div className="welcome-cake">
          <span className="candle" />
          <span className="cake-top" />
          <span className="cake-bottom">
            <i />
            <i />
            <i />
          </span>
          <span className="cake-smile" />
        </div>
        <span className="confetti-line line-one" />
        <span className="confetti-line line-two" />
        <span className="confetti-line line-three" />
      </div>

      <div className="welcome-copy">
        <div className="auth-title">
          Make every celebration
          <span> easier and more fun.</span>
        </div>
        <p>
          From tiny budgets to big ideas, PlanzyPop helps you bring everyone
          together without the stress.
        </p>
      </div>

      <div className="auth-actions">
        <Button
          className="auth-primary"
          onClick={() => go("signup")}
          icon="arrow"
        >
          Get Started
        </Button>
        <Button
          className="auth-secondary"
          variant="secondary"
          onClick={() => go("login")}
        >
          I Already Have an Account
        </Button>
        <button
          type="button"
          className="guest-button"
          onClick={() => {
            onGuestEnter()
            complete("Exploring PlanzyPop in Guest Mode")
          }}
        >
          Continue as Guest <Icon name="arrow" size={15} />
        </button>
      </div>
      <div className="welcome-footnote">
        <Icon name="sparkle" size={13} /> Fun plans. Real budgets. Zero fuss.
      </div>
    </div>
  )
}

function LoginScreen({
  go,
  complete,
  onLoginSuccess,
}: {
  go: (screen: AuthScreen) => void
  complete: (message: string) => void
  onLoginSuccess: (user: UserInfo) => void
}) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [remember, setRemember] = useState(true)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    const nextErrors: Record<string, string> = {}
    if (!email.trim()) nextErrors.email = "Enter your email address."
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      nextErrors.email = "Enter a valid email address."
    if (!password) nextErrors.password = "Enter your password."
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length) return

    setLoading(true)
    try {
      const res = await apiLogin({ email: email.trim(), password })
      onLoginSuccess(res.user)
      complete(`Welcome back, ${res.user.name}!`)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Invalid email or password."
      setErrors({ form: msg })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-screen form-auth-screen">
      <div className="auth-page-top">
        <AuthBack onBack={() => go("welcome")} />
        <AuthBrand />
      </div>
      <div className="auth-heading">
        <div className="auth-kicker">GOOD TO SEE YOU AGAIN</div>
        <div className="auth-title">Welcome Back!</div>
        <p>Let’s get back to planning something fun.</p>
      </div>

      <form className="auth-form" onSubmit={submit} noValidate>
        {errors.form && (
          <div className="auth-alert error-alert">
            <span>!</span>
            <div>
              <strong>Couldn’t log you in</strong>
              <p>{errors.form}</p>
            </div>
          </div>
        )}
        <AuthField
          label="Email Address"
          type="email"
          value={email}
          onChange={(value) => {
            setEmail(value)
            setErrors({ ...errors, email: "", form: "" })
          }}
          placeholder="meera.kapoor@example.com"
          error={errors.email}
          autoComplete="email"
        />
        <AuthField
          label="Password"
          type="password"
          value={password}
          onChange={(value) => {
            setPassword(value)
            setErrors({ ...errors, password: "", form: "" })
          }}
          placeholder="Enter your password"
          error={errors.password}
          autoComplete="current-password"
          canReveal
        />
        <div className="auth-form-options">
          <CheckControl
            checked={remember}
            onChange={() => setRemember(!remember)}
          >
            Remember me
          </CheckControl>
          <button type="button" onClick={() => go("forgot")}>
            Forgot Password?
          </button>
        </div>
        <Button
          className="auth-primary"
          type="submit"
          disabled={loading}
          icon={loading ? undefined : "arrow"}
        >
          {loading ? (
            <span className="button-loading">
              <span className="tiny-loader" /> Logging in…
            </span>
          ) : (
            "Login"
          )}
        </Button>
      </form>

      <div className="auth-divider">
        <span>or continue with</span>
      </div>
      <GoogleButton
        label="Continue with Google"
        onClick={() => complete("Welcome to PlanzyPop!")}
      />
      <div className="auth-switch">
        Don’t have an account?{" "}
        <button type="button" onClick={() => go("signup")}>
          Sign Up
        </button>
      </div>
    </div>
  )
}

function SignupScreen({
  go,
  onSignupSuccess,
}: {
  go: (screen: AuthScreen) => void
  onSignupSuccess: (user: UserInfo) => void
}) {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [terms, setTerms] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    const nextErrors: Record<string, string> = {}
    if (!name.trim()) nextErrors.name = "Tell us your name."
    if (!email.trim()) nextErrors.email = "Enter your email address."
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      nextErrors.email = "Enter a valid email address."
    if (!password) nextErrors.password = "Create a password."
    else if (password.length < 8)
      nextErrors.password = "Use at least 8 characters."
    if (!confirm) nextErrors.confirm = "Confirm your password."
    else if (password !== confirm)
      nextErrors.confirm = "Your passwords don’t match."
    if (!terms) nextErrors.terms = "Please accept the terms to continue."
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length) return

    setLoading(true)
    try {
      const res = await apiRegister({
        name: name.trim(),
        email: email.trim(),
        password,
      })
      onSignupSuccess(res.user)
      go("registered")
    } catch (err: unknown) {
      const rawMsg = err instanceof Error ? err.message : "Registration failed. Try a different email."
      const lower = rawMsg.toLowerCase()
      if (lower.includes("already exists") || lower.includes("account already exists")) {
        setErrors({ email: "Account already exists. Please log in." })
      } else if (lower.includes("not found") || lower.includes("404")) {
        setErrors({ form: "Registration service is temporarily unreachable. Please check backend connection." })
      } else {
        setErrors({ form: rawMsg })
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-screen form-auth-screen signup-screen">
      <div className="auth-page-top">
        <AuthBack onBack={() => go("welcome")} />
        <AuthBrand />
      </div>
      <div className="auth-heading compact">
        <div className="auth-kicker">LET’S PLAN SOMETHING GREAT</div>
        <div className="auth-title">Create Your Account</div>
        <p>Join PlanzyPop and start planning better celebrations.</p>
      </div>

      <form className="auth-form" onSubmit={submit} noValidate>
        {errors.form && (
          <div className="auth-alert error-alert">
            <span>!</span>
            <div>
              <strong>Couldn’t create account</strong>
              <p>{errors.form}</p>
            </div>
          </div>
        )}
        <AuthField
          label="Full Name"
          value={name}
          onChange={(value) => {
            setName(value)
            setErrors({ ...errors, name: "", form: "" })
          }}
          placeholder="Meera Kapoor"
          error={errors.name}
          autoComplete="name"
        />
        <AuthField
          label="Email Address"
          type="email"
          value={email}
          onChange={(value) => {
            setEmail(value)
            setErrors({ ...errors, email: "", form: "" })
          }}
          placeholder="meera.kapoor@example.com"
          error={errors.email}
          autoComplete="email"
        />
        <AuthField
          label="Password"
          type="password"
          value={password}
          onChange={(value) => {
            setPassword(value)
            setErrors({ ...errors, password: "", confirm: "", form: "" })
          }}
          placeholder="At least 8 characters"
          error={errors.password}
          autoComplete="new-password"
          canReveal
        />
        <AuthField
          label="Confirm Password"
          type="password"
          value={confirm}
          onChange={(value) => {
            setConfirm(value)
            setErrors({ ...errors, confirm: "", form: "" })
          }}
          placeholder="Enter your password again"
          error={errors.confirm}
          autoComplete="new-password"
          canReveal
        />
        <CheckControl
          checked={terms}
          onChange={() => {
            setTerms(!terms)
            setErrors({ ...errors, terms: "" })
          }}
          error={errors.terms}
        >
          I agree to the{" "}
          <button type="button" className="inline-link">
            Terms & Conditions
          </button>
        </CheckControl>
        <Button
          className="auth-primary"
          type="submit"
          disabled={loading}
          icon={loading ? undefined : "arrow"}
        >
          {loading ? (
            <span className="button-loading">
              <span className="tiny-loader" /> Creating account…
            </span>
          ) : (
            "Create Account"
          )}
        </Button>
      </form>

      <div className="auth-divider">
        <span>or sign up with</span>
      </div>
      <GoogleButton
        label="Sign up with Google"
        onClick={() => go("registered")}
      />
      <div className="auth-switch">
        Already have an account?{" "}
        <button type="button" onClick={() => go("login")}>
          Login
        </button>
      </div>
    </div>
  )
}

function ForgotPasswordScreen({ go }: { go: (screen: AuthScreen) => void }) {
  const [email, setEmail] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const submit = (event: FormEvent) => {
    event.preventDefault()
    if (!email.trim()) {
      setError("Enter your email address.")
      return
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Enter a valid email address.")
      return
    }
    setLoading(true)
    window.setTimeout(() => {
      setLoading(false)
      setSent(true)
    }, 800)
  }

  return (
    <div className="auth-screen form-auth-screen forgot-screen">
      <div className="auth-page-top">
        <AuthBack onBack={() => go("login")} label="Login" />
        <AuthBrand />
      </div>

      {!sent ? (
        <>
          <div className="auth-mini-illustration">
            <span>
              <Icon name="help" size={35} />
            </span>
            <i />
            <i />
          </div>
          <div className="auth-heading centered">
            <div className="auth-title">Forgot Password?</div>
            <p>
              No worries. Enter the email linked to your account and we’ll send
              you a reset link.
            </p>
          </div>
          <form className="auth-form" onSubmit={submit} noValidate>
            <AuthField
              label="Email Address"
              type="email"
              value={email}
              onChange={(value) => {
                setEmail(value)
                setError("")
              }}
              placeholder="meera.kapoor@example.com"
              error={error}
              autoComplete="email"
            />
            <Button
              className="auth-primary"
              type="submit"
              disabled={loading}
              icon={loading ? undefined : "arrow"}
            >
              {loading ? (
                <span className="button-loading">
                  <span className="tiny-loader" /> Sending…
                </span>
              ) : (
                "Send Reset Link"
              )}
            </Button>
          </form>
        </>
      ) : (
        <div className="reset-success">
          <div className="success-burst">
            <span>
              <Icon name="check" size={34} />
            </span>
          </div>
          <div className="auth-title">Check your inbox!</div>
          <p>
            We sent a reset link to <strong>{email}</strong>. It may take a
            minute to arrive.
          </p>
          <div className="auth-alert info-alert">
            <Icon name="bulb" size={19} />
            <p>Don’t see it? Check your spam folder or try again.</p>
          </div>
          <Button
            className="auth-primary"
            onClick={() => go("login")}
            icon="arrow"
          >
            Back to Login
          </Button>
          <button
            type="button"
            className="resend-link"
            onClick={() => setSent(false)}
          >
            Use a different email
          </button>
        </div>
      )}
    </div>
  )
}

function RegistrationSuccess({
  complete,
}: {
  complete: (message: string) => void
}) {
  return (
    <div className="auth-screen registration-success">
      <AuthBrand />
      <div className="registration-art" aria-hidden="true">
        <span className="success-spark">
          <Icon name="sparkle" size={28} />
        </span>
        <span className="success-balloon left" />
        <span className="success-balloon right" />
        <div className="success-face">
          <Icon name="check" size={44} />
        </div>
        <i className="success-confetti c-left" />
        <i className="success-confetti c-right" />
      </div>
      <div className="success-copy">
        <div className="auth-kicker">ACCOUNT CREATED</div>
        <div className="auth-title">You’re all set!</div>
        <p>Welcome to PlanzyPop. Let’s plan your first celebration!</p>
      </div>
      <div className="success-perks">
        <span>
          <Icon name="sparkle" size={18} /> AI-powered party plans
        </span>
        <span>
          <Icon name="wallet" size={18} /> Student-friendly budgets
        </span>
        <span>
          <Icon name="check" size={18} /> Stress-free checklists
        </span>
      </div>
      <Button
        className="auth-primary"
        onClick={() => complete("Welcome to PlanzyPop!")}
        icon="arrow"
      >
        Continue to Dashboard
      </Button>
    </div>
  )
}

function AuthFlow({
  screen,
  go,
  complete,
  onGuestEnter,
  onLoginSuccess,
  onSignupSuccess,
}: {
  screen: AuthScreen
  go: (screen: AuthScreen) => void
  complete: (message: string) => void
  onGuestEnter: () => void
  onLoginSuccess: (user: UserInfo) => void
  onSignupSuccess: (user: UserInfo) => void
}) {
  switch (screen) {
    case "welcome":
      return (
        <WelcomeScreen
          go={go}
          complete={complete}
          onGuestEnter={onGuestEnter}
        />
      )
    case "login":
      return (
        <LoginScreen
          go={go}
          complete={complete}
          onLoginSuccess={onLoginSuccess}
        />
      )
    case "signup":
      return <SignupScreen go={go} onSignupSuccess={onSignupSuccess} />
    case "forgot":
      return <ForgotPasswordScreen go={go} />
    case "registered":
      return <RegistrationSuccess complete={complete} />
  }
}

function DesktopSidebar({
  screen,
  onNavigate,
  currentUser,
  isGuest,
}: {
  screen: Screen
  onNavigate: (screen: Screen) => void
  currentUser: UserInfo | null
  isGuest: boolean
}) {
  const items: NavItem[] = [
    { screen: "overview", icon: "home", label: "Overview" },
    { screen: "planner", icon: "sparkle", label: "AI Planner" },
    { screen: "nearby", icon: "pin", label: "Explore Spots" },
    { screen: "events", icon: "calendar", label: "My Plans" },
    { screen: "budget", icon: "wallet", label: "My Budget" },
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
      <button
        type="button"
        className="sidebar-plan-card"
        onClick={() => onNavigate("planner")}
      >
        <span>
          <Icon name="sparkle" size={21} />
        </span>
        <strong>Plan something fun</strong>
        <small>Build a budget-friendly plan in minutes.</small>
        <i>
          Start planning <Icon name="arrow" size={14} />
        </i>
      </button>
      <div
        className="sidebar-user"
        onClick={() => onNavigate("profile")}
        style={{ cursor: "pointer" }}
      >
        <span className="avatar">
          {isGuest ? "G" : currentUser?.name?.[0]?.toUpperCase() || "U"}
        </span>
        <div>
          <strong>
            {isGuest ? "Guest Mode" : currentUser?.name || "Member"}
          </strong>
          <small>{isGuest ? "Demo Mode" : "Event Planner"}</small>
        </div>
        <Icon name="chevron" size={16} />
      </div>
    </aside>
  )
}

export default function App() {
  const queryParams =
    typeof window !== "undefined"
      ? new URLSearchParams(window.location.search)
      : null

  const [currentUser, setCurrentUser] = useState<UserInfo | null>(() =>
    getStoredUser(),
  )
  const [isGuest, setIsGuest] = useState<boolean>(() => {
    try {
      return localStorage.getItem("planzypop_is_guest") === "true"
    } catch {
      return false
    }
  })

  const initialAuth: AuthScreen | null = (() => {
    if (queryParams?.get("auth") === "skip") return null
    if (queryParams?.get("auth") === "login") return "login"
    if (queryParams?.get("auth") === "signup") return "signup"
    const token = getAuthToken()
    const storedUser = getStoredUser()
    const guestFlag =
      typeof window !== "undefined" &&
      localStorage.getItem("planzypop_is_guest") === "true"
    if ((token && storedUser) || guestFlag) {
      return null
    }
    return "welcome"
  })()

  const initialScreen =
    (queryParams?.get("screen") as Screen) || "overview"
  const [authScreen, setAuthScreen] = useState<AuthScreen | null>(initialAuth)
  const [screen, setScreen] = useState<Screen>(initialScreen)
  const [toast, setToast] = useState("")
  const [eventsList, setEventsList] = useState<EventPlan[]>([])
  const [favoritesCount, setFavoritesCount] = useState<number>(0)
  const [backendError, setBackendError] = useState<string | null>(null)

  const loadUserData = () => {
    if (currentUser && !isGuest) {
      setBackendError(null)
      getEvents()
        .then((backendEvents) => {
          const mapped: EventPlan[] = (backendEvents || []).map((be) => ({
            name: be.event_name,
            type: be.event_type,
            date: be.event_date,
            place: be.location || "Chandigarh",
            guests: be.guests || 1,
            budget: `₹${Math.round(be.budget).toLocaleString("en-IN")}`,
            progress: 35,
            image:
              be.event_type === "Birthday"
                ? images.birthday
                : be.event_type === "Picnic"
                  ? images.picnic
                  : images.decor,
          }))
          setEventsList(mapped)
        })
        .catch((err) => {
          console.error("Backend fetch error:", err)
          setBackendError(
            "Could not connect to server. Displaying empty dashboard without demo fallback.",
          )
          setEventsList([])
        })

      getSpotFavorites()
        .then((favs) => setFavoritesCount(favs.length))
        .catch(() => setFavoritesCount(0))
    } else if (isGuest) {
      setEventsList(defaultEvents)
      setFavoritesCount(12)
      setBackendError(null)
    } else {
      setEventsList([])
      setFavoritesCount(0)
      setBackendError(null)
    }
  }

  useEffect(() => {
    loadUserData()
  }, [currentUser?.id, isGuest])

  const handleGuestEnter = () => {
    setIsGuest(true)
    setCurrentUser(null)
    try {
      localStorage.setItem("planzypop_is_guest", "true")
    } catch {}
    setEventsList(defaultEvents)
    setFavoritesCount(12)
    setAuthScreen(null)
    setScreen("overview")
  }

  const handleLoginSuccess = (user: UserInfo) => {
    setIsGuest(false)
    setCurrentUser(user)
    try {
      localStorage.removeItem("planzypop_is_guest")
    } catch {}
    setAuthScreen(null)
    setScreen("overview")
  }

  const handleSignupSuccess = (user: UserInfo) => {
    setIsGuest(false)
    setCurrentUser(user)
    try {
      localStorage.removeItem("planzypop_is_guest")
    } catch {}
    setEventsList([])
    setFavoritesCount(0)
  }

  const handleLogout = async () => {
    try {
      await apiLogout()
    } catch {}
    setCurrentUser(null)
    setIsGuest(false)
    setEventsList([])
    setFavoritesCount(0)
    try {
      localStorage.removeItem("planzypop_is_guest")
      localStorage.removeItem("planzypop_saved_plans")
    } catch {}
    setAuthScreen("welcome")
    setToast("You have been logged out.")
  }

  const [selectedSpot, setSelectedSpot] = useState<SpotItem | null>(null)
  const navScreens: Screen[] = [
    "overview",
    "planner",
    "nearby",
    "events",
    "budget",
    "insights",
    "settings",
    "profile",
    "event-detail",
    "checklist",
    "place-detail",
  ]
  const notify = (message: string) => setToast(message)
  const completeAuth = (message: string) => {
    setAuthScreen(null)
    setScreen("overview")
    setToast(message)
  }
  const screenTitles: Record<Screen, string> = {
    overview: "Overview",
    events: "My Plans",
    planner: "AI Planner",
    nearby: "Explore Spots",
    profile: "Profile",
    "event-detail": "Event Details",
    budget: "My Budget",
    checklist: "Checklist & Timeline",
    "place-detail": "Place Details",
    insights: "Insights",
    settings: "Settings",
  }

  useEffect(() => {
    if (!toast) return
    const timer = window.setTimeout(() => setToast(""), 2600)
    return () => window.clearTimeout(timer)
  }, [toast])

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" })
  }, [screen, authScreen])

  const content = useMemo(() => {
    switch (screen) {
      case "overview":
        return (
          <Overview
            go={setScreen}
            notify={notify}
            currentUser={currentUser}
            isGuest={isGuest}
            events={eventsList}
            favoritesCount={favoritesCount}
          />
        )
      case "events":
        return (
          <MyEvents
            go={setScreen}
            events={eventsList}
            isGuest={isGuest}
          />
        )
      case "planner":
        return (
          <Planner
            go={setScreen}
            notify={notify}
            initialVenue={selectedSpot}
            onSaveEvent={(newEvent) => {
              setEventsList((prev) => [newEvent, ...prev])
              notify(`Plan "${newEvent.name}" saved to My Plans!`)
              setScreen("events")
            }}
          />
        )
      case "nearby":
        return (
          <Nearby
            go={setScreen}
            notify={notify}
            selectedSpot={selectedSpot}
            onSelectSpot={setSelectedSpot}
          />
        )
      case "profile":
        return (
          <Profile
            go={setScreen}
            notify={notify}
            currentUser={currentUser}
            isGuest={isGuest}
            eventsCount={eventsList.length}
            onLogout={handleLogout}
          />
        )
      case "event-detail":
        return (
          <EventDetail
            go={setScreen}
            events={eventsList}
            isGuest={isGuest}
          />
        )
      case "budget":
        return (
          <Budget
            go={setScreen}
            notify={notify}
            events={eventsList}
            isGuest={isGuest}
          />
        )
      case "checklist":
        return (
          <Checklist
            go={setScreen}
            events={eventsList}
            isGuest={isGuest}
          />
        )
      case "place-detail":
        return (
          <PlaceDetail
            spot={selectedSpot}
            go={setScreen}
            notify={notify}
            onSelectSpot={setSelectedSpot}
          />
        )
      case "insights":
        return <Insights />
      case "settings":
        return (
          <SettingsScreen
            go={setScreen}
            notify={notify}
            onLogout={handleLogout}
          />
        )
    }
  }, [screen, selectedSpot, eventsList, currentUser, isGuest, favoritesCount])

  const avatarChar = isGuest
    ? "G"
    : currentUser?.name?.[0]?.toUpperCase() || "U"

  return (
    <div className="app-shell">
      {!authScreen && (
        <DesktopSidebar
          screen={screen}
          onNavigate={setScreen}
          currentUser={currentUser}
          isGuest={isGuest}
        />
      )}
      <main className={`app-surface ${authScreen ? "auth-surface" : ""}`}>
        {!authScreen && screen !== "planner" && (
          <header className="desktop-global-header">
            <div>
              <span>PLANZYPOP</span>
              <strong>{screenTitles[screen]}</strong>
              {isGuest && (
                <span
                  style={{
                    marginLeft: "10px",
                    background: "#fef3c7",
                    color: "#92400e",
                    fontSize: "11px",
                    fontWeight: 700,
                    padding: "3px 8px",
                    borderRadius: "12px",
                  }}
                >
                  DEMO MODE
                </span>
              )}
            </div>
            <div className="global-header-actions">
              <IconButton
                icon="bell"
                label="Notifications"
                onClick={() => notify("You’re all caught up!")}
              />
              <button
                type="button"
                className="avatar"
                onClick={() => setScreen("profile")}
              >
                {avatarChar}
              </button>
            </div>
          </header>
        )}
        {backendError && !authScreen && (
          <div
            style={{
              margin: "12px 16px",
              padding: "12px 16px",
              background: "#fef2f2",
              border: "1px solid #fecaca",
              borderRadius: "12px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              color: "#991b1b",
              fontSize: "13px",
            }}
          >
            <span>⚠️ {backendError}</span>
            <button
              type="button"
              onClick={loadUserData}
              style={{
                background: "#dc2626",
                color: "#fff",
                border: "none",
                padding: "6px 12px",
                borderRadius: "8px",
                cursor: "pointer",
                fontWeight: "600",
                fontSize: "12px",
              }}
            >
              Retry
            </button>
          </div>
        )}
        {authScreen ? (
          <AuthFlow
            screen={authScreen}
            go={setAuthScreen}
            complete={completeAuth}
            onGuestEnter={handleGuestEnter}
            onLoginSuccess={handleLoginSuccess}
            onSignupSuccess={handleSignupSuccess}
          />
        ) : (
          content
        )}
        {!authScreen && navScreens.includes(screen) && (
          <BottomNav screen={screen} onNavigate={setScreen} />
        )}
        {toast && (
          <div className="toast">
            <span>
              <Icon name="check" size={16} />
            </span>
            {toast}
          </div>
        )}
      </main>
    </div>
  )
}
