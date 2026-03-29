import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const searchSchema = z.object({
  query: z.string().min(2).max(100)
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const validationResult = searchSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json({
        error: 'Invalid input',
        details: validationResult.error.errors
      }, { status: 400 })
    }

    const { query } = validationResult.data

    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&addressdetails=1`

    const response = await fetch(url, {
      headers: { 'User-Agent': 'DateNightApp/1.0' }
    })

    if (!response.ok) {
      return NextResponse.json({ error: 'Search failed' }, { status: 500 })
    }

    const data = await response.json()

    if (!Array.isArray(data)) {
      return NextResponse.json({ results: [] })
    }

    const results = data.map((item: Record<string, unknown>) => {
      const address = item.address as Record<string, string> | undefined
      let label = ''

      if (address) {
        const city = address.city || address.town || address.village || ''
        const state = address.state || ''
        const country = address.country || ''
        const neighbourhood = address.neighbourhood || address.suburb || ''

        if (neighbourhood && city) {
          label = `${neighbourhood}, ${city}`
        } else if (city) {
          label = city
        }

        if (state && !label.includes(state)) {
          label = label ? `${label}, ${state}` : state
        }

        if (country && !label.includes(country)) {
          label = label ? `${label}, ${country}` : country
        }
      }

      if (!label) {
        label = (item.display_name as string) || ''
      }

      return {
        label,
        displayName: item.display_name as string,
        lat: item.lat as string,
        lon: item.lon as string,
      }
    })

    // Deduplicate by label
    const seen = new Set<string>()
    const unique = results.filter((r: { label: string }) => {
      if (seen.has(r.label)) return false
      seen.add(r.label)
      return true
    })

    return NextResponse.json({ results: unique })

  } catch {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
