"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import {
  Compass,
  Sparkles,
  Clock,
  Heart,
  Flame,
  Coffee,
  Crown,
  Zap,
  MapPin,
  DollarSign,
  Users,
  Shuffle,
  ChevronRight,
  Utensils,
  Music,
  Palette,
  TreePine,
  Plus,
  X,
  AlertCircle,
  History,
  Archive,
  CalendarDays,
  Trash2
} from "lucide-react"
import Image from "next/image"
import { validateCustomInput } from "@/lib/profanity-filter"

const BUDGET_OPTIONS = [
  { value: "$", label: "Casual", price: "$30-50", emoji: "🍕" },
  { value: "$$", label: "Nice", price: "$50-100", emoji: "🍷" },
  { value: "$$$", label: "Upscale", price: "$100-200", emoji: "🥂" },
  { value: "$$$$", label: "Luxury", price: "$200+", emoji: "💎" },
] as const
type Budget = (typeof BUDGET_OPTIONS)[number]["value"]

const VIBE_OPTIONS = [
  { id: "romantic", label: "Romantic", icon: Heart, color: "text-rose-500" },
  { id: "adventurous", label: "Adventurous", icon: Flame, color: "text-orange-500" },
  { id: "chill", label: "Chill", icon: Coffee, color: "text-sky-500" },
  { id: "upscale", label: "Upscale", icon: Crown, color: "text-amber-500" },
  { id: "quirky", label: "Quirky", icon: Zap, color: "text-violet-500" },
] as const

const TIME_OPTIONS = [
  { value: "early", label: "Early", time: "5-7 PM", icon: "🌅", startTime: "17:00" },
  { value: "prime", label: "Prime", time: "7-9 PM", icon: "🌙", startTime: "19:00" },
  { value: "late", label: "Late", time: "9 PM+", icon: "✨", startTime: "21:00" },
] as const

const CUISINE_OPTIONS = [
  { id: "any", label: "Any", icon: Utensils },
  { id: "italian", label: "Italian", icon: Utensils },
  { id: "japanese", label: "Japanese", icon: Utensils },
  { id: "mexican", label: "Mexican", icon: Utensils },
  { id: "american", label: "American", icon: Utensils },
  { id: "french", label: "French", icon: Utensils },
] as const

const ACTIVITY_OPTIONS = [
  { id: "none", label: "Skip", icon: ChevronRight },
  { id: "live-music", label: "Live Music", icon: Music },
  { id: "art", label: "Art & Gallery", icon: Palette },
  { id: "outdoor", label: "Outdoor", icon: TreePine },
] as const

interface DateConfig {
  budget: '$' | '$$' | '$$$' | '$$$$'
  location: string
  vibes: string[]
  time: 'early' | 'prime' | 'late'
  partySize: number
  cuisine?: string
  customCuisine?: string
  activity?: string
  customActivity?: string
  plannedDate?: Date
  dayOfWeek?: string
  plannedTime?: string
}

interface DatePlanHistory {
  id: string
  date: Date
  location: string
  budget: string
  vibes: string[]
  venues: any[]
  totalCost?: number
  partySize?: number
  notes?: string
  rating?: number
  favorite?: boolean
}

interface SetupScreenProps {
  onSubmit: (config: DateConfig) => void
}

