/**
 * PlanzyPop - My Events Screen
 * Academic Mini-Project for M.Sc. Computer Science (Data Science)
 */

import { useState, type FormEvent } from "react"
import type { EventItem, Screen } from "../types"
import { createEvent, deleteEvent, updateEvent } from "../services/api"
import { formatINR, getEventImage } from "../utils/formatters"
import { Header } from "../components/common/Header"
import { Icon } from "../components/common/Icon"
import { IconButton } from "../components/common/IconButton"
import { Button } from "../components/common/Button"

export function MyEvents({
  go,
  notify,
  events,
  selectedEventId,
  onSelectEvent,
  refreshEvents,
}: {
  go: (s: Screen) => void
  notify: (m: string) => void
  events: EventItem[]
  selectedEventId: number | null
  onSelectEvent: (id: number) => void
  refreshEvents: () => Promise<void>
}) {
  const [tab, setTab] = useState("Upcoming")
  const [showAdd, setShowAdd] = useState(false)
  const [showEdit, setShowEdit] = useState(false)
  const [editingEvent, setEditingEvent] = useState<EventItem | null>(null)

  // Form states for Add/Edit
  const [name, setName] = useState("")
  const [type, setType] = useState("Birthday")
  const [date, setDate] = useState("2026-11-20")
  const [place, setPlace] = useState("Indiranagar, Bengaluru")
  const [guests, setGuests] = useState("15")
  const [budget, setBudget] = useState("5000")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      notify("Please provide an event name")
      return
    }
    setIsSubmitting(true)
    try {
      const created = await createEvent({
        event_name: name.trim(),
        event_type: type,
        event_date: date,
        location: place.trim() || undefined,
        guests: parseInt(guests, 10) || 10,
        budget: parseFloat(budget) || 2000,
      })
      await refreshEvents()
      onSelectEvent(created.id)
      setShowAdd(false)
      setName("")
      notify(`Event '${created.event_name}' created successfully!`)
    } catch {
      notify("Could not create event. Check backend connection.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleStartEdit = (event: EventItem, e: React.MouseEvent) => {
    e.stopPropagation()
    setEditingEvent(event)
    setName(event.event_name)
    setType(event.event_type)
    setDate(event.event_date)
    setPlace(event.location || "")
    setGuests(String(event.guests))
    setBudget(String(event.budget))
    setShowEdit(true)
  }

  const handleUpdate = async (e: FormEvent) => {
    e.preventDefault()
    if (!editingEvent || !name.trim()) return
    setIsSubmitting(true)
    try {
      await updateEvent(editingEvent.id, {
        event_name: name.trim(),
        event_type: type,
        event_date: date,
        location: place.trim() || undefined,
        guests: parseInt(guests, 10) || 10,
        budget: parseFloat(budget) || 2000,
      })
      await refreshEvents()
      setShowEdit(false)
      setEditingEvent(null)
      notify(`Event '${name}' updated successfully!`)
    } catch {
      notify("Failed to update event.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (
    id: number,
    eventName: string,
    e: React.MouseEvent,
  ) => {
    e.stopPropagation()
    if (!window.confirm(`Are you sure you want to delete '${eventName}'?`))
      return
    try {
      await deleteEvent(id)
      await refreshEvents()
      notify(`Event '${eventName}' deleted.`)
    } catch {
      notify("Failed to delete event.")
    }
  }

  return (
    <div className="screen">
      <Header
        title="My Events"
        eyebrow="YOUR HAPPY PLANS"
        action={
          <IconButton
            icon="plus"
            label="Add event"
            onClick={() => {
              setName("")
              setShowAdd(true)
            }}
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
      {events.length > 0 ? (
        <div className="event-list">
          <div className="month-label">ALL EVENTS · {events.length} EVENTS</div>
          {events.map((event) => (
            <button
              type="button"
              className="event-list-card"
              key={event.id}
              onClick={() => {
                onSelectEvent(event.id)
                go("event-detail")
              }}
            >
              <img
                src={getEventImage(event.event_type)}
                alt={event.event_name}
              />
              <div className="event-list-copy">
                <div className="event-card-head">
                  <div className="event-type">{event.event_type}</div>
                  <span className="event-status">UPCOMING</span>
                </div>
                <div className="list-title">{event.event_name}</div>
                <div className="list-line">
                  <Icon name="calendar" size={15} /> {event.event_date}
                </div>
                <div className="list-line">
                  <Icon name="location" size={15} />{" "}
                  {event.location || "Location TBD"}
                </div>
                <div className="mini-stats">
                  <span>
                    <Icon name="people" size={14} /> {event.guests}
                  </span>
                  <span>
                    <Icon name="wallet" size={14} /> {formatINR(event.budget)}
                  </span>
                </div>
                <div className="event-card-actions">
                  <span
                    onClick={(e) => handleStartEdit(event, e)}
                    style={{
                      color: "var(--purple)",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 3,
                    }}
                  >
                    <Icon name="edit" size={13} /> Edit
                  </span>
                  <span
                    onClick={(e) => handleDelete(event.id, event.event_name, e)}
                    style={{
                      color: "#c94e61",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 3,
                    }}
                  >
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
              : "No events planned yet"}
          </div>
          <p>
            {tab === "Completed"
              ? "Your completed celebrations will live here."
              : "Create an event or use Smart Event Suggestions to get started."}
          </p>
          <Button onClick={() => setShowAdd(true)} icon="plus">
            Create an Event
          </Button>
        </div>
      )}

      {/* Add Event Sheet */}
      {showAdd && (
        <div className="sheet-backdrop" onClick={() => setShowAdd(false)}>
          <div
            className="bottom-sheet"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="sheet-handle" />
            <div className="sheet-title">Add a New Event</div>
            <form onSubmit={handleCreate}>
              <label>
                <span className="field-label">Event name</span>
                <input
                  className="text-field"
                  placeholder="e.g. Rohan's 21st Birthday"
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
                  placeholder="e.g. Indiranagar, Bengaluru"
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
                {isSubmitting ? "Creating..." : "Save Event"}
              </Button>
            </form>
          </div>
        </div>
      )}

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
