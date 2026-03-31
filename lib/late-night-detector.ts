// Late night detection and alternative suggestions system
import { Venue, SearchCriteria, SearchResult } from './venue-search'

export interface LateNightDetection {
  isTooLate: boolean
  currentTime: Date
  timeUntilClosing: number // minutes until most venues close
  availableVenuesCount: number
  minimumVenuesRequired: number
  reasons: string[]
}

export interface AlternativeSuggestion {
  id: string
  title: string
  description: string
  category: 'immediate' | 'tomorrow' | 'weekend' | 'home'
  timeRequired: string // "15 mins", "2 hours", etc.
  costEstimate: string
  availability: 'now' | 'tonight' | 'tomorrow' | 'weekend'
  tags: string[]
  actionItems: string[]
  pros: string[]
  cons?: string[]
  actionUrl?: string
}

export interface LateNightResponse {
  detection: LateNightDetection
  suggestions: AlternativeSuggestion[]
  sameDayOptions: SameDayOption[]
  message: string
  urgency: 'low' | 'medium' | 'high' | 'critical'
}

export interface SameDayOption {
  type: 'delivery' | 'streaming' | 'outdoor' | 'quick_venue'
  title: string
  description: string
  availableUntil: string
  setupTime: string
  cost: string
  lastOrderTime?: string
  actionUrl?: string
}

class LateNightDetector {
  private readonly LATE_NIGHT_CUTOFF = 20 // 8 PM — only alert when it's actually late
  private readonly CRITICAL_CUTOFF = 22 // 10 PM
  private readonly MINIMUM_VENUES_REQUIRED = 3

  // Check if two dates are the same calendar day
  private isSameDay(date1: Date, date2: Date): boolean {
    return date1.getFullYear() === date2.getFullYear() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getDate() === date2.getDate()
  }

  // Check if a planned date is strictly before today
  private isBeforeToday(currentTime: Date, plannedDate: Date): boolean {
    const today = new Date(currentTime.getFullYear(), currentTime.getMonth(), currentTime.getDate())
    const planned = new Date(plannedDate.getFullYear(), plannedDate.getMonth(), plannedDate.getDate())
    return planned.getTime() < today.getTime()
  }

  // Check if a planned date is in the future (after today)
  private isAfterToday(currentTime: Date, plannedDate: Date): boolean {
    const today = new Date(currentTime.getFullYear(), currentTime.getMonth(), currentTime.getDate())
    const planned = new Date(plannedDate.getFullYear(), plannedDate.getMonth(), plannedDate.getDate())
    return planned.getTime() > today.getTime()
  }

  detectLateNightScenario(
    currentTime: Date,
    searchResults: SearchResult,
    criteria: SearchCriteria
  ): LateNightDetection {
    const currentHour = currentTime.getHours()
    const currentMinute = currentTime.getMinutes()

    const availableVenuesCount = searchResults.venues.length
    const minimumVenuesRequired = this.getMinimumVenuesRequired(criteria)

    // Future dates — never trigger the alert
    if (criteria.plannedDate && this.isAfterToday(currentTime, criteria.plannedDate)) {
      return {
        isTooLate: false,
        currentTime,
        timeUntilClosing: 0,
        availableVenuesCount,
        minimumVenuesRequired,
        reasons: []
      }
    }

    // Past dates — always trigger
    const isPlannedInPast = criteria.plannedDate
      ? this.isBeforeToday(currentTime, criteria.plannedDate)
      : false

    // Today — only trigger if it's actually late (8 PM+)
    const isPlannedForToday = criteria.plannedDate
      ? this.isSameDay(currentTime, criteria.plannedDate)
      : true // default to today if no date specified

    const isLateTonight = isPlannedForToday && currentHour >= this.LATE_NIGHT_CUTOFF
    const isCritical = isPlannedForToday && currentHour >= this.CRITICAL_CUTOFF

    const isTooLate = isPlannedInPast || isLateTonight

    // Calculate time until closing (only meaningful for today)
    const timeUntilClosing = this.getTimeUntilClosing(currentHour)

    const reasons: string[] = []

    if (isPlannedInPast) {
      reasons.push('The selected date has already passed')
    } else if (isLateTonight) {
      const timeString = `${currentHour > 12 ? currentHour - 12 : currentHour}:${currentMinute.toString().padStart(2, '0')} ${currentHour >= 12 ? 'PM' : 'AM'}`
      reasons.push(`It's ${timeString} — some venues may be closing soon`)
      if (isCritical) {
        reasons.push('Most restaurants stop seating after 10 PM')
      }
      if (availableVenuesCount < minimumVenuesRequired) {
        reasons.push(`Only ${availableVenuesCount} venues available (need ${minimumVenuesRequired}+)`)
      }
    }

    return {
      isTooLate,
      currentTime,
      timeUntilClosing,
      availableVenuesCount,
      minimumVenuesRequired,
      reasons
    }
  }

