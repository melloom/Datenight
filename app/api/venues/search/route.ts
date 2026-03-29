import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { sanitizeForSearch } from '@/lib/profanity-filter'

// Server-side venue search endpoint — keeps API keys secret
const GOOGLE_PLACES_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY || ''
const FOURSQUARE_CLIENT_ID = process.env.FOURSQUARE_CLIENT_ID || ''
const FOURSQUARE_CLIENT_SECRET = process.env.FOURSQUARE_CLIENT_SECRET || ''
const YELP_API_KEY = process.env.YELP_API_KEY || ''

const venueSearchSchema = z.object({
  action: z.enum(['google-places', 'google-text-search', 'google-geocode', 'google-place-details', 'foursquare', 'yelp', 'overpass']),
  lat: z.number().min(-90).max(90).optional(),
  lng: z.number().min(-180).max(180).optional(),
  radius: z.number().min(1).max(50000).optional(),
  type: z.string().max(100).optional(),
  query: z.string().max(500).optional(),
  keyword: z.string().max(200).optional(),
  location: z.string().max(200).optional(),
  placeId: z.string().max(200).optional()
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const validationResult = venueSearchSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json({ 
        error: 'Invalid input', 
        details: validationResult.error.errors 
      }, { status: 400 })
    }

    const { action, lat, lng, radius, type, location } = validationResult.data
    // Server-side sanitization of user-provided text fields
    const query = sanitizeForSearch(validationResult.data.query || '') || validationResult.data.query
    const keyword = validationResult.data.keyword ? sanitizeForSearch(validationResult.data.keyword) : undefined

    if (action === 'google-places') {
      if (!GOOGLE_PLACES_API_KEY || GOOGLE_PLACES_API_KEY === 'your_google_places_api_key_here') {
        return NextResponse.json({ error: 'Google Places API key not configured' }, { status: 503 })
      }

      const keywordParam = keyword ? `&keyword=${encodeURIComponent(keyword)}` : ''
      const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=${radius}&type=${type}${keywordParam}&key=${GOOGLE_PLACES_API_KEY}`
      const response = await fetch(url)
      const data = await response.json()
      return NextResponse.json(data)
    }

    if (action === 'google-text-search') {
      if (!GOOGLE_PLACES_API_KEY || GOOGLE_PLACES_API_KEY === 'your_google_places_api_key_here') {
        return NextResponse.json({ error: 'Google Places API key not configured' }, { status: 503 })
      }

      if (!query) {
        return NextResponse.json({ error: 'Query is required for text search' }, { status: 400 })
      }

      const locationParam = lat && lng ? `&location=${lat},${lng}&radius=${radius || 16000}` : ''
      const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}${locationParam}&key=${GOOGLE_PLACES_API_KEY}`
      const response = await fetch(url)
      const data = await response.json()
      return NextResponse.json(data)
    }

    if (action === 'google-geocode') {
      if (!GOOGLE_PLACES_API_KEY || GOOGLE_PLACES_API_KEY === 'your_google_places_api_key_here') {
        return NextResponse.json({ error: 'Google API key not configured' }, { status: 503 })
      }

      if (!location) {
        return NextResponse.json({ error: 'Location is required for geocoding' }, { status: 400 })
      }

      const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(location)}&key=${GOOGLE_PLACES_API_KEY}`
      const response = await fetch(url)
      const data = await response.json()
      return NextResponse.json(data)
    }

    if (action === 'google-place-details') {
      if (!GOOGLE_PLACES_API_KEY) {
        return NextResponse.json({ error: 'Google API key not configured' }, { status: 503 })
      }

      const { placeId } = body
      const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=formatted_phone_number,website,opening_hours,reviews,photos,url&key=${GOOGLE_PLACES_API_KEY}`
      const response = await fetch(url)
      const data = await response.json()
      return NextResponse.json(data)
    }

    if (action === 'foursquare') {
      if (!FOURSQUARE_CLIENT_ID || FOURSQUARE_CLIENT_ID === 'demo-client-id') {
        return NextResponse.json({ error: 'Foursquare API not configured' }, { status: 503 })
      }

      const url = `https://api.foursquare.com/v2/venues/search?ll=${lat},${lng}&radius=${radius}&query=${encodeURIComponent(query || '')}&client_id=${FOURSQUARE_CLIENT_ID}&client_secret=${FOURSQUARE_CLIENT_SECRET}&v=20231001`
      const response = await fetch(url)
      const data = await response.json()
      return NextResponse.json(data)
    }

    if (action === 'yelp') {
      if (!YELP_API_KEY || YELP_API_KEY === 'your_yelp_api_key_here') {
        return NextResponse.json({ error: 'Yelp API not configured' }, { status: 503 })
      }

      if (radius === undefined) {
        return NextResponse.json({ error: 'Radius is required for Yelp search' }, { status: 400 })
      }

      const url = `https://api.yelp.com/v3/businesses/search?latitude=${lat}&longitude=${lng}&radius=${Math.min(radius, 40000)}&term=${encodeURIComponent(query || '')}&limit=20`
      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${YELP_API_KEY}` }
      })
      const data = await response.json()
      return NextResponse.json(data)
    }

    if (action === 'overpass') {
      const { query: overpassQuery } = body
      if (!overpassQuery) {
        return NextResponse.json({ error: 'Missing overpass query' }, { status: 400 })
      }

      const response = await fetch('https://overpass-api.de/api/interpreter', {
        method: 'POST',
        body: `data=${encodeURIComponent(overpassQuery)}`,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': 'DateNightApp/1.0'
        }
      })

      if (!response.ok) {
        return NextResponse.json({ error: `Overpass API error: ${response.status}` }, { status: response.status })
      }

      const text = await response.text()
      try {
        const data = JSON.parse(text)
        return NextResponse.json(data)
      } catch {
        return NextResponse.json({ error: 'Invalid JSON from Overpass' }, { status: 502 })
      }
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })

  } catch (error) {
    console.error('Venue search API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}
