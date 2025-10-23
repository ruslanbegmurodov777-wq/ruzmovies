# Full-Stack Deployment Guide

This guide explains how to deploy the Ruzmovie application as a single full-stack application that serves both the React frontend and Express backend from the same domain.

## Project Structure

```
ruzmovie/
├── backend/
│   ├── src/
│   │   └── server.js (configured to serve frontend)
│   └── package.json
├── frontend/
│   ├── build/ (created during build process)
│   ├── src/
│   └── package.json
├── package.json (root with build and start scripts)
└── render.yaml (deployment configuration)
```

## How It Works

1. During the build process, the React frontend is built into static files in `frontend/build/`
2. The Express server is configured to serve these static files
3. All non-API requests are routed to the React app's `index.html` to support client-side routing
4. API requests (starting with `/api`) are handled by the Express backend

## Environment Variables

Create a `.env` file in the `backend/` directory with the following variables:

```env
# Database Configuration
DB_HOST=your_database_host
DB_USER=your_database_user
DB_PASS=your_database_password
DB_NAME=your_database_name
DB_DIALECT=mysql_or_postgres
DB_PORT=database_port

# JWT Configuration
JWT_SECRET=your_strong_jwt_secret
JWT_EXPIRE=30d

# Server Port
PORT=5000
```

For Render deployment, you should set these variables in the Render dashboard instead of using a .env file.

## Deployment to Render

1. Push your code to a GitHub repository
2. Connect your repository to Render
3. Use the provided `render.yaml` configuration
4. Set the required environment variables in the Render dashboard:
   - DB_HOST
   - DB_USER
   - DB_PASS
   - DB_NAME
   - DB_DIALECT
   - JWT_SECRET
   - PORT (optional, defaults to 10000 in render.yaml)

## Deployment to Other Platforms

### Vercel
1. Create a `vercel.json` file in the root directory:
   ```json
   {
     "version": 2,
     "builds": [
       {
         "src": "backend/src/server.js",
         "use": "@vercel/node"
       }
     ],
     "routes": [
       {
         "src": "/(.*)",
         "dest": "backend/src/server.js"
       }
     ]
   }
   ```
2. Set environment variables in the Vercel dashboard

### Heroku
1. Create a `Procfile` in the root directory:
   ```
   web: cd backend && npm start
   ```
2. Set environment variables in the Heroku dashboard

## Running Locally

### Development Mode
```bash
# Install dependencies
npm install

# Run both frontend and backend in development mode
npm run dev
```

This will start:
- Frontend on http://localhost:3000
- Backend on http://localhost:5000

### Production Mode
```bash
# Install dependencies and build frontend
npm install
npm run build

# Start the production server
npm start
```

This will start the backend server which serves both the API and frontend on http://localhost:5000 (or your configured PORT).

## Key Features

1. **No CORS Issues**: Since both frontend and backend are served from the same origin, CORS is not a problem.
2. **Client-Side Routing**: React Router works correctly because all non-API routes serve the React app.
3. **Environment-Based Configuration**: Different configurations for development and production environments.
4. **Scalable**: Can be deployed to various platforms with minimal configuration changes.