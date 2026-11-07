/**
 * PlanzyPop – Frontend API Service
 * M.Sc. Computer Science (Data Science) Mini-Project
 *
 * Connects the React frontend to the Python FastAPI backend.
 * Base URL defaults to http://127.0.0.1:8000 via VITE_API_BASE_URL.
 */

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL as string || "http://127.0.0.1:8000"

// Standard student-friendly expense categories supported by backend
export const EXPENSE_CATEGORIES = [
  "Food",
  "Decorations",
  "Cake",
  "Venue",
  "Gifts",
  "Travel",
  "Entertainment",
  "Other",
] as const

export type ExpenseCategory = typeof EXPENSE_CATEGORIES[number]

// ============================================================================
// TypeScript Data Interfaces
// ============================================================================

export interface EventItem {
  id: number
  event_name: string
  event_type: string
  event_date: string
  location?: string | null
  guests: number
  budget: number
  celebration_style?: string | null
  created_at: string
}

export interface EventCreate {
  event_name: string
  event_type: string
  event_date: string
  location?: string | null
  guests?: number
  budget?: number
  celebration_style?: string | null
}

export interface EventUpdate {
  event_name?: string
  event_type?: string
  event_date?: string
  location?: string | null
  guests?: number
  budget?: number
  celebration_style?: string | null
}

export interface ExpenseItem {
  id: number
  event_id: number
  expense_name: string
  category: string
  amount: number
  expense_date?: string | null
  created_at: string
}

export interface ExpenseCreate {
  expense_name: string
  category: string
  amount: number
  expense_date?: string | null
}

export interface ExpenseUpdate {
  expense_name?: string
  category?: string
  amount?: number
  expense_date?: string | null
}

export interface BudgetSummary {
  event_id: number
  event_name: string
  currency: string
  planned_budget: number
  total_expenses: number
  remaining_budget: number
  utilisation_percentage: number
  is_over_budget: boolean
  warning_message?: string | null
  category_breakdown: Record<string, number>
}

export interface ExpenseSplit {
  total_amount: number
  num_people: number
  share_per_person: number
  currency: string
  split_basis: string
  explanation: string
}

export interface TaskItem {
  id: number
  event_id: number
  task_name: string
  description?: string | null
  due_date?: string | null
  is_completed: boolean
  created_at: string
}

export interface TaskCreate {
  task_name: string
  description?: string | null
  due_date?: string | null
  is_completed?: boolean
}

export interface TaskUpdate {
  task_name?: string
  description?: string | null
  due_date?: string | null
  is_completed?: boolean
}

export interface TaskSummary {
  event_id: number
  total_tasks: number
  completed_tasks: number
  pending_tasks: number
  overdue_tasks: number
  progress_percentage: number
}

export interface BudgetAllocationItem {
  category: string
  percentage: number
  allocated_amount: number
}

export interface SuggestionRequest {
  event_type: string
  budget: number
  guests: number
  celebration_style?: string
}

export interface SuggestionResponse {
  event_type: string
  budget: number
  guests: number
  celebration_style: string
  budget_tier: string
  suggested_theme: string
  food_suggestions: string[]
  decoration_suggestions: string[]
  activity_suggestions: string[]
  budget_allocations: BudgetAllocationItem[]
  total_allocated_budget: number
  budget_saving_tips: string[]
  disclaimer: string
}

// ============================================================================
// HTTP Fetch Helper
// ============================================================================

async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const url = `${API_BASE_URL}${path}`
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  }

  const response = await fetch(url, {
    ...options,
    headers,
  })

  if (!response.ok) {
    let errorDetail = `HTTP ${response.status}: ${response.statusText}`
    try {
      const errJson = await response.json()
      if (errJson && errJson.detail) {
        if (typeof errJson.detail === "string") {
          errorDetail = errJson.detail
        } else if (Array.isArray(errJson.detail)) {
          errorDetail = errJson.detail
            .map((d: { msg?: string }) => d.msg || JSON.stringify(d))
            .join("; ")
        } else {
          errorDetail = JSON.stringify(errJson.detail)
        }
      }
    } catch {
      // Ignore json parse error and keep statusText
    }
    throw new Error(errorDetail)
  }

  // Handle 204 No Content
  if (response.status === 204) {
    return {} as T
  }

  return (await response.json()) as T
}

