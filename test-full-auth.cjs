const axios = require('axios');

async function testAuth() {
  try {
    const timestamp = Date.now();
    // First, try to register a new user
    console.log('Attempting to register a new user...');
    const registerResponse = await axios.post('http://localhost:5000/api/v1/auth/signup', {
      firstname: 'Test',
      lastname: 'User',
      username: 'testuser' + timestamp,
      email: 'test' + timestamp + '@example.com',
      password: 'testpassword123'
    });
    
    console.log('Registration successful:', registerResponse.data);
    
    // Then, try to log in with the same credentials
    console.log('Attempting to log in...');
    const loginResponse = await axios.post('http://localhost:5000/api/v1/auth/login', {
      email: 'test' + timestamp + '@example.com',
      password: 'testpassword123'
    });
    
    console.log('Login successful:', loginResponse.data);
  } catch (error) {
    console.log('Error:', error.response?.data || error.message);
  }
}

testAuth();