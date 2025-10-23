import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// Get __dirname equivalent in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from the backend root directory
dotenv.config({ path: path.resolve(__dirname, '.env') });

console.log('JWT_SECRET:', process.env.JWT_SECRET ? 'SET' : 'NOT SET');
console.log('JWT_EXPIRE:', process.env.JWT_EXPIRE || 'NOT SET');

// Test JWT token creation
try {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is not set');
  }
  
  const payload = { id: 123 };
  const token = jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '1d',
  });
  
  console.log('✅ JWT token created successfully!');
  console.log('Token:', token.substring(0, 50) + '...');
  
  // Test verifying the token
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  console.log('✅ JWT token verified successfully!');
  console.log('Decoded payload:', decoded);
} catch (error) {
  console.log('❌ Error creating or verifying JWT token:', error.message);
  process.exit(1);
}