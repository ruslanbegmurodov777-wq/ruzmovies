import express from "express";
import cors from "cors";
import compression from "compression";

import auth from "./routes/auth.js";
import admin from "./routes/admin.js";
import video from "./routes/video.js";
import user from "./routes/user.js";
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

// Health check
app.get("/api/health", (req, res) => {
  res.status(200).json({ 
    status: "OK", 
    message: "Server is running",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
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