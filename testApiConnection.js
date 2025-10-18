// Simple script to test API connection
// Run this after deploying to verify the API is working

async function testApiConnection() {
  try {
    console.log('Testing API connection...');
    
    // Test the base API endpoint
    const response = await fetch('/api/v1');
    const data = await response.json();
    
    console.log('API Base Endpoint Response:', data);
    
    // Test the videos endpoint
    const videosResponse = await fetch('/api/v1/videos');
    const videosData = await videosResponse.json();
    
    console.log('Videos Endpoint Response:', videosData);
    
    // Test the health endpoint
    const healthResponse = await fetch('/api/v1/health');
    const healthData = await healthResponse.json();
    
    console.log('Health Endpoint Response:', healthData);
    
    console.log('✅ All API tests passed!');
  } catch (error) {
    console.error('❌ API connection test failed:', error.message);
  }
}

// Run the test
testApiConnection();