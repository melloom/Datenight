import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { z } from 'zod'

const enhanceSearchSchema = z.object({
  action: z.literal('enhance-search'),
  location: z.string().min(1).max(200),
  criteria: z.object({
    budget: z.string().max(50),
    vibes: z.array(z.string().max(50)).max(10),
    time: z.string().max(50)
  })
})

const analyzeVenueSchema = z.object({
  action: z.literal('analyze-venue'),
  venue: z.object({
    name: z.string().max(200),
    category: z.string().max(100),
    address: z.string().max(300),
    rating: z.number().min(0).max(5),
    priceRange: z.string().max(20)
  })
})

const recommendSchema = z.object({
  action: z.literal('recommend'),
  venues: z.array(z.any()).max(50),
  criteria: z.object({
    location: z.string().max(200),
    budget: z.string().max(50),
    vibes: z.array(z.string().max(50)).max(10),
    time: z.string().max(50),
    partySize: z.number().min(1).max(100)
  })
})

const fetchPricingSchema = z.object({
  action: z.literal('fetch-pricing'),
  venues: z.array(z.object({
    name: z.string().max(200),
    category: z.string().max(100),
    description: z.string().max(500).optional(),
    address: z.string().max(300).optional(),
    priceRange: z.string().max(20).optional()
  })).max(10)
})

const swapVenueSchema = z.object({
  action: z.literal('swap-venue'),
  venue: z.object({
    name: z.string().max(200),
    category: z.string().max(100),
    address: z.string().max(300),
    rating: z.number().min(0).max(5),
    priceRange: z.string().max(20)
  }),
  criteria: z.object({
    location: z.string().max(200),
    budget: z.string().max(50),
    vibes: z.array(z.string().max(50)).max(10),
    time: z.string().max(50),
    partySize: z.number().min(1).max(100),
    customRequests: z.string().optional()
  }),
  currentPlan: z.array(z.any()).max(10),
  swapCategory: z.string().max(100)
})

const optimizeRouteSchema = z.object({
  action: z.literal('optimize-route'),
  venues: z.array(z.object({
    name: z.string().max(200),
    category: z.string().max(100),
    address: z.string().max(300),
    coordinates: z.object({
      lat: z.number(),
      lng: z.number()
    })
  })).max(10),
  criteria: z.object({
    location: z.string().max(200),
    time: z.string().max(50),
    vibes: z.array(z.string().max(50)).max(10)
  })
})

function getApiKey(): string {
  // Try server-side env first, then public env
  // NEXT_PUBLIC_ vars are inlined at build time by Next.js
  return process.env['GEMINI_API_KEY']
    || process.env['NEXT_PUBLIC_GEMINI_API_KEY']
    || ''
}

function getModel() {
  const apiKey = getApiKey()
  if (!apiKey) return null
  const genAI = new GoogleGenerativeAI(apiKey)
  return genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })
}

// Grounded model that can search the web for real venue data
function getGroundedModel() {
  const apiKey = getApiKey()
  if (!apiKey) return null
  const genAI = new GoogleGenerativeAI(apiKey)
  return genAI.getGenerativeModel({
    model: 'gemini-2.5-flash',
    tools: [{ googleSearchRetrieval: { dynamicRetrievalConfig: { mode: 'MODE_DYNAMIC' as any, dynamicThreshold: 0.3 } } }],
  })
}