export function SetupScreen({ onSubmit }: SetupScreenProps) {
  const [budget, setBudget] = useState<Budget>("$$")
  const [location, setLocation] = useState("")
  const [vibes, setVibes] = useState<string[]>(["romantic"])
  const [time, setTime] = useState<"early" | "prime" | "late">("prime")
  const [partySize, setPartySize] = useState(2)
  const [cuisine, setCuisine] = useState<string>("any")
  const [activity, setActivity] = useState<string>("none")
  const [customCuisine, setCustomCuisine] = useState("")
  const [showCustomCuisine, setShowCustomCuisine] = useState(false)
  const [customActivity, setCustomActivity] = useState("")
  const [showCustomActivity, setShowCustomActivity] = useState(false)
  const [customVibe, setCustomVibe] = useState("")
  const [showCustomVibe, setShowCustomVibe] = useState(false)
  const [inputErrors, setInputErrors] = useState<Record<string, string | null>>({})
  const [isLocating, setIsLocating] = useState(false)
  const [locationResults, setLocationResults] = useState<Array<{ label: string; displayName: string; lat: string; lon: string }>>([])
  const [isSearchingLocation, setIsSearchingLocation] = useState(false)
  const [showLocationDropdown, setShowLocationDropdown] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [datePlanHistory, setDatePlanHistory] = useState<DatePlanHistory[]>([])
  const [selectedDate, setSelectedDate] = useState(new Date())
  const locationDropdownRef = useRef<HTMLDivElement>(null)
  const locationInputRef = useRef<HTMLInputElement>(null)
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Load history from localStorage on mount
  useEffect(() => {
    const savedHistory = localStorage.getItem('datePlanHistory')
    if (savedHistory) {
      try {
        const parsed = JSON.parse(savedHistory)
        setDatePlanHistory(parsed.map((item: any) => ({
          ...item,
          date: new Date(item.date)
        })))
      } catch (e) {
        console.error('Failed to load history:', e)
      }
    }
  }, [])

  const searchLocation = useCallback(async (query: string) => {
    if (query.length < 2) {
      setLocationResults([])
      setShowLocationDropdown(false)
      return
    }
    setIsSearchingLocation(true)
    try {
      const res = await fetch('/api/geocode/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query })
      })
      if (res.ok) {
        const data = await res.json()
        setLocationResults(data.results || [])
        setShowLocationDropdown((data.results || []).length > 0)
      }
    } catch {
      setLocationResults([])
    } finally {
      setIsSearchingLocation(false)
    }
  }, [])

  const handleLocationChange = (value: string) => {
    setLocation(value)
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current)
    searchTimeoutRef.current = setTimeout(() => searchLocation(value), 300)
  }

  const selectLocation = (label: string) => {
    setLocation(label)
    setShowLocationDropdown(false)
    setLocationResults([])
  }

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        locationDropdownRef.current &&
        !locationDropdownRef.current.contains(e.target as Node) &&
        locationInputRef.current &&
        !locationInputRef.current.contains(e.target as Node)
      ) {
        setShowLocationDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleCustomInput = (field: string, value: string, setter: (v: string) => void) => {
    setter(value)
    if (value.length > 0) {
      const error = validateCustomInput(value)
      setInputErrors(prev => ({ ...prev, [field]: error }))
    } else {
      setInputErrors(prev => ({ ...prev, [field]: null }))
    }
  }

  const toggleVibe = (id: string) => {
    if (id === "custom") return // handled separately
    setVibes(prev =>
      prev.includes(id)
        ? prev.filter(v => v !== id)
        : prev.length < 3 ? [...prev, id] : prev
    )
  }

  const addCustomVibe = () => {
    if (!customVibe.trim()) return
    const error = validateCustomInput(customVibe)
    if (error) {
      setInputErrors(prev => ({ ...prev, vibe: error }))
      return
    }
    const vibeId = `custom:${customVibe.trim().toLowerCase()}`
    if (!vibes.includes(vibeId) && vibes.length < 3) {
      setVibes(prev => [...prev, vibeId])
    }
    setCustomVibe("")
    setShowCustomVibe(false)
    setInputErrors(prev => ({ ...prev, vibe: null }))
  }

  const handleLocate = async () => {
    setIsLocating(true)
    try {
      if (navigator.geolocation) {
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0
          })
        })
        const loc = await reverseGeocode(position.coords.latitude, position.coords.longitude)
        setLocation(loc)
      } else {
        const loc = await getIPLocation()
        setLocation(loc)
      }
    } catch {
      try {
        const loc = await getIPLocation()
        setLocation(loc)
      } catch {
        setLocation("")
      }
    } finally {
      setIsLocating(false)
    }
  }

  const reverseGeocode = async (lat: number, lon: number): Promise<string> => {
    try {
      const response = await fetch('/api/geocode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lat, lon })
      })
      if (!response.ok) return `${lat.toFixed(4)}, ${lon.toFixed(4)}`
      const data = await response.json()
      return data.location || `${lat.toFixed(4)}, ${lon.toFixed(4)}`
    } catch {
      return `${lat.toFixed(4)}, ${lon.toFixed(4)}`
    }
  }

  const getIPLocation = async (): Promise<string> => {
    const response = await fetch('https://ipapi.co/json/')
    if (response.ok) {
      const data = await response.json()
      if (data.city && data.region) return `${data.city}, ${data.region}`
      if (data.city) return data.city
    }
    throw new Error('IP location service failed')
  }

  // Delete history item
  const deleteHistoryItem = (id: string) => {
    const updatedHistory = datePlanHistory.filter(item => item.id !== id)
    setDatePlanHistory(updatedHistory)
    localStorage.setItem('datePlanHistory', JSON.stringify(updatedHistory))
  }

  // Toggle favorite
  const toggleFavorite = (id: string) => {
    const updatedHistory = datePlanHistory.map(item =>
      item.id === id ? { ...item, favorite: !item.favorite } : item
    )
    setDatePlanHistory(updatedHistory)
    localStorage.setItem('datePlanHistory', JSON.stringify(updatedHistory))
  }

  // Load plan from history
  const loadPlanFromHistory = (plan: DatePlanHistory) => {
    setLocation(plan.location)
    setBudget(plan.budget as any)
    setVibes(plan.vibes)
    setPartySize(plan.partySize || 2)
    setTime("prime")
    setShowHistory(false)
  }

  // Scroll to center modal when it opens
  const scrollToModal = () => {
    // Small delay to ensure modal is rendered
    setTimeout(() => {
      const modal = document.querySelector('.fixed.inset-0.bg-black\\/50')
      if (modal) {
        // Get modal's position and size
        const rect = modal.getBoundingClientRect()
        const modalHeight = rect.height
        const viewportHeight = window.innerHeight
        
        // Calculate scroll position to center modal
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop
        const modalTop = rect.top + scrollTop
        const desiredScrollTop = modalTop - (viewportHeight - modalHeight) / 2
        
        // Smooth scroll to center the modal
        window.scrollTo({
          top: Math.max(0, desiredScrollTop),
          behavior: 'smooth'
        })
      } else {
        // Fallback to top if modal not found
        window.scrollTo({ top: 0, behavior: 'smooth' })
      }
    }, 100)
  }

  const handleSurpriseMe = () => {
    setBudget(BUDGET_OPTIONS[Math.floor(Math.random() * BUDGET_OPTIONS.length)].value)
    setVibes([...VIBE_OPTIONS].sort(() => Math.random() - 0.5).slice(0, 2).map(v => v.id))
    setTime(TIME_OPTIONS[Math.floor(Math.random() * TIME_OPTIONS.length)].value)
    setCuisine(CUISINE_OPTIONS[Math.floor(Math.random() * CUISINE_OPTIONS.length)].id)
  }

  const hasInputErrors = () => {
    // Check if location is provided
    if (!location || location.trim().length === 0) {
      return true
    }
    
    if (cuisine === "custom" && customCuisine) {
      const err = validateCustomInput(customCuisine)
      if (err) return true
    }
    if (activity === "custom" && customActivity) {
      const err = validateCustomInput(customActivity)
      if (err) return true
    }
    return false
  }

  const handleSubmit = () => {
    if (hasInputErrors()) return
    
    // Calculate day of week and time based on date
    const dayOfWeek = selectedDate.toLocaleDateString('en-US', { weekday: 'long' })
    const isWeekend = selectedDate.getDay() === 0 || selectedDate.getDay() === 6 // Sunday or Saturday
    
    // Calculate time based on whether it's weekday or weekend
    let plannedTime: string
    if (isWeekend) {
      // Weekend: Later times (8-10 PM)
      plannedTime = time === 'early' ? '20:00' : time === 'prime' ? '21:00' : '22:00'
    } else {
      // Weekday: Earlier times (6-9 PM)  
      plannedTime = time === 'early' ? '18:00' : time === 'prime' ? '19:00' : '21:00'
    }
    
    onSubmit({
      budget,
      location: location || "",
      vibes,
      time, // This works with the scraper (early/prime/late)
      partySize,
      cuisine: cuisine === "custom" ? customCuisine : cuisine,
      customCuisine: cuisine === "custom" ? customCuisine : undefined,
      activity: activity === "custom" ? customActivity : activity,
      customActivity: activity === "custom" ? customActivity : undefined,
      plannedDate: selectedDate,
      dayOfWeek,
      plannedTime, // This is used for specific availability checking
    })
  }

  return (
    <div className="flex flex-col min-h-svh bg-background relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -right-32 w-72 h-72 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-32 -left-32 w-72 h-72 bg-accent/8 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 flex flex-col px-5 md:px-12 pt-10 pb-6 flex-1 mx-auto w-full">
        {/* Header */}
        <div className="flex flex-col items-center gap-3 mb-8">
          <div className="w-14 h-14 rounded-2xl overflow-hidden flex items-center justify-center">
            <Image src="/android-chrome-192x192.png" alt="Date Night" width={56} height={56} />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Plan Your Night</h1>
          <p className="text-muted-foreground text-sm text-center max-w-xs">Set your preferences and we'll curate the perfect evening</p>
        </div>

        {/* Randomize */}
        <button
          onClick={handleSurpriseMe}
          className="mb-4 flex items-center justify-center gap-2 py-2.5 rounded-xl border border-dashed border-primary/30 text-primary text-xs font-medium hover:bg-primary/5 active:scale-[0.98] transition-all"
        >
          <Shuffle className="w-3.5 h-3.5" />
          Surprise Me
        </button>

        {/* History */}
        <button
          onClick={() => {
            setShowHistory(true)
            scrollToModal()
          }}
          className="mb-6 flex items-center justify-center gap-2 py-2.5 rounded-xl border border-dashed border-amber-500/30 text-amber-600 text-xs font-medium hover:bg-amber-500/5 active:scale-[0.98] transition-all"
        >
          <History className="w-3.5 h-3.5" />
          View Past Plans
        </button>

        {/* Form */}
        <div className="flex flex-col gap-6 flex-1">
          {/* Location */}
          <section data-tutorial="location">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5 mb-2.5">
              <MapPin className="w-3 h-3" />
              Location
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Compass className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-primary/60 z-10" />
                <input
                  ref={locationInputRef}
                  type="text"
                  value={location}
                  onChange={(e) => handleLocationChange(e.target.value)}
                  onFocus={() => { if (locationResults.length > 0) setShowLocationDropdown(true) }}
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-card border border-border text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/40 text-sm transition-all"
                  placeholder="City or neighborhood..."
                  autoComplete="off"
                />
                {isSearchingLocation && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                )}
                {showLocationDropdown && locationResults.length > 0 && (
                  <div
                    ref={locationDropdownRef}
                    className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-xl shadow-lg overflow-hidden z-50"
                  >
                    {locationResults.map((result, idx) => (
                      <button
                        key={`${result.label}-${idx}`}
                        onClick={() => selectLocation(result.label)}
                        className="w-full flex items-start gap-2.5 px-3.5 py-2.5 text-left hover:bg-primary/5 transition-colors border-b border-border/50 last:border-b-0"
                      >
                        <MapPin className="w-3.5 h-3.5 text-primary/60 mt-0.5 shrink-0" />
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">{result.label}</p>
                          {result.displayName !== result.label && (
                            <p className="text-[11px] text-muted-foreground truncate">{result.displayName}</p>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <button
                onClick={handleLocate}
                disabled={isLocating}
                className="px-3.5 rounded-xl bg-card border border-border text-primary hover:bg-primary/5 active:scale-95 transition-all disabled:opacity-50"
              >
                {isLocating ? (
                  <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                ) : (
                  <MapPin className="w-4 h-4" />
                )}
              </button>
            </div>
          </section>

          {/* Date Selection */}
          <section data-tutorial="date">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5 mb-2.5">
              <CalendarDays className="w-3 h-3" />
              Date Night
            </label>
            <div className="px-3 py-2 rounded-xl bg-card border border-border">
              <input
                type="date"
                value={selectedDate.toISOString().split('T')[0]}
                onChange={(e) => setSelectedDate(new Date(e.target.value))}
                min={new Date().toISOString().split('T')[0]}
                className="w-full bg-transparent text-foreground text-sm focus:outline-none"
              />
            </div>
            <p className="mt-1.5 text-[10px] text-muted-foreground">
              {selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
            </p>
          </section>

          {/* Party Size + Time (side by side) */}
          <div className="grid grid-cols-2 gap-4">
            <section data-tutorial="party-size">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5 mb-2.5">
                <Users className="w-3 h-3" />
                Party Size
              </label>
              <div className="flex gap-1.5 p-1 bg-card border border-border rounded-xl">
                {[2, 3, 4, 5, 6].map((size) => (
                  <button
                    key={size}
                    onClick={() => setPartySize(size)}
                    className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all ${
                      partySize === size
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {size === 6 ? "6+" : size}
                  </button>
                ))}
              </div>
            </section>

            <section data-tutorial="time">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5 mb-2.5">
                <Clock className="w-3 h-3" />
                Time
              </label>
              <div className="flex gap-1.5 p-1 bg-card border border-border rounded-xl">
                {TIME_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setTime(opt.value)}
                    className={`flex-1 flex flex-col items-center gap-0.5 py-2 rounded-lg text-xs transition-all ${
                      time === opt.value
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <span className="text-sm leading-none">{opt.icon}</span>
                    <span className="font-semibold text-[10px]">{opt.label}</span>
                  </button>
                ))}
              </div>
            </section>

          {/* Budget */}
          <section data-tutorial="budget">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5 mb-2.5">
              <DollarSign className="w-3 h-3" />
              Budget
            </label>
            <div className="grid grid-cols-4 gap-2">
              {BUDGET_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setBudget(opt.value)}
                  className={`flex flex-col items-center gap-1 py-3 px-1 rounded-xl border transition-all ${
                    budget === opt.value
                      ? "bg-primary/10 border-primary/50 text-foreground ring-1 ring-primary/20"
                      : "bg-card border-border text-muted-foreground hover:border-primary/30"
                  }`}
                >
                  <span className="text-lg leading-none">{opt.emoji}</span>
                  <span className={`text-xs font-bold ${budget === opt.value ? "text-primary" : ""}`}>{opt.value}</span>
                  <span className="text-[9px] opacity-60">{opt.price}</span>
                </button>
              ))}
            </div>
          </section>

          {/* Vibes */}
          <section data-tutorial="vibes">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center justify-between mb-2.5">
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-3 h-3" />
                Vibe
              </span>
              <span className="text-primary font-bold text-xs">{vibes.length}/3</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {VIBE_OPTIONS.map((v) => {
                const Icon = v.icon
                const isSelected = vibes.includes(v.id)
                return (
                  <button
                    key={v.id}
                    onClick={() => toggleVibe(v.id)}
                    className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-medium border transition-all ${
                      isSelected
                        ? "bg-primary/10 border-primary/50 text-primary ring-1 ring-primary/20"
                        : "bg-card border-border text-muted-foreground hover:border-primary/30 hover:text-foreground"
                    }`}
                  >
                    <Icon className={`w-3.5 h-3.5 ${isSelected ? v.color : ""}`} />
                    {v.label}
                  </button>
                )
              })}
              {/* Custom vibe chips */}
              {vibes.filter(v => v.startsWith("custom:")).map((v) => (
                <button
                  key={v}
                  onClick={() => setVibes(prev => prev.filter(x => x !== v))}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-medium border transition-all bg-primary/10 border-primary/50 text-primary ring-1 ring-primary/20"
                >
                  {v.replace("custom:", "")}
                  <X className="w-3 h-3" />
                </button>
              ))}
              {vibes.length < 3 && (
                <button
                  onClick={() => setShowCustomVibe(true)}
                  className={`flex items-center gap-1 px-3.5 py-2 rounded-full text-xs font-medium border transition-all ${
                    showCustomVibe
                      ? "bg-primary/10 border-primary/50 text-primary ring-1 ring-primary/20"
                      : "bg-card border-border text-muted-foreground hover:border-primary/30 hover:text-foreground"
                  }`}
                >
                  <Plus className="w-3.5 h-3.5" />
                  Custom
                </button>
              )}
            </div>
            {showCustomVibe && (
              <div className="mt-2">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={customVibe}
                    onChange={(e) => handleCustomInput('vibe', e.target.value, setCustomVibe)}
                    onKeyDown={(e) => { if (e.key === 'Enter') addCustomVibe() }}
                    className={`flex-1 px-3 py-2 rounded-xl bg-card border text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/40 text-xs transition-all ${
                      inputErrors.vibe ? 'border-destructive' : 'border-border'
                    }`}
                    placeholder="e.g. Cozy, Lively, Classy..."
                    maxLength={30}
                    autoFocus
                  />
                  <button
                    onClick={addCustomVibe}
                    disabled={!customVibe.trim() || !!inputErrors.vibe}
                    className="px-3 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-medium transition-all disabled:opacity-40"
                  >
                    Add
                  </button>
                  <button
                    onClick={() => { setShowCustomVibe(false); setCustomVibe(""); setInputErrors(prev => ({ ...prev, vibe: null })) }}
                    className="p-2 rounded-xl bg-card border border-border text-muted-foreground hover:text-foreground transition-all"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                {inputErrors.vibe && (
                  <p className="mt-1 text-[10px] text-destructive flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {inputErrors.vibe}
                  </p>
                )}
              </div>
            )}
          </section>

          {/* Cuisine Preference */}
          <section data-tutorial="cuisine">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5 mb-2.5">
              <Utensils className="w-3 h-3" />
              Cuisine
            </label>
            <div className="flex flex-wrap gap-1.5">
              {CUISINE_OPTIONS.map((c) => (
                <button
                  key={c.id}
                  onClick={() => { setCuisine(c.id); setShowCustomCuisine(false) }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                    cuisine === c.id
                      ? "bg-primary/10 border-primary/50 text-primary ring-1 ring-primary/20"
                      : "bg-card border-border text-muted-foreground hover:border-primary/30"
                  }`}
                >
                  {c.label}
                </button>
              ))}
              <button
                onClick={() => { setCuisine("custom"); setShowCustomCuisine(true) }}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                  cuisine === "custom"
                    ? "bg-primary/10 border-primary/50 text-primary ring-1 ring-primary/20"
                    : "bg-card border-border text-muted-foreground hover:border-primary/30"
                }`}
              >
                <Plus className="w-3 h-3" />
                Custom
              </button>
            </div>
            {showCustomCuisine && (
              <div className="mt-2">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={customCuisine}
                    onChange={(e) => handleCustomInput('cuisine', e.target.value, setCustomCuisine)}
                    className={`flex-1 px-3 py-2 rounded-xl bg-card border text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/40 text-xs transition-all ${
                      inputErrors.cuisine ? 'border-destructive' : 'border-border'
                    }`}
                    placeholder="e.g. Korean BBQ, Peruvian, Sushi..."
                    maxLength={50}
                    autoFocus
                  />
                  <button
                    onClick={() => { setShowCustomCuisine(false); setCuisine("any"); setCustomCuisine(""); setInputErrors(prev => ({ ...prev, cuisine: null })) }}
                    className="p-2 rounded-xl bg-card border border-border text-muted-foreground hover:text-foreground transition-all"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                {inputErrors.cuisine && (
                  <p className="mt-1 text-[10px] text-destructive flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {inputErrors.cuisine}
                  </p>
                )}
              </div>
            )}
          </section>

          {/* Activity Preference */}
          <section data-tutorial="activity">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5 mb-2.5">
              <Music className="w-3 h-3" />
              After Dinner
            </label>
            <div className="flex flex-wrap gap-1.5">
              {ACTIVITY_OPTIONS.map((a) => {
                const Icon = a.icon
                return (
                  <button
                    key={a.id}
                    onClick={() => { setActivity(a.id); setShowCustomActivity(false) }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                      activity === a.id
                        ? "bg-primary/10 border-primary/50 text-primary ring-1 ring-primary/20"
                        : "bg-card border-border text-muted-foreground hover:border-primary/30"
                    }`}
                  >
                    <Icon className="w-3 h-3" />
                    {a.label}
                  </button>
                )
              })}
              <button
                onClick={() => { setActivity("custom"); setShowCustomActivity(true) }}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                  activity === "custom"
                    ? "bg-primary/10 border-primary/50 text-primary ring-1 ring-primary/20"
                    : "bg-card border-border text-muted-foreground hover:border-primary/30"
                }`}
              >
                <Plus className="w-3 h-3" />
                Custom
              </button>
            </div>
            {showCustomActivity && (
              <div className="mt-2">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={customActivity}
                    onChange={(e) => handleCustomInput('activity', e.target.value, setCustomActivity)}
                    className={`flex-1 px-3 py-2 rounded-xl bg-card border text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/40 text-xs transition-all ${
                      inputErrors.activity ? 'border-destructive' : 'border-border'
                    }`}
                    placeholder="e.g. Bowling, Comedy show, Karaoke..."
                    maxLength={50}
                    autoFocus
                  />
                  <button
                    onClick={() => { setShowCustomActivity(false); setActivity("none"); setCustomActivity(""); setInputErrors(prev => ({ ...prev, activity: null })) }}
                    className="p-2 rounded-xl bg-card border border-border text-muted-foreground hover:text-foreground transition-all"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                {inputErrors.activity && (
                  <p className="mt-1 text-[10px] text-destructive flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {inputErrors.activity}
                  </p>
                )}
              </div>
            )}
          </section>
        </div>

        {/* CTA */}
        <div className="mt-6 pt-4 border-t border-border/60">
          <button
            onClick={handleSubmit}
            data-tutorial="submit"
            disabled={vibes.length === 0 || !location || location.trim().length === 0 || hasInputErrors()}
            className="w-full py-4 rounded-2xl bg-primary text-primary-foreground font-semibold text-sm flex items-center justify-center gap-2 shadow-lg shadow-primary/25 active:scale-[0.98] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Sparkles className="w-4 h-4" />
            Plan My Night
          </button>
          {vibes.length === 0 && (
            <p className="text-center text-xs text-destructive mt-2">Select at least one vibe to continue</p>
          )}
          {(!location || location.trim().length === 0) && vibes.length > 0 && (
            <p className="text-center text-xs text-destructive mt-2">Enter a location to continue</p>
          )}
        </div>
      </div>

      {/* Date Plan History Modal */}
      {showHistory && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-9999 p-4">
          <div className="bg-background rounded-2xl border p-6 max-w-4xl w-full max-h-[85vh] overflow-y-auto my-4">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <History className="w-5 h-5 text-amber-600" />
                <h3 className="font-semibold text-lg">Past Date Plans</h3>
              </div>
              <button
                onClick={() => setShowHistory(false)}
                className="p-1.5 rounded-lg hover:bg-muted transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {datePlanHistory.length === 0 ? (
              <div className="text-center py-12">
                <Archive className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h4 className="font-medium text-lg mb-2">No Past Plans Yet</h4>
                <p className="text-sm text-muted-foreground">
                  Your completed date plans will appear here for easy access
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* History List */}
                <div className="space-y-3">
                  {datePlanHistory.map((plan) => (
                    <div key={plan.id} className="bg-muted/50 rounded-lg p-4 border">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <CalendarDays className="w-4 h-4 text-amber-600" />
                            <span className="font-medium text-sm">
                              {plan.date.toLocaleDateString()} at {plan.date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                            </span>
                            {plan.favorite && (
                              <span className="text-xs px-2 py-1 rounded-full bg-amber-500/20 text-amber-600 border border-amber-500/30">
                                ⭐ Favorite
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground space-y-1">
                            <div>📍 {plan.location} • 💰 {plan.budget} • 👥 {plan.partySize || 2} people</div>
                            <div>🎭 {plan.vibes.join(', ')}</div>
                            {plan.totalCost && (
                              <div>💸 Total: ${plan.totalCost.toFixed(2)}</div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => loadPlanFromHistory(plan)}
                            className="px-2 py-1 rounded-lg bg-amber-500 text-white text-xs font-medium hover:bg-amber-600 transition-colors"
                          >
                            Use This Plan
                          </button>
                          <button
                            onClick={() => toggleFavorite(plan.id)}
                            className="p-1.5 rounded-lg hover:bg-muted transition-colors"
                          >
                            <Heart className={`w-4 h-4 ${plan.favorite ? 'text-red-500 fill-red-500' : 'text-muted-foreground'}`} />
                          </button>
                          <button
                            onClick={() => deleteHistoryItem(plan.id)}
                            className="p-1.5 rounded-lg hover:bg-muted transition-colors"
                          >
                            <Trash2 className="w-4 h-4 text-muted-foreground" />
                          </button>
                        </div>
                      </div>
                      
                      {/* Venue Preview */}
                      <div className="border-t border-border/60 pt-3">
                        <div className="text-xs font-medium text-muted-foreground mb-2">Venues ({plan.venues.length}):</div>
                        <div className="flex flex-wrap gap-2">
                          {plan.venues.map((venue, index) => (
                            <span key={index} className="text-xs px-2 py-1 rounded-full bg-background border border-border">
                              {venue.category === 'dinner' ? '🍽️' : venue.category === 'drinks' ? '🍷' : '🎯'} {venue.name}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* History Stats */}
                <div className="bg-blue-500/5 rounded-lg p-3 border border-blue-500/20">
                  <div className="text-xs text-muted-foreground grid grid-cols-3 gap-4 text-center">
                    <div>
                      <div className="font-medium text-blue-600">{datePlanHistory.length}</div>
                      <div>Total Plans</div>
                    </div>
                    <div>
                      <div className="font-medium text-blue-600">
                        {datePlanHistory.filter(p => p.favorite).length}
                      </div>
                      <div>Favorites</div>
                    </div>
                    <div>
                      <div className="font-medium text-blue-600">
                        {datePlanHistory.length > 0 ? 
                          new Set(datePlanHistory.map(p => p.location)).size : 0
                        }
                      </div>
                      <div>Locations</div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      </div>
    </div>
  )
}
