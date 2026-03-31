"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Wine, UtensilsCrossed, Sparkles, Star, Clock, MapPin, DollarSign, AlertCircle, Heart, Users, Calendar, PiggyBank, Receipt, CheckCircle2, Loader2 } from "lucide-react"
import { authJsonFetch } from "@/lib/client-auth-fetch"

interface VenuePricing {
  tickets?: number
  food?: number
  drinks?: number
  activities?: number
  packages?: Array<{ name: string; price: number; includes: string[] }>
  minimumSpend?: number
  currency?: string
  duration?: number
  source?: string
  lastUpdated?: string
}

interface SharedVenue {
  name: string
  category: 'drinks' | 'dinner' | 'activity'
  rating: number
  reviewCount: number
  priceRange: string
  address: string
  description: string
  hours?: string
  imageUrl?: string
  tags: string[]
  features: string[]
  vibe?: string
  pricing?: VenuePricing
}

interface SharedData {
  location: string
  budget: string
  vibes: string[]
  time: string
  partySize: number
  venues: SharedVenue[]
  plannedDate: string
  expiresAt: number
  expired?: boolean
}

const categoryEmoji: Record<string, string> = {
  drinks: "\uD83C\uDF78",
  dinner: "\uD83C\uDF7D\uFE0F",
  activity: "\u2728",
}

const categoryIcons: Record<string, React.ReactNode> = {
  drinks: <Wine className="w-5 h-5" />,
  dinner: <UtensilsCrossed className="w-5 h-5" />,
  activity: <Sparkles className="w-5 h-5" />,
}

const categoryColors: Record<string, string> = {
  drinks: "from-rose-500 to-orange-400",
  dinner: "from-amber-500 to-yellow-400",
  activity: "from-violet-500 to-indigo-400",
}

const categoryBg: Record<string, string> = {
  drinks: "bg-rose-500/10 text-rose-600 border-rose-200",
  dinner: "bg-amber-500/10 text-amber-600 border-amber-200",
  activity: "bg-violet-500/10 text-violet-600 border-violet-200",
}

