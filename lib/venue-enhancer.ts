// Enhanced venue scraper utilities — vibe extraction, hours validation,
// clustering, reservations, dietary, accessibility, social media, weather, crowd levels
import { Venue, SearchCriteria } from './venue-search'

// ─── #3: Vibe extraction from reviews ───────────────────────────────────────

const VIBE_KEYWORDS: Record<string, string[]> = {
  romantic: ['romantic', 'intimate', 'candlelit', 'cozy date', 'date night', 'couples', 'love', 'anniversary', 'valentine'],
  trendy: ['trendy', 'hip', 'modern', 'chic', 'stylish', 'instagrammable', 'aesthetic', 'buzzy', 'hotspot'],
  chill: ['chill', 'relaxed', 'laid-back', 'casual', 'comfortable', 'easy-going', 'mellow', 'low-key'],
  upscale: ['upscale', 'elegant', 'fine dining', 'luxurious', 'sophisticated', 'classy', 'high-end', 'premium'],
  adventurous: ['adventurous', 'exciting', 'unique', 'thrilling', 'one-of-a-kind', 'wild', 'fun', 'energetic'],
  lively: ['lively', 'loud', 'energetic', 'party', 'dancing', 'crowded', 'vibrant', 'bustling'],
  cozy: ['cozy', 'warm', 'homey', 'comfort food', 'fireplace', 'snug', 'inviting', 'charming'],
  artsy: ['artsy', 'creative', 'artistic', 'gallery', 'bohemian', 'eclectic', 'quirky'],
  outdoor: ['outdoor', 'patio', 'rooftop', 'garden', 'terrace', 'al fresco', 'open air', 'scenic'],
  quiet: ['quiet', 'peaceful', 'serene', 'calm', 'tranquil', 'secluded', 'private']
}

export function extractVibeFromReviews(reviews: any[]): { vibeTags: string[]; vibeScores: Record<string, number> } {
  const scores: Record<string, number> = {}
  const allText = reviews.map(r => (r.text || '').toLowerCase()).join(' ')

  for (const [vibe, keywords] of Object.entries(VIBE_KEYWORDS)) {
    let count = 0
    for (const kw of keywords) {
      const matches = allText.split(kw).length - 1
      count += matches
    }
    if (count > 0) {
      scores[vibe] = Math.min(count / (reviews.length || 1), 1.0)
    }
  }

  const vibeTags = Object.entries(scores)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([tag]) => tag)

  return { vibeTags, vibeScores: scores }
}

export function calculateVibeMatch(vibeTags: string[], userVibes: string[]): number {
  if (!userVibes.length || !vibeTags.length) return 0.5
  const normalizedUser = userVibes.map(v => v.toLowerCase().replace('custom:', ''))
  const matches = vibeTags.filter(tag => normalizedUser.some(uv => tag.includes(uv) || uv.includes(tag)))
  return Math.min(matches.length / Math.max(normalizedUser.length, 1), 1.0)
}

// ─── #2: Hours validation ───────────────────────────────────────────────────

export function isOpenAtTime(openingHours: any, plannedDate?: Date, plannedTime?: string): boolean {
  if (!openingHours?.periods) return true // Assume open if no data

  const targetDate = plannedDate || new Date()
  const dayOfWeek = targetDate.getDay() // 0=Sunday

  // Parse planned time or use time from criteria
  let targetHour = 19 // default 7PM
  let targetMinute = 0
  if (plannedTime) {
    const parts = plannedTime.split(':')
    targetHour = parseInt(parts[0]) || 19
    targetMinute = parseInt(parts[1]) || 0
  }

  const targetMinutes = targetHour * 60 + targetMinute

  for (const period of openingHours.periods) {
    if (!period.open) continue

    const openDay = period.open.day
    const closeDay = period.close?.day ?? openDay

    // Check if the planned day matches this period
    if (openDay === dayOfWeek || (openDay < closeDay && dayOfWeek >= openDay && dayOfWeek <= closeDay)) {
      const openMinutes = (period.open.hours || 0) * 60 + (period.open.minutes || 0)
      const closeMinutes = period.close
        ? (period.close.hours || 0) * 60 + (period.close.minutes || 0)
        : 24 * 60

      // Handle overnight hours (e.g. open 6PM close 2AM)
      if (closeMinutes < openMinutes) {
        // Overnight: open from openMinutes to midnight OR midnight to closeMinutes
        if (targetMinutes >= openMinutes || targetMinutes <= closeMinutes) return true
      } else {
        if (targetMinutes >= openMinutes && targetMinutes <= closeMinutes) return true
      }
    }
  }

  return false
}

