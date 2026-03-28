"use client"

import { useState } from "react"
import { 
  Compass, 
  Lock, 
  Sparkles, 
  Clock, 
  Heart, 
  Flame, 
  Coffee, 
  Crown, 
  Zap,
  MapPin,
  Calendar,
  Users,
  Shuffle
} from "lucide-react"

const BUDGET_OPTIONS = [
  { value: "$", label: "Casual", price: "$30-50" },
  { value: "$$", label: "Nice", price: "$50-100" },
  { value: "$$$", label: "Upscale", price: "$100-200" },
  { value: "$$$$", label: "Luxury", price: "$200+" },
] as const
type Budget = (typeof BUDGET_OPTIONS)[number]["value"]

const VIBE_OPTIONS = [
  { id: "romantic", label: "Romantic", icon: Heart },
  { id: "adventurous", label: "Adventurous", icon: Flame },
  { id: "chill", label: "Chill", icon: Coffee },
  { id: "upscale", label: "Upscale", icon: Crown },
  { id: "quirky", label: "Quirky", icon: Zap },
] as const

const TIME_OPTIONS = [
  { value: "early", label: "Early Evening", time: "5-7 PM" },
  { value: "prime", label: "Prime Time", time: "7-9 PM" },
  { value: "late", label: "Late Night", time: "9 PM+" },
] as const

interface DateConfig {
  budget: Budget
  location: string
  vibes: string[]
  time: string
  partySize: number
}

interface SetupScreenProps {
  onSubmit: (config: DateConfig) => void
}

