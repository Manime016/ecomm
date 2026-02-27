import Product from "../models/product.js";
import asyncHandler from "../utils/asyncHandler.js";
import cloudinary from "../config/cloudinary.js";

/* ================= CREATE ================= */
export const createProduct = asyncHandler(async (req, res) => {
  const { name, price, category, description, stock } = req.body;

  let imageUrl = null;

  if (req.file && req.file.buffer) {
    const uploadResult = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder: "products" },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
      stream.end(req.file.buffer);
    });

    imageUrl = uploadResult.secure_url;
  }

  const product = await Product.create({
    name,
    price: Number(price),
    category,
    description,
    stock: Number(stock),
    image: imageUrl,
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

  let imageUrl = product.image;

  // If new image uploaded
  if (req.file && req.file.buffer) {
    const uploadResult = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder: "products" },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
      stream.end(req.file.buffer);
    });

    imageUrl = uploadResult.secure_url;
  }

  // Safe updates
  if (req.body.name) product.name = req.body.name;
  if (req.body.category) product.category = req.body.category;
  if (req.body.description !== undefined)
    product.description = req.body.description;

  if (req.body.price !== undefined && req.body.price !== "") {
    product.price = Number(req.body.price);
  }

  if (req.body.stock !== undefined && req.body.stock !== "") {
    product.stock = Number(req.body.stock);
  }

  product.image = imageUrl;

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