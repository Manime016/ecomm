import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import {
  createProduct,
  getAllProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  saveRecentSearch
} from "../controller/productController.js";

const router = express.Router();

/* ================= ENSURE UPLOADS FOLDER EXISTS ================= */
const uploadDir = "uploads";
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

/* ================= MULTER DISK STORAGE ================= */
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  }
});

const upload = multer({ storage });

/* ================= PUBLIC ================= */

router.get("/", getAllProducts);
router.get("/:id", getProductById);

router.post("/", upload.single("image"), createProduct);
router.put("/:id", upload.single("image"), updateProduct);

router.delete("/:id", deleteProduct);

router.post("/recent-search", saveRecentSearch);

export default router;