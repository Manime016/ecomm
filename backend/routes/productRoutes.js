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

/* ================= MULTER SETUP ================= */

const storage = multer.memoryStorage();
const upload = multer({ storage });

/* ================= PUBLIC ================= */

router.get("/", getAllProducts);
router.get("/:id", getProductById);

/* ================= ADMIN ================= */

// Create needs multer (image upload)
router.post("/", upload.single("image"), createProduct);

// Update also supports image change
router.put("/:id", upload.single("image"), updateProduct);

router.delete("/:id", deleteProduct);

/* ================= USER ================= */

router.post("/recent-search", saveRecentSearch);

export default router;