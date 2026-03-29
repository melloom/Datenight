"use client"

import { useState, useEffect } from "react"
import {
  MapPin,
  Navigation,
  Star,
  Wine,
  UtensilsCrossed,
  Sparkles,
  Clock,
  Phone,
  RefreshCw,
  Share2,
  ArrowLeft,
  Shuffle,
  Wand2,
  Copy,
  Check,
  Heart,
  LogOut,
  Eye,
  Lock,
  ExternalLink,
  Bookmark
} from "lucide-react"
import { Venue } from "@/lib/venue-search"
import { useAuth } from "@/lib/auth-context"
import { AIAssistant } from "@/components/ai/ai-assistant"
import { AIRecommendation } from "@/components/ai/ai-recommendation"

interface Step {
  id: number
  label: string
  time: string
  icon: React.ReactNode
  place: string
  rating: number
  reviewCount: number
  priceRange: string
  tag: string
  description: string
  highlights: string[]
  address: string
  phone: string
  category: string
}

function StarRating({ value, count }: { value: number; count: number }) {
  return (
    <div className="flex items-center gap-1.5">
      <div className="flex items-center">
        {[1, 2, 3, 4, 5].map((s) => (
          <Star
            key={s}
            className={`w-3.5 h-3.5 ${
              s <= Math.floor(value)
                ? "fill-amber-400 text-amber-400"
                : s <= value
                ? "fill-amber-400/50 text-amber-400/50"
                : "text-border"
            }`}
          />
        ))}
      </div>
      <span className="text-xs font-semibold text-foreground">{value}</span>
      <span className="text-[10px] text-muted-foreground">({count})</span>
    </div>
  )
}

