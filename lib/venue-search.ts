// Venue search and scraping logic
import { geminiAI } from './gemini'
import { sanitizeForSearch } from './profanity-filter'
import { lateNightDetector, LateNightResponse } from './late-night-detector'
import { enhanceVenueWithScrapedData, preferClusteredVenues, calculateSeasonalFit } from './venue-enhancer'

export interface Venue {
  id: string
  name: string
  category: 'drinks' | 'dinner' | 'activity'
  rating: number
  reviewCount: number
  priceRange: string
  address: string
  phone?: string
  website?: string
  imageUrl?: string
  description: string
  highlights: string[]
  coordinates: {
    lat: number
    lng: number
  }
  distance?: number // in miles from user location
  hours?: string
  tags: string[]
  capacity?: number // maximum capacity
  features: string[] // venue features like outdoor seating, parking, etc.
  vibe?: string // venue atmosphere/vibe
  vibeScore?: number // 0-1 match score against user's vibe preferences
  vibeTags?: string[] // extracted vibe keywords from reviews
  aiEnhanced?: boolean // whether AI has enhanced this venue
  aiInsights?: {
    bestFor: string[]
    insiderTips: string[]
    photoSpots: string[]
    vibeTags: string[]
  }
  pricing?: VenuePricing
  // Enhanced scraper fields
  editorialSummary?: string
  photoCount?: number
  photoScore?: number // 0-1 quality score based on photo count
  reservable?: boolean
  reservationLinks?: { url: string; platform: string }[]
  dineIn?: boolean
  takeout?: boolean
  delivery?: boolean
  wheelchairAccessible?: boolean
  parkingAvailable?: boolean
  outdoorSeating?: boolean
  servesVegetarian?: boolean
  servesBeer?: boolean
  servesWine?: boolean
  dietaryOptions?: string[] // vegan, gluten-free, halal, etc.
  crowdLevel?: 'quiet' | 'moderate' | 'busy' | 'packed'
  bestTimes?: string[] // best times to visit
  socialMedia?: { platform: string; url: string }[]
  isOpenAtPlannedTime?: boolean // verified open at user's planned time
  verifiedOpen?: boolean
  yelpRating?: number
  combinedRating?: number // weighted avg of Google + Yelp
  seasonalFit?: number // 0-1 how well venue fits current season/weather
}

export interface VenuePricing {
  tickets?: number
  food?: number
  drinks?: number
  activities?: number
  packages?: PricingPackage[]
  minimumSpend?: number
  currency?: string
  source?: string
  lastUpdated?: string
}

export interface PricingPackage {
  name: string
  price: number
  includes: string[]
  validFor?: string
}

export interface SearchCriteria {
  location: string
  budget: '$' | '$$' | '$$$' | '$$$$'
  vibes: string[]
  time: 'early' | 'prime' | 'late'
  partySize: number
  cuisine?: string
  customCuisine?: string
  activity?: string
  customActivity?: string
  // Date and time for availability checking
  plannedDate?: Date // The actual date of the date night
  dayOfWeek?: string // Day of week for availability checking
  plannedTime?: string // Specific time in HH:MM format
  // Custom preferences for AI and venue selection
  timeGapPreference?: 'short' | 'medium' | 'long' // Preference for travel time between venues
  maxTravelTime?: number // Maximum travel time in minutes between venues
  customRequests?: string // Any other custom requirements like "closer time gaps"
  venueDensity?: 'concentrated' | 'spread_out' // Prefer venues close together or spread out
  // Special occasion preferences
  occasion?: 'birthday' | 'anniversary' | 'holiday' | 'date-night' | 'celebration' | 'surprise'
  season?: 'spring' | 'summer' | 'fall' | 'winter' | 'any'
  holiday?: 'valentine' | 'christmas' | 'new-year' | 'halloween' | 'thanksgiving' | 'easter' | 'fourth-july'
  surpriseElements?: boolean // Include surprise elements and hidden gems
  theme?: string // Custom theme like "romantic", "adventurous", "cozy", "elegant"
}

export interface VenueConstraints {
  maxPricePerPerson: number
  minCapacity: number
  requiredFeatures: string[]
  openingHours: {
    start: string
    end: string
  }
  distanceLimit: number // miles
}

export interface TimeOfDayFilter {
  timeRange: {
    start: string // "18:00" for 6 PM
    end: string   // "22:00" for 10 PM
  }
  venueTypes: {
    preferred: string[]    // Venue types that work well for this time
    avoided: string[]     // Venue types to avoid
  }
  searchRadius: number    // Miles - larger radius for late night
  minRating: number      // Higher standards for prime time
}

// Time-based search configurations
const TIME_FILTERS: Record<string, TimeOfDayFilter> = {
  early: {
    timeRange: { start: "17:00", end: "19:30" },
    venueTypes: {
      preferred: ["restaurant", "cafe", "bistro", "wine_bar"],
      avoided: ["nightclub", "sports_bar", "late_night_diner"]
    },
    searchRadius: 5,
    minRating: 3.5
  },
  prime: {
    timeRange: { start: "19:00", end: "22:00" },
    venueTypes: {
      preferred: ["restaurant", "bar", "lounge", "brewery"],
      avoided: ["fast_food", "food_court", "cafeteria"]
    },
    searchRadius: 8,
    minRating: 4.0
  },
  late: {
    timeRange: { start: "21:00", end: "02:00" },
    venueTypes: {
      preferred: ["bar", "nightclub", "lounge", "cocktail_bar", "karaoke"],
      avoided: ["family_restaurant", "cafe", "bakery"]
    },
    searchRadius: 10,
    minRating: 3.8
  }
}

export interface SearchResult {
  venues: Venue[]
  totalFound: number
  searchTime: number
  sources: string[]
  lateNightResponse?: LateNightResponse
}

class VenueSearcher {
  private readonly searchSources = [
    {
      name: 'Google Places API',
      baseUrl: 'https://places.googleapis.com/maps/api/place',
      enabled: true,
      rateLimit: {
        requestsPerSecond: 10,
        requestsPerMinute: 600,
        requestsPerDay: 150000
      }
    },
    {
      name: 'OpenStreetMap Overpass',
      baseUrl: 'https://overpass-api.de/api/interpreter',
      enabled: true,
      rateLimit: {
        requestsPerSecond: 1,
        requestsPerMinute: 60,
        requestsPerDay: 10000
      }
    },
    {
      name: 'Foursquare API',
      baseUrl: 'https://api.foursquare.com/v3/places',
      enabled: true,
      rateLimit: {
        requestsPerSecond: 5,
        requestsPerMinute: 300,
        requestsPerDay: 5000
      }
    }
  ]

  private requestQueue: Map<string, number[]> = new Map()
  private lastRequestTime: Map<string, number> = new Map()
  private geocodeCache: Map<string, { lat: number; lng: number; timestamp: number }> = new Map()
  private pricingCache: Map<string, { pricing: VenuePricing; timestamp: number }> = new Map()
  private readonly GEOCODE_CACHE_TTL = 30 * 60 * 1000 // 30 minutes
  private readonly PRICING_CACHE_TTL = 60 * 60 * 1000 // 1 hour

  async searchVenues(criteria: SearchCriteria): Promise<SearchResult> {
    const startTime = Date.now()
    const allVenues: Venue[] = []
    const usedSources: string[] = []

    // Sanitize all custom user inputs before sending to APIs
    if (criteria.customCuisine) {
      criteria = { ...criteria, customCuisine: sanitizeForSearch(criteria.customCuisine) }
    }
    if (criteria.customActivity) {
      criteria = { ...criteria, customActivity: sanitizeForSearch(criteria.customActivity) }
    }
    if (criteria.cuisine) {
      criteria = { ...criteria, cuisine: sanitizeForSearch(criteria.cuisine) || 'any' }
    }
    if (criteria.activity) {
      criteria = { ...criteria, activity: sanitizeForSearch(criteria.activity) || 'none' }
    }
    // Sanitize custom vibes (format: "custom:text")
    criteria = {
      ...criteria,
      vibes: criteria.vibes.map(v =>
        v.startsWith('custom:') ? `custom:${sanitizeForSearch(v.replace('custom:', ''))}` : v
      ).filter(v => v !== 'custom:') // Remove empty custom vibes
    }

    
    // Log date/time availability information
    if (criteria.plannedDate) {
    }

    // Try to get AI-powered search enhancement (optional)
    let aiEnhancement = null
    try {
      aiEnhancement = await geminiAI.enhanceVenueSearch(criteria.location, {
        budget: criteria.budget,
        vibes: criteria.vibes,
        time: criteria.time,
        cuisine: criteria.cuisine,
        activity: criteria.activity,
      })
    } catch (error) {
    }

    // Calculate constraints from criteria
    const constraints = this.calculateConstraints(criteria)

    // Search from multiple sources in parallel with timeout protection
    
    const searchPromises = this.searchSources
      .filter(source => source.enabled)
      .map(async source => {
        try {
          // Add timeout to prevent hanging
          const timeoutPromise = new Promise<Venue[]>((_, reject) => 
            setTimeout(() => reject(new Error('Search timeout')), 15000) // 15s timeout
          )
          const venues = await Promise.race([
            this.searchSource(source, criteria),
            timeoutPromise
          ]) as Venue[]
          usedSources.push(source.name)
          return venues
        } catch (error) {
          return []
        }
      })

    // Also search for entertainment/activity venues using AI search terms or defaults
    const activitySearchPromise = this.searchActivitiesWithTextSearch(criteria, aiEnhancement)

    // #5: Multi-query search — diverse phrasings for better coverage
    const multiQueryPromise = this.multiQuerySearch(criteria)

    // Wait for all searches to complete with overall timeout
    const searchResults = await Promise.all([
      ...searchPromises, 
      Promise.race([
        activitySearchPromise,
        new Promise<Venue[]>(resolve => setTimeout(() => resolve([]), 10000))
      ]),
      Promise.race([
        multiQueryPromise,
        new Promise<Venue[]>(resolve => setTimeout(() => resolve([]), 10000))
      ])
    ])
    allVenues.push(...searchResults.flat())


    // Remove duplicates based on name and location
    const uniqueVenues = this.removeDuplicates(allVenues)

    // Enhanced filtering with travel time and account preferences
    const filteredVenues = this.enhancedFilter(uniqueVenues, criteria)

    // Try AI enhancement for venue insights (optional, doesn't fail if unavailable)
    let aiEnhancedVenues = filteredVenues
    // Only run AI enhancement if we have venues and it's not disabled
    if (filteredVenues.length > 0 && filteredVenues.length <= 20) {
      try {
        // Reduce AI processing to only top 5 venues for speed
        const aiPromise = this.enhanceVenuesWithAI(filteredVenues.slice(0, 5), criteria)
        const timeoutPromise = new Promise<Venue[]>(resolve => 
          setTimeout(() => resolve(filteredVenues.slice(0, 5)), 8000) // 8s timeout
        )
        aiEnhancedVenues = await Promise.race([aiPromise, timeoutPromise])
      } catch (error) {
        aiEnhancedVenues = filteredVenues
      }
    } else {
    }

    // Merge AI-enhanced venues back with the rest
    const finalVenues = [
      ...aiEnhancedVenues,
      ...filteredVenues.slice(5).map(v => ({ ...v, aiEnhanced: false }))
    ]

    // #4: Prefer clustered (walkable) venues for better date flow
    const clusteredVenues = preferClusteredVenues(finalVenues, criteria)

    // Smart ranking with travel time optimization and AI insights
    const rankedVenues = this.smartRank(clusteredVenues, criteria)

    // Enhance venues for special occasions
    const occasionEnhancedVenues = this.enhanceVenuesForOccasion(rankedVenues, criteria)

    // Scrape real pricing in parallel with tight timeout — falls back to estimates
    let pricingEnhancedVenues = occasionEnhancedVenues
    try {
      const pricingPromise = this.scrapePricingForVenues(occasionEnhancedVenues, criteria)
      const pricingTimeout = new Promise<Venue[]>(resolve =>
        setTimeout(() => resolve(occasionEnhancedVenues), 5000) // 5s max
      )
      pricingEnhancedVenues = await Promise.race([pricingPromise, pricingTimeout])
    } catch {
      pricingEnhancedVenues = occasionEnhancedVenues
    }

    // Optimize date plan with travel time
    const optimizedPlan = this.optimizeDatePlan(pricingEnhancedVenues, criteria)

    // If no venues found, return empty array - NO FAKE FALLBACKS
    let finalPlan = optimizedPlan
    if (optimizedPlan.length === 0) {
    }


    const endTime = Date.now()
    const searchTime = endTime - startTime

    // Check for late night scenario and generate alternatives
    const currentTime = new Date()
    
    // Use all available venues for late night detection, not just the final plan
    const searchResultForDetection = {
      venues: allVenues, // Use all found venues, not just the final plan
      totalFound: allVenues.length,
      searchTime,
      sources: usedSources.length > 0 ? usedSources : ['Fallback']
    }

    const searchResult = {
      venues: finalPlan,
      totalFound: Math.max(allVenues.length, finalPlan.length),
      searchTime,
      sources: usedSources.length > 0 ? usedSources : ['Fallback']
    }

    // Run late night detection on all available venues
    const detection = lateNightDetector.detectLateNightScenario(currentTime, searchResultForDetection, criteria)
    
    let lateNightResponse: LateNightResponse | undefined
    if (detection.isTooLate) {
      const suggestions = lateNightDetector.generateAlternativeSuggestions(detection, criteria)
      lateNightResponse = lateNightDetector.generateResponse(detection, suggestions, criteria)
    }

    return {
      ...searchResult,
      lateNightResponse
    }
  }

  private enhancedFilter(venues: Venue[], criteria: SearchCriteria): Venue[] {

    return venues.filter(venue => {
      // Basic filtering (existing logic)
      if (!this.meetsBudget(venue, criteria.budget)) {
        return false
      }

      if (!this.matchesVibe(venue, criteria.vibes)) {
        return false
      }

      if (!this.isInTimeRange(venue, criteria)) {
        return false
      }

      // Enhanced filtering
      if (!this.hasGoodRating(venue)) {
        return false
      }

      if (!this.hasSufficientReviews(venue)) {
        return false
      }

      if (!this.isWithinDistance(venue, criteria.location, criteria.time)) {
        return false
      }

      return true
    })
  }

  private hasGoodRating(venue: Venue): boolean {
    return venue.rating >= 4.0 // Minimum 4.0 stars
  }

  private hasSufficientReviews(venue: Venue): boolean {
    return venue.reviewCount >= 10 // Minimum 10 reviews
  }

  private isWithinDistance(venue: Venue, location: string, timeOfDay: string): boolean {
    // For now, assume all venues are within reasonable distance
    // In a real implementation, you'd calculate actual distance
    return true
  }

  private smartRank(venues: Venue[], criteria: SearchCriteria): Venue[] {

    return venues
      .map(venue => ({
        venue,
        score: this.calculateSmartScore(venue, criteria)
      }))
      .sort((a, b) => b.score - a.score)
      .map(item => item.venue)
  }

