# Database Setup Guide

## Local Development

For local development, the application uses a local MySQL database. Make sure you have MySQL installed and running on your machine.

### Environment Configuration

The application automatically loads environment variables from `.env.local` when running in development mode.

To run the application in development mode:
```bash
# Set environment to development
export NODE_ENV=development  # On Windows: $env:NODE_ENV="development"

# Start the application
npm run dev
```

### Local Database Setup

1. Install MySQL on your local machine
2. Create a database named `movie`
3. Create a user with username `root` and password `ruslanbek777`
4. Grant all privileges to the user on the `movie` database

Alternatively, you can modify the `.env.local` file with your own database credentials.

## Railway Deployment

For Railway deployment, the application uses the Railway-provided MySQL database.

### Environment Configuration

The application automatically loads environment variables from `.env` when running in production mode.

To run the application in production mode:
```bash
# Set environment to production
export NODE_ENV=production  # On Windows: $env:NODE_ENV="production"

# Start the application
npm start
```

### Railway Database Troubleshooting

If you're getting a "connect ETIMEDOUT" error when trying to connect to the Railway database, try these steps:

1. **Check if the database is online**: 
   - Go to your Railway project dashboard
   - Check if the MySQL database is in a "Running" state

2. **Verify credentials**:
   - Double-check the credentials in your `.env` file
   - Make sure they match what Railway provides

3. **Network connectivity**:
   - Some networks may block connections to external databases
   - Try connecting from a different network

4. **Firewall settings**:
   - Check if your firewall is blocking outgoing connections on port 3306

5. **Temporary local development**:
   - If you need to work on the application immediately, switch to local development mode
   - Set `NODE_ENV=development` to use your local database

## Environment Files

### .env.local (Local Development)
```env
# Database Configuration for Local Development
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASS=ruslanbek777
DB_NAME=movie
DB_DIALECT=mysql

# JWT Secret
JWT_SECRET=mySuperSecretKey2025!

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:3000

# Server Port
PORT=5000
```

### .env (Production/Railway)
```env
# Database Configuration for Railway
DB_HOST=containers-us-west-123.railway.app
DB_PORT=3306
DB_USER=root
DB_PASS=uiAYlmNHzlcIdtbkcRnobyGXhpYaZxWI
DB_NAME=railway
DB_DIALECT=mysql

# JWT Secret
JWT_SECRET=your-super-secret-jwt-key

# Frontend URL (for CORS)
FRONTEND_URL=https://your-site-name.netlify.app

# Server Port
PORT=5000
```

## Testing Database Connection

You can test the database connection using the provided test script:

```bash
# Test local database connection
$env:NODE_ENV="development"; node test-db-connection.js

# Test Railway database connection
$env:NODE_ENV="production"; node test-db-connection.js
```

## Seeding the Database

To populate the database with initial data:

```bash
node backend/src/seedDatabase.js
```

This will create the admin user and some sample videos.