  private getTimeUntilClosing(currentHour: number): number {
    // Most restaurants close around 10 PM, bars around 11 PM
    // Use 10 PM as a conservative estimate
    const typicalClosing = 22
    let hoursUntilClosing = typicalClosing - currentHour
    if (hoursUntilClosing < 0) {
      hoursUntilClosing = 0
    }
    return hoursUntilClosing * 60 // minutes
  }

  generateAlternativeSuggestions(
    detection: LateNightDetection,
    criteria: SearchCriteria
  ): AlternativeSuggestion[] {
    const suggestions: AlternativeSuggestion[] = []
    const currentHour = detection.currentTime.getHours()

    // Immediate options (available now)
    if (currentHour >= 17) {
      suggestions.push(...this.getImmediateOptions(criteria))
    }

    // Tomorrow options
    suggestions.push(...this.getTomorrowOptions(criteria))

    // Weekend options
    suggestions.push(...this.getWeekendOptions(criteria))

    // Home date options
    suggestions.push(...this.getHomeDateOptions(criteria))

    return suggestions.sort((a, b) => {
      const priorityOrder = { 'now': 0, 'tonight': 1, 'tomorrow': 2, 'weekend': 3 }
      const aPriority = priorityOrder[a.availability] || 999
      const bPriority = priorityOrder[b.availability] || 999
      return aPriority - bPriority
    })
  }

  private buildLocationQuery(criteria: SearchCriteria): string {
    return encodeURIComponent(criteria.location || 'near me')
  }

  getSameDayOptions(currentTime: Date, criteria: SearchCriteria): SameDayOption[] {
    const currentHour = currentTime.getHours()
    const options: SameDayOption[] = []
    const locationQuery = this.buildLocationQuery(criteria)

    // Food delivery options
    if (currentHour >= 17) {
      const deliveryDeadline = currentHour >= 22 ? '11:30 PM' : currentHour >= 20 ? '11:00 PM' : '10:30 PM'

      options.push({
        type: 'delivery',
        title: 'Gourmet Food Delivery',
        description: 'Order from top-rated restaurants on DoorDash or UberEats',
        availableUntil: deliveryDeadline,
        setupTime: '5 mins',
        cost: '$$-$$$',
        lastOrderTime: currentHour >= 21 ? '11:00 PM' : '10:30 PM',
        actionUrl: `https://www.doordash.com/search/store/${locationQuery}/`
      })

      options.push({
        type: 'delivery',
        title: 'Cocktail Kit Delivery',
        description: 'Get cocktail kits & spirits delivered — browse real options on Drizly',
        availableUntil: currentHour >= 21 ? '10:00 PM' : '9:00 PM',
        setupTime: '2 mins',
        cost: '$$',
        lastOrderTime: currentHour >= 21 ? '9:30 PM' : '9:00 PM',
        actionUrl: `https://drizly.com/search?q=cocktail+kit`
      })
    }

    // Streaming/entertainment options (available anytime)
    options.push({
      type: 'streaming',
      title: 'Movie Night Marathon',
      description: 'Browse romantic movies and start streaming now on Netflix',
      availableUntil: 'All night',
      setupTime: '10 mins',
      cost: '$',
      actionUrl: 'https://www.netflix.com/browse/genre/8883'
    })

    options.push({
      type: 'streaming',
      title: 'Virtual Cooking Class',
      description: 'Book a live online couples cooking class on Airbnb Experiences',
      availableUntil: currentHour >= 21 ? '9:00 PM' : '10:00 PM',
      setupTime: '15 mins',
      cost: '$$',
      lastOrderTime: currentHour >= 21 ? '8:30 PM' : '9:30 PM',
      actionUrl: 'https://www.airbnb.com/s/experiences?query=cooking+class+online'
    })

    // Outdoor/quick venues (time-sensitive)
    if (currentHour >= 17 && currentHour <= 21) {
      const sunsetTime = this.getSunsetTime(currentTime)
      options.push({
        type: 'outdoor',
        title: 'Sunset Picnic',
        description: 'Find a park near you for a quick romantic picnic',
        availableUntil: `${sunsetTime} + 1 hour`,
        setupTime: '20 mins',
        cost: '$',
        actionUrl: `https://www.google.com/maps/search/parks+${locationQuery}`
      })

      if (currentHour <= 22) {
        options.push({
          type: 'quick_venue',
          title: 'Late Night Dessert Spot',
          description: 'Find ice cream shops or dessert bars open late near you',
          availableUntil: currentHour >= 21 ? '11:00 PM' : '10:30 PM',
          setupTime: '5 mins',
          cost: '$',
          actionUrl: `https://www.google.com/maps/search/dessert+open+now+${locationQuery}`
        })
      }
    }

    return options
  }

