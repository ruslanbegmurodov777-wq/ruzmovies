import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from './src/sequelize.js';

// Get __dirname equivalent in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from the backend root directory
dotenv.config({ path: path.resolve(__dirname, '.env') });

console.log('JWT_SECRET loaded:', !!process.env.JWT_SECRET);

// Test login function
async function testLogin() {
  try {
    // Try to find a user
    const user = await User.findOne();
    
    if (!user) {
      console.log('No users found in database');
      return;
    }
    
    console.log('Found user:', user.email);
    
    // Test password comparison
    const passwordMatch = await bcrypt.compare('ruslanbek777', user.password);
    console.log('Password match:', passwordMatch);
    
    // Test JWT token creation
    if (passwordMatch) {
      const payload = { id: user.id };
      const token = jwt.sign(payload, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRE || '1d',
      });
      
      console.log('✅ JWT token created successfully!');
      console.log('Token:', token.substring(0, 20) + '...');
    }
  } catch (error) {
    console.log('❌ Error during test:', error.message);
    console.log('Error stack:', error.stack);
  }
}

testLogin();