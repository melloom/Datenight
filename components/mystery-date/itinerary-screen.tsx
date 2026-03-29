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
  Bookmark,
  Car,
  Footprints,
  CalendarCheck,
  SendHorizontal,
  MessageSquare,
  X,
  MessageCircleHeart,
  Smartphone,
  Link2
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
  imageUrl?: string
  website?: string
  hours?: string
  vibe?: string
  features: string[]
  tags: string[]
  coordinates: { lat: number; lng: number }
  reservationRecommended: boolean
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

function VenueImage({ src, alt, category }: { src?: string; alt: string; category: string }) {
  const [imgError, setImgError] = useState(false)
  const fallbackGradients: Record<string, string> = {
    drinks: "from-rose-500/20 to-orange-500/20",
    dinner: "from-amber-500/20 to-yellow-500/20",
    activity: "from-violet-500/20 to-indigo-500/20",
  }
  const fallbackIcons: Record<string, React.ReactNode> = {
    drinks: <Wine className="w-8 h-8 text-rose-400" />,
    dinner: <UtensilsCrossed className="w-8 h-8 text-amber-400" />,
    activity: <Sparkles className="w-8 h-8 text-violet-400" />,
  }

  if (!src || imgError) {
    return (
      <div className={`w-full h-40 bg-linear-to-br ${fallbackGradients[category] || fallbackGradients.activity} flex items-center justify-center`}>
        {fallbackIcons[category] || fallbackIcons.activity}
      </div>
    )
  }

  return (
    <div className="relative w-full h-40 overflow-hidden">
      <img
        src={src}
        alt={alt}
        className="w-full h-full object-cover"
        onError={() => setImgError(true)}
      />
      <div className="absolute inset-0 bg-linear-to-t from-black/40 via-transparent to-transparent" />
    </div>
  )
}

