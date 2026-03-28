"use client"

import { useState, useEffect } from "react"

export default function TestGeolocationPage() {
  const [testResults, setTestResults] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const addResult = (message: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`])
  }

  const testGeolocation = async () => {
    setIsLoading(true)
    setTestResults([])
    
    addResult("🧪 Starting geolocation test...")
    
    // Test 1: Check if geolocation is available
    if (!navigator.geolocation) {
      addResult("❌ Browser geolocation not available")
      setIsLoading(false)
      return
    }
    addResult("✅ Browser geolocation is available")
    
    // Test 2: Try to get current position
    try {
      addResult("📍 Requesting GPS position...")
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
      
      addResult(`✅ GPS position obtained:`)
      addResult(`   Latitude: ${position.coords.latitude}`)
      addResult(`   Longitude: ${position.coords.longitude}`)
      addResult(`   Accuracy: ${position.coords.accuracy} meters`)
      
      // Test 3: Test reverse geocoding
      addResult("🗺️ Testing reverse geocoding...")
      const location = await testReverseGeocode(position.coords.latitude, position.coords.longitude)
      addResult(`✅ Location detected: ${location}`)
      
    } catch (error) {
      addResult(`❌ GPS failed: ${error}`)
      addResult("🔄 Testing IP-based location...")
      
      // Test 4: Test IP-based location
      try {
        const ipLocation = await testIPLocation()
        addResult(`✅ IP-based location: ${ipLocation}`)
      } catch (ipError) {
        addResult(`❌ IP-based location failed: ${ipError}`)
      }
    }
    
    setIsLoading(false)
    addResult("🎉 Test completed!")
  }

  const testReverseGeocode = async (lat: number, lon: number): Promise<string> => {
    // Test Nominatim (OpenStreetMap)
    try {
      addResult("   🌐 Trying Nominatim (OpenStreetMap)...")
      const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=18&addressdetails=1`, {
        headers: {
          'User-Agent': 'DateNightApp/1.0'
        }
      })
      const data = await response.json()
      
      if (data && data.address) {
        const address = data.address
        const parts = [
          address.neighbourhood,
          address.suburb,
          address.city_district,
          address.city,
          address.town,
          address.village,
          address.county,
          address.state
        ].filter(Boolean)
        
        const result = parts[0] || data.display_name.split(',')[0]
        
        // Calculate confidence score
        let confidence = 0
        if (address.neighbourhood) confidence += 3
        if (address.suburb) confidence += 2
        if (address.city_district) confidence += 2
        if (address.city || address.town || address.village) confidence += 2
        if (address.road) confidence += 1.5
        if (address.house_number) confidence += 1
        if (address.county) confidence += 1
        if (address.state) confidence += 1
        if (address.country) confidence += 0.5
        if (address.postcode) confidence += 0.5
        confidence = Math.min(confidence / 12, 1)
        
        // Create enhanced location format
        let specificLocation = ""
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
        
        // Add state if available
        if (address.state && specificLocation && !specificLocation.includes(address.state)) {
          specificLocation = `${specificLocation}, ${address.state}`
        }
        
        addResult(`   ✅ Nominatim success: ${specificLocation}`)
        addResult(`   🎯 Confidence: ${(confidence * 100).toFixed(1)}%`)
        addResult(`   📍 Full address: ${data.display_name}`)
        addResult(`   🏠 Enhanced Components:`)
        if (address.house_number && address.road) addResult(`      • Address: ${address.house_number} ${address.road}`)
        if (address.neighbourhood) addResult(`      • Neighborhood: ${address.neighbourhood}`)
        if (address.suburb) addResult(`      • Suburb: ${address.suburb}`)
        if (address.city_district) addResult(`      • City District: ${address.city_district}`)
        if (address.city || address.town || address.village) addResult(`      • City: ${address.city || address.town || address.village}`)
        if (address.county) addResult(`      • County: ${address.county}`)
        if (address.state) addResult(`      • State: ${address.state}`)
        if (address.country) addResult(`      • Country: ${address.country}`)
        if (address.postcode) addResult(`      • Postal Code: ${address.postcode}`)
        return specificLocation
      }
    } catch (error) {
      addResult(`   ❌ Nominatim failed: ${error}`)
    }
    
    // Test BigDataCloud as backup
    try {
      addResult("   🌐 Trying BigDataCloud...")
      const response = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`)
      const data = await response.json()
      
      if (data && data.locality) {
        // Create enhanced location format
        let specificLocation = data.locality
        if (data.sublocality && data.locality !== data.sublocality) {
          specificLocation = `${data.sublocality}, ${data.locality}`
        }
        if (data.principalSubdivision && !specificLocation.includes(data.principalSubdivision)) {
          specificLocation = `${specificLocation}, ${data.principalSubdivision}`
        }
        
        addResult(`   ✅ BigDataCloud success: ${specificLocation}`)
        addResult(`   📍 Full: ${specificLocation}, ${data.countryName || 'Unknown'}`)
        addResult(`   🏠 Enhanced Components:`)
        if (data.streetNumber && data.street) addResult(`      • Address: ${data.streetNumber} ${data.street}`)
        if (data.sublocality) addResult(`      • Sublocality: ${data.sublocality}`)
        if (data.locality) addResult(`      • City: ${data.locality}`)
        if (data.localAdminUnit) addResult(`      • Local Admin: ${data.localAdminUnit}`)
        if (data.principalSubdivision) addResult(`      • State: ${data.principalSubdivision}`)
        if (data.countryName) addResult(`      • Country: ${data.countryName}`)
        if (data.postcode) addResult(`      • Postal Code: ${data.postcode}`)
        return specificLocation
      }
    } catch (error) {
      addResult(`   ❌ BigDataCloud failed: ${error}`)
    }
    
    // Test Plus Codes for ultra-precise location
    try {
      addResult("   🌐 Trying Google Plus Codes...")
      const response = await fetch(`https://plus.codes/api?address=${lat},${lon}`)
      const data = await response.json()
      
      if (data && data.plus_code) {
        addResult(`   ✅ Plus Codes success: ${data.plus_code.global_code}`)
        addResult(`   📍 Compound Code: ${data.plus_code.compound_code}`)
        addResult(`   📝 Note: Plus codes are precise but less human-readable`)
        addResult(`   🔄 Will use human-readable location if available`)
        return data.plus_code.global_code
      }
    } catch (error) {
      addResult(`   ❌ Plus Codes failed: ${error}`)
    }
    
    throw new Error('Reverse geocoding failed')
  }

  const testIPLocation = async (): Promise<string> => {
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
          organization: data.org,
          timezone: data.timezone
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
          organization: data.org,
          timezone: data.timezone
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
          organization: data.org,
          timezone: data.timezone
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
          organization: data.time_zone,
          timezone: data.time_zone
        })
      }
    ]

    for (const service of services) {
      try {
        addResult(`   🌐 Trying ${service.name}...`)
        const response = await fetch(service.url)
        const data = await response.json()
        const result = service.parse(data)
        
        let location = result.city || result.region || result.country || ""
        
        if (location) {
          if (result.city && result.region) {
            location = `${result.city}, ${result.region}`
          }
          
          addResult(`   ✅ ${service.name} success: ${location}`)
          addResult(`   📍 Details:`)
          if (result.city) addResult(`      • City: ${result.city}`)
          if (result.region) addResult(`      • Region: ${result.region}`)
          if (result.country) addResult(`      • Country: ${result.country}`)
          if (result.postal) addResult(`      • Postal: ${result.postal}`)
          if (result.latitude && result.longitude) {
            addResult(`      • Coordinates: ${result.latitude.toFixed(4)}, ${result.longitude.toFixed(4)}`)
          }
          if (result.organization) addResult(`      • Organization: ${result.organization}`)
          if (result.timezone) addResult(`      • Timezone: ${result.timezone}`)
          
          return location
        }
      } catch (error) {
        addResult(`   ❌ ${service.name} failed: ${error}`)
        continue
      }
    }
    
    throw new Error('All IP location services failed')
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-4">🧪 Geolocation Test</h1>
        <p className="text-muted-foreground mb-8">
          This page will test the geolocation functionality automatically. Click the button below to start the test.
        </p>
        
        <button
          onClick={testGeolocation}
          disabled={isLoading}
          className="mb-8 px-6 py-3 bg-primary text-primary-foreground rounded-lg font-semibold disabled:opacity-50"
        >
          {isLoading ? "Testing..." : "🚀 Run Geolocation Test"}
        </button>
        
        <div className="bg-secondary/50 rounded-lg p-4 min-h-[400px]">
          <h2 className="text-lg font-semibold mb-4">Test Results:</h2>
          <div className="font-mono text-sm space-y-1">
            {testResults.length === 0 ? (
              <p className="text-muted-foreground">Click the button above to start testing...</p>
            ) : (
              testResults.map((result, index) => (
                <div key={index} className={result.includes("❌") ? "text-red-500" : result.includes("✅") ? "text-green-500" : ""}>
                  {result}
                </div>
              ))
            )}
          </div>
        </div>
        
        <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
          <h3 className="font-semibold mb-2">📋 What this tests:</h3>
          <ul className="text-sm space-y-1">
            <li>• Browser GPS availability and permission</li>
            <li>• GPS coordinate accuracy</li>
            <li>• Reverse geocoding with OpenStreetMap</li>
            <li>• IP-based location fallback</li>
            <li>• Multiple free geolocation services</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
