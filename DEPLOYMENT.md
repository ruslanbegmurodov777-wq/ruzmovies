# Deployment Guide for Ruzmovie on Netlify

This guide explains how to deploy the Ruzmovie application entirely on Netlify using serverless functions.

## Prerequisites

1. A Netlify account
2. A GitHub/GitLab/Bitbucket repository with the Ruzmovie code
3. An external MySQL database (PlanetScale, Supabase, AWS RDS, etc.)

## Project Structure for Netlify Deployment

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

## Setup Instructions

### 1. Connect Repository to Netlify

1. Go to [Netlify](https://netlify.com) and log in to your account
2. Click "New site from Git"
3. Connect your Git provider (GitHub, GitLab, or Bitbucket)
4. Select your Ruzmovie repository
5. Configure the deployment settings:
   - Branch to deploy: `main` (or your default branch)
   - Build command: `npm run build`
   - Publish directory: `frontend/build`

### 2. Configure Environment Variables

In the Netlify dashboard:

1. Go to your site settings
2. Navigate to "Environment variables"
3. Add the following variables:

```
DB_HOST=your-database-host
DB_USER=your-database-user
DB_PASSWORD=your-database-password
DB_NAME=your-database-name
DB_DIALECT=mysql
DB_PORT=3306
JWT_SECRET=your-super-secret-jwt-key
FRONTEND_URL=https://your-site-name.netlify.app
```

### 3. External Database Setup

Since Netlify serverless functions cannot directly connect to localhost databases, you need an external database:

#### Options:
1. **PlanetScale** (MySQL) - Free tier available
2. **Supabase** (PostgreSQL) - Free tier available
3. **AWS RDS** (MySQL/PostgreSQL)
4. **Google Cloud SQL** (MySQL/PostgreSQL)
5. **Azure Database** (MySQL/PostgreSQL)

#### PlanetScale Setup (Recommended for Development):
1. Go to [PlanetScale](https://planetscale.com)
2. Create a free account
3. Create a new database
4. Get the connection details (host, username, password, database name)
5. Add these details to your Netlify environment variables

### 4. Deploy the Site

1. After configuring the environment variables, Netlify will automatically deploy your site
2. The first deployment might take a few minutes
3. Once deployed, you can access your site at the provided Netlify URL

## Local Development

To run the application locally with Netlify functions:

```bash
npm run dev
```

This will start the Netlify development server which emulates the production environment.

## How It Works

1. **Frontend**: The React application is built and served as static files
2. **Backend**: The Express application is wrapped in a serverless function using `serverless-http`
3. **API Routes**: All API requests to `/api/*` are redirected to the serverless function
4. **Static Files**: All other requests are served the React application (SPA routing)

## File Uploads

The application supports both URL-based videos and file uploads. For file uploads to work properly on Netlify:

1. File uploads are stored in the database as BLOBs (binary large objects)
2. This approach works well for small files but may not be suitable for large video files
3. For production applications with large video files, consider using a cloud storage service like AWS S3, Cloudinary, or similar

## Custom Domain

To use a custom domain:

1. In the Netlify dashboard, go to "Domain settings"
2. Add your custom domain
3. Follow the instructions to configure DNS records with your domain registrar
4. Netlify will automatically provision an SSL certificate for your custom domain

## Troubleshooting

### Database Connection Issues
- Ensure your database allows connections from external sources
- Verify all database environment variables are correctly set
- Check that your database credentials are correct

### API Errors
- Check the Netlify function logs for error details
- Ensure all required environment variables are set
- Verify the database connection

### Build Failures
- Check the build logs in the Netlify dashboard
- Ensure all dependencies are correctly specified in package.json files
- Make sure the build command and publish directory are correctly configured

## Scaling Considerations

1. **Database**: Choose a database plan that can handle your expected traffic
2. **File Storage**: For large video files, consider using a CDN or cloud storage service
3. **Function Execution Time**: Netlify functions have execution time limits; optimize database queries
4. **Concurrent Connections**: Plan for the number of concurrent users your application will support

## Monitoring and Analytics

Netlify provides built-in analytics and monitoring:
- Performance metrics
- Bandwidth usage
- Function invocation counts
- Error tracking

For more detailed application monitoring, consider integrating:
- Application logging
- Performance monitoring tools
- Error tracking services