function StepCard({
  step,
  index,
  isRevealed,
  isNext,
  onReveal,
  totalSteps
}: {
  step: Step
  index: number
  isRevealed: boolean
  isNext: boolean
  onReveal: (index: number) => void
  totalSteps: number
}) {
  const [isSaved, setIsSaved] = useState(false)

  const stepColors = [
    { bg: "bg-rose-500/10", border: "border-rose-500/20", text: "text-rose-600", dot: "bg-rose-500" },
    { bg: "bg-amber-500/10", border: "border-amber-500/20", text: "text-amber-600", dot: "bg-amber-500" },
    { bg: "bg-violet-500/10", border: "border-violet-500/20", text: "text-violet-600", dot: "bg-violet-500" },
  ]
  const color = stepColors[index % stepColors.length]

  return (
    <div className="flex gap-4">
      {/* Timeline */}
      <div className="flex flex-col items-center pt-1">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
          isRevealed ? `${color.bg} ${color.text}` : "bg-muted text-muted-foreground"
        }`}>
          {isRevealed ? step.id : <Lock className="w-3.5 h-3.5" />}
        </div>
        {index < totalSteps - 1 && (
          <div className={`w-px flex-1 mt-2 ${isRevealed ? color.dot + "/30" : "bg-border"}`} style={{ minHeight: "2rem" }} />
        )}
      </div>

      {/* Card */}
      <div className={`flex-1 mb-4 rounded-2xl border overflow-hidden transition-all duration-300 ${
        isRevealed
          ? `${color.border} bg-card shadow-sm`
          : "border-border bg-card/50"
      }`}>
        {isRevealed ? (
          <div className="p-4 space-y-3">
            {/* Header */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-[10px] font-semibold uppercase tracking-wider ${color.text}`}>{step.label}</span>
                  <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                    <Clock className="w-2.5 h-2.5" />
                    {step.time}
                  </span>
                </div>
                <h3 className="font-bold text-base text-foreground leading-tight">{step.place}</h3>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={() => setIsSaved(!isSaved)}
                  className="p-1.5 rounded-lg hover:bg-muted transition-colors"
                >
                  <Bookmark className={`w-3.5 h-3.5 ${isSaved ? "fill-primary text-primary" : "text-muted-foreground"}`} />
                </button>
              </div>
            </div>

            {/* Rating + Price */}
            <div className="flex items-center gap-3">
              <StarRating value={step.rating} count={step.reviewCount} />
              <span className="text-xs font-medium text-muted-foreground">{step.priceRange}</span>
              <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${color.bg} ${color.text}`}>
                {step.tag}
              </span>
            </div>

            {/* Description */}
            <p className="text-xs text-muted-foreground leading-relaxed">{step.description}</p>

            {/* Highlights */}
            <div className="flex flex-wrap gap-1.5">
              {step.highlights.slice(0, 4).map((h, i) => (
                <span key={i} className="text-[10px] px-2 py-0.5 rounded-md bg-muted/80 text-muted-foreground font-medium">
                  {h}
                </span>
              ))}
            </div>

            {/* Address */}
            <div className="flex items-start gap-1.5 text-xs text-muted-foreground">
              <MapPin className="w-3 h-3 mt-0.5 shrink-0" />
              <span>{step.address}</span>
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-1">
              <a
                href={`https://maps.google.com/?q=${encodeURIComponent(step.address)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 py-2 px-3 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90 active:scale-[0.98] transition-all flex-1 justify-center"
              >
                <Navigation className="w-3.5 h-3.5" />
                Directions
              </a>
              {step.phone && step.phone !== "Phone not available" && (
                <a
                  href={`tel:${step.phone}`}
                  className="flex items-center gap-1.5 py-2 px-3 rounded-xl border border-border text-xs font-medium text-muted-foreground hover:text-foreground hover:border-primary/30 transition-all"
                >
                  <Phone className="w-3.5 h-3.5" />
                  Call
                </a>
              )}
            </div>

            {/* Swap Button */}
            {onVenuesUpdate && (
              <button
                onClick={() => handleSwapVenue(index)}
                disabled={isSwapping === index}
                className="flex items-center gap-1.5 py-2 px-3 rounded-xl border border-border text-xs font-medium text-muted-foreground hover:text-foreground hover:border-primary/30 transition-all disabled:opacity-50 w-full justify-center mt-2"
              >
                {isSwapping === index ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Shuffle className="w-3.5 h-3.5" />
                )}
                {isSwapping === index ? 'Finding Alternative...' : 'Swap This Venue'}
              </button>
            )}
          </div>
        ) : (
          /* Locked */
          <div className="p-5 flex flex-col items-center gap-3">
            <div className="w-full space-y-2">
              <div className="h-3 w-2/3 rounded-full bg-muted/60" />
              <div className="h-2.5 w-full rounded-full bg-muted/40" />
              <div className="h-2.5 w-4/5 rounded-full bg-muted/30" />
            </div>
            {isNext ? (
              <button
                onClick={() => onReveal(index)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-semibold shadow-md shadow-primary/20 active:scale-[0.98] transition-all"
              >
                <Eye className="w-3.5 h-3.5" />
                Reveal Stop {step.id}
              </button>
            ) : (
              <p className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                <Lock className="w-3 h-3" />
                Reveal previous stop first
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

interface ItineraryScreenProps {
  onReset: () => void
  venues: Venue[]
  searchCriteria?: any
  onVenuesUpdate?: (venues: Venue[]) => void
}

export function ItineraryScreen({ onReset, venues, searchCriteria, onVenuesUpdate }: ItineraryScreenProps) {
  const [revealedCount, setRevealedCount] = useState(0)
  const [copied, setCopied] = useState(false)
  const [steps, setSteps] = useState<Step[]>([])
  const [isAIAssistantOpen, setIsAIAssistantOpen] = useState(false)
  const [isSwapping, setIsSwapping] = useState<number | null>(null)
  const [isImproving, setIsImproving] = useState(false)
  const { signOut } = useAuth()

  useEffect(() => {
    if (!venues || venues.length === 0) {
      setSteps([])
      return
    }

    const convertedSteps: Step[] = venues.map((venue, index) => ({
      id: index + 1,
      label: venue.category === "drinks" ? "Drinks" : venue.category === "dinner" ? "Dinner" : "Activity",
      time: venue.category === "drinks" ? "7:00 PM" : venue.category === "dinner" ? "8:30 PM" : "10:00 PM",
      icon: venue.category === "drinks" ? <Wine className="w-5 h-5" /> : venue.category === "dinner" ? <UtensilsCrossed className="w-5 h-5" /> : <Sparkles className="w-5 h-5" />,
      place: venue.name,
      rating: venue.rating,
      reviewCount: venue.reviewCount,
      priceRange: venue.priceRange,
      tag: venue.category === "drinks" ? "Cocktails" : venue.category === "dinner" ? "Dining" : "Experience",
      description: venue.description,
      highlights: venue.highlights,
      address: venue.address,
      phone: venue.phone || "Phone not available",
      category: venue.category,
    }))

    setSteps(convertedSteps)
  }, [venues])

  const handleReveal = () => {
    setRevealedCount((c) => c + 1)
  }

  const handleCopyItinerary = async () => {
    const text = steps
      .map((s, i) => `${i + 1}. ${s.place} (${s.label}) - ${s.time}\n   ${s.address}\n   ${s.description}`)
      .join("\n\n")
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleSignOut = async () => {
    try { await signOut() } catch {}
  }

  const handleSwapVenue = async (index: number) => {
    if (!searchCriteria || !onVenuesUpdate) return
    setIsSwapping(index)
    
    try {
      const venueToSwap = venues[index]
      const response = await fetch('/api/ai/enhance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'swap-venue',
          venue: venueToSwap,
          criteria: searchCriteria,
          currentPlan: venues
        })
      })

      if (response.ok) {
        const data = await response.json()
        if (data.venue) {
          const newVenues = [...venues]
          newVenues[index] = data.venue
          onVenuesUpdate(newVenues)
        }
      }
    } catch (e) {
      console.error('Failed to swap venue:', e)
    } finally {
      setIsSwapping(null)
    }
  }

  const handleImprovePlan = async () => {
    if (!searchCriteria || !onVenuesUpdate) return
    setIsImproving(true)
    
    try {
      const response = await fetch('/api/ai/enhance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'improve-plan',
          currentPlan: venues,
          criteria: searchCriteria
        })
      })

      if (response.ok) {
        const data = await response.json()
        if (data.venues && data.venues.length > 0) {
          onVenuesUpdate(data.venues)
        }
      }
    } catch (e) {
      console.error('Failed to improve plan:', e)
    } finally {
      setIsImproving(false)
    }
  }

  const allRevealed = revealedCount >= steps.length && steps.length > 0

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-background/90 backdrop-blur-md border-b border-border/50">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
          <button
            onClick={onReset}
            className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            New Plan
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyItinerary}
              disabled={steps.length === 0}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-xs font-medium hover:bg-primary/15 transition-all disabled:opacity-40"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? "Copied" : "Copy"}
            </button>
            <button
              onClick={handleSignOut}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6">
        {/* Progress */}
        <div className="text-center mb-6">
          <h1 className="text-xl font-bold text-foreground mb-1">Your Date Night</h1>
          <p className="text-sm text-muted-foreground mb-4">
            {allRevealed ? "All stops revealed!" : `${revealedCount} of ${steps.length} stops revealed`}
          </p>

          {/* Progress bar */}
          <div className="flex gap-1.5 justify-center mb-2">
            {steps.map((_, i) => (
              <div
                key={i}
                className={`h-1.5 rounded-full transition-all duration-500 ${
                  i < revealedCount ? "bg-primary w-8" : "bg-muted w-4"
                }`}
              />
            ))}
          </div>

          {steps.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-center gap-4 text-[11px] text-muted-foreground">
                <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> ~4-5 hrs</span>
                <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {steps.length} stops</span>
                <span className="flex items-center gap-1">{steps.map(s => s.priceRange).join(" + ")}</span>
              </div>
              {onVenuesUpdate && (
                <button
                  onClick={handleImprovePlan}
                  disabled={isImproving}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-violet-500 to-purple-500 text-white text-xs font-semibold hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50 mx-auto"
                >
                  {isImproving ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Wand2 className="w-3.5 h-3.5" />
                  )}
                  {isImproving ? 'Improving Plan...' : 'AI Improve Entire Plan'}
                </button>
              )}
            </div>
          )}
        </div>

        {/* AI Recommendation */}
        {steps.length > 0 && searchCriteria && (
          <div className="mb-6">
            <AIRecommendation venues={venues} criteria={searchCriteria} />
          </div>
        )}

        {/* Steps */}
        <div>
          {steps.map((step, index) => (
            <StepCard
              key={index}
              step={step}
              index={index}
              isRevealed={index < revealedCount}
              isNext={index === revealedCount}
              onReveal={handleReveal}
              totalSteps={steps.length}
            />
          ))}
        </div>

        {/* All Revealed CTA */}
        {allRevealed && (
          <div className="mt-4 p-5 rounded-2xl bg-primary/5 border border-primary/20 text-center">
            <Heart className="w-6 h-6 text-primary mx-auto mb-2" />
            <h3 className="font-semibold text-sm text-foreground mb-1">Your Night is Set!</h3>
            <p className="text-xs text-muted-foreground mb-3">All venues revealed. Have an amazing time!</p>
            <button
              onClick={handleCopyItinerary}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90 active:scale-[0.98] transition-all"
            >
              <Share2 className="w-3.5 h-3.5" />
              Share Plan
            </button>
          </div>
        )}

        {/* Empty state */}
        {steps.length === 0 && (
          <div className="text-center py-12">
            <Sparkles className="w-8 h-8 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No venues found. Try a different location or settings.</p>
            <button
              onClick={onReset}
              className="mt-3 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold"
            >
              Try Again
            </button>
          </div>
        )}
      </div>

      {/* AI Assistant */}
      <AIAssistant
        currentVenue={steps[revealedCount - 1] ? {
          id: steps[revealedCount - 1].id.toString(),
          name: steps[revealedCount - 1].place,
          category: steps[revealedCount - 1].category as any,
          rating: steps[revealedCount - 1].rating,
          reviewCount: steps[revealedCount - 1].reviewCount,
          priceRange: steps[revealedCount - 1].priceRange,
          address: steps[revealedCount - 1].address,
          description: steps[revealedCount - 1].description,
          highlights: steps[revealedCount - 1].highlights,
          coordinates: { lat: 0, lng: 0 },
          tags: [],
          features: []
        } : undefined}
        isOpen={isAIAssistantOpen}
        onToggle={() => setIsAIAssistantOpen(!isAIAssistantOpen)}
      />
    </div>
  )
}
