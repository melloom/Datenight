import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const geocodeSchema = z.object({
  lat: z.number().min(-90).max(90),
  lon: z.number().min(-180).max(180)
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const validationResult = geocodeSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json({ 
        error: 'Invalid input', 
        details: validationResult.error.errors 
      }, { status: 400 })
    }

    const { lat, lon } = validationResult.data

    // Use OpenStreetMap Nominatim API (server-side, no CORS issues)
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=18&addressdetails=1`
    
    const response = await fetch(url, {
      headers: { 'User-Agent': 'DateNightApp/1.0' }
    })

    if (!response.ok) {
      return NextResponse.json({ error: 'Geocoding failed' }, { status: 500 })
    }

    const data = await response.json()
    
    if (!data || !data.address) {
      return NextResponse.json({ error: 'No address found' }, { status: 404 })
    }

    // Process the address data
    const address = data.address
    let specificLocation = ""

    // Try to build the most specific, useful location
    if (address.neighbourhood && address.city) {
      specificLocation = `${address.neighbourhood}, ${address.city}`
    } else if (address.suburb && address.city) {
      specificLocation = `${address.suburb}, ${address.city}`
    } else if (address.city_district && address.city) {
      specificLocation = `${address.city_district}, ${address.city}`
    } else if (address.city || address.town || address.village) {
      specificLocation = address.city || address.town || address.village
    } else {
      specificLocation = data.display_name.split(',')[0]
    }

    // Add state if available and city-level location
    if (address.state && specificLocation && !specificLocation.includes(address.state)) {
      specificLocation = `${specificLocation}, ${address.state}`
    }

    return NextResponse.json({
      location: specificLocation,
      full: data.display_name,
      components: {
        neighborhood: address.neighbourhood,
        suburb: address.suburb,
        city_district: address.city_district,
        city: address.city || address.town || address.village,
        county: address.county,
        state: address.state,
        country: address.country,
        postcode: address.postcode,
        road: address.road,
        house_number: address.house_number
      }
    })

  } catch {
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
