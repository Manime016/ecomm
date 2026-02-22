import express from "express";
import { applyCoupon, getCoupons } from "../controller/couponController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", protect, getCoupons);
router.post("/apply", protect, applyCoupon);

export default router;