// ─── #4: Nearby venue clustering ────────────────────────────────────────────

export function clusterNearbyVenues(venues: Venue[], maxMiles: number = 0.5): Venue[][] {
  const clusters: Venue[][] = []
  const assigned = new Set<string>()

  for (const venue of venues) {
    if (assigned.has(venue.id)) continue

    const cluster: Venue[] = [venue]
    assigned.add(venue.id)

    for (const other of venues) {
      if (assigned.has(other.id)) continue
      const dist = haversine(venue.coordinates, other.coordinates)
      if (dist <= maxMiles) {
        cluster.push(other)
        assigned.add(other.id)
      }
    }

    clusters.push(cluster)
  }

  // Sort clusters by size (largest first) then by avg rating
  return clusters.sort((a, b) => {
    if (b.length !== a.length) return b.length - a.length
    const avgA = a.reduce((s, v) => s + v.rating, 0) / a.length
    const avgB = b.reduce((s, v) => s + v.rating, 0) / b.length
    return avgB - avgA
  })
}

// Try multiple radius tiers to find the tightest cluster with category diversity
export function findBestCluster(venues: Venue[]): { cluster: Venue[]; radius: number } {
  // Radius tiers: walkable → short drive → moderate drive
  const radiusTiers = [
    { radius: 0.5, label: 'walkable' },      // ~10 min walk
    { radius: 1.0, label: 'very close' },     // ~3 min drive
    { radius: 2.0, label: 'short drive' },    // ~5 min drive
    { radius: 5.0, label: 'moderate drive' }, // ~12 min drive
    { radius: 8.0, label: 'drive' },          // ~20 min drive
  ]

  for (const tier of radiusTiers) {
    const clusters = clusterNearbyVenues(venues, tier.radius)

    // Look for a cluster that has at least 2 category types and 3+ venues
    for (const cluster of clusters) {
      const categories = new Set(cluster.map(v => v.category))
      if (categories.size >= 2 && cluster.length >= 3) {
        return { cluster, radius: tier.radius }
      }
    }

    // Accept a cluster with 2+ venues and 2+ categories at this tier
    for (const cluster of clusters) {
      const categories = new Set(cluster.map(v => v.category))
      if (categories.size >= 2 && cluster.length >= 2) {
        return { cluster, radius: tier.radius }
      }
    }
  }

  // Fallback: return all venues
  return { cluster: venues, radius: 999 }
}

export function preferClusteredVenues(venues: Venue[], criteria: SearchCriteria): Venue[] {
  if (venues.length <= 3) return venues

  // Find the tightest cluster with category diversity across multiple radius tiers
  const { cluster, radius } = findBestCluster(venues)

  // If we found a good cluster, strongly prefer those venues
  if (cluster.length >= 2) {
    const remaining = venues.filter(v => !cluster.includes(v))

    // Within the cluster, sort by category diversity + rating
    const sortedCluster = [...cluster].sort((a, b) => {
      // Prefer different categories first
      const catOrder: Record<string, number> = { dinner: 0, drinks: 1, activity: 2 }
      const catDiff = (catOrder[a.category] ?? 1) - (catOrder[b.category] ?? 1)
      if (catDiff !== 0) return catDiff
      return (b.rating || 0) - (a.rating || 0)
    })

    // Put clustered venues first, then remaining sorted by distance to cluster center
    if (sortedCluster.length > 0 && sortedCluster[0].coordinates) {
      const center = sortedCluster[0].coordinates
      remaining.sort((a, b) => {
        const distA = a.coordinates ? haversine(center, a.coordinates) : 999
        const distB = b.coordinates ? haversine(center, b.coordinates) : 999
        return distA - distB
      })
    }

    return [...sortedCluster, ...remaining]
  }

  return venues
}