const timeLabels: Record<string, string> = {
  early: "Early Evening",
  prime: "Prime Time",
  late: "Late Night",
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
                : "text-gray-300"
            }`}
          />
        ))}
      </div>
      <span className="text-xs font-semibold text-foreground">{value}</span>
      {count > 0 && <span className="text-[10px] text-muted-foreground">({count.toLocaleString()})</span>}
    </div>
  )
}

function getPriceMultiplier(priceRange: string): number {
  const multipliers: Record<string, number> = { '$': 0.7, '$$': 1.0, '$$$': 1.8, '$$$$': 3.0 }
  return multipliers[priceRange] || 1.0
}

function estimateVenueCost(venue: SharedVenue, partySize: number): number {
  if (venue.pricing) {
    const p = venue.pricing
    const food = (p.food || 0) * partySize
    const drinks = (p.drinks || 0) * partySize
    const activities = (p.activities || 0) * partySize
    const tickets = (p.tickets || 0) * partySize
    const total = food + drinks + activities + tickets
    if (total > 0) return total
  }

  const mult = getPriceMultiplier(venue.priceRange)
  if (venue.category === 'dinner') return (25 + 8) * mult * partySize
  if (venue.category === 'drinks') return (12 + 10) * mult * partySize
  if (venue.category === 'activity') return (30 + 5 + 8) * mult * partySize
  return 25 * mult * partySize
}

export default function SharedItinerary({ shareId }: { shareId: string }) {
  const [data, setData] = useState<SharedData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<'not_found' | 'expired' | null>(null)
  const [pricingLoading, setPricingLoading] = useState(false)

  useEffect(() => {
    fetch(`/api/shared/${shareId}`)
      .then(res => {
        if (res.status === 404) {
          setError('not_found')
          setLoading(false)
          return null
        }
        if (!res.ok) throw new Error('Failed to fetch')
        return res.json()
      })
      .then(json => {
        if (!json) return
        if (json.expired) {
          setData(json)
          setError('expired')
        } else {
          setData(json)
          fetchMissingPricing(json)
        }
        setLoading(false)
      })
      .catch(() => {
        setError('not_found')
        setLoading(false)
      })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shareId])

  function fetchMissingPricing(sharedData: SharedData) {
    const venuesMissingPricing = sharedData.venues.filter(
      v => !v.pricing || !v.pricing.source
    )
    if (venuesMissingPricing.length === 0) return

    setPricingLoading(true)
      authJsonFetch('/api/ai/enhance', {
        action: 'fetch-pricing',
        venues: venuesMissingPricing.map(v => ({
          name: v.name,
          category: v.category,
          description: v.description,
          address: v.address,
          priceRange: v.priceRange
        }))
      })
      .then(res => res.ok ? res.json() : null)
      .then(result => {
        if (!result?.pricing) return
        let pricingIdx = 0
        const updatedVenues = sharedData.venues.map(v => {
          if (!v.pricing || !v.pricing.source) {
            const p = result.pricing[pricingIdx++]
            if (p) return { ...v, pricing: { ...p, lastUpdated: new Date().toISOString() } }
          }
          return v
        })
        setData(prev => prev ? { ...prev, venues: updatedVenues } : prev)
      })
      .catch(() => { /* fallback to estimate-based pricing */ })
      .finally(() => setPricingLoading(false))
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-3 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-muted-foreground">Loading itinerary...</p>
        </div>
      </div>
    )
  }

  if (error === 'not_found' && !data) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="text-center space-y-4 max-w-sm">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto">
            <AlertCircle className="w-8 h-8 text-muted-foreground" />
          </div>
          <h1 className="text-xl font-bold text-foreground">Plan not found</h1>
          <p className="text-sm text-muted-foreground">
            This date night plan doesn&apos;t exist or the link may be invalid.
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity"
          >
            <Heart className="w-4 h-4" />
            Plan your own date night
          </Link>
        </div>
      </div>
    )
  }

  if (error === 'expired') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="text-center space-y-4 max-w-sm">
          <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto">
            <Clock className="w-8 h-8 text-destructive" />
          </div>
          <h1 className="text-xl font-bold text-foreground">Plan expired</h1>
          <p className="text-sm text-muted-foreground">
            This date night plan has expired. Shared plans are available for 3 days after the planned date.
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity"
          >
            <Heart className="w-4 h-4" />
            Plan your own date night
          </Link>
        </div>
      </div>
    )
  }

  if (!data) return null

  const plannedDate = new Date(data.plannedDate)
  const expiryDate = new Date(data.expiresAt)
  const partySize = data.partySize || 2

  // Budget calculations
  const venueCosts = data.venues.map(v => ({
    venue: v,
    cost: estimateVenueCost(v, partySize),
    hasRealPricing: !!(v.pricing && (v.pricing.food || v.pricing.drinks || v.pricing.activities || v.pricing.tickets)),
  }))
  const totalCost = venueCosts.reduce((sum, v) => sum + v.cost, 0)
  const costPerPerson = totalCost / partySize

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <Heart className="w-4 h-4 text-white fill-white" />
            </div>
            <span className="font-bold text-sm text-foreground">Mystery Date Night</span>
          </Link>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6 space-y-6">
        {/* Title */}
        <div className="text-center space-y-3">
          <h1 className="text-2xl font-bold text-foreground">Date Night Plan</h1>

          {/* Date + Location card */}
          <div className="inline-flex items-center gap-4 bg-card border border-border rounded-xl px-4 py-3 shadow-sm">
            {/* Calendar icon block */}
            <div className="flex flex-col items-center min-w-[44px]">
              <span className="text-[10px] font-bold uppercase text-primary leading-tight">
                {plannedDate.toLocaleDateString(undefined, { month: 'short' })}
              </span>
              <span className="text-2xl font-bold text-foreground leading-tight">
                {plannedDate.getDate()}
              </span>
              <span className="text-[10px] text-muted-foreground leading-tight">
                {plannedDate.toLocaleDateString(undefined, { weekday: 'short' })}
              </span>
            </div>

            <div className="h-10 w-px bg-border" />

            <div className="text-left space-y-0.5">
              <div className="flex items-center gap-1 text-sm font-medium text-foreground">
                <MapPin className="w-3.5 h-3.5 text-primary" />
                {data.location}
              </div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="w-3 h-3" />
                {timeLabels[data.time] || data.time}
              </div>
            </div>
          </div>

          {/* Tags */}
          <div className="flex items-center justify-center gap-2 flex-wrap">
            {data.vibes.map(v => (
              <span key={v} className="text-xs px-2.5 py-1 rounded-full bg-primary/10 text-primary font-medium">
                {v}
              </span>
            ))}
            <span className="text-xs px-2.5 py-1 rounded-full bg-muted text-muted-foreground font-medium">
              {data.budget}
            </span>
            <span className="text-xs px-2.5 py-1 rounded-full bg-muted text-muted-foreground font-medium flex items-center gap-1">
              <Users className="w-3 h-3" />
              {partySize} {partySize === 1 ? 'person' : 'people'}
            </span>
          </div>
        </div>

        {/* Budget Summary */}
        <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 rounded-xl p-4 border border-green-500/20">
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-medium text-green-700 flex items-center gap-1.5">
              <PiggyBank className="w-4 h-4" />
              Estimated Total
            </span>
            {pricingLoading ? (
              <span className="text-xs text-green-600 flex items-center gap-1">
                <Loader2 className="w-3 h-3 animate-spin" />
                Fetching real prices...
              </span>
            ) : (
              <span className="text-xs text-green-600">
                ${costPerPerson.toFixed(0)}/person
              </span>
            )}
          </div>
          {pricingLoading ? (
            <div className="space-y-2">
              <div className="h-8 w-24 bg-green-500/10 rounded animate-pulse" />
              <div className="flex gap-3">
                {data.venues.map((_, i) => (
                  <div key={i} className="h-4 w-16 bg-green-500/10 rounded animate-pulse" />
                ))}
              </div>
            </div>
          ) : (
            <>
              <div className="text-2xl font-bold text-green-700">${totalCost.toFixed(0)}</div>
              <div className="mt-3 space-y-2">
                {venueCosts.map((vc, i) => (
                  <div key={i} className="flex flex-col gap-0.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-green-700 font-medium flex items-center gap-1">
                        {categoryEmoji[vc.venue.category]} {vc.venue.name}
                        {vc.hasRealPricing && (
                          <CheckCircle2 className="w-3 h-3 text-green-600" />
                        )}
                      </span>
                      <span className="text-xs font-semibold text-green-700">${vc.cost.toFixed(0)}</span>
                    </div>
                    {vc.hasRealPricing && vc.venue.pricing && (
                      <div className="flex flex-wrap gap-x-3 pl-5 text-[10px] text-green-600/80">
                        {vc.venue.pricing.tickets != null && vc.venue.pricing.tickets > 0 && (
                          <span>Tickets: ${vc.venue.pricing.tickets}/pp</span>
                        )}
                        {vc.venue.pricing.food != null && vc.venue.pricing.food > 0 && (
                          <span>Food: ${vc.venue.pricing.food}/pp</span>
                        )}
                        {vc.venue.pricing.drinks != null && vc.venue.pricing.drinks > 0 && (
                          <span>Drinks: ${vc.venue.pricing.drinks}/pp</span>
                        )}
                        {vc.venue.pricing.activities != null && vc.venue.pricing.activities > 0 && (
                          <span>Activities: ${vc.venue.pricing.activities}/pp</span>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Timeline */}
        <div className="space-y-0">
          {data.venues.map((venue, i) => (
            <div key={i} className="relative">
              {/* Timeline connector */}
              {i < data.venues.length - 1 && (
                <div className="absolute left-5 top-14 bottom-0 w-px bg-border" />
              )}

              <div className="flex gap-4">
                {/* Timeline dot */}
                <div className="flex-shrink-0 w-10 flex flex-col items-center pt-1">
                  <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${categoryColors[venue.category] || categoryColors.activity} flex items-center justify-center text-white shadow-md`}>
                    {categoryIcons[venue.category] || categoryIcons.activity}
                  </div>
                  <span className="text-[10px] font-medium text-muted-foreground mt-1">
                    Stop {i + 1}
                  </span>
                </div>

                {/* Card */}
                <div className="flex-1 pb-6">
                  <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
                    {/* Image */}
                    {venue.imageUrl ? (
                      <div className="relative w-full aspect-[2/1] overflow-hidden bg-muted">
                        <img
                          src={venue.imageUrl}
                          alt={venue.name}
                          className="w-full h-full object-cover"
                          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                      </div>
                    ) : (
                      <div className={`w-full h-20 bg-gradient-to-br ${categoryColors[venue.category] || categoryColors.activity} opacity-20`} />
                    )}

                    <div className="p-4 space-y-2.5">
                      {/* Category + Name */}
                      <div>
                        <span className={`inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full border ${categoryBg[venue.category] || categoryBg.activity} mb-1.5`}>
                          {categoryEmoji[venue.category]} {venue.category}
                        </span>
                        <h3 className="text-base font-bold text-foreground">{venue.name}</h3>
                      </div>

                      {/* Rating + Price */}
                      <div className="flex items-center gap-3">
                        <StarRating value={venue.rating} count={venue.reviewCount} />
                        <span className="text-xs font-semibold text-emerald-600 flex items-center gap-0.5">
                          <DollarSign className="w-3 h-3" />
                          {venue.priceRange}
                        </span>
                      </div>

                      {/* Estimated cost for this venue */}
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 text-xs">
                          <Receipt className="w-3.5 h-3.5 text-green-600 flex-shrink-0" />
                          <span className="text-green-700 font-medium">
                            ~${venueCosts[i].cost.toFixed(0)} est.
                            <span className="text-muted-foreground font-normal"> for {partySize}</span>
                          </span>
                          {venueCosts[i].hasRealPricing && (
                            <span className="text-[10px] text-green-600 bg-green-500/10 px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                              <CheckCircle2 className="w-2.5 h-2.5" />
                              verified
                            </span>
                          )}
                        </div>
                        {venueCosts[i].hasRealPricing && venue.pricing && (
                          <div className="flex flex-wrap gap-x-3 gap-y-0.5 pl-5 text-[10px] text-muted-foreground">
                            {venue.pricing.tickets != null && venue.pricing.tickets > 0 && (
                              <span>Tickets: ${venue.pricing.tickets}/pp</span>
                            )}
                            {venue.pricing.food != null && venue.pricing.food > 0 && (
                              <span>Food: ${venue.pricing.food}/pp</span>
                            )}
                            {venue.pricing.drinks != null && venue.pricing.drinks > 0 && (
                              <span>Drinks: ${venue.pricing.drinks}/pp</span>
                            )}
                            {venue.pricing.activities != null && venue.pricing.activities > 0 && (
                              <span>Activities: ${venue.pricing.activities}/pp</span>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Description */}
                      <p className="text-xs text-muted-foreground leading-relaxed">{venue.description}</p>

                      {/* Address */}
                      <a
                        href={`https://maps.google.com/?q=${encodeURIComponent(venue.address)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-start gap-1.5 text-xs text-primary hover:underline"
                      >
                        <MapPin className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                        <span>{venue.address}</span>
                      </a>

                      {/* Hours */}
                      {venue.hours && (
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Clock className="w-3.5 h-3.5 flex-shrink-0" />
                          <span>{venue.hours}</span>
                        </div>
                      )}

                      {/* Vibe */}
                      {venue.vibe && (
                        <div className="text-xs text-muted-foreground italic">
                          Vibe: {venue.vibe}
                        </div>
                      )}

                      {/* Tags */}
                      {venue.tags && venue.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 pt-1">
                          {venue.tags.slice(0, 5).map(tag => (
                            <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Expiry notice */}
        <div className="text-center">
          <div className="inline-flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/50 px-3 py-1.5 rounded-full">
            <Calendar className="w-3 h-3" />
            Expires {expiryDate.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
          </div>
        </div>

        {/* CTA */}
        <div className="text-center pb-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity shadow-lg"
          >
            <Heart className="w-4 h-4" />
            Plan your own date night
          </Link>
        </div>
      </main>
    </div>
  )
}