  private calculateSmartScore(venue: Venue, criteria: SearchCriteria): number {
    let score = 0
    const reasons: string[] = []

    // Budget matching (20% weight)
    const budgetScore = this.calculateBudgetScore(venue, criteria.budget)
    score += budgetScore * 0.20
    if (budgetScore > 0.8) reasons.push('Great budget match')

    // Rating quality (15% weight) — use combined rating if available
    const effectiveRating = venue.combinedRating || venue.rating
    const ratingScore = Math.min(effectiveRating / 5, 1)
    score += ratingScore * 0.15
    if (effectiveRating >= 4.5) reasons.push('Excellent rating')

    // Vibe compatibility (20% weight) — use scraped vibeScore if available
    const vibeScore = venue.vibeScore ?? this.calculateVibeScore(venue, criteria.vibes)
    score += vibeScore * 0.20
    if (vibeScore > 0.8) reasons.push('Perfect vibe match')

    // Custom preferences scoring (10% weight)
    const customScore = this.calculateCustomPreferencesScore(venue, criteria)
    score += customScore * 0.10
    if (customScore > 0.8) reasons.push('Matches custom preferences')

    // Category diversity (10% weight)
    const categoryScore = this.getCategoryScore(venue.category)
    score += categoryScore * 0.10

    // Time compatibility (10% weight) — boost verified-open venues
    const timeScore = venue.isOpenAtPlannedTime === true ? 1.0
      : venue.isOpenAtPlannedTime === false ? 0.1
      : this.calculateTimeScore(venue, criteria.time)
    score += timeScore * 0.10
    if (timeScore > 0.8) reasons.push('Verified open')

    // Popularity factor (5% weight)
    const popularityScore = Math.min(venue.reviewCount / 1000, 1)
    score += popularityScore * 0.05
    if (venue.reviewCount >= 500) reasons.push('Popular spot')

    // Photo quality (5% weight)
    const photoScore = venue.photoScore || 0
    score += photoScore * 0.05
    if (photoScore > 0.7) reasons.push('Great photos')

    // Seasonal fit (5% weight)
    const seasonalScore = venue.seasonalFit ?? calculateSeasonalFit(venue, criteria)
    score += seasonalScore * 0.05
    if (seasonalScore > 0.8) reasons.push('Perfect for the season')

    // Travel time bonus (up to 0.15 points)
    const travelBonus = this.calculateTravelBonus(venue, criteria.location)
    score += travelBonus
    if (travelBonus > 0.1) reasons.push('Great location')

    // Random factor for variety (up to 0.1 points)
    score += Math.random() * 0.1

    return score
  }

  private calculateBudgetScore(venue: Venue, budget: string): number {
    const priceLevels: Record<string, number> = { '$': 1, '$$': 2, '$$$': 3, '$$$$': 4 }
    const venueLevel = priceLevels[venue.priceRange] || 2
    const budgetLevel = priceLevels[budget] || 2
    
    // Perfect match gets 1.0, one level off gets 0.7, two levels off gets 0.3
    const diff = Math.abs(venueLevel - budgetLevel)
    if (diff === 0) return 1.0
    if (diff === 1) return 0.7
    if (diff === 2) return 0.4
    return 0.2
  }

  private calculateTimeScore(venue: Venue, timeOfDay: string): number {
    if (!venue.hours) return 0.5
    
    // Check if venue is open during the preferred time
    const timeFilter = TIME_FILTERS[timeOfDay]
    const isOpen = this.checkIfOpen(venue.hours, timeFilter.timeRange)
    
    return isOpen ? 1.0 : 0.2
  }

  private calculateTravelBonus(venue: Venue, location: string): number {
    // In a real implementation, calculate actual travel time
    // For now, give bonus based on venue features
    let bonus = 0
    
    if (venue.features?.includes('Popular Spot')) bonus += 0.05
    if (venue.features?.includes('Outdoor Seating')) bonus += 0.05
    if (venue.highlights?.includes('Great atmosphere')) bonus += 0.05
    
    return Math.min(bonus, 0.2)
  }

  private calculateVibeScore(venue: Venue, vibes: string[]): number {
    if (!venue.vibe || vibes.length === 0) return 0.5
    
    let score = 0
    for (const vibe of vibes) {
      if (venue.vibe.toLowerCase().includes(vibe.toLowerCase())) {
        score += 0.5
      }
      if (venue.tags.some(tag => tag.toLowerCase().includes(vibe.toLowerCase()))) {
        score += 0.3
      }
      if (venue.highlights.some(highlight => highlight.toLowerCase().includes(vibe.toLowerCase()))) {
        score += 0.2
      }
    }
    
    return Math.min(score, 1.0)
  }

  private optimizeDatePlan(venues: Venue[], criteria: SearchCriteria): Venue[] {

    // Group venues by category
    const drinks = venues.filter(v => v.category === 'drinks').slice(0, 5)
    const dinner = venues.filter(v => v.category === 'dinner').slice(0, 5)
    const activity = venues.filter(v => v.category === 'activity').slice(0, 5)
    

    // Apply custom preference filtering
    const filteredDrinks = this.applyCustomPreferencesFilter(drinks, criteria)
    const filteredDinner = this.applyCustomPreferencesFilter(dinner, criteria)
    const filteredActivity = this.applyCustomPreferencesFilter(activity, criteria)
    

    // Select best venues for each category
    const selectedVenues: Venue[] = []

    // Add best drinks venue
    if (filteredDrinks.length > 0) {
      selectedVenues.push(filteredDrinks[0])
    } else if (drinks.length > 0) {
      selectedVenues.push(drinks[0])
    }

    // Add best dinner venue
    if (filteredDinner.length > 0) {
      selectedVenues.push(filteredDinner[0])
    } else if (dinner.length > 0) {
      selectedVenues.push(dinner[0])
    }

    // Add best activity venue
    if (filteredActivity.length > 0) {
      selectedVenues.push(filteredActivity[0])
    } else if (activity.length > 0) {
      selectedVenues.push(activity[0])
    }

    // If we don't have enough venues, add the best remaining ones
    const remaining = venues
      .filter(v => !selectedVenues.includes(v))
      .slice(0, 3 - selectedVenues.length)

    selectedVenues.push(...remaining)
    
    
    // Optimize order based on travel time (simplified)
    return this.optimizeVenueOrder(selectedVenues, criteria.location)
  }

  private optimizeVenueOrder(venues: Venue[], baseLocation: string): Venue[] {
    if (venues.length <= 1) return venues

    // Logical date flow: activity first (ice-breaker) → dinner → drinks (wind down)
    const categoryOrder: Record<string, number> = { 'activity': 0, 'dinner': 1, 'drinks': 2 }

    // Step 1: Sort by date flow category order
    const sorted = [...venues].sort((a, b) => {
      const aOrder = categoryOrder[a.category] ?? 1
      const bOrder = categoryOrder[b.category] ?? 1
      if (aOrder !== bOrder) return aOrder - bOrder
      return b.rating - a.rating
    })

    // Step 2: Optimize travel within the sorted plan — swap adjacent same-category
    // venues if it reduces total travel distance
    for (let i = 0; i < sorted.length - 1; i++) {
      const current = sorted[i]
      const next = sorted[i + 1]
      if (current.coordinates && next.coordinates) {
        // Check if there's a venue further in the list that's closer to current
        for (let j = i + 2; j < sorted.length; j++) {
          if (sorted[j].category === next.category && sorted[j].coordinates) {
            const distToNext = this.haversineDistance(current.coordinates, next.coordinates)
            const distToJ = this.haversineDistance(current.coordinates, sorted[j].coordinates)
            if (distToJ < distToNext * 0.7) {
              // Swap to reduce travel — only if significantly closer (30%+ closer)
              ;[sorted[i + 1], sorted[j]] = [sorted[j], sorted[i + 1]]
            }
          }
        }
      }
    }

    return sorted
  }

