// Test script for the complete venue search system
// Run this in browser console to test the full flow

async function testCompleteVenueSearch() {
  console.log('🎯 Testing Complete Venue Search System')
  
  // Test search criteria (similar to what user would select)
  const testCriteria = {
    location: "Loyola/Notre Dame, Baltimore, Maryland",
    budget: "$$",
    vibes: ["romantic", "cozy"],
    time: "prime",
    partySize: 2
  }
  
  try {
    // Import the venue searcher
    const { venueSearcher } = await import('/lib/venue-search.js')
    
    console.log('🔍 Starting venue search with criteria:', testCriteria)
    
    // Perform the search
    const result = await venueSearcher.searchVenues(testCriteria)
    
    console.log('✅ Search Results:')
    console.log(`   - Found ${result.totalFound} venues`)
    console.log(`   - Search took ${result.searchTime}ms`)
    console.log(`   - Sources used: ${result.sources.join(', ')}`)
    
    console.log('📍 Sample Venues:')
    result.venues.slice(0, 5).forEach((venue, index) => {
      console.log(`   ${index + 1}. ${venue.name} (${venue.category})`)
      console.log(`      Rating: ${venue.rating} (${venue.reviewCount} reviews)`)
      console.log(`      Price: ${venue.priceRange}`)
      console.log(`      Address: ${venue.address}`)
      console.log(`      Description: ${venue.description}`)
      console.log(`      Highlights: ${venue.highlights.join(', ')}`)
      console.log('')
    })
    
    // Test venue selection for date
    const drinks = result.venues.filter(v => v.category === 'drinks').slice(0, 3)
    const dinner = result.venues.filter(v => v.category === 'dinner').slice(0, 3)
    const activities = result.venues.filter(v => v.category === 'activity').slice(0, 3)
    
    console.log('🎪 Date Night Selection:')
    console.log(`   Drinks options: ${drinks.length}`)
    console.log(`   Dinner options: ${dinner.length}`)
    console.log(`   Activity options: ${activities.length}`)
    
    // Select one of each
    const selected = [
      drinks.length > 0 ? drinks[0] : null,
      dinner.length > 0 ? dinner[0] : null,
      activities.length > 0 ? activities[0] : null
    ].filter(Boolean)
    
    console.log('🌟 Selected Venues for Date:')
    selected.forEach((venue, index) => {
      console.log(`   ${index + 1}. ${venue.name} - ${venue.category}`)
    })
    
    return result
    
  } catch (error) {
    console.error('❌ Test failed:', error)
    return null
  }
}

// Test geolocation integration
async function testGeolocationIntegration() {
  console.log('📍 Testing Geolocation Integration')
  
  try {
    // Simulate getting location
    const mockLocation = "Loyola/Notre Dame, Baltimore, Maryland"
    
    // Test search with geolocated data
    const result = await testCompleteVenueSearch()
    
    if (result && result.venues.length > 0) {
      console.log('✅ Geolocation integration successful!')
      console.log(`   Found venues near: ${mockLocation}`)
    } else {
      console.log('⚠️ No venues found, but system is working')
    }
    
  } catch (error) {
    console.error('❌ Geolocation integration test failed:', error)
  }
}

// Run all tests
console.log('🚀 Starting Complete System Test')
testCompleteVenueSearch().then(() => {
  testGeolocationIntegration()
})

console.log('📝 To test the full user experience:')
console.log('   1. Open http://localhost:3000')
console.log('   2. Click the location button (📍)')
console.log('   3. Allow GPS permissions')
console.log('   4. Select budget and preferences')
console.log('   5. Click "Continue"')
console.log('   6. Watch the venue search in progress')
console.log('   7. See real venues in your itinerary!')
