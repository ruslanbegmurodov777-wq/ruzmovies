# Troubleshooting Deployment Issues

This guide helps you identify and fix common deployment issues with the Ruzmovie application.

## Common Deployment Errors and Solutions

### 1. JWT_SECRET Configuration Error

**Symptoms**:
- "Error: secretOrPrivateKey must have a value"
- "Cannot create JWT token" errors
- Authentication failures

**Root Cause**:
The JWT_SECRET environment variable is not properly configured or is undefined.

**Solutions**:
1. Create a `.env` file in the `backend` directory
2. Add the JWT_SECRET variable with a strong secret value:
   ```env
   JWT_SECRET=your_super_secret_key_here
   JWT_EXPIRE=30d
   ```
3. Generate a strong secret key:
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```
4. Test your JWT configuration:
   ```bash
   cd backend
   npm run test-jwt
   ```

### 2. Express 5 Path Pattern Error

**Symptoms**:
- "PathError [TypeError]: Missing parameter name at index 1: *"
- "PathError [TypeError]: Missing parameter name at index 2: /*"
- Server fails to start
- Application crashes on startup

**Root Cause**:
In Express 5, wildcard patterns like `*` and `/*` are no longer valid because the path-to-regexp library now treats `*` as a parameter placeholder. Using these patterns will result in PathError exceptions.

**Solutions**:
1. Replace `app.get('*', ...)` or `app.get('/*', ...)` with `app.use((req, res) => { ... })`
2. Add conditional logic to only serve index.html for non-API routes

Example fix:
```javascript
// ❌ Incorrect (Express 5 incompatible)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend', 'build', 'index.html'));
});

// ❌ Also incorrect (Express 5 incompatible)
app.get('/*', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend', 'build', 'index.html'));
});

// ✅ Correct (Express 5 compatible)
app.use((req, res) => {
  if (!req.path.startsWith('/api')) {
    res.sendFile(path.join(__dirname, 'frontend', 'build', 'index.html'));
  }
});
```

### 3. CORS Configuration Error

**Symptoms**:
- "Access to XMLHttpRequest at 'https://your-backend-url.com/api/v1/...' from origin 'https://your-frontend-url.com' has been blocked by CORS policy"
- "Response to preflight request doesn't pass access control check: No 'Access-Control-Allow-Origin' header is present on the requested resource"
- Frontend cannot make API requests to backend

**Root Cause**:
1. The backend is not configured to accept requests from the frontend origin
2. The frontend is trying to make requests to an incorrect backend URL
3. Environment variables are not properly configured

**Solutions**:
1. Update the backend CORS configuration to allow the frontend origin:
   ```javascript
   const allowedOrigins = [
     "http://localhost:3000", // Local development
     "http://localhost:8888", // Netlify dev
     "https://your-production-frontend-url.com", // Production frontend
     process.env.FRONTEND_URL, // Frontend URL from environment variables
   ];
   
   const corsOptions = {
     origin: function (origin, callback) {
       if (!origin) return callback(null, true);
       if (allowedOrigins.indexOf(origin) !== -1) {
         callback(null, true);
       } else {
         callback(new Error('Not allowed by CORS'));
       }
     },
     credentials: true,
     optionsSuccessStatus: 200,
   };
   
   app.use(cors(corsOptions));
   ```

2. Make sure the frontend is using the correct backend URL by setting the REACT_APP_API_URL environment variable

3. Update the render.yaml file with the correct FRONTEND_URL environment variable

### 4. Missing Icon Files Error

**Symptoms**:
- "Error while trying to use the following icon from the Manifest: ... (Download error or resource isn't a valid image)"
- 404 errors for image files
- Manifest validation errors

**Root Cause**:
The frontend is referencing image files that don't exist or are empty.

**Solutions**:
1. Update index.html to reference existing icon files:
   ```html
   <link rel="icon" href="%PUBLIC_URL%/favicon.ico" />
   <link rel="apple-touch-icon" href="%PUBLIC_URL%/favicon.ico" />
   ```

2. Update manifest.json to only include existing icon files:
   ```json
   {
     "icons": [
       {
         "src": "favicon.ico",
         "sizes": "64x64 32x32 24x24 16x16",
         "type": "image/x-icon"
       }
     ]
   }
   ```

3. Remove references to non-existent image files

### 5. Database Connection Issues

**Symptoms**:
- "Unable to connect to the database" error
- Application crashes on startup
- Timeout errors

**Solutions**:
1. Verify database credentials in `.env` file
2. Ensure the database server is running
3. Check if the database is accessible from the deployment environment
4. Verify firewall settings allow connections on the database port

**Test database connection locally**:
```bash
cd backend
node testDatabaseConnection.js
```

### 6. Environment Variables Not Set

**Symptoms**:
- "process.env.VARIABLE is undefined" errors
- Application behaves differently in production vs development
- Authentication failures

**Solutions**:
1. Ensure all required environment variables are set in the deployment platform
2. Check that variable names match exactly (case-sensitive)
3. Verify no typos in variable names

### 7. Port Configuration Issues

**Symptoms**:
- "Port already in use" errors
- Application not accessible
- Deployment platform timeout

**Solutions**:
1. Use `process.env.PORT` for the port number in server.js
2. Ensure the port is correctly configured in the deployment platform

### 8. Build Failures

**Symptoms**:
- Deployment fails during build step
- "Module not found" errors
- "Command failed" errors

**Solutions**:
1. Check that all dependencies are listed in package.json
2. Verify build commands are correct
3. Ensure node version is compatible

## Platform-Specific Issues

### Render

1. **Check logs**: In Render dashboard, go to your service > Logs
2. **Environment variables**: Make sure they are set in the Render dashboard, not just in .env file
3. **Build cache**: Try clearing build cache if you've made dependency changes

### Heroku

1. **Check logs**: `heroku logs --tail --app your-app-name`
2. **Environment variables**: Set using `heroku config:set VARIABLE=value`
3. **Database**: Consider using Heroku Postgres add-on

### Netlify

1. **Check deploy logs**: In Netlify dashboard, go to your site > Deploys
2. **Environment variables**: Set in the "Environment variables" section
3. **Redirects**: Make sure netlify.toml is correctly configured

## Testing Your Fix

1. **Test locally with production-like settings**:
   ```bash
   # In backend directory
   npm start
   
   # In frontend directory
   npm start
   ```

2. **Test build process**:
   ```bash
   # In frontend directory
   npm run build
   ```

3. **Test database connection**:
   ```bash
   # In backend directory
   node testDatabaseConnection.js
   ```

4. **Test JWT configuration**:
   ```bash
   # In backend directory
   npm run test-jwt
   npm run test-jwt-token
   ```

## Common Fixes

### 1. Update package.json scripts

Make sure your backend package.json has:
```json
{
  "scripts": {
    "start": "node src/server.js",
    "dev": "nodemon src/server.js",
    "test-jwt": "node testJwtSecret.js",
    "test-jwt-token": "node testJwtToken.js"
  }
}
```

### 2. Proper environment variable loading

In server.js:
```javascript
require("dotenv").config({ path: require('path').join(__dirname, '../.env') });
```

### 3. Correct database configuration

In sequelize.js:
```javascript
const sequelize = new Sequelize(
  process.env.DB_NAME || "movie",
  process.env.DB_USER || "root",
  process.env.DB_PASSWORD || "ruslanbek777", {
  host: process.env.DB_HOST || "127.0.0.1",
  port: process.env.DB_PORT || 3306,
  dialect: process.env.DB_DIALECT || "mysql",
  logging: false,
});
```

### 4. Proper CORS configuration

In server.js:
```javascript
const corsOptions = {
  origin: process.env.FRONTEND_URL || "http://localhost:3000",
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
```

## If You're Still Having Issues

1. Share the exact error message you're seeing
2. Include logs from your deployment platform
3. Specify which platform you're deploying to (Render, Heroku, Netlify, etc.)
4. Mention what steps you've already tried