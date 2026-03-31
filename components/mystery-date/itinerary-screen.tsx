"use client"

import { useState, useEffect, useRef } from "react"
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
  Link2,
  DollarSign,
  Calculator,
  TrendingDown,
  Users,
  PiggyBank,
  Receipt,
  AlertCircle,
  Info,
  Calendar,
  Cloud,
  CloudRain,
  Sun,
  Map,
  PhoneCall,
  Gift,
  Cake,
  TreePine,
  Ghost,
  Snowflake,
  Flower2,
  Ticket,
  History,
  Archive,
  CalendarDays,
  Trash2
} from "lucide-react"
import { Venue } from "@/lib/venue-search"
import { useAuth } from "@/lib/auth-context"
import { shareItinerary, SavedDate } from "@/lib/db"
import { AIRecommendation } from "@/components/ai/ai-recommendation"
import { LateNightAlert } from "@/components/ui/late-night-alert"
import { AlternativeSuggestion, SameDayOption } from "@/lib/late-night-detector"
import { googleMapsService } from "@/lib/google-maps"

interface Step {
  id: number
  label: string
  time: string
  icon: React.ReactNode
  place: string
  rating: number
  reviewCount: number
  priceRange: string
  address: string
  phone?: string
  website?: string
  imageUrl?: string
  description: string
  highlights: string[]
  coordinates: {
    lat: number
    lng: number
  }
  distance?: number
  hours?: string
  tags: string[]
  capacity?: number
  features: string[]
  vibe?: string
  vibeScore?: number
  vibeTags?: string[]
  aiEnhanced?: boolean
  aiInsights?: {
    bestFor: string[]
    insiderTips: string[]
    photoSpots: string[]
    vibeTags: string[]
  }
  travelTimeToNext?: number
  travelDistanceToNext?: number
  category?: 'drinks' | 'dinner' | 'activity'
  reservationRecommended?: boolean
  distanceToNext?: number
  pricing?: {
    tickets?: number
    food?: number
    drinks?: number
    activities?: number
    packages?: Array<{
      name: string
      price: number
      includes: string[]
    }>
    minimumSpend?: number
    currency?: string
    source?: string
    lastUpdated?: string
  }
  // Enhanced venue fields
  editorialSummary?: string
  photoCount?: number
  photoScore?: number
  reservable?: boolean
  reservationLinks?: { url: string; platform: string }[]
  wheelchairAccessible?: boolean
  parkingAvailable?: boolean
  outdoorSeating?: boolean
  dietaryOptions?: string[]
  crowdLevel?: 'quiet' | 'moderate' | 'busy' | 'packed'
  bestTimes?: string[]
  socialMedia?: { platform: string; url: string }[]
  isOpenAtPlannedTime?: boolean
  verifiedOpen?: boolean
  seasonalFit?: number
  // Event-specific fields (Ticketmaster)
  eventId?: string
  eventDate?: string
  eventTime?: string
  venueName?: string
  ticketUrl?: string
  minPrice?: number
  maxPrice?: number
}

// Calculate travel time between two coordinates
function calculateTravelTime(from: { lat: number; lng: number }, to: { lat: number; lng: number }): { minutes: number; miles: number } {
  // Simple distance calculation (Haversine formula approximation)
  const R = 3959 // Earth's radius in miles
  const dLat = (to.lat - from.lat) * Math.PI / 180
  const dLng = (to.lng - from.lng) * Math.PI / 180
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(from.lat * Math.PI / 180) * Math.cos(to.lat * Math.PI / 180) *
    Math.sin(dLng/2) * Math.sin(dLng/2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
  const distance = R * c
  
  // Estimate travel time (average speed: 25 mph in city, 40 mph highway)
  const avgSpeed = distance < 5 ? 25 : 40
  const minutes = Math.round((distance / avgSpeed) * 60)
  
  return { minutes, miles: Math.round(distance * 10) / 10 }
}

function StarRating({ value, count }: { value: number; count: number }) {
  if (!value || value <= 0) {
    return (
      <div className="flex items-center gap-1.5">
        <span className="text-xs text-muted-foreground">No rating yet</span>
      </div>
    )
  }
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
      {count > 0 && <span className="text-[10px] text-muted-foreground">({count.toLocaleString()})</span>}
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
      <div className="w-full aspect-4/3 sm:aspect-video bg-linear-to-br from-primary/20 to-primary/5 rounded-xl overflow-hidden flex items-center justify-center">
        {fallbackIcons[category] || fallbackIcons.activity}
      </div>
    )
  }

  return (
    <div className="relative w-full aspect-4/3 sm:aspect-video overflow-hidden bg-gray-100">
      <img
        src={src}
        alt={alt}
        className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
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

function ShareModal({ steps, isOpen, onClose, venues, searchCriteria }: { steps: Step[]; isOpen: boolean; onClose: () => void; venues: Venue[]; searchCriteria?: any }) {
  const [copied, setCopied] = useState(false)
  const [linkCopied, setLinkCopied] = useState(false)
  const [shared, setShared] = useState(false)
  const [shareUrl, setShareUrl] = useState<string | null>(null)
  const [shareLoading, setShareLoading] = useState(false)
  const { user } = useAuth()

  useEffect(() => {
    if (!isOpen || shareUrl || shareLoading || !user) return
    setShareLoading(true)

    const plannedDate = searchCriteria?.plannedDate ? new Date(searchCriteria.plannedDate) : new Date()
    const dateData: SavedDate = {
      location: searchCriteria?.location || '',
      budget: searchCriteria?.budget || '$$',
      vibes: searchCriteria?.vibes || [],
      time: searchCriteria?.time || 'prime',
      partySize: searchCriteria?.partySize || 2,
      venues,
      createdAt: Date.now(),
      status: 'planned' as const,
    }

    shareItinerary(user.uid, dateData, plannedDate)
      .then(id => {
        const url = `${window.location.origin}/shared/${id}`
        setShareUrl(url)
      })
      .catch(() => {
        // Fall back to text-only sharing
      })
      .finally(() => setShareLoading(false))
  }, [isOpen, user, venues, searchCriteria, shareUrl, shareLoading])

  // Reset share URL when modal closes
  useEffect(() => {
    if (!isOpen) {
      setShareUrl(null)
      setShareLoading(false)
    }
  }, [isOpen])

  if (!isOpen) return null

  const shareText = formatItineraryForShare(steps)
  const shareTextWithLink = shareUrl ? `${shareText}\n\n🔗 View full plan: ${shareUrl}` : shareText
  const shareTextEncoded = encodeURIComponent(shareTextWithLink)
  const canNativeShare = typeof window !== "undefined" && !!window.navigator?.share

  const handleCopy = async () => {
    await navigator.clipboard.writeText(shareTextWithLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  const handleCopyLink = async () => {
    if (!shareUrl) return
    await navigator.clipboard.writeText(shareUrl)
    setLinkCopied(true)
    setTimeout(() => setLinkCopied(false), 2500)
  }

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        const shareTitle = searchCriteria?.location ? `Date Night in ${searchCriteria.location}` : 'Date Night Plan'
        await navigator.share({
          title: shareTitle,
          text: shareUrl ? undefined : shareTextWithLink,
          ...(shareUrl ? { url: shareUrl } : {}),
        })
        setShared(true)
        setTimeout(() => setShared(false), 2500)
      } catch (e) {
        // user cancelled or not supported
      }
    }
  }

  const handleSMS = () => {
    const smsBody = shareUrl
      ? encodeURIComponent(`Check out our date night plan! 💜\n\n${shareUrl}`)
      : shareTextEncoded
    window.open(`sms:?&body=${smsBody}`, "_blank")
  }

  const handleWhatsApp = () => {
    const waText = shareUrl
      ? encodeURIComponent(`Check out our date night plan! 💜\n\n${shareUrl}`)
      : shareTextEncoded
    window.open(`https://wa.me/?text=${waText}`, "_blank")
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
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

        {/* Share Link */}
        {shareUrl && (
          <div className="px-4 pb-2">
            <button
              onClick={handleCopyLink}
              className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl bg-primary/5 border border-primary/20 hover:bg-primary/10 transition-colors"
            >
              <Link2 className="w-4 h-4 text-primary shrink-0" />
              <span className="text-xs text-primary truncate flex-1 text-left">{shareUrl}</span>
              {linkCopied ? <Check className="w-4 h-4 text-primary shrink-0" /> : <Copy className="w-4 h-4 text-primary/60 shrink-0" />}
            </button>
            {linkCopied && <p className="text-[10px] text-primary text-center mt-1">Link copied!</p>}
          </div>
        )}
        {shareLoading && (
          <div className="px-4 pb-2 flex items-center justify-center gap-2">
            <div className="w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <span className="text-[10px] text-muted-foreground">Creating shareable link...</span>
          </div>
        )}

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
              <span className="text-[10px] font-medium text-muted-foreground">{copied ? "Copied!" : "Copy All"}</span>
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
          <div className="relative flex-1 mt-2 flex flex-col items-center">
            <div className={`w-px flex-1 ${isRevealed ? color.dot + "/30" : "bg-border"}`} style={{ minHeight: "2rem" }} />
            {isRevealed && (isLoadingTravelTimes ? (
              <div className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 ${color.bg} ${color.text} text-[10px] font-medium px-2 py-1 rounded-full border ${color.border} flex items-center gap-1 shadow-sm`}>
                <RefreshCw className="w-2.5 h-2.5 animate-spin" />
                Loading...
              </div>
            ) : step.travelTimeToNext ? (
              <div className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 ${color.bg} ${color.text} text-[10px] font-medium px-2 py-1 rounded-full border ${color.border} flex items-center gap-1 shadow-sm`}>
                <Navigation className="w-2.5 h-2.5" />
                {step.travelTimeToNext} min
                {step.distanceToNext && (
                  <span className="opacity-75">· {step.distanceToNext} mi</span>
                )}
              </div>
            ) : null)}
          </div>
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
              <VenueImage src={step.imageUrl} alt={step.place} category={step.category || 'activity'} />
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
                    {step.tags?.[0]}
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

              {/* Event Info (Ticketmaster) */}
              {step.eventId && (
                <div className="space-y-2 p-2.5 rounded-lg bg-violet-500/5 border border-violet-500/15">
                  <div className="flex items-center gap-2 text-xs">
                    <Ticket className="w-3.5 h-3.5 text-violet-500" />
                    <span className="font-semibold text-violet-600 dark:text-violet-400">Live Event</span>
                  </div>
                  {step.eventDate && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Calendar className="w-3.5 h-3.5 shrink-0 text-violet-500/60" />
                      <span>
                        {new Date(step.eventDate + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                        {step.eventTime && ` at ${new Date('2000-01-01T' + step.eventTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`}
                      </span>
                    </div>
                  )}
                  {step.venueName && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <MapPin className="w-3.5 h-3.5 shrink-0 text-violet-500/60" />
                      <span>{step.venueName}</span>
                    </div>
                  )}
                  {(step.minPrice !== undefined && step.minPrice > 0) && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Receipt className="w-3.5 h-3.5 shrink-0 text-violet-500/60" />
                      <span>
                        Tickets from <span className="font-medium text-foreground">${step.minPrice}</span>
                        {step.maxPrice && step.maxPrice > step.minPrice && <span> – ${step.maxPrice}</span>}
                      </span>
                    </div>
                  )}
                  {step.ticketUrl && (
                    <a href={step.ticketUrl} target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-[11px] px-3 py-1.5 rounded-md bg-violet-500 text-white font-medium hover:bg-violet-600 transition-colors">
                      <Ticket className="w-3 h-3" />
                      Get Tickets
                    </a>
                  )}
                </div>
              )}

              {/* Crowd Level & Best Times */}
              {step.crowdLevel && (
                <div className="flex items-center gap-2 text-xs">
                  <Users className="w-3.5 h-3.5 text-primary/60" />
                  <span className="text-muted-foreground">
                    Expected: <span className="font-medium text-foreground capitalize">{step.crowdLevel}</span>
                  </span>
                  {step.bestTimes && step.bestTimes.length > 0 && (
                    <span className="text-muted-foreground/70 text-[10px]">
                      &middot; Best: {step.bestTimes[0]}
                    </span>
                  )}
                </div>
              )}

              {/* Dietary Options */}
              {step.dietaryOptions && step.dietaryOptions.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {step.dietaryOptions.map((d, i) => (
                    <span key={i} className="text-[10px] px-2 py-0.5 rounded-md bg-green-500/10 text-green-700 dark:text-green-400 font-medium capitalize">
                      {d}
                    </span>
                  ))}
                </div>
              )}

              {/* Open Status */}
              {step.verifiedOpen !== undefined && (
                <div className="flex items-center gap-1.5 text-xs">
                  <div className={`w-2 h-2 rounded-full ${step.verifiedOpen ? 'bg-green-500' : 'bg-red-500'}`} />
                  <span className={step.verifiedOpen ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
                    {step.verifiedOpen ? 'Verified open at planned time' : 'May be closed at planned time'}
                  </span>
                </div>
              )}

              {/* Reservation Badge + Links */}
              {step.reservationRecommended && <ReservationBadge />}
              {step.reservationLinks && step.reservationLinks.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {step.reservationLinks.filter(l => l.platform !== 'Google Maps').slice(0, 3).map((link, i) => (
                    <a key={i} href={link.url} target="_blank" rel="noopener noreferrer"
                      className="text-[10px] px-2 py-0.5 rounded-md bg-primary/10 text-primary font-medium hover:bg-primary/20 transition-colors">
                      {link.platform}
                    </a>
                  ))}
                </div>
              )}

              {/* Social Media */}
              {step.socialMedia && step.socialMedia.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {step.socialMedia.slice(0, 3).map((sm, i) => (
                    <a key={i} href={sm.url.startsWith('http') ? sm.url : `https://${sm.url}`} target="_blank" rel="noopener noreferrer"
                      className="text-[10px] px-2 py-0.5 rounded-md bg-muted/80 text-muted-foreground font-medium hover:text-foreground transition-colors">
                      {sm.platform}
                    </a>
                  ))}
                </div>
              )}

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

                {/* Accessibility */}
                {(step.wheelchairAccessible || step.parkingAvailable) && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Info className="w-3.5 h-3.5 shrink-0 text-primary/60" />
                    <span>
                      {[step.wheelchairAccessible && 'Wheelchair accessible', step.parkingAvailable && 'Parking available'].filter(Boolean).join(' · ')}
                    </span>
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
  lateNightResponse?: any
}

