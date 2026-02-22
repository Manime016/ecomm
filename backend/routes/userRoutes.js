import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
  getProfile,
  updateProfile,
  sendOtp,
} from "../controller/userController.js";

const router = express.Router();

router.get("/profile", protect, getProfile);
router.post("/send-otp", protect, sendOtp);
router.put("/update-profile", protect, updateProfile);

export default router;