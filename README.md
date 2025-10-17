# Ruzmovie - Full Stack Movie Streaming Platform

Ruzmovie is a full-stack movie streaming platform built with React (Frontend) and Node.js/Express (Backend). This project can be deployed entirely on Netlify using serverless functions.

## Project Structure

```
Ruzmovie/
│
├── backend/
│   ├── src/
│   ├── package.json
│   └── ...
│
├── frontend/
│   ├── src/
│   ├── package.json
│   └── build/
│
├── netlify/
│   └── functions/
│       └── api.js (serverless function)
│
└── netlify.toml (Netlify configuration)
```

## Quick Start

### Development Mode

To run both frontend and backend in development mode simultaneously:

```bash
npm run dev
```

This will start:
- Frontend on http://localhost:3000
- Backend API through Netlify functions

### Production Build

To build the frontend app for production:

```bash
npm run build
```

This will:
1. Build the React frontend application

### Production Start

To start the production server locally (emulates Netlify environment):

```bash
npm start
```

This will start the Netlify development server which will:
1. Serve the API endpoints under `/api/*` through serverless functions
2. Serve the React frontend application for all other routes

## Environment Variables

### Local Development (.env.local)
Create a `.env.local` file in the root directory:

```
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASS=ruslanbek777
DB_NAME=movie
DB_DIALECT=mysql
JWT_SECRET=mySuperSecretKey2025!
FRONTEND_URL=http://localhost:3000
PORT=5000
```

### Production/Railway (.env)
The `.env` file in the root directory is configured for Railway deployment:

```
DB_HOST=containers-us-west-123.railway.app
DB_PORT=3306
DB_USER=root
DB_PASS=uiAYlmNHzlcIdtbkcRnobyGXhpYaZxWI
DB_NAME=railway
DB_DIALECT=mysql
JWT_SECRET=your-super-secret-jwt-key
FRONTEND_URL=https://your-site-name.netlify.app
PORT=5000
```

## Database Setup

For detailed database setup instructions, see [DATABASE_SETUP.md](DATABASE_SETUP.md).

## Deployment to Netlify

1. Push your code to a GitHub repository
2. Connect your repository to Netlify
3. Set the build settings in Netlify:
   - Build command: `npm run build`
   - Publish directory: `frontend/build`
4. Set the environment variables in the Netlify dashboard
5. Deploy!

## API Endpoints

- `/api/v1/auth` - Authentication endpoints
- `/api/v1/admin` - Admin-only endpoints
- `/api/v1/videos` - Video management endpoints
- `/api/v1/users` - User management endpoints

## Available Scripts

In the project directory, you can run:

### `npm run build`
Builds the frontend app for production.

### `npm start`
Runs the Netlify development server which emulates the production environment.

### `npm run dev`
Runs the Netlify development server (same as `npm start`).

### `npm test`
Launches the test runner in the interactive watch mode.

## Serverless Functions

The backend Express application is wrapped in a serverless function located at `netlify/functions/api.js`. This allows the entire application to be deployed on Netlify.

## Database Connection

For Netlify deployment, you'll need to use an external database service like:
- PlanetScale (MySQL)
- Supabase (PostgreSQL)
- AWS RDS
- Google Cloud SQL
- Azure Database for MySQL/PostgreSQL

Make sure to configure the database environment variables in the Netlify dashboard.