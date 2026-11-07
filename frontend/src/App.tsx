import {
  useEffect,
  useMemo,
  useState,
  type FormEvent,
  type ReactNode,
} from "react"

type Screen = "overview" | "events" | "planner" | "nearby" | "profile" | "event-detail" | "budget" | "checklist" | "place-detail" | "insights" | "settings"

type IconName = "home" | "calendar" | "sparkle" | "pin" | "user" | "bell" | "arrow" | "wallet" | "check" | "bulb" | "plus" | "people" | "clock" | "back" | "bookmark" | "search" | "star" | "route" | "edit" | "settings" | "help" | "moon" | "logout" | "chevron" | "cake" | "house" | "college" | "party" | "picnic" | "movie" | "location" | "food" | "music" | "gift" | "download" | "refresh"

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
}

const iconPaths: Record<IconName, ReactNode> = {
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
    { screen: "planner", icon: "sparkle", label: "PopPlan" },
    { screen: "nearby", icon: "pin", label: "Explore" },
    { screen: "events", icon: "calendar", label: "My Plans" },
    { screen: "budget", icon: "wallet", label: "Budget" },
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
}: {
  go: (s: Screen) => void
  notify: (m: string) => void
}) {
  return (
    <div className="screen overview-screen">
      <div className="topbar">
        <div className="brand-lockup mobile-only-brand">
          <span className="brand-mark">
            <Icon name="sparkle" size={18} />
          </span>
          <span>PlanzyPop AI</span>
        </div>
        <div className="desktop-page-context">
          <div className="eyebrow">PLANZYPOP WORKSPACE</div>
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
            M
          </button>
        </div>
      </div>

      <div className="hello">
        <div className="eyebrow">WEDNESDAY, 6 NOV · DEMO DATA</div>
        <div className="hero-title">
          Hey, ready to <span className="party-squiggle">make some plans?</span>
        </div>
      </div>

      <div className="overview-metrics">
        <div className="metric-card">
          <span className="metric-icon purple">
            <Icon name="calendar" size={19} />
          </span>
          <div>
            <span>Planned events</span>
            <strong>7</strong>
          </div>
          <small>3 upcoming</small>
        </div>
        <div className="metric-card">
          <span className="metric-icon peach">
            <Icon name="wallet" size={19} />
          </span>
          <div>
            <span>Total planned budget</span>
            <strong>₹20,000</strong>
          </div>
          <small>Across 3 events</small>
        </div>
        <div className="metric-card">
          <span className="metric-icon yellow">
            <Icon name="check" size={19} />
          </span>
          <div>
            <span>Tasks completed</span>
            <strong>18 / 24</strong>
          </div>
          <small>75% on track</small>
        </div>
        <div className="metric-card">
          <span className="metric-icon blue">
            <Icon name="bookmark" size={19} />
          </span>
          <div>
            <span>Saved spots</span>
            <strong>12</strong>
          </div>
          <small>4 recently viewed</small>
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
            <span>Birthday</span>
            <span>9 days to go</span>
          </div>
          <div className="event-name">Aanya’s Birthday</div>
          <div className="event-sub">
            <Icon name="location" size={15} /> Rooftop, Indiranagar · 18 friends
          </div>
        </div>
      </button>

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
            ₹3,250 <span>left</span>
          </div>
          <Progress value={46} />
          <div className="spread">
            <span>Spent ₹2,750</span>
            <strong>54%</strong>
          </div>
        </button>
        <button
          type="button"
          className="dash-card task-card"
          onClick={() => go("checklist")}
        >
          <div className="task-ring">
            <span>5/8</span>
          </div>
          <div className="card-kicker">You’re on a roll</div>
          <div className="task-title">3 tasks left</div>
          <div className="task-next">Next: Order the cake</div>
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
          <div className="task-next">Cafés, parks, desserts & more</div>
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
        </div>
        <div className="saved-spot-strip">
          <button type="button" onClick={() => go("nearby")}>
            <img src={images.cafe} alt="Saved café placeholder" />
            <span>
              <strong>Church Street café result</strong>
              <small>Saved spot · Details pending</small>
            </span>
          </button>
          <button type="button" onClick={() => go("nearby")}>
            <img src={images.games} alt="Saved activity place placeholder" />
            <span>
              <strong>Koramangala activity result</strong>
              <small>Recently viewed · Details pending</small>
            </span>
          </button>
        </div>
      </div>
    </div>
  )
}

