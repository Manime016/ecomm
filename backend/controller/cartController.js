import Cart from "../models/cart.js";
import Product from "../models/product.js";
import asyncHandler from "../utils/asyncHandler.js";

/* ================= GET CART ================= */
export const getCart = asyncHandler(async (req, res) => {
  const cart = await Cart.findOne({ user: req.user._id })
    .populate("items.product");

  res.json(cart || { items: [] });
});

/* ================= ADD ================= */
export const addToCart = asyncHandler(async (req, res) => {
  const { productId } = req.body;

  const product = await Product.findById(productId);
  if (!product) {
    res.status(404);
    throw new Error("Product not found");
  }

  let cart = await Cart.findOne({ user: req.user._id });

  if (!cart) {
    cart = await Cart.create({
      user: req.user._id,
      items: [],
    });
  }

  const existingItem = cart.items.find(
    (item) => item.product.toString() === productId
  );

  if (existingItem) {
    if (existingItem.quantity >= product.stock) {
      res.status(400);
      throw new Error("Stock limit reached");
    }
    existingItem.quantity += 1;
  } else {
    cart.items.push({
      product: productId,
      quantity: 1,
    });
  }

  await cart.save();
  res.json(cart);
});

/* ================= UPDATE ================= */
export const updateCartQuantity = asyncHandler(async (req, res) => {
  const { productId, quantity } = req.body;

  if (quantity < 1) {
    res.status(400);
    throw new Error("Invalid quantity");
  }

  const cart = await Cart.findOne({ user: req.user._id });
  const product = await Product.findById(productId);

  if (!cart || !product) {
    res.status(404);
    throw new Error("Cart or product not found");
  }

  if (quantity > product.stock) {
    res.status(400);
    throw new Error("Stock limit exceeded");
  }

  const item = cart.items.find(
    (item) => item.product.toString() === productId
  );

  if (!item) {
    res.status(404);
    throw new Error("Item not in cart");
  }

  item.quantity = quantity;

  await cart.save();
  res.json(cart);
});

/* ================= REMOVE ================= */
export const removeFromCart = asyncHandler(async (req, res) => {
  const { productId } = req.body;

  const cart = await Cart.findOne({ user: req.user._id });

  if (!cart) {
    res.status(404);
    throw new Error("Cart not found");
  }

  cart.items = cart.items.filter(
    (item) => item.product.toString() !== productId
  );

  await cart.save();
  res.json(cart);
});

/* ================= CLEAR ================= */
export const clearCart = asyncHandler(async (req, res) => {
  const cart = await Cart.findOne({ user: req.user._id });

  if (!cart) {
    res.status(404);
    throw new Error("Cart not found");
  }

  cart.items = [];
  await cart.save();

  res.json({ message: "Cart cleared successfully" });
});