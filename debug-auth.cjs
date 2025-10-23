const axios = require('axios');

async function debugAuth() {
  try {
    console.log('Testing backend health endpoint...');
    const healthResponse = await axios.get('http://localhost:5000/api/health');
    console.log('Health check response:', healthResponse.data);
    
    const timestamp = Date.now();
    console.log('Attempting to register a new user...');
    const registerResponse = await axios.post('http://localhost:5000/api/v1/auth/signup', {
      firstname: 'Test',
      lastname: 'User',
      username: 'testuser' + timestamp,
      email: 'test' + timestamp + '@example.com',
      password: 'testpassword123'
    });
    
    console.log('Registration response:', registerResponse.data);
    
    console.log('Attempting to log in...');
    const loginResponse = await axios.post('http://localhost:5000/api/v1/auth/login', {
      email: 'test' + timestamp + '@example.com',
      password: 'testpassword123'
    });
    
    console.log('Login response:', loginResponse.data);
  } catch (error) {
    console.log('Error occurred:');
    console.log('Message:', error.message);
    console.log('Response status:', error.response?.status);
    console.log('Response data:', error.response?.data);
    console.log('Stack trace:', error.stack);
  }
}

debugAuth();