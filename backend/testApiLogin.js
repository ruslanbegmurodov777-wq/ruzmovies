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
    console.log('Testing login with test user...');
    
    // Try to find the test user
    const user = await User.findOne({
      where: { email: "test@example.com" }
    });
    
    if (!user) {
      console.log('Test user not found in database');
      return;
    }
    
    console.log('Found test user:', user.email);
    
    // Test password comparison with the default password
    const passwordMatch = await bcrypt.compare('test123', user.password);
    console.log('Password match with "test123":', passwordMatch);
    
    // Test JWT token creation
    if (passwordMatch) {
      const payload = { id: user.id };
      const token = jwt.sign(payload, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRE || '1d',
      });
      
      console.log('✅ JWT token created successfully!');
      console.log('Token:', token.substring(0, 50) + '...');
      
      // Test decoding the token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log('✅ JWT token verified successfully!');
      console.log('Decoded payload:', decoded);
    } else {
      console.log('❌ Password does not match');
      console.log('Trying to find the correct password...');
      
      // Let's try some common passwords
      const commonPasswords = ['test123', 'password', '123456', 'admin'];
      for (const password of commonPasswords) {
        const match = await bcrypt.compare(password, user.password);
        if (match) {
          console.log(`✅ Found correct password: ${password}`);
          break;
        }
      }
    }
  } catch (error) {
    console.log('❌ Error during test:', error.message);
    console.log('Error stack:', error.stack);
  }
}

testLogin();