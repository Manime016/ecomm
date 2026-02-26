import Product from "../models/product.js";
import asyncHandler from "../utils/asyncHandler.js";

/* ================= CREATE ================= */
export const createProduct = asyncHandler(async (req, res) => {
  const { name, price, category, description, stock, image } = req.body;

  const product = await Product.create({
    name,
    price,
    category,
    description,
    stock,
    image: image || null,
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

  product.name = req.body.name ?? product.name;
  product.price = req.body.price ?? product.price;
  product.category = req.body.category ?? product.category;
  product.description = req.body.description ?? product.description;
  product.stock = req.body.stock ?? product.stock;
  product.image = req.body.image ?? product.image;

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