# Separated Frontend and Backend Deployment Guide

This guide explains how to deploy the Ruzmovie application with separated frontend and backend services.

## Prerequisites

1. A Netlify account for frontend deployment
2. A Render account for backend deployment
3. A GitHub/GitLab/Bitbucket repository with the Ruzmovie code
4. An external MySQL database (Aiven, PlanetScale, AWS RDS, etc.)

## Architecture Overview

```
┌─────────────────┐    API Calls    ┌──────────────────┐
│   Frontend      ├─────────────────┤    Backend       │
│   (Netlify)     │◄────────────────┤   (Render)       │
└─────────────────┘                 └──────────────────┘
                                              │
                                              │ Database
                                              ▼
                                    ┌──────────────────┐
                                    │  MySQL Database  │
                                    │  (Aiven/PlanetScale)│
                                    └──────────────────┘
```

## Deployment Steps

### 1. Prepare Your Repository

1. Ensure your repository contains both frontend and backend code
2. Remove any proxy configurations that route API calls through Netlify functions
3. Update the frontend API configuration to point directly to your backend service

### 2. Configure Environment Variables

Create two separate .env files:
- `.env.development` for local development
- `.env.production` for production deployment

#### Backend Environment Variables (.env.production)
```bash
# Database Configuration
DB_HOST=your-database-host
DB_USER=your-database-user
DB_PASS=your-database-password
DB_NAME=your-database-name
DB_DIALECT=mysql
DB_PORT=3306

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRE=30d

# Frontend URL (for CORS)
FRONTEND_URL=https://your-site-name.netlify.app

# Backend URL (for CORS)
RENDER_BACKEND_URL=https://your-render-app-name.onrender.com

# Server Configuration
NODE_ENV=production
PORT=10000
```

#### Frontend Environment Variables
For the frontend, you'll set environment variables in the Netlify dashboard:
```bash
REACT_APP_API_URL=https://your-render-app-name.onrender.com/api/v1
```

### 3. Deploy Backend to Render

1. Go to [Render](https://render.com) and create an account
2. Click "New Web Service"
3. Connect your GitHub repository
4. Configure the service:
   - Name: ruzmovie-backend (or your preferred name)
   - Region: Choose the region closest to your users
   - Branch: main (or your default branch)
   - Root Directory: Leave empty
   - Environment: Node
   - Build Command: `npm install`
   - Start Command: `node backend/src/server.js`
   - Instance Type: Free (for development)

5. Add environment variables in the "Advanced" section:
   - DB_HOST: Your database host
   - DB_USER: Your database user
   - DB_PASSWORD: Your database password
   - DB_NAME: Your database name
   - DB_DIALECT: mysql
   - DB_PORT: 3306
   - JWT_SECRET: Your generated JWT secret
   - JWT_EXPIRE: 30d
   - FRONTEND_URL: https://your-site-name.netlify.app
   - RENDER_BACKEND_URL: https://your-render-app-name.onrender.com
   - NODE_ENV: production
   - PORT: 10000

6. Click "Create Web Service"

### 4. Deploy Frontend to Netlify

1. Go to [Netlify](https://netlify.com) and log in to your account
2. Click "Add new site" → "Import an existing project"
3. Connect your Git provider (GitHub, GitLab, or Bitbucket)
4. Select your Ruzmovie repository
5. Configure the deployment settings:
   - Branch to deploy: `main` (or your default branch)
   - Build command: `npm run build`
   - Publish directory: `frontend/build`

6. Configure environment variables:
   - Go to Site settings → Build & deploy → Environment
   - Add variable: `REACT_APP_API_URL` with value `https://your-render-app-name.onrender.com/api/v1`

7. Deploy the site

### 5. Configure CORS

The application is already configured to handle CORS for multiple origins. Ensure that:

1. Your FRONTEND_URL in the backend environment variables matches your Netlify site URL
2. Your RENDER_BACKEND_URL in the backend environment variables matches your Render service URL

### 6. Database Setup

Since both Netlify and Render cannot directly connect to localhost databases, you need an external database:

#### Recommended Options:
1. **Aiven** (MySQL) - Free tier available
2. **PlanetScale** (MySQL) - Free tier available
3. **Supabase** (PostgreSQL) - Free tier available

#### Aiven Setup (Recommended):
1. Go to [Aiven](https://aiven.io)
2. Create a free account
3. Create a new MySQL database
4. Get the connection details (host, username, password, database name)
5. Add these details to your Render environment variables

### 7. Custom Domain (Optional)

#### For Netlify:
1. In the Netlify dashboard, go to "Domain settings"
2. Add your custom domain
3. Follow the instructions to configure DNS records with your domain registrar
4. Netlify will automatically provision an SSL certificate

#### For Render:
1. In the Render dashboard, go to your web service
2. Navigate to "Settings" → "Custom domains"
3. Add your custom domain
4. Follow the DNS configuration instructions

## Testing the Deployment

### 1. Verify Backend Deployment
1. Visit your Render backend URL: `https://your-render-app-name.onrender.com`
2. You should see: `{"message":"🎬 RuzMovie backend is running successfully!"}`
3. Test the health endpoint: `https://your-render-app-name.onrender.com/api/health`

### 2. Verify Frontend Deployment
1. Visit your Netlify site URL
2. The application should load without errors
3. Try to register a new user to test API connectivity

### 3. Test API Endpoints
1. Use a tool like Postman or curl to test API endpoints:
   ```bash
   curl https://your-render-app-name.onrender.com/api/health
   ```
2. You should receive a JSON response with status information

## Troubleshooting

### Common Issues

#### 1. CORS Errors
- Ensure FRONTEND_URL and RENDER_BACKEND_URL are correctly set in environment variables
- Check that the URLs exactly match your deployed sites

#### 2. Database Connection Issues
- Verify all database environment variables are correctly set
- Ensure your database allows connections from external sources
- Check that your database credentials are correct

#### 3. API Errors
- Check the Render logs for error details
- Ensure all required environment variables are set
- Verify the database connection

#### 4. Frontend Build Failures
- Check the Netlify build logs
- Ensure all dependencies are correctly specified in package.json files
- Make sure the build command and publish directory are correctly configured

## Scaling Considerations

1. **Database**: Choose a database plan that can handle your expected traffic
2. **File Storage**: For large video files, consider using a CDN or cloud storage service
3. **Backend Performance**: Monitor Render instance performance and upgrade if needed
4. **Frontend Performance**: Netlify handles scaling automatically

## Monitoring and Analytics

### Render Monitoring
- Performance metrics
- Error tracking
- Log viewing
- Uptime monitoring

### Netlify Monitoring
- Performance metrics
- Bandwidth usage
- Build logs
- Error tracking

### Additional Monitoring
Consider integrating:
- Application logging
- Performance monitoring tools
- Error tracking services (Sentry, etc.)