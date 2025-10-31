import express from "express";
import cors from "cors";
import compression from "compression";

import auth from "./routes/auth.js";
import admin from "./routes/admin.js";
import video from "./routes/video.js";
import user from "./routes/user.js";
import categories from "./routes/categories.js";
import errorHandler from "./middlewares/errorHandler.js";

// Import sequelize and models
import { sequelize, User, Video, VideoLike, Comment, Subscription, View } from "./sequelize.js";

const app = express();

// Trust reverse proxy (Render/Netlify/Heroku) for correct IP & compression
app.set("trust proxy", 1);
// Remove fingerprint header
app.disable("x-powered-by");
// Enable strong ETags for efficient conditional GETs
app.set("etag", "strong");

// CORS — enable only in development; production is same-origin
if (process.env.NODE_ENV !== 'production') {
  app.use(cors());
}
// Enable gzip/deflate (brotli typically handled by proxy)
app.use(compression());
// JSON/body parse with sane limits
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Health check (root) — only in development so SPA can own '/' in production
if (process.env.NODE_ENV !== 'production') {
  app.get("/", (req, res) => {
    res.json({ message: " RuzMovie backend is running successfully!" });
  });
}

// API routes
app.use("/api/v1/auth", auth);
app.use("/api/v1/admin", admin);
app.use("/api/v1/videos", video);
app.use("/api/v1/users", user);
app.use("/api/v1/categories", categories);

// Health check
app.get("/api/health", (req, res) => {
  res.status(200).json({ 
    status: "OK", 
    message: "Server is running",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Fallback placeholder image (works even if no file exists on disk)
app.get('/placeholder-thumbnail.jpg', (req, res) => {
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
  <svg xmlns="http://www.w3.org/2000/svg" width="800" height="450" viewBox="0 0 800 450">
    <defs>
      <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#1e293b"/>
        <stop offset="100%" stop-color="#334155"/>
      </linearGradient>
    </defs>
    <rect width="800" height="450" fill="url(#g)"/>
    <g fill="#e2e8f0" font-family="Inter,Segoe UI,Arial" text-anchor="middle">
      <text x="400" y="230" font-size="36" font-weight="700">Ruzmovie</text>
      <text x="400" y="270" font-size="18" opacity="0.8">No thumbnail</text>
    </g>
  </svg>`;
  res.type('image/svg+xml').send(svg);
});

// Serve frontend assets with long-term cache headers
app.use(express.static('public', {
  maxAge: '1y',
  setHeaders: (res, path) => {
    if (path.endsWith('.html')) {
      res.setHeader('Cache-Control', 'public, max-age=0');
    } else {
      res.setHeader('Cache-Control', 'public, max-age=31536000');
    }
  }
}));

// Error handler
app.use(errorHandler);

export default app;