import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Get __dirname equivalent in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from the backend root directory
dotenv.config({ path: path.resolve(__dirname, '.env') });

console.log('JWT_SECRET:', process.env.JWT_SECRET ? 'SET' : 'NOT SET');
console.log('JWT_EXPIRE:', process.env.JWT_EXPIRE ? process.env.JWT_EXPIRE : 'NOT SET');

if (process.env.JWT_SECRET) {
  console.log('JWT_SECRET value:', process.env.JWT_SECRET.substring(0, 5) + '...');
} else {
  console.log('ERROR: JWT_SECRET is not set!');
  process.exit(1);
}