# RuzTube - Full Stack Video Streaming Platform

RuzTube is a full-stack video streaming platform built with React, Node.js, Express, and MySQL. It allows users to stream, upload, and manage videos with user authentication and admin controls.

## Features

- User authentication (login/register) via JWT
- Video upload, playback, and management
- Admin dashboard for content moderation
- User profile management
- Video search and browsing
- Like, comment, and view tracking
- Dark mode support

## Prerequisites

- Node.js (v14 or higher)
- MySQL database
- npm or yarn package manager

## Getting Started

### 1. Clone the repository

```bash
git clone <repository-url>
cd ruzmovie
```

### 2. Install dependencies

```bash
# Install root dependencies
npm install

# Install frontend dependencies
cd frontend
npm install
cd ..

# Install backend dependencies
cd backend
npm install
cd ..
```

### 3. Configure environment variables

Create a `.env` file in the `backend` directory with the following variables:

```env
# Database Configuration
DB_HOST=127.0.0.1
DB_USER=root
DB_PASS=your_database_password
DB_NAME=movie
DB_DIALECT=mysql
DB_PORT=3306

# JWT Configuration
JWT_SECRET=your_super_secret_key_here
JWT_EXPIRE=30d

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:3000

# Server Port
PORT=5000
```

> **Important**: Make sure to use a strong, random value for `JWT_SECRET`. You can generate one using:
> ```bash
> node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
> ```

### 4. Set up the database

Follow the instructions in [DATABASE_SETUP.md](DATABASE_SETUP.md) to set up your MySQL database.

### 5. Run the application

```bash
# Start the development server
npm run dev
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

## Project Structure

```
ruzmovie/
│
├── backend/
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── middlewares/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── sequelize.js
│   │   └── server.js
│   ├── .env
│   └── package.json
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   ├── contexts/
│   │   ├── pages/
│   │   ├── utils/
│   │   ├── App.js
│   │   └── index.js
│   └── package.json
│
└── netlify/
    └── functions/
        └── api.js
```

## Available Scripts

### Root directory
- `npm run dev` - Start development server with Netlify functions
- `npm run build` - Build the frontend application

### Backend
- `npm start` - Start the backend server
- `npm run dev` - Start the backend server in development mode with nodemon
- `npm run init-db` - Initialize the database
- `npm run test-jwt` - Test JWT secret configuration
- `npm run test-jwt-token` - Test JWT token creation and verification

### Frontend
- `npm start` - Start the frontend development server
- `npm run build` - Build the frontend for production

## Deployment

For deployment instructions, see:
- [DEPLOYMENT.md](DEPLOYMENT.md) for unified deployment on Netlify
- [SEPARATED_DEPLOYMENT.md](SEPARATED_DEPLOYMENT.md) for separated frontend and backend deployment

## Troubleshooting

### JWT_SECRET Error

If you encounter the error "secretOrPrivateKey must have a value", it means the JWT_SECRET environment variable is not properly configured. Make sure:

1. You have created a `.env` file in the `backend` directory
2. The `JWT_SECRET` variable is set with a strong secret value
3. The backend server is restarted after making changes to the `.env` file

You can test your JWT configuration by running:
```bash
cd backend
npm run test-jwt
```

### Database Connection Issues

If you're having trouble connecting to the database:

1. Verify your database credentials in the `.env` file
2. Ensure your MySQL server is running
3. Check that the database exists and the user has proper permissions

### Common Issues

See [TROUBLESHOOTING.md](TROUBLESHOOTING.md) for solutions to common issues.

## License

This project is licensed under the MIT License.