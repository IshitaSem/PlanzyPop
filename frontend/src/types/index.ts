/**
 * PlanzyPop - TypeScript Type Definitions
 * M.Sc. Computer Science (Data Science) Mini-Project
 *
 * Centralized interface and type definitions for screens, navigation,
 * icons, API entities, and celebration categories.
 */

import type { ReactNode } from "react"

// Re-export backend-driven entity types from api.ts
export type {
  EventItem,
  EventCreate,
  EventUpdate,
  ExpenseItem,
  ExpenseCreate,
  ExpenseUpdate,
  BudgetSummary,
  ExpenseSplit,
  TaskItem,
  TaskCreate,
  TaskUpdate,
  TaskSummary,
  BudgetAllocationItem,
  SuggestionRequest,
  SuggestionResponse,
  ExpenseCategory,
} from "../services/api"

export type Screen =
  | "overview"
  | "events"
  | "planner"
  | "nearby"
  | "profile"
  | "event-detail"
  | "budget"
  | "checklist"
  | "inspiration"
  | "idea-detail"
  | "settings"

export type IconName =
  | "home"
  | "calendar"
  | "sparkle"
  | "pin"
  | "user"
  | "bell"
  | "arrow"
  | "wallet"
  | "check"
  | "bulb"
  | "plus"
  | "people"
  | "clock"
  | "back"
  | "bookmark"
  | "search"
  | "star"
  | "route"
  | "edit"
  | "settings"
  | "help"
  | "moon"
  | "logout"
  | "chevron"
  | "cake"
  | "house"
  | "college"
  | "party"
  | "picnic"
  | "movie"
  | "location"
  | "food"
  | "music"
  | "gift"
  | "download"
  | "refresh"
  | "coffee"

export type NavItem = {
  screen: Screen
  icon: IconName
  label: string
}

export type EventCategory = {
  label: string
  icon: IconName
  color: string
}

export type NearbyCategory = {
  id: string
  title: string
  category: string
  icon: IconName
  tag: string
  color: string
  priceRange: string
  description: string
  studentTip: string
  mapsQuery: string
}

export type NotificationItem = {
  id: string
  title: string
  message: string
  icon: IconName
  screen?: Screen
  type?: "event" | "budget" | "task" | "info"
}

export type CafeSearchCategory = {
  id: string
  title: string
  subtitle: string
  tag: string
  icon: IconName
  color: "yellow" | "peach" | "lavender"
  badge: string
  searchQuery: string
  description: string
  studentTip: string
}
