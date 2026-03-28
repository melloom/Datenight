// Test script for time-based venue filtering
// Run this in browser console to test different time periods

async function testTimeBasedFiltering() {
  console.log('🕐 Testing Time-Based Venue Filtering')
  
  try {
    // Import the venue searcher
    const { venueSearcher } = await import('/lib/venue-search.js')
    
    // Test location and preferences
    const baseCriteria = {
      location: "Loyola/Notre Dame, Baltimore, Maryland",
      budget: "$$",
      vibes: ["romantic", "cozy"],
      partySize: 2
    }
    
    // Test each time of day
    const times = ['early', 'prime', 'late']
    const results = {}
    
    for (const time of times) {
      console.log(`\n⏰ Testing ${time.toUpperCase()} time period...`)
      
      const criteria = { ...baseCriteria, time }
      const result = await venueSearcher.searchVenues(criteria)
      
      results[time] = result
      
      console.log(`✅ ${time.toUpperCase()} Results:`)
      console.log(`   - Found ${result.totalFound} venues`)
      console.log(`   - Time range: ${getTimeRange(time)}`)
      
      // Show sample venues for each time
      console.log(`   Sample venues:`)
      result.venues.slice(0, 2).forEach((venue, index) => {
        console.log(`     ${index + 1}. ${venue.name} (${venue.category})`)
        console.log(`        Rating: ${venue.rating} | Hours: ${venue.hours}`)
        console.log(`        Tags: ${venue.tags.slice(0, 3).join(', ')}`)
        console.log(`        Highlights: ${venue.highlights.slice(0, 2).join(', ')}`)
      })
    }
    
    // Compare results across time periods
    console.log('\n📊 Time-Based Comparison:')
    Object.entries(results).forEach(([time, result]) => {
      const avgRating = result.venues.reduce((sum, v) => sum + v.rating, 0) / result.venues.length
      console.log(`${time.toUpperCase()}: ${result.totalFound} venues, avg rating: ${avgRating.toFixed(1)}`)
    })
    
    return results
    
  } catch (error) {
    console.error('❌ Test failed:', error)
    return null
  }
}

function getTimeRange(time) {
  const ranges = {
    early: "5:00 PM - 7:30 PM",
    prime: "7:00 PM - 10:00 PM", 
    late: "9:00 PM - 2:00 AM"
  }
  return ranges[time] || "Unknown"
}

// Test specific venue characteristics by time
async function testVenueCharacteristics() {
  console.log('\n🎯 Testing Venue Characteristics by Time')
  
  const timeCharacteristics = {
    early: {
      expectedTypes: ['wine_bar', 'bistro', 'restaurant', 'art_gallery'],
      avoidedTypes: ['nightclub', 'sports_bar'],
      minRating: 3.5,
      description: 'Relaxed, early evening venues'
    },
    prime: {
      expectedTypes: ['restaurant', 'bar', 'lounge', 'brewery'],
      avoidedTypes: ['fast_food', 'cafeteria'],
      minRating: 4.0,
      description: 'Peak dining and social venues'
    },
    late: {
      expectedTypes: ['nightclub', 'cocktail_bar', 'karaoke', 'late_night_diner'],
      avoidedTypes: ['family_restaurant', 'cafe'],
      minRating: 3.8,
      description: 'Late night entertainment and dining'
    }
  }
  
  Object.entries(timeCharacteristics).forEach(([time, characteristics]) => {
    console.log(`\n${time.toUpperCase()}: ${characteristics.description}`)
    console.log(`   Preferred: ${characteristics.expectedTypes.join(', ')}`)
    console.log(`   Avoided: ${characteristics.avoidedTypes.join(', ')}`)
    console.log(`   Min Rating: ${characteristics.minRating}`)
  })
}

// Test opening hours filtering
async function testOpeningHoursFiltering() {
  console.log('\n🕰 Testing Opening Hours Filtering')
  
  const sampleHours = {
    early: {
      drinks: "4:00 PM - 11:00 PM (evening)",
      dinner: "5:00 PM - 10:00 PM (dinner service)",
      activity: "10:00 AM - 9:00 PM (gallery hours)"
    },
    prime: {
      drinks: "6:00 PM - 2:00 AM (night)",
      dinner: "6:00 PM - 11:00 PM (dinner)",
      activity: "7:00 PM - 1:00 AM (entertainment)"
    },
    late: {
      drinks: "8:00 PM - 4:00 AM (late night)",
      dinner: "10:00 PM - 3:00 AM (late dining)",
      activity: "9:00 PM - 3:00 AM (nightlife)"
    }
  }
  
  Object.entries(sampleHours).forEach(([time, hours]) => {
    console.log(`\n${time.toUpperCase()} Opening Hours:`)
    Object.entries(hours).forEach(([category, hoursStr]) => {
      console.log(`   ${category}: ${hoursStr}`)
    })
  })
}

// Run all tests
console.log('🚀 Starting Time-Based Filtering Tests')
testTimeBasedFiltering().then(() => {
  testVenueCharacteristics()
  testOpeningHoursFiltering()
})

console.log('\n📱 To test in the app:')
console.log('   1. Open http://localhost:3000')
console.log('   2. Select different "Time of Night" options')
console.log('   3. Notice how venue recommendations change!')
console.log('   4. Early: Relaxed venues (wine bars, bistros)')
console.log('   5. Prime: Peak dining spots (restaurants, lounges)')
console.log('   6. Late: Nightlife venues (clubs, late dining)')
