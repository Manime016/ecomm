import express from "express";
import multer from "multer";
import {
  createProduct,
  getAllProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  saveRecentSearch
} from "../controller/productController.js";

const router = express.Router();

/* ================= MULTER MEMORY STORAGE ================= */
const storage = multer.memoryStorage();
const upload = multer({ storage });

/* ================= PUBLIC ================= */

// Get all products
router.get("/", getAllProducts);

// Get product by ID
router.get("/:id", getProductById);

// Create product
router.post("/", upload.single("image"), createProduct);

// Update product
router.put("/:id", upload.single("image"), updateProduct);

// Delete product
router.delete("/:id", deleteProduct);

/* ================= USER ================= */

router.post("/recent-search", saveRecentSearch);

export default router;