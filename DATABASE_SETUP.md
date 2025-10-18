# Database Setup Guide for Ruzmovie

This guide explains how to set up the database for the Ruzmovie application in different environments.

## Prerequisites

1. MySQL server installed and running
2. Node.js and npm installed
3. Git repository cloned

## Local Development Setup

### 1. Install MySQL

If you don't have MySQL installed, you can:

1. Download MySQL Community Server from the official website
2. Use XAMPP/WAMP/MAMP for an all-in-one solution
3. Use Docker:
   ```bash
   docker run --name ruzmovie-mysql -e MYSQL_ROOT_PASSWORD=ruslanbek777 -e MYSQL_DATABASE=movie -p 3306:3306 -d mysql:8.0
   ```

### 2. Create Database

Create the database using MySQL client:

```sql
CREATE DATABASE movie;
```

### 3. Configure Environment Variables

Create a `.env` file in the `backend` directory with the following content:

#### .env.local (Local Development)
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

> **Note**: You can generate a stronger JWT secret by running:
> ```bash
> cd backend
> npm run generate-jwt-secret
> ```

#### .env (Production/Railway)
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