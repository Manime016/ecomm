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

// CREATE still uses multer
router.post("/", upload.single("image"), createProduct);

// UPDATE does NOT use multer (for debugging)
router.put("/:id", updateProduct);

router.delete("/:id", deleteProduct);

/* ================= USER ================= */

router.post("/recent-search", saveRecentSearch);

export default router;