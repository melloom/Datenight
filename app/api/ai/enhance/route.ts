import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || ''

function getModel() {
  if (!GEMINI_API_KEY) return null
  const genAI = new GoogleGenerativeAI(GEMINI_API_KEY)
  return genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action } = body

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
      } catch (e) {
        console.error('AI venue generation failed:', e)
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
      } catch (e) {
        console.error('AI alternative suggestion failed:', e)
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
      } catch (e) {
        console.error('AI plan improvement failed:', e)
        return NextResponse.json({ venues: [] })
      }
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('AI enhance error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
