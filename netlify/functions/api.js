// Netlify function to proxy API requests to Render backend
import fetch from "node-fetch";
import serverless from 'serverless-http';
import app from '../../backend/src/serverless.js';

// Export the serverless function handler
export const handler = serverless(app);
