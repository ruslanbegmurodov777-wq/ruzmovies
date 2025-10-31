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
  toggleAdmin,
} from "../controllers/user.js";
import { protect, owner } from "../middlewares/auth.js";

const router = express.Router();

router.route("/").put(protect, editUser);
router.route("/").get(protect, recommendChannels);
router.route("/likedVideos").get(protect, getLikedVideos);
router.route("/history").get(protect, getHistory);
router.route("/feed").get(protect, getFeed);
router.route("/search").get(protect, searchUser);
router.route("/:id").get(protect, getProfile);
router.route("/:id/togglesubscribe").get(protect, toggleSubscribe);
router.route("/:userId/toggle-admin").post(protect, owner, toggleAdmin);

export default router;