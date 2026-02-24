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

// Get product by ID  ← THIS FIXES YOUR ERROR
router.get("/:id", getProductById);

// Create product
router.post(
  "/",
  upload.single("image"),
  createProduct
);

// Update product
router.put(
  "/:id",
  upload.single("image"),
  updateProduct
);

// Delete product
router.delete("/:id", deleteProduct);

/* ================= USER ================= */

router.post("/recent-search", saveRecentSearch);

export default router;