// Test script to verify geolocation functionality
// This can be run in the browser console to test the geolocation functions

async function testGeolocation() {
  console.log('🧪 Testing geolocation functionality...');
  
  // Test 1: Check if geolocation is available
  if (!navigator.geolocation) {
    console.log('❌ Browser geolocation not available');
    return;
  }
  console.log('✅ Browser geolocation is available');
  
  // Test 2: Try to get current position
  try {
    const position = await new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      });
    });
    
    console.log('✅ GPS position obtained:', {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      accuracy: position.coords.accuracy + ' meters'
    });
    
    // Test 3: Test reverse geocoding
    const location = await testReverseGeocode(position.coords.latitude, position.coords.longitude);
    console.log('✅ Reverse geocoding successful:', location);
    
  } catch (error) {
    console.log('❌ GPS failed, testing IP-based location...');
    
    // Test 4: Test IP-based location
    try {
      const ipLocation = await testIPLocation();
      console.log('✅ IP-based location successful:', ipLocation);
    } catch (ipError) {
      console.log('❌ IP-based location also failed:', ipError);
    }
  }
}

async function testReverseGeocode(lat, lon) {
  // Test Nominatim (OpenStreetMap)
  try {
    const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=18&addressdetails=1`, {
      headers: {
        'User-Agent': 'DateNightApp/1.0'
      }
    });
    const data = await response.json();
    
    if (data && data.display_name) {
      const address = data.address;
      const parts = [
        address.neighbourhood,
        address.suburb,
        address.city,
        address.town,
        address.village
      ].filter(Boolean);
      
      return parts[0] || data.display_name.split(',')[0];
    }
  } catch (error) {
    console.log('Nominatim failed:', error);
  }
  
  throw new Error('Reverse geocoding failed');
}

async function testIPLocation() {
  const services = [
    'https://ipapi.co/json/',
    'http://ip-api.com/json/',
    'https://ipinfo.io/json',
    'https://freegeoip.app/json/'
  ];

  for (const service of services) {
    try {
      const response = await fetch(service);
      const data = await response.json();
      
      let location = "";
      
      if (service.includes('ipapi.co')) {
        location = data.city || data.region || "";
      } else if (service.includes('ip-api.com')) {
        location = data.city || data.regionName || "";
      } else if (service.includes('ipinfo.io')) {
        location = data.city || data.region || "";
      } else if (service.includes('freegeoip.app')) {
        location = data.city || data.region_name || "";
      }
      
      if (location) {
        console.log(`✅ ${service} returned:`, location);
        return location;
      }
    } catch (error) {
      console.log(`❌ ${service} failed:`, error);
      continue;
    }
  }
  
  throw new Error('All IP location services failed');
}

// Run the test
testGeolocation();
