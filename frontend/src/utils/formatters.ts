/**
 * PlanzyPop - Formatting and Display Utilities
 * M.Sc. Computer Science (Data Science) Mini-Project
 */

import { images } from "./constants"

/** Formats numeric amounts into Indian Rupee currency notation (₹) */
export function formatINR(amount: number): string {
  return `₹${Math.round(amount).toLocaleString("en-IN")}`
}

/** Picks an appropriate high-quality stock photo based on the event type */
export function getEventImage(eventType?: string | null): string {
  const type = (eventType || "").toLowerCase()
  if (type.includes("birthday") || type.includes("cake")) return images.birthday
  if (type.includes("college") || type.includes("fresher") || type.includes("farewell"))
    return images.decor
  if (type.includes("picnic") || type.includes("outdoor")) return images.picnic
  if (type.includes("game") || type.includes("movie")) return images.games
  return images.balloons
}

/** Parses ISO date strings or natural dates into structured day, month, and full strings */
export function parseDateParts(dateStr?: string | null): {
  day: string
  month: string
  full: string
} {
  if (!dateStr) return { day: "15", month: "NOV", full: "15 Nov 2026" }
  try {
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) {
      const match = dateStr.match(/(\d+)\s*([A-Za-z]+)/)
      if (match) {
        return {
          day: match[1],
          month: match[2].slice(0, 3).toUpperCase(),
          full: dateStr,
        }
      }
      return { day: "15", month: "NOV", full: dateStr }
    }
    const months = [
      "JAN",
      "FEB",
      "MAR",
      "APR",
      "MAY",
      "JUN",
      "JUL",
      "AUG",
      "SEP",
      "OCT",
      "NOV",
      "DEC",
    ]
    const day = String(d.getDate()).padStart(2, "0")
    const month = months[d.getMonth()]
    const full = `${d.getDate()} ${months[d.getMonth()].slice(0, 3)} ${d.getFullYear()}`
    return { day, month, full }
  } catch {
    return { day: "15", month: "NOV", full: dateStr }
  }
}
