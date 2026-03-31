import { Metadata } from 'next'
import SharedItinerary from './shared-itinerary'

const DATABASE_URL = process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL

// Fetch shared plan data for metadata generation
async function getSharedData(shareId: string) {
  if (!DATABASE_URL) return null
  try {
    const res = await fetch(`${DATABASE_URL}/shared/${shareId}.json`, {
      next: { revalidate: 60 },
    })
    if (!res.ok) return null
    return await res.json()
  } catch {
    return null
  }
}

export async function generateMetadata({ params }: { params: Promise<{ shareId: string }> }): Promise<Metadata> {
  const { shareId } = await params
  const data = await getSharedData(shareId)

  if (!data || !data.venues) {
    return {
      title: 'Date Night Plan',
      description: 'Check out this date night plan!',
    }
  }

  const venueNames = data.venues.map((v: any) => v.name).filter(Boolean)
  const location = data.location || ''
  const vibes = (data.vibes || []).join(', ')
  const plannedDate = data.plannedDate
    ? new Date(data.plannedDate).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
    : ''

  const title = `Date Night in ${location}`
  const description = venueNames.length > 0
    ? `${venueNames.join(' → ')} — ${vibes} vibes${plannedDate ? ` on ${plannedDate}` : ''}`
    : `A curated date night plan in ${location}`

  // Build dynamic OG image URL with venue names, location, vibes
  const ogParams = new URLSearchParams({
    title: `Date Night in ${location}`,
    location,
    vibes: vibes,
    venues: venueNames.slice(0, 3).join('|'),
    date: plannedDate,
  })

  return {
    title,
    description,
    openGraph: {
      type: 'article',
      title,
      description,
      siteName: 'Date Night Planner',
      images: [
        {
          url: `/api/og?${ogParams.toString()}`,
          width: 1200,
          height: 630,
          alt: title,
          type: 'image/png',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [`/api/og?${ogParams.toString()}`],
    },
  }
}

export default async function SharedItineraryPage({ params }: { params: Promise<{ shareId: string }> }) {
  const { shareId } = await params
  return <SharedItinerary shareId={shareId} />
}