// ─── #6: Photo quality scoring ──────────────────────────────────────────────

export function calculatePhotoScore(photos: any[] | undefined): { photoCount: number; photoScore: number } {
  if (!photos || photos.length === 0) return { photoCount: 0, photoScore: 0 }
  // More photos = higher quality signal. Cap at 10 for max score.
  const count = photos.length
  const score = Math.min(count / 10, 1.0)
  return { photoCount: count, photoScore: score }
}

// ─── #8: Seasonal/weather awareness ─────────────────────────────────────────

export function calculateSeasonalFit(venue: Venue, criteria: SearchCriteria): number {
  const now = new Date()
  const month = now.getMonth() // 0-11
  const isWinter = month >= 11 || month <= 2
  const isSummer = month >= 5 && month <= 8
  const isOutdoor = venue.outdoorSeating || venue.features?.some(f =>
    /outdoor|patio|rooftop|garden|terrace|park/i.test(f)
  )
  const tags = (venue.tags || []).join(' ').toLowerCase()
  const isOutdoorVenue = isOutdoor || /park|garden|beach|waterfront|boardwalk/i.test(tags)

  let score = 0.7 // neutral default

  if (isOutdoorVenue) {
    if (isSummer) score = 1.0  // Outdoor venues great in summer
    else if (isWinter) score = 0.3  // Outdoor venues bad in winter
    else score = 0.7  // Spring/fall neutral
  } else {
    // Indoor venues — always decent, slightly better in winter
    if (isWinter) score = 0.9
    else score = 0.7
  }

  // Holiday boosting
  const holiday = criteria.holiday
  if (holiday === 'valentine' && venue.vibe?.includes('romantic')) score = Math.min(score + 0.2, 1.0)
  if (holiday === 'halloween' && /haunted|spooky|theme/i.test(tags)) score = Math.min(score + 0.3, 1.0)
  if (holiday === 'christmas' && /holiday|festive|christmas|winter/i.test(tags)) score = Math.min(score + 0.3, 1.0)

  return score
}

// ─── #9: Reservation link generation ────────────────────────────────────────

// Known activity chains with direct booking URLs
const KNOWN_ACTIVITY_CHAINS: Record<string, string> = {
  'topgolf': 'https://topgolf.com/us/book/',
  'top golf': 'https://topgolf.com/us/book/',
  'main event': 'https://www.mainevent.com/book-an-event',
  "dave & buster's": 'https://www.daveandbusters.com/reservations',
  "dave and buster's": 'https://www.daveandbusters.com/reservations',
  'bowlero': 'https://www.bowlero.com/reservations',
  'amf': 'https://www.amf.com/reservations',
  'ifly': 'https://www.iflyworld.com/book/',
  'andretti': 'https://andrettikarting.com/book-now',
  'k1 speed': 'https://www.k1speed.com/book-now.html',
  'pinstripes': 'https://pinstripes.com/reservations/',
  'punch bowl social': 'https://www.punchbowlsocial.com/reservations',
  'escapology': 'https://www.escapology.com/en/book-now',
  'breakout games': 'https://breakoutgames.com/book/',
  'chicken n pickle': 'https://chickennpickle.com/reservations/',
  'lucky strike': 'https://www.luckystrikesocial.com/book-an-event',
  'splitsville': 'https://www.splitsvillelanes.com/reserve',
  'the escape game': 'https://theescapegame.com/book/',
  'urban air': 'https://www.urbanair.com/book-a-party',
  'sky zone': 'https://www.skyzone.com/book',
  'surge': 'https://surgetrampolinepark.com/book/',
}

