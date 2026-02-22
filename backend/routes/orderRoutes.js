import express from "express";
import {
  createOrder,
  getUserOrders,
  getSingleOrder,
  cancelOrder,
  updateOrderStatus,
  createRazorpayOrder,
  verifyRazorpayPayment,
} from "../controller/orderController.js";

import { protect } from "../middleware/authMiddleware.js";
import isAdmin from "../middleware/adminMiddleware.js";

const router = express.Router();

/* ===== RAZORPAY ROUTES ===== */
router.post("/razorpay", protect, createRazorpayOrder);
router.post("/verify", protect, verifyRazorpayPayment);

/* ===== USER ROUTES ===== */
router.post("/", protect, createOrder);
router.get("/", protect, getUserOrders);
router.get("/:id", protect, getSingleOrder);
router.put("/:id/cancel", protect, cancelOrder);

/* ===== ADMIN ===== */
router.put("/:id/status", protect, isAdmin, updateOrderStatus);

export default router;