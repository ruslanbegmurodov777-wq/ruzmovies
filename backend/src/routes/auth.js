import express from "express";
import { login, signup, me } from "../controllers/auth.js";
import { protect } from "../middlewares/auth.js";

const router = express.Router();

router.route("/signup").post(signup);
router.route("/login").post(login);
router.route("/me").get(protect, me);

export default router;