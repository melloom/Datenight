"use client"

import { useState, useEffect } from "react"
import { 
  Lock, 
  MapPin, 
  Navigation, 
  Star, 
  ChevronDown, 
  Wine, 
  UtensilsCrossed, 
  Sparkles,
  Clock,
  DollarSign,
  Phone,
  ExternalLink,
  RefreshCw,
  Share2,
  Bookmark,
  Camera,
  Calendar,
  ArrowLeft,
  Copy,
  Check,
  Heart,
  LogOut
} from "lucide-react"
import { Venue } from "@/lib/venue-search"
import { useAuth } from "@/lib/auth-context"

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
  imageUrl: string
  description: string
  highlights: string[]
  address: string
  phone: string
  duration: string
  estCost: string
  photoSpots: string
}

const STEPS: Step[] = []

function StarRating({ value, count }: { value: number; count: number }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((s) => (
          <Star
            key={s}
            className={`w-4 h-4 ${
              s <= Math.floor(value) 
                ? "fill-yellow-400 text-yellow-400" 
                : s <= value 
                ? "fill-yellow-400/50 text-yellow-400/50"
                : "text-border"
            }`}
          />
        ))}
      </div>
      <span className="text-sm font-bold text-foreground">{value}</span>
      <span className="text-xs text-muted-foreground">({count} reviews)</span>
    </div>
  )
}

interface StepCardProps {
  step: Step
  index: number
  isRevealed: boolean
  isNext: boolean
  onReveal: (index: number) => void
  onSwap: (index: number) => void
}

