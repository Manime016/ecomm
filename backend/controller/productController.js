import Product from "../models/product.js";
import asyncHandler from "../utils/asyncHandler.js";

/* ================= CREATE ================= */
export const createProduct = asyncHandler(async (req, res) => {
  res.json({ message: "Create route OK" });
});

/* ================= GET ALL ================= */
export const getAllProducts = asyncHandler(async (req, res) => {
  const products = await Product.find().sort({ createdAt: -1 });
  res.json(products);
});

/* ================= GET BY ID ================= */
export const getProductById = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    res.status(404);
    throw new Error("Product not found");
  }

  res.json(product);
});

/* ================= UPDATE ================= */
export const updateProduct = async (req, res) => {
  console.log("UPDATE CONTROLLER REACHED");
  return res.json({ message: "Update route working" });
};

/* ================= DELETE ================= */
export const deleteProduct = asyncHandler(async (req, res) => {
  res.json({ message: "Delete route OK" });
});

/* ================= SAVE RECENT SEARCH ================= */
export const saveRecentSearch = asyncHandler(async (req, res) => {
  res.json({ message: "Recent search OK" });
});