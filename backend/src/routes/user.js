import express from "express";
import {
  toggleSubscribe,
  getFeed,
  editUser,
  searchUser,
  getProfile,
  recommendChannels,
  getLikedVideos,
  getHistory,
} from "../controllers/user.js";
import { protect } from "../middlewares/auth.js";

const router = express.Router();

router.route("/").put(protect, editUser);
router.route("/").get(protect, recommendChannels);
router.route("/likedVideos").get(protect, getLikedVideos);
router.route("/history").get(protect, getHistory);
router.route("/feed").get(protect, getFeed);
router.route("/search").get(protect, searchUser);
router.route("/:id").get(protect, getProfile);
router.route("/:id/togglesubscribe").get(protect, toggleSubscribe);

export default router;