// Budget calculation interfaces
interface VenueCost {
  venue: Step
  foodCost: number
  drinkCost: number
  activityCost: number
  ticketCost: number
  totalCost: number
  costPerPerson: number
}

interface BudgetBreakdown {
  totalCost: number
  costPerPerson: number
  venues: VenueCost[]
  savings: string[]
  alternatives: { venue: Step; savings: number; alternative: string }[]
}

interface DatePlanHistory {
  id: string
  date: Date
  location: string
  budget: string
  vibes: string[]
  venues: Venue[]
  totalCost?: number
  partySize?: number
  notes?: string
  rating?: number
  favorite?: boolean
}

// Budget calculation functions
function calculateBudgetBreakdown(steps: Step[], partySize: number): BudgetBreakdown {
  const venues: VenueCost[] = []
  let totalCost = 0
  
  steps.forEach(step => {
    let foodCost = 0
    let drinkCost = 0
    let activityCost = 0
    let ticketCost = 0
    
    // Use real pricing data if available, otherwise fall back to estimates
    if (step.pricing) {
      const pricing = step.pricing
      
      // Use real pricing data
      foodCost = (pricing.food || 0) * partySize
      drinkCost = (pricing.drinks || 0) * partySize
      activityCost = (pricing.activities || 0) * partySize
      ticketCost = (pricing.tickets || 0) * partySize
      
      // If no specific pricing, use price range estimates
      if (!pricing.food && !pricing.drinks && !pricing.activities && !pricing.tickets) {
        const priceMultiplier = getPriceMultiplier(step.priceRange)
        
        if (step.category === 'dinner') {
          foodCost = 25 * priceMultiplier * partySize
          drinkCost = 8 * priceMultiplier * partySize
        } else if (step.category === 'drinks') {
          drinkCost = 12 * priceMultiplier * partySize
          foodCost = 10 * priceMultiplier * partySize // appetizers
        } else if (step.category === 'activity') {
          // For activities, entry fees are treated as tickets, not activity costs
          ticketCost = 30 * priceMultiplier * partySize
          drinkCost = 5 * priceMultiplier * partySize
          foodCost = 8 * priceMultiplier * partySize // snacks
        }
      }
    } else {
      // Fall back to estimates for venues without pricing data
      const priceMultiplier = getPriceMultiplier(step.priceRange)
      
      if (step.category === 'dinner') {
        foodCost = 25 * priceMultiplier * partySize
        drinkCost = 8 * priceMultiplier * partySize
      } else if (step.category === 'drinks') {
        drinkCost = 12 * priceMultiplier * partySize
        foodCost = 10 * priceMultiplier * partySize // appetizers
      } else if (step.category === 'activity') {
          // For activities, entry fees are treated as tickets, not activity costs
          ticketCost = 30 * priceMultiplier * partySize
          drinkCost = 5 * priceMultiplier * partySize
          foodCost = 8 * priceMultiplier * partySize // snacks
      }
    }
    
    const venueTotal = foodCost + drinkCost + activityCost + ticketCost
    totalCost += venueTotal
    
    venues.push({
      venue: step,
      foodCost,
      drinkCost,
      activityCost,
      ticketCost,
      totalCost: venueTotal,
      costPerPerson: venueTotal / partySize
    })
  })
  
  return {
    totalCost,
    costPerPerson: totalCost / partySize,
    venues,
    savings: generateMoneySavingTips(steps),
    alternatives: generateAlternatives(steps, partySize)
  }
}

function getPriceMultiplier(priceRange: string): number {
  const multipliers = { '$': 0.7, '$$': 1.0, '$$$': 1.8, '$$$$': 3.0 }
  return multipliers[priceRange as keyof typeof multipliers] || 1.0
}

