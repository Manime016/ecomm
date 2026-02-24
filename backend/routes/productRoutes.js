import express from "express";
import multer from "multer";
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

// Create product (UNPROTECTED)
router.post(
  "/",
  upload.single("image"),
  createProduct
);

// Update product (UNPROTECTED)
router.put(
  "/:id",
  upload.single("image"),
  updateProduct
);

// Delete product (UNPROTECTED)
router.delete(
  "/:id",
  deleteProduct
);

/* ================= USER ================= */

// Save recent search (still protected if you want — remove if needed)
router.post("/recent-search", saveRecentSearch);

export default router;