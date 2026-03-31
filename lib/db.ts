"use client"

import { ref, push, set, get, remove, update, query, orderByChild, limitToLast } from "firebase/database"
import { rtdb } from "@/lib/firebase"
import type { Venue } from "@/lib/venue-search"

export interface SavedDate {
  id?: string
  location: string
  budget: string
  vibes: string[]
  time: string
  partySize: number
  venues: Venue[]
  createdAt: number
  status: 'planned' | 'completed' | 'cancelled'
}

export interface UserPreferences {
  defaultLocation?: string
  defaultBudget?: string
  favoriteVibes?: string[]
  hasCompletedTutorial?: boolean
}

export interface DatePlanHistoryRecord {
  id: string
  date: string
  location: string
  budget: string
  vibes: string[]
  venues: Venue[]
  totalCost?: number
  partySize?: number
  notes?: string
  rating?: number
  favorite?: boolean
  createdAt: number
  updatedAt: number
}

export interface FavoriteVenueRecord {
  id?: string
  name?: string
  category?: string
  rating?: number
  priceRange?: string
  address?: string
  imageUrl?: string
  savedAt?: number
  [key: string]: unknown
}

function sanitizeRtdbKey(value: string): string {
  return value.replace(/[.#$[\]]/g, '_')
}

// --- Date Plan History ---

export async function upsertDatePlanHistory(
  userId: string,
  history: {
    id?: string
    date: string
    location: string
    budget: string
    vibes: string[]
    venues: Venue[]
    totalCost?: number
    partySize?: number
    notes?: string
    rating?: number
    favorite?: boolean
  }
): Promise<string> {
  if (!rtdb) {
    throw new Error("Database not available")
  }

  const historyId = sanitizeRtdbKey(history.id || Date.now().toString())
  const historyRef = ref(rtdb, `users/${userId}/datePlanHistory/${historyId}`)

  const existing = await get(historyRef)
  const createdAt = existing.exists() ? (existing.val().createdAt || Date.now()) : Date.now()

  await set(historyRef, {
    ...history,
    id: historyId,
    createdAt,
    updatedAt: Date.now(),
  })

  return historyId
}

export async function getDatePlanHistory(userId: string): Promise<DatePlanHistoryRecord[]> {
  if (!rtdb) {
    return []
  }

  const historyRef = query(
    ref(rtdb, `users/${userId}/datePlanHistory`),
    orderByChild('updatedAt'),
    limitToLast(50)
  )

  const snapshot = await get(historyRef)
  if (!snapshot.exists()) return []

  const history: DatePlanHistoryRecord[] = []
  snapshot.forEach((child) => {
    history.push({ id: child.key!, ...child.val() })
  })

  return history.reverse()
}

export async function deleteDatePlanHistoryItem(userId: string, historyId: string): Promise<void> {
  if (!rtdb) {
    throw new Error("Database not available")
  }

  await remove(ref(rtdb, `users/${userId}/datePlanHistory/${sanitizeRtdbKey(historyId)}`))
}

export async function setDatePlanHistoryFavorite(userId: string, historyId: string, favorite: boolean): Promise<void> {
  if (!rtdb) {
    throw new Error("Database not available")
  }

  await update(ref(rtdb, `users/${userId}/datePlanHistory/${sanitizeRtdbKey(historyId)}`), {
    favorite,
    updatedAt: Date.now(),
  })
}

// --- Saved Dates ---

export async function saveDate(userId: string, dateData: Omit<SavedDate, 'id' | 'createdAt' | 'status'>): Promise<string> {
  if (!rtdb) {
    throw new Error("Database not available")
  }
  
  const datesRef = ref(rtdb, `users/${userId}/dates`)
  const newDateRef = push(datesRef)
  
  await set(newDateRef, {
    ...dateData,
    createdAt: Date.now(),
    status: 'planned',
  })

  return newDateRef.key!
}

export async function getUserDates(userId: string): Promise<SavedDate[]> {
  if (!rtdb) {
    return []
  }
  
  const datesRef = query(
    ref(rtdb, `users/${userId}/dates`),
    orderByChild('createdAt'),
    limitToLast(50)
  )

  const snapshot = await get(datesRef)
  if (!snapshot.exists()) return []

  const dates: SavedDate[] = []
  snapshot.forEach((child) => {
    dates.push({ id: child.key!, ...child.val() })
  })

  return dates.reverse() // Most recent first
}

export async function updateDateStatus(userId: string, dateId: string, status: SavedDate['status']): Promise<void> {
  if (!rtdb) {
    throw new Error("Database not available")
  }
  
  await update(ref(rtdb, `users/${userId}/dates/${dateId}`), { status })
}

export async function deleteDate(userId: string, dateId: string): Promise<void> {
  if (!rtdb) {
    throw new Error("Database not available")
  }
  
  await remove(ref(rtdb, `users/${userId}/dates/${dateId}`))
}

// --- Favorites ---

export async function saveFavorite(userId: string, venue: Venue): Promise<void> {
  if (!rtdb) {
    throw new Error("Database not available")
  }
  
  const venueKey = venue.id.replace(/[.#$[\]]/g, '_') // Sanitize key for RTDB
  await set(ref(rtdb, `users/${userId}/favorites/${venueKey}`), {
    name: venue.name,
    category: venue.category,
    rating: venue.rating,
    priceRange: venue.priceRange,
    address: venue.address,
    imageUrl: venue.imageUrl || '',
    savedAt: Date.now(),
  })
}

export async function removeFavorite(userId: string, venueId: string): Promise<void> {
  if (!rtdb) {
    throw new Error("Database not available")
  }
  
  const venueKey = venueId.replace(/[.#$[\]]/g, '_')
  await remove(ref(rtdb, `users/${userId}/favorites/${venueKey}`))
}

export async function getUserFavorites(userId: string): Promise<FavoriteVenueRecord[]> {
  if (!rtdb) {
    return []
  }
  
  const snapshot = await get(ref(rtdb, `users/${userId}/favorites`))
  if (!snapshot.exists()) return []

  const favorites: FavoriteVenueRecord[] = []
  snapshot.forEach((child) => {
    favorites.push({ id: child.key, ...child.val() })
  })

  return favorites
}

export async function isFavorite(userId: string, venueId: string): Promise<boolean> {
  if (!rtdb) {
    return false
  }
  
  const venueKey = venueId.replace(/[.#$[\]]/g, '_')
  const snapshot = await get(ref(rtdb, `users/${userId}/favorites/${venueKey}`))
  return snapshot.exists()
}

// --- User Preferences ---

export async function savePreferences(userId: string, prefs: UserPreferences): Promise<void> {
  if (!rtdb) {
    throw new Error("Database not available")
  }
  
  await set(ref(rtdb, `users/${userId}/preferences`), prefs)
}

export async function getPreferences(userId: string): Promise<UserPreferences | null> {
  if (!rtdb) {
    return null
  }
  
  const snapshot = await get(ref(rtdb, `users/${userId}/preferences`))
  if (!snapshot.exists()) return null
  return snapshot.val()
}

// --- Shared Itineraries ---

export async function shareItinerary(userId: string, dateData: SavedDate, plannedDate: Date): Promise<string> {
  if (!rtdb) {
    throw new Error("Database not available")
  }

  const sharedRef = push(ref(rtdb, 'shared'))

  // Expire 3 days after the planned date night
  const expiresAt = new Date(plannedDate)
  expiresAt.setDate(expiresAt.getDate() + 3)
  expiresAt.setHours(23, 59, 59, 999)

  await set(sharedRef, {
    ownerId: userId,
    ...dateData,
    plannedDate: plannedDate.toISOString(),
    createdAt: Date.now(),
    expiresAt: expiresAt.getTime(),
  })

  return sharedRef.key!
}

export interface SharedItinerary extends SavedDate {
  ownerId: string
  plannedDate: string
  expiresAt: number
  expired?: boolean
}

export async function getSharedItinerary(shareId: string): Promise<SharedItinerary | null> {
  if (!rtdb) {
    return null
  }

  const snapshot = await get(ref(rtdb, `shared/${shareId}`))
  if (!snapshot.exists()) return null

  const data = snapshot.val()

  // Check expiration — mark as expired but still return data
  if (data.expiresAt && Date.now() > data.expiresAt) {
    await remove(ref(rtdb, `shared/${shareId}`))
    return { ...data, expired: true }
  }

  return data
}
