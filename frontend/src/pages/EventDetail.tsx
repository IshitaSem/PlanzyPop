/**
 * PlanzyPop - Event Detail Screen
 * Academic Mini-Project for M.Sc. Computer Science (Data Science)
 */

import { useEffect, useState, type FormEvent } from "react"
import type {
  BudgetSummary,
  EventItem,
  Screen,
  TaskItem,
  TaskSummary,
} from "../types"
import {
  deleteEvent,
  getBudgetSummary,
  getTasks,
  getTaskSummary,
  updateEvent,
} from "../services/api"
import { formatINR, getEventImage } from "../utils/formatters"
import { Icon } from "../components/common/Icon"
import { IconButton } from "../components/common/IconButton"
import { Button } from "../components/common/Button"
import { SectionTitle } from "../components/common/SectionTitle"
import { Progress } from "../components/common/Progress"

export function EventDetail({
  go,
  notify,
  activeEvent,
  refreshEvents,
  onSelectEvent,
}: {
  go: (s: Screen) => void
  notify: (m: string) => void
  activeEvent: EventItem | null
  refreshEvents: () => Promise<void>
  onSelectEvent: (id: number) => void
}) {
  const [budgetSummary, setBudgetSummary] = useState<BudgetSummary | null>(null)
  const [taskSummary, setTaskSummary] = useState<TaskSummary | null>(null)
  const [tasks, setTasks] = useState<TaskItem[]>([])
  const [showEdit, setShowEdit] = useState(false)

  // Edit fields
  const [name, setName] = useState("")
  const [type, setType] = useState("Birthday")
  const [date, setDate] = useState("")
  const [place, setPlace] = useState("")
  const [guests, setGuests] = useState("10")
  const [budget, setBudget] = useState("3000")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const reloadData = async () => {
    if (!activeEvent) return
    try {
      const [b, t, tsk] = await Promise.all([
        getBudgetSummary(activeEvent.id),
        getTaskSummary(activeEvent.id),
        getTasks(activeEvent.id),
      ])
      setBudgetSummary(b)
      setTaskSummary(t)
      setTasks(tsk)
    } catch {}
  }

  useEffect(() => {
    reloadData()
  }, [activeEvent?.id])

  if (!activeEvent) {
    return (
      <div className="screen empty-state">
        <div className="empty-visual">
          <Icon name="calendar" size={40} />
        </div>
        <div className="empty-title">No event selected</div>
        <p>Please select an event from My Events.</p>
        <Button onClick={() => go("events")} icon="arrow">
          Go to My Events
        </Button>
      </div>
    )
  }

  const handleStartEdit = () => {
    setName(activeEvent.event_name)
    setType(activeEvent.event_type)
    setDate(activeEvent.event_date)
    setPlace(activeEvent.location || "")
    setGuests(String(activeEvent.guests))
    setBudget(String(activeEvent.budget))
    setShowEdit(true)
  }

  const handleUpdate = async (e: FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    setIsSubmitting(true)
    try {
      await updateEvent(activeEvent.id, {
        event_name: name.trim(),
        event_type: type,
        event_date: date,
        location: place.trim() || undefined,
        guests: parseInt(guests, 10) || 10,
        budget: parseFloat(budget) || 2000,
      })
      await refreshEvents()
      setShowEdit(false)
      notify(`Event '${name}' updated successfully!`)
    } catch {
      notify("Failed to update event.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!window.confirm(`Delete event '${activeEvent.event_name}'?`)) return
    try {
      await deleteEvent(activeEvent.id)
      await refreshEvents()
      notify(`Event '${activeEvent.event_name}' deleted.`)
      go("events")
    } catch {
      notify("Failed to delete event.")
    }
  }

  const progressVal = taskSummary
    ? Math.round(taskSummary.progress_percentage)
    : 0
  const nextTask = tasks.find((t) => !t.is_completed)

  return (
    <div className="screen detail-screen">
      <div className="detail-hero">
        <img
          src={getEventImage(activeEvent.event_type)}
          alt={activeEvent.event_name}
        />
        <div className="floating-header">
          <IconButton icon="back" label="Back" onClick={() => go("events")} />
          <div style={{ display: "flex", gap: 8 }}>
            <IconButton
              icon="edit"
              label="Edit event"
              onClick={handleStartEdit}
            />
            <IconButton
              icon="logout"
              label="Delete event"
              onClick={handleDelete}
            />
          </div>
        </div>
        <div className="detail-gradient">
          <span className="event-type">
            {(activeEvent.event_type || "EVENT").toUpperCase()}
          </span>
          <div className="detail-title">{activeEvent.event_name}</div>
          <div>
            {activeEvent.event_date} · {activeEvent.location || "Location TBD"}
          </div>
        </div>
      </div>
      <div className="detail-body">
        <div className="attendee-row">
          <div className="avatar-stack">
            <span>M</span>
            <span>R</span>
            <span>K</span>
            <span>+{Math.max(0, activeEvent.guests - 3)}</span>
          </div>
          <div>
            <strong>{activeEvent.guests} friends invited</strong>
            <small>Planned budget: {formatINR(activeEvent.budget)}</small>
          </div>
        </div>
        <div className="summary-card">
          <div className="summary-top">
            <span>Planning progress</span>
            <strong>{progressVal}%</strong>
          </div>
          <Progress value={progressVal} />
          <p>
            {taskSummary && taskSummary.pending_tasks > 0
              ? `You're doing great! Complete ${taskSummary.pending_tasks} more task${
                  taskSummary.pending_tasks === 1 ? "" : "s"
                }.`
              : "All preparation tasks completed! You're ready to celebrate!"}
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
            <small>
              {taskSummary
                ? `${taskSummary.completed_tasks} of ${taskSummary.total_tasks} done`
                : "0 tasks"}
            </small>
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
            <small>
              {budgetSummary
                ? `${formatINR(budgetSummary.remaining_budget)} left`
                : `${formatINR(activeEvent.budget)} left`}
            </small>
          </button>
          <button
            type="button"
            className="detail-tool yellow"
            onClick={() => go("planner")}
          >
            <span>
              <Icon name="sparkle" />
            </span>
            <strong>Smart Plan</strong>
            <small>Smart tips</small>
          </button>
          <button type="button" className="detail-tool pink">
            <span>
              <Icon name="people" />
            </span>
            <strong>Guests</strong>
            <small>{activeEvent.guests} friends</small>
          </button>
        </div>
        <SectionTitle
          title="Next on your list"
          action="View checklist"
          onAction={() => go("checklist")}
        />
        {nextTask ? (
          <div
            className="next-task"
            onClick={() => go("checklist")}
            style={{ cursor: "pointer" }}
          >
            <span className="priority high">TASK</span>
            <div>
              <strong>{nextTask.task_name}</strong>
              <small>
                {nextTask.due_date
                  ? `Due ${nextTask.due_date}`
                  : "No due date set"}
              </small>
            </div>
            <Icon name="chevron" size={18} />
          </div>
        ) : (
          <div
            className="next-task"
            onClick={() => go("checklist")}
            style={{ cursor: "pointer" }}
          >
            <span className="priority low">READY</span>
            <div>
              <strong>All current tasks completed!</strong>
              <small>Tap to add new tasks to your checklist</small>
            </div>
            <Icon name="chevron" size={18} />
          </div>
        )}
        <SectionTitle title="Event timeline" />
        <div className="mini-timeline">
          {tasks.slice(0, 3).map((task, idx) => (
            <div key={task.id}>
              <span
                className={
                  task.is_completed ? "done" : idx === 0 ? "current" : ""
                }
              >
                {task.is_completed && <Icon name="check" size={13} />}
              </span>
              <p>
                <strong>{task.task_name}</strong>
                <small>{task.due_date || "Upcoming"}</small>
              </p>
            </div>
          ))}
          {tasks.length === 0 && (
            <div>
              <span className="current" />
              <p>
                <strong>Event date</strong>
                <small>{activeEvent.event_date}</small>
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Edit Event Sheet */}
      {showEdit && (
        <div className="sheet-backdrop" onClick={() => setShowEdit(false)}>
          <div
            className="bottom-sheet"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="sheet-handle" />
            <div className="sheet-title">Edit Event</div>
            <form onSubmit={handleUpdate}>
              <label>
                <span className="field-label">Event name</span>
                <input
                  className="text-field"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </label>
              <div className="split-fields">
                <label>
                  <span className="field-label">Type</span>
                  <select
                    className="text-field"
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                  >
                    <option>Birthday</option>
                    <option>House Party</option>
                    <option>College Event</option>
                    <option>Get-together</option>
                    <option>Picnic</option>
                    <option>Movie Night</option>
                  </select>
                </label>
                <label>
                  <span className="field-label">Date</span>
                  <input
                    className="text-field"
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    required
                  />
                </label>
              </div>
              <div className="split-fields">
                <label>
                  <span className="field-label">Guests</span>
                  <input
                    className="text-field"
                    type="number"
                    min="1"
                    value={guests}
                    onChange={(e) => setGuests(e.target.value)}
                  />
                </label>
                <label>
                  <span className="field-label">Budget (INR)</span>
                  <input
                    className="text-field"
                    type="number"
                    min="0"
                    value={budget}
                    onChange={(e) => setBudget(e.target.value)}
                  />
                </label>
              </div>
              <label>
                <span className="field-label">Location</span>
                <input
                  className="text-field"
                  value={place}
                  onChange={(e) => setPlace(e.target.value)}
                />
              </label>
              <Button
                type="submit"
                className="full-button"
                disabled={isSubmitting}
                icon="check"
              >
                {isSubmitting ? "Updating..." : "Update Event"}
              </Button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
