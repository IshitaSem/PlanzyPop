/**
 * PlanzyPop - Budget Tracker & Expense Splitting Screen
 * Academic Mini-Project for M.Sc. Computer Science (Data Science)
 */

import { useEffect, useState, type FormEvent } from "react"
import type {
  BudgetSummary,
  EventItem,
  ExpenseItem,
  ExpenseSplit,
  Screen,
} from "../types"
import {
  addExpense,
  deleteExpense,
  EXPENSE_CATEGORIES,
  getBudgetSummary,
  getEventSplit,
  getExpenses,
} from "../services/api"
import { formatINR } from "../utils/formatters"
import { Header } from "../components/common/Header"
import { Icon } from "../components/common/Icon"
import { IconButton } from "../components/common/IconButton"
import { Button } from "../components/common/Button"
import { SectionTitle } from "../components/common/SectionTitle"
import { Progress } from "../components/common/Progress"

export function Budget({
  go,
  notify,
  activeEvent,
}: {
  go: (s: Screen) => void
  notify: (m: string) => void
  activeEvent: EventItem | null
}) {
  const [showAdd, setShowAdd] = useState(false)
  const [budgetSummary, setBudgetSummary] = useState<BudgetSummary | null>(null)
  const [expenses, setExpenses] = useState<ExpenseItem[]>([])
  const [split, setSplit] = useState<ExpenseSplit | null>(null)
  const [expenseName, setExpenseName] = useState("")
  const [amount, setAmount] = useState("")
  const [category, setCategory] = useState<string>("Food")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const reloadData = async () => {
    if (!activeEvent) return
    try {
      const [b, exp, sp] = await Promise.all([
        getBudgetSummary(activeEvent.id),
        getExpenses(activeEvent.id),
        getEventSplit(activeEvent.id, activeEvent.guests),
      ])
      setBudgetSummary(b)
      setExpenses(exp)
      setSplit(sp)
    } catch {}
  }

  useEffect(() => {
    reloadData()
  }, [activeEvent?.id])

  if (!activeEvent) {
    return (
      <div className="screen empty-state">
        <div className="empty-visual">
          <Icon name="wallet" size={40} />
        </div>
        <div className="empty-title">No event selected</div>
        <p>Please select an event from My Events.</p>
        <Button onClick={() => go("events")} icon="arrow">
          Go to My Events
        </Button>
      </div>
    )
  }

  const handleAddExpense = async (e: FormEvent) => {
    e.preventDefault()
    const parsedAmount = parseFloat(amount)
    if (!expenseName.trim() || isNaN(parsedAmount) || parsedAmount <= 0) {
      notify("Enter a valid expense name and positive amount")
      return
    }
    setIsSubmitting(true)
    try {
      await addExpense(activeEvent.id, {
        expense_name: expenseName.trim(),
        category,
        amount: parsedAmount,
      })
      await reloadData()
      setShowAdd(false)
      setExpenseName("")
      setAmount("")
      notify(`Added ${formatINR(parsedAmount)} for ${expenseName}.`)
    } catch {
      notify("Failed to add expense. Category must be valid.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteExpense = async (
    expenseId: number,
    e: React.MouseEvent,
  ) => {
    e.stopPropagation()
    try {
      await deleteExpense(expenseId)
      await reloadData()
      notify("Expense removed.")
    } catch {
      notify("Failed to delete expense.")
    }
  }

  const planned = budgetSummary
    ? budgetSummary.planned_budget
    : activeEvent.budget
  const totalSpent = budgetSummary ? budgetSummary.total_expenses : 0
  const remaining = budgetSummary ? budgetSummary.remaining_budget : planned
  const utilPercent = budgetSummary
    ? Math.round(budgetSummary.utilisation_percentage)
    : 0

  return (
    <div className="screen budget-screen">
      <Header
        title="Budget Tracker"
        eyebrow={activeEvent.event_name.toUpperCase()}
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
          <strong>{formatINR(planned)}</strong>
          <small>Keep 10% aside for emergencies</small>
        </div>
        <div className="donut">
          <div>
            <strong>{utilPercent}%</strong>
            <span>spent</span>
          </div>
        </div>
        <div className="budget-numbers">
          <div>
            <span>Spent</span>
            <strong>{formatINR(totalSpent)}</strong>
          </div>
          <div>
            <span>Remaining</span>
            <strong>{formatINR(remaining)}</strong>
          </div>
        </div>
        <Progress
          value={utilPercent}
          color={utilPercent > 80 ? "coral" : "yellow"}
        />
      </div>
      <div className="budget-tools">
        {budgetSummary?.is_over_budget ? (
          <div
            className="budget-warning"
            style={{ background: "#ffe6e6", borderColor: "#e57373" }}
          >
            <span>
              <Icon name="bell" size={19} />
            </span>
            <div>
              <strong>Budget Warning!</strong>
              <p>
                You have exceeded your planned budget by{" "}
                {formatINR(Math.abs(remaining))}.
              </p>
            </div>
          </div>
        ) : (
          <div className="budget-warning">
            <span>
              <Icon name="bell" size={19} />
            </span>
            <div>
              <strong>
                {remaining > 0 ? "Budget on track" : "Budget utilized"}
              </strong>
              <p>
                {remaining > 0
                  ? `${formatINR(remaining)} remains available for this celebration.`
                  : "Total budget has been reached."}
              </p>
            </div>
          </div>
        )}
        {split && (
          <div className="split-calculator">
            <span className="split-icon">
              <Icon name="people" size={20} />
            </span>
            <div>
              <strong>Equal expense split</strong>
              <p>
                {formatINR(split.total_amount)} (
                {split.split_basis.replace("_", " ")}) ÷ {split.num_people}{" "}
                guests
              </p>
            </div>
            <strong>{formatINR(split.share_per_person)} each</strong>
          </div>
        )}
      </div>
      <SectionTitle title="Spending by category" />
      <div className="category-budget-list">
        {budgetSummary &&
        Object.keys(budgetSummary.category_breakdown).length > 0 ? (
          Object.entries(budgetSummary.category_breakdown).map(([cat, amt]) => {
            const pct = Math.min(100, Math.round((amt / (planned || 1)) * 100))
            return (
              <div className="category-budget" key={cat}>
                <span className="budget-dot purple" />
                <div>
                  <div className="spread">
                    <strong>{cat}</strong>
                    <span>{formatINR(amt)}</span>
                  </div>
                  <Progress value={pct} />
                </div>
              </div>
            )
          })
        ) : (
          <div
            style={{
              padding: "12px",
              color: "var(--muted)",
              fontSize: "11px",
              textAlign: "center",
            }}
          >
            No category expenses logged yet. Tap Add Expense below!
          </div>
        )}
      </div>
      <SectionTitle title="Recent expenses" />
      <div className="expenses-list">
        {expenses.length > 0 ? (
          expenses.map((exp) => (
            <div className="expense-item" key={exp.id}>
              <span className="expense-icon">
                <Icon name="wallet" size={19} />
              </span>
              <div>
                <strong>{exp.expense_name}</strong>
                <small>
                  {exp.category} · {exp.expense_date || "Recorded"}
                </small>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <strong>{formatINR(exp.amount)}</strong>
                <span
                  onClick={(e) => handleDeleteExpense(exp.id, e)}
                  style={{ color: "#c94e61", cursor: "pointer" }}
                  title="Delete expense"
                >
                  <Icon name="logout" size={14} />
                </span>
              </div>
            </div>
          ))
        ) : (
          <div
            style={{
              padding: "16px",
              color: "var(--muted)",
              fontSize: "11px",
              textAlign: "center",
            }}
          >
            No expenses recorded yet.
          </div>
        )}
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
            <form onSubmit={handleAddExpense}>
              <label>
                <span className="field-label">What did you buy?</span>
                <input
                  className="text-field"
                  placeholder="e.g. Birthday cake & candles"
                  value={expenseName}
                  onChange={(e) => setExpenseName(e.target.value)}
                  required
                />
              </label>
              <div className="split-fields">
                <label>
                  <span className="field-label">Amount (INR)</span>
                  <input
                    className="text-field"
                    type="number"
                    min="1"
                    placeholder="e.g. 500"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    required
                  />
                </label>
                <label>
                  <span className="field-label">Category</span>
                  <select
                    className="text-field"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                  >
                    {EXPENSE_CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <Button
                type="submit"
                className="full-button"
                disabled={isSubmitting}
                icon="check"
              >
                {isSubmitting ? "Saving..." : "Add Expense"}
              </Button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
