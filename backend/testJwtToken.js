import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import jwt from 'jsonwebtoken';

// Get __dirname equivalent in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from the backend root directory
dotenv.config({ path: path.resolve(__dirname, '.env') });

console.log('JWT_SECRET:', process.env.JWT_SECRET ? 'SET' : 'NOT SET');
console.log('JWT_EXPIRE:', process.env.JWT_EXPIRE ? process.env.JWT_EXPIRE : 'NOT SET');

if (!process.env.JWT_SECRET) {
  console.log('ERROR: JWT_SECRET is not set!');
  process.exit(1);
}

// Test creating a JWT token
try {
  const payload = { id: 123, username: 'testuser' };
  const token = jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '1d',
  });
  
  console.log('✅ JWT token created successfully!');
  console.log('Token:', token.substring(0, 20) + '...');
  
  // Test verifying the token
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  console.log('✅ JWT token verified successfully!');
  console.log('Decoded payload:', decoded);
} catch (error) {
  console.log('❌ Error creating or verifying JWT token:', error.message);
  process.exit(1);
}