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

export async function getUserFavorites(userId: string): Promise<any[]> {
  if (!rtdb) {
    return []
  }
  
  const snapshot = await get(ref(rtdb, `users/${userId}/favorites`))
  if (!snapshot.exists()) return []

  const favorites: any[] = []
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

export async function shareItinerary(userId: string, dateData: SavedDate): Promise<string> {
  if (!rtdb) {
    throw new Error("Database not available")
  }
  
  const sharedRef = push(ref(rtdb, 'shared'))
  
  await set(sharedRef, {
    ownerId: userId,
    ...dateData,
    createdAt: Date.now(),
    expiresAt: Date.now() + (7 * 24 * 60 * 60 * 1000), // 7 days
  })

  return sharedRef.key!
}

export async function getSharedItinerary(shareId: string): Promise<SavedDate | null> {
  if (!rtdb) {
    return null
  }
  
  const snapshot = await get(ref(rtdb, `shared/${shareId}`))
  if (!snapshot.exists()) return null

  const data = snapshot.val()
  
  // Check expiration
  if (data.expiresAt && Date.now() > data.expiresAt) {
    await remove(ref(rtdb, `shared/${shareId}`))
    return null
  }

  return data
}
