"use client"

import { useState, useCallback } from "react"
import { SetupScreen } from "@/components/mystery-date/setup-screen"
import { LoadingScreen } from "@/components/mystery-date/loading-screen"
import { ItineraryScreen } from "@/components/mystery-date/itinerary-screen"
import { Venue, SearchCriteria } from "@/lib/venue-search"
import { LateNightResponse } from "@/lib/late-night-detector"

type Screen = "setup" | "loading" | "itinerary"

interface DateConfig {
  budget: string
  location: string
  vibes: string[]
  time: string
  partySize: number
  cuisine?: string
  customCuisine?: string
  activity?: string
  customActivity?: string
}

export function MysteryDateApp() {
  const [screen, setScreen] = useState<Screen>("setup")
  const [config, setConfig] = useState<DateConfig | null>(null)
  const [venues, setVenues] = useState<Venue[]>([])
  const [lateNightResponse, setLateNightResponse] = useState<LateNightResponse | null>(null)

  const handleSubmit = (dateConfig: DateConfig) => {
    setConfig(dateConfig)
    setScreen("loading")
  }
  
  const handleLoadComplete = useCallback((foundVenues: Venue[], lateNightResponse?: LateNightResponse) => {
    console.log('🎉 MysteryDateApp received venues:', foundVenues.length)
  
    if (!foundVenues || foundVenues.length === 0) {
      console.warn('⚠️ No venues received - showing empty itinerary')
      setVenues([])
    } else {
      setVenues(foundVenues)
    }
    
    // Set late night response if provided
    if (lateNightResponse) {
      console.log('🌙 Late night response received:', lateNightResponse.urgency)
      setLateNightResponse(lateNightResponse)
    }
    
    setScreen("itinerary")
  }, [])
  
  const handleReset = () => {
    setConfig(null)
    setVenues([])
    setLateNightResponse(null)
    setScreen("setup")
  }

  const handleVenuesUpdate = (newVenues: Venue[]) => {
    setVenues(newVenues)
  }

  // Convert DateConfig to SearchCriteria
  const getSearchCriteria = (): SearchCriteria | null => {
    if (!config) return null
    
    return {
      location: config.location,
      budget: config.budget as '$' | '$$' | '$$$' | '$$$$',
      vibes: config.vibes,
      time: config.time as 'early' | 'prime' | 'late',
      partySize: config.partySize,
      cuisine: config.cuisine,
      customCuisine: config.customCuisine,
      activity: config.activity,
      customActivity: config.customActivity,
    }
  }

  return (
    <main className="w-full min-h-svh relative overflow-x-hidden">
      {/* Screen transitions */}
      <div 
        className={`transition-all duration-500 ${
          screen === "setup" 
            ? "opacity-100 translate-y-0" 
            : "opacity-0 -translate-y-4 pointer-events-none absolute inset-0"
        }`}
      >
        {screen === "setup" && <SetupScreen onSubmit={handleSubmit} />}
      </div>
      
      <div 
        className={`transition-all duration-500 ${
          screen === "loading" 
            ? "opacity-100 translate-y-0" 
            : "opacity-0 translate-y-4 pointer-events-none absolute inset-0"
        }`}
      >
        {screen === "loading" && getSearchCriteria() && (
          <LoadingScreen 
            onComplete={handleLoadComplete} 
            searchCriteria={getSearchCriteria()!}
          />
        )}
      </div>
      
      <div 
        className={`transition-all duration-500 ${
          screen === "itinerary" 
            ? "opacity-100 translate-y-0" 
            : "opacity-0 translate-y-4 pointer-events-none absolute inset-0"
        }`}
      >
        {screen === "itinerary" && (
          <ItineraryScreen 
            onReset={handleReset} 
            venues={venues}
            searchCriteria={getSearchCriteria()}
            onVenuesUpdate={handleVenuesUpdate}
            lateNightResponse={lateNightResponse}
          />
        )}
      </div>
    </main>
  )
}
