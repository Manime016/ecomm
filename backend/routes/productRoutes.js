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

const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 } // 2MB safety limit
});

/* ================= PUBLIC ================= */

router.get("/", getAllProducts);
router.get("/:id", getProductById);

/* ================= ADMIN ================= */

router.post("/", upload.single("image"), createProduct);
router.put("/:id", upload.single("image"), updateProduct);
router.delete("/:id", deleteProduct);

/* ================= USER ================= */

router.post("/recent-search", saveRecentSearch);

export default router;