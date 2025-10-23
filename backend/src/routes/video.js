import express from "express";
import multer from "multer";
import { recommendedVideos } from "../controllers/user.js";
import { protect, admin, optionalAuth } from "../middlewares/auth.js";

import {
  newVideo,
  getVideo,
  likeVideo,
  dislikeVideo,
  addComment,
  newView,
  searchVideo,
  getVideoFile,
  getThumbnailFile,
} from "../controllers/video.js";

// Configure multer for handling both video and thumbnail file uploads
const upload = multer();

const router = express.Router();

// Optional pagination middleware (limit/offset) — consumed by controllers if supported
router.use((req, _res, next) => {
  const limit = Math.min(parseInt(req.query.limit, 10) || 12, 50);
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const offset = (page - 1) * limit;
  req.pagination = { limit, offset, page };
  next();
});

router.route("/").post(
  protect,
  // Faqat foydalanuvchi autentifikatsiya qilingan bo'lsa yetarli
  upload.fields([
    { name: "videoFile", maxCount: 1 },
    { name: "thumbnailFile", maxCount: 1 },
  ]),
  newVideo
);
router.route("/").get(recommendedVideos);
router.route("/search").get(optionalAuth, searchVideo);
router.route("/:id").get(optionalAuth, getVideo);

// Cache static-like assets aggressively
const setAssetCache = (_req, res, next) => {
  res.set("Cache-Control", "public, max-age=31536000, immutable");
  next();
};

router.route("/:id/file").get(setAssetCache, getVideoFile); // New route for serving video files
router.route("/:id/thumbnail").get(setAssetCache, getThumbnailFile); // New route for serving thumbnail files

router.route("/:id/like").get(protect, likeVideo);
router.route("/:id/dislike").get(protect, dislikeVideo);
router.route("/:id/comment").post(protect, addComment);
router.route("/:id/view").get(optionalAuth, newView);

export default router;