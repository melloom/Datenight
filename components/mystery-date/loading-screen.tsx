"use client"

import { useEffect, useState, useCallback } from "react"
import { Wine, UtensilsCrossed, Sparkles, Music, Check } from "lucide-react"
import { venueSearcher, Venue, SearchCriteria } from "@/lib/venue-search"

const STEPS = [
  { icon: Wine, label: "Searching", delay: 0 },
  { icon: UtensilsCrossed, label: "Booking", delay: 1200 },
  { icon: Sparkles, label: "Planning", delay: 2400 },
  { icon: Music, label: "Finalizing", delay: 3600 },
]

interface LoadingScreenProps {
  onComplete: (venues: Venue[]) => void
  searchCriteria: SearchCriteria
}

export function LoadingScreen({ onComplete, searchCriteria }: LoadingScreenProps) {
  const [completedSteps, setCompletedSteps] = useState<number[]>([])
  const [currentStep, setCurrentStep] = useState(0)
  const [progress, setProgress] = useState(0)
  const [searchStatus, setSearchStatus] = useState<string>("")

  const stableOnComplete = useCallback(onComplete, [onComplete])

  useEffect(() => {
    // Progress bar animation
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) return 100
        return prev + 1.5
      })
    }, 60)

    // Step completion timers
    const timers = STEPS.map((step, index) => 
      setTimeout(() => {
        setCurrentStep(index + 1)
        setCompletedSteps(prev => [...prev, index])
      }, step.delay + 800)
    )

    // Start venue search
    const startSearch = async () => {
      try {
        setSearchStatus("🔍 Finding perfect venues...")
        console.log('🚀 Starting venue search with criteria:', searchCriteria)
        
        const result = await venueSearcher.searchVenues(searchCriteria)
        
        console.log('🎯 Search completed:', result)
        console.log(`   - Total venues found: ${result.totalFound}`)
        console.log(`   - Search sources: ${result.sources.join(', ')}`)
        
        if (result.venues.length === 0) {
          console.warn('⚠️ No venues found in your area')
          setSearchStatus("❌ No venues found. Try a different location.")
          
          setTimeout(() => {
            clearInterval(progressInterval)
            timers.forEach(clearTimeout)
            stableOnComplete([]) // Pass empty array
          }, 5200)
          return
        }
        
        setSearchStatus(`✅ Found ${result.totalFound} real venues!`)
        
        // Select 3 venues (one of each category) for the date
        const selectedVenues = selectVenuesForDate(result.venues)
        
        console.log('📍 Selected venues for date:', selectedVenues.map(v => v.name))
        
        // Complete after all steps and search
        setTimeout(() => {
          clearInterval(progressInterval)
          timers.forEach(clearTimeout)
          console.log('🎉 Passing real venues to itinerary:', selectedVenues.length)
          stableOnComplete(selectedVenues)
        }, 5200)
        
      } catch (error) {
        console.error('❌ Venue search failed:', error)
        setSearchStatus("❌ Search failed. Please try again.")
        
        setTimeout(() => {
          clearInterval(progressInterval)
          timers.forEach(clearTimeout)
          stableOnComplete([]) // Pass empty array
        }, 5200)
      }
    }

    // Start search immediately
    startSearch()

    return () => {
      clearInterval(progressInterval)
      timers.forEach(clearTimeout)
    }
  }, [stableOnComplete, searchCriteria])

  const selectVenuesForDate = (venues: Venue[]): Venue[] => {
    // Group venues by category
    const drinks = venues.filter(v => v.category === 'drinks').slice(0, 3)
    const dinner = venues.filter(v => v.category === 'dinner').slice(0, 3)
    const activities = venues.filter(v => v.category === 'activity').slice(0, 3)

    // Select one from each category, prioritizing highly-rated ones
    const selected = [
      drinks.length > 0 ? drinks[Math.floor(Math.random() * drinks.length)] : null,
      dinner.length > 0 ? dinner[Math.floor(Math.random() * dinner.length)] : null,
      activities.length > 0 ? activities[Math.floor(Math.random() * activities.length)] : null
    ].filter(Boolean) as Venue[]

    // If we don't have enough venues, add more from any category
    while (selected.length < 3 && venues.length > selected.length) {
      const remaining = venues.filter(v => !selected.includes(v))
      if (remaining.length > 0) {
        selected.push(remaining[Math.floor(Math.random() * remaining.length)])
      } else {
        break
      }
    }

    return selected.slice(0, 3)
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-svh bg-background px-6 relative overflow-hidden">
      {/* Ambient effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-64 h-64 bg-primary/30 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 left-1/4 w-48 h-48 bg-accent/20 rounded-full blur-3xl animate-pulse [animation-delay:500ms]" />
        <div className="absolute bottom-40 right-1/4 w-48 h-48 bg-primary/15 rounded-full blur-3xl animate-pulse [animation-delay:1000ms]" />
      </div>

      <div className="relative z-10 flex flex-col items-center gap-10 w-full max-w-xs">
        {/* Animated rings */}
        <div className="relative flex items-center justify-center">
          <span className="absolute w-40 h-40 rounded-full border-2 border-primary/20 animate-ping animation-duration-[2s]" />
          <span className="absolute w-32 h-32 rounded-full border-2 border-primary/30 animate-ping animation-duration-[2s] animation-delay-300" />
          <span className="absolute w-24 h-24 rounded-full border-2 border-primary/40 animate-ping animation-duration-[2s] animation-delay-1000" />
          
          {/* Inner circle with progress */}
          <div className="relative w-24 h-24 rounded-full bg-linear-to-br from-primary/30 to-accent/30 backdrop-blur-sm border-2 border-primary flex items-center justify-center shadow-2xl shadow-primary/50">
            <svg className="absolute w-full h-full -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="46"
                fill="none"
                stroke="currentColor"
                strokeWidth="4"
                className="text-primary/20"
              />
              <circle
                cx="50"
                cy="50"
                r="46"
                fill="none"
                stroke="currentColor"
                strokeWidth="4"
                strokeLinecap="round"
                className="text-primary transition-all duration-300"
                strokeDasharray={`${progress * 2.89} 289`}
              />
            </svg>
            <span className="text-2xl font-bold text-primary">{Math.round(progress)}%</span>
          </div>
        </div>

        {/* Step checklist */}
        <div className="flex flex-col gap-3 w-full">
          {STEPS.map((step, index) => {
            const Icon = step.icon
            const isCompleted = completedSteps.includes(index)
            const isCurrent = currentStep === index
            
            return (
              <div
                key={index}
                className={`flex items-center gap-3 p-3 rounded-xl transition-all duration-500 ${
                  isCompleted 
                    ? "bg-primary/15 border border-primary/30" 
                    : isCurrent
                    ? "bg-secondary/80 border border-border"
                    : "opacity-40"
                }`}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-300 ${
                  isCompleted 
                    ? "bg-primary text-primary-foreground" 
                    : "bg-muted text-muted-foreground"
                }`}>
                  {isCompleted ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    <Icon className={`w-4 h-4 ${isCurrent ? "animate-pulse" : ""}`} />
                  )}
                </div>
                <span className={`text-sm font-medium transition-colors duration-300 ${
                  isCompleted ? "text-foreground" : "text-muted-foreground"
                }`}>
                  {step.label}
                </span>
                {isCurrent && !isCompleted && (
                  <div className="ml-auto w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                )}
              </div>
            )
          })}
        </div>

        {/* Bottom text */}
        <p className="text-muted-foreground text-sm text-center animate-pulse">
          Planning your evening...
        </p>
        
        {/* Search status */}
        {searchStatus && (
          <p className="text-xs text-center text-primary mt-2 animate-fade-in">
            {searchStatus}
          </p>
        )}
      </div>
    </div>
  )
}
