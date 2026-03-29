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

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('AI enhance error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