export async function GET() {
  const apiKey = getApiKey()
  return NextResponse.json({
    hasKey: !!apiKey,
    keyPrefix: apiKey ? apiKey.substring(0, 8) : 'none',
    envKeys: Object.keys(process.env).filter(k => k.toLowerCase().includes('gemini'))
  })
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action } = body
    const GOOGLE_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY || ''

    let validationResult
    if (action === 'enhance-search') {
      validationResult = enhanceSearchSchema.safeParse(body)
    } else if (action === 'analyze-venue') {
      validationResult = analyzeVenueSchema.safeParse(body)
    } else if (action === 'recommend') {
      validationResult = recommendSchema.safeParse(body)
    } else if (action === 'fetch-pricing') {
      validationResult = fetchPricingSchema.safeParse(body)
    } else if (action === 'swap-venue') {
      validationResult = swapVenueSchema.safeParse(body)
    } else if (action === 'optimize-route') {
      validationResult = optimizeRouteSchema.safeParse(body)
    } else if (action === 'improve-plan' || action === 'generate-venues' || action === 'suggest-alternative') {
      // These actions accept flexible input — skip strict schema validation
      validationResult = { success: true }
    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    if (validationResult && !validationResult.success) {
      return NextResponse.json({
        error: 'Invalid input',
        details: (validationResult as any).error?.errors 
      }, { status: 400 })
    }

    const model = getModel()
    const groundedModel = getGroundedModel()

    if (action === 'enhance-search') {
      const { location, criteria } = body
      if (!groundedModel && !model) {
        return NextResponse.json({
          searchTerms: ['romantic restaurants', 'date night spots', 'couples dining', 'intimate bars'],
          locationInsights: 'This area offers several romantic options perfect for date nights',
          recommendations: ['Focus on downtown area', 'Consider waterfront venues', 'Look for places with live music']
        })
      }

      const prompt = `Search the web for the best date night venues in ${location} and provide recommendations.

Budget: ${criteria.budget}
Desired Vibes: ${criteria.vibes.join(', ')}
Time: ${criteria.time}

Search for real, currently operating restaurants, bars, and entertainment venues in this area. Include specific venue names you find.

Provide a JSON response with these exact keys:
{
  "searchTerms": ["5-8 specific search terms including real venue names and neighborhoods"],
  "locationInsights": "Current insights about this location for dating based on what you found (2-3 sentences)",
  "recommendations": ["3-4 specific real venues or areas you found that are great for dates"]
}

Focus on real, currently open, date-appropriate venues and hidden gems.`

      try {
        // Use grounded model for web search, fall back to regular model
        const activeModel = groundedModel || model!
        const result = await activeModel.generateContent(prompt)
        const text = result.response.text()
        const cleaned = text.replace(/```json\n?|\n?```/g, '').trim()
        return NextResponse.json(JSON.parse(cleaned))
      } catch {
        return NextResponse.json({
          searchTerms: ['romantic restaurants', 'date night spots', 'couples dining', 'intimate bars'],
          locationInsights: 'This area offers several romantic options perfect for date nights',
          recommendations: ['Focus on downtown area', 'Consider waterfront venues', 'Look for places with live music']
        })
      }
    }

    if (action === 'analyze-venue') {
      const { venue } = body
      if (!model) {
        return NextResponse.json({
          description: 'A wonderful venue perfect for creating memorable date experiences',
          highlights: ['Romantic atmosphere', 'Excellent service', 'Beautiful setting'],
          vibe_tags: ['romantic', 'intimate', 'charming'],
          price_assessment: 'Great value for the experience offered',
          best_for: ['Date nights', 'Anniversaries', 'Special occasions'],
          insider_tips: ['Book ahead for best seating', 'Arrive a few minutes early'],
          rating_explanation: 'Consistently praised for ambiance and service quality',
          photo_spots: ['Entrance', 'Main dining area', 'Cozy corners']
        })
      }

      const prompt = `Analyze this venue for a date night app:
Venue: ${venue.name}
Category: ${venue.category}
Address: ${venue.address}
Rating: ${venue.rating}/5
Price Range: ${venue.priceRange}

Provide a JSON response with these exact keys:
{
  "description": "A compelling description (2-3 sentences)",
  "highlights": ["3-5 key features"],
  "vibe_tags": ["3-4 atmosphere tags"],
  "price_assessment": "Brief value assessment",
  "best_for": ["2-3 occasions"],
  "insider_tips": ["2-3 tips"],
  "rating_explanation": "Why this rating",
  "photo_spots": ["3-4 spots"]
}`

      try {
        const result = await model.generateContent(prompt)
        const text = result.response.text()
        const cleaned = text.replace(/```json\n?|\n?```/g, '').trim()
        return NextResponse.json(JSON.parse(cleaned))
      } catch {
        return NextResponse.json({
          description: 'A wonderful venue perfect for creating memorable date experiences',
          highlights: ['Romantic atmosphere', 'Excellent service', 'Beautiful setting'],
          vibe_tags: ['romantic', 'intimate', 'charming'],
          price_assessment: 'Great value for the experience offered',
          best_for: ['Date nights', 'Anniversaries'],
          insider_tips: ['Book ahead for best seating'],
          rating_explanation: 'Praised for ambiance and service',
          photo_spots: ['Entrance', 'Main dining area']
        })
      }
    }

    if (action === 'recommend') {
      const { venues, criteria } = body
      if (!model) {
        return NextResponse.json({
          title: 'Perfect Romantic Evening',
          description: 'A carefully curated date experience combining the best of local dining and entertainment',
          why_perfect: 'This combination balances romance, fun, and conversation perfectly',
          tips: ['Dress comfortably but elegantly', 'Make reservations in advance', 'Bring a camera'],
          alternatives: ['Indoor venues if weather concerns', 'Earlier time slots for quieter atmosphere']
        })
      }

      const venueList = venues.map((v: any) => `${v.name} (${v.category})`).join(', ')
      const prompt = `Create a date night recommendation:
Location: ${criteria.location}
Budget: ${criteria.budget}
Vibes: ${criteria.vibes.join(', ')}
Time: ${criteria.time}
Party Size: ${criteria.partySize}
Venues: ${venueList}

Provide JSON:
{
  "title": "Catchy title",
  "description": "Romantic description (3-4 sentences)",
  "why_perfect": "Why this combination works",
  "tips": ["3-4 practical tips"],
  "alternatives": ["2-3 backup suggestions"]
}`

      try {
        const result = await model.generateContent(prompt)
        const text = result.response.text()
        const cleaned = text.replace(/```json\n?|\n?```/g, '').trim()
        return NextResponse.json(JSON.parse(cleaned))
      } catch {
        return NextResponse.json({
          title: 'Perfect Romantic Evening',
          description: 'A carefully curated date experience',
          why_perfect: 'This combination balances romance, fun, and conversation',
          tips: ['Dress comfortably', 'Make reservations in advance'],
          alternatives: ['Indoor venues as backup']
        })
      }
    }

    if (action === 'fetch-pricing') {
      const { venues } = body

      // Generate estimate-based pricing from venue priceRange
      const generateEstimatePricing = (v: any) => {
        const multipliers: Record<string, number> = { '$': 0.7, '$$': 1.0, '$$$': 1.8, '$$$$': 3.0 }
        const mult = multipliers[v.priceRange] || 1.0
        const duration = estimateVenueDuration(v.category || 'activity', v.tags || [], v.name || '')
        if (v.category === 'dinner') {
          return { tickets: null, food: Math.round(25 * mult), drinks: Math.round(10 * mult), activities: null, packages: [], duration, source: 'estimate' }
        } else if (v.category === 'drinks') {
          return { tickets: null, food: Math.round(10 * mult), drinks: Math.round(12 * mult), activities: null, packages: [], duration, source: 'estimate' }
        } else {
          return { tickets: Math.round(20 * mult), food: Math.round(8 * mult), drinks: Math.round(6 * mult), activities: Math.round(15 * mult), packages: [], duration, source: 'estimate' }
        }
      }

      // Step 1: Try scraping real pricing from Google Place Details in parallel
      const scrapedPricing: (any | null)[] = await Promise.all(
        venues.map(async (v: any) => {
          // If venue already has scraped pricing, return it
          if (v.pricing?.source === 'scraped') return v.pricing

          // Try Google Place Details for real pricing data
          if (v.placeId || (v.id && String(v.id).startsWith('google-'))) {
            const placeId = v.placeId || String(v.id).replace('google-', '')
            try {
              const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=price_level,reviews,website&key=${GOOGLE_API_KEY}`
              const controller = new AbortController()
              const timeoutId = setTimeout(() => controller.abort(), 3000) // 3s per venue
              const res = await fetch(detailsUrl, { signal: controller.signal })
              clearTimeout(timeoutId)

              if (res.ok) {
                const data = await res.json()
                const details = data.result || {}
                const priceLevel = details.price_level || 0
                const reviews = details.reviews || []

                // Extract real dollar amounts from reviews
                const amounts: number[] = []
                for (const review of reviews) {
                  const matches = (review.text || '').match(/\$(\d+(?:\.\d{2})?)/g)
                  if (matches) {
                    for (const m of matches) {
                      const val = parseFloat(m.replace('$', ''))
                      if (val >= 5 && val <= 500) amounts.push(val)
                    }
                  }
                }
                const avgSpend = amounts.length > 0
                  ? Math.round(amounts.reduce((a: number, b: number) => a + b, 0) / amounts.length)
                  : 0
                const hasReal = avgSpend > 0
                const mult = [0.6, 0.8, 1.0, 1.5, 2.5][priceLevel] || 1.0

                const duration = estimateVenueDuration(v.category || 'activity', v.tags || [], v.name || '')
                const venueWebsite = details.website || null
                if (v.category === 'dinner') {
                  return { food: hasReal ? avgSpend : Math.round(22 * mult), drinks: hasReal ? Math.round(avgSpend * 0.4) : Math.round(10 * mult), tickets: null, activities: null, packages: [], duration, website: venueWebsite, source: hasReal ? 'scraped' : 'estimate' }
                } else if (v.category === 'drinks') {
                  return { drinks: hasReal ? avgSpend : Math.round(12 * mult), food: hasReal ? Math.round(avgSpend * 0.7) : Math.round(8 * mult), tickets: null, activities: null, packages: [], duration, website: venueWebsite, source: hasReal ? 'scraped' : 'estimate' }
                } else {
                  return { tickets: hasReal ? avgSpend : Math.round(20 * mult), food: Math.round((hasReal ? avgSpend : 15) * 0.5), drinks: Math.round((hasReal ? avgSpend : 10) * 0.4), activities: hasReal ? Math.round(avgSpend * 0.6) : Math.round(15 * mult), packages: [], duration, website: venueWebsite, source: hasReal ? 'scraped' : 'estimate' }
                }
              }
            } catch { /* scrape failed, will try AI or estimate */ }
          }
          return null // Scraping didn't work for this venue
        })
      )

      // Step 2: For venues that weren't scraped, try AI enhancement or use estimates
      const finalPricing = scrapedPricing.map((scraped, i) => {
        if (scraped) return scraped
        return null // Will be filled by AI or estimate below
      })

      // Check if all venues have pricing already
      const missingIndices = finalPricing.map((p, i) => p ? -1 : i).filter(i => i >= 0)

      if (missingIndices.length === 0) {
        return NextResponse.json({ pricing: finalPricing })
      }

      // Step 3: Use AI for missing venues if available
      if (model && missingIndices.length > 0) {
        const missingVenues = missingIndices.map(i => venues[i])
        const venueDescriptions = missingVenues.map((v: any, idx: number) =>
          `${idx + 1}. "${v.name}" (${v.category})${v.address ? ` at ${v.address}` : ''}${v.priceRange ? ` - Price range: ${v.priceRange}` : ''}`
        ).join('\n')

        const prompt = `Estimate realistic per-person pricing and typical visit duration for these venues in USD. Also provide the most likely direct booking/reservation URL for each venue.

${venueDescriptions}

For duration: estimate how long a typical visit lasts in minutes. Consider:
- Fine dining: 90-120 min, casual dining: 45-75 min
- Cocktail bars/speakeasies: 60-75 min, regular bars: 45-60 min
- Activities like bowling/TopGolf/escape rooms: 90-120 min
- Shows/concerts: 90-120 min, karaoke: 60-90 min

For bookingUrl: provide the most likely direct booking/reservation page URL. For restaurants, use their OpenTable or Resy page if known. For activities/entertainment, use their official booking page. If unknown, use null.

Return JSON array (same order):
[{"tickets": number|null, "food": number|null, "drinks": number|null, "activities": number|null, "packages": [], "duration": number, "bookingUrl": string|null, "source": "AI estimate"}]`

        try {
          const result = await model.generateContent(prompt)
          const text = result.response.text()
          const cleaned = text.replace(/```json\n?|\n?```/g, '').trim()
          const aiPricing = JSON.parse(cleaned)
          if (Array.isArray(aiPricing)) {
            missingIndices.forEach((origIdx, aiIdx) => {
              finalPricing[origIdx] = aiPricing[aiIdx] || generateEstimatePricing(venues[origIdx])
            })
          }
        } catch {
          // AI failed — fill with estimates
          missingIndices.forEach(idx => {
            finalPricing[idx] = generateEstimatePricing(venues[idx])
          })
        }
      } else {
        // No AI — fill remaining with estimates
        missingIndices.forEach(idx => {
          finalPricing[idx] = generateEstimatePricing(venues[idx])
        })
      }

      return NextResponse.json({ pricing: finalPricing })
    }

    // ─── Google Maps Directions API for routing ─────────────────────────────────────
    async function getDirectionsBetweenVenues(venues: any[]): Promise<{ [key: string]: { minutes: number; miles: number } }> {
      const results: { [key: string]: { minutes: number; miles: number } } = {}
      
      for (let i = 0; i < venues.length - 1; i++) {
        const from = venues[i]
        const to = venues[i + 1]
        
        if (from.coordinates?.lat && from.coordinates?.lng && to.coordinates?.lat && to.coordinates?.lng) {
          try {
            const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${from.coordinates.lat},${from.coordinates.lng}&destination=${to.coordinates.lat},${to.coordinates.lng}&mode=driving&key=${GOOGLE_API_KEY}`
            const res = await fetch(url)
            
            if (res.ok) {
              const data = await res.json()
              if (data.status === 'OK' && data.routes?.[0]?.legs?.[0]) {
                const leg = data.routes[0].legs[0]
                const minutes = Math.round(leg.duration.value / 60)
                const miles = leg.distance.value / 1609.34 // meters to miles
                
                results[`${i}-${i + 1}`] = { minutes, miles: Math.round(miles * 10) / 10 }
              }
            }
          } catch (error) {
            console.warn('Directions API failed for venue pair', i, i + 1)
            // Fallback to Haversine calculation
            const R = 3959 // Earth's radius in miles
            const dLat = (to.coordinates.lat - from.coordinates.lat) * Math.PI / 180
            const dLng = (to.coordinates.lng - from.coordinates.lng) * Math.PI / 180
            const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(from.coordinates.lat * Math.PI / 180) * Math.cos(to.coordinates.lat * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2)
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
            const distance = R * c
            const avgSpeed = 25 // mph city average
            const minutes = Math.round((distance / avgSpeed) * 60)
            
            results[`${i}-${i + 1}`] = { minutes, miles: Math.round(distance * 10) / 10 }
          }
        }
      }
      
      return results
    }

    // ─── Shared helpers: geocode + Google Places search + details ─────────────
    async function geocodeLocation(location: string): Promise<{ lat: number; lng: number } | null> {
      try {
        const res = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(location)}&key=${GOOGLE_API_KEY}`)
        if (!res.ok) return null
        const data = await res.json()
        const loc = data.results?.[0]?.geometry?.location
        return loc ? { lat: loc.lat, lng: loc.lng } : null
      } catch { return null }
    }

    async function searchGooglePlaces(query: string, lat: number, lng: number, radius: number = 12000): Promise<any[]> {
      try {
        const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&location=${lat},${lng}&radius=${radius}&key=${GOOGLE_API_KEY}`
        const res = await fetch(url)
        if (!res.ok) return []
        const data = await res.json()
        return data.results || []
      } catch { return [] }
    }

    async function fetchPlaceDetails(placeId: string): Promise<any> {
      try {
        const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=formatted_phone_number,website,opening_hours,reviews,photos,url,price_level,rating,user_ratings_total,editorial_summary,serves_beer,serves_wine,serves_vegetarian_food,reservable,dine_in,takeout,delivery,wheelchair_accessible_entrance,outdoor_seating,types,name,geometry&key=${GOOGLE_API_KEY}`
        const res = await fetch(url)
        if (!res.ok) return null
        const data = await res.json()
        return data.result || null
      } catch { return null }
    }

    function categorizePlace(types: string[]): 'drinks' | 'dinner' | 'activity' {
      if (types.some(t => ['bar', 'night_club'].includes(t))) return 'drinks'
      if (types.some(t => ['restaurant', 'food', 'cafe', 'bakery'].includes(t))) return 'dinner'
      return 'activity'
    }

    // Estimate visit duration in minutes based on venue category, Google types, and name
    function estimateVenueDuration(category: string, types: string[], name: string): number {
      const nameLower = name.toLowerCase()

      if (category === 'activity') {
        // Long activities (2 hrs) — immersive / time-based experiences
        if (types.some(t => ['bowling_alley', 'amusement_park', 'zoo', 'aquarium', 'museum', 'art_gallery', 'movie_theater', 'stadium', 'spa'].includes(t)) ||
            /topgolf|top golf|bowling|arcade|go.?kart|laser.?tag|escape.?room|axe.?throw|paintball|trampoline|mini.?golf|putt.?putt|driving range|batting cage|roller.?skat|ice.?skat|rock.?climb|imax|theater|theatre|cinema|zoo|aquarium|museum|spa|massage/i.test(nameLower)) {
          return 120
        }
        // Medium activities (90 min) — shows, games, tastings
        if (types.some(t => ['park', 'tourist_attraction', 'casino'].includes(t)) ||
            /karaoke|comedy|show|concert|live music|trivia|game|pool hall|billiards|darts|casino|wine tasting|brewery tour|distillery/i.test(nameLower)) {
          return 90
        }
        return 90 // default activity
      }

      if (category === 'dinner') {
        // Fine dining (2 hrs)
        if (/omakase|tasting menu|prix fixe|fine dining|michelin/i.test(nameLower)) return 120
        // Casual/fast (45 min)
        if (types.some(t => ['cafe', 'bakery', 'fast_food', 'meal_takeaway'].includes(t)) ||
            /coffee|cafe|bakery|taco|pizza|burger|pho|ramen|noodle|sandwich|deli|food truck|food hall/i.test(nameLower)) return 45
        return 75 // standard sit-down restaurant
      }

      if (category === 'drinks') {
        if (/speakeasy|cocktail lounge|wine bar|tasting/i.test(nameLower)) return 75
        return 60 // standard bar
      }

      return 75 // fallback
    }

    function convertPriceLevel(level?: number): string {
      return ['$', '$$', '$$$', '$$$$'][((level || 2) - 1)] || '$$'
    }

    function placeToVenue(place: any, details: any | null, forcedCategory?: string): any {
      const d = details || {}
      const types = place.types || d.types || []
      const photos = d.photos || place.photos || []
      const venueName = d.name || place.name
      const cat = forcedCategory || categorizePlace(types)
      return {
        id: `google-${place.place_id}`,
        name: venueName,
        category: cat,
        rating: d.rating || place.rating || 4.0,
        reviewCount: d.user_ratings_total || place.user_ratings_total || 0,
        priceRange: convertPriceLevel(d.price_level || place.price_level),
        duration: estimateVenueDuration(cat, types, venueName),
        address: place.formatted_address || d.formatted_address || '',
        phone: d.formatted_phone_number || '',
        website: d.website || '',
        imageUrl: photos.length > 0
          ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photoreference=${photos[0].photo_reference}&key=${GOOGLE_API_KEY}`
          : '',
        description: d.editorial_summary?.overview || `${place.name} — a popular spot perfect for date nights.`,
        highlights: [],
        coordinates: {
          lat: place.geometry?.location?.lat || d.geometry?.location?.lat || 0,
          lng: place.geometry?.location?.lng || d.geometry?.location?.lng || 0,
        },
        tags: types,
        features: [],
        vibe: '',
        reservable: d.reservable || false,
        wheelchairAccessible: d.wheelchair_accessible_entrance || false,
        outdoorSeating: d.outdoor_seating || false,
        photoCount: photos.length,
        photoScore: Math.min(photos.length / 10, 1.0),
      }
    }

    // Search for real venues via Google Places, optionally guided by AI search terms
    async function findRealVenues(
      location: string,
      queries: string[],
      excludeNames: string[],
      maxResults: number = 3
    ): Promise<any[]> {
      const geo = await geocodeLocation(location)
      if (!geo) return []

      const allPlaces: any[] = []
      const seenIds = new Set<string>()
      const excludeLower = excludeNames.map(n => n.toLowerCase())

      // Search with each query in parallel
      const searchResults = await Promise.all(
        queries.slice(0, 6).map(q => searchGooglePlaces(q, geo.lat, geo.lng))
      )

      for (const results of searchResults) {
        for (const place of results) {
          if (seenIds.has(place.place_id)) continue
          if (excludeLower.some(n => place.name.toLowerCase().includes(n) || n.includes(place.name.toLowerCase()))) continue
          seenIds.add(place.place_id)
          
          // Filter out venues too far from the search center (max 10 miles)
          if (place.geometry?.location) {
            const dist = haversineDistance(
              geo,
              { lat: place.geometry.location.lat, lng: place.geometry.location.lng }
            )
            if (dist > 10) continue // Skip venues more than 10 miles from search area
          }
          
          allPlaces.push(place)
        }
      }

      // Sort by rating * log(reviews) to get best venues
      allPlaces.sort((a, b) => {
        const scoreA = (a.rating || 0) * Math.log10((a.user_ratings_total || 1) + 1)
        const scoreB = (b.rating || 0) * Math.log10((b.user_ratings_total || 1) + 1)
        return scoreB - scoreA
      })

      // Fetch details for top results
      const topPlaces = allPlaces.slice(0, Math.max(maxResults * 2, 6)) // Get extra candidates
      const venues = await Promise.all(
        topPlaces.map(async (place) => {
          const details = await fetchPlaceDetails(place.place_id)
          return placeToVenue(place, details)
        })
      )

      // If returning multiple venues, enforce proximity between them
      if (maxResults > 1 && venues.length > 1) {
        return selectClusteredVenues(venues, maxResults)
      }

      return venues.slice(0, maxResults)
    }

    // Haversine distance calculation (miles)
    function haversineDistance(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
      const R = 3959 // Earth radius in miles
      const dLat = (b.lat - a.lat) * Math.PI / 180
      const dLng = (b.lng - a.lng) * Math.PI / 180
      const x = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(a.lat * Math.PI / 180) * Math.cos(b.lat * Math.PI / 180) *
        Math.sin(dLng / 2) * Math.sin(dLng / 2)
      return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x))
    }

    // Select venues that are clustered together (within ~10 miles of each other)
    function selectClusteredVenues(venues: any[], maxResults: number): any[] {
      if (venues.length <= maxResults) return venues

      // Start with the highest-rated venue as anchor
      const anchor = venues[0]
      const selected = [anchor]

      // Add remaining venues sorted by distance to anchor, but only if close enough
      const remaining = venues.slice(1)
        .map(v => ({
          venue: v,
          distToAnchor: (anchor.coordinates && v.coordinates)
            ? haversineDistance(anchor.coordinates, v.coordinates)
            : 999
        }))
        .sort((a, b) => a.distToAnchor - b.distToAnchor)

      for (const item of remaining) {
        if (selected.length >= maxResults) break
        // Only add if within 10 miles of anchor
        if (item.distToAnchor <= 10) {
          selected.push(item.venue)
        }
      }

      // If we still need more, add the closest remaining regardless of distance
      if (selected.length < maxResults) {
        for (const item of remaining) {
          if (selected.length >= maxResults) break
          if (!selected.includes(item.venue)) {
            selected.push(item.venue)
          }
        }
      }

      return selected
    }

    if (action === 'generate-venues') {
      const { location, criteria } = body
      const vibes = criteria?.vibes?.join(' ') || 'romantic'
      const budget = criteria?.budget || '$$'
      const aiModel = groundedModel || model

      // Use grounded AI to suggest search terms based on live web data
      let searchQueries = [
        `best ${vibes} restaurant ${location}`,
        `date night bar ${location}`,
        `fun things to do for couples ${location}`,
      ]

      if (aiModel) {
        try {
          const result = await aiModel.generateContent(
            `Search the web for the best date night venues in ${location}. Find real, currently operating ${vibes} venues for budget ${budget}.

IMPORTANT: All venues MUST be in the SAME neighborhood or area of ${location} so they are within walking distance or a very short drive of each other. Pick ONE specific neighborhood or district and find all venues there.

Suggest 4 specific Google Maps search queries to find these real venues (1 bar, 1 restaurant, 1 activity) all in the same area. Include the specific neighborhood name in each query.
Return JSON: {"queries": ["query1","query2","query3","query4"], "neighborhood": "name of area"}`
          )
          const text = result.response.text().replace(/```json\n?|\n?```/g, '').trim()
          const parsed = JSON.parse(text)
          if (parsed.queries) searchQueries = parsed.queries
        } catch { /* use defaults */ }
      }

      const venues = await findRealVenues(location, searchQueries, [], 3)

      // Verify venues are close together, reorder if needed
      if (venues.length >= 2) {
        const travelData = await getDirectionsBetweenVenues(venues)
        // Check if any pair is too far (>20 min drive)
        let needsReorder = false
        for (const key of Object.keys(travelData)) {
          if (travelData[key].minutes > 20) needsReorder = true
        }
        if (needsReorder && venues.length >= 3) {
          // Pick the tightest pair and find closest third
          const reordered = selectClusteredVenues(venues, 3)
          return NextResponse.json({ venues: reordered, travelTimes: travelData })
        }
        return NextResponse.json({ venues, travelTimes: travelData })
      }

      return NextResponse.json({ venues })
    }

    if (action === 'suggest-alternative') {
      const { location, criteria, currentVenue, category } = body
      const vibes = criteria?.vibes?.join(' ') || 'romantic'
      const cat = category || 'dinner'
      const excludeNames = [currentVenue?.name || '']
      const aiModel = groundedModel || model

      const typeMap: Record<string, string> = { dinner: 'restaurant', drinks: 'bar cocktail lounge', activity: 'entertainment fun' }
      let searchQueries = [
        `best ${vibes} ${typeMap[cat] || cat} ${location}`,
        `top rated ${typeMap[cat] || cat} ${location}`,
      ]

      if (aiModel) {
        try {
          const result = await aiModel.generateContent(
            `Search the web for real ${vibes} ${cat} venues in ${location} (budget ${criteria?.budget || '$$'}) that are different from "${currentVenue?.name}". Find currently open, well-reviewed places. Suggest 3 Google Maps search queries using specific venue names or neighborhoods. Return JSON: {"queries": ["q1","q2","q3"]}`
          )
          const text = result.response.text().replace(/```json\n?|\n?```/g, '').trim()
          const parsed = JSON.parse(text)
          if (parsed.queries) searchQueries = parsed.queries
        } catch { /* use defaults */ }
      }

      const venues = await findRealVenues(location, searchQueries, excludeNames, 1)
      const venue = venues[0] || null
      if (venue) venue.category = cat
      return NextResponse.json({ venue })
    }

    if (action === 'improve-plan') {
      const { location, criteria, currentVenues, feedback } = body
      const vibes = criteria?.vibes?.join(' ') || 'romantic'
      const loc = location || criteria?.location || 'the city'
      const currentPlanVenues = currentVenues || body.currentPlan || []
      const excludeNames = currentPlanVenues.map((v: any) => v.name)
      const aiModel = groundedModel || model

      // Get the center of current venues for neighborhood targeting
      let neighborhoodHint = ''
      const venuesWithCoords = currentPlanVenues.filter((v: any) => v.coordinates?.lat && v.coordinates?.lng)
      if (venuesWithCoords.length > 0) {
        const avgLat = venuesWithCoords.reduce((s: number, v: any) => s + v.coordinates.lat, 0) / venuesWithCoords.length
        const avgLng = venuesWithCoords.reduce((s: number, v: any) => s + v.coordinates.lng, 0) / venuesWithCoords.length
        neighborhoodHint = ` near coordinates ${avgLat.toFixed(4)},${avgLng.toFixed(4)}`
      }

      // Use grounded AI to generate targeted search queries from user feedback
      let searchQueries = [
        `best ${vibes} restaurant ${loc}`,
        `top ${vibes} bar ${loc}`,
        `fun date activity ${loc}`,
      ]

      if (aiModel) {
        try {
          const userFeedback = feedback || 'I want better options'
          const result = await aiModel.generateContent(
            `Search the web for date night venues in ${loc}${neighborhoodHint}. User feedback: "${userFeedback}". Vibes: ${vibes}, Budget: ${criteria?.budget || '$$'}. Current venues to avoid: ${excludeNames.join(', ') || 'none'}.

IMPORTANT: All replacement venues MUST be in the SAME neighborhood or within a short drive of each other. Do NOT suggest venues far apart. Pick a specific area and find all venues there.

Suggest 5 specific Google Maps search queries using real venue names or neighborhoods. Return JSON: {"queries": ["q1","q2","q3","q4","q5"]}`
          )
          const text = result.response.text().replace(/```json\n?|\n?```/g, '').trim()
          const parsed = JSON.parse(text)
          if (parsed.queries) searchQueries = parsed.queries
        } catch { /* use defaults */ }
      }

      const venues = await findRealVenues(loc, searchQueries, excludeNames, 3)

      // Try to assign categories: 1 dinner, 1 drinks, 1 activity
      const usedCats = new Set<string>()
      for (const v of venues) {
        if (!usedCats.has(v.category)) {
          usedCats.add(v.category)
        }
      }
      // If all same category, force-assign
      if (venues.length === 3 && usedCats.size === 1) {
        venues[0].category = 'dinner'
        venues[1].category = 'drinks'
        venues[2].category = 'activity'
      }

      // Get real travel times for the improved plan
      let travelTimes = {}
      if (venues.length >= 2) {
        travelTimes = await getDirectionsBetweenVenues(venues)
      }

      return NextResponse.json({ venues, travelTimes })
    } else if (action === 'swap-venue') {
      const { venue, criteria, currentPlan, swapCategory } = body
      const customReq = criteria?.customRequests || body.customRequests || ''
      const loc = criteria?.location || ''
      const vibes = criteria?.vibes?.join(' ') || 'romantic'
      const excludeNames = (currentPlan || []).map((v: any) => v.name)
      const aiModel = groundedModel || model

      // Find the center of OTHER venues in the plan to search near them
      const otherVenues = (currentPlan || []).filter((v: any) => v.name !== venue.name && v.coordinates?.lat && v.coordinates?.lng)
      let searchLat = 0
      let searchLng = 0
      if (otherVenues.length > 0) {
        searchLat = otherVenues.reduce((s: number, v: any) => s + v.coordinates.lat, 0) / otherVenues.length
        searchLng = otherVenues.reduce((s: number, v: any) => s + v.coordinates.lng, 0) / otherVenues.length
      }

      const typeMap: Record<string, string> = { dinner: 'restaurant', drinks: 'bar cocktail lounge', activity: 'entertainment fun' }
      let searchQueries = [
        `best ${vibes} ${typeMap[swapCategory] || swapCategory} ${loc}`,
        `top rated ${typeMap[swapCategory] || swapCategory} ${loc}`,
      ]

      // Use grounded AI to make smarter queries based on web search
      if (aiModel && (customReq || vibes)) {
        try {
          const otherNames = otherVenues.map((v: any) => v.name).join(', ')
          const result = await aiModel.generateContent(
            `Search the web for a replacement ${swapCategory} venue in ${loc} for a date night. Replacing "${venue.name}". User wants: "${customReq || 'something different'}". Vibes: ${vibes}, Budget: ${criteria?.budget || '$$'}.

IMPORTANT: The replacement MUST be CLOSE to the other date venues${otherNames ? ': ' + otherNames : ''}. Find venues in the same neighborhood or within a short drive. Do NOT suggest venues far away.

Suggest 3 Google Maps search queries using specific venue names. Return JSON: {"queries": ["q1","q2","q3"]}`
          )
          const text = result.response.text().replace(/```json\n?|\n?```/g, '').trim()
          const parsed = JSON.parse(text)
          if (parsed.queries) searchQueries = parsed.queries
        } catch { /* use defaults */ }
      }

      // If we know where the other venues are, search near them specifically
      let foundVenues: any[]
      if (searchLat && searchLng) {
        const allPlaces: any[] = []
        const seenIds = new Set<string>()
        const searchResults = await Promise.all(
          searchQueries.slice(0, 3).map(q => searchGooglePlaces(q, searchLat, searchLng, 8000))
        )
        for (const results of searchResults) {
          for (const place of results) {
            if (seenIds.has(place.place_id)) continue
            if (excludeNames.some((n: string) => place.name.toLowerCase().includes(n.toLowerCase()))) continue
            seenIds.add(place.place_id)
            // Only keep venues within 8 miles of other plan venues
            if (place.geometry?.location) {
              const dist = haversineDistance({ lat: searchLat, lng: searchLng }, { lat: place.geometry.location.lat, lng: place.geometry.location.lng })
              if (dist > 8) continue
            }
            allPlaces.push(place)
          }
        }
        allPlaces.sort((a, b) => {
          const scoreA = (a.rating || 0) * Math.log10((a.user_ratings_total || 1) + 1)
          const scoreB = (b.rating || 0) * Math.log10((b.user_ratings_total || 1) + 1)
          return scoreB - scoreA
        })
        const topPlaces = allPlaces.slice(0, 3)
        foundVenues = await Promise.all(
          topPlaces.map(async (place) => {
            const details = await fetchPlaceDetails(place.place_id)
            return placeToVenue(place, details)
          })
        )
        // Sort by distance to other venues — closest first
        foundVenues.sort((a, b) => {
          const geo = { lat: searchLat, lng: searchLng }
          const distA = a.coordinates ? haversineDistance(geo, a.coordinates) : 999
          const distB = b.coordinates ? haversineDistance(geo, b.coordinates) : 999
          return distA - distB
        })
      } else {
        foundVenues = await findRealVenues(loc, searchQueries, excludeNames, 1)
      }

      const newVenue = foundVenues[0] || null
      if (newVenue) {
        newVenue.category = swapCategory
        // Add features/highlights from grounded AI
        if (aiModel) {
          try {
            const result = await aiModel.generateContent(
              `Search the web for "${newVenue.name}" at ${newVenue.address}. Based on what you find, provide: {"highlights": ["3-4 real highlights"], "vibe": "one word vibe", "features": ["2-3 real features"]}. Be factual and use real info.`
            )
            const text = result.response.text().replace(/```json\n?|\n?```/g, '').trim()
            const extras = JSON.parse(text)
            newVenue.highlights = extras.highlights || []
            newVenue.vibe = extras.vibe || ''
            newVenue.features = extras.features || []
          } catch { /* venue is fine without extras */ }
        }
      }

      return NextResponse.json({ venue: newVenue })
    }

    // Optimize route using Google Maps Directions API
    if (action === 'optimize-route') {
      const { venues, criteria } = body
      const timePref = criteria?.time || 'prime'
      const vibes = criteria?.vibes?.join(', ') || 'romantic'

      if (!model || venues.length < 2) {
        return NextResponse.json({
          optimizedVenues: venues,
          travelTimes: {},
          totalTravelTime: 0,
          reasoning: 'Insufficient venues or AI unavailable for optimization'
        })
      }

      let currentTotalTime = 0

      try {
        // Get real travel times between all venue pairs
        const travelTimes = await getDirectionsBetweenVenues(venues)
        
        // Calculate total travel time for current order
        for (let i = 0; i < venues.length - 1; i++) {
          const travel = travelTimes[`${i}-${i + 1}`]
          if (travel) currentTotalTime += travel.minutes
        }

        // Use AI to suggest optimal ordering based on travel times and venue types
        const venueDescriptions = venues.map((v: any, i: number) => 
          `${i + 1}. ${v.name} (${v.category}) at ${v.address}`
        ).join('\n')

        const travelDescriptions = Object.entries(travelTimes)
          .map(([key, value]) => `Venue ${key}: ${value.minutes} min, ${value.miles} miles`)
          .join('\n')

        const prompt = `You are optimizing a date night route in ${criteria?.location || 'the city'} for ${vibes} vibes at ${timePref} time.

Current venues:
${venueDescriptions}

Current travel times:
${travelDescriptions}

Total current travel time: ${currentTotalTime} minutes

Please suggest the optimal order for these venues to minimize travel time and create the best flow for a date night. Consider:
1. Minimizing total travel time
2. Logical progression (activity → dinner → drinks or similar)
3. ${timePref} timing preferences
4. Creating a romantic, smooth experience

Return JSON:
{
  "optimalOrder": [0, 1, 2], // indices in optimal order
  "reasoning": "Why this order works best",
  "estimatedSavings": minutes_saved,
  "suggestedTimings": ["7:00 PM", "8:30 PM", "10:00 PM"]
}`

        const result = await model.generateContent(prompt)
        const text = result.response.text().replace(/```json\n?|\n?```/g, '').trim()
        const optimization = JSON.parse(text)

        // Apply the optimal order
        const optimizedVenues = optimization.optimalOrder.map((index: number) => venues[index])
        
        // Recalculate travel times for optimized order
        const optimizedTravelTimes = await getDirectionsBetweenVenues(optimizedVenues)
        let optimizedTotalTime = 0
        for (let i = 0; i < optimizedVenues.length - 1; i++) {
          const travel = optimizedTravelTimes[`${i}-${i + 1}`]
          if (travel) optimizedTotalTime += travel.minutes
        }

        return NextResponse.json({
          optimizedVenues,
          travelTimes: optimizedTravelTimes,
          totalTravelTime: optimizedTotalTime,
          originalTravelTime: currentTotalTime,
          timeSavings: currentTotalTime - optimizedTotalTime,
          reasoning: optimization.reasoning,
          suggestedTimings: optimization.suggestedTimings || []
        })

      } catch (error) {
        console.error('Route optimization failed:', error)
        return NextResponse.json({
          optimizedVenues: venues,
          travelTimes: await getDirectionsBetweenVenues(venues),
          totalTravelTime: currentTotalTime || 0,
          reasoning: 'Optimization failed, returned original order with real travel times'
        })
      }
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
