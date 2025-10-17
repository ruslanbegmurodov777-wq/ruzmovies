import express from "express";
import multer from "multer";
import {
  getUsers,
  removeUser,
  getVideos,
  removeVideo,
  addVideo,
  updateVideo,
} from "../controllers/admin.js";
import { admin, protect } from "../middlewares/auth.js";

// Configure multer for video file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 500 * 1024 * 1024, // 500MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept video files only
    if (file.mimetype.startsWith("video/")) {
      cb(null, true);
    } else {
      cb(new Error("Only video files are allowed!"), false);
    }
  },
});

const router = express.Router();

router.route("/users").get(protect, admin, getUsers);
router.route("/videos").get(protect, admin, getVideos);
router
  .route("/videos")
  .post(protect, admin, upload.single("videoFile"), addVideo);
router.route("/users/:username").delete(protect, admin, removeUser);
router.route("/videos/:id").delete(protect, admin, removeVideo);
router.route("/videos/:id").put(protect, admin, updateVideo);

export default router;