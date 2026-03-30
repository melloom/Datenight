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
}

class LateNightDetector {
  private readonly LATE_NIGHT_CUTOFF = 17 // 5 PM in 24-hour format
  private readonly CRITICAL_CUTOFF = 21 // 9 PM in 24-hour format
  private readonly MINIMUM_VENUES_REQUIRED = 3 // Minimum venues for a good date night
  
  // Helper method to check if two dates are the same day
  private isSameDay(date1: Date, date2: Date): boolean {
    return date1.getFullYear() === date2.getFullYear() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getDate() === date2.getDate()
  }
  
  detectLateNightScenario(
    currentTime: Date, 
    searchResults: SearchResult, 
    criteria: SearchCriteria
  ): LateNightDetection {
    const currentHour = currentTime.getHours()
    const currentMinute = currentTime.getMinutes()
    
    // Check if the planned date is today
    console.log('🔍 Late Night Detection Debug:', {
      currentTime: currentTime.toISOString(),
      plannedDate: criteria.plannedDate?.toISOString(),
      currentTimeLocal: currentTime.toLocaleString(),
      plannedDateLocal: criteria.plannedDate?.toLocaleString(),
      currentYear: currentTime.getFullYear(),
      plannedYear: criteria.plannedDate?.getFullYear(),
      currentMonth: currentTime.getMonth(),
      plannedMonth: criteria.plannedDate?.getMonth(),
      currentDate: currentTime.getDate(),
      plannedDateDate: criteria.plannedDate?.getDate(),
      hasPlannedDate: !!criteria.plannedDate
    })
    
    const isPlannedForToday = criteria.plannedDate ? 
      this.isSameDay(currentTime, criteria.plannedDate) : true // Default to true if no date specified
    
    console.log('✅ Is planned for today?', isPlannedForToday, {
      currentHour,
      LATE_NIGHT_CUTOFF: this.LATE_NIGHT_CUTOFF,
      willTriggerAlert: isPlannedForToday && currentHour >= this.LATE_NIGHT_CUTOFF
    })
    
    // Only consider it "too late" if it's actually late AND they're planning for today
    const isTooLate = isPlannedForToday && currentHour >= this.LATE_NIGHT_CUTOFF
    const isCritical = isPlannedForToday && currentHour >= this.CRITICAL_CUTOFF
    
    // More accurate time until closing calculation
    const getTimeUntilClosing = () => {
      // Different venues close at different times
      const closingTimes = {
        restaurants: 22, // 10 PM
        bars: 23, // 11 PM  
        clubs: 2, // 2 AM (next day)
        cafes: 20, // 8 PM
        entertainment: 23, // 11 PM
      }
      
      // Use the earliest closing time for conservative estimate
      const earliestClosing = Math.min(...Object.values(closingTimes))
      let hoursUntilClosing = earliestClosing - currentHour
      
      // If past midnight, adjust for next day
      if (hoursUntilClosing < 0) {
        hoursUntilClosing += 24
      }
      
      return Math.max(0, hoursUntilClosing * 60) // Convert to minutes
    }
    
    const timeUntilClosing = getTimeUntilClosing()
    const availableVenuesCount = searchResults.venues.length
    const minimumVenuesRequired = this.getMinimumVenuesRequired(criteria)
    
    const reasons: string[] = []
    if (isTooLate && isPlannedForToday) {
      const timeString = `${currentHour > 12 ? currentHour - 12 : currentHour}:${currentMinute.toString().padStart(2, '0')} ${currentHour >= 12 ? 'PM' : 'AM'}`
      reasons.push(`It's ${timeString}`)
      reasons.push('Limited venue availability after 8 PM')
    }
    if (isCritical && isPlannedForToday) reasons.push('Most venues close within 1-2 hours')
    if (availableVenuesCount < minimumVenuesRequired) {
      reasons.push(`Only ${availableVenuesCount} venues available (need ${minimumVenuesRequired}+)`)
    }
    if (criteria.time === 'late' && currentHour < 21 && isPlannedForToday) {
      reasons.push('Late night venues may not be open yet')
    }
    
    // If not planning for today, don't show late night alert
    if (!isPlannedForToday) {
      reasons.length = 0 // Clear reasons for future dates
    }
    
    // Add more specific reasons based on time (only if planning for today)
    if (isPlannedForToday) {
      if (currentHour >= 22) {
        reasons.push('Most restaurants and bars are closed')
      } else if (currentHour >= 20) {
        reasons.push('Limited venue availability after 8 PM')
      }
    }
    
    return {
      isTooLate: isPlannedForToday ? (isTooLate || availableVenuesCount < minimumVenuesRequired) : false,
      currentTime,
      timeUntilClosing,
      availableVenuesCount,
      minimumVenuesRequired,
      reasons
    }
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
      // Prioritize by availability and urgency
      const priorityOrder = { 'now': 0, 'tonight': 1, 'tomorrow': 2, 'weekend': 3 }
      const aPriority = priorityOrder[a.availability] || 999
      const bPriority = priorityOrder[b.availability] || 999
      return aPriority - bPriority
    })
  }
  
  getSameDayOptions(currentTime: Date, criteria: SearchCriteria): SameDayOption[] {
    const currentHour = currentTime.getHours()
    const currentMinute = currentTime.getMinutes()
    const options: SameDayOption[] = []
    
    // Food delivery options
    if (currentHour >= 17) {
      // Calculate realistic delivery times
      const deliveryDeadline = currentHour >= 22 ? '11:30 PM' : currentHour >= 20 ? '11:00 PM' : '10:30 PM'
      
      options.push({
        type: 'delivery',
        title: 'Gourmet Food Delivery',
        description: 'Order from high-end restaurants for a romantic dinner at home',
        availableUntil: deliveryDeadline,
        setupTime: '5 mins',
        cost: '$$-$$$',
        lastOrderTime: currentHour >= 21 ? '11:00 PM' : '10:30 PM'
      })
      
      options.push({
        type: 'delivery',
        title: 'Cocktail Kit Delivery',
        description: 'Premium cocktail ingredients and recipes delivered to your door',
        availableUntil: currentHour >= 21 ? '10:00 PM' : '9:00 PM',
        setupTime: '2 mins',
        cost: '$$',
        lastOrderTime: currentHour >= 21 ? '9:30 PM' : '9:00 PM'
      })
    }
    
    // Streaming/entertainment options (available anytime)
    options.push({
      type: 'streaming',
      title: 'Movie Night Marathon',
      description: 'Curated romantic movie collection with themed snacks',
      availableUntil: 'All night',
      setupTime: '10 mins',
      cost: '$'
    })
    
    options.push({
      type: 'streaming',
      title: 'Virtual Cooking Class',
      description: 'Live online cooking class for couples',
      availableUntil: currentHour >= 21 ? '9:00 PM' : '10:00 PM',
      setupTime: '15 mins',
      cost: '$$',
      lastOrderTime: currentHour >= 21 ? '8:30 PM' : '9:30 PM'
    })
    
    // Outdoor/quick venues (time-sensitive)
    if (currentHour >= 17 && currentHour <= 21) {
      const sunsetTime = this.getSunsetTime(currentTime)
      options.push({
        type: 'outdoor',
        title: 'Sunset Picnic',
        description: 'Quick setup picnic at a local park with sunset views',
        availableUntil: `${sunsetTime} + 1 hour`,
        setupTime: '20 mins',
        cost: '$'
      })
      
      // Late night dessert spots
      if (currentHour <= 22) {
        options.push({
          type: 'quick_venue',
          title: 'Late Night Dessert Spot',
          description: 'Find ice cream shops or dessert bars open late',
          availableUntil: currentHour >= 21 ? '11:00 PM' : '10:30 PM',
          setupTime: '5 mins',
          cost: '$'
        })
      }
    }
    
    return options
  }
  
  private getSunsetTime(currentTime: Date): string {
    // Simplified sunset time calculation
    const month = currentTime.getMonth()
    const sunsetTimes = {
      0: '5:00 PM',   // January
      1: '5:30 PM',   // February  
      2: '6:00 PM',   // March
      3: '7:00 PM',   // April
      4: '7:30 PM',   // May
      5: '8:00 PM',   // June
      6: '8:00 PM',   // July
      7: '7:30 PM',   // August
      8: '7:00 PM',   // September
      9: '6:30 PM',   // October
      10: '5:00 PM',  // November
      11: '4:45 PM'   // December
    }
    return sunsetTimes[month as keyof typeof sunsetTimes] || '6:00 PM'
  }
  
  private getImmediateOptions(criteria: SearchCriteria): AlternativeSuggestion[] {
    const currentHour = new Date().getHours()
    
    return [
      {
        id: 'immediate-delivery',
        title: 'Premium Date Night Delivery',
        description: 'Gourmet meal and cocktail kits delivered for a romantic home dinner',
        category: 'immediate',
        timeRequired: '30-45 mins',
        costEstimate: '$$$',
        availability: 'now',
        tags: ['delivery', 'romantic', 'convenient', 'no-prep'],
        actionItems: [
          'Order from premium delivery service',
          'Set up romantic atmosphere at home',
          'Enjoy restaurant-quality meal together'
        ],
        pros: ['Available right now', 'No travel required', 'Private and intimate', 'Often cheaper than restaurants']
      },
      {
        id: 'immediate-late-night',
        title: 'Late Night Venue Hunt',
        description: 'Find venues specifically open late for spontaneous dates',
        category: 'immediate',
        timeRequired: '2-3 hours',
        costEstimate: '$$',
        availability: 'tonight',
        tags: ['spontaneous', 'late-night', 'adventure', 'open-late'],
        actionItems: [
          'Check late-night venues in your area',
          'Call ahead to confirm availability',
          'Be flexible with venue types'
        ],
        pros: ['Exciting and spontaneous', 'Unique experiences', 'Less crowded'],
        cons: ['Limited options', 'May require travel', 'Lower quality venues']
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
    return [
      {
        id: 'home-gourmet',
        title: 'Gourmet Home Cooking',
        description: 'Cook a special meal together with premium ingredients',
        category: 'home',
        timeRequired: '2-3 hours',
        costEstimate: '$$',
        availability: 'now',
        tags: ['cooking', 'intimate', 'collaborative', 'budget-friendly'],
        actionItems: [
          'Shop for premium ingredients',
          'Choose a special recipe together',
          'Cook as a team',
          'Set the mood with music and lighting'
        ],
        pros: ['Very intimate', 'Cost-effective', 'Fun activity together', 'Complete control over atmosphere'],
        cons: ['Requires cooking skills', 'Cleanup required', 'Need to shop for ingredients']
      },
      {
        id: 'home-theme',
        title: 'Themed Home Date Night',
        description: 'Create a themed experience at home (movie marathon, game night, etc.)',
        category: 'home',
        timeRequired: '2-4 hours',
        costEstimate: '$',
        availability: 'now',
        tags: ['themed', 'creative', 'comfortable', 'low-cost'],
        actionItems: [
          'Choose a fun theme',
          'Prepare themed snacks and drinks',
          'Decorate accordingly',
          'Plan themed activities'
        ],
        pros: ['Very affordable', 'Creative and fun', 'Comfortable environment', 'Unlimited time together'],
        cons: ['Less special than going out', 'Requires preparation', 'Potential distractions at home']
      }
    ]
  }
  
  private getMinimumVenuesRequired(criteria: SearchCriteria): number {
    // Different requirements based on party size and preferences
    if (criteria.partySize >= 4) return 4 // Larger groups need more options
    if (criteria.vibes.includes('adventurous')) return 4 // Adventurous dates want variety
    if (criteria.activity && criteria.activity !== 'none') return 3 // Activity dates need more backup options
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
    
    // Calculate hours until closing for display
    const hoursUntilClosing = Math.floor(detection.timeUntilClosing / 60)
    const closingTimeString = hoursUntilClosing > 0 ? ` • ~${hoursUntilClosing}h until typical closing` : ''
    
    if (detection.isTooLate && detection.availableVenuesCount === 0) {
      urgency = 'critical'
      message = `It's ${timeString} and no venues are available. Don't worry - I have some great alternatives for you!`
    } else if (detection.isTooLate && detection.availableVenuesCount < detection.minimumVenuesRequired) {
      urgency = 'high'
      message = `It's ${timeString} and only ${detection.availableVenuesCount} venues found (need ${detection.minimumVenuesRequired}+). Here are some better alternatives:`
    } else if (currentHour >= this.LATE_NIGHT_CUTOFF) {
      urgency = 'medium'
      message = `It's ${timeString} - while some venues are available, you might want to consider these options for a better experience:`
    } else {
      urgency = 'low'
      message = 'Good timing! Here are some additional options to consider:'
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
