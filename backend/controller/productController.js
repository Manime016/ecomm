import Product from "../models/product.js";
import fs from "fs";
import asyncHandler from "../utils/asyncHandler.js";

/* ================= CREATE ================= */
export const createProduct = asyncHandler(async (req, res) => {
  const { name, price, category, description, stock } = req.body;

  const product = await Product.create({
    name,
    price,
    category,
    description,
    stock,
    image: req.file
      ? `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`
      : null,
  });

  res.status(201).json(product);
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
export const updateProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    res.status(404);
    throw new Error("Product not found");
  }

  if (req.file) {
    if (product.image) {
      const imagePath = product.image.split("/uploads/")[1];
      if (imagePath) {
        fs.unlink(`uploads/${imagePath}`, () => {});
      }
    }

    product.image = `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`;
  }

  product.name = req.body.name || product.name;
  product.price = req.body.price || product.price;
  product.category = req.body.category || product.category;
  product.description = req.body.description || product.description;
  product.stock = req.body.stock ?? product.stock;

  const updatedProduct = await product.save();
  res.json(updatedProduct);
});

/* ================= DELETE ================= */
export const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    res.status(404);
    throw new Error("Product not found");
  }

  if (product.image) {
    const imagePath = product.image.split("/uploads/")[1];
    if (imagePath) {
      fs.unlink(`uploads/${imagePath}`, () => {});
    }
  }

  await product.deleteOne();
  res.json({ message: "Product deleted successfully" });
});

/* ================= SAVE RECENT SEARCH ================= */
export const saveRecentSearch = asyncHandler(async (req, res) => {
  const { query } = req.body;
  const user = req.user;

  user.recentSearches = user.recentSearches.filter(
    (item) => item !== query
  );

  user.recentSearches.unshift(query);
  user.recentSearches = user.recentSearches.slice(0, 5);

  await user.save();
  res.json(user.recentSearches);
});