// ============================================================================
// API Methods
// ============================================================================

// --- Health / Root ---
export async function checkHealth(): Promise<{
  status: string
  service: string
}> {
  return apiRequest<{ status: string service: string }>("/health")
}

// --- Events (Stage 3) ---
export async function getEvents(): Promise<EventItem[]> {
  return apiRequest<EventItem[]>("/events")
}

export async function getEvent(id: number): Promise<EventItem> {
  return apiRequest<EventItem>(`/events/${id}`)
}

export async function createEvent(data: EventCreate): Promise<EventItem> {
  return apiRequest<EventItem>("/events", {
    method: "POST",
    body: JSON.stringify(data),
  })
}

export async function updateEvent(
  id: number,
  data: EventUpdate,
): Promise<EventItem> {
  return apiRequest<EventItem>(`/events/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  })
}

export async function deleteEvent(
  id: number,
): Promise<{ message: string id: number }> {
  return apiRequest<{ message: string id: number }>(`/events/${id}`, {
    method: "DELETE",
  })
}

// --- Expenses & Budget (Stage 4) ---
export async function getExpenses(eventId: number): Promise<ExpenseItem[]> {
  return apiRequest<ExpenseItem[]>(`/events/${eventId}/expenses`)
}

export async function addExpense(
  eventId: number,
  data: ExpenseCreate,
): Promise<ExpenseItem> {
  return apiRequest<ExpenseItem>(`/events/${eventId}/expenses`, {
    method: "POST",
    body: JSON.stringify(data),
  })
}

export async function updateExpense(
  expenseId: number,
  data: ExpenseUpdate,
): Promise<ExpenseItem> {
  return apiRequest<ExpenseItem>(`/expenses/${expenseId}`, {
    method: "PUT",
    body: JSON.stringify(data),
  })
}

export async function deleteExpense(
  expenseId: number,
): Promise<{ message: string id: number }> {
  return apiRequest<{ message: string id: number }>(`/expenses/${expenseId}`, {
    method: "DELETE",
  })
}

export async function getBudgetSummary(
  eventId: number,
): Promise<BudgetSummary> {
  return apiRequest<BudgetSummary>(`/events/${eventId}/budget`)
}

export async function calculateSplit(
  totalAmount: number,
  numPeople: number,
): Promise<ExpenseSplit> {
  return apiRequest<ExpenseSplit>("/calculate-split", {
    method: "POST",
    body: JSON.stringify({
      total_amount: totalAmount,
      num_people: numPeople,
    }),
  })
}

export async function getEventSplit(
  eventId: number,
  people?: number,
): Promise<ExpenseSplit> {
  const query =
    people !== undefined ? `?people=${encodeURIComponent(people)}` : ""
  return apiRequest<ExpenseSplit>(`/events/${eventId}/split-expense${query}`)
}

// --- Tasks & Timeline (Stage 5) ---
export async function getTasks(eventId: number): Promise<TaskItem[]> {
  return apiRequest<TaskItem[]>(`/events/${eventId}/tasks`)
}

export async function createTask(
  eventId: number,
  data: TaskCreate,
): Promise<TaskItem> {
  return apiRequest<TaskItem>(`/events/${eventId}/tasks`, {
    method: "POST",
    body: JSON.stringify(data),
  })
}

export async function updateTask(
  taskId: number,
  data: TaskUpdate,
): Promise<TaskItem> {
  return apiRequest<TaskItem>(`/tasks/${taskId}`, {
    method: "PUT",
    body: JSON.stringify(data),
  })
}

export async function deleteTask(
  taskId: number,
): Promise<{ message: string id: number }> {
  return apiRequest<{ message: string id: number }>(`/tasks/${taskId}`, {
    method: "DELETE",
  })
}

export async function getTaskSummary(eventId: number): Promise<TaskSummary> {
  return apiRequest<TaskSummary>(`/events/${eventId}/tasks/summary`)
}

// --- Rule-Based Suggestions (Stage 6) ---
export async function generateSuggestions(
  data: SuggestionRequest,
): Promise<SuggestionResponse> {
  return apiRequest<SuggestionResponse>("/suggestions/generate", {
    method: "POST",
    body: JSON.stringify(data),
  })
}
