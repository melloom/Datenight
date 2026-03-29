"use client"

import { useEffect, useState, useCallback } from "react"
import { Wine, UtensilsCrossed, Sparkles, Music, Check, MapPin } from "lucide-react"
import { venueSearcher, Venue, SearchCriteria } from "@/lib/venue-search"

const STEPS = [
  { icon: MapPin, label: "Finding venues nearby", delay: 0 },
  { icon: Wine, label: "Curating drink spots", delay: 1200 },
  { icon: UtensilsCrossed, label: "Selecting restaurants", delay: 2400 },
  { icon: Sparkles, label: "Finalizing your plan", delay: 3600 },
]

interface LoadingScreenProps {
  onComplete: (venues: Venue[]) => void
  searchCriteria: SearchCriteria
}

export function LoadingScreen({ onComplete, searchCriteria }: LoadingScreenProps) {
  const [completedSteps, setCompletedSteps] = useState<number[]>([])
  const [currentStep, setCurrentStep] = useState(0)
  const [progress, setProgress] = useState(0)
  const [searchStatus, setSearchStatus] = useState("")

  const stableOnComplete = useCallback(onComplete, [onComplete])

  useEffect(() => {
    let cancelled = false
    const MIN_DURATION = 4500
    const startTime = Date.now()

    // Track search readiness
    let searchDone = false
    let searchResult: Venue[] = []

    // Progress: animate to 90% quickly, then slow down until search finishes
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (searchDone) {
          // Search done — quickly fill to 100%
          return prev >= 100 ? 100 : Math.min(100, prev + 5)
        }
        // Cap at 90% while waiting for search
        return prev >= 90 ? 90 : prev + 1.5
      })
    }, 60)

    const timers = STEPS.map((step, index) =>
      setTimeout(() => {
        setCurrentStep(index + 1)
        setCompletedSteps(prev => [...prev, index])
      }, step.delay + 800)
    )

    const finishLoading = (venues: Venue[]) => {
      if (cancelled) return
      searchDone = true
      searchResult = venues

      // Wait for minimum animation duration, then complete
      const elapsed = Date.now() - startTime
      const remaining = Math.max(0, MIN_DURATION - elapsed)

      setTimeout(() => {
        if (cancelled) return
        setProgress(100)
        // Small delay after hitting 100% so the user sees it
        setTimeout(() => {
          if (cancelled) return
          clearInterval(progressInterval)
          timers.forEach(clearTimeout)
          stableOnComplete(searchResult)
        }, 400)
      }, remaining)
    }

    const startSearch = async () => {
      try {
        setSearchStatus("Searching your area...")
        const result = await venueSearcher.searchVenues(searchCriteria)

        if (result.venues.length === 0) {
          setSearchStatus("No venues found. Trying alternatives...")
          finishLoading([])
          return
        }

        setSearchStatus(`Found ${result.totalFound} venues!`)
        const selectedVenues = selectVenuesForDate(result.venues)
        finishLoading(selectedVenues)
      } catch (error) {
        console.error("Venue search failed:", error)
        setSearchStatus("Search failed. Please try again.")
        finishLoading([])
      }
    }

    startSearch()

    return () => {
      cancelled = true
      clearInterval(progressInterval)
      timers.forEach(clearTimeout)
    }
  }, [stableOnComplete, searchCriteria])

  const selectVenuesForDate = (venues: Venue[]): Venue[] => {
    const drinks = venues.filter(v => v.category === "drinks")
    const dinner = venues.filter(v => v.category === "dinner")
    const activities = venues.filter(v => v.category === "activity")

    const selected = [
      drinks.length > 0 ? drinks[Math.floor(Math.random() * Math.min(drinks.length, 3))] : null,
      dinner.length > 0 ? dinner[Math.floor(Math.random() * Math.min(dinner.length, 3))] : null,
      activities.length > 0 ? activities[Math.floor(Math.random() * Math.min(activities.length, 3))] : null,
    ].filter(Boolean) as Venue[]

    while (selected.length < 3 && venues.length > selected.length) {
      const remaining = venues.filter(v => !selected.includes(v))
      if (remaining.length === 0) break
      selected.push(remaining[Math.floor(Math.random() * remaining.length)])
    }

    return selected.slice(0, 3)
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-svh bg-background px-6">
      <div className="flex flex-col items-center gap-8 w-full max-w-xs">
        {/* Progress ring */}
        <div className="relative w-28 h-28 flex items-center justify-center">
          <svg className="absolute w-full h-full -rotate-90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="44" fill="none" stroke="currentColor" strokeWidth="3" className="text-muted/50" />
            <circle
              cx="50" cy="50" r="44" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"
              className="text-primary transition-all duration-300"
              strokeDasharray={`${progress * 2.76} 276`}
            />
          </svg>
          <span className="text-2xl font-bold text-primary">{Math.round(progress)}%</span>
        </div>

        {/* Steps */}
        <div className="flex flex-col gap-2 w-full">
          {STEPS.map((step, index) => {
            const Icon = step.icon
            const isCompleted = completedSteps.includes(index)
            const isCurrent = currentStep === index

            return (
              <div
                key={index}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-300 ${
                  isCompleted
                    ? "bg-primary/10 border border-primary/20"
                    : isCurrent
                    ? "bg-card border border-border"
                    : "opacity-30"
                }`}
              >
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${
                  isCompleted ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                }`}>
                  {isCompleted ? <Check className="w-3.5 h-3.5" /> : <Icon className={`w-3.5 h-3.5 ${isCurrent ? "animate-pulse" : ""}`} />}
                </div>
                <span className={`text-xs font-medium ${isCompleted ? "text-foreground" : "text-muted-foreground"}`}>
                  {step.label}
                </span>
                {isCurrent && !isCompleted && (
                  <div className="ml-auto w-3.5 h-3.5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                )}
              </div>
            )
          })}
        </div>

        {/* Status */}
        {searchStatus && (
          <p className="text-xs text-center text-muted-foreground">{searchStatus}</p>
        )}
      </div>
    </div>
  )
}
