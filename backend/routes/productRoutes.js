import express from "express";
import multer from "multer";
import { protect } from "../middleware/authMiddleware.js";
import isAdmin from "../middleware/adminMiddleware.js";
import {
  createProduct,
  getAllProducts,
  updateProduct,
  deleteProduct,
  saveRecentSearch
} from "../controller/productController.js";

const router = express.Router();

// Multer Storage
const storage = multer.diskStorage({
  destination: "uploads/",
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  }
});

const upload = multer({ storage });

/* ================= PUBLIC ================= */

// Get all products
router.get("/", getAllProducts);

/* ================= ADMIN ONLY ================= */

// Create product
router.post(
  "/",
  protect,
  isAdmin,
  upload.single("image"),
  createProduct
);

// Update product
router.put(
  "/:id",
  protect,
  isAdmin,
  upload.single("image"),
  updateProduct
);

// Delete product
router.delete(
  "/:id",
  protect,
  isAdmin,
  deleteProduct
);

/* ================= USER ================= */

// Save recent search
router.post("/recent-search", protect, saveRecentSearch);

export default router;