export function generateReservationLinks(venue: Venue): { url: string; platform: string }[] {
  const links: { url: string; platform: string }[] = []
  const encodedName = encodeURIComponent(venue.name)
  const encodedAddr = encodeURIComponent(venue.address || '')

  if (venue.category === 'dinner' || venue.category === 'drinks') {
    // Restaurant/bar reservation links
    links.push({ url: `https://www.opentable.com/s?term=${encodedName}&covers=2`, platform: 'OpenTable' })
    const citySlug = (venue.address || '').split(',').map(p => p.trim().toLowerCase().replace(/\s+/g, '-')).find(p => p.length > 2 && !/^\d/.test(p)) || 'ny'
    links.push({ url: `https://resy.com/cities/${citySlug}?query=${encodedName}`, platform: 'Resy' })
    links.push({ url: `https://www.yelp.com/search?find_desc=${encodedName}&find_loc=${encodedAddr}`, platform: 'Yelp' })
  } else if (venue.category === 'activity') {
    // Check for known activity chains first
    const nameLower = venue.name.toLowerCase()
    let chainUrl: string | null = null
    for (const [chain, url] of Object.entries(KNOWN_ACTIVITY_CHAINS)) {
      if (nameLower.includes(chain)) {
        chainUrl = url
        links.push({ url, platform: 'Book Activity' })
        break
      }
    }

    // Venue website as primary booking link (if not already a chain link)
    if (!chainUrl && venue.website) {
      links.push({ url: venue.website, platform: 'Book Activity' })
    }

    // Eventbrite search for activities/entertainment
    links.push({ url: `https://www.eventbrite.com/d/nearby/events/?q=${encodedName}`, platform: 'Eventbrite' })

    // Google search for booking as fallback
    if (!chainUrl && !venue.website) {
      links.push({ url: `https://www.google.com/search?q=${encodedName}+book+tickets`, platform: 'Find Tickets' })
    }
  }

  // Venue website for all categories (if not already added as primary)
  if (venue.website && venue.category !== 'activity') {
    links.push({ url: venue.website, platform: 'Website' })
  }

  // Google Maps link for all venues
  if (venue.coordinates) {
    links.push({
      url: `https://www.google.com/maps/search/?api=1&query=${venue.coordinates.lat},${venue.coordinates.lng}&query_place_id=${venue.id.replace('google-', '')}`,
      platform: 'Google Maps'
    })
  }

  return links
}

// ─── #10: Crowd level estimation ────────────────────────────────────────────

export function estimateCrowdLevel(venue: Venue, criteria: SearchCriteria): 'quiet' | 'moderate' | 'busy' | 'packed' {
  const time = criteria.time
  const dayOfWeek = criteria.dayOfWeek?.toLowerCase() || new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase()
  const isWeekend = dayOfWeek === 'friday' || dayOfWeek === 'saturday'
  const isPopular = venue.reviewCount > 500

  // Base level from time
  let level = 1 // 0=quiet, 1=moderate, 2=busy, 3=packed

  if (time === 'prime') level = 2
  else if (time === 'late') level = isWeekend ? 3 : 2
  else level = 1

  // Popularity boost
  if (isPopular) level = Math.min(level + 1, 3)
  if (isWeekend && time !== 'early') level = Math.min(level + 1, 3)

  // Rating boost (very high rated = busier)
  if (venue.rating >= 4.7) level = Math.min(level + 1, 3)

  const levels: ('quiet' | 'moderate' | 'busy' | 'packed')[] = ['quiet', 'moderate', 'busy', 'packed']
  return levels[Math.min(level, 3)]
}

export function suggestBestTimes(venue: Venue): string[] {
  const times: string[] = []
  if (venue.category === 'dinner') {
    times.push('5:30-6:30 PM (early bird, less crowded)')
    times.push('8:30-9:30 PM (prime time, make reservations)')
  } else if (venue.category === 'drinks') {
    times.push('5:00-6:00 PM (happy hour)')
    times.push('8:00-9:00 PM (pre-dinner drinks)')
  } else {
    times.push('Open - 2:00 PM (morning/early afternoon)')
    times.push('4:00-6:00 PM (late afternoon)')
  }
  return times
}

// ─── #12: Dietary/allergy filtering ─────────────────────────────────────────

