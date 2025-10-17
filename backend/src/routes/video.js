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
router.route("/:id/file").get(getVideoFile); // New route for serving video files
router.route("/:id/thumbnail").get(getThumbnailFile); // New route for serving thumbnail files
router.route("/:id/like").get(protect, likeVideo);
router.route("/:id/dislike").get(protect, dislikeVideo);
router.route("/:id/comment").post(protect, addComment);
router.route("/:id/view").get(optionalAuth, newView);

export default router;