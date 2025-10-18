
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
- Server fails to start
- Application crashes on startup

**Root Cause**:
In Express 5, the `*` pattern in route definitions needs to be prefixed with `/` to work correctly.

**Solutions**:
1. Change `app.get('*', ...)` to `app.get('/*', ...)` in server.js
2. Or use `app.use((req, res) => { ... })` for a more robust solution

Example fix:
```javascript
// ❌ Incorrect (Express 5 incompatible)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend', 'build', 'index.html'));
});

// ✅ Correct (Express 5 compatible)
app.get('/*', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend', 'build', 'index.html'));
});
```

### 3. Database Connection Issues

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

### 4. Environment Variables Not Set

**Symptoms**:
- "process.env.VARIABLE is undefined" errors
- Application behaves differently in production vs development
- Authentication failures

**Solutions**:
1. Ensure all required environment variables are set in the deployment platform
2. Check that variable names match exactly (case-sensitive)
3. Verify no typos in variable names

### 5. Port Configuration Issues

**Symptoms**:
- "Port already in use" errors
- Application not accessible
- Deployment platform timeout

**Solutions**:
1. Use `process.env.PORT` for the port number in server.js
2. Ensure the port is correctly configured in the deployment platform

### 6. CORS Errors

**Symptoms**:
- Frontend can't make API requests to backend
- "Blocked by CORS policy" errors in browser console

**Solutions**:
1. Configure CORS properly in server.js
2. Ensure the frontend URL is in the allowed origins list
3. Set the correct FRONTEND_URL environment variable

### 7. Build Failures

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