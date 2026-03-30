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
    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    if (!validationResult.success) {
      return NextResponse.json({ 
        error: 'Invalid input', 
        details: validationResult.error.errors 
      }, { status: 400 })
    }

    const model = getModel()

    if (action === 'enhance-search') {
      const { location, criteria } = body
      if (!model) {
        return NextResponse.json({
          searchTerms: ['romantic restaurants', 'date night spots', 'couples dining', 'intimate bars'],
          locationInsights: 'This area offers several romantic options perfect for date nights',
          recommendations: ['Focus on downtown area', 'Consider waterfront venues', 'Look for places with live music']
        })
      }

      const prompt = `Enhance venue search for a date night app with:
Location: ${location}
Budget: ${criteria.budget}
Desired Vibes: ${criteria.vibes.join(', ')}
Time: ${criteria.time}

Provide a JSON response with these exact keys:
{
  "searchTerms": ["5-8 specific search terms for finding venues"],
  "locationInsights": "Insights about this location for dating (2-3 sentences)",
  "recommendations": ["3-4 specific types of venues or areas to focus on"]
}

Focus on romantic, date-appropriate venues and hidden gems.`

      try {
        const result = await model.generateContent(prompt)
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
      const GOOGLE_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY || ''
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

    if (action === 'generate-venues') {
      const { location, criteria } = body
      const prompt = `You are a local expert. Suggest 3 REAL, SPECIFIC venues for a date night in ${location || 'a popular city'}.

Requirements:
- Budget: ${criteria?.budget || '$$'}
- Vibes: ${criteria?.vibes?.join(', ') || 'romantic'}
- Time: ${criteria?.time || 'prime'} (early=5-7pm, prime=7-9pm, late=9pm+)
- Party size: ${criteria?.partySize || 2}

You MUST suggest real places that actually exist. Use your knowledge of restaurants, bars, and entertainment venues.

Return a JSON array of exactly 3 venues:
[
  {
    "name": "Actual real venue name",
    "category": "drinks" or "dinner" or "activity",
    "rating": 4.0 to 4.8,
    "reviewCount": 100 to 2000,
    "priceRange": "$" or "$$" or "$$$" or "$$$$",
    "address": "Real street address, City, State",
    "phone": "Real phone if known or empty string",
    "description": "2-3 sentence description of why this place is great for dates",
    "highlights": ["3-4 specific highlights"],
    "tags": ["2-3 tags like 'cocktail bar', 'italian', 'live music'"],
    "vibe": "romantic/adventurous/chill/upscale/quirky"
  }
]

First venue should be a drinks/bar spot, second a dinner restaurant, third an activity or after-dinner spot. Be specific with real names and addresses.`

      if (!model) {
        return NextResponse.json({ venues: [] })
      }

      try {
        const result = await model.generateContent(prompt)
        const text = result.response.text()
        const cleaned = text.replace(/```json\n?|\n?```/g, '').trim()
        const venues = JSON.parse(cleaned)
        return NextResponse.json({ venues: Array.isArray(venues) ? venues : [] })
      } catch {
        return NextResponse.json({ venues: [] })
      }
    }

    if (action === 'suggest-alternative') {
      const { location, criteria, currentVenue, category } = body
      const prompt = `Suggest ONE alternative REAL venue to replace "${currentVenue?.name || 'the current venue'}" for a date night in ${location || 'a popular city'}.

The current venue is a ${category || 'dinner'} spot. Suggest something DIFFERENT but still great.

Requirements:
- Budget: ${criteria?.budget || '$$'}
- Vibes: ${criteria?.vibes?.join(', ') || 'romantic'}
- Category must be: ${category || 'dinner'}

Return a single JSON object (NOT an array):
{
  "name": "Real venue name",
  "category": "${category || 'dinner'}",
  "rating": 4.0 to 4.8,
  "reviewCount": 100 to 2000,
  "priceRange": "${criteria?.budget || '$$'}",
  "address": "Real address, City, State",
  "phone": "",
  "description": "2-3 sentences about why this is better/different",
  "highlights": ["3-4 highlights"],
  "tags": ["2-3 tags"],
  "vibe": "${criteria?.vibes?.[0] || 'romantic'}"
}

Be specific with a real venue name and address.`

      if (!model) {
        return NextResponse.json({ venue: null })
      }

      try {
        const result = await model.generateContent(prompt)
        const text = result.response.text()
        const cleaned = text.replace(/```json\n?|\n?```/g, '').trim()
        const venue = JSON.parse(cleaned)
        return NextResponse.json({ venue })
      } catch {
        return NextResponse.json({ venue: null })
      }
    }

    if (action === 'improve-plan') {
      const { location, criteria, currentVenues, feedback } = body
      const venueList = currentVenues?.map((v: any) => `${v.name} (${v.category})`).join(', ') || 'none'
      const prompt = `A user wants to improve their date night plan in ${location || 'their city'}.

Current plan: ${venueList}
User feedback: "${feedback || 'I want better options'}"
Budget: ${criteria?.budget || '$$'}
Vibes: ${criteria?.vibes?.join(', ') || 'romantic'}
Time: ${criteria?.time || 'prime'}

Suggest 3 REAL, SPECIFIC replacement venues that address the user's feedback. Each must be a real place.

Return JSON array:
[
  {
    "name": "Real venue name",
    "category": "drinks" or "dinner" or "activity",
    "rating": 4.0 to 4.8,
    "reviewCount": 100 to 2000,
    "priceRange": "${criteria?.budget || '$$'}",
    "address": "Real address, City, State",
    "phone": "",
    "description": "Why this is a better choice based on the feedback",
    "highlights": ["3-4 highlights"],
    "tags": ["2-3 tags"],
    "vibe": "${criteria?.vibes?.[0] || 'romantic'}"
  }
]`

      if (!model) {
        return NextResponse.json({ venues: [] })
      }

      try {
        const result = await model.generateContent(prompt)
        const text = result.response.text()
        const cleaned = text.replace(/```json\n?|\n?```/g, '').trim()
        const venues = JSON.parse(cleaned)
        return NextResponse.json({ venues: Array.isArray(venues) ? venues : [] })
      } catch {
        return NextResponse.json({ venues: [] })
      }
    } else if (action === 'swap-venue') {
      const { venue, criteria, currentPlan, swapCategory, customRequests } = body
      
      if (!model) {
        // Fallback: return a generic alternative venue
        return NextResponse.json({
          venue: {
            id: `fallback-${Date.now()}`,
            name: `Alternative ${swapCategory} venue`,
            category: swapCategory,
            address: criteria.location,
            rating: 4.2,
            reviewCount: 150,
            priceRange: criteria.budget,
            description: `A great ${swapCategory} option that matches your preferences.`,
            highlights: ['Good alternative', 'Matches your criteria'],
            coordinates: { lat: 0, lng: 0 }
          }
        })
      }

      const currentVenueNames = currentPlan.map((v: any) => v.name).join(', ')
      
      const prompt = `Find a replacement venue for a date night app with these details:

Current venue to replace: ${venue.name} (${venue.category})
Category needed: ${swapCategory}
Location: ${criteria.location}
Budget: ${criteria.budget}
Vibes: ${criteria.vibes.join(', ')}
Time: ${criteria.time}
Party size: ${criteria.partySize}
Custom request: ${customRequests || 'No specific request'}
Current venues in plan: ${currentVenueNames}

Provide a JSON response with this exact structure:
{
  "venue": {
    "id": "unique-id",
    "name": "venue name",
    "category": "${swapCategory}",
    "address": "full address",
    "rating": 4.5,
    "reviewCount": 200,
    "priceRange": "${criteria.budget}",
    "description": "detailed description of the venue",
    "highlights": ["highlight 1", "highlight 2", "highlight 3"],
    "coordinates": { "lat": 39.2904, "lng": -76.6122 }
  }
}

Requirements:
- Must be different from all current venues: ${currentVenueNames}
- Must match the ${swapCategory} category
- Must be in or near ${criteria.location}
- Must fit the ${criteria.budget} budget
- Should match the custom request: "${customRequests || 'none'}"
- Must be suitable for a romantic date night
- Must be a real, existing venue if possible`

      try {
        const result = await model.generateContent(prompt)
        const text = result.response.text()
        const cleaned = text.replace(/```json\n?|\n?```/g, '').trim()
        const response = JSON.parse(cleaned)
        return NextResponse.json(response)
      } catch {
        return NextResponse.json({
          venue: {
            id: `fallback-${Date.now()}`,
            name: `Alternative ${swapCategory} venue`,
            category: swapCategory,
            address: criteria.location,
            rating: 4.0,
            reviewCount: 100,
            priceRange: criteria.budget,
            description: `A ${swapCategory} venue that matches your preferences.`,
            highlights: ['Good alternative'],
            coordinates: { lat: 0, lng: 0 }
          }
        })
      }
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
