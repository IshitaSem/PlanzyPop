/**
 * PlanzyPop - Overview Screen
 * Academic Mini-Project for M.Sc. Computer Science (Data Science)
 */

import { useEffect, useMemo, useState } from "react"
import type { BudgetSummary, EventItem, Screen, TaskSummary } from "../types"
import { getBudgetSummary, getTaskSummary } from "../services/api"
import { formatINR, getEventImage, parseDateParts } from "../utils/formatters"
import { categories, images } from "../utils/constants"
import { Icon } from "../components/common/Icon"
import { IconButton } from "../components/common/IconButton"
import { Button } from "../components/common/Button"
import { SectionTitle } from "../components/common/SectionTitle"
import { Progress } from "../components/common/Progress"

export function Overview({
  go,
  notify,
  events,
  activeEvent,
  onSelectEvent,
  backendConnected,
  userName = "Student Host",
  onOpenNotifications,
  hasNotifications = false,
}: {
  go: (s: Screen) => void
  notify: (m: string) => void
  events: EventItem[]
  activeEvent: EventItem | null
  onSelectEvent: (id: number) => void
  backendConnected: boolean
  userName?: string
  onOpenNotifications?: () => void
  hasNotifications?: boolean
}) {
  const [budgetSummary, setBudgetSummary] = useState<BudgetSummary | null>(null)
  const [taskSummary, setTaskSummary] = useState<TaskSummary | null>(null)

  useEffect(() => {
    if (!activeEvent) {
      setBudgetSummary(null)
      setTaskSummary(null)
      return
    }
    let isMounted = true
    getBudgetSummary(activeEvent.id)
      .then((res) => {
        if (isMounted) setBudgetSummary(res)
      })
      .catch(() => {
        if (isMounted) setBudgetSummary(null)
      })
    getTaskSummary(activeEvent.id)
      .then((res) => {
        if (isMounted) setTaskSummary(res)
      })
      .catch(() => {
        if (isMounted) setTaskSummary(null)
      })
    return () => {
      isMounted = false
    }
  }, [activeEvent?.id])

  const totalPlannedBudget = useMemo(() => {
    return events.reduce((sum, e) => sum + (e.budget || 0), 0)
  }, [events])

  const dateBadge = parseDateParts(activeEvent?.event_date)

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
          <div className="eyebrow">PLANZYPOP WORKSPACE</div>
          <div>Overview</div>
        </div>
        <div className="top-actions">
          <div style={{ position: "relative", display: "inline-block" }}>
            <IconButton
              icon="bell"
              label="Notifications"
              onClick={
                onOpenNotifications || (() => notify("You’re all caught up!"))
              }
            />
            {hasNotifications && (
              <span
                style={{
                  position: "absolute",
                  top: 3,
                  right: 3,
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  backgroundColor: "var(--coral)",
                  border: "1.5px solid #fff",
                  pointerEvents: "none",
                }}
              />
            )}
          </div>
          <button
            type="button"
            className="avatar"
            onClick={() => go("profile")}
          >
            {userName.charAt(0).toUpperCase()}
          </button>
        </div>
      </div>

      <div className="hello">
        <div className="eyebrow">
          {backendConnected
            ? "LIVE FASTAPI BACKEND · SQLite"
            : "OFFLINE MODE · "}
        </div>
        <div className="hero-title">
          Hey, {userName}!{" "}
          <span className="party-squiggle">Ready to plan something fun?</span>
        </div>
      </div>

      <div className="overview-metrics">
        <div className="metric-card">
          <span className="metric-icon purple">
            <Icon name="calendar" size={19} />
          </span>
          <div>
            <span>Planned events</span>
            <strong>{events.length}</strong>
          </div>
          <small>
            {events.length > 0
              ? `${events.length} active in workspace`
              : "Ready to plan"}
          </small>
        </div>
        <div className="metric-card">
          <span className="metric-icon peach">
            <Icon name="wallet" size={19} />
          </span>
          <div>
            <span>Total planned budget</span>
            <strong>{formatINR(totalPlannedBudget)}</strong>
          </div>
          <small>
            Across {events.length} event{events.length === 1 ? "" : "s"}
          </small>
        </div>
        <div className="metric-card">
          <span className="metric-icon yellow">
            <Icon name="check" size={19} />
          </span>
          <div>
            <span>Tasks completed</span>
            <strong>
              {taskSummary
                ? `${taskSummary.completed_tasks} / ${taskSummary.total_tasks}`
                : "0 / 0"}
            </strong>
          </div>
          <small>
            {taskSummary
              ? `${Math.round(taskSummary.progress_percentage)}% on track`
              : "Track with checklist"}
          </small>
        </div>
      </div>

      <div className="plan-hero">
        <div className="hero-copy">
          <div className="mini-badge">
            <Icon name="sparkle" size={14} /> Smart Event Suggestions
          </div>
          <div className="hero-card-title">
            Big fun.
            <br />
            Tiny stress.
          </div>
          <p>
            Tell us your vibe and budget. Our rule engine will plan the rest.
          </p>
          <Button onClick={() => go("planner")} variant="dark" icon="arrow">
            Smart Suggestions
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
      {activeEvent ? (
        <button
          type="button"
          className="event-feature"
          onClick={() => {
            onSelectEvent(activeEvent.id)
            go("event-detail")
          }}
        >
          <img
            src={getEventImage(activeEvent.event_type)}
            alt={activeEvent.event_name}
          />
          <div className="event-date">
            <strong>{dateBadge.day}</strong>
            <span>{dateBadge.month}</span>
          </div>
          <div className="event-overlay">
            <div className="event-meta">
              <span>{activeEvent.event_type}</span>
              <span>{activeEvent.event_date}</span>
            </div>
            <div className="event-name">{activeEvent.event_name}</div>
            <div className="event-sub">
              <Icon name="location" size={15} />{" "}
              {activeEvent.location || "Location TBD"} · {activeEvent.guests}{" "}
              friends · {formatINR(activeEvent.budget)}
            </div>
          </div>
        </button>
      ) : (
        <button
          type="button"
          className="event-feature"
          onClick={() => go("planner")}
        >
          <img src={images.birthday} alt="Plan your first celebration" />
          <div className="event-date">
            <strong>+</strong>
            <span>PLAN</span>
          </div>
          <div className="event-overlay">
            <div className="event-meta">
              <span>GET STARTED</span>
              <span>TODAY</span>
            </div>
            <div className="event-name">Plan your first event!</div>
            <div className="event-sub">
              <Icon name="sparkle" size={15} /> Tap here to get smart
              suggestions
            </div>
          </div>
        </button>
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
            {budgetSummary
              ? formatINR(budgetSummary.remaining_budget)
              : activeEvent
                ? formatINR(activeEvent.budget)
                : "₹0"}{" "}
            <span>left</span>
          </div>
          <Progress
            value={budgetSummary ? budgetSummary.utilisation_percentage : 0}
          />
          <div className="spread">
            <span>
              Spent{" "}
              {budgetSummary ? formatINR(budgetSummary.total_expenses) : "₹0"}
            </span>
            <strong>
              {budgetSummary
                ? `${Math.round(budgetSummary.utilisation_percentage)}%`
                : "0%"}
            </strong>
          </div>
        </button>
        <button
          type="button"
          className="dash-card task-card"
          onClick={() => go("checklist")}
        >
          <div className="task-ring">
            <span>
              {taskSummary
                ? `${taskSummary.completed_tasks}/${taskSummary.total_tasks}`
                : "0/0"}
            </span>
          </div>
          <div className="card-kicker">
            {taskSummary && taskSummary.progress_percentage >= 50
              ? "You’re on a roll"
              : "Prep checklist"}
          </div>
          <div className="task-title">
            {taskSummary
              ? `${taskSummary.pending_tasks} tasks left`
              : "Ready for tasks"}
          </div>
          <div className="task-next">
            {taskSummary && taskSummary.pending_tasks > 0
              ? "Tap to review checklist & timeline"
              : "All tasks completed!"}
          </div>
        </button>
      </div>
    </div>
  )
}
