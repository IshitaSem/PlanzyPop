/**
 * PlanzyPop – Frontend API Service
 * M.Sc. Computer Science (Data Science) Mini-Project
 *
 * Connects the React frontend to the Python FastAPI backend.
 * Base URL defaults to http://127.0.0.1:8000 via VITE_API_BASE_URL.
 */

export const API_BASE_URL =
  (import.meta.env.VITE_API_BASE_URL as string) ||
  (import.meta.env.PROD
    ? "https://planzypop.onrender.com"
    : "http://127.0.0.1:8000")

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


export const TOKEN_STORAGE_KEY = "planzypop_auth_token"
export const USER_STORAGE_KEY = "planzypop_current_user"

export interface UserInfo {
  id: number
  name: string
  email: string
}

export interface AuthResponse {
  access_token: string
  token_type: string
  user: UserInfo
}

export function getAuthToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_STORAGE_KEY)
  } catch {
    return null
  }
}

export function setAuthToken(token: string | null): void {
  try {
    if (token) {
      localStorage.setItem(TOKEN_STORAGE_KEY, token)
    } else {
      localStorage.removeItem(TOKEN_STORAGE_KEY)
    }
  } catch {
    // Ignore storage quota/permission errors
  }
}

export function getStoredUser(): UserInfo | null {
  try {
    const raw = localStorage.getItem(USER_STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function setStoredUser(user: UserInfo | null): void {
  try {
    if (user) {
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user))
    } else {
      localStorage.removeItem(USER_STORAGE_KEY)
    }
  } catch {
    // Ignore storage quota/permission errors
  }
}

async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const url = `${API_BASE_URL}${path}`
  const token = getAuthToken()
  const authHeaders: Record<string, string> = {}
  if (token) {
    authHeaders["Authorization"] = `Bearer ${token}`
  }

  const headers = {
    "Content-Type": "application/json",
    ...authHeaders,
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
    }
    throw new Error(errorDetail)
  }

  if (response.status === 204) {
    return {} as T
  }

  return (await response.json()) as T
}


export interface DeleteResult {
  message: string
  id?: number
  deleted_id?: number
}

export interface RemoveFavoriteResult {
  message: string
  spot_id: string
}

export interface HealthResult {
  status: string
  service: string
}

export async function checkHealth(): Promise<HealthResult> {
  return apiRequest<HealthResult>("/health")
}

export async function register(data: {
  name: string
  email: string
  password: string
}): Promise<AuthResponse> {
  const res = await apiRequest<AuthResponse>("/auth/register", {
    method: "POST",
    body: JSON.stringify(data),
  })
  if (res.access_token) {
    setAuthToken(res.access_token)
    setStoredUser(res.user)
  }
  return res
}

export async function login(data: {
  email: string
  password: string
}): Promise<AuthResponse> {
  const res = await apiRequest<AuthResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify(data),
  })
  if (res.access_token) {
    setAuthToken(res.access_token)
    setStoredUser(res.user)
  }
  return res
}

export async function getCurrentUser(): Promise<UserInfo> {
  return apiRequest<UserInfo>("/auth/me")
}

export async function logout(): Promise<void> {
  try {
    await apiRequest<{ message: string }>("/auth/logout", {
      method: "POST",
    })
  } catch {
    // Session cleanup proceeds even if network fails
  } finally {
    setAuthToken(null)
    setStoredUser(null)
  }
}

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

export async function deleteEvent(id: number): Promise<DeleteResult> {
  return apiRequest<DeleteResult>(`/events/${id}`, {
    method: "DELETE",
  })
}

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

