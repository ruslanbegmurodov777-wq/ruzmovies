# Environment Variables Setup

This document explains how to configure environment variables for the Ruzmovie frontend application.

## Setup Instructions

1. Create a `.env` file in the `frontend/` directory
2. Add the following environment variable:

```
REACT_APP_API_URL=https://ruzmovie-backend.onrender.com
```

## Usage in Code

The environment variable can be accessed in your React components and utility functions like this:

```javascript
const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
```

## API Utility Functions

We've created utility functions in `src/utils/api.js` that automatically use the environment variable:

```javascript
import { fetchVideos, fetchVideo, searchVideos } from '../utils/api';

// Fetch all videos
const videos = await fetchVideos();

// Fetch a single video by ID
const video = await fetchVideo('video-id');

// Search videos by term
const results = await searchVideos('search-term');
```

## Benefits

1. **Flexibility**: Easily switch between development and production API endpoints
2. **Security**: Keep configuration separate from code
3. **Consistency**: Centralized API configuration across the application
4. **Maintainability**: Single source of truth for API URLs