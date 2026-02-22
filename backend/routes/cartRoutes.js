import express from "express";
import {
  getCart,
  addToCart,
  updateCartQuantity,
  removeFromCart
} from "../controller/cartController.js";

import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", protect, getCart);
router.post("/add", protect, addToCart);
router.put("/update", protect, updateCartQuantity);
router.delete("/remove", protect, removeFromCart);

export default router;
