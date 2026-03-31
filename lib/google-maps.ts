// Google Maps Directions API integration
export interface TravelInfo {
  duration: {
    text: string
    value: number // in seconds
  }
  distance: {
    text: string
    value: number // in meters
  }
  status: string
}

export interface Coordinates {
  lat: number
  lng: number
}

class GoogleMapsService {
  private apiKey: string
  private baseUrl = 'https://maps.googleapis.com/maps/api/directions/json'

  constructor() {
    this.apiKey = process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY || ''
  }

  async getDirections(
    origin: Coordinates,
    destination: Coordinates,
    mode: 'driving' | 'walking' | 'transit' | 'bicycling' = 'driving'
  ): Promise<TravelInfo | null> {
    if (!this.apiKey) {
      console.warn('Google Maps API key not found, falling back to calculation')
      return this.calculateFallbackTravel(origin, destination)
    }

    try {
      const url = `${this.baseUrl}?origin=${origin.lat},${origin.lng}&destination=${destination.lat},${destination.lng}&mode=${mode}&key=${this.apiKey}`
      
      const response = await fetch(url)
      const data = await response.json()

      if (data.status === 'OK' && data.routes?.[0]?.legs?.[0]) {
        const leg = data.routes[0].legs[0]
        return {
          duration: leg.duration,
          distance: leg.distance,
          status: data.status
        }
      } else {
        console.warn('Google Maps API error:', data.status, data.error_message)
        return this.calculateFallbackTravel(origin, destination)
      }
    } catch (error) {
      console.error('Error fetching directions:', error)
      return this.calculateFallbackTravel(origin, destination)
    }
  }

  private calculateFallbackTravel(origin: Coordinates, destination: Coordinates): TravelInfo {
    // Fallback to Haversine calculation if API fails
    const R = 3959 // Earth's radius in miles
    const dLat = (destination.lat - origin.lat) * Math.PI / 180
    const dLng = (destination.lng - origin.lng) * Math.PI / 180
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(origin.lat * Math.PI / 180) * Math.cos(destination.lat * Math.PI / 180) *
      Math.sin(dLng/2) * Math.sin(dLng/2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
    const distanceMiles = R * c
    const distanceMeters = distanceMiles * 1609.34
    
    // Better speed estimates based on typical conditions
    const avgSpeedMph = 25 // city driving average
    const durationSeconds = (distanceMiles / avgSpeedMph) * 3600

    return {
      duration: {
        text: `${Math.round(durationSeconds / 60)} min`,
        value: durationSeconds
      },
      distance: {
        text: `${distanceMiles.toFixed(1)} mi`,
        value: distanceMeters
      },
      status: 'FALLBACK'
    }
  }

  async getMultipleDirections(
    waypoints: Coordinates[],
    mode: 'driving' | 'walking' | 'transit' | 'bicycling' = 'driving'
  ): Promise<TravelInfo[]> {
    const results: TravelInfo[] = []
    
    for (let i = 0; i < waypoints.length - 1; i++) {
      const travelInfo = await this.getDirections(waypoints[i], waypoints[i + 1], mode)
      if (travelInfo) {
        results.push(travelInfo)
      }
    }
    
    return results
  }

  // Format travel info for display
  formatTravelInfo(travelInfo: TravelInfo): { minutes: number; miles: number; displayText: string } {
    const minutes = Math.round(travelInfo.duration.value / 60)
    const miles = travelInfo.distance.value / 1609.34 // convert meters to miles
    
    return {
      minutes,
      miles: Math.round(miles * 10) / 10,
      displayText: `${travelInfo.duration.text} (${travelInfo.distance.text})`
    }
  }
}

export const googleMapsService = new GoogleMapsService()
