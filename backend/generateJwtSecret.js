import crypto from 'crypto';

// Generate a strong JWT secret
const jwtSecret = crypto.randomBytes(32).toString('hex');

console.log('Generated JWT Secret:');
console.log(jwtSecret);
console.log('');
console.log('Add this to your .env file:');
console.log(`JWT_SECRET=${jwtSecret}`);