function StepCard({ step, index, isRevealed, isNext, onReveal, onSwap }: StepCardProps) {
  const [showPhone, setShowPhone] = useState(false)
  const [isSaved, setIsSaved] = useState(false)

  return (
    <div
      className={`relative rounded-3xl border overflow-hidden transition-all duration-500 ${
        isRevealed
          ? "border-primary/30 bg-card shadow-xl shadow-primary/10"
          : "border-border bg-secondary/50"
      }`}
    >
      {/* Card header */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-border/60">
        <div className="flex items-center gap-3 flex-1">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 ${
            isRevealed ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
          }`}>
            {step.icon}
          </div>
          <div className="flex flex-col">
            <span className="font-semibold text-sm text-foreground">Step {step.id}: {step.label}</span>
            {isRevealed && (
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {step.time}
              </span>
            )}
          </div>
        </div>
        {isRevealed ? (
          <span className="text-xs px-3 py-1.5 rounded-full bg-primary/15 text-primary font-semibold border border-primary/20">
            {step.tag}
          </span>
        ) : (
          <Lock className="w-5 h-5 text-muted-foreground" />
        )}
      </div>

      {/* Card body */}
      {isRevealed ? (
        <div className="p-5 space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
          {/* Header info */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <h3 className="font-bold text-lg mb-2">{step.place}</h3>
              
              {/* Rating and Reviews */}
              <div className="flex items-center gap-3 mb-3">
                <StarRating value={step.rating} count={step.reviewCount} />
                <span className="text-sm font-semibold text-foreground">{step.priceRange}</span>
              </div>
              
              {/* Description */}
              <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                {step.description}
              </p>
              
              {/* Highlights */}
              <div className="flex flex-wrap gap-2 mb-3">
                {step.highlights.map((highlight, i) => (
                  <span
                    key={i}
                    className="px-3 py-1 rounded-full text-xs font-medium bg-secondary/80 border border-border/50"
                  >
                    {highlight}
                  </span>
                ))}
              </div>
              
              {/* Address */}
              <div className="flex items-start gap-2 mb-3">
                <MapPin className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm text-foreground">{step.address}</p>
                  {showPhone && (
                    <p className="text-sm text-muted-foreground">{step.phone}</p>
                  )}
                </div>
              </div>
            </div>
            
            {/* Actions */}
            <div className="flex flex-col gap-2">
              <button
                onClick={() => setIsSaved(!isSaved)}
                className="p-2 rounded-xl border border-border/50 hover:border-primary/50 hover:bg-primary/5 transition-all"
              >
                <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-primary text-primary' : 'text-muted-foreground'}`} />
              </button>
              <button
                onClick={() => setShowPhone(!showPhone)}
                className="p-2 rounded-xl border border-border/50 hover:border-primary/50 hover:bg-primary/5 transition-all"
              >
                <Phone className="w-4 h-4 text-muted-foreground" />
              </button>
              <button
                onClick={() => onSwap(index)}
                className="p-2 rounded-xl border border-border/50 hover:border-primary/50 hover:bg-primary/5 transition-all"
              >
                <RefreshCw className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>
          </div>
          
          {/* Bottom Actions */}
          <div className="flex gap-2 pt-2 border-t border-border/50">
            <a
              href={`https://maps.google.com/?q=${encodeURIComponent(step.address)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 active:scale-[0.98] transition-all flex-1"
            >
              <Navigation className="w-4 h-4" />
              Get Directions
            </a>
            {step.phone && (
              <a
                href={`tel:${step.phone}`}
                className="flex items-center justify-center gap-2 py-3.5 rounded-2xl border border-border text-muted-foreground font-semibold text-sm hover:border-primary/50 hover:text-foreground active:scale-[0.98] transition-all"
              >
                <Phone className="w-4 h-4" />
                Call
              </a>
            )}
          </div>
        </div>
      ) : (
        /* Locked state */
        <div className="px-5 py-8 flex flex-col items-center gap-4 relative">
          {/* Blur placeholders */}
          <div className="w-full space-y-3">
            <div className="h-32 rounded-xl bg-muted/30 blur-sm" />
            <div className="h-4 w-3/4 rounded-full bg-muted/30 blur-sm" />
            <div className="h-4 w-1/2 rounded-full bg-muted/30 blur-sm" />
          </div>

          {isNext ? (
            <button
              onClick={() => onReveal(index)}
              className="flex items-center gap-2 px-8 py-4 rounded-2xl bg-linear-to-r from-primary to-accent text-primary-foreground font-bold text-sm shadow-xl shadow-primary/30 active:scale-[0.98] transition-all group"
            >
              <ChevronDown className="w-5 h-5 group-hover:translate-y-0.5 transition-transform" />
              Reveal
            </button>
          ) : (
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <Lock className="w-4 h-4" />
              <span>Complete previous step first</span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

interface ItineraryScreenProps {
  onReset: () => void
  venues: Venue[]
}

export function ItineraryScreen({ onReset, venues }: ItineraryScreenProps) {
  const [revealedCount, setRevealedCount] = useState(0)
  const [copied, setCopied] = useState(false)
  const [steps, setSteps] = useState<Step[]>([])
  const { user, signOut } = useAuth()

  // Convert venues to steps when venues change
  useEffect(() => {
    console.log('🎯 Itinerary screen received venues:', venues.length)
    
    if (!venues || venues.length === 0) {
      console.warn('⚠️ No venues received, creating fallback steps')
      setSteps([])
      return
    }

    const convertedSteps: Step[] = venues.map((venue, index) => ({
      id: index + 1,
      label: venue.category === 'drinks' ? 'Drinks' : venue.category === 'dinner' ? 'Dinner' : 'Activity',
      time: venue.category === 'drinks' ? '7:00 PM' : venue.category === 'dinner' ? '8:30 PM' : '10:00 PM',
      icon: venue.category === 'drinks' ? <Wine className="w-5 h-5" /> : venue.category === 'dinner' ? <UtensilsCrossed className="w-5 h-5" /> : <Sparkles className="w-5 h-5" />,
      place: venue.name,
      rating: venue.rating,
      reviewCount: venue.reviewCount,
      priceRange: venue.priceRange,
      tag: venue.category === 'drinks' ? 'Speakeasy' : venue.category === 'dinner' ? 'Fine Dining' : 'Experience',
      imageUrl: venue.imageUrl || 'https://source.unsplash.com/400x300/?venue,date-night',
      description: venue.description,
      highlights: venue.highlights,
      address: venue.address,
      phone: venue.phone || 'Phone not available',
      duration: '~2 hours',
      estCost: 'TBD',
      photoSpots: 'TBD'
    }))

    console.log('✅ Converted venues to steps:', convertedSteps.length)
    setSteps(convertedSteps)
  }, [venues])

  const handleReveal = (index: number) => {
    setRevealedCount((c) => c + 1)
  }

  const handleSwap = (index: number) => {
    // In a real app, this would fetch a new venue
    console.log(`Swapping step ${index + 1}`)
  }

  const handleCopyItinerary = async () => {
    const itineraryText = steps.map((step, index) => 
      `${index + 1}. ${step.place} - ${step.time}\n   ${step.description}\n   ${step.address}\n   Rating: ${step.rating}⭐ (${step.reviewCount} reviews)\n   ${step.highlights.join(' • ')}\n`
    ).join('\n')

    await navigator.clipboard.writeText(itineraryText)
    setCopied(true)
    setTimeout(() => setCopied(false), 3000)
  }

  const handleSignOut = async () => {
    try {
      await signOut()
    } catch (error) {
      console.error("Sign-out failed:", error)
    }
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-background via-background to-muted/30">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border/60">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={onReset}
                className="flex items-center gap-2 px-4 py-2 rounded-2xl border border-border/60 hover:border-primary/50 hover:bg-primary/5 transition-all text-sm font-medium"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </button>
              <div>
                <h1 className="text-2xl font-bold">Your Date Night</h1>
                <p className="text-sm text-muted-foreground">A perfectly curated evening</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleCopyItinerary}
                className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-primary text-primary-foreground font-medium text-sm hover:opacity-90 active:scale-[0.98] transition-all"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    Copy Plan
                  </>
                )}
              </button>
              
              <button
                onClick={handleSignOut}
                className="flex items-center gap-2 px-4 py-2 rounded-2xl border border-border/60 hover:border-destructive/50 hover:bg-destructive/5 transition-all text-sm font-medium text-muted-foreground hover:text-destructive"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Progress Header */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-4">
            <Calendar className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-primary">Your evening is ready!</span>
          </div>
          <h2 className="text-3xl font-bold mb-2">{revealedCount}/{steps.length}</h2>
          <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground">
            <span>Duration {steps.length > 0 ? '~4-5 hours' : 'TBD'}</span>
            <span>•</span>
            <span>Est. Cost {steps.length > 0 ? steps.map(s => s.priceRange).join(' + ') : 'TBD'}</span>
            <span>•</span>
            <span>Photo Spots {steps.length > 0 ? 'Multiple locations' : 'TBD'}</span>
          </div>
        </div>

        {/* Visual Node Flow */}
        <div className="relative">
          {/* Connection Lines */}
          {steps.length > 1 && (
            <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-linear-to-b from-primary/20 via-primary/40 to-primary/20 -translate-x-1/2" />
          )}

          {/* Node Steps */}
          <div className="space-y-8">
            {steps.map((step, index) => (
              <div key={index} className="relative">
                {/* Connection Node */}
                {index > 0 && (
                  <div className="absolute left-1/2 -top-4 w-4 h-4 bg-primary rounded-full -translate-x-1/2 ring-4 ring-background" />
                )}

                {/* Step Card */}
                <div className={`relative ${index > 0 ? 'ml-12' : ''}`}>
                  <StepCard
                    step={step}
                    index={index}
                    isRevealed={index < revealedCount}
                    isNext={index === revealedCount}
                    onReveal={handleReveal}
                    onSwap={handleSwap}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Complete Button */}
          {revealedCount === steps.length && steps.length > 0 && (
            <div className="text-center mt-12">
              <div className="inline-flex flex-col items-center gap-4 p-6 rounded-3xl bg-linear-to-r from-primary/10 to-accent/10 border border-primary/20">
                <div className="flex items-center gap-2 text-lg font-semibold text-primary">
                  <Heart className="w-5 h-5" />
                  Your Perfect Date Awaits
                </div>
                <p className="text-sm text-muted-foreground max-w-md">
                  All venues have been revealed. You're ready for an amazing evening together!
                </p>
                <button
                  onClick={handleCopyItinerary}
                  className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-primary text-primary-foreground font-semibold hover:opacity-90 active:scale-[0.98] transition-all"
                >
                  <Share2 className="w-4 h-4" />
                  Share This Plan
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
