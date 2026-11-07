/**
 * PlanzyPop - Global Application Constants & Visual Assets
 * M.Sc. Computer Science (Data Science) Mini-Project
 */

import type { ReactNode } from "react"
import type { EventCategory, IconName, NearbyCategory } from "../types"

export const images = {
  balloons:
    "https://images.unsplash.com/photo-1530103862676-de8c9debad1d?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&q=82&w=900",
  birthday:
    "https://images.unsplash.com/photo-1714978444614-7a197c2309ee?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&q=82&w=900",
  decor:
    "https://images.unsplash.com/photo-1531956531700-dc0ee0f1f9a5?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&q=82&w=900",
  cake: "https://images.unsplash.com/photo-1555607124-8531c7c702d0?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&q=82&w=900",
  picnic:
    "https://images.unsplash.com/photo-1496545672447-f699b503d270?auto=format&fit=crop&w=900&q=82",
  cafe: "https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&w=900&q=82",
  games:
    "https://images.unsplash.com/photo-1610890716171-6b1bb98ffd09?auto=format&fit=crop&w=900&q=82",
}

export const iconPaths: Record<IconName, ReactNode> = {
  home: (
    <>
      <path d="M3 10.8 12 3l9 7.8" />
      <path d="M5.5 9.5V21h13V9.5M9 21v-7h6v7" />
    </>
  ),
  calendar: (
    <>
      <rect x="3" y="5" width="18" height="16" rx="3" />
      <path d="M8 3v4M16 3v4M3 10h18M7.5 14h.01M12 14h.01M16.5 14h.01M7.5 18h.01M12 18h.01" />
    </>
  ),
  sparkle: (
    <>
      <path d="m12 2 1.4 4.6L18 8l-4.6 1.4L12 14l-1.4-4.6L6 8l4.6-1.4L12 2Z" />
      <path d="m19 14 .8 2.2L22 17l-2.2.8L19 20l-.8-2.2L16 17l2.2-.8L19 14ZM5 14l.7 1.8 1.8.7-1.8.7L5 19l-.7-1.8-1.8-.7 1.8-.7L5 14Z" />
    </>
  ),
  pin: (
    <>
      <path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" />
      <circle cx="12" cy="10" r="2.5" />
    </>
  ),
  user: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4.5 21a7.5 7.5 0 0 1 15 0" />
    </>
  ),
  bell: (
    <>
      <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9ZM10 21h4" />
    </>
  ),
  arrow: (
    <>
      <path d="M5 12h14M14 7l5 5-5 5" />
    </>
  ),
  wallet: (
    <>
      <path d="M4 6.5A2.5 2.5 0 0 1 6.5 4H19v16H6.5A2.5 2.5 0 0 1 4 17.5v-11Z" />
      <path d="M4 8h15M15 12h6v5h-6a2.5 2.5 0 0 1 0-5Z" />
    </>
  ),
  check: <path d="m5 12 4 4L19 6" />,
  bulb: (
    <>
      <path d="M9 18h6M10 22h4" />
      <path d="M8.2 14.5A7 7 0 1 1 15.8 14.5C14.7 15.3 15 17 15 18H9c0-1 .3-2.7-.8-3.5Z" />
    </>
  ),
  plus: <path d="M12 5v14M5 12h14" />,
  people: (
    <>
      <circle cx="9" cy="8" r="3" />
      <path d="M3 19a6 6 0 0 1 12 0M16 6a3 3 0 0 1 0 6M17 14a5 5 0 0 1 4 5" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </>
  ),
  back: <path d="m15 5-7 7 7 7" />,
  bookmark: <path d="M6 3h12v18l-6-4-6 4V3Z" />,
  search: (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-4-4" />
    </>
  ),
  star: (
    <path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2L12 17.3l-5.6 2.9 1.1-6.2L3 9.6l6.2-.9L12 3Z" />
  ),
  route: (
    <>
      <path d="M5 19c4-1 2-6 6-7s2-5 7-6" />
      <circle cx="5" cy="19" r="2" />
      <circle cx="18" cy="6" r="2" />
    </>
  ),
  edit: (
    <>
      <path d="m14 5 5 5M4 20l3.5-.8L20 6.7 17.3 4 4.8 16.5 4 20Z" />
    </>
  ),
  settings: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M19 13.5v-3l-2-.6a6 6 0 0 0-.6-1.4l1-1.8-2.1-2.1-1.8 1A6 6 0 0 0 12 5l-.6-2h-3l-.6 2a6 6 0 0 0-1.4.6l-1.8-1-2.1 2.1 1 1.8A6 6 0 0 0 3 10l-2 .6v3l2 .6a6 6 0 0 0 .6 1.4l-1 1.8 2.1 2.1 1.8-1a6 6 0 0 0 1.4.6l.6 2h3l.6-2a6 6 0 0 0 1.4-.6l1.8 1 2.1-2.1-1-1.8a6 6 0 0 0 .6-1.4l2-.7Z" />
    </>
  ),
  help: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M9.8 9a2.3 2.3 0 1 1 3.8 1.8c-1 .7-1.6 1.2-1.6 2.7M12 17.5h.01" />
    </>
  ),
  moon: <path d="M20 15.5A8.5 8.5 0 0 1 8.5 4 8.5 8.5 0 1 0 20 15.5Z" />,
  logout: (
    <>
      <path d="M10 5H4v14h6M14 8l4 4-4 4M8 12h10" />
    </>
  ),
  chevron: <path d="m9 5 7 7-7 7" />,
  cake: (
    <>
      <path d="M4 11h16v9H4zM7 11V8h10v3M12 8V4M10.5 4 12 2l1.5 2" />
      <path d="M4 15c2 2 4-2 6 0s4-2 6 0 3-1 4 0" />
    </>
  ),
  house: (
    <>
      <path d="m3 11 9-8 9 8M5 10v11h14V10M9 21v-7h6v7" />
    </>
  ),
  college: (
    <>
      <path d="m2 9 10-5 10 5-10 5L2 9Z" />
      <path d="M6 11v5c3 3 9 3 12 0v-5M22 9v7" />
    </>
  ),
  party: (
    <>
      <path d="m4 20 5-16 11 11L4 20Z" />
      <path d="M10 7c1.5 1 2.5 2.5 3 4M7 13c2 .2 3.5 1 5 2M17 3v3M21 7h-3M17 9l2 2" />
    </>
  ),
  picnic: (
    <>
      <path d="M4 10h16l-2 10H6L4 10ZM8 10V7a4 4 0 0 1 8 0v3M4 14h16M10 10l-1 10M14 10l1 10" />
    </>
  ),
  movie: (
    <>
      <rect x="3" y="5" width="18" height="15" rx="2" />
      <path d="M3 10h18M7 5l3 5M13 5l3 5" />
    </>
  ),
  location: (
    <>
      <path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" />
      <circle cx="12" cy="10" r="2.5" />
    </>
  ),
  food: (
    <>
      <path d="M7 3v8M4 3v5a3 3 0 0 0 6 0V3M7 11v10M16 3c-2 3-2 7 1 9v9M17 12h2V3c-2 0-3 4-3 9Z" />
    </>
  ),
  music: (
    <>
      <path d="M9 18V5l10-2v13M9 9l10-2" />
      <circle cx="6" cy="18" r="3" />
      <circle cx="16" cy="16" r="3" />
    </>
  ),
  gift: (
    <>
      <rect x="3" y="8" width="18" height="13" rx="2" />
      <path d="M12 8v13M3 12h18M12 8H7.5A2.5 2.5 0 0 1 10 4c2 0 2 4 2 4ZM12 8h4.5A2.5 2.5 0 0 0 14 4c-2 0-2 4-2 4Z" />
    </>
  ),
  download: (
    <>
      <path d="M12 3v12M7 10l5 5 5-5M4 20h16" />
    </>
  ),
  refresh: (
    <>
      <path d="M20 7v5h-5M4 17v-5h5" />
      <path d="M6 8a7 7 0 0 1 12-2l2 3M18 16a7 7 0 0 1-12 2l-2-3" />
    </>
  ),
  coffee: (
    <>
      <path d="M17 8h1a4 4 0 1 1 0 8h-1" />
      <path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z" />
      <line x1="6" y1="2" x2="6" y2="4" />
      <line x1="10" y1="2" x2="10" y2="4" />
      <line x1="14" y1="2" x2="14" y2="4" />
    </>
  ),
}