const DIETARY_KEYWORDS: Record<string, string[]> = {
  'vegan': ['vegan', 'plant-based', 'plant based'],
  'vegetarian': ['vegetarian', 'veggie', 'meatless'],
  'gluten-free': ['gluten-free', 'gluten free', 'celiac'],
  'halal': ['halal'],
  'kosher': ['kosher'],
  'dairy-free': ['dairy-free', 'dairy free', 'lactose'],
  'nut-free': ['nut-free', 'nut free', 'peanut free'],
  'keto': ['keto', 'low-carb', 'low carb']
}

export function extractDietaryOptions(reviews: any[], servesVegetarian?: boolean): string[] {
  const options: string[] = []
  const allText = reviews.map(r => (r.text || '').toLowerCase()).join(' ')

  for (const [diet, keywords] of Object.entries(DIETARY_KEYWORDS)) {
    if (keywords.some(kw => allText.includes(kw))) {
      options.push(diet)
    }
  }

  if (servesVegetarian && !options.includes('vegetarian')) {
    options.push('vegetarian')
  }

  return options
}

// ─── #13: Accessibility info ────────────────────────────────────────────────

export function extractAccessibilityInfo(details: any, reviews: any[]): { wheelchairAccessible: boolean; parkingAvailable: boolean } {
  let wheelchair = details.wheelchair_accessible_entrance || false
  let parking = false

  const allText = reviews.map(r => (r.text || '').toLowerCase()).join(' ')

  if (!wheelchair && allText.includes('wheelchair')) wheelchair = true
  if (allText.includes('accessible') && !allText.includes('not accessible')) wheelchair = true
  if (allText.includes('parking') || allText.includes('valet')) parking = true
  if (allText.includes('garage')) parking = true

  return { wheelchairAccessible: wheelchair, parkingAvailable: parking }
}

// ─── #14: Social media presence ─────────────────────────────────────────────

export function detectSocialMedia(website: string | undefined, reviews: any[]): { platform: string; url: string }[] {
  const social: { platform: string; url: string }[] = []

  // Check website URL for social links
  const allText = [website || '', ...reviews.map(r => r.text || '')].join(' ')

  const patterns: { platform: string; regex: RegExp }[] = [
    { platform: 'Instagram', regex: /instagram\.com\/([a-zA-Z0-9_.]+)/i },
    { platform: 'Facebook', regex: /facebook\.com\/([a-zA-Z0-9_.]+)/i },
    { platform: 'TikTok', regex: /tiktok\.com\/@?([a-zA-Z0-9_.]+)/i },
    { platform: 'Twitter', regex: /(?:twitter|x)\.com\/([a-zA-Z0-9_]+)/i }
  ]

  for (const { platform, regex } of patterns) {
    const match = allText.match(regex)
    if (match) {
      social.push({ platform, url: match[0] })
    }
  }

  // If venue has a website, it likely has social presence
  if (website && social.length === 0) {
    // Generate likely Instagram search
    social.push({
      platform: 'Instagram',
      url: `https://www.instagram.com/explore/tags/${encodeURIComponent(website.replace(/https?:\/\/(www\.)?/, '').split('/')[0].replace(/\./g, ''))}`
    })
  }

  return social
}

// ─── #11: Cross-reference Yelp (via search URL generation) ──────────────────

export function generateYelpSearchUrl(venue: Venue): string {
  return `https://www.yelp.com/search?find_desc=${encodeURIComponent(venue.name)}&find_loc=${encodeURIComponent(venue.address || '')}`
}

// ─── Master enhancer: apply all enhancements to a venue ─────────────────────