function generateMoneySavingTips(steps: Step[]): string[] {
  const tips = []
  
  // Check for expensive venues
  const expensiveVenues = steps.filter(s => s.priceRange === '$$$' || s.priceRange === '$$$$')
  if (expensiveVenues.length > 0) {
    tips.push(`Consider visiting ${expensiveVenues[0].place} during happy hour for 20-30% savings`)
  }
  
  // Check for activities
  const activities = steps.filter(s => s.category === 'activity')
  if (activities.length > 0) {
    tips.push(`Look for Groupon or LivingSocial deals for ${activities[0].place} to save 15-25%`)
  }
  
  // General tips
  tips.push('Split appetizers and desserts to reduce costs')
  tips.push('Check for early bird specials (usually 5-6 PM)')
  tips.push('Consider lunch dates for better prices at dinner venues')
  
  if (steps.length >= 2) {
    tips.push('Walk between nearby venues to save on transportation costs')
  }
  
  return tips.slice(0, 4) // Return top 4 tips
}

function generateAlternatives(steps: Step[], partySize: number): { venue: Step; savings: number; alternative: string }[] {
  const alternatives: { venue: Step; savings: number; alternative: string }[] = []
  
  steps.forEach(step => {
    if (step.priceRange === '$$$$') {
      alternatives.push({
        venue: step,
        savings: 30 * partySize,
        alternative: 'Find a similar upscale venue with lunch pricing'
      })
    } else if (step.category === 'activity') {
      alternatives.push({
        venue: step,
        savings: 15 * partySize,
        alternative: 'Look for free outdoor activities or happy hour specials'
      })
    } else if (step.category === 'drinks') {
      alternatives.push({
        venue: step,
        savings: 20 * partySize,
        alternative: 'Try venues with happy hour specials or drink specials'
      })
    }
  })
  
  return alternatives.slice(0, 3) // Return top 3 alternatives
}

// Calendar and Weather functions
function generateCalendarEvents(steps: Step[], date: Date, travelTimes: any[], startTime: string = '19:00', includeTravelTime: boolean = true, notes: string = '', reminders: boolean = true): any[] {
  const events: any[] = []
  let currentTime = new Date(date)
  
  // Parse start time (format: "19:00")
  const [hours, minutes] = startTime.split(':').map(Number)
  currentTime.setHours(hours, minutes || 0, 0, 0)

  steps.forEach((step, index) => {
    const eventDescription = `Date night stop ${index + 1}. ${step.description}${notes ? '\n\n' + notes : ''}`
    
    const event = {
      title: `${step.label}: ${step.place}`,
      start: new Date(currentTime),
      end: new Date(currentTime.getTime() + 90 * 60 * 1000), // 1.5 hours per venue
      location: step.address,
      description: eventDescription,
      category: step.category,
      reminder: reminders ? { method: 'popup', minutes: 30 } : undefined
    }
    events.push(event)

    // Add travel time to next venue
    if (index < steps.length - 1 && includeTravelTime && travelTimes[index]) {
      currentTime = new Date(currentTime.getTime() + (90 + travelTimes[index]) * 60 * 1000)
    } else {
      currentTime = new Date(currentTime.getTime() + 90 * 60 * 1000)
    }
  })

  return events
}

async function fetchWeather(location: string): Promise<any> {
  try {
    // This is a mock weather API call - in production, you'd use a real weather API
    const mockWeather = {
      temperature: 72,
      condition: 'partly-cloudy',
      humidity: 65,
      windSpeed: 8,
      precipitation: 0,
      forecast: 'Partly cloudy with a high of 75°F and low of 62°F'
    }
    return mockWeather
  } catch (error) {
    return null
  }
}

function getWeatherRecommendation(weather: any, steps: Step[]): string[] {
  const recommendations = []
  
  if (!weather) {
    return ['Weather data unavailable - plan for both indoor and outdoor options']
  }

  if (weather.precipitation > 0) {
    recommendations.push('Rain expected - prioritize indoor venues with covered areas')
    steps.forEach(step => {
      if (step.category === 'activity') {
        recommendations.push(`Consider indoor alternatives for ${step.place}`)
      }
    })
  } else if (weather.temperature > 80) {
    recommendations.push('Hot weather expected - look for venues with AC or outdoor shade')
    recommendations.push('Great weather for outdoor dining or rooftop bars!')
  } else if (weather.temperature < 50) {
    recommendations.push('Cool weather expected - cozy indoor venues recommended')
    recommendations.push('Perfect weather for intimate indoor dining')
  } else {
    recommendations.push('Pleasant weather expected - great for any venue type!')
    if (steps.some(s => s.category === 'activity')) {
      recommendations.push('Perfect weather for outdoor activities')
    }
  }

  return recommendations
}

function generateReservationLinks(steps: Step[]): { venue: Step; link: string; type: string }[] {
  const reservationLinks: { venue: Step; link: string; type: string }[] = []

  steps.forEach(step => {
    let link = ''
    let type = ''

    if (step.category === 'dinner') {
      link = `https://www.opentable.com/search?q=${encodeURIComponent(step.place + ' ' + step.address)}`
      type = 'OpenTable Reservation'
    } else if (step.category === 'drinks') {
      link = `https://www.yelp.com/search?find_desc=${encodeURIComponent(step.place)}&find_loc=${encodeURIComponent(step.address)}`
      type = 'Yelp Booking'
    } else if (step.category === 'activity') {
      link = `https://www.google.com/search?q=${encodeURIComponent(step.place + ' booking ' + step.address)}`
      type = 'Google Booking'
    }

    if (link) {
      reservationLinks.push({ venue: step, link, type })
    }
  })

  return reservationLinks
}

function createGoogleCalendarUrl(events: any[]): string {
  const baseUrl = 'https://calendar.google.com/calendar/render'
  const params = new URLSearchParams()
  
  events.forEach((event, index) => {
    const startDate = event.start.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
    const endDate = event.end.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
    
    params.append(`text${index}`, event.title)
    params.append(`dates${index}`, `${startDate}/${endDate}`)
    params.append(`location${index}`, event.location)
    params.append(`details${index}`, event.description)
  })

  return `${baseUrl}?${params.toString()}`
}

function createAppleCalendarUrl(events: any[]): string {
  const icsContent = events.map(event => {
    const formatDate = (date: Date) => {
      return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '') + 'Z'
    }

    return `BEGIN:VEVENT
SUMMARY:${event.title}
DTSTART:${formatDate(event.start)}
DTEND:${formatDate(event.end)}
LOCATION:${event.location}
DESCRIPTION:${event.description}
END:VEVENT`
  }).join('\n')

  const fullIcs = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Date Night App//Date Night//EN
