"use client"

import { useState } from "react"
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
  X
} from "lucide-react"
import Image from "next/image"

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
  { value: "early", label: "Early", time: "5-7 PM", icon: "🌅" },
  { value: "prime", label: "Prime", time: "7-9 PM", icon: "🌙" },
  { value: "late", label: "Late", time: "9 PM+", icon: "✨" },
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
  budget: Budget
  location: string
  vibes: string[]
  time: string
  partySize: number
  cuisine?: string
  customCuisine?: string
  activity?: string
  customActivity?: string
}

interface SetupScreenProps {
  onSubmit: (config: DateConfig) => void
}

export function SetupScreen({ onSubmit }: SetupScreenProps) {
  const [budget, setBudget] = useState<Budget>("$$")
  const [location, setLocation] = useState("")
  const [vibes, setVibes] = useState<string[]>(["romantic"])
  const [time, setTime] = useState("prime")
  const [partySize, setPartySize] = useState(2)
  const [cuisine, setCuisine] = useState<string>("any")
  const [activity, setActivity] = useState<string>("none")
  const [customCuisine, setCustomCuisine] = useState("")
  const [showCustomCuisine, setShowCustomCuisine] = useState(false)
  const [customActivity, setCustomActivity] = useState("")
  const [showCustomActivity, setShowCustomActivity] = useState(false)
  const [isLocating, setIsLocating] = useState(false)

  const toggleVibe = (id: string) => {
    setVibes(prev =>
      prev.includes(id)
        ? prev.filter(v => v !== id)
        : prev.length < 3 ? [...prev, id] : prev
    )
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

  const handleSurpriseMe = () => {
    setBudget(BUDGET_OPTIONS[Math.floor(Math.random() * BUDGET_OPTIONS.length)].value)
    setVibes([...VIBE_OPTIONS].sort(() => Math.random() - 0.5).slice(0, 2).map(v => v.id))
    setTime(TIME_OPTIONS[Math.floor(Math.random() * TIME_OPTIONS.length)].value)
    setCuisine(CUISINE_OPTIONS[Math.floor(Math.random() * CUISINE_OPTIONS.length)].id)
  }

  const handleSubmit = () => {
    onSubmit({
      budget,
      location: location || "",
      vibes,
      time,
      partySize,
      cuisine: cuisine === "custom" ? customCuisine : cuisine,
      customCuisine: cuisine === "custom" ? customCuisine : undefined,
      activity: activity === "custom" ? customActivity : activity,
      customActivity: activity === "custom" ? customActivity : undefined,
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
          className="mb-6 flex items-center justify-center gap-2 py-2.5 rounded-xl border border-dashed border-primary/30 text-primary text-xs font-medium hover:bg-primary/5 active:scale-[0.98] transition-all"
        >
          <Shuffle className="w-3.5 h-3.5" />
          Surprise Me
        </button>

        {/* Form */}
        <div className="flex flex-col gap-6 flex-1">
          {/* Location */}
          <section>
            <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5 mb-2.5">
              <MapPin className="w-3 h-3" />
              Location
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Compass className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-primary/60" />
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-card border border-border text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/40 text-sm transition-all"
                  placeholder="City or neighborhood..."
                />
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

          {/* Party Size + Time (side by side) */}
          <div className="grid grid-cols-2 gap-4">
            <section>
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

            <section>
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
          </div>

          {/* Budget */}
          <section>
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
          <section>
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
            </div>
          </section>

          {/* Cuisine Preference */}
          <section>
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
              <div className="mt-2 flex gap-2">
                <input
                  type="text"
                  value={customCuisine}
                  onChange={(e) => setCustomCuisine(e.target.value)}
                  className="flex-1 px-3 py-2 rounded-xl bg-card border border-border text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/40 text-xs transition-all"
                  placeholder="e.g. Korean BBQ, Peruvian, Sushi..."
                  autoFocus
                />
                <button
                  onClick={() => { setShowCustomCuisine(false); setCuisine("any"); setCustomCuisine("") }}
                  className="p-2 rounded-xl bg-card border border-border text-muted-foreground hover:text-foreground transition-all"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </section>

          {/* Activity Preference */}
          <section>
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
              <div className="mt-2 flex gap-2">
                <input
                  type="text"
                  value={customActivity}
                  onChange={(e) => setCustomActivity(e.target.value)}
                  className="flex-1 px-3 py-2 rounded-xl bg-card border border-border text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/40 text-xs transition-all"
                  placeholder="e.g. Bowling, Comedy show, Karaoke..."
                  autoFocus
                />
                <button
                  onClick={() => { setShowCustomActivity(false); setActivity("none"); setCustomActivity("") }}
                  className="p-2 rounded-xl bg-card border border-border text-muted-foreground hover:text-foreground transition-all"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </section>
        </div>

        {/* CTA */}
        <div className="mt-6 pt-4 border-t border-border/60">
          <button
            onClick={handleSubmit}
            disabled={vibes.length === 0}
            className="w-full py-4 rounded-2xl bg-primary text-primary-foreground font-semibold text-sm flex items-center justify-center gap-2 shadow-lg shadow-primary/25 active:scale-[0.98] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Sparkles className="w-4 h-4" />
            Plan My Night
          </button>
          {vibes.length === 0 && (
            <p className="text-center text-xs text-destructive mt-2">Select at least one vibe to continue</p>
          )}
        </div>
      </div>
    </div>
  )
}
