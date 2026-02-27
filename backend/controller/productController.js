import Product from "../models/product.js";
import asyncHandler from "../utils/asyncHandler.js";

/* ================= CREATE ================= */
export const createProduct = asyncHandler(async (req, res) => {
  try {
    const { name, price, category, description, stock } = req.body;

    let imageUrl = null;

    if (req.file) {
      imageUrl = `/uploads/${req.file.filename}`;
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
  } catch (error) {
    console.error("CREATE ERROR:", error);
    res.status(500).json({ message: error.message });
  }
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
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // JUST TEST FILE ARRIVAL
    console.log("REQ FILE:", req.file);

    // Fake image update
    if (req.file) {
      product.image = "https://via.placeholder.com/300x300?text=Updated";
    }

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

    const updatedProduct = await product.save();

    res.json(updatedProduct);

  } catch (error) {
    console.error("UPDATE ERROR:", error);
    res.status(500).json({ message: error.message });
  }
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