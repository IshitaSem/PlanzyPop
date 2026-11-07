/**
 * PlanzyPop - Checklist & Preparation Timeline Screen
 * Academic Mini-Project for M.Sc. Computer Science (Data Science)
 */

import { useEffect, useState, type FormEvent } from "react"
import type { EventItem, Screen, TaskItem, TaskSummary } from "../types"
import { createTask, deleteTask, getTasks, getTaskSummary, updateTask } from "../services/api"
import { Header } from "../components/common/Header"
import { Icon } from "../components/common/Icon"
import { IconButton } from "../components/common/IconButton"
import { Button } from "../components/common/Button"

export function Checklist({
  go,
  notify,
  activeEvent,
}: {
  go: (s: Screen) => void
  notify: (m: string) => void
  activeEvent: EventItem | null
}) {
  const [tasks, setTasks] = useState<TaskItem[]>([])
  const [summary, setSummary] = useState<TaskSummary | null>(null)
  const [timeline, setTimeline] = useState(false)
  const [showAdd, setShowAdd] = useState(false)
  const [taskName, setTaskName] = useState("")
  const [dueDate, setDueDate] = useState("2026-11-20")
  const [priority, setPriority] = useState<string>("MEDIUM")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const reloadTasks = async () => {
    if (!activeEvent) return
    try {
      const [tList, tSum] = await Promise.all([
        getTasks(activeEvent.id),
        getTaskSummary(activeEvent.id),
      ])
      setTasks(tList)
      setSummary(tSum)
    } catch {}
  }

  useEffect(() => {
    reloadTasks()
  }, [activeEvent?.id])

  if (!activeEvent) {
    return (
      <div className="screen empty-state">
        <div className="empty-visual">
          <Icon name="check" size={40} />
        </div>
        <div className="empty-title">No event selected</div>
        <p>Please select an event from My Events.</p>
        <Button onClick={() => go("events")} icon="arrow">
          Go to My Events
        </Button>
      </div>
    )
  }

  const handleToggle = async (task: TaskItem) => {
    const updatedStatus = !task.is_completed
    setTasks((prev) =>
      prev.map((t) => (t.id === task.id ? { ...t, is_completed: updatedStatus } : t))
    )
    try {
      await updateTask(task.id, { is_completed: updatedStatus })
      await reloadTasks()
    } catch {
      await reloadTasks()
      notify("Failed to update task.")
    }
  }

  const handleDelete = async (taskId: number, e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      await deleteTask(taskId)
      await reloadTasks()
      notify("Task removed.")
    } catch {
      notify("Failed to delete task.")
    }
  }

  const handleAddTask = async (e: FormEvent) => {
    e.preventDefault()
    if (!taskName.trim()) {
      notify("Please provide a task name.")
      return
    }
    setIsSubmitting(true)
    try {
      await createTask(activeEvent.id, {
        task_name: taskName.trim(),
        due_date: dueDate || undefined,
        description: priority,
      })
      await reloadTasks()
      setShowAdd(false)
      setTaskName("")
      notify(`Task '${taskName}' added.`)
    } catch {
      notify("Could not add task.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const completedCount = tasks.filter((t) => t.is_completed).length
  const totalCount = tasks.length
  const percent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0

  return (
    <div className="screen checklist-screen">
      <Header
        title="Checklist"
        eyebrow={activeEvent.event_name.toUpperCase()}
        onBack={() => go("event-detail")}
        action={
          <IconButton
            icon="plus"
            label="Add task"
            onClick={() => setShowAdd(true)}
          />
        }
      />
      <div className="check-progress">
        <div
          className="check-ring"
          style={
            {
              "--progress": `${(percent / 100) * 360}deg`,
            } as React.CSSProperties
          }
        >
          <div>
            <strong>{percent}%</strong>
            <span>complete</span>
          </div>
        </div>
        <div>
          <div className="card-kicker">PREPARATION PROGRESS</div>
          <div className="check-title">{totalCount - completedCount} tasks to go</div>
          <p>
            {percent === 100
              ? "All tasks completed! You're ready."
              : `Due date target: ${activeEvent.event_date}`}
          </p>
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
          <div className="task-group-title">TO DO · {totalCount - completedCount}</div>
          {tasks
            .filter((task) => !task.is_completed)
            .map((task) => (
              <div className="task-row" key={task.id}>
                <button
                  type="button"
                  className="checkbox"
                  onClick={() => handleToggle(task)}
                  aria-label={`Complete ${task.task_name}`}
                />
                <div>
                  <strong>{task.task_name}</strong>
                  <span>{task.due_date ? `Due ${task.due_date}` : "No due date"}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span className="priority medium">
                    {(task.description || "TASK").toUpperCase()}
                  </span>
                  <span
                    onClick={(e) => handleDelete(task.id, e)}
                    style={{ color: "#c94e61", cursor: "pointer" }}
                    title="Delete task"
                  >
                    <Icon name="logout" size={14} />
                  </span>
                </div>
              </div>
            ))}
          {totalCount - completedCount === 0 && (
            <div style={{ padding: "12px", color: "var(--muted)", fontSize: "11px" }}>
              No pending tasks!
            </div>
          )}
          <div className="task-group-title completed">COMPLETED · {completedCount}</div>
          {tasks
            .filter((task) => task.is_completed)
            .map((task) => (
              <div className="task-row is-done" key={task.id}>
                <button
                  type="button"
                  className="checkbox checked"
                  onClick={() => handleToggle(task)}
                >
                  <Icon name="check" size={14} />
                </button>
                <div>
                  <strong>{task.task_name}</strong>
                  <span>Completed</span>
                </div>
                <span
                  onClick={(e) => handleDelete(task.id, e)}
                  style={{ color: "#c94e61", cursor: "pointer" }}
                  title="Delete task"
                >
                  <Icon name="logout" size={14} />
                </span>
              </div>
            ))}
        </div>
      ) : (
        <div className="timeline-view">
          {tasks.map((task, index) => (
            <div
              className={task.is_completed ? "complete" : index === 0 ? "current" : ""}
              key={task.id}
            >
              <span>
                {task.is_completed ? <Icon name="check" size={14} /> : index + 1}
              </span>
              <div>
                <small>{task.due_date || `Step ${index + 1}`}</small>
                <strong>{task.task_name}</strong>
                <p>{task.description || "Preparation item"}</p>
              </div>
            </div>
          ))}
          {tasks.length === 0 && (
            <div className="current">
              <span>1</span>
              <div>
                <small>{activeEvent.event_date}</small>
                <strong>Event Day</strong>
                <p>Celebration begins!</p>
              </div>
            </div>
          )}
        </div>
      )}
      <Button className="full-button" onClick={() => setShowAdd(true)} icon="plus">
        Add a Task
      </Button>

      {showAdd && (
        <div className="sheet-backdrop" onClick={() => setShowAdd(false)}>
          <div
            className="bottom-sheet"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="sheet-handle" />
            <div className="sheet-title">Add a Task</div>
            <form onSubmit={handleAddTask}>
              <label>
                <span className="field-label">Task description</span>
                <input
                  className="text-field"
                  placeholder="e.g. Order birthday cake"
                  value={taskName}
                  onChange={(e) => setTaskName(e.target.value)}
                  required
                />
              </label>
              <div className="split-fields">
                <label>
                  <span className="field-label">Due Date</span>
                  <input
                    className="text-field"
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                  />
                </label>
                <label>
                  <span className="field-label">Priority / Note</span>
                  <select
                    className="text-field"
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                  >
                    <option value="HIGH">HIGH</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="LOW">LOW</option>
                  </select>
                </label>
              </div>
              <Button
                type="submit"
                className="full-button"
                disabled={isSubmitting}
                icon="check"
              >
                {isSubmitting ? "Adding..." : "Save Task"}
              </Button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
