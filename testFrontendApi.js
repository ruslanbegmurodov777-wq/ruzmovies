// Test script to verify frontend can communicate with backend
import axios from 'axios';

async function testApi() {
  try {
    console.log('Testing API connection to backend...');
    
    // Test the health endpoint
    const healthResponse = await axios.get('http://localhost:5000/api/health');
    console.log('Health check:', healthResponse.data);
    
    // Test the login endpoint
    console.log('Testing login...');
    const loginResponse = await axios.post('http://localhost:5000/api/v1/auth/login', {
      email: 'test@example.com',
      password: 'test123'
    });
    
    console.log('Login successful!');
    console.log('Token:', loginResponse.data.data.substring(0, 50) + '...');
    
  } catch (error) {
    console.log('Error:', error.message);
    if (error.response) {
      console.log('Response data:', error.response.data);
      console.log('Response status:', error.response.status);
    }
  }
}

testApi();