  private getSunsetTime(currentTime: Date): string {
    const month = currentTime.getMonth()
    const sunsetTimes: Record<number, string> = {
      0: '5:00 PM',
      1: '5:30 PM',
      2: '6:00 PM',
      3: '7:00 PM',
      4: '7:30 PM',
      5: '8:00 PM',
      6: '8:00 PM',
      7: '7:30 PM',
      8: '7:00 PM',
      9: '6:30 PM',
      10: '5:00 PM',
      11: '4:45 PM'
    }
    return sunsetTimes[month] || '6:00 PM'
  }

  private getImmediateOptions(criteria: SearchCriteria): AlternativeSuggestion[] {
    const locationQuery = this.buildLocationQuery(criteria)
    return [
      {
        id: 'immediate-delivery',
        title: 'Premium Date Night Delivery',
        description: 'Order a gourmet meal on DoorDash and cocktail kits on Drizly for a romantic home dinner',
        category: 'immediate',
        timeRequired: '30-45 mins',
        costEstimate: '$$$',
        availability: 'now',
        tags: ['delivery', 'romantic', 'convenient', 'no-prep'],
        actionItems: [
          'Order dinner on DoorDash or UberEats',
          'Add cocktail kits from Drizly',
          'Set up romantic atmosphere at home'
        ],
        pros: ['Available right now', 'No travel required', 'Private and intimate', 'Often cheaper than restaurants'],
        actionUrl: `https://www.doordash.com/search/store/${locationQuery}/`
      },
      {
        id: 'immediate-late-night',
        title: 'Late Night Venue Hunt',
        description: 'Find bars, lounges, and restaurants open late near you on Google Maps',
        category: 'immediate',
        timeRequired: '2-3 hours',
        costEstimate: '$$',
        availability: 'tonight',
        tags: ['spontaneous', 'late-night', 'adventure', 'open-late'],
        actionItems: [
          'Browse open-now venues on Google Maps',
          'Call ahead to confirm availability',
          'Be flexible with venue types'
        ],
        pros: ['Exciting and spontaneous', 'Unique experiences', 'Less crowded'],
        cons: ['Limited options', 'May require travel', 'Lower quality venues'],
        actionUrl: `https://www.google.com/maps/search/bars+open+now+${locationQuery}`
      }
    ]
  }

  private getTomorrowOptions(criteria: SearchCriteria): AlternativeSuggestion[] {
    return [
      {
        id: 'tomorrow-planned',
        title: 'Tomorrow Night Perfect Date',
        description: 'Plan the ideal date night with full venue availability and options',
        category: 'tomorrow',
        timeRequired: '2-3 hours',
        costEstimate: criteria.budget === '$' ? '$' : criteria.budget === '$$$' ? '$$$' : '$$',
        availability: 'tomorrow',
        tags: ['planned', 'optimal', 'best-venues', 'romantic'],
        actionItems: [
          'Book reservations in advance',
          'Get first choice of venues',
          'Plan transportation and timing',
          'Arrange any special requests'
        ],
        pros: ['Best venue selection', 'Can make reservations', 'Better planning', 'Higher quality experience'],
        cons: ['Requires waiting until tomorrow']
      },
      {
        id: 'tomorrow-lunch',
        title: 'Tomorrow Lunch Date',
        description: 'Elevated lunch experience at venues that might be booked for dinner',
        category: 'tomorrow',
        timeRequired: '1.5-2 hours',
        costEstimate: '$$',
        availability: 'tomorrow',
        tags: ['lunch', 'daytime', 'less-crowded', 'value'],
        actionItems: [
          'Book lunch reservations',
          'Explore daytime activities',
          'Enjoy venues without dinner crowds'
        ],
        pros: ['Often easier to book', 'Better value', 'Daytime activities available', 'Less pressure']
      }
    ]
  }

