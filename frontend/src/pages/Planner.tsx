/**
 * PlanzyPop - Planner & Rule-Based Suggestions Screen
 * Academic Mini-Project for M.Sc. Computer Science (Data Science)
 */

import { useState } from "react"
import type { Screen, SuggestionResponse } from "../types"
import { createEvent, createTask, generateSuggestions } from "../services/api"
import { formatINR } from "../utils/formatters"
import { plannerCategories } from "../utils/constants"
import { Header } from "../components/common/Header"
import { Icon } from "../components/common/Icon"
import { IconButton } from "../components/common/IconButton"
import { Button } from "../components/common/Button"
import { SectionTitle } from "../components/common/SectionTitle"

export function Planner({
  go,
  notify,
  refreshEvents,
  onSelectEvent,
}: {
  go: (s: Screen) => void
  notify: (m: string) => void
  refreshEvents: () => Promise<void>
  onSelectEvent: (id: number) => void
}) {
  const [step, setStep] = useState<"form" | "loading" | "results">("form")
  const [eventType, setEventType] = useState("Birthday")
  const [eventName, setEventName] = useState("Rohan's Birthday Celebration")
  const [eventDate, setEventDate] = useState("2026-11-20")
  const [guests, setGuests] = useState(15)
  const [budget, setBudget] = useState("₹3,000–₹5,000")
  const [customBudget, setCustomBudget] = useState(5000)
  const [location, setLocation] = useState("Hostel Rooftop / Indiranagar")
  const [style, setStyle] = useState("Casual")
  const [notes, setNotes] = useState("")
  const [suggestion, setSuggestion] = useState<SuggestionResponse | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  const parseBudgetNum = (): number => {
    if (budget === "Under ₹500") return 500
    if (budget === "₹500–₹1,000") return 1000
    if (budget === "₹1,000–₹3,000") return 2500
    if (budget === "₹3,000–₹5,000") return 4500
    if (budget === "₹5,000+") return 7500
    return customBudget || 5000
  }

  const generate = async () => {
    setStep("loading")
    const numBudget = parseBudgetNum()
    try {
      const res = await generateSuggestions({
        event_type: eventType,
        budget: numBudget,
        guests: guests || 15,
        celebration_style: style,
      })
      setSuggestion(res)
      setStep("results")
    } catch {
      setStep("results")
      notify("Rule engine offline; loaded sample plan.")
    }
  }

  const handleSaveToEvents = async () => {
    setIsSaving(true)
    try {
      const numBudget = suggestion
        ? suggestion.total_allocated_budget
        : parseBudgetNum()
      const newEvent = await createEvent({
        event_name: eventName || `${eventType} Party`,
        event_type: eventType,
        event_date: eventDate || "2026-11-20",
        guests: guests || 15,
        budget: numBudget,
        location: location || "TBD",
        celebration_style: style,
      })

      const tasksToCreate: string[] = []
      if (
        suggestion?.decoration_suggestions &&
        suggestion.decoration_suggestions[0]
      ) {
        tasksToCreate.push(
          `Decorations: ${suggestion.decoration_suggestions[0]}`,
        )
      }
      if (suggestion?.food_suggestions && suggestion.food_suggestions[0]) {
        tasksToCreate.push(`Food & Snacks: ${suggestion.food_suggestions[0]}`)
      }
      if (
        suggestion?.activity_suggestions &&
        suggestion.activity_suggestions[0]
      ) {
        tasksToCreate.push(
          `Entertainment: ${suggestion.activity_suggestions[0]}`,
        )
      }
      if (tasksToCreate.length === 0) {
        tasksToCreate.push("Confirm guest count", "Order celebration cake")
      }

      for (const tName of tasksToCreate) {
        try {
          await createTask(newEvent.id, {
            task_name: tName,
            description: "Suggested by Rule Engine",
          })
        } catch {}
      }

      await refreshEvents()
      onSelectEvent(newEvent.id)
      notify("Event created! Starter tasks added to your checklist.")
      go("event-detail")
    } catch {
      notify("Could not save event. Check backend connection.")
    } finally {
      setIsSaving(false)
    }
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
        <div className="loading-title">Generating Smart Suggestions…</div>
        <p>
          Evaluating rule-based suggestions for {guests} friends within{" "}
          {formatINR(parseBudgetNum())}…
        </p>
        <div className="loading-steps">
          <span className="done">
            <Icon name="check" size={16} /> Evaluating theme rules
          </span>
          <span className="done">
            <Icon name="check" size={16} /> Balancing budget percentages
          </span>
          <span>
            <span className="tiny-loader" /> Matching activities & snacks
          </span>
        </div>
      </div>
    )
  }

  if (step === "results") {
    const estCost = suggestion
      ? suggestion.total_allocated_budget
      : parseBudgetNum()
    const perPerson = Math.round(estCost / (guests || 1))
    const themeName = suggestion
      ? suggestion.suggested_theme
      : `${style} ${eventType}`
    const allocations = suggestion?.budget_allocations || []

    return (
      <div className="screen planner-results">
        <Header
          title="Your party plan"
          eyebrow="RULE-BASED RECOMMENDATION ENGINE"
          onBack={() => setStep("form")}
          action={
            <IconButton
              icon="bookmark"
              label="Save plan"
              onClick={handleSaveToEvents}
            />
          }
        />
        <div className="result-banner">
          <div className="result-badge">
            <Icon name="sparkle" /> RULE-BASED PLAN
          </div>
          <div className="result-title">{themeName}</div>
          <p>An affordable celebration for {guests} friends.</p>
          <div className="result-stats">
            <span>
              <Icon name="wallet" size={16} /> {formatINR(estCost)}
            </span>
            <span>
              <Icon name="people" size={16} /> {guests} guests
            </span>
            <span>
              <Icon name="wallet" size={16} /> {formatINR(perPerson)} / person
            </span>
          </div>
        </div>
        <div className="ai-note">
          <span>
            <Icon name="sparkle" size={19} />
          </span>
          <p>
            <strong>Rule Engine Logic:</strong>{" "}
            {suggestion &&
            suggestion.budget_saving_tips &&
            suggestion.budget_saving_tips.length > 0
              ? suggestion.budget_saving_tips.join(" · ")
              : "Optimized for budget efficiency, DIY decorations, and crowd-pleasing snacks."}
          </p>
        </div>
        <SectionTitle title="Your plan, sorted" />
        <div className="result-section lavender">
          <span className="result-icon">
            <Icon name="party" />
          </span>
          <div>
            <div className="result-kicker">THEME & DECOR</div>
            <strong>
              {suggestion?.suggested_theme || "Festive Celebration"}
            </strong>
            <p>
              {suggestion?.decoration_suggestions?.join(", ") ||
                "Colorful streamers, balloons, fairy lights and a DIY photo corner."}
            </p>
            <div className="chip-line">
              <span>DIY Budget Friendly</span>
              <span>45 min setup</span>
            </div>
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
              {suggestion?.food_suggestions?.join(", ") ||
                "Mini pizzas, samosas, cold drinks, chips and dips, and celebration cake."}
            </p>
            <div className="chip-line">
              <span>Crowd pleaser</span>
              <span>Affordable</span>
            </div>
          </div>
        </div>
        <div className="result-section yellow">
          <span className="result-icon">
            <Icon name="music" />
          </span>
          <div>
            <div className="result-kicker">GAMES & ENTERTAINMENT</div>
            <strong>Keep everyone entertained</strong>
            <p>
              {suggestion?.activity_suggestions?.join(", ") ||
                "Party playlist, Truth or Dare, Charades and fun party games."}
            </p>
            <div className="chip-line">
              <span>Free / Low cost</span>
              <span>90 min</span>
            </div>
          </div>
        </div>
        <div className="expense-plan">
          <SectionTitle title="Estimated expenses breakdown" />
          {allocations.length > 0 ? (
            allocations.map((alloc) => (
              <div className="expense-plan-row" key={alloc.category}>
                <span>{alloc.category}</span>
                <div>
                  <i style={{ width: `${Math.min(100, alloc.percentage)}%` }} />
                </div>
                <strong>{formatINR(alloc.allocated_amount)}</strong>
              </div>
            ))
          ) : (
            <div className="expense-plan-row">
              <span>Celebration essentials</span>
              <div>
                <i style={{ width: "100%" }} />
              </div>
              <strong>{formatINR(estCost)}</strong>
            </div>
          )}
          <div className="total-row">
            <span>Estimated total</span>
            <strong>{formatINR(estCost)}</strong>
          </div>
        </div>
        <div className="sticky-actions">
          <Button variant="secondary" onClick={() => generate()}>
            <Icon name="refresh" size={18} /> Regenerate
          </Button>
          <Button onClick={handleSaveToEvents} disabled={isSaving} icon="arrow">
            {isSaving ? "Saving..." : "Add to My Events"}
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="screen planner-screen">
      <Header
        title="Smart Event Suggestions"
        eyebrow="RULE-BASED RECOMMENDATION ENGINE"
      />
      <div className="planner-intro">
        <span>
          <Icon name="sparkle" size={28} />
        </span>
        <div>
          <strong>Let’s make it happen!</strong>
          <p>
            Answer a few quick questions and our Python rule engine will
            recommend a tailored, balanced celebration plan within your budget.
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
          value={eventName}
          onChange={(e) => setEventName(e.target.value)}
        />
        <div className="split-fields">
          <label>
            <span className="field-label">Date</span>
            <input
              className="text-field"
              type="date"
              value={eventDate}
              onChange={(e) => setEventDate(e.target.value)}
            />
          </label>
          <label>
            <span className="field-label">Guests</span>
            <input
              className="text-field"
              type="number"
              min="1"
              value={guests}
              onChange={(e) => setGuests(parseInt(e.target.value, 10) || 1)}
            />
          </label>
        </div>
        <label>
          <span className="field-label">Location</span>
          <div className="input-icon">
            <Icon name="location" size={18} />
            <input
              className="text-field"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
          </div>
        </label>
      </div>
      <div className="form-section">
        <div className="field-label">Total budget (INR)</div>
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
            placeholder="Vegetarian food, hostel friendly, loves music…"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
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
