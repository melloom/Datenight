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
        if (v.category === 'dinner') {
          return { tickets: null, food: Math.round(25 * mult), drinks: Math.round(10 * mult), activities: null, packages: [], source: 'estimate' }
        } else if (v.category === 'drinks') {
          return { tickets: null, food: Math.round(10 * mult), drinks: Math.round(12 * mult), activities: null, packages: [], source: 'estimate' }
        } else {
          return { tickets: Math.round(20 * mult), food: Math.round(8 * mult), drinks: Math.round(6 * mult), activities: Math.round(15 * mult), packages: [], source: 'estimate' }
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
              const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=price_level,reviews&key=${GOOGLE_API_KEY}`
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

                if (v.category === 'dinner') {
                  return { food: hasReal ? avgSpend : Math.round(22 * mult), drinks: hasReal ? Math.round(avgSpend * 0.4) : Math.round(10 * mult), tickets: null, activities: null, packages: [], source: hasReal ? 'scraped' : 'estimate' }
                } else if (v.category === 'drinks') {
                  return { drinks: hasReal ? avgSpend : Math.round(12 * mult), food: hasReal ? Math.round(avgSpend * 0.7) : Math.round(8 * mult), tickets: null, activities: null, packages: [], source: hasReal ? 'scraped' : 'estimate' }
                } else {
                  return { tickets: hasReal ? avgSpend : Math.round(20 * mult), food: Math.round((hasReal ? avgSpend : 15) * 0.5), drinks: Math.round((hasReal ? avgSpend : 10) * 0.4), activities: hasReal ? Math.round(avgSpend * 0.6) : Math.round(15 * mult), packages: [], source: hasReal ? 'scraped' : 'estimate' }
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

        const prompt = `Estimate realistic per-person pricing for these venues in USD:

${venueDescriptions}

Return JSON array (same order):
[{"tickets": number|null, "food": number|null, "drinks": number|null, "activities": number|null, "packages": [], "source": "AI estimate"}]`

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

    async function searchGooglePlaces(query: string, lat: number, lng: number, radius: number = 16000): Promise<any[]> {
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

    function convertPriceLevel(level?: number): string {
      return ['$', '$$', '$$$', '$$$$'][((level || 2) - 1)] || '$$'
    }

    function placeToVenue(place: any, details: any | null, forcedCategory?: string): any {
      const d = details || {}
      const types = place.types || d.types || []
      const photos = d.photos || place.photos || []
      return {
        id: `google-${place.place_id}`,
        name: d.name || place.name,
        category: forcedCategory || categorizePlace(types),
        rating: d.rating || place.rating || 4.0,
        reviewCount: d.user_ratings_total || place.user_ratings_total || 0,
        priceRange: convertPriceLevel(d.price_level || place.price_level),
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
      const topPlaces = allPlaces.slice(0, maxResults)
      const venues = await Promise.all(
        topPlaces.map(async (place) => {
          const details = await fetchPlaceDetails(place.place_id)
          return placeToVenue(place, details)
        })
      )

      return venues
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
            `Search the web for the best date night venues in ${location}. Find real, currently operating ${vibes} venues for budget ${budget}. Suggest 4 specific Google Maps search queries to find these real venues (1 bar, 1 restaurant, 1 activity). Include specific venue names or neighborhoods you find. Return JSON: {"queries": ["query1","query2","query3","query4"]}`
          )
          const text = result.response.text().replace(/```json\n?|\n?```/g, '').trim()
          const parsed = JSON.parse(text)
          if (parsed.queries) searchQueries = parsed.queries
        } catch { /* use defaults */ }
      }

      const venues = await findRealVenues(location, searchQueries, [], 3)
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
      const excludeNames = (currentVenues || body.currentPlan || []).map((v: any) => v.name)
      const aiModel = groundedModel || model

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
            `Search the web for date night venues in ${loc}. User feedback: "${userFeedback}". Vibes: ${vibes}, Budget: ${criteria?.budget || '$$'}. Current venues to avoid: ${excludeNames.join(', ') || 'none'}. Find real, currently operating replacements. Suggest 5 specific Google Maps search queries using real venue names or neighborhoods you found. Return JSON: {"queries": ["q1","q2","q3","q4","q5"]}`
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

      return NextResponse.json({ venues })
    } else if (action === 'swap-venue') {
      const { venue, criteria, currentPlan, swapCategory } = body
      const customReq = criteria?.customRequests || body.customRequests || ''
      const loc = criteria?.location || ''
      const vibes = criteria?.vibes?.join(' ') || 'romantic'
      const excludeNames = (currentPlan || []).map((v: any) => v.name)
      const aiModel = groundedModel || model

      const typeMap: Record<string, string> = { dinner: 'restaurant', drinks: 'bar cocktail lounge', activity: 'entertainment fun' }
      let searchQueries = [
        `best ${vibes} ${typeMap[swapCategory] || swapCategory} ${loc}`,
        `top rated ${typeMap[swapCategory] || swapCategory} ${loc}`,
      ]

      // Use grounded AI to make smarter queries based on web search
      if (aiModel && (customReq || vibes)) {
        try {
          const result = await aiModel.generateContent(
            `Search the web for a replacement ${swapCategory} venue in ${loc} for a date night. Replacing "${venue.name}". User wants: "${customReq || 'something different'}". Vibes: ${vibes}, Budget: ${criteria?.budget || '$$'}. Find real, currently open venues. Suggest 3 Google Maps search queries using specific venue names you found. Return JSON: {"queries": ["q1","q2","q3"]}`
          )
          const text = result.response.text().replace(/```json\n?|\n?```/g, '').trim()
          const parsed = JSON.parse(text)
          if (parsed.queries) searchQueries = parsed.queries
        } catch { /* use defaults */ }
      }

      const venues = await findRealVenues(loc, searchQueries, excludeNames, 1)
      const newVenue = venues[0] || null
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

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