export function enhanceVenueWithScrapedData(venue: Venue, details: any, criteria: SearchCriteria): Venue {
  const reviews = details.reviews || []
  const photos = details.photos || []

  // #3: Vibe extraction
  const { vibeTags, vibeScores } = extractVibeFromReviews(reviews)
  const vibeScore = calculateVibeMatch(vibeTags, criteria.vibes || [])
  const vibeString = vibeTags.slice(0, 3).join(', ')

  // #2: Hours validation
  const timeMapping: Record<string, string> = { early: '17:30', prime: '19:30', late: '21:30' }
  const plannedTime = criteria.plannedTime || timeMapping[criteria.time] || '19:30'
  const isOpen = isOpenAtTime(details.current_opening_hours || details.opening_hours, criteria.plannedDate, plannedTime)

  // #6: Photo scoring
  const { photoCount, photoScore } = calculatePhotoScore(photos)

  // #8: Seasonal fit
  const seasonalFit = calculateSeasonalFit(venue, criteria)

  // #9: Reservation links
  const reservationLinks = generateReservationLinks(venue)

  // #10: Crowd level
  const crowdLevel = estimateCrowdLevel(venue, criteria)
  const bestTimes = suggestBestTimes(venue)

  // #12: Dietary options
  const dietaryOptions = extractDietaryOptions(reviews, details.serves_vegetarian_food)

  // #13: Accessibility
  const { wheelchairAccessible, parkingAvailable } = extractAccessibilityInfo(details, reviews)

  // #14: Social media
  const socialMedia = detectSocialMedia(details.website || venue.website, reviews)

  // Enhanced features from Google data
  const enhancedFeatures = [...(venue.features || [])]
  if (details.reservable && !enhancedFeatures.includes('Reservable')) enhancedFeatures.push('Reservable')
  if (details.dine_in && !enhancedFeatures.includes('Dine-in')) enhancedFeatures.push('Dine-in')
  if (details.takeout && !enhancedFeatures.includes('Takeout')) enhancedFeatures.push('Takeout')
  if (details.delivery && !enhancedFeatures.includes('Delivery')) enhancedFeatures.push('Delivery')
  if (details.serves_beer && !enhancedFeatures.includes('Serves Beer')) enhancedFeatures.push('Serves Beer')
  if (details.serves_wine && !enhancedFeatures.includes('Serves Wine')) enhancedFeatures.push('Serves Wine')
  if (details.serves_vegetarian_food && !enhancedFeatures.includes('Vegetarian Options')) enhancedFeatures.push('Vegetarian Options')
  if ((details.outdoor_seating || venue.outdoorSeating) && !enhancedFeatures.includes('Outdoor Seating')) enhancedFeatures.push('Outdoor Seating')
  if (wheelchairAccessible && !enhancedFeatures.includes('Wheelchair Accessible')) enhancedFeatures.push('Wheelchair Accessible')
  if (parkingAvailable && !enhancedFeatures.includes('Parking Available')) enhancedFeatures.push('Parking Available')

  return {
    ...venue,
    vibe: vibeString || venue.vibe,
    vibeScore,
    vibeTags,
    editorialSummary: details.editorial_summary?.overview || undefined,
    photoCount,
    photoScore,
    reservable: details.reservable || false,
    reservationLinks,
    dineIn: details.dine_in,
    takeout: details.takeout,
    delivery: details.delivery,
    wheelchairAccessible,
    parkingAvailable,
    outdoorSeating: details.outdoor_seating || venue.outdoorSeating || enhancedFeatures.includes('Outdoor Seating'),
    servesBreakfast: details.serves_breakfast,
    servesLunch: details.serves_lunch,
    servesDinner: details.serves_dinner,
    servesVegetarian: details.serves_vegetarian_food,
    servesBeer: details.serves_beer,
    servesWine: details.serves_wine,
    dietaryOptions,
    crowdLevel,
    bestTimes,
    socialMedia,
    isOpenAtPlannedTime: isOpen,
    verifiedOpen: isOpen,
    seasonalFit,
    features: [...new Set(enhancedFeatures)],
    rating: details.rating || venue.rating,
    reviewCount: details.user_ratings_total || venue.reviewCount,
  }
}

// ─── Haversine utility ──────────────────────────────────────────────────────

function haversine(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const R = 3959
  const dLat = (b.lat - a.lat) * Math.PI / 180
  const dLng = (b.lng - a.lng) * Math.PI / 180
  const x = Math.sin(dLat / 2) ** 2 +
    Math.cos(a.lat * Math.PI / 180) * Math.cos(b.lat * Math.PI / 180) *
    Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x))
}