export const categories: EventCategory[] = [
  { label: "Birthday", icon: "cake", color: "yellow" },
  { label: "House Party", icon: "house", color: "pink" },
  { label: "College Event", icon: "college", color: "green" },
  { label: "Get-together", icon: "party", color: "purple" },
  { label: "Picnic", icon: "picnic", color: "peach" },
  { label: "Movie Night", icon: "movie", color: "blue" },
]

export const plannerCategories: EventCategory[] = [
  { label: "Birthday", icon: "cake", color: "yellow" },
  { label: "College Party", icon: "college", color: "green" },
  { label: "Farewell", icon: "party", color: "pink" },
  { label: "Hostel Party", icon: "house", color: "purple" },
  { label: "Picnic", icon: "picnic", color: "peach" },
  { label: "Get-together", icon: "people", color: "blue" },
  { label: "Other", icon: "plus", color: "lavender" },
]

export const NEARBY_CATEGORIES: NearbyCategory[] = [
  {
    id: "bakery",
    title: "Bakeries & Custom Birthday Cakes",
    category: "Bakery",
    icon: "cake",
    tag: "CAKES & SWEETS",
    color: "yellow",
    priceRange: "₹350 – ₹1,200",
    description:
      "Local cake studios, home bakeries, customized photo cakes, and eggless pastries.",
    studentTip:
      "Order 24–48 hours in advance for custom lettering. Inquire if candles, knife, and paper plates are included.",
    mapsQuery: "bakery and cake shop near me",
  },
  {
    id: "decor",
    title: "Party Supplies, Balloons & Streamers",
    category: "Decor",
    icon: "party",
    tag: "PARTY DECOR",
    color: "lavender",
    priceRange: "₹100 – ₹600",
    description:
      "Foil balloons, birthday sashes, party poppers, fairy lights, banners, and photo backdrops.",
    studentTip:
      "Wholesale stationery shops and market lanes sell balloon packs at 40% cheaper rates than retail gift stores.",
    mapsQuery: "party supplies decorations store near me",
  },
  {
    id: "food",
    title: "Budget Snacks, Sweets & Potluck Platters",
    category: "Food",
    icon: "food",
    tag: "CROWD FOOD",
    color: "peach",
    priceRange: "₹150 – ₹350 / head",
    description:
      "Samosas, puff pastries, sandwich platters, rolls, cold drinks, and snack combos for groups.",
    studentTip:
      "Ordering bulk samosas or pre-packed snack boxes saves 50% compared to ordering individual restaurant dishes.",
    mapsQuery: "budget snacks sweets chaat catering near me",
  },
  {
    id: "venues",
    title: "Budget Cafes & Hangout Spots",
    category: "Venues",
    icon: "house",
    tag: "GROUP VENUES",
    color: "yellow",
    priceRange: "₹250 – ₹500 / person",
    description:
      "Casual student-friendly cafes, rooftop lounges, and gaming cafes with space for groups.",
    studentTip:
      "Always confirm in advance if outside celebration cakes and basic balloons are allowed without cover charges.",
    mapsQuery: "student friendly cafe group gathering near me",
  },
  {
    id: "printing",
    title: "Digital Printing, Banners & Photo Cutouts",
    category: "Printing",
    icon: "edit",
    tag: "CUSTOM PRINTS",
    color: "lavender",
    priceRange: "₹100 – ₹400",
    description:
      "Instant flex banner printing, polaroid-style card prints, photo posters, and personalized signs.",
    studentTip:
      "Provide print files in PDF format (300 DPI) for instant same-day printing near colleges.",
    mapsQuery: "digital printing banner photo printing shop near me",
  },
  {
    id: "sound",
    title: "Party Speaker & Mic Rentals",
    category: "Audio",
    icon: "music",
    tag: "AUDIO & LIGHTS",
    color: "peach",
    priceRange: "₹500 – ₹1,500 / day",
    description:
      "High-power Bluetooth trolley speakers, wireless party microphones, and party light rentals.",
    studentTip:
      "Trolley speakers with Bluetooth and dual wireless mics are ideal for hostel common rooms and terrace parties.",
    mapsQuery: "party speaker sound system rental near me",
  },
]
