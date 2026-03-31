"use client"

import { useEffect, useState, useCallback } from "react"
import { Wine, UtensilsCrossed, Sparkles, Check, MapPin, Database, Globe, Store } from "lucide-react"
import { venueSearcher, Venue, SearchCriteria } from "@/lib/venue-search"
import { LateNightResponse } from "@/lib/late-night-detector"

const STEPS = [
  { icon: MapPin, label: "Finding venues nearby", delay: 0 },
  { icon: Wine, label: "Curating drink spots", delay: 1200 },
  { icon: UtensilsCrossed, label: "Selecting restaurants", delay: 2400 },
  { icon: Sparkles, label: "Finalizing your plan", delay: 3600 },
]

interface LoadingScreenProps {
  onComplete: (venues: Venue[], lateNightResponse?: LateNightResponse) => void
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

    const finishLoading = (venues: Venue[], lateNightResponse?: LateNightResponse) => {
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
          stableOnComplete(searchResult, lateNightResponse)
        }, 400)
      }, remaining)
    }

    const startSearch = async () => {
      try {
        setSearchStatus("🔍 Finding venues near you...")
        
        // Add timeout to prevent infinite loading
        const searchPromise = venueSearcher.searchVenues(searchCriteria)
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Search timeout')), 45000) // 45s max
        )
        
        const result = await Promise.race([searchPromise, timeoutPromise]) as any

        if (result.venues.length === 0) {
          setSearchStatus("❌ No venues found. Try a different location?")
          finishLoading([], result.lateNightResponse)
          return
        }

        setSearchStatus(`✅ Found ${result.totalFound} venues! Creating your date...`)
        const selectedVenues = selectVenuesForDate(result.venues)
        finishLoading(selectedVenues, result.lateNightResponse)
      } catch (error) {
        if (error instanceof Error && error.message === 'Search timeout') {
          setSearchStatus("⏰ Search taking too long. Please try again.")
        } else {
          setSearchStatus("❌ Search failed. Please try again.")
        }
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

  const statusTone =
    searchStatus.includes("❌") || searchStatus.includes("⏰")
      ? "text-rose-600 bg-rose-500/10 border-rose-500/30"
      : searchStatus.includes("✅")
      ? "text-emerald-600 bg-emerald-500/10 border-emerald-500/30"
      : "text-amber-700 bg-amber-500/10 border-amber-500/30"

  return (
    <div className="relative flex min-h-svh items-center justify-center overflow-hidden bg-neutral-950 px-4 py-10">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-20 top-10 h-72 w-72 rounded-full bg-cyan-500/20 blur-3xl" />
        <div className="absolute -right-24 bottom-0 h-80 w-80 rounded-full bg-emerald-400/20 blur-3xl" />
        <div className="absolute inset-0 opacity-30 [background:linear-gradient(to_right,rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.06)_1px,transparent_1px)] [background-size:40px_40px]" />
      </div>

      <div className="relative w-full max-w-xl rounded-3xl border border-white/15 bg-white/90 p-5 shadow-[0_24px_80px_rgba(0,0,0,0.35)] backdrop-blur md:p-8">
        <div className="mb-6 flex items-center justify-between gap-3">
          <div>
            <p className="text-[0.65rem] font-semibold uppercase tracking-[0.28em] text-slate-500">Live Venue Scraper</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900 md:text-3xl">Building your night out</h2>
          </div>
          <div className="rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
            {Math.round(progress)}% done
          </div>
        </div>

        <div className="mb-6 flex flex-wrap gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-cyan-200 bg-cyan-50 px-2.5 py-1 text-[11px] font-medium text-cyan-700">
            <Globe className="h-3.5 w-3.5" />
            Web Data
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-medium text-emerald-700">
            <Store className="h-3.5 w-3.5" />
            Venue APIs
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-700">
            <Database className="h-3.5 w-3.5" />
            Smart Ranking
          </span>
        </div>

        <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-4">
          <div className="mb-3 flex items-center justify-between text-xs text-slate-500">
            <span>Pipeline progress</span>
            <span>{Math.round(progress)}/100</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-slate-200">
            <div
              className="h-full rounded-full bg-gradient-to-r from-cyan-500 via-teal-500 to-emerald-500 transition-all duration-300"
              style={{ width: `${Math.min(100, Math.round(progress))}%` }}
            />
          </div>
        </div>

        <div className="space-y-2.5">
          {STEPS.map((step, index) => {
            const Icon = step.icon
            const isCompleted = completedSteps.includes(index)
            const isCurrent = currentStep === index

            return (
              <div
                key={index}
                className={`flex items-center gap-3 rounded-xl border px-4 py-3 transition-all duration-300 ${
                  isCompleted
                    ? "border-emerald-200 bg-emerald-50"
                    : isCurrent
                    ? "border-cyan-300 bg-cyan-50"
                    : "border-slate-200 bg-slate-50 opacity-70"
                }`}
              >
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-lg transition-all ${
                    isCompleted
                      ? "bg-emerald-600 text-white"
                      : isCurrent
                      ? "bg-cyan-600 text-white"
                      : "bg-slate-200 text-slate-500"
                  }`}
                >
                  {isCompleted ? <Check className="h-4 w-4" /> : <Icon className={`h-4 w-4 ${isCurrent ? "animate-pulse" : ""}`} />}
                </div>
                <div className="flex-1">
                  <p className={`text-sm font-medium ${isCompleted || isCurrent ? "text-slate-900" : "text-slate-500"}`}>{step.label}</p>
                </div>
                {isCurrent && !isCompleted && (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-cyan-300 border-t-cyan-700" />
                )}
              </div>
            )
          })}
        </div>

        {searchStatus && (
          <div className={`mt-5 rounded-xl border px-3 py-2 text-xs font-medium ${statusTone}`}>
            {searchStatus}
          </div>
        )}
      </div>
    </div>
  )
}
