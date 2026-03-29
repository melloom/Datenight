import { GoogleGenerativeAI } from '@google/generative-ai'

// Get API key from user settings or environment
function getAPIKey(): string | null {
  if (typeof window !== 'undefined') {
    try {
      const settings = localStorage.getItem('ai-settings')
      if (settings) {
        const parsed = JSON.parse(settings)
        if (parsed.geminiApiKey) return parsed.geminiApiKey
      }
    } catch (error) {
      console.error('Failed to load AI settings:', error)
    }
  }
  return process.env.NEXT_PUBLIC_GEMINI_API_KEY || null
}

export interface VenueAnalysis {
  description: string
  highlights: string[]
  vibe_tags: string[]
  price_assessment: string
  best_for: string[]
  insider_tips: string[]
  rating_explanation: string
  photo_spots: string[]
}

export interface DateRecommendation {
  title: string
  description: string
  why_perfect: string
  tips: string[]
  alternatives: string[]
}

export class GeminiAIService {
  private getModel() {
    const apiKey = getAPIKey()
    if (!apiKey) return null
    
    try {
      const genAI = new GoogleGenerativeAI(apiKey)
      return genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })
    } catch (error) {
      console.error('Failed to initialize Gemini:', error)
      return null
    }
  }

  private async generateContent(prompt: string): Promise<string> {
    const model = this.getModel()
    
    if (!model) {
      console.warn('Gemini AI not available - using fallback')
      return this.getFallbackResponse(prompt)
    }

    try {
      const result = await model.generateContent(prompt)
      const response = await result.response
      return response.text()
    } catch (error) {
      console.error('Gemini AI error:', error)
      return this.getFallbackResponse(prompt)
    }
  }

  private getFallbackResponse(prompt: string): string {
    if (prompt.includes('venue analysis')) {
      return JSON.stringify({
        description: "A charming venue perfect for romantic evenings",
        highlights: ["Cozy atmosphere", "Great service", "Beautiful decor"],
        vibe_tags: ["romantic", "intimate", "cozy"],
        price_assessment: "Moderate pricing with good value",
        best_for: ["Date nights", "Special occasions", "Romantic dinners"],
        insider_tips: ["Book in advance", "Ask for window seating", "Try their signature dishes"],
        rating_explanation: "Highly rated for ambiance and service",
        photo_spots: ["Entrance", "Dining area", "Bar section"]
      })
    }
    return "AI service temporarily unavailable"
  }

  async analyzeVenue(venue: {
    name: string
    category: string
    address: string
    rating: number
    priceRange: string
    existingDescription?: string
  }): Promise<VenueAnalysis> {
    const prompt = `
Analyze this venue for a date night app and provide detailed insights:

Venue: ${venue.name}
Category: ${venue.category}
Address: ${venue.address}
Rating: ${venue.rating}/5
Price Range: ${venue.priceRange}
Current Description: ${venue.existingDescription || 'None provided'}

Provide a JSON response with these exact keys:
{
  "description": "A compelling, romantic description perfect for date planning (2-3 sentences)",
  "highlights": ["3-5 key features that make it special for dates"],
  "vibe_tags": ["3-4 atmosphere tags like 'romantic', 'intimate', 'lively', 'cozy'"],
  "price_assessment": "Brief assessment of value for money",
  "best_for": ["2-3 specific occasions or couple types"],
  "insider_tips": ["2-3 practical tips for the best experience"],
  "rating_explanation": "Why this venue has its rating",
  "photo_spots": ["3-4 best spots for photos"]
}

Focus on romance, atmosphere, and date-worthiness. Be specific and helpful.
`

    try {
      const response = await this.generateContent(prompt)
      const cleaned = response.replace(/```json\n?|\n?```/g, '').trim()
      return JSON.parse(cleaned)
    } catch (error) {
      console.error('Failed to parse Gemini response:', error)
      return this.getFallbackVenueAnalysis()
    }
  }

  async generateDateRecommendation(
    venues: any[],
    criteria: {
      location: string
      budget: string
      vibes: string[]
      time: string
      partySize: number
    }
  ): Promise<DateRecommendation> {
    const venueList = venues.map(v => `${v.name} (${v.category})`).join(', ')
    
    const prompt = `
Create a perfect date night recommendation based on:

Location: ${criteria.location}
Budget: ${criteria.budget}
Vibes: ${criteria.vibes.join(', ')}
Time: ${criteria.time}
Party Size: ${criteria.partySize}
Selected Venues: ${venueList}

Provide a JSON response with these exact keys:
{
  "title": "A catchy title for this date experience",
  "description": "A romantic description of the overall date experience (3-4 sentences)",
  "why_perfect": "Why this combination is perfect for the specified criteria",
  "tips": ["3-4 practical tips for making this date amazing"],
  "alternatives": ["2-3 backup suggestions if something doesn't work out"]
}

Make it sound exciting, romantic, and personalized. Focus on creating memories.
`

    try {
      const response = await this.generateContent(prompt)
      const cleaned = response.replace(/```json\n?|\n?```/g, '').trim()
      return JSON.parse(cleaned)
    } catch (error) {
      console.error('Failed to parse Gemini recommendation:', error)
      return this.getFallbackRecommendation()
    }
  }

  async enhanceVenueSearch(
    location: string,
    criteria: {
      budget: string
      vibes: string[]
      time: string
    }
  ): Promise<{
    searchTerms: string[]
    locationInsights: string
    recommendations: string[]
  }> {
    const prompt = `
Enhance venue search for a date night app with:

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

Focus on romantic, date-appropriate venues and hidden gems. Consider local culture and dating scene.
`

    try {
      const response = await this.generateContent(prompt)
      const cleaned = response.replace(/```json\n?|\n?```/g, '').trim()
      return JSON.parse(cleaned)
    } catch (error) {
      console.error('Failed to parse Gemini search enhancement:', error)
      return this.getFallbackSearchEnhancement()
    }
  }

  async generateChatResponse(
    message: string,
    context: {
      currentVenue?: any
      searchCriteria?: any
      previousMessages?: string[]
    }
  ): Promise<string> {
    const contextInfo = context.currentVenue 
      ? `Current venue: ${context.currentVenue.name} - ${context.currentVenue.category}`
      : 'No venue selected'
    
    const criteriaInfo = context.searchCriteria
      ? `Search criteria: ${context.searchCriteria.location}, ${context.searchCriteria.budget}, ${context.searchCriteria.vibes.join(', ')}`
      : 'No search criteria set'

    const prompt = `
You are a helpful Date Night AI assistant. Help users plan perfect dates.

Context: ${contextInfo}
${criteriaInfo}

User message: "${message}"

Provide a helpful, friendly, and romantic response. Focus on:
- Making the user feel confident about their date plans
- Offering practical advice
- Being encouraging and positive
- Keeping responses concise but warm

Don't use markdown or special formatting. Just respond naturally.
`

    return this.generateContent(prompt)
  }

  private getFallbackVenueAnalysis(): VenueAnalysis {
    return {
      description: "A wonderful venue perfect for creating memorable date experiences",
      highlights: ["Romantic atmosphere", "Excellent service", "Beautiful setting"],
      vibe_tags: ["romantic", "intimate", "charming"],
      price_assessment: "Great value for the experience offered",
      best_for: ["Date nights", "Anniversaries", "Special occasions"],
      insider_tips: ["Book ahead for best seating", "Arrive a few minutes early"],
      rating_explanation: "Consistently praised for ambiance and service quality",
      photo_spots: ["Entrance", "Main dining area", "Cozy corners"]
    }
  }

  private getFallbackRecommendation(): DateRecommendation {
    return {
      title: "Perfect Romantic Evening",
      description: "A carefully curated date experience that combines the best of local dining and entertainment",
      why_perfect: "This combination balances romance, fun, and conversation perfectly for your special evening",
      tips: ["Dress comfortably but elegantly", "Make reservations in advance", "Bring a camera for memories"],
      alternatives: ["Indoor venues if weather concerns", "Earlier time slots for quieter atmosphere", "Backup transportation options"]
    }
  }

  private getFallbackSearchEnhancement() {
    return {
      searchTerms: ["romantic restaurants", "date night spots", "couples dining", "intimate bars"],
      locationInsights: "This area offers several romantic options perfect for date nights",
      recommendations: ["Focus on downtown area", "Consider waterfront venues", "Look for places with live music"]
    }
  }
}

export const geminiAI = new GeminiAIService()
