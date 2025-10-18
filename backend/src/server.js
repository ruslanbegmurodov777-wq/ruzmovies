import express from "express";
import cors from "cors";
import path from "path";
import dotenv from "dotenv";
import { fileURLToPath } from "url";

// Get __dirname equivalent in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from the backend root directory
dotenv.config({ path: path.resolve(__dirname, '../.env') });

import auth from "./routes/auth.js";
import admin from "./routes/admin.js";
import video from "./routes/video.js";
import user from "./routes/user.js";
import errorHandler from "./middlewares/errorHandler.js";

// Import sequelize and models
import { sequelize, User, Video, VideoLike, Comment, Subscription, View } from "./sequelize.js";

const app = express();

// ✅ CORS — Allow multiple frontend origins
const allowedOrigins = [
  "http://localhost:3000", // Local development
  "http://localhost:8888", // Netlify dev
  "https://ruzmovies.netlify.app", // Production Netlify site
  process.env.FRONTEND_URL, // Your Netlify site from env
];

// Add the Render backend URL to allowed origins
if (process.env.RENDER_BACKEND_URL) {
  allowedOrigins.push(process.env.RENDER_BACKEND_URL);
}

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
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
app.use(express.json({ limit: "10mb" }));

// ✅ Health check
app.get("/", (req, res) => {
  res.json({ message: "🎬 RuzMovie backend is running successfully!" });
});

// ✅ API routes
app.use("/api/v1/auth", auth);
app.use("/api/v1/admin", admin);
app.use("/api/v1/videos", video);
app.use("/api/v1/users", user);

// ✅ Health check
app.get("/api/health", (req, res) => {
  res.status(200).json({ 
    status: "OK", 
    message: "Server is running",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// ✅ Serve static files in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../../frontend/build')));
  
  // Handle React routing, return all non-API routes to React app
  // Fixed Express 5 path pattern issue - using app.use() instead of app.get() with wildcard patterns
  app.use((req, res) => {
    if (!req.path.startsWith('/api')) {
      res.sendFile(path.join(__dirname, '../../frontend/build/index.html'));
    }
  });
}

// ✅ 404 handler
app.use((req, res) => {
  res.status(404).json({ message: "Endpoint not found" });
});

// ✅ Error handler
app.use(errorHandler);

// ✅ Serverni ishga tushurish
const PORT = process.env.PORT || 5000;

// Start server - removed the condition that was preventing it from starting
const server = app.listen(PORT, async () => {
  console.log(`✅ Server running on port ${PORT}`);
  
  try {
    // Test database connection
    await sequelize.authenticate();
    console.log("✅ Database connection established successfully.");
    
    // Sync models
    await sequelize.sync({ force: false });
    console.log("✅ All models synchronized successfully.");
    
    console.log(`🚀 Server is ready at http://localhost:${PORT}`);
  } catch (error) {
    console.error("❌ Database connection failed:", error.message);
    process.exit(1);
  }
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.log(`Error: ${err.message}`);
  // Close server & exit process
  server.close(() => {
    process.exit(1);
  });
});

export default app;