export async function deleteExpense(expenseId: number): Promise<DeleteResult> {
  return apiRequest<DeleteResult>(`/expenses/${expenseId}`, {
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

export async function deleteTask(taskId: number): Promise<DeleteResult> {
  return apiRequest<DeleteResult>(`/tasks/${taskId}`, {
    method: "DELETE",
  })
}

export async function getTaskSummary(eventId: number): Promise<TaskSummary> {
  return apiRequest<TaskSummary>(`/events/${eventId}/tasks/summary`)
}

export async function generateSuggestions(
  data: SuggestionRequest,
): Promise<SuggestionResponse> {
  return apiRequest<SuggestionResponse>("/suggestions/generate", {
    method: "POST",
    body: JSON.stringify(data),
  })
}


export interface SpotReview {
  author_name: string
  author_photo_url?: string | null
  google_maps_profile_url?: string | null
  rating?: number | null
  relative_time?: string | null
  text?: string | null
  publish_time?: string | null
}

export interface SpotDishRecommendation {
  dish: string
  quote: string
  author: string
}

export interface SpotItem {
  id: string
  place_id?: string | null
  osm_id?: string | null
  osm_type?: string | null
  name: string
  category: string
  category_label: string
  latitude: number
  longitude: number
  address?: string | null
  distance_km?: number | null
  opening_hours?: string | null
  price_info?: string | null
  rating?: string | null
  review_count?: number | null
  google_rating?: number | null
  rating_source?: string | null
  vibe?: string | null
  occasion?: string | null
  source?: string | null
  photo_name?: string | null
  photo_url?: string | null
  sector?: string | null
  description?: string | null
  price_level?: string | null
  data_origin?: "live_api" | "cached" | "curated" | string | null
  is_cached?: boolean
  website_uri?: string | null
  google_maps_uri?: string | null
  editorial_summary?: string | null
  reviews?: SpotReview[] | null
  reviews_analyzed_count?: number | null
  reviews_disclaimer?: string | null
  recommended_dishes?: string[] | null
  dish_recommendation_quotes?: SpotDishRecommendation[] | null
  positive_feedback_highlights?: string[] | null
  common_complaints?: string[] | null
  menu_status?: string | null
  menu_disclaimer?: string | null
  photo_names?: string[] | null
  tags?: Record<string, any> | null
  is_favorite?: boolean
}

export interface SpotSearchParams {
  location?: string
  latitude?: number
  longitude?: number
  radius?: number
  category?: string
  sector?: string
  budget?: string
  min_rating?: number
  occasion?: string
  page?: number
  page_size?: number
  user_id?: string
}

export interface SpotSearchResponse {
  status?: string | null
  message?: string | null
  query_location: string
  latitude: number
  longitude: number
  radius_km: number
  total_found: number
  page?: number
  page_size?: number
  total_pages?: number
  has_more?: boolean
  spots: SpotItem[]
}

export interface SpotCategory {
  id: string
  label: string
  icon: string
  description: string
}

export interface SpotFavorite {
  id: number
  user_id?: string | null
  spot_id: string
  name: string
  category: string
  latitude: number
  longitude: number
  address?: string | null
  opening_hours?: string | null
  price_info?: string | null
  vibe?: string | null
  saved_at: string
}

export function getGuestSessionId(): string {
  if (typeof window === "undefined" || !window.localStorage) {
    return "guest_default"
  }
  const STORAGE_KEY = "planzypop_guest_session_id"
  try {
    let sessionId = localStorage.getItem(STORAGE_KEY)
    if (!sessionId) {
      const rand = Math.random().toString(36).substring(2, 10)
      sessionId = `guest_${Date.now().toString(36)}_${rand}`
      localStorage.setItem(STORAGE_KEY, sessionId)
    }
    return sessionId
  } catch {
    return "guest_default"
  }
}

export async function searchSpots(
  params: SpotSearchParams = {},
): Promise<SpotSearchResponse> {
  const query = new URLSearchParams()
  if (params.location) query.set("location", params.location)
  if (params.latitude !== undefined)
    query.set("latitude", String(params.latitude))
  if (params.longitude !== undefined)
    query.set("longitude", String(params.longitude))
  if (params.radius !== undefined) query.set("radius", String(params.radius))
  if (params.category && params.category !== "all" && params.category !== "All")
    query.set("category", params.category)
  if (params.sector && params.sector !== "all" && params.sector !== "All" && params.sector !== "All Sectors")
    query.set("sector", params.sector)
  if (params.budget && params.budget !== "Any budget")
    query.set("budget", params.budget)
  if (params.min_rating !== undefined && params.min_rating > 0)
    query.set("min_rating", String(params.min_rating))
  if (params.occasion) query.set("occasion", params.occasion)
  if (params.page !== undefined) query.set("page", String(params.page))
  if (params.page_size !== undefined) query.set("page_size", String(params.page_size))
  query.set("user_id", params.user_id || getGuestSessionId())

  const queryString = query.toString() ? `?${query.toString()}` : ""
  return apiRequest<SpotSearchResponse>(`/api/spots/search${queryString}`)
}

export async function getChandigarhSectors(): Promise<string[]> {
  return apiRequest<string[]>("/api/spots/sectors")
}

export async function getSpotCategories(): Promise<SpotCategory[]> {
  return apiRequest<SpotCategory[]>("/api/spots/categories")
}

export async function getSpotFavorites(
  userId = getGuestSessionId(),
): Promise<SpotFavorite[]> {
  return apiRequest<SpotFavorite[]>(
    `/api/spots/favorites?user_id=${encodeURIComponent(userId)}`,
  )
}

export async function saveSpotFavorite(
  spot: {
    spot_id: string
    name: string
    category: string
    latitude: number
    longitude: number
    address?: string | null
    opening_hours?: string | null
    price_info?: string | null
    vibe?: string | null
    tags_json?: string | null
    user_id?: string
  },
  userId = getGuestSessionId(),
): Promise<SpotFavorite> {
  const payload = {
    ...spot,
    user_id: spot.user_id || userId,
  }
  return apiRequest<SpotFavorite>("/api/spots/favorites", {
    method: "POST",
    body: JSON.stringify(payload),
  })
}

export async function removeSpotFavorite(
  spotId: string,
  userId = getGuestSessionId(),
): Promise<RemoveFavoriteResult> {
  return apiRequest<RemoveFavoriteResult>(
    `/api/spots/favorites/${encodeURIComponent(spotId)}?user_id=${encodeURIComponent(userId)}`,
    {
      method: "DELETE",
    },
  )
}

export async function getSpotDetails(
  spotId: string,
  userId = getGuestSessionId(),
): Promise<SpotItem> {
  return apiRequest<SpotItem>(
    `/api/spots/${encodeURIComponent(spotId)}?user_id=${encodeURIComponent(userId)}`,
  )
}
