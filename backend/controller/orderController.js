import Order from "../models/order.js";
import Product from "../models/product.js";
import Cart from "../models/cart.js";
import Coupon from "../models/Coupon.js";
import razorpay from "../config/razorpay.js";
import crypto from "crypto";
import asyncHandler from "../utils/asyncHandler.js";

/* ================= RAZORPAY CREATE ================= */
export const createRazorpayOrder = asyncHandler(async (req, res) => {
  const { amount } = req.body;

  if (!amount) {
    res.status(400);
    throw new Error("Amount required");
  }

  const options = {
    amount: amount * 100,
    currency: "INR",
    receipt: "receipt_" + Date.now(),
  };

  const order = await razorpay.orders.create(options);

  res.json(order);
});

/* ================= RAZORPAY VERIFY ================= */
export const verifyRazorpayPayment = asyncHandler(async (req, res) => {
  const {
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
  } = req.body;

  const body = razorpay_order_id + "|" + razorpay_payment_id;

  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(body)
    .digest("hex");

  if (expectedSignature !== razorpay_signature) {
    res.status(400);
    throw new Error("Invalid payment signature");
  }

  res.json({ success: true });
});

/* ================= CREATE ORDER ================= */
export const createOrder = asyncHandler(async (req, res) => {
  const {
    items,
    subtotal,
    discount,
    deliveryCharge,
    totalAmount,
    couponUsed,
    paymentMethod,
    address,
  } = req.body;

  if (!req.user || !req.user._id) {
    res.status(401);
    throw new Error("User not authenticated");
  }

  if (!items || items.length === 0) {
    res.status(400);
    throw new Error("Cart is empty");
  }

  const normalizedItems = [];

  for (let item of items) {
    const productId =
      typeof item.product === "object"
        ? item.product._id
        : item.product;

    const product = await Product.findById(productId);

    if (!product) {
      res.status(404);
      throw new Error("Product not found");
    }

    if (product.stock < item.quantity) {
      res.status(400);
      throw new Error(`${product.name} is out of stock`);
    }

    product.stock -= item.quantity;
    await product.save();

    normalizedItems.push({
      product: product._id,
      quantity: item.quantity,
    });
  }

  let formattedAddress = address;

  if (typeof address === "object") {
    formattedAddress = `
${address.houseNumber || ""}
${address.locality || ""}
${address.landmark || ""}
${address.district || ""}
${address.state || ""}
- ${address.pincode || ""}
    `.trim();
  }

  const newOrder = await Order.create({
    user: req.user._id,
    items: normalizedItems,
    subtotal,
    discount,
    deliveryCharge,
    totalAmount,
    couponUsed,
    paymentMethod,
    address: formattedAddress,
    orderStatus: "Processing",
  });

  await Cart.findOneAndUpdate(
    { user: req.user._id },
    { items: [] }
  );

  res.status(201).json(newOrder);
});

/* ================= GET USER ORDERS ================= */
export const getUserOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({ user: req.user._id })
    .populate("items.product")
    .sort({ createdAt: -1 });

  res.json(orders);
});

/* ================= GET SINGLE ORDER ================= */
export const getSingleOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id)
    .populate("items.product");

  if (!order) {
    res.status(404);
    throw new Error("Order not found");
  }

  if (order.user.toString() !== req.user._id.toString()) {
    res.status(401);
    throw new Error("Not authorized");
  }

  res.json(order);
});

/* ================= CANCEL ORDER ================= */
export const cancelOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);

  if (!order) {
    res.status(404);
    throw new Error("Order not found");
  }

  if (order.user.toString() !== req.user._id.toString()) {
    res.status(401);
    throw new Error("Not authorized");
  }

  if (
    ["Shipped", "Out for Delivery", "Delivered"].includes(
      order.orderStatus
    )
  ) {
    res.status(400);
    throw new Error("Order cannot be cancelled now");
  }

  order.orderStatus = "Cancelled";
  await order.save();

  res.json({ message: "Order cancelled successfully" });
});

/* ================= UPDATE STATUS ================= */
export const updateOrderStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;

  const order = await Order.findById(req.params.id);

  if (!order) {
    res.status(404);
    throw new Error("Order not found");
  }

  order.orderStatus = status;
  await order.save();

  res.json({ message: "Order status updated" });
});