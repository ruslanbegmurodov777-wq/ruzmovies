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

// ✅ 404 handler
app.use((req, res) => {
  res.status(404).json({ message: "Endpoint not found" });
});

// ✅ Error handler
app.use(errorHandler);

export default app;