function PriceBadge({ price }: { price: string }) {
  const priceColors: Record<string, string> = {
    "$": "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
    "$$": "bg-blue-500/10 text-blue-600 border-blue-500/20",
    "$$$": "bg-amber-500/10 text-amber-600 border-amber-500/20",
    "$$$$": "bg-purple-500/10 text-purple-600 border-purple-500/20",
  }
  const priceLabels: Record<string, string> = {
    "$": "Budget-Friendly",
    "$$": "Moderate",
    "$$$": "Upscale",
    "$$$$": "Fine Dining",
  }
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${priceColors[price] || priceColors["$$"]}`}>
      {price} <span className="font-normal opacity-75">{priceLabels[price] || ""}</span>
    </span>
  )
}

function haversineDistance(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number }
): number {
  if (!a.lat || !a.lng || !b.lat || !b.lng) return -1
  const R = 3959 // miles
  const dLat = ((b.lat - a.lat) * Math.PI) / 180
  const dLng = ((b.lng - a.lng) * Math.PI) / 180
  const x =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((a.lat * Math.PI) / 180) *
      Math.cos((b.lat * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2)
  return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x))
}

function TravelInfo({ from, to }: { from: Step; to: Step }) {
  const dist = haversineDistance(from.coordinates, to.coordinates)
  if (dist < 0) return null

  const isWalkable = dist <= 0.5
  const walkMin = Math.round(dist * 20) // ~3mph
  const driveMin = Math.max(Math.round(dist * 2.5), 2) // ~25mph city avg

  return (
    <div className="flex items-center gap-3 ml-12 -mt-2 mb-2">
      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted/60 border border-border/40">
        {isWalkable ? (
          <>
            <Footprints className="w-3 h-3 text-emerald-500" />
            <span className="text-[10px] font-medium text-muted-foreground">
              {walkMin} min walk
            </span>
          </>
        ) : (
          <>
            <Car className="w-3 h-3 text-blue-500" />
            <span className="text-[10px] font-medium text-muted-foreground">
              {driveMin} min drive
            </span>
          </>
        )}
        <span className="text-[10px] text-muted-foreground/60">
          ({dist.toFixed(1)} mi)
        </span>
      </div>
      {isWalkable && (
        <span className="text-[10px] text-emerald-600 font-medium">Walking distance!</span>
      )}
    </div>
  )
}

function ReservationBadge() {
  return (
    <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-orange-500/10 border border-orange-500/20">
      <CalendarCheck className="w-3.5 h-3.5 text-orange-500" />
      <span className="text-[10px] font-semibold text-orange-600">Reservation Recommended</span>
    </div>
  )
}

function formatItineraryForShare(steps: Step[]): string {
  const header = "🌙 Date Night Plan\n━━━━━━━━━━━━━━━━━━"
  const body = steps.map((s, i) => {
    const emoji = s.category === "drinks" ? "🍸" : s.category === "dinner" ? "🍽️" : "✨"
    let block = `\n${emoji} Stop ${i + 1}: ${s.place}\n⏰ ${s.time} · ${s.priceRange}\n📍 ${s.address}`
    if (s.reservationRecommended) block += "\n📋 Reservation recommended"
    if (s.description) block += `\n💬 ${s.description}`
    return block
  }).join("\n")
  const footer = "\n━━━━━━━━━━━━━━━━━━\n❤️ Have an amazing night!"
  return `${header}${body}${footer}`
}

function ShareModal({ steps, isOpen, onClose }: { steps: Step[]; isOpen: boolean; onClose: () => void }) {
  const [copied, setCopied] = useState(false)
  const [shared, setShared] = useState(false)

  if (!isOpen) return null

  const shareText = formatItineraryForShare(steps)
  const shareTextEncoded = encodeURIComponent(shareText)
  const canNativeShare = typeof window !== "undefined" && !!window.navigator?.share

  const handleCopy = async () => {
    await navigator.clipboard.writeText(shareText)
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Date Night Plan",
          text: shareText,
        })
        setShared(true)
        setTimeout(() => setShared(false), 2500)
      } catch (e) {
        // user cancelled or not supported
      }
    }
  }

  const handleSMS = () => {
    window.open(`sms:?&body=${shareTextEncoded}`, "_blank")
  }

  const handleWhatsApp = () => {
    window.open(`https://wa.me/?text=${shareTextEncoded}`, "_blank")
  }

  return (
    <div className="fixed inset-0 z-60 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md mx-4 mb-4 sm:mb-0 bg-card border border-border rounded-2xl shadow-2xl animate-in slide-in-from-bottom-4 fade-in duration-300 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
              <MessageCircleHeart className="w-4.5 h-4.5 text-primary" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-foreground">Send to Your Partner</h3>
              <p className="text-[11px] text-muted-foreground">Share the plan for tonight</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        {/* Preview */}
        <div className="p-4">
          <div className="bg-muted/50 rounded-xl p-3 max-h-48 overflow-y-auto border border-border/50">
            <pre className="text-[11px] text-muted-foreground whitespace-pre-wrap font-sans leading-relaxed">{shareText}</pre>
          </div>
        </div>

        {/* Share Options */}
        <div className="px-4 pb-4 space-y-2">
          {canNativeShare && (
            <button
              onClick={handleNativeShare}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 active:scale-[0.98] transition-all justify-center"
            >
              {shared ? <Check className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
              {shared ? "Shared!" : "Share via..."}
            </button>
          )}

          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={handleSMS}
              className="flex flex-col items-center gap-1.5 px-3 py-3 rounded-xl border border-border hover:bg-muted/50 hover:border-primary/30 transition-all"
            >
              <Smartphone className="w-5 h-5 text-emerald-500" />
              <span className="text-[10px] font-medium text-muted-foreground">Text</span>
            </button>
            <button
              onClick={handleWhatsApp}
              className="flex flex-col items-center gap-1.5 px-3 py-3 rounded-xl border border-border hover:bg-muted/50 hover:border-primary/30 transition-all"
            >
              <MessageCircleHeart className="w-5 h-5 text-green-500" />
              <span className="text-[10px] font-medium text-muted-foreground">WhatsApp</span>
            </button>
            <button
              onClick={handleCopy}
              className="flex flex-col items-center gap-1.5 px-3 py-3 rounded-xl border border-border hover:bg-muted/50 hover:border-primary/30 transition-all"
            >
              {copied ? <Check className="w-5 h-5 text-primary" /> : <Link2 className="w-5 h-5 text-blue-500" />}
              <span className="text-[10px] font-medium text-muted-foreground">{copied ? "Copied!" : "Copy"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function StepCard({
  step,
  index,
  isRevealed,
  isNext,
  onReveal,
  totalSteps,
  onVenuesUpdate,
  handleSwapVenue,
  isSwapping
}: {
  step: Step
  index: number
  isRevealed: boolean
  isNext: boolean
  onReveal: (index: number) => void
  totalSteps: number
  onVenuesUpdate?: (venues: Venue[]) => void
  handleSwapVenue?: (index: number) => void
  isSwapping?: number | null
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
          <div>
            {/* Venue Photo */}
            <div className="relative">
              <VenueImage src={step.imageUrl} alt={step.place} category={step.category} />
              {/* Overlay badges */}
              <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg backdrop-blur-md bg-black/50 text-white`}>
                  {step.label}
                </span>
                <span className="text-[10px] font-medium px-2 py-1 rounded-lg backdrop-blur-md bg-black/50 text-white/90 flex items-center gap-0.5">
                  <Clock className="w-2.5 h-2.5" />
                  {step.time}
                </span>
              </div>
              <div className="absolute top-2.5 right-2.5">
                <button
                  onClick={() => setIsSaved(!isSaved)}
                  className="p-1.5 rounded-lg backdrop-blur-md bg-black/40 hover:bg-black/60 transition-colors"
                >
                  <Bookmark className={`w-4 h-4 ${isSaved ? "fill-white text-white" : "text-white/80"}`} />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-4 space-y-3">
              {/* Name + Tag */}
              <div>
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-bold text-base text-foreground leading-tight">{step.place}</h3>
                  <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full shrink-0 ${color.bg} ${color.text}`}>
                    {step.tag}
                  </span>
                </div>
                {step.vibe && (
                  <p className="text-[11px] text-muted-foreground mt-0.5 italic">{step.vibe}</p>
                )}
              </div>

              {/* Rating + Price Row */}
              <div className="flex items-center justify-between">
                <StarRating value={step.rating} count={step.reviewCount} />
                <PriceBadge price={step.priceRange} />
              </div>

              {/* Divider */}
              <div className="border-t border-border/60" />

              {/* Description */}
              <p className="text-xs text-muted-foreground leading-relaxed">{step.description}</p>

              {/* Highlights */}
              {step.highlights.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {step.highlights.slice(0, 5).map((h, i) => (
                    <span key={i} className="text-[10px] px-2 py-0.5 rounded-md bg-muted/80 text-muted-foreground font-medium">
                      {h}
                    </span>
                  ))}
                </div>
              )}

              {/* Features */}
              {step.features.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {step.features.slice(0, 4).map((f, i) => (
                    <span key={i} className={`text-[10px] px-2 py-0.5 rounded-md font-medium ${color.bg} ${color.text}`}>
                      {f}
                    </span>
                  ))}
                </div>
              )}

              {/* Reservation Badge */}
              {step.reservationRecommended && <ReservationBadge />}

              {/* Divider */}
              <div className="border-t border-border/60" />

              {/* Info Grid */}
              <div className="grid grid-cols-1 gap-2">
                {/* Address */}
                <div className="flex items-start gap-2 text-xs text-muted-foreground">
                  <MapPin className="w-3.5 h-3.5 mt-0.5 shrink-0 text-primary/60" />
                  <span className="leading-relaxed">{step.address}</span>
                </div>

                {/* Hours */}
                {step.hours && (
                  <div className="flex items-start gap-2 text-xs text-muted-foreground">
                    <Clock className="w-3.5 h-3.5 mt-0.5 shrink-0 text-primary/60" />
                    <span className="leading-relaxed">{step.hours}</span>
                  </div>
                )}

                {/* Phone */}
                {step.phone && step.phone !== "Phone not available" && (
                  <div className="flex items-start gap-2 text-xs text-muted-foreground">
                    <Phone className="w-3.5 h-3.5 mt-0.5 shrink-0 text-primary/60" />
                    <a href={`tel:${step.phone}`} className="hover:text-foreground transition-colors">{step.phone}</a>
                  </div>
                )}

                {/* Website */}
                {step.website && (
                  <div className="flex items-start gap-2 text-xs text-muted-foreground">
                    <ExternalLink className="w-3.5 h-3.5 mt-0.5 shrink-0 text-primary/60" />
                    <a href={step.website} target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors truncate">
                      Visit Website
                    </a>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-1">
                <a
                  href={
                    step.coordinates.lat && step.coordinates.lng
                      ? `https://www.google.com/maps/dir/?api=1&destination=${step.coordinates.lat},${step.coordinates.lng}&destination_place_id=&travelmode=driving`
                      : `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(step.place + ", " + step.address)}`
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 py-2.5 px-4 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90 active:scale-[0.98] transition-all flex-1 justify-center"
                >
                  <Navigation className="w-3.5 h-3.5" />
                  Navigate Here
                </a>
                {step.phone && step.phone !== "Phone not available" && (
                  <a
                    href={`tel:${step.phone}`}
                    className="flex items-center gap-1.5 py-2.5 px-4 rounded-xl border border-border text-xs font-medium text-muted-foreground hover:text-foreground hover:border-primary/30 transition-all"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    Call
                  </a>
                )}
              </div>

              {/* Swap Button */}
              {onVenuesUpdate && handleSwapVenue && (
                <button
                  onClick={() => handleSwapVenue(index)}
                  disabled={isSwapping === index}
                  className="flex items-center gap-1.5 py-2 px-3 rounded-xl border border-dashed border-border text-xs font-medium text-muted-foreground hover:text-foreground hover:border-primary/30 transition-all disabled:opacity-50 w-full justify-center"
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
  const [isShareOpen, setIsShareOpen] = useState(false)
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
      imageUrl: venue.imageUrl,
      website: venue.website,
      hours: venue.hours,
      vibe: venue.vibe,
      features: venue.features || [],
      tags: venue.tags || [],
      coordinates: venue.coordinates || { lat: 0, lng: 0 },
      reservationRecommended:
        venue.category === "dinner" && (venue.priceRange === "$$$" || venue.priceRange === "$$$$") ||
        venue.category === "drinks" && venue.priceRange === "$$$$" ||
        false,
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

  const [aiEditInput, setAiEditInput] = useState("")
  const [isAIEditing, setIsAIEditing] = useState(false)

  const handleAIEdit = async () => {
    if (!aiEditInput.trim() || !searchCriteria || !onVenuesUpdate) return
    setIsAIEditing(true)

    try {
      const response = await fetch('/api/ai/enhance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'improve-plan',
          location: searchCriteria.location,
          criteria: searchCriteria,
          currentVenues: venues,
          feedback: aiEditInput.trim()
        })
      })

      if (response.ok) {
        const data = await response.json()
        if (data.venues && data.venues.length > 0) {
          const enhanced = data.venues.map((v: any) => ({
            ...v,
            id: v.id || `ai-${Date.now()}-${Math.random().toString(36).slice(2)}`,
            coordinates: v.coordinates || { lat: 0, lng: 0 },
            features: v.features || [],
            tags: v.tags || [],
            highlights: v.highlights || [],
          }))
          onVenuesUpdate(enhanced)
          setAiEditInput("")
        }
      }
    } catch (e) {
      console.error('AI edit failed:', e)
    } finally {
      setIsAIEditing(false)
    }
  }

  const allRevealed = revealedCount >= steps.length && steps.length > 0

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-background/90 backdrop-blur-md border-b border-border/50">
        <div className="mx-auto px-4 md:px-12 py-3 flex items-center justify-between w-full">
          <button
            onClick={onReset}
            className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            New Plan
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsShareOpen(true)}
              disabled={steps.length === 0}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:opacity-90 transition-all disabled:opacity-40"
            >
              <Share2 className="w-3.5 h-3.5" />
              Send
            </button>
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

      <div className="mx-auto px-4 md:px-12 py-6 w-full">
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
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-linear-to-r from-violet-500 to-purple-500 text-white text-xs font-semibold hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50 mx-auto"
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
            <div key={index}>
              <StepCard
                step={step}
                index={index}
                isRevealed={index < revealedCount}
                isNext={index === revealedCount}
                onReveal={handleReveal}
                totalSteps={steps.length}
                onVenuesUpdate={onVenuesUpdate}
                handleSwapVenue={handleSwapVenue}
                isSwapping={isSwapping}
              />
              {/* Travel time between this venue and the next */}
              {index < steps.length - 1 && index < revealedCount && index + 1 < revealedCount && (
                <TravelInfo from={steps[index]} to={steps[index + 1]} />
              )}
            </div>
          ))}
        </div>

        {/* AI Edit Bar */}
        {onVenuesUpdate && steps.length > 0 && (
          <div className="mt-4 p-4 rounded-2xl border border-border bg-card">
            <div className="flex items-center gap-2 mb-2.5">
              <MessageSquare className="w-4 h-4 text-primary" />
              <span className="text-xs font-semibold text-foreground">Edit Plan with AI</span>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={aiEditInput}
                onChange={(e) => setAiEditInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleAIEdit() } }}
                placeholder="e.g. Find closer venues, cheaper options, add a rooftop bar..."
                className="flex-1 px-3 py-2.5 rounded-xl bg-muted border border-border text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/40 text-xs transition-all"
                disabled={isAIEditing}
              />
              <button
                onClick={handleAIEdit}
                disabled={!aiEditInput.trim() || isAIEditing}
                className="px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-40 flex items-center gap-1.5"
              >
                {isAIEditing ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <SendHorizontal className="w-3.5 h-3.5" />
                )}
                {isAIEditing ? "Updating..." : "Update"}
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5 mt-2">
              {["Find closer venues", "Cheaper options", "More romantic", "Add a rooftop spot"].map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => setAiEditInput(suggestion)}
                  className="text-[10px] px-2 py-0.5 rounded-full bg-muted/80 text-muted-foreground font-medium hover:bg-primary/10 hover:text-primary transition-colors"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Send to Partner */}
        {allRevealed && (
          <div className="mt-6 p-5 rounded-2xl bg-linear-to-br from-primary/10 via-primary/5 to-accent/10 border border-primary/20">
            <div className="text-center mb-4">
              <Heart className="w-7 h-7 text-primary mx-auto mb-2" />
              <h3 className="font-bold text-base text-foreground mb-1">Your Night is Set!</h3>
              <p className="text-xs text-muted-foreground">Send the full itinerary to your partner so they know the plan.</p>
            </div>

            <div className="flex flex-col gap-2">
              <button
                onClick={() => setIsShareOpen(true)}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 active:scale-[0.98] transition-all shadow-md shadow-primary/20"
              >
                <MessageCircleHeart className="w-4 h-4" />
                Send to Partner
              </button>
              <button
                onClick={handleCopyItinerary}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-border text-xs font-medium text-muted-foreground hover:text-foreground hover:border-primary/30 transition-all"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? "Copied to Clipboard!" : "Copy Itinerary"}
              </button>
            </div>
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

      {/* Share Modal */}
      <ShareModal
        steps={steps}
        isOpen={isShareOpen}
        onClose={() => setIsShareOpen(false)}
      />
    </div>
  )
}