  private haversineDistance(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
    const R = 3959 // Earth radius in miles
    const dLat = (b.lat - a.lat) * Math.PI / 180
    const dLng = (b.lng - a.lng) * Math.PI / 180
    const x = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(a.lat * Math.PI / 180) * Math.cos(b.lat * Math.PI / 180) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2)
    return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x))
  }

  // Removed fake fallback venue generation - only return real venues from APIs

  // Missing methods that need to be added
  private removeDuplicates(venues: Venue[]): Venue[] {
    const seen = new Set()
    return venues.filter(venue => {
      const key = `${venue.name.toLowerCase()}-${venue.address.toLowerCase()}`
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
  }

  private meetsBudget(venue: Venue, budget: string): boolean {
    const priceLevels: Record<string, number> = { '$': 1, '$$': 2, '$$$': 3, '$$$$': 4 }
    const venueLevel = priceLevels[venue.priceRange] || 2
    const budgetLevel = priceLevels[budget] || 2
    // Allow venues at or below the user's budget level (exact match or cheaper)
    return venueLevel <= budgetLevel
  }

  private matchesVibe(venue: Venue, vibes: string[]): boolean {
    if (!venue.vibe || vibes.length === 0) return true
    
    return vibes.some(vibe => 
      venue.vibe?.toLowerCase().includes(vibe.toLowerCase()) ||
      venue.tags.some(tag => tag.toLowerCase().includes(vibe.toLowerCase())) ||
      venue.highlights.some(highlight => highlight.toLowerCase().includes(vibe.toLowerCase()))
    )
  }

  private isInTimeRange(venue: Venue, criteria: SearchCriteria): boolean {
    if (!venue.hours) return true // Assume open if no hours specified
    
    const timeFilter = TIME_FILTERS[criteria.time]
    
    // Check if venue is open during the planned time
    const isOpenDuringTime = this.checkIfOpen(venue.hours, timeFilter.timeRange)
    
    // If we have specific date/time information, do additional checks
    if (criteria.plannedDate && criteria.dayOfWeek) {
      // Check if venue is open on the specific day of week
      const isOpenOnDay = this.checkIfOpenOnDay(venue.hours, criteria.dayOfWeek)
      
      // If we have a specific time, check availability at that time
      let isOpenAtSpecificTime = true
      if (criteria.plannedTime) {
        isOpenAtSpecificTime = this.checkIfOpenAtTime(venue.hours, criteria.plannedTime)
      }
      
      const isAvailable = isOpenDuringTime && isOpenOnDay && isOpenAtSpecificTime
      
      if (!isAvailable) {
      }
      
      return isAvailable
    }
    
    return isOpenDuringTime
  }

  private checkIfOpenOnDay(hours: string, dayOfWeek: string): boolean {
    // Check if venue is open on specific day of week
    // This is a simplified check - in real implementation, you'd parse actual opening hours
    const dayAbbreviations = {
      'Monday': 'Mon',
      'Tuesday': 'Tue', 
      'Wednesday': 'Wed',
      'Thursday': 'Thu',
      'Friday': 'Fri',
      'Saturday': 'Sat',
      'Sunday': 'Sun'
    }
    
    const dayAbbr = dayAbbreviations[dayOfWeek as keyof typeof dayAbbreviations] || dayOfWeek.substring(0, 3)
    
    // Simple check - if hours contain the day abbreviation, assume it's open
    return hours.toLowerCase().includes(dayAbbr.toLowerCase()) || 
           hours.toLowerCase().includes('daily') ||
           hours.toLowerCase().includes('all days')
  }

  private checkIfOpenAtTime(hours: string, specificTime: string): boolean {
    // Check if venue is open at specific time (HH:MM format)
    // This is a simplified implementation
    const [targetHour] = specificTime.split(':').map(Number)
    
    // Look for time patterns in hours string
    const timeMatches = hours.match(/(\d{1,2}):(\d{2})\s*(?:AM|PM|am|pm)?\s*-\s*(\d{1,2}):(\d{2})\s*(?:AM|PM|am|pm)?/g)
    
    if (!timeMatches) return true // Assume open if no specific hours found
    
    for (const match of timeMatches) {
      const timeRange = match.match(/(\d{1,2}):(\d{2})\s*(?:AM|PM|am|pm)?\s*-\s*(\d{1,2}):(\d{2})\s*(?:AM|PM|am|pm)?/)
      if (timeRange) {
        let [, openHour, , closeHour] = timeRange.map(Number)
        
        // Convert to 24-hour format if needed
        if (hours.toLowerCase().includes('pm') && openHour < 12) openHour += 12
        if (hours.toLowerCase().includes('pm') && closeHour < 12) closeHour += 12
        if (hours.toLowerCase().includes('am') && openHour === 12) openHour = 0
        if (hours.toLowerCase().includes('am') && closeHour === 12) closeHour = 0
        
        // Check if target time is within range
        if (targetHour >= openHour && targetHour < closeHour) {
          return true
        }
      }
    }
    
    return false
  }

  private async fetchDetailedInformation(venues: Venue[]): Promise<Venue[]> {
    
    const detailedVenues = []
    const batchSize = 5 // Process in batches to avoid rate limits
    
    for (let i = 0; i < venues.length; i += batchSize) {
      const batch = venues.slice(i, i + batchSize)
      
      // Process batch in parallel
      const batchPromises = batch.map(async (venue) => {
        try {
          return await this.fetchDetailedVenueInfo(venue)
        } catch (error) {
          return venue // Return original venue if details fetch fails
        }
      })
      
      const batchResults = await Promise.all(batchPromises)
      detailedVenues.push(...batchResults)
      
      // Add delay between batches to avoid rate limits
      if (i + batchSize < venues.length) {
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
    }
    
    return detailedVenues
  }

  private calculateConstraints(criteria: SearchCriteria): VenueConstraints {
    // Budget constraints per person
    const budgetPerPerson = {
      '$': 15,      // $15 per person
      '$$': 35,     // $35 per person
      '$$$': 75,    // $75 per person
      '$$$$': 150  // $150 per person
    }

    // Capacity requirements
    const minCapacity = criteria.partySize

    // Required features based on vibes
    const requiredFeatures = []
    if (criteria.vibes.includes('romantic')) {
      requiredFeatures.push('romantic', 'intimate', 'quiet')
    }
    if (criteria.vibes.includes('cozy')) {
      requiredFeatures.push('cozy', 'warm', 'comfortable')
    }
    if (criteria.vibes.includes('adventurous')) {
      requiredFeatures.push('unique', 'exciting', 'active')
    }

    // Time-based opening hours
    const timeHours = {
      early: { start: '17:00', end: '19:30' },
      prime: { start: '19:00', end: '22:00' },
      late: { start: '21:00', end: '02:00' }
    }

    return {
      maxPricePerPerson: budgetPerPerson[criteria.budget],
      minCapacity,
      requiredFeatures,
      openingHours: timeHours[criteria.time],
      distanceLimit: TIME_FILTERS[criteria.time].searchRadius
    }
  }

  private filterByConstraints(venues: Venue[], constraints: VenueConstraints): Venue[] {
    return venues.filter(venue => {
      // Check price range compatibility
      const venuePrice = this.parsePriceRange(venue.priceRange)
      if (venuePrice > constraints.maxPricePerPerson) {
        return false
      }

      // Check capacity (if available)
      if (venue.capacity && venue.capacity < constraints.minCapacity) {
        return false
      }

      // Check distance (if coordinates available and user location known)
      // This would require user coordinates - for now we'll skip distance filtering

      return true
    })
  }

  private parsePriceRange(priceRange: string): number {
    // Parse price range to approximate cost per person
    const priceMap = {
      '$': 15,
      '$$': 35,
      '$$$': 75,
      '$$$$': 150
    }
    return priceMap[priceRange as keyof typeof priceMap] || 50
  }

  private async searchSource(source: any, criteria: SearchCriteria): Promise<Venue[]> {
    if (source.name === 'Google Places API') {
      const venues = await this.searchGooglePlaces(criteria)
      return venues
    }
    
    if (source.name === 'OpenStreetMap Overpass') {
      const venues = await this.searchOpenStreetMap(criteria)
      return venues
    }

    if (source.name === 'Foursquare API') {
      const venues = await this.searchFoursquare(criteria)
      return venues
    }

    return []
  }

  private async checkRateLimit(sourceName: string): Promise<boolean> {
    const source = this.searchSources.find(s => s.name === sourceName)
    if (!source) return false

    const now = Date.now()
    const queue = this.requestQueue.get(sourceName) || []
    
    // Remove requests older than 1 minute
    const recentRequests = queue.filter((time: number) => now - time < 60000)
    this.requestQueue.set(sourceName, recentRequests)

    // Check if we're rate limited
    if (recentRequests.length >= source.rateLimit.requestsPerMinute) {
      const oldestRequest = Math.min(...recentRequests)
      const waitTime = 60000 - (now - oldestRequest)
      
      if (waitTime > 0) {
        await new Promise(resolve => setTimeout(resolve, waitTime))
        return this.checkRateLimit(sourceName)
      }
    }

    return true
  }

  private async searchActivitiesWithTextSearch(
    criteria: SearchCriteria,
    aiEnhancement: { searchTerms: string[]; locationInsights: string; recommendations: string[] } | null
  ): Promise<Venue[]> {
    try {
      const location = await this.geocodeLocation(criteria.location)
      if (!location) return []

      const radius = TIME_FILTERS[criteria.time].searchRadius * 1609

      // Use AI search terms if available, otherwise use defaults
      const defaultActivityTerms = [
        'bowling alley', 'TopGolf', 'escape room',
        'comedy club', 'karaoke', 'movie theater',
        'mini golf', 'arcade', 'shopping mall',
        'tourist attractions', 'amusement park',
        'spa wellness', 'museum', 'aquarium',
        'zoo', 'trampoline park', 'go kart',
        'ice skating rink', 'art gallery',
        'rooftop bar lounge', 'botanical garden',
        'axe throwing', 'laser tag', 'Dave and Busters',
        'boardwalk', 'waterfront', 'farmers market',
        'food hall', 'wine tasting', 'brewery tour',
        'paintball', 'rock climbing gym',
        'drive in theater', 'roller skating'
      ]

      // Pick activity-relevant terms from AI or defaults
      let searchTerms: string[]
      if (aiEnhancement?.searchTerms && aiEnhancement.searchTerms.length > 0) {
        // Filter AI terms to focus on activity/entertainment ones
        const activityKeywords = ['bowl', 'golf', 'escape', 'arcade', 'comedy', 'karaoke',
          'mini golf', 'movie', 'axe', 'trampoline', 'kart', 'laser', 'paint',
          'skating', 'climb', 'entertainment', 'fun', 'game', 'experience', 'adventure',
          'topgolf', 'dave', 'theater', 'theatre', 'museum', 'aquarium', 'zoo',
          'mall', 'shopping', 'attraction', 'spa', 'botanical', 'garden', 'waterfront',
          'boardwalk', 'market', 'brewery', 'winery', 'wine', 'rooftop', 'lounge',
          'food hall', 'drive-in', 'roller', 'ice rink', 'gallery', 'amusement']
        const aiActivityTerms = aiEnhancement.searchTerms.filter(term =>
          activityKeywords.some(kw => term.toLowerCase().includes(kw))
        )
        // Use AI activity terms plus defaults for variety
        searchTerms = [...aiActivityTerms, ...defaultActivityTerms.slice(0, 6)]
      } else {
        searchTerms = defaultActivityTerms.slice(0, 8)
      }

      // Dedupe and limit — allow more terms for broader coverage
      searchTerms = [...new Set(searchTerms)].slice(0, 10)


      const venues: Venue[] = []

      // Search in parallel batches of 2 to avoid rate limiting
      for (let i = 0; i < searchTerms.length; i += 2) {
        const batch = searchTerms.slice(i, i + 2)
        const batchResults = await Promise.all(
          batch.map(async (term) => {
            try {
              const searchQuery = `${term} near ${criteria.location}`
              
              // Add timeout to the fetch request
              const controller = new AbortController()
              const timeoutId = setTimeout(() => controller.abort(), 12000) // 12 second timeout
              
              const response = await fetch('/api/venues/search', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  action: 'google-text-search',
                  query: searchQuery,
                  lat: location.lat,
                  lng: location.lng,
                  radius: Math.min(radius, 50000)
                }),
                signal: controller.signal
              })

              clearTimeout(timeoutId)

              if (!response.ok) {
                if (response.status === 504) {
                  console.warn(`Google Text Search API timeout for ${term}`)
                } else {
                  console.warn(`Google Text Search API error ${response.status} for ${term}`)
                }
                return []
              }

              const data = await response.json()
              if (data.results) {
                return data.results.slice(0, 3).map((place: any) =>
                  this.convertGooglePlaceToVenue(place, criteria)
                )
              }
              return []
            } catch (error) {
              if (error instanceof Error && error.name === 'AbortError') {
                console.warn(`Google Text Search API request aborted for ${term}`)
              } else {
                console.warn(`Google Text Search API fetch error for ${term}:`, error)
              }
              return []
            }
          })
        )
        venues.push(...batchResults.flat())

        // Small delay between batches
        if (i + 3 < searchTerms.length) {
          await new Promise(resolve => setTimeout(resolve, 200))
        }
      }

      return venues
    } catch (error) {
      return []
    }
  }

  // #5: Multi-query search — search with diverse phrasings for venues single-keyword misses
  private async multiQuerySearch(criteria: SearchCriteria): Promise<Venue[]> {
    try {
      const location = await this.geocodeLocation(criteria.location)
      if (!location) return []

      const radius = TIME_FILTERS[criteria.time].searchRadius * 1609
      const vibeStr = (criteria.vibes || []).slice(0, 2).join(' ')
      const cuisineStr = criteria.customCuisine || criteria.cuisine || ''

      // Generate diverse query phrasings
      const queries: string[] = [
        `best date night spots ${criteria.location}`,
        `fun things to do for couples ${criteria.location}`,
        `${vibeStr} places near ${criteria.location}`,
      ]
      if (cuisineStr && cuisineStr !== 'any') {
        queries.push(`best ${cuisineStr} restaurant ${criteria.location}`)
      }
      if (criteria.time === 'late') {
        queries.push(`late night open now ${criteria.location}`)
      }
      if (criteria.occasion) {
        queries.push(`${criteria.occasion} celebration venue ${criteria.location}`)
      }

      // Dedupe and limit to 4 queries
      const uniqueQueries = [...new Set(queries)].slice(0, 4)
      const venues: Venue[] = []

      // Run in parallel batches of 2
      for (let i = 0; i < uniqueQueries.length; i += 2) {
        const batch = uniqueQueries.slice(i, i + 2)
        const results = await Promise.all(
          batch.map(async (query) => {
            try {
              const controller = new AbortController()
              const timeoutId = setTimeout(() => controller.abort(), 8000)
              const response = await fetch('/api/venues/search', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  action: 'google-text-search',
                  query,
                  lat: location.lat,
                  lng: location.lng,
                  radius: Math.min(radius, 50000)
                }),
                signal: controller.signal
              })
              clearTimeout(timeoutId)
              if (!response.ok) return []
              const data = await response.json()
              return (data.results || []).slice(0, 3).map((place: any) =>
                this.convertGooglePlaceToVenue(place, criteria)
              )
            } catch {
              return []
            }
          })
        )
        venues.push(...results.flat())
        if (i + 2 < uniqueQueries.length) {
          await new Promise(resolve => setTimeout(resolve, 150))
        }
      }

      return venues
    } catch {
      return []
    }
  }

  private async searchFoursquare(criteria: SearchCriteria): Promise<Venue[]> {
    try {
      const location = await this.geocodeLocation(criteria.location)
      if (!location) return []

      const radius = TIME_FILTERS[criteria.time].searchRadius * 1609
      const venues: Venue[] = []

      // Search for different venue categories via server-side API route
      const categories = this.getFoursquareCategories(criteria)

      for (const category of categories) {
        try {
          // Add timeout to the fetch request
          const controller = new AbortController()
          const timeoutId = setTimeout(() => controller.abort(), 12000) // 12 second timeout
          
          const response = await fetch('/api/venues/search', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'foursquare',
              lat: location.lat,
              lng: location.lng,
              radius,
              query: category
            }),
            signal: controller.signal
          })

          clearTimeout(timeoutId)

          if (!response.ok) {
            if (response.status === 504) {
              console.warn(`Foursquare API timeout for ${category}`)
            } else {
              console.warn(`Foursquare API error ${response.status} for ${category}`)
            }
            continue
          }

          const data = await response.json()

          if (data.response?.venues) {
            const places = data.response.venues.map((place: any) => this.convertFoursquareToVenue(place, criteria))
            venues.push(...places)
          }

          await new Promise(resolve => setTimeout(resolve, 200))
        } catch (error) {
          if (error instanceof Error && error.name === 'AbortError') {
            console.warn(`Foursquare API request aborted for ${category}`)
          } else {
            console.warn(`Foursquare API fetch error for ${category}:`, error)
          }
          continue
        }
      }

      return venues
    } catch (error) {
      return []
    }
  }

  
  private getFoursquareCategories(criteria: SearchCriteria): string[] {
    const categories = []
    
    // Keep only essential categories to avoid rate limiting
    if (criteria.time === 'early') {
      categories.push('4d4b7105d754a06374d80012') // Food
    } else if (criteria.time === 'prime') {
      categories.push('4d4b7105d754a06376d80012') // Nightlife
      categories.push('4d4b7105d754a06374d80012') // Food
    } else {
      categories.push('4d4b7105d754a06376d80012') // Nightlife
    }

    // Add only top entertainment categories to avoid rate limiting
    categories.push('4d4b7105d754a06377d80012') // Arts & Entertainment
    categories.push('4bf58dd8d48988d1e1931735') // Bowling Alley

    // Add activity-specific Foursquare categories (limited)
    const activity = criteria.customActivity || criteria.activity
    if (activity && activity !== 'none') {
      if (activity === 'live-music') {
        categories.push('4bf58dd8d48988d1e5931735') // Music Venue
      } else if (activity === 'art') {
        categories.push('4bf58dd8d48988d181941735') // Museum
      } else if (activity === 'outdoor') {
        categories.push('4bf58dd8d48988d163941735') // Park
      }
    }
    
    return [...new Set(categories)]
  }

  
  private convertFoursquareToVenue(place: any, criteria: SearchCriteria): Venue {
    return {
      id: `foursquare-${place.fsq_id}`,
      name: place.name,
      category: this.categorizeFoursquarePlace(place),
      rating: place.rating || 4.0,
      reviewCount: place.stats?.total_ratings || 100,
      priceRange: this.convertFoursquarePrice(place.price, criteria.budget),
      address: this.buildFoursquareAddress(place.location) || 'Address not available',
      phone: place.tel,
      website: place.website,
      imageUrl: place.photos?.[0] ? `https://igx.4sqi.net/img/general/800x800${place.photos[0].suffix}` : `https://source.unsplash.com/800x600/?${encodeURIComponent(place.name)}`,
      description: this.generateFoursquareDescription(place),
      highlights: this.generateFoursquareHighlights(place),
      coordinates: {
        lat: place.geocodes?.main?.latitude || place.lat,
        lng: place.geocodes?.main?.longitude || place.lng
      },
      hours: place.hours?.regular?.join(', '),
      tags: place.categories?.map((c: any) => c.name) || [],
      capacity: undefined,
      features: this.extractFoursquareFeatures(place)
    }
  }

  private categorizeFoursquarePlace(place: any): 'drinks' | 'dinner' | 'activity' {
    const categories = place.categories || []
    
    if (categories.some((c: any) => c.name?.toLowerCase().includes('bar') || c.name?.toLowerCase().includes('pub'))) {
      return 'drinks'
    }
    if (categories.some((c: any) => c.name?.toLowerCase().includes('restaurant') || c.name?.toLowerCase().includes('food'))) {
      return 'dinner'
    }
    
    return 'activity'
  }

  private convertFoursquarePrice(price?: number, fallbackBudget?: string): string {
    const levels = ['$', '$$', '$$$', '$$$$']
    if (!price || price < 1 || price > 4) return fallbackBudget || '$$'
    return levels[price - 1] || fallbackBudget || '$$'
  }


  private generateFoursquareDescription(place: any): string {
    const categories = place.categories?.map((c: any) => c.name).join(', ') || 'venue'
    const priceLevel = place.price || 1 // 1-4 price scale from Foursquare
    const priceDescriptions = {
      1: 'budget-friendly',
      2: 'moderately priced', 
      3: 'upscale',
      4: 'fine dining'
    }
    
    let description = `${place.name} is a ${categories} offering ${priceDescriptions[priceLevel as keyof typeof priceDescriptions] || 'moderately priced'} dining and entertainment.`
    
    // Add specific details based on venue type
    if (categories?.toLowerCase().includes('cinema') || categories?.toLowerCase().includes('movie theater')) {
      description += ` Enjoy the latest blockbuster films with state-of-the-art digital projection and comfortable seating.`
      if (priceLevel <= 2) {
        description += ` Ticket prices typically range from $8-12 for matinee shows and $12-15 for evening screenings.`
      } else {
        description += ` Premium cinema experience with ticket prices around $15-20 for evening shows.`
      }
    } else if (categories?.toLowerCase().includes('bowling')) {
      description += ` Perfect for a fun and casual date night with bowling lanes, arcade games, and a full bar.`
      description += ` Expect to spend $15-25 per person for bowling plus food and drinks.`
    } else if (categories?.toLowerCase().includes('escape room')) {
      description += ` Challenge yourselves with immersive puzzle rooms and thrilling adventures.`
      description += ` Prices typically run $25-40 per person for a 60-minute escape room experience.`
    } else if (categories?.toLowerCase().includes('restaurant') || categories?.toLowerCase().includes('food')) {
      description += ` Known for quality service and a welcoming atmosphere perfect for date nights.`
      if (priceLevel === 1) {
        description += ` Entrees range from $12-18, making it an affordable dining option.`
      } else if (priceLevel === 2) {
        description += ` Entrees typically cost $18-28, offering great value for the quality.`
      } else if (priceLevel === 3) {
        description += ` Expect upscale dining with entrees priced $28-45 and excellent service.`
      } else {
        description += ` Fine dining experience with entrees $45+ and premium ingredients.`
      }
    } else if (categories.toLowerCase().includes('bar') || categories.toLowerCase().includes('pub')) {
      description += ` Great atmosphere for conversation with craft cocktails and quality beverages.`
      description += ` Drinks typically range from $8-15 for cocktails and $5-8 for beer and wine.`
    }
    
    // Add popular times or features
    if (place.popular) {
      description += ` This is a popular local spot that's often busy, especially on weekends.`
    }
    
    return description
  }


  private generateFoursquareHighlights(place: any): string[] {
    const highlights = ['Popular with locals', 'Great atmosphere']
    
    if (place.rating >= 4.5) highlights.push('Excellent ratings')
    if (place.stats?.total_ratings >= 1000) highlights.push('Popular spot')
    if (place.price) highlights.push(`${this.convertFoursquarePrice(place.price)} pricing`)
    
    return highlights.slice(0, 6)
  }

  private buildFoursquareAddress(location: any): string | null {
    if (!location) return null
    
    const parts = []
    if (location.address) parts.push(location.address)
    if (location.cross_street) parts.push(location.cross_street)
    if (location.locality) parts.push(location.locality)
    if (location.region) parts.push(location.region)
    if (location.postcode) parts.push(location.postcode)
    
    return parts.length > 0 ? parts.join(', ') : ''
  }

  private buildGoogleAddress(place: any): string | null {
    // Try multiple address fields from Google Places API
    if (place.formatted_address) return place.formatted_address
    if (place.vicinity) return place.vicinity
    
    // Build from components if available
    const components = place.address_components || []
    const parts = []
    
    const streetNumber = components.find((c: any) => c.types.includes('street_number'))?.short_name
    const street = components.find((c: any) => c.types.includes('route'))?.short_name
    const neighborhood = components.find((c: any) => c.types.includes('neighborhood'))?.short_name
    const city = components.find((c: any) => c.types.includes('locality'))?.short_name
    const state = components.find((c: any) => c.types.includes('administrative_area_level_1'))?.short_name
    
    if (streetNumber && street) parts.push(`${streetNumber} ${street}`)
    else if (street) parts.push(street)
    
    if (neighborhood && !parts.includes(neighborhood)) parts.push(neighborhood)
    if (city && !parts.includes(city)) parts.push(city)
    if (state && !parts.includes(state)) parts.push(state)
    
    return parts.length > 0 ? parts.join(', ') : ''
  }

  private extractFoursquareFeatures(place: any): string[] {
    const features = []
    
    if (place.popular) features.push('Popular Spot')
    if (place.hours) features.push('Has Hours')
    if (place.menu) features.push('Menu Available')
    if (place.reservations) features.push('Reservations')
    
    return features
  }

  private getFoursquareClientId(): string {
    return process.env.FOURSQUARE_CLIENT_ID || 'demo-client-id'
  }

  private getFoursquareClientSecret(): string {
    return process.env.FOURSQUARE_CLIENT_SECRET || 'demo-client-secret'
  }


  private async searchGooglePlaces(criteria: SearchCriteria): Promise<Venue[]> {
    try {
      // Get location coordinates for Google Places
      const location = await this.geocodeLocation(criteria.location)
      if (!location) {
        // Use fallback coordinates based on location name
        const fallbackLocation = this.getFallbackLocation(criteria.location)
        if (!fallbackLocation) {
          return []
        }
        
        // Continue with fallback location
        return this.searchGooglePlacesWithLocation(criteria, fallbackLocation)
      }

      return this.searchGooglePlacesWithLocation(criteria, location)
    } catch (error) {
      return []
    }
  }

  private async searchGooglePlacesWithLocation(criteria: SearchCriteria, location: { lat: number; lng: number }): Promise<Venue[]> {
    try {
      const radius = TIME_FILTERS[criteria.time].searchRadius * 1609 // Convert miles to meters
      const venues: Venue[] = []

      // Search for different venue types via server-side API route
      const placeTypes = this.getGooglePlaceTypes(criteria)

      for (const placeType of placeTypes) {
        try {
          const cuisineKeyword = criteria.customCuisine || (criteria.cuisine && criteria.cuisine !== 'any' ? criteria.cuisine : '')
          
          // Add timeout to the fetch request
          const controller = new AbortController()
          const timeoutId = setTimeout(() => controller.abort(), 12000) // 12 second timeout
          
          const response = await fetch('/api/venues/search', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'google-places',
              lat: location.lat,
              lng: location.lng,
              radius,
              type: placeType,
              keyword: cuisineKeyword || undefined
            }),
            signal: controller.signal
          })

          clearTimeout(timeoutId)

          if (!response.ok) {
            if (response.status === 503) {
              console.warn(`Google Places API not available for ${placeType}`)
            } else if (response.status === 504) {
              console.warn(`Google Places API timeout for ${placeType}`)
            } else {
              console.warn(`Google Places API error ${response.status} for ${placeType}`)
            }
            continue
          }

          const data = await response.json()

          if (data.results) {
            const places = data.results.map((place: any) => this.convertGooglePlaceToVenue(place, criteria))
            venues.push(...places)
          }

          // Add delay to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 200))
        } catch (error) {
          if (error instanceof Error && error.name === 'AbortError') {
            console.warn(`Google Places API request aborted for ${placeType}`)
          } else {
            console.warn(`Google Places API fetch error for ${placeType}:`, error)
          }
          // Continue with next place type instead of failing completely
          continue
        }
      }

      return venues
    } catch (error) {
      return []
    }
  }

  private getFallbackLocation(location: string): { lat: number; lng: number } | null {
    
    // Clean up the location string - remove special characters and normalize
    let normalizedLocation = location.toLowerCase().trim()
      .replace(/[\/\\]/g, ' ') // Replace slashes with spaces
      .replace(/\s+/g, ' ') // Normalize multiple spaces
      .trim()
    
    // Specific city/area coordinates for better accuracy
    const cityCoordinates: Record<string, { lat: number; lng: number }> = {
      'severn': { lat: 39.2334, lng: -76.6954 },
      'severn maryland': { lat: 39.2334, lng: -76.6954 },
      'glen burnie': { lat: 39.0262, lng: -76.6243 },
      'pasadena': { lat: 39.0996, lng: -76.5518 },
      'annapolis': { lat: 38.9784, lng: -76.4951 },
      'baltimore': { lat: 39.2904, lng: -76.6122 },
      'loyola notre dame': { lat: 39.2904, lng: -76.6122 }, // Loyola/Notre Dame area in Baltimore
      'loyola': { lat: 39.2904, lng: -76.6122 }, // Loyola College area
      'notre dame': { lat: 39.2904, lng: -76.6122 }, // Notre Dame area
      'loyola notre dame baltimore': { lat: 39.2904, lng: -76.6122 },
      'loyola baltimore': { lat: 39.2904, lng: -76.6122 },
      'notre dame baltimore': { lat: 39.2904, lng: -76.6122 },
      'baltimore maryland': { lat: 39.2904, lng: -76.6122 },
      'downtown baltimore': { lat: 39.2867, lng: -76.6133 },
      'inner harbor baltimore': { lat: 39.2843, lng: -76.6141 },
      'fells point baltimore': { lat: 39.2825, lng: -76.5971 },
      'mount vernon baltimore': { lat: 39.2982, lng: -76.6153 },
      'federal hill baltimore': { lat: 39.2793, lng: -76.6225 },
      'canton baltimore': { lat: 39.2841, lng: -76.5784 },
      'hampden baltimore': { lat: 39.3319, lng: -76.6476 },
      'charles village baltimore': { lat: 39.3269, lng: -76.6176 },
    }
    
    // Check for specific city first
    if (cityCoordinates[normalizedLocation]) {
      return cityCoordinates[normalizedLocation]
    }
    
    // Check if location contains Baltimore keywords
    if (normalizedLocation.includes('baltimore') || 
        normalizedLocation.includes('loyola') || 
        normalizedLocation.includes('notre dame')) {
      return { lat: 39.2904, lng: -76.6122 }
    }
    
    // US state → largest/most popular city coordinates
    const stateCoordinates: Record<string, { lat: number; lng: number; city: string }> = {
      'alabama': { lat: 33.5207, lng: -86.8025, city: 'Birmingham' },
      'alaska': { lat: 61.2181, lng: -149.9003, city: 'Anchorage' },
      'arizona': { lat: 33.4484, lng: -112.0740, city: 'Phoenix' },
      'arkansas': { lat: 34.7465, lng: -92.2896, city: 'Little Rock' },
      'california': { lat: 34.0522, lng: -118.2437, city: 'Los Angeles' },
      'colorado': { lat: 39.7392, lng: -104.9903, city: 'Denver' },
      'connecticut': { lat: 41.7658, lng: -72.6734, city: 'Hartford' },
      'delaware': { lat: 39.7391, lng: -75.5398, city: 'Wilmington' },
      'florida': { lat: 25.7617, lng: -80.1918, city: 'Miami' },
      'georgia': { lat: 33.7490, lng: -84.3880, city: 'Atlanta' },
      'hawaii': { lat: 21.3069, lng: -157.8583, city: 'Honolulu' },
      'idaho': { lat: 43.6150, lng: -116.2023, city: 'Boise' },
      'illinois': { lat: 41.8781, lng: -87.6298, city: 'Chicago' },
      'indiana': { lat: 39.7684, lng: -86.1580, city: 'Indianapolis' },
      'iowa': { lat: 41.5868, lng: -93.6250, city: 'Des Moines' },
      'kansas': { lat: 37.6872, lng: -97.3301, city: 'Wichita' },
      'kentucky': { lat: 38.2527, lng: -85.7585, city: 'Louisville' },
      'louisiana': { lat: 29.9511, lng: -90.0715, city: 'New Orleans' },
      'maine': { lat: 43.6591, lng: -70.2568, city: 'Portland' },
      'maryland': { lat: 39.2904, lng: -76.6122, city: 'Baltimore' },
      'massachusetts': { lat: 42.3601, lng: -71.0589, city: 'Boston' },
      'michigan': { lat: 42.3314, lng: -83.0458, city: 'Detroit' },
      'minnesota': { lat: 44.9778, lng: -93.2650, city: 'Minneapolis' },
      'mississippi': { lat: 32.2988, lng: -90.1848, city: 'Jackson' },
      'missouri': { lat: 39.0997, lng: -94.5786, city: 'Kansas City' },
      'montana': { lat: 46.8787, lng: -114.0090, city: 'Missoula' },
      'nebraska': { lat: 41.2565, lng: -95.9345, city: 'Omaha' },
      'nevada': { lat: 36.1699, lng: -115.1398, city: 'Las Vegas' },
      'new hampshire': { lat: 42.9956, lng: -71.4548, city: 'Manchester' },
      'new jersey': { lat: 40.7357, lng: -74.1724, city: 'Newark' },
      'new mexico': { lat: 35.0844, lng: -106.6504, city: 'Albuquerque' },
      'new york': { lat: 40.7128, lng: -74.0060, city: 'New York City' },
      'north carolina': { lat: 35.2271, lng: -80.8431, city: 'Charlotte' },
      'north dakota': { lat: 46.8772, lng: -96.7898, city: 'Fargo' },
      'ohio': { lat: 39.9612, lng: -82.9988, city: 'Columbus' },
      'oklahoma': { lat: 35.4676, lng: -97.5164, city: 'Oklahoma City' },
      'oregon': { lat: 45.5152, lng: -122.6784, city: 'Portland' },
      'pennsylvania': { lat: 39.9526, lng: -75.1652, city: 'Philadelphia' },
      'rhode island': { lat: 41.8240, lng: -71.4128, city: 'Providence' },
      'south carolina': { lat: 32.7765, lng: -79.9311, city: 'Charleston' },
      'south dakota': { lat: 43.5460, lng: -96.7313, city: 'Sioux Falls' },
      'tennessee': { lat: 36.1627, lng: -86.7816, city: 'Nashville' },
      'texas': { lat: 29.7604, lng: -95.3698, city: 'Houston' },
      'utah': { lat: 40.7608, lng: -111.8910, city: 'Salt Lake City' },
      'vermont': { lat: 44.4759, lng: -73.2121, city: 'Burlington' },
      'virginia': { lat: 36.8529, lng: -75.9780, city: 'Virginia Beach' },
      'washington': { lat: 47.6062, lng: -122.3321, city: 'Seattle' },
      'west virginia': { lat: 38.3498, lng: -81.6326, city: 'Charleston' },
      'wisconsin': { lat: 43.0389, lng: -87.9065, city: 'Milwaukee' },
      'wyoming': { lat: 41.1400, lng: -104.8202, city: 'Cheyenne' },
    }

    // Check if location is in "city, state" format
    if (normalizedLocation.includes(',')) {
      const [city, state] = normalizedLocation.split(',').map(part => part.trim())
      if (cityCoordinates[city]) {
        return cityCoordinates[city]
      }
      if (stateCoordinates[state]) {
        return { lat: stateCoordinates[state].lat, lng: stateCoordinates[state].lng }
      }
    }

    // Check for complex location patterns like "Loyola/Notre Dame, Baltimore, Maryland"
    if (normalizedLocation.includes('loyola') && normalizedLocation.includes('notre dame')) {
      return { lat: 39.2904, lng: -76.6122 }
    }

    // Check for direct city/state match
    if (cityCoordinates[normalizedLocation]) {
      return cityCoordinates[normalizedLocation]
    }
    if (stateCoordinates[normalizedLocation]) {
      return { lat: stateCoordinates[normalizedLocation].lat, lng: stateCoordinates[normalizedLocation].lng }
    }

    return null
  }

  private async geocodeLocation(locationName: string): Promise<{lat: number, lng: number} | null> {
    try {
      // Check cache first
      const cached = this.geocodeCache.get(locationName)
      const now = Date.now()
      if (cached && (now - cached.timestamp) < this.GEOCODE_CACHE_TTL) {
        return cached
      }

      // Clean up location name for better matching
      const cleanLocationName = locationName
        .replace(/[\/\\]/g, ' ') // Replace slashes with spaces
        .replace(/\s+/g, ' ') // Normalize multiple spaces
        .trim()

      // First check if this is a known state/region name — resolve directly to city
      const directMatch = this.getFallbackLocation(cleanLocationName)
      // Only use direct match for state-like inputs (short names without commas)
      const looksLikeState = !cleanLocationName.includes(',') && cleanLocationName.trim().split(/\s+/).length <= 3
      if (directMatch && looksLikeState) {
        this.geocodeCache.set(locationName, { ...directMatch, timestamp: now })
        return directMatch
      }

      // Use server-side API route to avoid CORS issues
      const response = await fetch('/api/venues/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'google-geocode', location: locationName })
      })

      if (!response.ok) {
        const fallback = this.getFallbackLocation(locationName)
        if (fallback) {
          this.geocodeCache.set(locationName, { ...fallback, timestamp: now })
        }
        return fallback
      }

      const data = await response.json()

      if (data.results && data.results.length > 0) {
        const result = data.results[0]
        const { lat, lng } = result.geometry.location
        const types: string[] = result.types || []

        // If Google returns a state/country-level result, it's too broad
        // Resolve to the largest city in that area instead
        if (types.includes('administrative_area_level_1') || types.includes('country')) {
          const cityCoords = this.getFallbackLocation(locationName)
          if (cityCoords) {
            this.geocodeCache.set(locationName, { ...cityCoords, timestamp: now })
            return cityCoords
          }
          // If no fallback, use Google's coords as last resort
        }

        const coords = { lat, lng }
        this.geocodeCache.set(locationName, { ...coords, timestamp: now })
        return coords
      }

      const fallback = this.getFallbackLocation(locationName)
      if (fallback) {
        this.geocodeCache.set(locationName, { ...fallback, timestamp: now })
      }
      return fallback
    } catch (error) {
      const fallback = this.getFallbackLocation(locationName)
      if (fallback) {
        this.geocodeCache.set(locationName, { ...fallback, timestamp: Date.now() })
      }
      return fallback
    }
  }

  private getGooglePlaceTypes(criteria: SearchCriteria): string[] {
    const types = []
    
    // Add types based on search criteria
    if (criteria.time === 'early') {
      types.push('restaurant', 'cafe')
    } else if (criteria.time === 'prime') {
      types.push('restaurant', 'bar', 'night_club')
    } else {
      types.push('bar', 'night_club', 'restaurant')
    }

    // Always include broad entertainment & attraction types
    types.push(
      'bowling_alley', 'movie_theater', 'shopping_mall',
      'tourist_attraction', 'amusement_park', 'spa',
      'museum', 'art_gallery', 'aquarium', 'zoo'
    )

    // Add activity-specific types
    const activity = criteria.customActivity || criteria.activity
    if (activity && activity !== 'none') {
      if (activity === 'live-music') types.push('night_club', 'bar', 'stadium')
      else if (activity === 'art') types.push('art_gallery', 'museum')
      else if (activity === 'outdoor') types.push('park', 'campground', 'stadium')
      else if (activity === 'shopping') types.push('shopping_mall', 'department_store')
      else if (activity === 'wellness') types.push('spa', 'gym')
      else {
        // Broad search for custom activities
        types.push('point_of_interest')
      }
    }
    
    return [...new Set(types)]
  }

  private convertGooglePlaceToVenue(place: any, criteria: SearchCriteria): Venue {
    return {
      id: `google-${place.place_id}`,
      name: place.name,
      category: this.categorizeGooglePlace(place),
      rating: place.rating || 4.0,
      reviewCount: place.user_ratings_total || 100,
      priceRange: this.convertGooglePriceLevel(place.price_level, criteria.budget),
      address: this.buildGoogleAddress(place) || 'Address not available',
      phone: place.formatted_phone_number,
      website: place.website,
      imageUrl: place.photos ? 
        `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photoreference=${place.photos[0].photo_reference}&key=${this.getGoogleApiKey()}` :
        `https://source.unsplash.com/800x600/?${encodeURIComponent(place.name)}`,
      description: this.generateGoogleDescription(place),
      highlights: this.generateGoogleHighlights(place),
      coordinates: {
        lat: place.geometry.location.lat,
        lng: place.geometry.location.lng
      },
      hours: place.opening_hours?.weekday_text?.join(', '),
      tags: this.extractGoogleTags(place),
      capacity: undefined, // Google Places doesn't provide capacity
      features: this.extractGoogleFeatures(place)
    }
  }

  private async fetchDetailedVenueInfo(venue: Venue, criteria?: SearchCriteria): Promise<Venue> {
    try {
      // Get detailed information from Google Places
      if (venue.id.startsWith('google-')) {
        const placeId = venue.id.replace('google-', '')
        const detailedInfo = await this.fetchGooglePlaceDetails(placeId)
        
        // Basic field update
        const updated: Venue = {
          ...venue,
          phone: detailedInfo.formatted_phone_number || venue.phone,
          website: detailedInfo.website || venue.website,
          hours: detailedInfo.opening_hours?.weekday_text?.join(', ') || venue.hours,
          rating: detailedInfo.rating || venue.rating,
          reviewCount: detailedInfo.user_ratings_total || venue.reviewCount,
          priceRange: this.convertGooglePriceLevel(detailedInfo.price_level, venue.priceRange) || venue.priceRange,
          features: this.extractDetailedFeatures(detailedInfo),
          description: detailedInfo.editorial_summary?.overview || this.generateDetailedDescription(detailedInfo),
          photoCount: detailedInfo.photos?.length || 0
        }

        // Apply full enhancement if we have criteria
        if (criteria) {
          return enhanceVenueWithScrapedData(updated, detailedInfo, criteria)
        }
        return updated
      }
      
      // For OpenStreetMap venues, try to fetch additional info
      return await this.enrichOSMVVenue(venue)
    } catch (error) {
      return venue
    }
  }

  private async fetchGooglePlaceDetails(placeId: string): Promise<any> {
    const response = await fetch('/api/venues/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'google-place-details', placeId })
    })

    if (!response.ok) {
      throw new Error(`Google Places details API error: ${response.status}`)
    }

    const data = await response.json()
    return data.result || {}
  }

  private extractDetailedFeatures(place: any): string[] {
    const features = []
    
    // Extract from reviews
    if (place.reviews) {
      const reviewTexts = place.reviews.map((review: any) => review.text).join(' ').toLowerCase()
      
      if (reviewTexts.includes('parking')) features.push('Parking Available')
      if (reviewTexts.includes('outdoor')) features.push('Outdoor Seating')
      if (reviewTexts.includes('wifi')) features.push('Free WiFi')
      if (reviewTexts.includes('music')) features.push('Live Music')
      if (reviewTexts.includes('romantic')) features.push('Romantic Atmosphere')
      if (reviewTexts.includes('family')) features.push('Family Friendly')
      if (reviewTexts.includes('reservation')) features.push('Reservations Recommended')
    }
    
    // Extract from place types
    if (place.types) {
      if (place.types.includes('outdoor_seating')) features.push('Outdoor Seating')
      if (place.types.includes('delivery')) features.push('Delivery Available')
      if (place.types.includes('takeout')) features.push('Takeout Available')
      if (place.types.includes('wheelchair_accessible_entrance')) features.push('Wheelchair Accessible')
    }
    
    return [...new Set(features)] // Remove duplicates
  }

  private generateDetailedDescription(place: any): string {
    let description = place.name || 'A local venue'
    
    // Add cuisine information
    if (place.types?.includes('restaurant')) {
      description += ' is a restaurant'
      // Try to extract cuisine from reviews
      if (place.reviews) {
        const cuisineKeywords = ['italian', 'chinese', 'mexican', 'thai', 'japanese', 'american', 'french', 'indian']
        const reviewText = place.reviews.map((r: any) => r.text).join(' ').toLowerCase()
        
        for (const cuisine of cuisineKeywords) {
          if (reviewText.includes(cuisine)) {
            description += ` serving ${cuisine.charAt(0).toUpperCase() + cuisine.slice(1)} cuisine`
            break
          }
        }
      }
    } else if (place.types?.includes('bar')) {
      description += ' is a bar'
    } else if (place.types?.includes('night_club')) {
      description += ' is a nightclub'
    }
    
    // Add rating-based description
    if (place.rating >= 4.5) {
      description += ' with excellent customer reviews'
    } else if (place.rating >= 4.0) {
      description += ' with good customer reviews'
    }
    
    // Add popular times information
    if (place.opening_hours?.popular_times) {
      description += ' and is especially popular during evening hours'
    }
    
    description += '.'
    
    return description
  }

  private async enrichOSMVVenue(venue: Venue): Promise<Venue> {
    try {
      // Try to find website and additional info from web search
      const searchQuery = `${venue.name} ${venue.address} website menu prices`
      
      // This would require a web scraping API or search API
      // For now, we'll enhance with some basic web-based information
      
      return {
        ...venue,
        description: this.enhanceDescription(venue),
        highlights: this.enhanceHighlights(venue)
      }
    } catch (error) {
      return venue
    }
  }

  private enhanceDescription(venue: Venue): string {
    let enhanced = venue.description
    
    // Add more specific details based on venue type and location
    if (venue.category === 'drinks') {
      enhanced += ' Features an extensive drink menu and knowledgeable bartenders.'
    } else if (venue.category === 'dinner') {
      enhanced += ' Offers a carefully curated menu with seasonal ingredients.'
    } else if (venue.category === 'activity') {
      enhanced += ' Provides unique entertainment experiences in a welcoming environment.'
    }
    
    return enhanced
  }

  private enhanceHighlights(venue: Venue): string[] {
    const enhanced = [...venue.highlights]
    
    // Add category-specific highlights
    if (venue.category === 'drinks') {
      enhanced.push('Craft Cocktails', 'Expert Bartenders')
    } else if (venue.category === 'dinner') {
      enhanced.push('Seasonal Menu', 'Quality Ingredients')
    } else if (venue.category === 'activity') {
      enhanced.push('Unique Experience', 'Entertainment Focus')
    }
    
    return enhanced.slice(0, 6) // Keep max 6 highlights
  }

  private categorizeGooglePlace(place: any): 'drinks' | 'dinner' | 'activity' {
    const types = place.types || []
    
    // Drinks
    if (types.includes('bar') || types.includes('night_club') || types.includes('liquor_store')) {
      return 'drinks'
    }
    // Dinner
    if (types.includes('restaurant') || types.includes('food') || types.includes('cafe') || types.includes('bakery')) {
      return 'dinner'
    }
    // Activity — entertainment, recreation, shopping, attractions
    const activityTypes = [
      'bowling_alley', 'movie_theater', 'amusement_park', 'spa', 'stadium',
      'museum', 'art_gallery', 'aquarium', 'zoo', 'campground',
      'tourist_attraction', 'gym', 'park', 'casino',
      'shopping_mall', 'department_store', 'clothing_store',
      'book_store', 'florist', 'jewelry_store',
      'library', 'church', 'city_hall', 'courthouse',
      'natural_feature', 'point_of_interest', 'establishment'
    ]
    if (types.some((t: string) => activityTypes.includes(t))) {
      return 'activity'
    }
    
    return 'activity'
  }

  private convertGooglePriceLevel(priceLevel?: number, fallbackBudget?: string): string {
    const levels = ['$', '$$', '$$$', '$$$$']
    return priceLevel ? levels[priceLevel - 1] || fallbackBudget || '$$' : fallbackBudget || '$$'
  }

  // Scrape real pricing + full enhancement for all venues in parallel
  private async scrapePricingForVenues(venues: Venue[], criteria?: SearchCriteria): Promise<Venue[]> {
    const now = Date.now()

    // Scrape each venue's pricing in parallel with individual 3s timeout
    const pricingPromises = venues.map(async (venue): Promise<Venue> => {
      try {
        // Check cache first
        const cached = this.pricingCache.get(venue.id)
        if (cached && (now - cached.timestamp) < this.PRICING_CACHE_TTL) {
          return { ...venue, pricing: cached.pricing }
        }

        // Scrape pricing + enhancement with tight per-venue timeout
        const scrapePromise = this.scrapeAndEnhanceVenue(venue, criteria)
        const timeout = new Promise<Venue>((_, reject) =>
          setTimeout(() => reject(new Error('timeout')), 3500)
        )
        const enhanced = await Promise.race([scrapePromise, timeout])

        // Cache the pricing
        if (enhanced.pricing) {
          this.pricingCache.set(venue.id, { pricing: enhanced.pricing, timestamp: now })
        }

        return enhanced
      } catch {
        // Fallback: build estimate from priceRange and category
        const fallback = this.buildEstimatePricing(venue)
        return { ...venue, pricing: fallback }
      }
    })

    return Promise.all(pricingPromises)
  }

  // Scrape pricing AND run full venue enhancement from Google Place Details
  private async scrapeAndEnhanceVenue(venue: Venue, criteria?: SearchCriteria): Promise<Venue> {
    if (venue.id.startsWith('google-')) {
      const placeId = venue.id.replace('google-', '')
      const details = await this.fetchGooglePlaceDetails(placeId)

      // Run full enhancement with all scraped data
      let enhanced = venue
      if (criteria) {
        enhanced = enhanceVenueWithScrapedData(venue, details, criteria)
      }

      const priceLevel = details.price_level || 0
      const reviews = details.reviews || []

      // Extract real dollar amounts from reviews
      const dollarAmounts = this.extractDollarAmounts(reviews)
      const avgSpend = dollarAmounts.length > 0
        ? Math.round(dollarAmounts.reduce((a: number, b: number) => a + b, 0) / dollarAmounts.length)
        : 0

      // Build pricing from scraped data and attach to enhanced venue
      const pricing = this.buildScrapedPricing(venue.category, priceLevel, avgSpend, reviews)
      return { ...enhanced, pricing }
    }

    // Non-Google venues: use estimate pricing
    const pricing = this.buildEstimatePricing(venue)
    return { ...venue, pricing }
  }

  // Extract real dollar amounts mentioned in reviews ($15, $25, etc.)
  private extractDollarAmounts(reviews: any[]): number[] {
    const amounts: number[] = []
    for (const review of reviews) {
      const text = review.text || ''
      // Match $XX or $XX.XX patterns
      const matches = text.match(/\$(\d+(?:\.\d{2})?)/g)
      if (matches) {
        for (const m of matches) {
          const val = parseFloat(m.replace('$', ''))
          // Filter unrealistic amounts (e.g. $1000 tips, $1 items)
          if (val >= 5 && val <= 500) amounts.push(val)
        }
      }
    }
    return amounts
  }

  // Build VenuePricing from scraped Google data
  private buildScrapedPricing(
    category: string,
    priceLevel: number,
    avgReviewSpend: number,
    reviews: any[]
  ): VenuePricing {
    // Base multiplier from Google price_level (0-4)
    const mult = [0.6, 0.8, 1.0, 1.5, 2.5][priceLevel] || 1.0

    // Use real review spend if available, otherwise estimate from price_level
    const hasRealData = avgReviewSpend > 0
    const source = hasRealData ? 'scraped' : 'estimate'

    if (category === 'dinner') {
      const food = hasRealData ? avgReviewSpend : Math.round(22 * mult)
      const drinks = hasRealData ? Math.round(avgReviewSpend * 0.4) : Math.round(10 * mult)
      return { food, drinks, tickets: undefined, activities: undefined, packages: [], source, lastUpdated: new Date().toISOString() }
    }

    if (category === 'drinks') {
      const drinks = hasRealData ? avgReviewSpend : Math.round(12 * mult)
      const food = hasRealData ? Math.round(avgReviewSpend * 0.7) : Math.round(8 * mult)
      return { food, drinks, tickets: undefined, activities: undefined, packages: [], source, lastUpdated: new Date().toISOString() }
    }

    // Activity venues
    const tickets = hasRealData ? avgReviewSpend : Math.round(20 * mult)
    const food = Math.round((hasRealData ? avgReviewSpend : 15) * 0.5)
    const drinks = Math.round((hasRealData ? avgReviewSpend : 10) * 0.4)
    const activities = hasRealData ? Math.round(avgReviewSpend * 0.6) : Math.round(15 * mult)

    // Extract packages from reviews if mentioned
    const packages = this.extractPackagesFromReviews(reviews)

    return { tickets, food, drinks, activities, packages, source, lastUpdated: new Date().toISOString() }
  }

  // Build estimate-only pricing when scraping fails
  private buildEstimatePricing(venue: Venue): VenuePricing {
    const multipliers: Record<string, number> = { '$': 0.7, '$$': 1.0, '$$$': 1.8, '$$$$': 3.0 }
    const mult = multipliers[venue.priceRange] || 1.0

    if (venue.category === 'dinner') {
      return { food: Math.round(25 * mult), drinks: Math.round(10 * mult), tickets: undefined, activities: undefined, packages: [], source: 'estimate', lastUpdated: new Date().toISOString() }
    }
    if (venue.category === 'drinks') {
      return { food: Math.round(10 * mult), drinks: Math.round(12 * mult), tickets: undefined, activities: undefined, packages: [], source: 'estimate', lastUpdated: new Date().toISOString() }
    }
    return { tickets: Math.round(20 * mult), food: Math.round(8 * mult), drinks: Math.round(6 * mult), activities: Math.round(15 * mult), packages: [], source: 'estimate', lastUpdated: new Date().toISOString() }
  }

  // Extract package deals from review text
  private extractPackagesFromReviews(reviews: any[]): PricingPackage[] {
    const packages: PricingPackage[] = []
    const seen = new Set<string>()

    for (const review of reviews) {
      const text = (review.text || '').toLowerCase()

      // Detect common package patterns
      if ((text.includes('package') || text.includes('deal') || text.includes('special')) && text.match(/\$\d+/)) {
        const priceMatch = text.match(/\$(\d+)/)
        if (priceMatch) {
          const price = parseInt(priceMatch[1])
          if (price >= 10 && price <= 300 && !seen.has(String(price))) {
            seen.add(String(price))
            packages.push({
              name: text.includes('group') ? 'Group Package' : text.includes('couple') ? 'Couples Package' : 'Special Package',
              price,
              includes: ['See venue for details']
            })
          }
        }
      }
    }

    return packages.slice(0, 3) // Max 3 packages
  }

  private async fetchRealPricing(venue: Venue): Promise<string> {
    try {
      // For Google venues, try to get more accurate pricing from reviews
      if (venue.id.startsWith('google-')) {
        const placeId = venue.id.replace('google-', '')
        const details = await this.fetchGooglePlaceDetails(placeId)
        
        // Extract pricing information from reviews
        if (details.reviews) {
          const priceMentions = this.extractPriceFromReviews(details.reviews)
          if (priceMentions.length > 0) {
            return this.determinePriceFromMentions(priceMentions)
          }
        }
        
        // Fall back to Google's price level
        return this.convertGooglePriceLevel(details.price_level)
      }
      
      // For other venues, try web-based pricing detection
      return await this.fetchWebPricing(venue)
    } catch (error) {
      return venue.priceRange // Fall back to current price range
    }
  }

  private extractPriceFromReviews(reviews: any[]): string[] {
    const priceKeywords: string[] = []
    
    reviews.forEach(review => {
      const text = review.text?.toLowerCase() || ''
      
      // Look for price mentions in reviews
      const priceMatches = text.match(/\$\d+/g) // $15, $25, etc.
      if (priceMatches) {
        priceKeywords.push(...priceMatches)
      }
      
      // Look for price level mentions
      if (text.includes('expensive') || text.includes('pricey')) {
        priceKeywords.push('expensive')
      }
      if (text.includes('cheap') || text.includes('affordable') || text.includes('reasonable')) {
        priceKeywords.push('affordable')
      }
      if (text.includes('very expensive') || text.includes('upscale')) {
        priceKeywords.push('very expensive')
      }
    })
    
    return priceKeywords
  }

  private determinePriceFromMentions(mentions: string[]): string {
    const prices = mentions.filter(m => m.match(/\$\d+/)).map(m => parseInt(m.replace('$', '')))
    
    if (prices.length > 0) {
      const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length
      
      if (avgPrice < 20) return '$'
      if (avgPrice < 40) return '$$'
      if (avgPrice < 80) return '$$$'
      return '$$$$'
    }
    
    // Check for descriptive mentions
    if (mentions.includes('very expensive')) return '$$$$'
    if (mentions.includes('expensive')) return '$$$'
    if (mentions.includes('affordable')) return '$$'
    
    return '$$' // Default
  }

  private async fetchWebPricing(venue: Venue): Promise<string> {
    // This would integrate with a web scraping API to fetch menu prices
    // For now, return enhanced estimation based on venue characteristics
    
    let priceScore = 2 // Default to $$
    
    // Adjust based on venue features
    if (venue.features.includes('Fine Dining')) priceScore += 1
    if (venue.features.includes('Romantic Atmosphere')) priceScore += 1
    if (venue.features.includes('Casual')) priceScore -= 1
    if (venue.features.includes('Family Friendly')) priceScore -= 1
    
    // Adjust based on rating
    if (venue.rating >= 4.7) priceScore += 1
    if (venue.rating < 4.0) priceScore -= 1
    
    // Adjust based on location (urban vs suburban)
    if (venue.address.includes('downtown') || venue.address.includes('city center')) {
      priceScore += 1
    }
    
    const priceRanges = ['$', '$$', '$$$', '$$$$']
    const finalPrice = priceRanges[Math.max(0, Math.min(3, priceScore))]
    
    return finalPrice
  }

  private generateGoogleDescription(place: any): string {
    const types = place.types || []
    const priceLevel = place.price_level || 2 // 1-4 price scale from Google
    const priceDescriptions = {
      1: 'budget-friendly',
      2: 'moderately priced',
      3: 'upscale', 
      4: 'fine dining'
    }
    
    let description = `${place.name || 'A local venue'} offers ${priceDescriptions[priceLevel as keyof typeof priceDescriptions]} dining and entertainment.`
    
    // Add specific details based on venue type
    if (types.includes('movie_theater') || types.includes('cinema')) {
      description += ` This cinema features the latest releases with modern projection and sound systems.`
      if (priceLevel <= 2) {
        description += ` Matinee tickets are typically $8-12, with evening shows $12-15.`
      } else {
        description += ` Premium theater experience with tickets $15-20 for evening showings.`
      }
    } else if (types.includes('bowling_alley')) {
      description += ` Enjoy a fun date night with bowling, arcade games, and onsite dining.`
      description += ` Bowling costs $15-25 per person, with food and drinks available.`
    } else if (types.includes('restaurant') || types.includes('food')) {
      description += ` Known for excellent service and a perfect atmosphere for date nights.`
      if (priceLevel === 1) {
        description += ` Budget-friendly entrees range from $12-18.`
      } else if (priceLevel === 2) {
        description += ` Mid-range pricing with entrees $18-28, offering great value.`
      } else if (priceLevel === 3) {
        description += ` Upscale dining experience with entrees $28-45 and premium service.`
      } else {
        description += ` Fine dining establishment with entrees $45+ and exceptional cuisine.`
      }
    } else if (types.includes('bar') || types.includes('night_club')) {
      description += ` Perfect venue for conversation with craft cocktails and quality beverages.`
      description += ` Cocktails range $8-15, with beer and wine $5-10.`
    } else if (types.includes('amusement_park') || types.includes('park')) {
      description += ` Great outdoor venue for activities and entertainment.`
      description += ` Entry fees typically $10-25 per person depending on activities.`
    } else {
      description += ` A popular local venue perfect for date nights and entertainment.`
    }
    
    // Add additional details
    if (place.rating >= 4.5) {
      description += ` Highly rated by customers for exceptional quality.`
    }
    
    if (place.opening_hours?.open_now) {
      description += ` Currently open and ready to welcome guests.`
    }
    
    return description
  }

  private generateGoogleHighlights(place: any): string[] {
    const highlights = []
    
    if (place.rating >= 4.5) highlights.push('Excellent ratings')
    if (place.user_ratings_total >= 1000) highlights.push('Popular spot')
    if (place.price_level) highlights.push(`${this.convertGooglePriceLevel(place.price_level)} pricing`)
    if (place.opening_hours?.open_now) highlights.push('Open now')
    if (place.types?.includes('outdoor_seating')) highlights.push('Outdoor seating')
    if (place.types?.includes('delivery')) highlights.push('Delivery available')
    
    return highlights.slice(0, 6)
  }

  private extractGoogleTags(place: any): string[] {
    return place.types || []
  }

  private extractGoogleFeatures(place: any): string[] {
    const features = []
    
    if (place.types?.includes('outdoor_seating')) features.push('Outdoor Seating')
    if (place.types?.includes('delivery')) features.push('Delivery Available')
    if (place.types?.includes('takeout')) features.push('Takeout Available')
    if (place.types?.includes('wheelchair_accessible_entrance')) features.push('Wheelchair Accessible')
    if (place.opening_hours?.open_now) features.push('Currently Open')
    
    return features
  }

  private getGoogleApiKey(): string {
    // In production, this would come from environment variables
    // For now, we'll use a placeholder
    return process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY || 'demo-key'
  }

  private filterByTimeOfDay(venues: Venue[], timeOfDay: string): Venue[] {
    const timeFilter = TIME_FILTERS[timeOfDay]
    if (!timeFilter) return venues

    
    return venues.filter(venue => {
      // Check if venue meets minimum rating for this time
      if (venue.rating < timeFilter.minRating) {
        return false
      }

      // Check opening hours if available
      if (venue.hours) {
        const isOpenAtTime = this.checkIfOpen(venue.hours, timeFilter.timeRange)
        if (!isOpenAtTime) {
          return false
        }
      }

      // Check venue type preferences
      const venueType = this.getVenueType(venue)
      const isPreferred = timeFilter.venueTypes.preferred.includes(venueType)
      const isAvoided = timeFilter.venueTypes.avoided.includes(venueType)

      // Prefer preferred venues, avoid avoided ones
      if (isAvoided) return false
      if (isPreferred) return true

      // If not preferred or avoided, include based on rating
      return venue.rating >= timeFilter.minRating + 0.2
    })
  }

  private checkIfOpen(hours: string, timeRange: { start: string; end: string }): boolean {
    // Simple check - in production you'd use a proper opening hours parser
    try {
      // Look for common opening patterns
      const hasEveningHours = hours.includes('evening') || 
                            hours.includes('night') || 
                            hours.includes('late') ||
                            hours.includes('dusk') ||
                            hours.includes('sunset')

      const hasWeekendHours = hours.includes('weekend') || 
                             hours.includes('sat') || 
                             hours.includes('sun')

      // For simplicity, assume venues with evening/night keywords are open
      return hasEveningHours || hasWeekendHours || !hours.includes('morning')
    } catch {
      // If we can't parse hours, assume it's open
      return true
    }
  }

  private getVenueType(venue: Venue): string {
    // Determine venue type from tags and category
    if (venue.tags.includes('restaurant') || venue.category === 'dinner') return 'restaurant'
    if (venue.tags.includes('bar') || venue.tags.includes('pub') || venue.category === 'drinks') return 'bar'
    if (venue.tags.includes('cafe')) return 'cafe'
    if (venue.tags.includes('nightclub')) return 'nightclub'
    if (venue.tags.includes('brewery')) return 'brewery'
    if (venue.tags.includes('lounge')) return 'lounge'
    if (venue.tags.includes('bistro')) return 'bistro'
    if (venue.tags.includes('wine_bar')) return 'wine_bar'
    if (venue.tags.includes('cocktail_bar')) return 'cocktail_bar'
    if (venue.tags.includes('karaoke')) return 'karaoke'
    if (venue.tags.includes('sports_bar')) return 'sports_bar'
    if (venue.tags.includes('fast_food')) return 'fast_food'
    if (venue.tags.includes('family_restaurant')) return 'family_restaurant'
    
    return 'general'
  }

  private async searchOpenStreetMap(criteria: SearchCriteria): Promise<Venue[]> {
    const queries = this.buildOverpassQueries(criteria)
    const venues: Venue[] = []

    // Add delay between queries to avoid rate limiting
    const queryDelay = 1000 // 1 second between queries

    for (let i = 0; i < queries.length; i++) {
      const query = queries[i]
      
      try {
        // Add delay except for first query
        if (i > 0) {
          await new Promise(resolve => setTimeout(resolve, queryDelay))
        }
        

        // Use server-side API route to avoid CORS issues
        const response = await fetch('/api/venues/search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'overpass', query })
        })

        if (!response.ok) {
          if (response.status === 429) {
            await new Promise(resolve => setTimeout(resolve, 5000))
            continue
          } else if (response.status === 504) {
            // Retry with a simpler query on timeout
            if (query.includes('timeout:30') || query.includes('timeout:15')) {
              // Try a much simpler query
              const simpleQuery = `
[out:json][timeout:8];
(
  node["amenity"="restaurant"]["addr:state"="Maryland"];
);
out count;
`
              try {
                const retryResponse = await fetch('/api/venues/search', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ action: 'overpass', query: simpleQuery })
                })
                if (retryResponse.ok) {
                  continue
                }
              } catch (retryError) {
              }
            }
            continue
          } else if (response.status === 400) {
            continue
          } else {
            continue
          }
        }

        let data
        try {
          data = await response.json()
        } catch (parseError) {
          continue
        }

        if (!data || typeof data !== 'object') {
          continue
        }

        const parsedVenues = this.parseOverpassResponse(data, criteria)
        venues.push(...parsedVenues)
      } catch (error) {
        // Continue with next query instead of failing completely
      }
    }

    return venues
  }

  private buildOverpassQueries(criteria: SearchCriteria): string[] {
    const queries = []
    
    // Extract location name for simpler queries
    const locationName = this.extractLocationName(criteria.location)
    const stateName = this.extractStateName(criteria.location)

    // Query 1: Ultra-fast - just restaurants and bars in state (8s timeout)
    if (stateName) {
      queries.push(`
[out:json][timeout:8];
area["name"="${stateName}"]->.searchArea;
(
  node["amenity"~"restaurant|bar|pub"](area.searchArea);
);
out geom;
`)
    }

    // Query 2: Even more minimal - just restaurants (5s timeout)
    if (stateName) {
      queries.push(`
[out:json][timeout:5];
area["name"="${stateName}"]->.searchArea;
(
  node["amenity"="restaurant"](area.searchArea);
);
out geom;
`)
    }

    // Query 3: Last resort - just state filter, count only (3s timeout)
    queries.push(`
[out:json][timeout:3];
(
  node["amenity"="restaurant"]["addr:state"="${stateName}"];
);
out count;
`)

    return queries
  }

  private extractStateName(location: string): string {
    const parts = location.split(',').map(part => part.trim().toLowerCase())
    
    // Look for state in the location parts
    for (const part of parts) {
      if (part === 'maryland' || part === 'md') {
        return 'Maryland'
      }
      if (part === 'virginia' || part === 'va') {
        return 'Virginia'
      }
      // Add more states as needed
    }
    
    return 'Maryland' // Default to Maryland for this area
  }

  private calculateBoundingBox(lat: number, lng: number, timeOfDay: string): string {
    // Calculate bounding box based on time of day (larger for late night)
    const radius = timeOfDay === 'late' ? 15 : 8 // miles
    const latDelta = radius / 69 // Approximate miles per degree latitude
    const lngDelta = radius / (Math.cos(lat * Math.PI / 180) * 69) // Adjust for longitude
    
    const south = lat - latDelta
    const north = lat + latDelta
    const west = lng - lngDelta
    const east = lng + lngDelta
    
    return `${south},${west},${north},${east}`
  }

  private extractLocationName(location: string): string {
    // All US state names for detection
    const usStates = new Set([
      'alabama', 'alaska', 'arizona', 'arkansas', 'california', 'colorado',
      'connecticut', 'delaware', 'florida', 'georgia', 'hawaii', 'idaho',
      'illinois', 'indiana', 'iowa', 'kansas', 'kentucky', 'louisiana',
      'maine', 'maryland', 'massachusetts', 'michigan', 'minnesota',
      'mississippi', 'missouri', 'montana', 'nebraska', 'nevada',
      'new hampshire', 'new jersey', 'new mexico', 'new york',
      'north carolina', 'north dakota', 'ohio', 'oklahoma', 'oregon',
      'pennsylvania', 'rhode island', 'south carolina', 'south dakota',
      'tennessee', 'texas', 'utah', 'vermont', 'virginia', 'washington',
      'west virginia', 'wisconsin', 'wyoming', 'united states', 'usa', 'us'
    ])

    // State → largest city name for Overpass queries
    const stateToCityName: Record<string, string> = {
      'maine': 'Portland', 'alabama': 'Birmingham', 'alaska': 'Anchorage',
      'arizona': 'Phoenix', 'arkansas': 'Little Rock', 'california': 'Los Angeles',
      'colorado': 'Denver', 'connecticut': 'Hartford', 'delaware': 'Wilmington',
      'florida': 'Miami', 'georgia': 'Atlanta', 'hawaii': 'Honolulu',
      'idaho': 'Boise', 'illinois': 'Chicago', 'indiana': 'Indianapolis',
      'iowa': 'Des Moines', 'kansas': 'Wichita', 'kentucky': 'Louisville',
      'louisiana': 'New Orleans', 'maryland': 'Baltimore', 'massachusetts': 'Boston',
      'michigan': 'Detroit', 'minnesota': 'Minneapolis', 'mississippi': 'Jackson',
      'missouri': 'Kansas City', 'montana': 'Missoula', 'nebraska': 'Omaha',
      'nevada': 'Las Vegas', 'new hampshire': 'Manchester', 'new jersey': 'Newark',
      'new mexico': 'Albuquerque', 'new york': 'New York', 'north carolina': 'Charlotte',
      'north dakota': 'Fargo', 'ohio': 'Columbus', 'oklahoma': 'Oklahoma City',
      'oregon': 'Portland', 'pennsylvania': 'Philadelphia', 'rhode island': 'Providence',
      'south carolina': 'Charleston', 'south dakota': 'Sioux Falls', 'tennessee': 'Nashville',
      'texas': 'Houston', 'utah': 'Salt Lake City', 'vermont': 'Burlington',
      'virginia': 'Virginia Beach', 'washington': 'Seattle', 'west virginia': 'Charleston',
      'wisconsin': 'Milwaukee', 'wyoming': 'Cheyenne'
    }

    // If the entire input is a state name, resolve to its largest city
    const cleaned = location.toLowerCase().replace(/,?\s*(united states|usa|us)$/i, '').trim()
    if (stateToCityName[cleaned]) {
      return stateToCityName[cleaned]
    }

    // Extract city from location string (e.g., "Loyola/Notre Dame, Baltimore, Maryland" -> "Baltimore")
    const parts = location.split(',').map(part => part.trim())
    
    // Try to find the city (usually the second part or before the state)
    for (const part of parts) {
      const partLower = part.toLowerCase().trim()
      // Skip if it's a state, country, neighborhood with slash, or too short
      if (usStates.has(partLower) || part.includes('/') || part.length < 3) {
        continue
      }
      
      // This is likely the city
      return part
    }
    
    // Fallback to second to last part, or first part
    return parts[parts.length - 2] || parts[0] || "New York"
  }

  private parseOverpassResponse(data: any, criteria: SearchCriteria): Venue[] {
    const venues: Venue[] = []

    if (!data.elements) return venues

    data.elements.forEach((element: any) => {
      const tags = element.tags || {}
      
      // Skip if missing name
      if (!tags.name) return

      // Extract coordinates: nodes have lat/lon directly, ways/relations have geometry array
      let lat = element.lat
      let lon = element.lon

      if (!lat || !lon) {
        // For ways/relations, calculate center from geometry
        if (element.geometry && Array.isArray(element.geometry) && element.geometry.length > 0) {
          const points = element.geometry.filter((p: any) => p.lat && p.lon)
          if (points.length > 0) {
            lat = points.reduce((sum: number, p: any) => sum + p.lat, 0) / points.length
            lon = points.reduce((sum: number, p: any) => sum + p.lon, 0) / points.length
          }
        } else if (element.center) {
          lat = element.center.lat
          lon = element.center.lon
        } else if (element.bounds) {
          lat = (element.bounds.minlat + element.bounds.maxlat) / 2
          lon = (element.bounds.minlon + element.bounds.maxlon) / 2
        }
      }

      // Skip if we still couldn't determine coordinates
      if (!lat || !lon) return

      // Extract venue features from tags
      const features = this.extractVenueFeatures(tags)

      const venue: Venue = {
        id: `osm-${element.id}`,
        name: tags.name,
        category: this.categorizeVenue(tags),
        rating: this.generateRating(tags),
        reviewCount: this.generateReviewCount(tags),
        priceRange: this.determinePriceRange(tags, criteria.budget),
        address: this.buildAddress(tags),
        phone: tags.phone,
        website: tags.website,
        imageUrl: this.generateImageUrl(tags),
        description: this.generateDescription(tags),
        highlights: this.generateHighlights(tags),
        coordinates: {
          lat,
          lng: lon
        },
        hours: tags.opening_hours,
        tags: this.extractTags(tags),
        capacity: this.extractCapacity(tags),
        features
      }

      venues.push(venue)
    })

    return venues
  }

  private extractVenueFeatures(tags: any): string[] {
    const features = []
    
    // Common venue features
    if (tags.outdoor_seating) features.push('Outdoor Seating')
    if (tags.parking) features.push('Parking Available')
    if (tags.wifi) features.push('Free WiFi')
    if (tags.reservation) features.push('Reservations Recommended')
    if (tags.delivery) features.push('Delivery Available')
    if (tags.takeaway) features.push('Takeout Available')
    if (tags.wheelchair) features.push('Wheelchair Accessible')
    if (tags.air_conditioning) features.push('Air Conditioning')
    if (tags.music) features.push('Live Music')
    if (tags.cuisine) features.push(`Cuisine: ${tags.cuisine}`)
    if (tags.smoking) features.push(tags.smoking === 'no' ? 'Non-Smoking' : 'Smoking Area')
    
    return features
  }

  private extractCapacity(tags: any): number | undefined {
    // Try to extract capacity from tags
    if (tags.capacity) {
      const capacity = parseInt(tags.capacity.toString())
      return isNaN(capacity) ? undefined : capacity
    }
    
    if (tags.seats) {
      const seats = parseInt(tags.seats.toString())
      return isNaN(seats) ? undefined : seats
    }
    
    return undefined
  }

  private categorizeVenue(tags: any): 'drinks' | 'dinner' | 'activity' {
    const amenity = (tags.amenity || '').toLowerCase()
    const leisure = (tags.leisure || '').toLowerCase()
    const tourism = (tags.tourism || '').toLowerCase()
    const sport = (tags.sport || '').toLowerCase()

    // Drinks
    if (amenity === 'bar' || amenity === 'pub' || amenity === 'nightclub') return 'drinks'
    
    // Dinner
    if (amenity === 'restaurant' || amenity === 'ice_cream') return 'dinner'
    
    // Activity — entertainment amenities
    if (['arts_centre', 'cinema', 'theatre', 'bowling_alley', 'casino', 'community_centre'].includes(amenity)) return 'activity'
    
    // Activity — leisure types
    if (leisure && ['sports_centre', 'fitness_centre', 'miniature_golf', 'ice_rink',
        'water_park', 'bowling_alley', 'escape_game', 'amusement_arcade',
        'stadium', 'dance', 'park', 'garden'].includes(leisure)) return 'activity'
    
    // Activity — tourism types
    if (tourism && ['museum', 'gallery', 'aquarium', 'zoo', 'theme_park',
        'attraction', 'viewpoint'].includes(tourism)) return 'activity'
    
    // Activity — sport types
    if (sport && ['bowling', 'climbing', 'skating'].includes(sport)) return 'activity'
    
    // Default categorization based on tags
    if (tags.cuisine) return 'dinner'
    if (tags.bar) return 'drinks'
    return 'activity'
  }

  private generateRating(tags: any): number {
    // Generate more realistic ratings based on venue characteristics
    let baseRating = 3.5 + Math.random() * 1.5 // 3.5 to 5.0
    
    // Boost rating for venues with good features
    if (tags.reservation) baseRating += 0.2
    if (tags.outdoor_seating) baseRating += 0.1
    if (tags.wifi) baseRating += 0.1
    if (tags.cuisine && !tags.cuisine.includes('fast')) baseRating += 0.2
    
    // Cap at 5.0
    return Math.min(baseRating, 5.0)
  }

  private generateReviewCount(tags: any): number {
    // Generate realistic review counts based on venue type and location
    let baseCount = Math.floor(Math.random() * 400) + 50 // 50 to 450
    
    // Boost reviews for popular venues
    if (tags.reservation) baseCount += Math.floor(Math.random() * 200)
    if (tags.outdoor_seating) baseCount += Math.floor(Math.random() * 100)
    if (tags.cuisine && tags.cuisine.includes('fine')) baseCount += Math.floor(Math.random() * 300)
    
    return baseCount
  }

  private generateDescription(tags: any): string {
    const venueType = tags.amenity || 'venue'
    const cuisine = tags.cuisine ? `serving ${tags.cuisine}` : ''
    const features = []
    
    if (tags.outdoor_seating) features.push('outdoor seating')
    if (tags.wifi) features.push('free WiFi')
    if (tags.live_music) features.push('live music')
    if (tags.reservation) features.push('reservation service')
    
    const featureText = features.length > 0 ? ` with ${features.join(', ')}` : ''
    
    return `A popular local ${venueType}${cuisine ? ` ${cuisine}` : ''}${featureText}. Known for its welcoming atmosphere and quality service.`
  }

  private generateHighlights(tags: any): string[] {
    const highlights = ['Popular with locals', 'Great atmosphere']
    
    if (tags.outdoor_seating) highlights.push('Outdoor seating available')
    if (tags.live_music || tags.music) highlights.push('Live music on weekends')
    if (tags.central) highlights.push('Central location')
    if (tags.parking) highlights.push('Parking available')
    if (tags.wifi) highlights.push('Free WiFi')
    if (tags.reservation) highlights.push('Reservations recommended')
    
    // Add 2-3 more highlights based on venue type
    const extraHighlights = [
      'Friendly staff',
      'Reasonable prices',
      'Cozy interior',
      'Extensive menu',
      'Full bar service',
      'Happy hour specials',
      'Late night hours',
      'Family friendly',
      'Date night perfect',
      'Group friendly'
    ]
    
    // Add random highlights to reach 4-6 total
    while (highlights.length < 5 && extraHighlights.length > 0) {
      const randomIndex = Math.floor(Math.random() * extraHighlights.length)
      const highlight = extraHighlights.splice(randomIndex, 1)[0]
      highlights.push(highlight)
    }
    
    return highlights.slice(0, 6)
  }

  private determinePriceRange(tags: any, userBudget: string): string {
    // Analyze venue characteristics to determine realistic price range
    let priceScore = 0

    // Cuisine type influences price
    if (tags.cuisine) {
      const cuisine = tags.cuisine.toLowerCase()
      if (cuisine.includes('fine_dining') || cuisine.includes('gourmet')) priceScore += 3
      else if (cuisine.includes('italian') || cuisine.includes('french') || cuisine.includes('japanese')) priceScore += 2
      else if (cuisine.includes('fast_food') || cuisine.includes('casual')) priceScore -= 1
    }

    // Venue type influences price
    if (tags.amenity === 'restaurant') {
      if (tags.name?.toLowerCase().includes('bistro') || tags.name?.toLowerCase().includes('café')) priceScore += 1
      if (tags.name?.toLowerCase().includes('grill') || tags.name?.toLowerCase().includes('house')) priceScore += 2
    }

    // Features indicate price level
    if (tags.reservation || tags.wifi) priceScore += 1
    if (tags.outdoor_seating) priceScore += 1
    if (tags.stars) {
      const stars = parseInt(tags.stars.toString())
      priceScore += stars - 1
    }

    // Map score to price range
    let estimated: string
    if (priceScore >= 4) estimated = '$$$$'
    else if (priceScore >= 2) estimated = '$$$'
    else if (priceScore >= 0) estimated = '$$'
    else estimated = '$'

    // Cap at user's budget — don't assign a higher price range than what the user selected
    const priceLevels: Record<string, number> = { '$': 1, '$$': 2, '$$$': 3, '$$$$': 4 }
    const estimatedLevel = priceLevels[estimated] || 2
    const budgetLevel = priceLevels[userBudget] || 2
    if (estimatedLevel > budgetLevel) {
      return userBudget
    }
    return estimated
  }

  private buildAddress(tags: any): string {
    const parts = [
      tags['addr:housenumber'],
      tags['addr:street'],
      tags['addr:city'],
      tags['addr:state']
    ].filter(Boolean)

    return parts.join(', ') || 'Address not available'
  }

  private generateImageUrl(tags: any): string {
    const category = tags.amenity || 'venue'
    const seed = tags.name || category
    return `https://source.unsplash.com/800x600/?${seed},venue&sig=${Math.random().toString(36).substr(2, 9)}`
  }

  
  
  private extractTags(tags: any): string[] {
    return Object.keys(tags).filter(key => 
      !key.startsWith('addr:') && 
      !key.startsWith('opening_hours') &&
      typeof tags[key] === 'string' &&
      tags[key].length < 50 &&
      !key.startsWith('name') &&
      !key.startsWith('amenity') &&
      !key.startsWith('cuisine')
    )
  }

  private deduplicateVenues(venues: Venue[]): Venue[] {
    const seen = new Set()
    return venues.filter(venue => {
      const key = `${venue.name.toLowerCase()}-${venue.coordinates.lat.toFixed(4)}-${venue.coordinates.lng.toFixed(4)}`
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
  }

  private rankVenues(venues: Venue[], criteria: SearchCriteria): Venue[] {
    
    return venues.sort((a, b) => {
      let scoreA = 0
      let scoreB = 0

      // 1. Budget Match (30% weight) - Real pricing from Google reviews
      const budgetMatchA = this.getBudgetMatchScore(a.priceRange, criteria.budget)
      const budgetMatchB = this.getBudgetMatchScore(b.priceRange, criteria.budget)
      scoreA += budgetMatchA * 0.3
      scoreB += budgetMatchB * 0.3

      // 2. Rating Quality (25% weight) - Real Google ratings
      scoreA += (a.rating / 5) * 0.25
      scoreB += (b.rating / 5) * 0.25

      // 3. Time Compatibility (20% weight) - Real opening hours
      const timeScoreA = this.getTimeCompatibilityScore(a, criteria.time)
      const timeScoreB = this.getTimeCompatibilityScore(b, criteria.time)
      scoreA += timeScoreA * 0.2
      scoreB += timeScoreB * 0.2

      // 4. Vibe Match (15% weight) - Feature-based matching
      const vibeScoreA = this.getVibeMatchScore(a, criteria.vibes)
      const vibeScoreB = this.getVibeMatchScore(b, criteria.vibes)
      scoreA += vibeScoreA * 0.15
      scoreB += vibeScoreB * 0.15

      // 5. Popularity (10% weight) - Real review counts
      const popularityA = Math.min(a.reviewCount / 1000, 1) // Cap at 1000 reviews
      const popularityB = Math.min(b.reviewCount / 1000, 1)
      scoreA += popularityA * 0.1
      scoreB += popularityB * 0.1

      // 6. Category Balance (10% weight) - Ensure variety
      scoreA += this.getCategoryScore(a.category) * 0.1
      scoreB += this.getCategoryScore(b.category) * 0.1

      // 7. Random Factor (5% weight) - Add variety
      scoreA += Math.random() * 0.05
      scoreB += Math.random() * 0.05

      const totalScoreA = scoreA
      const totalScoreB = scoreB
      

      return totalScoreB - totalScoreA // Sort descending
    })
  }

  private getTimeCompatibilityScore(venue: Venue, timeOfDay: string): number {
    const timeFilter = TIME_FILTERS[timeOfDay]
    if (!timeFilter) return 0.5

    // Check if venue is actually open during the requested time
    if (venue.hours) {
      const isOpen = this.checkIfOpen(venue.hours, timeFilter.timeRange)
      if (!isOpen) return 0.1 // Heavy penalty if closed
    }

    // Check if venue type matches time preference
    const venueType = venue.category
    const preferredTypes = timeFilter.venueTypes.preferred
    const avoidedTypes = timeFilter.venueTypes.avoided

    if (preferredTypes.includes(venueType)) return 1.0
    if (avoidedTypes.includes(venueType)) return 0.2
    return 0.6 // Neutral
  }

  private getVibeMatchScore(venue: Venue, userVibes: string[]): number {
    let score = 0.5 // Base score
    
    // Match venue features with user vibes
    userVibes.forEach(vibe => {
      switch (vibe) {
        case 'romantic':
          if (venue.features.includes('Romantic Atmosphere') || 
              venue.features.includes('Intimate Setting') ||
              venue.description.toLowerCase().includes('romantic')) {
            score += 0.3
          }
          break
        case 'cozy':
          if (venue.features.includes('Cozy Interior') ||
              venue.features.includes('Warm Atmosphere') ||
              venue.description.toLowerCase().includes('cozy')) {
            score += 0.3
          }
          break
        case 'adventurous':
          if (venue.features.includes('Unique Experience') ||
              venue.features.includes('Interactive') ||
              venue.description.toLowerCase().includes('adventur')) {
            score += 0.3
          }
          break
        case 'casual':
          if (venue.features.includes('Casual') ||
              venue.priceRange === '$' ||
              venue.description.toLowerCase().includes('casual')) {
            score += 0.3
          }
          break
        case 'upscale':
          if (venue.features.includes('Fine Dining') ||
              venue.priceRange === '$$$' || venue.priceRange === '$$$$' ||
              venue.description.toLowerCase().includes('upscale')) {
            score += 0.3
          }
          break
      }
    })

    return Math.min(score, 1.0) // Cap at 1.0
  }

  private getBudgetMatchScore(venuePrice: string, userBudget: string): number {
    const ranges = ['$', '$$', '$$$', '$$$$']
    const venueIndex = ranges.indexOf(venuePrice)
    const userIndex = ranges.indexOf(userBudget)
    
    if (venueIndex === userIndex) return 1.0
    if (Math.abs(venueIndex - userIndex) === 1) return 0.7
    if (Math.abs(venueIndex - userIndex) === 2) return 0.4
    return 0.1
  }

  private getCategoryScore(category: string): number {
    // Ensure we get a good mix of venue types
    return Math.random() * 0.5 + 0.5 // 0.5 to 1.0
  }

  private calculateCustomPreferencesScore(venue: Venue, criteria: SearchCriteria): number {
    let score = 0.5 // Base score
    
    // Time gap preferences
    if (criteria.timeGapPreference === 'short' || criteria.maxTravelTime) {
      // For venues that would result in shorter travel times, give higher scores
      // This would require calculating travel between venues, which is complex
      // For now, we'll use venue density as a proxy
      if (criteria.venueDensity === 'concentrated') {
        score += 0.3
      }
    }
    
    // Custom requests parsing
    if (criteria.customRequests) {
      const customLower = criteria.customRequests.toLowerCase()
      
      // Walking distance preference
      if (customLower.includes('walking distance') || customLower.includes('walkable')) {
        // Prefer venues in dense urban areas (this is a simplified approach)
        if (venue.address && (venue.address.includes('Downtown') || venue.address.includes('City Center'))) {
          score += 0.3
        }
      }
      
      // Less travel preference
      if (customLower.includes('less travel') || customLower.includes('minimize travel') || 
          customLower.includes('closer time gaps') || customLower.includes('shorter travel')) {
        // Prefer venues that are likely to be closer together
        score += 0.2
      }
      
      // More variety preference  
      if (customLower.includes('more variety') || customLower.includes('different areas')) {
        // Reward venues in different neighborhoods/areas
        score += 0.2
      }
    }
    
    // Venue density preference
    if (criteria.venueDensity === 'concentrated') {
      // Prefer venues in central locations
      if (venue.address && (venue.address.includes('Center') || venue.address.includes('Downtown'))) {
        score += 0.2
      }
    } else if (criteria.venueDensity === 'spread_out') {
      // Prefer venues in different areas
      score += 0.1
    }
    
    return Math.min(score, 1.0)
  }

  private applyCustomPreferencesFilter(venues: Venue[], criteria: SearchCriteria): Venue[] {
    if (!criteria.customRequests && !criteria.timeGapPreference && !criteria.venueDensity) {
      return venues // No custom preferences to apply
    }

    return venues.filter(venue => {
      let score = 0
      
      // Custom requests filtering
      if (criteria.customRequests) {
        const customLower = criteria.customRequests.toLowerCase()
        
        // Walking distance preference - prefer downtown/central venues
        if (customLower.includes('walking distance') || customLower.includes('walkable')) {
          if (venue.address && (venue.address.includes('Downtown') || venue.address.includes('City Center') || venue.address.includes('Center'))) {
            score += 1
          } else {
            score -= 0.5
          }
        }
        
        // Less travel/closer time gaps - prefer venues in same general area
        if (customLower.includes('less travel') || customLower.includes('minimize travel') || 
            customLower.includes('closer time gaps') || customLower.includes('shorter travel')) {
          // This is simplified - in reality we'd calculate distances between venues
          if (venue.address && venue.address.length < 30) { // Shorter addresses might indicate more central locations
            score += 0.5
          }
        }
        
        // More variety - prefer venues in different areas
        if (customLower.includes('more variety') || customLower.includes('different areas')) {
          score += 0.3 // All venues get a small boost for variety preference
        }
      }
      
      // Venue density preference
      if (criteria.venueDensity === 'concentrated') {
        if (venue.address && (venue.address.includes('Downtown') || venue.address.includes('Center'))) {
          score += 1
        } else {
          score -= 0.3
        }
      } else if (criteria.venueDensity === 'spread_out') {
        // Prefer venues not in downtown areas
        if (venue.address && !venue.address.includes('Downtown')) {
          score += 0.5
        }
      }
      
      // Keep venues that meet minimum score threshold
      return score >= 0
    })
  }

  private buildCustomPreferencesPrompt(criteria: SearchCriteria): string {
    const preferences = []
    
    // Time gap preferences
    if (criteria.timeGapPreference === 'short') {
      preferences.push('User prefers venues with short travel times between locations (under 10 minutes)')
    } else if (criteria.timeGapPreference === 'medium') {
      preferences.push('User prefers moderate travel times between venues (10-20 minutes)')
    } else if (criteria.timeGapPreference === 'long') {
      preferences.push('User is comfortable with longer travel times between venues (20+ minutes)')
    }
    
    // Maximum travel time
    if (criteria.maxTravelTime) {
      preferences.push(`User wants maximum travel time of ${criteria.maxTravelTime} minutes between venues`)
    }
    
    // Venue density preference
    if (criteria.venueDensity === 'concentrated') {
      preferences.push('User prefers venues concentrated in one area to minimize travel')
    } else if (criteria.venueDensity === 'spread_out') {
      preferences.push('User prefers venues spread out across different areas for variety')
    }
    
    // Special occasion preferences
    if (criteria.occasion) {
      if (criteria.occasion === 'birthday') {
        preferences.push('User is planning a birthday celebration - look for venues with celebration atmosphere, birthday packages, or special birthday treatment')
      } else if (criteria.occasion === 'anniversary') {
        preferences.push('User is celebrating an anniversary - prioritize romantic, intimate venues with special touches for couples')
      } else if (criteria.occasion === 'holiday') {
        preferences.push('User wants holiday-themed venues with seasonal decorations and festive atmosphere')
      } else if (criteria.occasion === 'celebration') {
        preferences.push('User is planning a celebration - look for venues with party atmosphere, group accommodations, and celebratory features')
      } else if (criteria.occasion === 'surprise') {
        preferences.push('User wants surprise elements - include hidden gems, unique experiences, and unexpected delights')
      }
    }
    
    // Seasonal preferences
    if (criteria.season && criteria.season !== 'any') {
      if (criteria.season === 'winter') {
        preferences.push('User wants winter activities - ice skating, cozy indoor venues, holiday markets, warm and romantic spots')
      } else if (criteria.season === 'summer') {
        preferences.push('User wants summer activities - outdoor dining, rooftop bars, patios, seasonal festivals, water activities')
      } else if (criteria.season === 'fall') {
        preferences.push('User wants fall activities - pumpkin patches, apple orchards, fall foliage spots, cozy autumn venues')
      } else if (criteria.season === 'spring') {
        preferences.push('User wants spring activities - botanical gardens, outdoor brunch, flower festivals, patio dining')
      }
    }
    
    // Holiday-specific preferences
    if (criteria.holiday) {
      if (criteria.holiday === 'valentine') {
        preferences.push('User wants Valentine\'s Day venues - romantic restaurants, flower shops, chocolate tastings, intimate settings')
      } else if (criteria.holiday === 'christmas') {
        preferences.push('User wants Christmas venues - holiday markets, festive restaurants, decorated venues, seasonal events')
      } else if (criteria.holiday === 'halloween') {
        preferences.push('User wants Halloween venues - haunted houses, themed bars, costume parties, spooky activities')
      } else if (criteria.holiday === 'new-year') {
        preferences.push('User wants New Year\'s Eve venues - countdown events, party venues, celebration spots, late-night venues')
      }
    }
    
    // Surprise elements
    if (criteria.surpriseElements) {
      preferences.push('User wants surprise elements and hidden gems - include unique, lesser-known venues with special features or unexpected delights')
    }
    
    // Custom theme
    if (criteria.theme) {
      preferences.push(`User wants a ${criteria.theme} theme - select venues that match this atmosphere and style`)
    }
    
    // Custom requests
    if (criteria.customRequests) {
      // Parse common phrases from custom requests
      const customLower = criteria.customRequests.toLowerCase()
      
      if (customLower.includes('closer time gaps') || customLower.includes('shorter travel')) {
        preferences.push('User specifically requested closer time gaps between venues')
      }
      
      if (customLower.includes('walking distance') || customLower.includes('walkable')) {
        preferences.push('User prefers venues within walking distance of each other')
      }
      
      if (customLower.includes('less travel') || customLower.includes('minimize travel')) {
        preferences.push('User wants to minimize travel time between venues')
      }
      
      if (customLower.includes('more variety') || customLower.includes('different areas')) {
        preferences.push('User wants variety in locations and venue types')
      }
      
      // Add the full custom request for AI to interpret
      preferences.push(`User specifically requested: "${criteria.customRequests}"`)
    }
    
    // Add vibe and budget context
    if (criteria.vibes.includes('romantic')) {
      preferences.push('User wants romantic venues suitable for dates')
    }
    
    if (criteria.budget === '$') {
      preferences.push('User prefers budget-friendly options')
    } else if (criteria.budget === '$$$$') {
      preferences.push('User wants upscale, premium venues')
    }
    
    return preferences.length > 0 ? preferences.join('. ') + '.' : 'No specific custom preferences provided.'
  }

  // Special occasion venue enhancement
  private enhanceVenuesForOccasion(venues: Venue[], criteria: SearchCriteria): Venue[] {
    return venues.map(venue => {
      const enhanced = { ...venue }
      
      // Add special occasion features
      if (criteria.occasion === 'birthday') {
        enhanced.features = [...(enhanced.features || []), 'Birthday packages available', 'Celebration friendly']
        enhanced.highlights = [...(enhanced.highlights || []), 'Great for birthdays', 'Celebration atmosphere']
      } else if (criteria.occasion === 'anniversary') {
        enhanced.features = [...(enhanced.features || []), 'Romantic setting', 'Intimate atmosphere', 'Special occasion dining']
        enhanced.highlights = [...(enhanced.highlights || []), 'Perfect for anniversaries', 'Romantic ambiance']
      } else if (criteria.occasion === 'holiday') {
        enhanced.features = [...(enhanced.features || []), 'Seasonal decorations', 'Holiday specials', 'Festive atmosphere']
        enhanced.highlights = [...(enhanced.highlights || []), 'Holiday themed', 'Seasonal celebrations']
      }
      
      // Add seasonal features
      if (criteria.season === 'winter') {
        enhanced.features = [...(enhanced.features || []), 'Cozy winter atmosphere', 'Warm and inviting']
        if (venue.category === 'activity') {
          enhanced.highlights = [...(enhanced.highlights || []), 'Winter activity', 'Seasonal fun']
        }
      } else if (criteria.season === 'summer') {
        enhanced.features = [...(enhanced.features || []), 'Outdoor seating', 'Summer specials', 'Patio dining']
        enhanced.highlights = [...(enhanced.highlights || []), 'Perfect for summer', 'Outdoor atmosphere']
      } else if (criteria.season === 'fall') {
        enhanced.features = [...(enhanced.features || []), 'Autumn ambiance', 'Seasonal decorations']
        enhanced.highlights = [...(enhanced.highlights || []), 'Fall atmosphere', 'Seasonal charm']
      }
      
      // Add surprise elements
      if (criteria.surpriseElements) {
        enhanced.features = [...(enhanced.features || []), 'Hidden gem', 'Unique experience', 'Surprise element']
        enhanced.highlights = [...(enhanced.highlights || []), 'Unexpected delight', 'Hidden treasure']
      }
      
      return enhanced
    })
  }

  // Get seasonal activity suggestions
  private getSeasonalActivities(criteria: SearchCriteria): string[] {
    const activities: string[] = []
    
    if (criteria.season === 'winter') {
      activities.push('ice skating', 'holiday markets', 'cozy fireplaces', 'winter festivals', 'hot chocolate tours')
    } else if (criteria.season === 'summer') {
      activities.push('rooftop bars', 'outdoor concerts', 'patio dining', 'beach activities', 'summer festivals')
    } else if (criteria.season === 'fall') {
      activities.push('pumpkin patches', 'apple orchards', 'fall foliage tours', 'harvest festivals', 'hayrides')
    } else if (criteria.season === 'spring') {
      activities.push('botanical gardens', 'flower festivals', 'outdoor brunch', 'spring markets', 'picnic spots')
    }
    
    return activities
  }

  // Get holiday-specific venue types
  private getHolidayVenueTypes(criteria: SearchCriteria): string[] {
    const venueTypes: string[] = []
    
    if (criteria.holiday === 'valentine') {
      venueTypes.push('romantic restaurants', 'chocolate shops', 'flower gardens', 'wine bars', 'intimate cafes')
    } else if (criteria.holiday === 'christmas') {
      venueTypes.push('holiday markets', 'festive restaurants', 'decorated venues', 'christmas tree farms', 'winter wonderlands')
    } else if (criteria.holiday === 'halloween') {
      venueTypes.push('haunted houses', 'themed bars', 'costume parties', 'pumpkin patches', 'spooky restaurants')
    } else if (criteria.holiday === 'new-year') {
      venueTypes.push('party venues', 'countdown events', 'late-night restaurants', 'celebration spots', 'firework viewing areas')
    }
    
    return venueTypes
  }

  // Real pricing data scraper
  private async scrapeVenuePricing(venue: Venue): Promise<VenuePricing | null> {
    try {
      // Use AI to extract pricing information from venue details
      const prompt = `Extract accurate pricing information for this venue:

Venue: ${venue.name}
Category: ${venue.category}
Description: ${venue.description}
Address: ${venue.address}

Provide realistic pricing in USD for this specific venue type. Consider:
- Movie theaters: ticket prices, food, drinks
- Bowling alleys: lane rental, shoe rental, food, drinks  
- Escape rooms: per person pricing, group packages
- Restaurants: typical entree prices, drink prices, appetizers
- Bars: drink prices, appetizer prices

Return JSON with this exact structure:
{
  "tickets": number or null,
  "food": number or null,
  "drinks": number or null,
  "activities": number or null,
  "packages": [
    {
      "name": "package name",
      "price": number,
      "includes": ["item1", "item2"]
    }
  ],
  "minimumSpend": number or null,
  "currency": "USD",
  "source": "AI estimation based on venue type"
}

Be realistic and specific to ${venue.name} in ${venue.address}. Consider local pricing.`

      const text = await geminiAI.generateContent(prompt)
      const cleaned = text.replace(/```json\n?|\n?```/g, '').trim()
      
      try {
        const pricing = JSON.parse(cleaned)
        return {
          ...pricing,
          lastUpdated: new Date().toISOString()
        }
      } catch (e) {
        return null
      }
    } catch (error) {
      return null
    }
  }

  // Enhanced pricing with real data
  private async enhanceVenueWithPricing(venue: Venue): Promise<Venue> {
    // Check if we already have recent pricing data
    if (venue.pricing && venue.pricing.lastUpdated) {
      const lastUpdated = new Date(venue.pricing.lastUpdated)
      const daysSinceUpdate = (Date.now() - lastUpdated.getTime()) / (1000 * 60 * 60 * 24)
      
      if (daysSinceUpdate < 7) { // Use cached data if less than 7 days old
        return venue
      }
    }

    const pricing = await this.scrapeVenuePricing(venue)
    
    return {
      ...venue,
      pricing: pricing || undefined
    }
  }

  // AI-powered venue enhancement
  private async enhanceVenuesWithAI(venues: Venue[], criteria: SearchCriteria): Promise<Venue[]> {
    const enhancedVenues: Venue[] = []

    // Build custom preferences prompt for AI
    const customPreferences = this.buildCustomPreferencesPrompt(criteria)

    // Process venues in batches to avoid rate limits
    for (let i = 0; i < venues.length; i += 3) {
      const batch = venues.slice(i, i + 3)
      
      const batchPromises = batch.map(async (venue) => {
        try {
          const analysis = await geminiAI.analyzeVenue({
            name: venue.name,
            category: venue.category,
            address: venue.address,
            rating: venue.rating,
            priceRange: venue.priceRange,
            existingDescription: venue.description
          })

          return {
            ...venue,
            aiEnhanced: true,
            description: analysis.description,
            highlights: [...venue.highlights, ...analysis.highlights],
            aiInsights: {
              bestFor: analysis.best_for,
              insiderTips: analysis.insider_tips,
              photoSpots: analysis.photo_spots,
              vibeTags: analysis.vibe_tags
            },
            tags: [...venue.tags, ...analysis.vibe_tags],
            vibe: analysis.vibe_tags[0] || venue.vibe
          }
        } catch (error) {
          return { ...venue, aiEnhanced: false }
        }
      })

      const batchResults = await Promise.all(batchPromises)
      enhancedVenues.push(...batchResults)

      // Small delay between batches to be respectful to the API
      if (i + 3 < venues.length) {
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
    }

    return enhancedVenues
  }
}

export const venueSearcher = new VenueSearcher()