function MyEvents({ go }: { go: (s: Screen) => void }) {
  const [tab, setTab] = useState("Upcoming")
  const events = [
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
  return (
    <div className="screen">
      <Header
        title="My Plans"
        eyebrow="CELEBRATIONS YOU’RE SHAPING"
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
      {tab === "Upcoming" ? (
        <div className="event-list">
          <div className="month-label">NOVEMBER · 3 EVENTS</div>
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

function EventDetail({ go }: { go: (s: Screen) => void }) {
  return (
    <div className="screen detail-screen">
      <div className="detail-hero">
        <img src={images.birthday} alt="Aanya's birthday celebration" />
        <div className="floating-header">
          <IconButton icon="back" label="Back" onClick={() => go("events")} />
          <IconButton icon="edit" label="Edit event" />
        </div>
        <div className="detail-gradient">
          <span className="event-type">BIRTHDAY</span>
          <div className="detail-title">Aanya’s Birthday</div>
          <div>12 Nov · 6:30 PM · Indiranagar</div>
        </div>
      </div>
      <div className="detail-body">
        <div className="attendee-row">
          <div className="avatar-stack">
            <span>A</span>
            <span>R</span>
            <span>K</span>
            <span>+15</span>
          </div>
          <div>
            <strong>18 friends invited</strong>
            <small>12 confirmed · 4 pending</small>
          </div>
        </div>
        <div className="summary-card">
          <div className="summary-top">
            <span>Planning progress</span>
            <strong>68%</strong>
          </div>
          <Progress value={68} />
          <p>You’re doing great! Complete 3 more tasks this week.</p>
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
            <small>5 of 8 done</small>
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
            <small>₹3,250 left</small>
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
            <small>8 ideas saved</small>
          </button>
          <button type="button" className="detail-tool pink">
            <span>
              <Icon name="people" />
            </span>
            <strong>Guests</strong>
            <small>12 confirmed</small>
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

function Planner({
  go,
  notify,
}: {
  go: (s: Screen) => void
  notify: (m: string) => void
}) {
  const [step, setStep] = useState<"form" | "loading" | "results">("form")
  const [eventType, setEventType] = useState("Birthday")
  const [budget, setBudget] = useState("₹3,000–₹5,000")
  const [style, setStyle] = useState("Casual")

  const generate = () => {
    setStep("loading")
    window.setTimeout(() => setStep("results"), 1450)
  }

  if (step === "loading") {
    return (
      <div className="screen ai-loading">
        <div className="ai-orbit">
          <span>
            <Icon name="sparkle" size={35} filled />
          </span>
          <i />
          <i />
          <i />
        </div>
        <div className="loading-title">Making your party pop!</div>
        <p>Mixing a fun plan for 18 friends within ₹5,000…</p>
        <div className="loading-steps">
          <span className="done">
            <Icon name="check" size={16} /> Finding theme ideas
          </span>
          <span className="done">
            <Icon name="check" size={16} /> Balancing your budget
          </span>
          <span>
            <span className="tiny-loader" /> Adding snacks & games
          </span>
        </div>
      </div>
    )
  }

  if (step === "results") {
    return (
      <div className="screen planner-results">
        <Header
          title="Your party plan"
          eyebrow="PLANZY RECOMMENDATION ENGINE"
          onBack={() => setStep("form")}
          action={
            <IconButton
              icon="bookmark"
              label="Save plan"
              onClick={() => notify("Plan saved to your ideas")}
            />
          }
        />
        <div className="result-banner">
          <div className="result-badge">
            <Icon name="sparkle" /> SMART PLAN
          </div>
          <div className="result-title">
            Pastel Pop
            <br />
            Birthday Bash
          </div>
          <p>A cosy, colourful house party for 18 friends.</p>
          <div className="result-stats">
            <span>
              <Icon name="wallet" size={16} /> ₹4,650
            </span>
            <span>
              <Icon name="people" size={16} /> 18 guests
            </span>
            <span>
              <Icon name="clock" size={16} /> 3 hrs
            </span>
          </div>
        </div>
        <div className="ai-note">
          <span>
            <Icon name="sparkle" size={19} />
          </span>
          <p>
            <strong>Why this works</strong> It uses DIY decor and crowd-friendly
            snacks, leaving ₹350 as a safety cushion.
          </p>
        </div>
        <SectionTitle title="Your plan, sorted" />
        <div className="result-section lavender">
          <span className="result-icon">
            <Icon name="party" />
          </span>
          <div>
            <div className="result-kicker">THEME & DECOR</div>
            <strong>Pastel Pop</strong>
            <p>
              Lavender streamers, coral balloons, fairy lights and a DIY photo
              corner.
            </p>
            <div className="chip-line">
              <span>₹850 est.</span>
              <span>45 min setup</span>
            </div>
            <button type="button" className="adapt-section">
              <Icon name="refresh" size={13} /> Adapt decor
            </button>
          </div>
        </div>
        <div className="result-section peach">
          <span className="result-icon">
            <Icon name="food" />
          </span>
          <div>
            <div className="result-kicker">FOOD & SNACKS</div>
            <strong>Easy crowd favourites</strong>
            <p>
              Mini sandwiches, masala fries, momos, cold coffee and a 1 kg
              chocolate cake.
            </p>
            <div className="chip-line">
              <span>₹2,300 est.</span>
              <span>Vegetarian</span>
            </div>
            <button type="button" className="adapt-section">
              <Icon name="refresh" size={13} /> Adapt food
            </button>
          </div>
        </div>
        <div className="result-section yellow">
          <span className="result-icon">
            <Icon name="music" />
          </span>
          <div>
            <div className="result-kicker">GAMES & MUSIC</div>
            <strong>Keep everyone moving</strong>
            <p>
              Two Truths & a Lie, Bollywood charades and a shared party
              playlist.
            </p>
            <div className="chip-line">
              <span>Free</span>
              <span>90 min</span>
            </div>
            <button type="button" className="adapt-section">
              <Icon name="refresh" size={13} /> Adapt activities
            </button>
          </div>
        </div>
        <div className="creative-plan-grid">
          <section className="creative-plan-card palette-plan">
            <div className="creative-plan-head">
              <span>
                <Icon name="sparkle" size={19} />
              </span>
              <div>
                <div className="result-kicker">THEME & COLOUR PALETTE</div>
                <strong>Pastel Pop celebration</strong>
              </div>
              <button type="button" className="adapt-section">
                <Icon name="refresh" size={13} /> Adapt
              </button>
            </div>
            <p>
              A cheerful lavender, blush, peach and soft-yellow palette that
              works for a home, terrace or hostel common room.
            </p>
            <div className="plan-palette" aria-label="Suggested colour palette">
              <span className="palette-lavender" />
              <span className="palette-blush" />
              <span className="palette-peach" />
              <span className="palette-yellow" />
              <small>Lavender · Blush · Peach · Soft yellow</small>
            </div>
            <div className="theme-cost">
              <span>Estimated theme + decoration cost</span>
              <strong>₹850</strong>
            </div>
          </section>
          <section className="creative-plan-card diy-plan">
            <div className="creative-plan-head">
              <span>
                <Icon name="bulb" size={19} />
              </span>
              <div>
                <div className="result-kicker">DIY DECORATION IDEAS</div>
                <strong>Simple, reusable setup</strong>
              </div>
              <button type="button" className="adapt-section">
                <Icon name="refresh" size={13} /> Adapt
              </button>
            </div>
            <div className="diy-idea-list">
              <span>
                <Icon name="check" size={14} /> Paper streamer backdrop
              </span>
              <span>
                <Icon name="check" size={14} /> Printed photo props
              </span>
              <span>
                <Icon name="check" size={14} /> Reusable bunting
              </span>
              <span>
                <Icon name="check" size={14} /> Fairy-light photo corner
              </span>
            </div>
          </section>
          <section className="creative-plan-card shopping-plan">
            <div className="creative-plan-head">
              <span>
                <Icon name="gift" size={19} />
              </span>
              <div>
                <div className="result-kicker">SHOPPING CHECKLIST</div>
                <strong>Everything to pick up</strong>
              </div>
            </div>
            <div className="plan-shopping-list">
              {[
                ["30 pastel balloons", "₹240"],
                ["3 paper streamer rolls", "₹180"],
                ["Warm fairy lights", "₹250"],
                ["Reusable bunting", "₹120"],
                ["Tape and photo props", "₹60"],
              ].map(([item, cost]) => (
                <span key={item}>
                  <i>
                    <Icon name="check" size={12} />
                  </i>
                  <strong>{item}</strong>
                  <small>{cost}</small>
                </span>
              ))}
            </div>
          </section>
        </div>
        <div className="expense-plan">
          <SectionTitle title="Estimated expenses" />
          {[
            ["Food & cake", "₹2,300", 49],
            ["Decorations", "₹850", 18],
            ["Drinks", "₹700", 15],
            ["Return gifts", "₹500", 11],
            ["Buffer", "₹300", 7],
          ].map(([label, amount, width]) => (
            <div className="expense-plan-row" key={String(label)}>
              <span>{label}</span>
              <div>
                <i style={{ width: `${width}%` }} />
              </div>
              <strong>{amount}</strong>
            </div>
          ))}
          <div className="total-row">
            <span>Estimated total</span>
            <strong>₹4,650</strong>
          </div>
        </div>
        <div className="sticky-actions">
          <Button variant="secondary" onClick={() => generate()}>
            <Icon name="refresh" size={18} /> Regenerate
          </Button>
          <Button
            onClick={() => {
              notify("Event created! Your plan is ready.")
              go("event-detail")
            }}
            icon="arrow"
          >
            Add to My Events
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="screen planner-screen">
      <Header title="PopPlan" eyebrow="AI-POWERED PARTY PLANNING" />
      <div className="planner-intro">
        <span>
          <Icon name="sparkle" size={28} />
        </span>
        <div>
          <strong>Let’s make it happen!</strong>
          <p>
            Answer a few quick questions and get a practical recommendation that
            fits your vibe and budget.
          </p>
        </div>
      </div>
      <div className="step-indicator">
        <span className="active">1</span>
        <i className="active" />
        <span className="active">2</span>
        <i />
        <span>3</span>
        <small>Basics</small>
        <small>Budget & vibe</small>
        <small>Your plan</small>
      </div>
      <div className="form-section">
        <div className="field-label">What are you planning?</div>
        <div className="choice-grid">
          {plannerCategories.map((item) => (
            <button
              type="button"
              key={item.label}
              className={eventType === item.label ? "selected" : ""}
              onClick={() => setEventType(item.label)}
            >
              <Icon name={item.icon} />
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      </div>
      <div className="form-section">
        <label className="field-label" htmlFor="event-name">
          Event name
        </label>
        <input
          id="event-name"
          className="text-field"
          defaultValue="Aanya's Birthday"
        />
        <div className="split-fields">
          <label>
            <span className="field-label">Date</span>
            <input className="text-field" defaultValue="12 Nov 2025" />
          </label>
          <label>
            <span className="field-label">Guests</span>
            <input className="text-field" type="number" defaultValue="18" />
          </label>
        </div>
        <label>
          <span className="field-label">Location</span>
          <div className="input-icon">
            <Icon name="location" size={18} />
            <input
              className="text-field"
              defaultValue="Indiranagar, Bengaluru"
            />
          </div>
        </label>
        <div className="split-fields">
          <label>
            <span className="field-label">Food preference</span>
            <select className="text-field" defaultValue="Vegetarian">
              <option>Vegetarian</option>
              <option>Mixed</option>
              <option>Vegan</option>
              <option>No preference</option>
            </select>
          </label>
          <label>
            <span className="field-label">Setting</span>
            <select className="text-field" defaultValue="Indoor">
              <option>Indoor</option>
              <option>Outdoor</option>
              <option>Open to both</option>
            </select>
          </label>
        </div>
      </div>
      <div className="form-section">
        <div className="field-label">Total budget</div>
        <div className="budget-options">
          {[
            "Under ₹500",
            "₹500–₹1,000",
            "₹1,000–₹3,000",
            "₹3,000–₹5,000",
            "₹5,000+",
          ].map((item) => (
            <button
              type="button"
              className={budget === item ? "selected" : ""}
              onClick={() => setBudget(item)}
              key={item}
            >
              {item}
            </button>
          ))}
        </div>
      </div>
      <div className="form-section">
        <div className="field-label">Pick a vibe</div>
        <div className="style-options">
          {[
            "Casual",
            "Aesthetic",
            "DIY / Budget-Friendly",
            "Traditional",
            "Fun / Party",
          ].map((item, index) => (
            <button
              type="button"
              className={style === item ? "selected" : ""}
              onClick={() => setStyle(item)}
              key={item}
            >
              <i className={`swatch s${index}`} />
              {item}
            </button>
          ))}
        </div>
        <label>
          <span className="field-label">Anything else we should know?</span>
          <textarea
            className="text-field textarea"
            placeholder="Vegetarian food, loves Bollywood music…"
          />
        </label>
      </div>
      <Button className="generate-button" onClick={generate} icon="sparkle">
        Generate My Plan
      </Button>
      <div className="privacy-note">
        <Icon name="sparkle" size={14} /> Smart suggestions, always editable by
        you.
      </div>
    </div>
  )
}

function Budget({
  go,
  notify,
}: {
  go: (s: Screen) => void
  notify: (m: string) => void
}) {
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
        eyebrow="BUDGET FOR AANYA’S BIRTHDAY"
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

function Checklist({ go }: { go: (s: Screen) => void }) {
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
        eyebrow="AANYA’S BIRTHDAY"
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

function Nearby({ go }: { go: (s: Screen) => void }) {
  const [filters, setFilters] = useState({
    category: "All",
    budget: "Any budget",
    distance: "Nearby",
    vibe: "Any vibe",
    occasion: "Friends Hangout",
  })
  const setFilter = (key: keyof typeof filters, value: string) =>
    setFilters({ ...filters, [key]: value })

  return (
    <div className="screen nearby-screen">
      <Header title="PopSpots" eyebrow="EXPLORE PLACES THAT FIT YOUR PLAN" />
      <div className="search-bar">
        <Icon name="search" size={19} />
        <input placeholder="Search city, area or location…" />
        <Icon name="location" size={18} />
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
              "Desserts",
              "Restaurants",
              "Parks",
              "Book Cafés",
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
            key: "distance",
            label: "Distance",
            values: ["Nearby", "Within 2 km", "Within 5 km"],
          },
          {
            key: "vibe",
            label: "Vibe",
            values: ["Any vibe", "Aesthetic", "Peaceful", "Lively", "Cozy"],
          },
          {
            key: "occasion",
            label: "Occasion",
            values: [
              "Friends Hangout",
              "After College",
              "Birthday",
              "Solo Visit",
            ],
          },
        ].map((group) => (
          <div className="spot-filter-group" key={group.key}>
            <span>{group.label}</span>
            <div>
              {group.values.map((value) => (
                <button
                  type="button"
                  key={value}
                  className={
                    filters[(group.key as keyof typeof filters)] === value
                      ? "active"
                      : ""
                  }
                  onClick={() =>
                    setFilter(group.key as keyof typeof filters, value)
                  }
                >
                  {value}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="map-card">
        <div className="map-grid" />
        <div className="road r1" />
        <div className="road r2" />
        <div className="road r3" />
        <span className="map-park">Cubbon Park</span>
        <span className="map-label l1">MG Road</span>
        <span className="map-label l2">Church St</span>
        <button
          type="button"
          className="map-marker m1 active"
          onClick={() => go("place-detail")}
        >
          <Icon name="food" size={17} />
        </button>
        <button type="button" className="map-marker m2">
          <Icon name="gift" size={17} />
        </button>
        <button type="button" className="map-marker m3">
          <Icon name="party" size={17} />
        </button>
        <button type="button" className="locate-button">
          <Icon name="location" size={19} />
        </button>
      </div>
      <div className="nearby-heading">
        <div>
          <strong>Places around Bengaluru</strong>
          <span>Connect location data to see live availability</span>
        </div>
        <button type="button">Map view</button>
      </div>
      <div className="place-list">
        <button
          type="button"
          className="place-card"
          onClick={() => go("place-detail")}
        >
          <img src={images.cafe} alt="Warm and casual cafe interior" />
          <div className="place-info">
            <div className="place-top">
              <span className="event-type">CAFÉ · DESIGN PLACEHOLDER</span>
              <span className="place-save">
                <Icon name="bookmark" size={14} /> Save
              </span>
            </div>
            <strong>Church Street café result</strong>
            <p>
              Business details will appear from the connected location source.
            </p>
            <div className="place-bottom">
              <span>
                <Icon name="location" size={14} /> Church Street, Bengaluru
              </span>
              <span>Hours · Price unavailable</span>
            </div>
          </div>
        </button>
        <button
          type="button"
          className="place-card"
          onClick={() => go("place-detail")}
        >
          <img src={images.games} alt="Friends playing board games" />
          <div className="place-info">
            <div className="place-top">
              <span className="event-type">ACTIVITY · DESIGN PLACEHOLDER</span>
              <span className="place-save">
                <Icon name="bookmark" size={14} /> Save
              </span>
            </div>
            <strong>Koramangala activity result</strong>
            <p>Distance and live business information have not been loaded.</p>
            <div className="place-bottom">
              <span>
                <Icon name="location" size={14} /> Koramangala, Bengaluru
              </span>
              <span>Hours · Price unavailable</span>
            </div>
          </div>
        </button>
      </div>
    </div>
  )
}

function PlaceDetail({
  go,
  notify,
}: {
  go: (s: Screen) => void
  notify: (m: string) => void
}) {
  return (
    <div className="screen detail-screen">
      <div className="place-hero">
        <img src={images.cafe} alt="The Green Door Cafe patio" />
        <div className="floating-header">
          <IconButton icon="back" label="Back" onClick={() => go("nearby")} />
          <IconButton
            icon="bookmark"
            label="Save place"
            onClick={() => notify("Place saved")}
          />
        </div>
        <span className="photo-count">DESIGN PREVIEW</span>
      </div>
      <div className="detail-body place-detail-body">
        <div className="event-type">CAFÉ · LOCATION DATA PLACEHOLDER</div>
        <div className="place-detail-title">Church Street café result</div>
        <div className="rating-line">
          <span>Rating not provided</span>
          <span>Opening hours unavailable</span>
        </div>
        <p className="place-description">
          Live place details, opening hours and pricing will appear here when
          returned by the connected map and location service.
        </p>
        <div className="place-highlights">
          <div>
            <Icon name="people" />
            <strong>Group details</strong>
            <span>Not provided</span>
          </div>
          <div>
            <Icon name="wallet" />
            <strong>Price details</strong>
            <span>Not provided</span>
          </div>
          <div>
            <Icon name="clock" />
            <strong>Opening hours</strong>
            <span>Not provided</span>
          </div>
        </div>
        <SectionTitle title="Available information" />
        <div className="perk-list">
          <span>
            <Icon name="location" size={15} /> Area-level location
          </span>
          <span>
            <Icon name="food" size={15} /> Café category
          </span>
          <span>
            <Icon name="help" size={15} /> Details pending
          </span>
          <span>
            <Icon name="bookmark" size={15} /> Can be saved
          </span>
        </div>
        <SectionTitle title="Location" />
        <div className="address-card">
          <span>
            <Icon name="location" />
          </span>
          <div>
            <strong>Church Street, Bengaluru</strong>
            <p>Exact address and distance have not been provided.</p>
          </div>
        </div>
        <div className="sticky-actions">
          <Button variant="secondary" icon="route">
            Directions
          </Button>
          <Button
            onClick={() => {
              notify("Added as the event venue")
              go("planner")
            }}
            icon="arrow"
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
}: {
  go: (s: Screen) => void
  notify: (m: string) => void
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
  return (
    <div className="screen">
      <Header
        title="Profile"
        eyebrow="MAKE IT YOURS"
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
          M
          <span>
            <Icon name="sparkle" size={14} />
          </span>
        </div>
        <div>
          <div className="profile-name">Meera Kapoor</div>
          <p>meera.kapoor@example.com</p>
          <span className="plan-badge">PARTY STARTER</span>
        </div>
      </div>
      <div className="profile-stats">
        <div>
          <strong>7</strong>
          <span>Events</span>
        </div>
        <div>
          <strong>12</strong>
          <span>Ideas saved</span>
        </div>
        <div>
          <strong>₹4.8k</strong>
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
        <button type="button" onClick={() => notify("About PlanzyPop AI")}>
          <span className="menu-icon">
            <Icon name="sparkle" size={20} />
          </span>
          <strong>About PlanzyPop AI</strong>
          <small>v1.0.0</small>
          <Icon name="chevron" size={17} />
        </button>
        <button type="button" className="logout-row">
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
        PlanzyPop AI keeps your event details on this device in this prototype.
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
      <span>PlanzyPop AI</span>
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
}: {
  go: (screen: AuthScreen) => void
  complete: (message: string) => void
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
          From tiny budgets to big ideas, PlanzyPop AI helps you bring everyone
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
          onClick={() => complete("Exploring PlanzyPop AI as a guest")}
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
}: {
  go: (screen: AuthScreen) => void
  complete: (message: string) => void
}) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [remember, setRemember] = useState(true)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)

  const submit = (event: FormEvent) => {
    event.preventDefault()
    const nextErrors: Record<string, string> = {}
    if (!email.trim()) nextErrors.email = "Enter your email address."
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      nextErrors.email = "Enter a valid email address."
    if (!password) nextErrors.password = "Enter your password."
    if (password.toLowerCase() === "wrong")
      nextErrors.form = "That email or password doesn’t look right. Try again."
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length) return

    setLoading(true)
    window.setTimeout(() => complete("Welcome back, Meera!"), 850)
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
        onClick={() => complete("Welcome to PlanzyPop AI!")}
      />
      <div className="auth-switch">
        Don’t have an account?{" "}
        <button type="button" onClick={() => go("signup")}>
          Sign Up
        </button>
      </div>
      <div className="auth-demo-note">
        Prototype tip: enter “wrong” as the password to preview an error.
      </div>
    </div>
  )
}

function SignupScreen({ go }: { go: (screen: AuthScreen) => void }) {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [terms, setTerms] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)

  const submit = (event: FormEvent) => {
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
    window.setTimeout(() => go("registered"), 900)
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
        <p>Join PlanzyPop AI and start planning better celebrations.</p>
      </div>

      <form className="auth-form" onSubmit={submit} noValidate>
        <AuthField
          label="Full Name"
          value={name}
          onChange={(value) => {
            setName(value)
            setErrors({ ...errors, name: "" })
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
            setErrors({ ...errors, email: "" })
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
            setErrors({ ...errors, password: "", confirm: "" })
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
            setErrors({ ...errors, confirm: "" })
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
        <p>Welcome to PlanzyPop AI. Let’s plan your first celebration!</p>
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
        onClick={() => complete("Welcome to PlanzyPop AI!")}
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
}: {
  screen: AuthScreen
  go: (screen: AuthScreen) => void
  complete: (message: string) => void
}) {
  switch (screen) {
    case "welcome":
      return <WelcomeScreen go={go} complete={complete} />
    case "login":
      return <LoginScreen go={go} complete={complete} />
    case "signup":
      return <SignupScreen go={go} />
    case "forgot":
      return <ForgotPasswordScreen go={go} />
    case "registered":
      return <RegistrationSuccess complete={complete} />
  }
}

function DesktopSidebar({
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
    <aside className="desktop-sidebar">
      <div className="sidebar-brand">
        <span className="brand-mark">
          <Icon name="sparkle" size={18} />
        </span>
        <div>
          <strong>PlanzyPop AI</strong>
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
      <div className="sidebar-user">
        <span className="avatar">M</span>
        <div>
          <strong>Meera Kapoor</strong>
          <small>Party Starter</small>
        </div>
        <Icon name="chevron" size={16} />
      </div>
    </aside>
  )
}

export default function App() {
  const [authScreen, setAuthScreen] = useState<AuthScreen | null>("welcome")
  const [screen, setScreen] = useState<Screen>("overview")
  const [toast, setToast] = useState("")
  const navScreens: Screen[] = [
    "overview",
    "planner",
    "nearby",
    "events",
    "budget",
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
    planner: "PopPlan",
    nearby: "PopSpots",
    profile: "Profile",
    "event-detail": "Event Details",
    budget: "PopSmart",
    checklist: "Checklist & Timeline",
    "place-detail": "Place Details",
    insights: "PopInsights",
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
        return <Overview go={setScreen} notify={notify} />
      case "events":
        return <MyEvents go={setScreen} />
      case "planner":
        return <Planner go={setScreen} notify={notify} />
      case "nearby":
        return <Nearby go={setScreen} />
      case "profile":
        return <Profile go={setScreen} notify={notify} />
      case "event-detail":
        return <EventDetail go={setScreen} />
      case "budget":
        return <Budget go={setScreen} notify={notify} />
      case "checklist":
        return <Checklist go={setScreen} />
      case "place-detail":
        return <PlaceDetail go={setScreen} notify={notify} />
      case "insights":
        return <Insights />
      case "settings":
        return (
          <SettingsScreen
            go={setScreen}
            notify={notify}
            onLogout={() => setAuthScreen("welcome")}
          />
        )
    }
  }, [screen])

  return (
    <div className="app-shell">
      {!authScreen && <DesktopSidebar screen={screen} onNavigate={setScreen} />}
      <main className={`app-surface ${authScreen ? "auth-surface" : ""}`}>
        {!authScreen && (
          <header className="desktop-global-header">
            <div>
              <span>PLANZYPOP</span>
              <strong>{screenTitles[screen]}</strong>
            </div>
            <div className="global-header-actions">
              <span className="demo-data-badge">DEMO DATA</span>
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
                M
              </button>
            </div>
          </header>
        )}
        {authScreen ? (
          <AuthFlow
            screen={authScreen}
            go={setAuthScreen}
            complete={completeAuth}
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