${icsContent}
END:VCALENDAR`

  return `data:text/calendar;charset=utf8,${encodeURIComponent(fullIcs)}`
}

export function ItineraryScreen({ onReset, venues, searchCriteria, onVenuesUpdate, lateNightResponse }: ItineraryScreenProps) {
  const [revealedCount, setRevealedCount] = useState(0)
  const [copied, setCopied] = useState(false)
  const [steps, setSteps] = useState<Step[]>([])
  const [isSwapping, setIsSwapping] = useState<number | null>(null)
  const [isImproving, setIsImproving] = useState(false)
  const pricingFetchedRef = useRef(false)
  const venueIdsRef = useRef<string>("")
  const [isShareOpen, setIsShareOpen] = useState(false)
  const [swapRequest, setSwapRequest] = useState<string>('')
  const [showSwapDialog, setShowSwapDialog] = useState<number | null>(null)
  const [showBudgetCalculator, setShowBudgetCalculator] = useState(false)
  const [partySize, setPartySize] = useState(2)
  const [splitType, setSplitType] = useState<'equal' | 'custom'>('equal')
  const [showCalendarDialog, setShowCalendarDialog] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [weather, setWeather] = useState<any>(null)
  const [calendarEvents, setCalendarEvents] = useState<any[]>([])
  const [showSpecialOccasions, setShowSpecialOccasions] = useState(false)
  const [startTime, setStartTime] = useState('19:00') // 7 PM default
  const [reminders, setReminders] = useState<boolean>(true)
  const [includeTravelTime, setIncludeTravelTime] = useState<boolean>(true)
  const [calendarNotes, setCalendarNotes] = useState('')
  const [showHistory, setShowHistory] = useState(false)
  const [datePlanHistory, setDatePlanHistory] = useState<DatePlanHistory[]>([])
  const [showLateNightAlert, setShowLateNightAlert] = useState(true)
  const [isGeneratingAlternative, setIsGeneratingAlternative] = useState(false)
  const [isLoadingTravelTimes, setIsLoadingTravelTimes] = useState(false)
  const { signOut } = useAuth()

  // Scroll to top when any modal opens
  useEffect(() => {
    if (showHistory || showSpecialOccasions || showCalendarDialog || showBudgetCalculator) {
      // Small delay to ensure modal is rendered
      setTimeout(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' })
      }, 50)
    }
  }, [showHistory, showSpecialOccasions, showCalendarDialog, showBudgetCalculator])

  // Fetch real travel times using Google Maps API
  const fetchTravelTimes = async (venueSteps: Step[]) => {
    if (venueSteps.length < 2) return venueSteps

    setIsLoadingTravelTimes(true)
    const updatedSteps = [...venueSteps]

    try {
      for (let i = 0; i < venueSteps.length - 1; i++) {
        const from = venueSteps[i]
        const to = venueSteps[i + 1]

        if (from.coordinates && to.coordinates) {
          const travelInfo = await googleMapsService.getDirections(
            from.coordinates,
            to.coordinates,
            'driving'
          )

          if (travelInfo) {
            const formatted = googleMapsService.formatTravelInfo(travelInfo)
            updatedSteps[i] = {
              ...updatedSteps[i],
              travelTimeToNext: formatted.minutes,
              travelDistanceToNext: formatted.miles,
              distanceToNext: formatted.miles
            }
          }
        }
      }

      setSteps(updatedSteps)
    } catch (error) {
      console.error('Error fetching travel times:', error)
    } finally {
      setIsLoadingTravelTimes(false)
    }

    return updatedSteps
  }

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
      }
    }
  }, [])

  // Save current plan to history with date-based deduplication
  const saveToHistory = () => {
    if (!searchCriteria || !venues || venues.length === 0) return

    const planDate = selectedDate // Use the selected date from calendar
    const planDateString = planDate.toDateString() // e.g., "Mon Mar 29 2026"
    
    // Check if there's already a plan for the selected date
    const existingPlanIndex = datePlanHistory.findIndex(item => 
      new Date(item.date).toDateString() === planDateString
    )

    const newHistoryItem: DatePlanHistory = {
      id: existingPlanIndex !== -1 ? datePlanHistory[existingPlanIndex].id : Date.now().toString(),
      date: planDate,
      location: searchCriteria.location,
      budget: searchCriteria.budget,
      vibes: searchCriteria.vibes,
      venues: venues,
      partySize: searchCriteria.partySize,
      totalCost: calculateBudgetBreakdown(steps, searchCriteria.partySize).totalCost
    }

    let updatedHistory: DatePlanHistory[]
    
    if (existingPlanIndex !== -1) {
      // Update existing plan for the selected date
      updatedHistory = [...datePlanHistory]
      updatedHistory[existingPlanIndex] = newHistoryItem
    } else {
      // Add new plan for different date
      updatedHistory = [newHistoryItem, ...datePlanHistory].slice(0, 20) // Keep last 20 plans
    }

    setDatePlanHistory(updatedHistory)
    localStorage.setItem('datePlanHistory', JSON.stringify(updatedHistory))
  }

  // Delete history item
  const deleteHistoryItem = (id: string) => {
    const updatedHistory = datePlanHistory.filter(item => item.id !== id)
    setDatePlanHistory(updatedHistory)
    localStorage.setItem('datePlanHistory', JSON.stringify(updatedHistory))
  }

  // Late night alert handlers
  const handleSuggestionSelect = async (suggestion: AlternativeSuggestion) => {
    
    try {
      setIsGeneratingAlternative(true)
      
      // Generate new search criteria based on the suggestion
      const newCriteria = generateCriteriaFromSuggestion(suggestion, searchCriteria)
      
      if (newCriteria) {
        
        // Navigate back to setup with pre-filled criteria for a real search
        setShowLateNightAlert(false)
        
        // Store the new criteria in session storage for the setup screen to use
        sessionStorage.setItem('alternativeSearchCriteria', JSON.stringify(newCriteria))
        
        // Navigate back to setup screen to trigger a real search
        onReset()
      }
    } catch (error) {
      alert('Sorry, something went wrong generating that plan. Please try again.')
    } finally {
      setIsGeneratingAlternative(false)
    }
  }

  const handleSameDaySelect = async (option: SameDayOption) => {
    try {
      setIsGeneratingAlternative(true)

      const sameDayCriteria = generateCriteriaFromSameDayOption(option, searchCriteria)

      if (sameDayCriteria) {
        setShowLateNightAlert(false)
        sessionStorage.setItem('alternativeSearchCriteria', JSON.stringify(sameDayCriteria))
        onReset()
      } else {
        // Option doesn't require a new search (e.g. streaming) — just dismiss the alert
        setShowLateNightAlert(false)
      }
    } catch (error) {
      alert('Sorry, something went wrong creating that plan. Please try again.')
    } finally {
      setIsGeneratingAlternative(false)
    }
  }

  const handleDismissAlert = () => {
    setShowLateNightAlert(false)
  }

  // Helper functions for alternative suggestions
  const generateCriteriaFromSuggestion = (suggestion: AlternativeSuggestion, originalCriteria: any): any => {
    if (!originalCriteria) return null

    const newCriteria = { ...originalCriteria }

    switch (suggestion.id) {
      case 'immediate-delivery':
        // Search for restaurants that do takeout/delivery — keep user's cuisine preference
        newCriteria.time = 'late'
        newCriteria.vibes = ['chill', 'romantic']
        newCriteria.customRequests = 'restaurants with takeout or delivery available late night'
        break
      case 'immediate-late-night':
        newCriteria.time = 'late'
        newCriteria.vibes = ['chill', 'adventurous']
        newCriteria.customRequests = 'venues open late night, bars and lounges open past 10pm'
        break
      case 'tomorrow-planned': {
        const tomorrow = new Date()
        tomorrow.setDate(tomorrow.getDate() + 1)
        newCriteria.plannedDate = new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate(), 0, 0, 0, 0)
        newCriteria.dayOfWeek = newCriteria.plannedDate.toLocaleDateString('en-US', { weekday: 'long' })
        newCriteria.time = 'prime'
        break
      }
      case 'tomorrow-lunch': {
        const tomorrowLunch = new Date()
        tomorrowLunch.setDate(tomorrowLunch.getDate() + 1)
        newCriteria.plannedDate = new Date(tomorrowLunch.getFullYear(), tomorrowLunch.getMonth(), tomorrowLunch.getDate(), 0, 0, 0, 0)
        newCriteria.dayOfWeek = newCriteria.plannedDate.toLocaleDateString('en-US', { weekday: 'long' })
        newCriteria.time = 'early'
        break
      }
      case 'weekend-extended': {
        const nextWeekend = new Date()
        const daysUntilSaturday = (6 - nextWeekend.getDay() + 7) % 7 || 7
        nextWeekend.setDate(nextWeekend.getDate() + daysUntilSaturday)
        newCriteria.plannedDate = new Date(nextWeekend.getFullYear(), nextWeekend.getMonth(), nextWeekend.getDate(), 0, 0, 0, 0)
        newCriteria.dayOfWeek = newCriteria.plannedDate.toLocaleDateString('en-US', { weekday: 'long' })
        newCriteria.time = 'prime'
        break
      }
      default:
        break
    }

    return newCriteria
  }

  const generateCriteriaFromSameDayOption = (option: SameDayOption, originalCriteria: any): any => {
    if (!originalCriteria) return null

    const newCriteria = { ...originalCriteria }

    switch (option.type) {
      case 'delivery':
        // Search for real restaurants with takeout in the area
        newCriteria.time = 'late'
        newCriteria.customRequests = 'restaurants with delivery or takeout available tonight'
        break
      case 'streaming':
        // Not a venue search — just dismiss the alert and keep current plan
        return null
      case 'outdoor':
        newCriteria.time = 'early'
        newCriteria.activity = 'outdoor'
        newCriteria.vibes = ['adventurous', 'romantic']
        break
      case 'quick_venue':
        newCriteria.time = 'late'
        newCriteria.cuisine = 'any'
        newCriteria.customRequests = 'dessert bars, ice cream shops, late night cafes open now'
        break
      default:
        break
    }

    return newCriteria
  }

  // Calendar export functions
  const exportToGoogleCalendar = () => {
    const events = generateCalendarEvents(steps, selectedDate, steps.map((step, index) => step.travelTimeToNext || 10), startTime, includeTravelTime, calendarNotes, reminders)
    
    events.forEach((event, index) => {
      const startDate = new Date(event.startTime)
      const endDate = new Date(event.endTime)
      
      // Format dates for Google Calendar URL
      const formatDate = (date: Date) => {
        return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
      }
      
      const startTimeStr = formatDate(startDate)
      const endTimeStr = formatDate(endDate)
      
      // Create Google Calendar URL
      const details = event.description.replace(/\n/g, '\\n')
      const googleCalendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(event.title)}&dates=${startTimeStr}/${endTimeStr}&details=${encodeURIComponent(details)}&location=${encodeURIComponent(event.location)}`
      
      // Open in new tab
      window.open(googleCalendarUrl, '_blank')
    })
  }

  const exportToICalendar = () => {
    const events = generateCalendarEvents(steps, selectedDate, steps.map((step, index) => step.travelTimeToNext || 10), startTime, includeTravelTime, calendarNotes, reminders)
    
    // Generate iCalendar content
    let icalContent = 'BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//Date Night Planner//Date Night//EN\nCALSCALE:GREGORIAN\n'
    
    events.forEach((event) => {
      const startDate = new Date(event.startTime)
      const endDate = new Date(event.endTime)
      
      // Format dates for iCalendar
      const formatDate = (date: Date) => {
        return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '') + 'Z'
      }
      
      const startTimeStr = formatDate(startDate)
      const endTimeStr = formatDate(endDate)
      
      // Escape special characters
      const escapeText = (text: string) => {
        return text.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n')
      }
      
      icalContent += `BEGIN:VEVENT\n`
      icalContent += `UID:${event.id}@datenight.app\n`
      icalContent += `DTSTART:${startTimeStr}\n`
      icalContent += `DTEND:${endTimeStr}\n`
      icalContent += `SUMMARY:${escapeText(event.title)}\n`
      icalContent += `DESCRIPTION:${escapeText(event.description)}\n`
      icalContent += `LOCATION:${escapeText(event.location)}\n`
      icalContent += `END:VEVENT\n`
    })
    
    icalContent += 'END:VCALENDAR'
    
    // Create and download file
    const blob = new Blob([icalContent], { type: 'text/calendar;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `date-night-${selectedDate.toISOString().split('T')[0]}.ics`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const exportToOutlook = () => {
    const events = generateCalendarEvents(steps, selectedDate, steps.map((step, index) => step.travelTimeToNext || 10), startTime, includeTravelTime, calendarNotes, reminders)
    
    events.forEach((event) => {
      const startDate = new Date(event.startTime)
      const endDate = new Date(event.endTime)
      
      // Format dates for Outlook URL
      const formatDate = (date: Date) => {
        return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
      }
      
      const startTimeStr = formatDate(startDate)
      const endTimeStr = formatDate(endDate)
      
      // Create Outlook Calendar URL
      const details = event.description.replace(/\n/g, '%0A')
      const outlookUrl = `https://outlook.live.com/calendar/0/deeplink/compose?subject=${encodeURIComponent(event.title)}&startdt=${startTimeStr}&enddt=${endTimeStr}&body=${encodeURIComponent(details)}&location=${encodeURIComponent(event.location)}`
      
      // Open in new tab
      window.open(outlookUrl, '_blank')
    })
  }

  // Toggle favorite
  const toggleFavorite = (id: string) => {
    const updatedHistory = datePlanHistory.map(item =>
      item.id === id ? { ...item, favorite: !item.favorite } : item
    )
    setDatePlanHistory(updatedHistory)
    localStorage.setItem('datePlanHistory', JSON.stringify(updatedHistory))
  }

  // Fetch weather when calendar dialog opens
  useEffect(() => {
    if (showCalendarDialog && searchCriteria?.location) {
      fetchWeather(searchCriteria.location).then(setWeather)
    }
  }, [showCalendarDialog, searchCriteria])

  // Generate calendar events when date, steps, or options change
  useEffect(() => {
    if (steps.length > 0) {
      const travelTimes = steps.map((step, index) => step.travelTimeToNext || 10)
      const events = generateCalendarEvents(steps, selectedDate, travelTimes, startTime, includeTravelTime, calendarNotes, reminders)
      setCalendarEvents(events)
    }
  }, [steps, selectedDate, startTime, includeTravelTime, calendarNotes, reminders])

  useEffect(() => {
    if (!venues || venues.length === 0) {
      setSteps([])
      pricingFetchedRef.current = false
      venueIdsRef.current = ""
      return
    }

    // Track venue identity to reset pricing fetch when venues actually change
    const currentVenueIds = venues.map(v => v.name + v.address).join("|")
    const venuesChanged = currentVenueIds !== venueIdsRef.current
    if (venuesChanged) {
      venueIdsRef.current = currentVenueIds
      pricingFetchedRef.current = false
    }

    // Time slots based on user's time preference and venue order
    const timeSlots: Record<string, Record<string, string[]>> = {
      early: { activity: ["5:00 PM", "5:30 PM", "6:00 PM"], dinner: ["6:30 PM", "7:00 PM", "7:30 PM"], drinks: ["8:00 PM", "8:30 PM", "9:00 PM"] },
      prime: { activity: ["6:30 PM", "7:00 PM", "7:30 PM"], dinner: ["8:00 PM", "8:30 PM", "9:00 PM"], drinks: ["9:30 PM", "10:00 PM", "10:30 PM"] },
      late:  { activity: ["8:30 PM", "9:00 PM", "9:30 PM"], dinner: ["10:00 PM", "10:30 PM", "11:00 PM"], drinks: ["11:00 PM", "11:30 PM", "12:00 AM"] }
    }
    const timePref = searchCriteria?.time || 'prime'
    const slots = timeSlots[timePref] || timeSlots.prime
    const categoryCounters: Record<string, number> = { activity: 0, dinner: 0, drinks: 0 }

    const convertedSteps: Step[] = venues.map((venue, index) => {
      const cat = venue.category || 'activity'
      const catSlots = slots[cat] || slots.activity
      const slotIndex = Math.min(categoryCounters[cat] || 0, catSlots.length - 1)
      categoryCounters[cat] = (categoryCounters[cat] || 0) + 1
      // For sequential venues, offset by step position if same category exhausted
      const assignedTime = index === 0 ? catSlots[0] : catSlots[slotIndex] || catSlots[0]

      const step = {
        id: index + 1,
        label: venue.category === "drinks" ? "Drinks" : venue.category === "dinner" ? "Dinner" : "Activity",
        time: assignedTime,
        icon: venue.category === "drinks" ? <Wine className="w-5 h-5" /> : venue.category === "dinner" ? <UtensilsCrossed className="w-5 h-5" /> : <Sparkles className="w-5 h-5" />,
        place: venue.name,
        rating: venue.combinedRating || venue.rating,
        reviewCount: venue.reviewCount,
        priceRange: venue.priceRange,
        tag: venue.category === "drinks" ? "Cocktails" : venue.category === "dinner" ? "Dining" : "Experience",
        description: venue.editorialSummary || venue.description,
        highlights: venue.highlights,
        address: venue.address,
        phone: venue.phone || "Phone not available",
        category: venue.category,
        imageUrl: venue.imageUrl,
        website: venue.website,
        hours: venue.hours,
        vibe: venue.vibe,
        vibeScore: venue.vibeScore,
        vibeTags: venue.vibeTags,
        features: venue.features || [],
        tags: venue.tags || [],
        coordinates: venue.coordinates || { lat: 0, lng: 0 },
        pricing: venue.pricing,
        reservationRecommended:
          venue.reservable ||
          venue.category === "dinner" && (venue.priceRange === "$$$" || venue.priceRange === "$$$$") ||
          venue.category === "drinks" && venue.priceRange === "$$$$" ||
          false,
        // Enhanced venue fields
        editorialSummary: venue.editorialSummary,
        photoCount: venue.photoCount,
        photoScore: venue.photoScore,
        reservable: venue.reservable,
        reservationLinks: venue.reservationLinks,
        wheelchairAccessible: venue.wheelchairAccessible,
        parkingAvailable: venue.parkingAvailable,
        outdoorSeating: venue.outdoorSeating,
        dietaryOptions: venue.dietaryOptions,
        crowdLevel: venue.crowdLevel,
        bestTimes: venue.bestTimes,
        socialMedia: venue.socialMedia,
        isOpenAtPlannedTime: venue.isOpenAtPlannedTime,
        verifiedOpen: venue.verifiedOpen,
        seasonalFit: venue.seasonalFit,
        // Event-specific fields
        eventId: venue.eventId,
        eventDate: venue.eventDate,
        eventTime: venue.eventTime,
        venueName: venue.venueName,
        ticketUrl: venue.ticketUrl,
        minPrice: venue.minPrice,
        maxPrice: venue.maxPrice,
      }
      return step
    })

    // Calculate travel times between consecutive venues using Google Maps API
    const stepsWithTravel = convertedSteps.map((step, index) => {
      if (index < convertedSteps.length - 1) {
        const nextStep = convertedSteps[index + 1]
        // Use fallback calculation initially, will be updated by Google Maps API
        const travel = calculateTravelTime(step.coordinates, nextStep.coordinates)
        return {
          ...step,
          travelTimeToNext: travel.minutes,
          distanceToNext: travel.miles
        }
      }
      return step
    })

    setSteps(stepsWithTravel)

    // Fetch real travel times from Google Maps API
    fetchTravelTimes(stepsWithTravel)

    // Only fetch pricing once per set of venues to prevent infinite loop
    if (pricingFetchedRef.current) return
    const venuesMissingPricing = venues.filter(v => !v.pricing || !v.pricing.source)
    if (venuesMissingPricing.length > 0) {
      pricingFetchedRef.current = true
      fetch('/api/ai/enhance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'fetch-pricing',
          venues: venuesMissingPricing.map(v => ({
            name: v.name,
            category: v.category,
            description: v.description,
            address: v.address,
            priceRange: v.priceRange
          }))
        })
      })
        .then(res => res.ok ? res.json() : null)
        .then(result => {
          if (!result?.pricing) return
          let pricingIdx = 0
          const updatedVenues = venues.map(v => {
            if (!v.pricing || !v.pricing.source) {
              const p = result.pricing[pricingIdx++]
              if (p) return { ...v, pricing: { ...p, lastUpdated: new Date().toISOString() } }
            }
            return v
          })
          // Update steps with new pricing data
          const updatedSteps = stepsWithTravel.map((step, i) => ({
            ...step,
            pricing: updatedVenues[i]?.pricing || step.pricing
          }))
          setSteps(updatedSteps)
          // Propagate updated venues to parent
          if (onVenuesUpdate) {
            onVenuesUpdate(updatedVenues)
          }
        })
        .catch(() => { /* fallback to estimate-based pricing */ })
    } else {
      pricingFetchedRef.current = true
    }
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

  const handleSwapVenue = (index: number) => {
    setShowSwapDialog(index)
    setSwapRequest('')
  }

  const executeSwapVenue = async (index: number, customRequest?: string) => {
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
          criteria: { ...searchCriteria, customRequests: customRequest },
          currentPlan: venues,
          swapCategory: venueToSwap.category
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
    } finally {
      setIsSwapping(null)
      setShowSwapDialog(null)
      setSwapRequest('')
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
    } finally {
      setIsAIEditing(false)
    }
  }

  const allRevealed = revealedCount >= steps.length && steps.length > 0

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-background/90 backdrop-blur-md border-b border-border/50">
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
              onClick={() => {
                setShowHistory(true)
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10 text-amber-600 text-xs font-medium hover:bg-amber-500/15 transition-all"
            >
              <History className="w-3.5 h-3.5" />
              History
            </button>
            <button
              onClick={() => {
                setShowSpecialOccasions(true)
              }}
              disabled={steps.length === 0}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-500/10 text-purple-600 text-xs font-medium hover:bg-purple-500/15 transition-all disabled:opacity-40"
            >
              <Gift className="w-3.5 h-3.5" />
              Special
            </button>
            <button
              onClick={() => {
                setShowCalendarDialog(true)
              }}
              disabled={steps.length === 0}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-500/10 text-blue-600 text-xs font-medium hover:bg-blue-500/15 transition-all disabled:opacity-40"
            >
              <Calendar className="w-3.5 h-3.5" />
              {selectedDate.toDateString() === new Date().toDateString() ? 'Calendar' : selectedDate.toLocaleDateString()}
            </button>
            <button
              onClick={() => {
                setShowBudgetCalculator(true)
              }}
              disabled={steps.length === 0}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-500/10 text-green-600 text-xs font-medium hover:bg-green-500/15 transition-all disabled:opacity-40"
            >
              <Calculator className="w-3.5 h-3.5" />
              Budget
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

      {/* Late Night Alert */}
      {lateNightResponse && showLateNightAlert && (
        <div className="mx-auto px-4 md:px-12 py-4">
          <LateNightAlert
            response={lateNightResponse}
            onSuggestionSelect={handleSuggestionSelect}
            onSameDaySelect={handleSameDaySelect}
            onDismiss={handleDismissAlert}
            isGenerating={isGeneratingAlternative}
          />
        </div>
      )}

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


      {/* Swap Venue Dialog */}
      {showSwapDialog !== null && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-9999 p-4">
          <div className="bg-background rounded-2xl border p-6 max-w-md w-full">
            <h3 className="font-semibold text-lg mb-2">Swap {steps[showSwapDialog]?.label}</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Replace "{steps[showSwapDialog]?.place}" with something else?
            </p>
            
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">
                  What would you like instead? (optional)
                </label>
                <textarea
                  value={swapRequest}
                  onChange={(e) => setSwapRequest(e.target.value)}
                  placeholder="e.g., 'something more romantic', 'a quieter restaurant', 'outdoor seating', 'Italian food', 'closer to downtown'"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background resize-none h-20 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
              
              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => executeSwapVenue(showSwapDialog, swapRequest)}
                  disabled={isSwapping === showSwapDialog}
                  className="flex-1 py-2 px-3 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-colors"
                >
                  {isSwapping === showSwapDialog ? (
                    <>
                      <RefreshCw className="w-3 h-3 animate-spin mr-1" />
                      Finding Alternative...
                    </>
                  ) : (
                    'Find Alternative'
                  )}
                </button>
                <button
                  onClick={() => {
                    setShowSwapDialog(null)
                    setSwapRequest('')
                  }}
                  className="flex-1 py-2 px-3 rounded-lg border border-border text-sm font-medium hover:bg-muted transition-colors"
                >
                  Cancel
                </button>
              </div>
              
              <div className="text-xs text-muted-foreground">
                💡 Leave empty for a random alternative, or describe what you want
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Budget Calculator Modal */}
      {showBudgetCalculator && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-background rounded-2xl border p-6 max-w-2xl w-full max-h-[85vh] overflow-y-auto my-4 md:my-0">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <Calculator className="w-5 h-5 text-green-600" />
                <h3 className="font-semibold text-lg">Budget Calculator</h3>
              </div>
              <button
                onClick={() => setShowBudgetCalculator(false)}
                className="p-1.5 rounded-lg hover:bg-muted transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {(() => {
              const budget = calculateBudgetBreakdown(steps, partySize)
              return (
                <div className="space-y-6">
                  {/* Party Size */}
                  <div>
                    <label className="text-sm font-medium text-muted-foreground block mb-2">Party Size</label>
                    <div className="flex gap-2">
                      {[1, 2, 3, 4, 5, 6].map(size => (
                        <button
                          key={size}
                          onClick={() => setPartySize(size)}
                          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                            partySize === size
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-muted text-muted-foreground hover:bg-muted/80'
                          }`}
                        >
                          {size} {size === 1 ? 'Person' : 'People'}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Total Cost Summary */}
                  <div className="bg-linear-to-r from-green-500/10 to-emerald-500/10 rounded-xl p-4 border border-green-500/20">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-green-700">Total Estimated Cost</span>
                      <PiggyBank className="w-4 h-4 text-green-600" />
                    </div>
                    <div className="text-2xl font-bold text-green-700">${budget.totalCost.toFixed(2)}</div>
                    <div className="text-sm text-green-600">
                      ${budget.costPerPerson.toFixed(2)} per person
                    </div>
                  </div>

                  {/* Venue Breakdown */}
                  <div>
                    <h4 className="font-medium text-sm mb-3 flex items-center gap-2">
                      <Receipt className="w-4 h-4" />
                      Cost Breakdown by Venue
                    </h4>
                    <div className="space-y-3">
                      {budget.venues.map((venue, index) => (
                        <div key={index} className="bg-muted/50 rounded-lg p-3">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium text-sm">{venue.venue.place}</span>
                            <span className="text-sm font-semibold">${venue.totalCost.toFixed(2)}</span>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            {venue.ticketCost > 0 && (
                              <div className="flex items-center gap-1">
                                <Ticket className="w-3 h-3" />
                                <span>Tickets: ${venue.ticketCost.toFixed(2)}</span>
                              </div>
                            )}
                            {venue.foodCost > 0 && (
                              <div className="flex items-center gap-1">
                                <UtensilsCrossed className="w-3 h-3" />
                                <span>Food: ${venue.foodCost.toFixed(2)}</span>
                              </div>
                            )}
                            {venue.drinkCost > 0 && (
                              <div className="flex items-center gap-1">
                                <Wine className="w-3 h-3" />
                                <span>Drinks: ${venue.drinkCost.toFixed(2)}</span>
                              </div>
                            )}
                            {venue.activityCost > 0 && (
                              <div className="flex items-center gap-1">
                                <Sparkles className="w-3 h-3" />
                                <span>Activity: ${venue.activityCost.toFixed(2)}</span>
                              </div>
                            )}
                          </div>
                          {venue.venue.pricing?.source && (
                            <div className="text-xs text-green-600 mt-1">
                              💰 Real pricing data
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Split Options */}
                  <div>
                    <h4 className="font-medium text-sm mb-3 flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      Split Costs
                    </h4>
                    <div className="flex gap-2 mb-3">
                      <button
                        onClick={() => setSplitType('equal')}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                          splitType === 'equal'
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted text-muted-foreground hover:bg-muted/80'
                        }`}
                      >
                        Equal Split
                      </button>
                      <button
                        onClick={() => setSplitType('custom')}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                          splitType === 'custom'
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted text-muted-foreground hover:bg-muted/80'
                        }`}
                      >
                        Custom Split
                      </button>
                    </div>
                    <div className="bg-blue-500/10 rounded-lg p-3 border border-blue-500/20">
                      <div className="text-sm text-blue-700">
                        {splitType === 'equal' ? (
                          <div>Each person pays: <strong>${budget.costPerPerson.toFixed(2)}</strong></div>
                        ) : (
                          <div className="text-blue-600">Custom split: You can adjust amounts individually</div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Money Saving Tips */}
                  <div>
                    <h4 className="font-medium text-sm mb-3 flex items-center gap-2">
                      <TrendingDown className="w-4 h-4" />
                      Money-Saving Tips
                    </h4>
                    <div className="space-y-2">
                      {budget.savings.map((tip, index) => (
                        <div key={index} className="flex items-start gap-2 text-sm text-muted-foreground">
                          <AlertCircle className="w-3.5 h-3.5 mt-0.5 text-green-500 shrink-0" />
                          <span>{tip}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Alternatives */}
                  {budget.alternatives.length > 0 && (
                    <div>
                      <h4 className="font-medium text-sm mb-3 flex items-center gap-2">
                        <Info className="w-4 h-4" />
                        Cost-Saving Alternatives
                      </h4>
                      <div className="space-y-2">
                        {budget.alternatives.map((alt, index) => (
                          <div key={index} className="bg-amber-500/10 rounded-lg p-3 border border-amber-500/20">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm font-medium">{alt.venue.place}</span>
                              <span className="text-xs font-semibold text-amber-600">
                                Save ${alt.savings.toFixed(2)}
                              </span>
                            </div>
                            <div className="text-xs text-muted-foreground">{alt.alternative}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )
            })()}
          </div>
        </div>
      )}

      {/* Calendar Integration Modal */}
      {showCalendarDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-background rounded-2xl border p-6 max-w-3xl w-full max-h-[85vh] overflow-y-auto my-4 md:my-0">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-blue-600" />
                <h3 className="font-semibold text-lg">Date Night Calendar</h3>
              </div>
              <button
                onClick={() => setShowCalendarDialog(false)}
                className="p-1.5 rounded-lg hover:bg-muted transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-6">
              {/* Date and Time Selection */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground block mb-2">Select Date</label>
                  <input
                    type="date"
                    value={selectedDate.toISOString().split('T')[0]}
                    onChange={(e) => setSelectedDate(new Date(e.target.value))}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground block mb-2">Start Time</label>
                  <select
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  >
                    <option value="17:00">5:00 PM</option>
                    <option value="18:00">6:00 PM</option>
                    <option value="18:30">6:30 PM</option>
                    <option value="19:00">7:00 PM</option>
                    <option value="19:30">7:30 PM</option>
                    <option value="20:00">8:00 PM</option>
                    <option value="20:30">8:30 PM</option>
                    <option value="21:00">9:00 PM</option>
                  </select>
                </div>
              </div>

              {/* Calendar Options */}
              <div>
                <h4 className="font-medium text-sm mb-3 flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Calendar Options
                </h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-sm text-muted-foreground">Include travel time between venues</label>
                    <button
                      onClick={() => setIncludeTravelTime(!includeTravelTime)}
                      className={`w-12 h-6 rounded-full transition-colors ${
                        includeTravelTime ? 'bg-primary' : 'bg-muted'
                      }`}
                    >
                      <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                        includeTravelTime ? 'translate-x-6' : 'translate-x-0.5'
                      }`} />
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <label className="text-sm text-muted-foreground">Set reminders (30 min before)</label>
                    <button
                      onClick={() => setReminders(!reminders)}
                      className={`w-12 h-6 rounded-full transition-colors ${
                        reminders ? 'bg-primary' : 'bg-muted'
                      }`}
                    >
                      <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                        reminders ? 'translate-x-6' : 'translate-x-0.5'
                      }`} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Calendar Notes */}
              <div>
                <label className="text-sm font-medium text-muted-foreground block mb-2">Calendar Notes (optional)</label>
                <textarea
                  value={calendarNotes}
                  onChange={(e) => setCalendarNotes(e.target.value)}
                  placeholder="Add notes for your calendar events (e.g., 'Birthday celebration', 'Anniversary dinner', 'Dress code: casual')"
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm resize-none h-20 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>

              {/* Weather Information */}
              {weather && (
                <div className="bg-linear-to-r from-blue-500/10 to-sky-500/10 rounded-xl p-4 border border-blue-500/20">
                  <h4 className="font-medium text-sm mb-3 flex items-center gap-2">
                    {weather.precipitation > 0 ? <CloudRain className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
                    Weather Forecast
                  </h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Temperature:</span>
                      <span className="ml-2 font-medium">{weather.temperature}°F</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Condition:</span>
                      <span className="ml-2 font-medium capitalize">{weather.condition.replace('-', ' ')}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Humidity:</span>
                      <span className="ml-2 font-medium">{weather.humidity}%</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Wind:</span>
                      <span className="ml-2 font-medium">{weather.windSpeed} mph</span>
                    </div>
                  </div>
                  <div className="mt-3 text-sm text-muted-foreground">{weather.forecast}</div>
                </div>
              )}

              {/* Weather Recommendations */}
              {weather && (
                <div>
                  <h4 className="font-medium text-sm mb-3 flex items-center gap-2">
                    <Cloud className="w-4 h-4" />
                    Weather-Based Recommendations
                  </h4>
                  <div className="space-y-2">
                    {getWeatherRecommendation(weather, steps).map((rec, index) => (
                      <div key={index} className="flex items-start gap-2 text-sm text-muted-foreground bg-blue-500/5 rounded-lg p-3">
                        <Info className="w-3.5 h-3.5 mt-0.5 text-blue-500 shrink-0" />
                        <span>{rec}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Calendar Events Preview */}
              <div>
                <h4 className="font-medium text-sm mb-3 flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Schedule Preview
                </h4>
                <div className="space-y-3">
                  {calendarEvents.map((event, index) => (
                    <div key={index} className="bg-muted/50 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-sm">{event.title}</span>
                        <span className="text-xs text-muted-foreground">
                          {event.start.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })} - 
                          {event.end.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {event.location}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Reservation Links */}
              <div>
                <h4 className="font-medium text-sm mb-3 flex items-center gap-2">
                  <PhoneCall className="w-4 h-4" />
                  Reservation & Booking Links
                </h4>
                <div className="space-y-2">
                  {generateReservationLinks(steps).map((link, index) => (
                    <a
                      key={index}
                      href={link.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between bg-amber-500/10 rounded-lg p-3 border border-amber-500/20 hover:bg-amber-500/15 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <ExternalLink className="w-3.5 h-3.5 text-amber-600" />
                        <div>
                          <div className="text-sm font-medium">{link.venue.place}</div>
                          <div className="text-xs text-muted-foreground">{link.type}</div>
                        </div>
                      </div>
                      <div className="text-xs text-amber-600 font-medium">Book Now</div>
                    </a>
                  ))}
                </div>
              </div>

              {/* Calendar Export Buttons */}
              <div>
                <h4 className="font-medium text-sm mb-3 flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Add to Calendar
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={exportToGoogleCalendar}
                    className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors"
                  >
                    <Calendar className="w-4 h-4" />
                    Google Calendar
                  </button>
                  <button
                    onClick={exportToICalendar}
                    className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-gray-800 text-white text-sm font-medium hover:bg-gray-900 transition-colors"
                  >
                    <Calendar className="w-4 h-4" />
                    Apple Calendar
                  </button>
                  <button
                    onClick={exportToOutlook}
                    className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-blue-700 text-white text-sm font-medium hover:bg-blue-800 transition-colors"
                  >
                    <Calendar className="w-4 h-4" />
                    Outlook
                  </button>
                  <button
                    onClick={() => {
                      // Copy calendar events to clipboard
                      const events = generateCalendarEvents(steps, selectedDate, steps.map((step, index) => step.travelTimeToNext || 10), startTime, includeTravelTime, calendarNotes, reminders)
                      const text = events.map(event => `${event.title}\n${event.start.toLocaleString()} - ${event.end.toLocaleString()}\n${event.location}\n${event.description}`).join('\n\n')
                      navigator.clipboard.writeText(text)
                      alert('Calendar events copied to clipboard!')
                    }}
                    className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-green-600 text-white text-sm font-medium hover:bg-green-700 transition-colors"
                  >
                    <Copy className="w-4 h-4" />
                    Copy to Clipboard
                  </button>
                </div>
                
                {/* Calendar Summary */}
                <div className="mt-4 p-3 bg-muted/50 rounded-lg">
                  <div className="text-xs text-muted-foreground space-y-1">
                    <div className="flex items-center justify-between">
                      <span>Total events:</span>
                      <span className="font-medium">{calendarEvents.length} venues</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Start time:</span>
                      <span className="font-medium">{new Date(selectedDate).toLocaleDateString()} at {startTime.replace(':', ':')}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Reminders:</span>
                      <span className="font-medium">{reminders ? '30 min before' : 'None'}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Travel time:</span>
                      <span className="font-medium">{includeTravelTime ? 'Included' : 'Not included'}</span>
                    </div>
                    {calendarNotes && (
                      <div className="flex items-start gap-2 mt-2">
                        <span>Notes:</span>
                        <span className="font-medium">{calendarNotes}</span>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="mt-3 text-xs text-muted-foreground text-center">
                  Events include venue details, locations, and {reminders ? 'automatic reminders' : 'no reminders'}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Special Occasions Modal */}
      {showSpecialOccasions && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-background rounded-2xl border p-6 max-w-3xl w-full max-h-[85vh] overflow-y-auto my-4 md:my-0">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <Gift className="w-5 h-5 text-purple-600" />
                <h3 className="font-semibold text-lg">Special Occasions</h3>
              </div>
              <button
                onClick={() => setShowSpecialOccasions(false)}
                className="p-1.5 rounded-lg hover:bg-muted transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-6">
              {/* Occasion Types */}
              <div>
                <h4 className="font-medium text-sm mb-3 flex items-center gap-2">
                  <Cake className="w-4 h-4" />
                  Birthday & Anniversary Themes
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-linear-to-r from-pink-500/10 to-rose-500/10 rounded-lg p-4 border border-pink-500/20">
                    <div className="flex items-center gap-2 mb-2">
                      <Cake className="w-4 h-4 text-pink-600" />
                      <span className="font-medium text-sm">Birthday Celebrations</span>
                    </div>
                    <div className="text-xs text-muted-foreground space-y-1">
                      <div>🎂 Birthday packages & desserts</div>
                      <div>🎉 Party atmosphere & group seating</div>
                      <div>📸 Photo opportunities</div>
                      <div>🎁 Special birthday treatment</div>
                    </div>
                  </div>
                  <div className="bg-linear-to-r from-red-500/10 to-pink-500/10 rounded-lg p-4 border border-red-500/20">
                    <div className="flex items-center gap-2 mb-2">
                      <Heart className="w-4 h-4 text-red-600" />
                      <span className="font-medium text-sm">Anniversary Romance</span>
                    </div>
                    <div className="text-xs text-muted-foreground space-y-1">
                      <div>💕 Intimate, romantic settings</div>
                      <div>🌹 Special touches & surprises</div>
                      <div>🍷 Wine pairings & champagne</div>
                      <div>💫 Memorable experiences</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Seasonal Activities */}
              <div>
                <h4 className="font-medium text-sm mb-3 flex items-center gap-2">
                  <Snowflake className="w-4 h-4" />
                  Seasonal Activities
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-linear-to-r from-blue-500/10 to-cyan-500/10 rounded-lg p-4 border border-blue-500/20">
                    <div className="flex items-center gap-2 mb-2">
                      <Snowflake className="w-4 h-4 text-blue-600" />
                      <span className="font-medium text-sm">Winter Wonderland</span>
                    </div>
                    <div className="text-xs text-muted-foreground space-y-1">
                      <div>⛸️ Ice skating rinks</div>
                      <div>🏔️ Cozy fireplaces & hot cocoa</div>
                      <div>🎄 Holiday markets & festivals</div>
                      <div>❄️ Winter festivals & events</div>
                    </div>
                  </div>
                  <div className="bg-linear-to-r from-orange-500/10 to-amber-500/10 rounded-lg p-4 border border-orange-500/20">
                    <div className="flex items-center gap-2 mb-2">
                      <Flower2 className="w-4 h-4 text-orange-600" />
                      <span className="font-medium text-sm">Fall Harvest</span>
                    </div>
                    <div className="text-xs text-muted-foreground space-y-1">
                      <div>🎃 Pumpkin patches & farms</div>
                      <div>🍎 Apple orchards & cider</div>
                      <div>🍂 Fall foliage tours</div>
                      <div>🌾 Harvest festivals</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Holiday Special Venues */}
              <div>
                <h4 className="font-medium text-sm mb-3 flex items-center gap-2">
                  <TreePine className="w-4 h-4" />
                  Holiday Special Venues
                </h4>
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-linear-to-r from-red-500/10 to-green-500/10 rounded-lg p-3 border border-red-500/20">
                    <div className="flex items-center gap-2 mb-1">
                      <Heart className="w-3 h-3 text-red-600" />
                      <span className="font-medium text-xs">Valentine's Day</span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      <div>💝 Romantic restaurants</div>
                      <div>🌹 Flower shops</div>
                      <div>🍫 Chocolate tastings</div>
                    </div>
                  </div>
                  <div className="bg-linear-to-r from-red-500/10 to-green-500/10 rounded-lg p-3 border border-green-500/20">
                    <div className="flex items-center gap-2 mb-1">
                      <TreePine className="w-3 h-3 text-green-600" />
                      <span className="font-medium text-xs">Christmas</span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      <div>🎄 Holiday markets</div>
                      <div>🎅 Festive dining</div>
                      <div>🎁 Gift shops</div>
                    </div>
                  </div>
                  <div className="bg-linear-to-r from-orange-500/10 to-black/10 rounded-lg p-3 border border-orange-500/20">
                    <div className="flex items-center gap-2 mb-1">
                      <Ghost className="w-3 h-3 text-orange-600" />
                      <span className="font-medium text-xs">Halloween</span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      <div>👻 Haunted houses</div>
                      <div>🎃 Themed bars</div>
                      <div>🍬 Candy shops</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Surprise Elements */}
              <div>
                <h4 className="font-medium text-sm mb-3 flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  Surprise Elements & Hidden Gems
                </h4>
                <div className="bg-linear-to-r from-purple-500/10 to-indigo-500/10 rounded-lg p-4 border border-purple-500/20">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="font-medium mb-2">🌟 Hidden Gems</div>
                      <div className="text-xs text-muted-foreground space-y-1">
                        <div>• Secret speakeasies</div>
                        <div>• Underground restaurants</div>
                        <div>• Local favorites off the beaten path</div>
                        <div>• Rooftop gardens with city views</div>
                      </div>
                    </div>
                    <div>
                      <div className="font-medium mb-2">🎁 Surprise Elements</div>
                      <div className="text-xs text-muted-foreground space-y-1">
                        <div>• Unexpected entertainment</div>
                        <div>• Mystery dinner experiences</div>
                        <div>• Pop-up events & festivals</div>
                        <div>• Interactive activities</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Current Venue Special Features */}
              {steps.length > 0 && (
                <div>
                  <h4 className="font-medium text-sm mb-3 flex items-center gap-2">
                    <Star className="w-4 h-4" />
                    Enhanced Features in Your Plan
                  </h4>
                  <div className="space-y-3">
                    {steps.map((step, index) => (
                      <div key={index} className="bg-linear-to-r from-purple-500/10 to-pink-500/10 rounded-lg p-4 border border-purple-500/20">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-sm">{step.place}</span>
                          <span className="text-xs text-purple-600 font-medium">
                            {step.category === 'dinner' ? '🍽️ Dinner' : step.category === 'drinks' ? '🍷 Drinks' : '🎯 Activity'}
                          </span>
                        </div>
                        
                        {/* Show special occasion features */}
                        {(step.features || []).length > 0 && (
                          <div className="mb-2">
                            <div className="text-xs font-medium text-purple-700 mb-1">Special Features:</div>
                            <div className="flex flex-wrap gap-1">
                              {(step.features || []).map((feature, i) => (
                                <span key={i} className="text-xs px-2 py-1 rounded-full bg-purple-500/20 text-purple-700 border border-purple-500/30">
                                  {feature}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {/* Show AI insights if available */}
                        {step.aiInsights && (
                          <div className="space-y-2">
                            {step.aiInsights.bestFor && step.aiInsights.bestFor.length > 0 && (
                              <div>
                                <div className="text-xs font-medium text-purple-700 mb-1">Perfect For:</div>
                                <div className="text-xs text-muted-foreground">
                                  {step.aiInsights.bestFor.join(', ')}
                                </div>
                              </div>
                            )}
                            
                            {step.aiInsights.insiderTips && step.aiInsights.insiderTips.length > 0 && (
                              <div>
                                <div className="text-xs font-medium text-purple-700 mb-1">Insider Tips:</div>
                                <div className="text-xs text-muted-foreground">
                                  {step.aiInsights.insiderTips.slice(0, 2).join(' • ')}
                                </div>
                              </div>
                            )}
                            
                            {step.aiInsights.photoSpots && step.aiInsights.photoSpots.length > 0 && (
                              <div>
                                <div className="text-xs font-medium text-purple-700 mb-1">Photo Spots:</div>
                                <div className="text-xs text-muted-foreground">
                                  📸 {step.aiInsights.photoSpots.slice(0, 2).join(', ')}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                        
                        {/* Show pricing if available */}
                        {step.pricing && (
                          <div className="mt-2 pt-2 border-t border-purple-500/20">
                            <div className="text-xs font-medium text-purple-700 mb-1">Pricing Info:</div>
                            <div className="text-xs text-muted-foreground">
                              {step.pricing.tickets && `🎫 Tickets: $${step.pricing.tickets}`}
                              {step.pricing.food && ` • 🍽️ Food: $${step.pricing.food}`}
                              {step.pricing.drinks && ` • 🍷 Drinks: $${step.pricing.drinks}`}
                              {step.pricing.activities && ` • 🎯 Activities: $${step.pricing.activities}`}
                            </div>
                          </div>
                        )}
                        
                        {/* Show status */}
                        <div className="mt-2 pt-2 border-t border-purple-500/20">
                          <div className="flex items-center gap-2 text-xs text-green-600">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            <span>Currently Open</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* How to Use */}
              <div className="bg-blue-500/5 rounded-lg p-4 border border-blue-500/20">
                <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
                  <Info className="w-4 h-4 text-blue-500" />
                  How to Add Special Occasions
                </h4>
                <div className="text-xs text-muted-foreground space-y-1">
                  <div>• Select your occasion type when searching for venues</div>
                  <div>• Choose seasonal activities for time-specific experiences</div>
                  <div>• Enable surprise elements for hidden gems</div>
                  <div>• Pick holiday themes for festive celebrations</div>
                  <div>• Venues will be enhanced with special features and packages</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Date Plan History Modal */}
      {showHistory && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-background rounded-2xl border p-6 max-w-4xl w-full max-h-[85vh] overflow-y-auto my-4 md:my-0">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <History className="w-5 h-5 text-amber-600" />
                <h3 className="font-semibold text-lg">Date Plan History</h3>
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
                <h4 className="font-medium text-lg mb-2">No Date Plans Yet</h4>
                <p className="text-sm text-muted-foreground mb-6">
                  Your completed date plans will appear here for easy access
                </p>
                {venues && venues.length > 0 && (
                  <button
                    onClick={saveToHistory}
                    className="px-4 py-2 rounded-lg bg-amber-500 text-white text-sm font-medium hover:bg-amber-600 transition-colors"
                  >
                    Save Current Plan
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {/* Save Current Plan Button */}
                {venues && venues.length > 0 && (
                  <div className="bg-amber-500/10 rounded-lg p-4 border border-amber-500/20">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-sm mb-1">Save Current Plan</h4>
                        <p className="text-xs text-muted-foreground">
                          Add this date plan to your history for future reference
                        </p>
                      </div>
                      <button
                        onClick={saveToHistory}
                        className="px-3 py-1.5 rounded-lg bg-amber-500 text-white text-xs font-medium hover:bg-amber-600 transition-colors"
                      >
                        Save Plan
                      </button>
                    </div>
                  </div>
                )}

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

      {/* Share Modal */}
      <ShareModal
        steps={steps}
        isOpen={isShareOpen}
        onClose={() => setIsShareOpen(false)}
        venues={venues}
        searchCriteria={searchCriteria}
      />
    </div>
  )
}