  private getWeekendOptions(criteria: SearchCriteria): AlternativeSuggestion[] {
    return [
      {
        id: 'weekend-extended',
        title: 'Weekend Date Experience',
        description: 'Multi-venue weekend date with activities and dining',
        category: 'weekend',
        timeRequired: '4-6 hours',
        costEstimate: '$$$',
        availability: 'weekend',
        tags: ['weekend', 'extended', 'multiple-venues', 'special'],
        actionItems: [
          'Plan full weekend itinerary',
          'Book multiple venues',
          'Include activities and dining',
          'Arrange transportation between venues'
        ],
        pros: ['Maximum venue options', 'Can include special events', 'More relaxed pace', 'Memorable experience'],
        cons: ['Requires more planning', 'Higher cost', 'Weekend crowds']
      }
    ]
  }

  private getHomeDateOptions(criteria: SearchCriteria): AlternativeSuggestion[] {
    const locationQuery = this.buildLocationQuery(criteria)
    return [
      {
        id: 'home-gourmet',
        title: 'Gourmet Home Cooking',
        description: 'Get premium ingredients delivered via Instacart and cook a special meal together',
        category: 'home',
        timeRequired: '2-3 hours',
        costEstimate: '$$',
        availability: 'now',
        tags: ['cooking', 'intimate', 'collaborative', 'budget-friendly'],
        actionItems: [
          'Order premium ingredients on Instacart',
          'Choose a special recipe together',
          'Cook as a team',
          'Set the mood with music and lighting'
        ],
        pros: ['Very intimate', 'Cost-effective', 'Fun activity together', 'Complete control over atmosphere'],
        cons: ['Requires cooking skills', 'Cleanup required'],
        actionUrl: 'https://www.instacart.com/'
      },
      {
        id: 'home-theme',
        title: 'Themed Home Date Night',
        description: 'Stream a movie marathon on Netflix or plan a game night together',
        category: 'home',
        timeRequired: '2-4 hours',
        costEstimate: '$',
        availability: 'now',
        tags: ['themed', 'creative', 'comfortable', 'low-cost'],
        actionItems: [
          'Pick a theme on Netflix or Disney+',
          'Order themed snacks on DoorDash',
          'Set the mood with lighting',
          'Plan themed activities'
        ],
        pros: ['Very affordable', 'Creative and fun', 'Comfortable environment', 'Unlimited time together'],
        cons: ['Less special than going out', 'Requires preparation', 'Potential distractions at home'],
        actionUrl: 'https://www.netflix.com/browse'
      }
    ]
  }

  private getMinimumVenuesRequired(criteria: SearchCriteria): number {
    if (criteria.partySize >= 4) return 4
    if (criteria.vibes.includes('adventurous')) return 4
    if (criteria.activity && criteria.activity !== 'none') return 3
    return this.MINIMUM_VENUES_REQUIRED
  }

  generateResponse(
    detection: LateNightDetection,
    suggestions: AlternativeSuggestion[],
    criteria: SearchCriteria
  ): LateNightResponse {
    let message = ''
    let urgency: 'low' | 'medium' | 'high' | 'critical' = 'low'

    const currentHour = detection.currentTime.getHours()
    const currentMinute = detection.currentTime.getMinutes()
    const timeString = `${currentHour > 12 ? currentHour - 12 : currentHour}:${currentMinute.toString().padStart(2, '0')} ${currentHour >= 12 ? 'PM' : 'AM'}`

    if (detection.availableVenuesCount === 0) {
      urgency = 'critical'
      message = `It's ${timeString} and no venues are available. Here are some great alternatives!`
    } else if (currentHour >= this.CRITICAL_CUTOFF) {
      urgency = 'high'
      message = `It's ${timeString} — we found ${detection.availableVenuesCount} venues still open. Here are some extra options too:`
    } else if (currentHour >= this.LATE_NIGHT_CUTOFF) {
      urgency = 'medium'
      message = `It's ${timeString} — we found venues for you! Here are some additional options in case you want them:`
    } else {
      urgency = 'low'
      message = 'Here are some additional options to consider:'
    }

    const sameDayOptions = this.getSameDayOptions(detection.currentTime, criteria)

    return {
      detection,
      suggestions,
      sameDayOptions,
      message,
      urgency
    }
  }
}

export const lateNightDetector = new LateNightDetector()