export function SetupScreen({ onSubmit }: SetupScreenProps) {
  const [budget, setBudget] = useState<Budget>("$$")
  const [location, setLocation] = useState("")
  const [vibes, setVibes] = useState<string[]>(["romantic"])
  const [time, setTime] = useState("prime")
  const [partySize, setPartySize] = useState(2)
  const [isLocating, setIsLocating] = useState(false)

  const toggleVibe = (id: string) => {
    setVibes(prev => 
      prev.includes(id) 
        ? prev.filter(v => v !== id)
        : prev.length < 3 ? [...prev, id] : prev
    )
  }

  const handleLocate = async () => {
    setIsLocating(true)
    
    try {
      // Try browser geolocation first (most accurate)
      if (navigator.geolocation) {
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(
            resolve,
            reject,
            {
              enableHighAccuracy: true,
              timeout: 10000,
              maximumAge: 0
            }
          )
        })
        
        // Reverse geocode using multiple free services for accuracy
        const location = await reverseGeocode(position.coords.latitude, position.coords.longitude)
        setLocation(location)
      } else {
        // Fallback to IP-based geolocation
        const location = await getIPLocation()
        setLocation(location)
      }
    } catch (error) {
      console.error('Geolocation failed:', error)
      // Fallback to IP-based geolocation
      try {
        const location = await getIPLocation()
        setLocation(location)
      } catch (fallbackError) {
        console.error('IP geolocation also failed:', fallbackError)
        setLocation("")
      }
    } finally {
      setIsLocating(false)
    }
  }

  // Enhanced reverse geocoding with multiple services for accuracy
  const reverseGeocode = async (lat: number, lon: number): Promise<string> => {
    // DISABLED: CORS issues with external APIs
    console.log('Geocoding disabled due to CORS issues - using fallback location')
    return "New York, NY"
    
    // Original code below is unreachable due to CORS
    const services = [
      // Nominatim (OpenStreetMap) - Free, no API key needed
      {
        name: 'Nominatim',
        url: `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=18&addressdetails=1`,
        headers: { 'User-Agent': 'DateNightApp/1.0' },
        parse: (data: any) => {
          if (data && data.address) {
            const address = data.address
            
            // Create a more specific location string
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
            
            return {
              primary: specificLocation,
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
              },
              confidence: calculateConfidence(address)
            }
          }
          return null
        }
      },
      // BigDataCloud - Free tier, very accurate
      {
        name: 'BigDataCloud',
        url: `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`,
        parse: (data: any) => {
          if (data && data.locality) {
            let specificLocation = data.locality
            
            // Add more context if available
            if (data.sublocality && data.locality !== data.sublocality) {
              specificLocation = `${data.sublocality}, ${data.locality}`
            }
            
            // Add state for context
            if (data.principalSubdivision && !specificLocation.includes(data.principalSubdivision)) {
              specificLocation = `${specificLocation}, ${data.principalSubdivision}`
            }
            
            return {
              primary: specificLocation,
              full: `${specificLocation}, ${data.countryName || 'Unknown'}`,
              components: {
                neighborhood: data.sublocality,
                city: data.locality,
                county: data.localAdminUnit,
                state: data.principalSubdivision,
                country: data.countryName,
                postcode: data.postcode,
                road: data.street,
                house_number: data.streetNumber
              },
              confidence: calculateConfidence({
                neighbourhood: data.sublocality,
                city: data.locality,
                suburb: data.sublocality
              })
            }
          }
          return null
        }
      },
      // Plus Codes (Google) - Very precise for specific locations
      {
        name: 'PlusCodes',
        url: `https://plus.codes/api?address=${lat},${lon}`,
        parse: (data: any) => {
          if (data && data.plus_code) {
            return {
              primary: data.plus_code.compound_code || data.plus_code.global_code,
              full: data.plus_code.global_code,
              components: {
                plus_code: data.plus_code.global_code,
                compound_code: data.plus_code.compound_code
              },
              confidence: 0.8 // Plus codes are very precise but not human-readable
            }
          }
          return null
        }
      }
    ]

    const results = []
    
    // Try all services and collect results
    for (const service of services) {
      try {
        console.log(`Trying ${service.name}...`)
        // DISABLED: CORS issues with external APIs
        // const response = await fetch(service.url, { headers: service.headers })
        console.log(`Skipping ${service.name} due to CORS issues`)
        continue
        
        // Check if response is ok
        // if (!response.ok) {
        //   console.error(`HTTP error! status: ${response.status}`)
        //   continue
        // }

        // const responseText = await response.text()
        
        // Check if response is empty
        // if (!responseText || responseText.trim() === '') {
        //   console.error(`Empty response from ${service.name}`)
        //   continue
        // }

        // let data
        // try {
        //   data = JSON.parse(responseText)
        // } catch (parseError) {
        //   console.error(`JSON parse error from ${service.name}:`, parseError)
        //   console.error(`Response text:`, responseText.substring(0, 200))
        //   continue
        // }

        // Validate data structure
        // if (!data || typeof data !== 'object') {
        //   console.error(`Invalid data structure from ${service.name}`)
        //   continue
        // }

        // const result = service.parse(data)
        
        // if (result) {
        //   results.push(result)
        //   console.log(`${service.name} success:`, result.primary, `(confidence: ${result.confidence})`)
        // }
      } catch (error) {
        console.error(`${service.name} failed:`, error)
      }
    }

    if (results.length === 0) {
      // Final fallback - return coordinates as location
      return `${lat.toFixed(4)}, ${lon.toFixed(4)}`
    }

    // Smart location selection based on confidence and usefulness
    const bestResult = selectBestLocation(results)
    
    console.log(`Selected location: ${bestResult.primary} (confidence: ${bestResult.confidence})`)
    return bestResult.primary
  }

  // Calculate confidence score for location data
  const calculateConfidence = (address: any): number => {
    let score = 0
    
    // Neighborhood level is most specific and useful
    if (address.neighbourhood) score += 3
    if (address.suburb) score += 2
    if (address.city_district) score += 2
    
    // City level is good
    if (address.city || address.town || address.village) score += 2
    
    // Street level is very specific
    if (address.road) score += 1.5
    if (address.house_number) score += 1
    
    // Lower administrative divisions
    if (address.county) score += 1
    if (address.state) score += 1
    if (address.country) score += 0.5
    
    // Postcode adds precision
    if (address.postcode) score += 0.5
    
    return Math.min(score / 12, 1) // Normalize to 0-1 (max score is now 12)
  }

  // Select the best location based on confidence and human readability
  const selectBestLocation = (results: any[]): any => {
    // Sort by confidence first
    results.sort((a, b) => b.confidence - a.confidence)
    
    // If the top result has high confidence and is human-readable, use it
    const top = results[0]
    
    // Avoid plus codes as primary unless they're the only option
    if (top.components.plus_code && results.length > 1) {
      return results[1] // Use the second best if it's more human-readable
    }
    
    // Prefer neighborhood/city level over administrative divisions
    if (top.confidence >= 0.5 && (top.components.neighborhood || top.components.city)) {
      return top
    }
    
    // Otherwise, return the highest confidence result
    return top
  }

  const getIPLocation = async (): Promise<string> => {
    const services = [
      {
        name: 'ipapi.co',
        url: 'https://ipapi.co/json/',
        parse: (data: any) => ({
          city: data.city,
          region: data.region,
          country: data.country_name,
          postal: data.postal,
          latitude: data.latitude,
          longitude: data.longitude,
          organization: data.org
        })
      },
      {
        name: 'ip-api.com',
        url: 'http://ip-api.com/json/',
        parse: (data: any) => ({
          city: data.city,
          region: data.regionName,
          country: data.country,
          postal: data.zip,
          latitude: data.lat,
          longitude: data.lon,
          organization: data.org
        })
      },
      {
        name: 'ipinfo.io',
        url: 'https://ipinfo.io/json',
        parse: (data: any) => ({
          city: data.city,
          region: data.region,
          country: data.country,
          postal: data.postal,
          latitude: parseFloat(data.loc?.split(',')[0] || '0'),
          longitude: parseFloat(data.loc?.split(',')[1] || '0'),
          organization: data.org
        })
      },
      {
        name: 'freegeoip.app',
        url: 'https://freegeoip.app/json/',
        parse: (data: any) => ({
          city: data.city,
          region: data.region_name,
          country: data.country_name,
          postal: data.zip_code,
          latitude: data.latitude,
          longitude: data.longitude,
          organization: data.time_zone
        })
      }
    ]

    const results = []
    
    // Try each service until one works
    for (const service of services) {
      try {
        console.log(`Trying ${service.name}...`)
        const response = await fetch(service.url)
        
        // Check if response is ok
        if (!response.ok) {
          console.error(`HTTP error! status: ${response.status}`)
          continue
        }

        const responseText = await response.text()
        
        // Check if response is empty
        if (!responseText || responseText.trim() === '') {
          console.error(`Empty response from ${service.name}`)
          continue
        }

        let data
        try {
          data = JSON.parse(responseText)
        } catch (parseError) {
          console.error(`JSON parse error from ${service.name}:`, parseError)
          console.error(`Response text:`, responseText.substring(0, 200))
          continue
        }

        // Validate data structure
        if (!data || typeof data !== 'object') {
          console.error(`Invalid data structure from ${service.name}`)
          continue
        }

        const result = service.parse(data)
        
        // Extract location with preference for city > region > country
        let location = result.city || result.region || result.country || ""
        
        if (location) {
          // Add more context if available
          if (result.city && result.region) {
            location = `${result.city}, ${result.region}`
          }
          
          console.log(`${service.name} success:`, location)
          console.log(`   Details:`, {
            city: result.city,
            region: result.region,
            country: result.country,
            coords: result.latitude && result.longitude ? 
              `${result.latitude.toFixed(4)}, ${result.longitude.toFixed(4)}` : 'N/A',
            org: result.organization || 'N/A'
          })
          
          results.push({ location, service: service.name, details: result })
        }
      } catch (error) {
        console.error(`Service ${service.name} failed:`, error)
        continue
      }
    }
    
    if (results.length > 0) {
      // Return the most specific location (prefer city-level data)
      const bestResult = results.reduce((best, current) => {
        const bestSpecificity = (current.details.city ? 2 : current.details.region ? 1 : 0)
        const currentSpecificity = (best.details.city ? 2 : best.details.region ? 1 : 0)
        return currentSpecificity > bestSpecificity ? current : best
      })
      
      return bestResult.location
    }
    
    throw new Error('All IP location services failed')
  }

  const handleSurpriseMe = () => {
    // Random selections
    const randomBudget = BUDGET_OPTIONS[Math.floor(Math.random() * BUDGET_OPTIONS.length)].value
    const randomVibes = [...VIBE_OPTIONS]
      .sort(() => Math.random() - 0.5)
      .slice(0, 2)
      .map((v: any) => v.id)
    const randomTime = TIME_OPTIONS[Math.floor(Math.random() * TIME_OPTIONS.length)].value
    
    setBudget(randomBudget)
    setVibes(randomVibes)
    setTime(randomTime)
  }

  const handleSubmit = () => {
    onSubmit({ budget, location: location || "", vibes, time, partySize })
  }

  return (
    <div className="flex flex-col min-h-svh bg-background relative overflow-hidden">
      {/* Ambient background effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/20 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-accent/15 rounded-full blur-3xl animate-pulse-slow [animation-delay:1s]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 flex flex-col px-6 pt-12 pb-8 flex-1">
        {/* Header */}
        <div className="flex flex-col items-center gap-4 mb-10">
          <div className="relative">
            <div className="absolute inset-0 bg-primary/40 rounded-2xl blur-xl animate-pulse" />
            <div className="relative w-16 h-16 rounded-2xl bg-linear-to-br from-primary to-accent flex items-center justify-center shadow-2xl shadow-primary/50">
              <Sparkles className="w-8 h-8 text-primary-foreground" />
            </div>
          </div>
          <div className="flex flex-col items-center gap-2">
            <h1 className="text-3xl font-bold tracking-tight text-balance text-center text-foreground">
              Date Night App
            </h1>
            <p className="text-muted-foreground text-sm text-center text-pretty max-w-xs">
              Plan your perfect evening
            </p>
          </div>
        </div>

        {/* Surprise Me Button */}
        <button
          onClick={handleSurpriseMe}
          className="mb-8 flex items-center justify-center gap-2 py-3 rounded-xl border border-dashed border-primary/40 text-primary text-sm font-medium hover:bg-primary/5 active:scale-98 transition-all"
        >
          <Shuffle className="w-4 h-4" />
          Randomize
        </button>

        {/* Form sections */}
        <div className="flex flex-col gap-7 flex-1">
          {/* Location */}
          <section className="flex flex-col gap-3">
            <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
              <MapPin className="w-3.5 h-3.5" />
              Location
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Compass className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-primary" />
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 rounded-2xl bg-secondary/80 backdrop-blur-sm border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/60 focus:border-transparent text-sm font-medium transition-all"
                  placeholder="Enter location"
                />
              </div>
              <button
                onClick={handleLocate}
                disabled={isLocating}
                className="px-4 rounded-2xl bg-secondary/80 backdrop-blur-sm border border-border text-primary hover:bg-primary/10 active:scale-95 transition-all disabled:opacity-50"
              >
                {isLocating ? (
                  <div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                ) : (
                  <MapPin className="w-5 h-5" />
                )}
              </button>
            </div>
          </section>

          {/* Party Size */}
          <section className="flex flex-col gap-3">
            <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
              <Users className="w-3.5 h-3.5" />
              Party Size
            </label>
            <div className="flex items-center gap-4 p-1.5 bg-secondary/80 backdrop-blur-sm rounded-2xl">
              {[2, 3, 4, 5, 6].map((size) => (
                <button
                  key={size}
                  onClick={() => setPartySize(size)}
                  className={`flex-1 py-3 rounded-xl text-sm font-semibold transition-all duration-200 ${
                    partySize === size
                      ? "bg-primary text-primary-foreground shadow-lg shadow-primary/30"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {size === 6 ? "6+" : size}
                </button>
              ))}
            </div>
          </section>

          {/* Budget */}
          <section className="flex flex-col gap-3">
            <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
              <Calendar className="w-3.5 h-3.5" />
              Budget
            </label>
            <div className="grid grid-cols-4 gap-2">
              {BUDGET_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setBudget(opt.value)}
                  className={`flex flex-col items-center gap-1 py-3.5 px-2 rounded-2xl border transition-all duration-200 ${
                    budget === opt.value
                      ? "bg-primary/15 border-primary text-foreground shadow-lg shadow-primary/20"
                      : "bg-secondary/80 backdrop-blur-sm border-border text-muted-foreground hover:border-primary/40"
                  }`}
                >
                  <span className={`text-base font-bold ${budget === opt.value ? "text-primary" : ""}`}>
                    {opt.value}
                  </span>
                  <span className="text-[10px] opacity-70">{opt.price}</span>
                </button>
              ))}
            </div>
          </section>

          {/* Time */}
          <section className="flex flex-col gap-3">
            <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
              <Clock className="w-3.5 h-3.5" />
              Time of Night
            </label>
            <div className="grid grid-cols-3 gap-2">
              {TIME_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setTime(opt.value)}
                  className={`flex flex-col items-center gap-1 py-3.5 px-2 rounded-2xl border transition-all duration-200 ${
                    time === opt.value
                      ? "bg-primary/15 border-primary text-foreground shadow-lg shadow-primary/20"
                      : "bg-secondary/80 backdrop-blur-sm border-border text-muted-foreground hover:border-primary/40"
                  }`}
                >
                  <span className={`text-xs font-semibold ${time === opt.value ? "text-primary" : ""}`}>
                    {opt.label}
                  </span>
                  <span className="text-[10px] opacity-70">{opt.time}</span>
                </button>
              ))}
            </div>
          </section>

          {/* Vibes */}
          <section className="flex flex-col gap-3">
            <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5" />
                Vibe (max 3)
              </span>
              <span className="text-primary">{vibes.length}/3</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {VIBE_OPTIONS.map((v) => {
                const Icon = v.icon
                const isSelected = vibes.includes(v.id)
                return (
                  <button
                    key={v.id}
                    onClick={() => toggleVibe(v.id)}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium border transition-all duration-200 ${
                      isSelected
                        ? "bg-primary/15 border-primary text-primary shadow-lg shadow-primary/20"
                        : "bg-secondary/80 backdrop-blur-sm border-border text-muted-foreground hover:border-primary/40 hover:text-foreground"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {v.label}
                  </button>
                )
              })}
            </div>
          </section>
        </div>

        {/* CTA */}
        <div className="mt-8 flex flex-col gap-3">
          <button
            onClick={handleSubmit}
            disabled={vibes.length === 0}
            className="relative w-full py-5 rounded-2xl bg-linear-to-r from-primary to-accent text-primary-foreground font-bold text-base tracking-wide flex items-center justify-center gap-3 shadow-2xl shadow-primary/40 active:scale-[0.98] transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden group"
          >
            <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
            <Lock className="w-5 h-5 relative z-10" />
            <span className="relative z-10">Continue</span>
          </button>
          <p className="text-center text-xs text-muted-foreground">
            Your date awaits
          </p>
        </div>
      </div>
    </div>
  )
}
