const axios = require('axios');

// Test login with non-existent user
axios.post('http://localhost:5000/api/v1/auth/login', {
  email: 'test@example.com',
  password: 'wrongpassword'
})
.then(response => {
  console.log('Success:', response.data);
})
.catch(error => {
  console.log('Error:', error.response?.data || error.message);
});