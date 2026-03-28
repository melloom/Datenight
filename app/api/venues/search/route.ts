import { NextRequest, NextResponse } from 'next/server'

// Server-side venue search endpoint — keeps API keys secret
const GOOGLE_PLACES_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY || ''
const FOURSQUARE_CLIENT_ID = process.env.FOURSQUARE_CLIENT_ID || ''
const FOURSQUARE_CLIENT_SECRET = process.env.FOURSQUARE_CLIENT_SECRET || ''
const YELP_API_KEY = process.env.YELP_API_KEY || ''

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, lat, lng, radius, type, query, location } = body

    if (action === 'google-places') {
      if (!GOOGLE_PLACES_API_KEY || GOOGLE_PLACES_API_KEY === 'your_google_places_api_key_here') {
        return NextResponse.json({ error: 'Google Places API key not configured' }, { status: 503 })
      }

      const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=${radius}&type=${type}&key=${GOOGLE_PLACES_API_KEY}`
      const response = await fetch(url)
      const data = await response.json()
      return NextResponse.json(data)
    }

    if (action === 'google-geocode') {
      if (!GOOGLE_PLACES_API_KEY || GOOGLE_PLACES_API_KEY === 'your_google_places_api_key_here') {
        return NextResponse.json({ error: 'Google API key not configured' }, { status: 503 })
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

      const url = `https://api.yelp.com/v3/businesses/search?latitude=${lat}&longitude=${lng}&radius=${Math.min(radius, 40000)}&term=${encodeURIComponent(query || '')}&limit=20`
      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${YELP_API_KEY}` }
      })
      const data = await response.json()
      return NextResponse.json(data)
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
