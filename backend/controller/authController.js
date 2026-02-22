import User from "../models/user.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import asyncHandler from "../utils/asyncHandler.js";

/* ================= REGISTER ================= */
export const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    res.status(400);
    throw new Error("All fields required");
  }

  const exists = await User.findOne({ email });

  if (exists) {
    res.status(400);
    throw new Error("User already exists");
  }

  const hash = await bcrypt.hash(password, 10);

  const user = await User.create({
    name,
    email,
    password: hash,
  });

  res.status(201).json({
    message: "Registered Successfully",
    userId: user._id,
  });
});

/* ================= LOGIN ================= */
export const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });

  if (!user) {
    res.status(400);
    throw new Error("User not found");
  }

  const match = await bcrypt.compare(password, user.password);

  if (!match) {
    res.status(400);
    throw new Error("Wrong password");
  }

  const token = jwt.sign(
    { id: user._id },
    process.env.JWT_SECRET,
    { expiresIn: "1d" }
  );

  res.json({
    message: "Login Success",
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  });
});

/* ================= FORGOT PASSWORD ================= */
export const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  const user = await User.findOne({ email });

  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  const token = crypto.randomBytes(20).toString("hex");

  user.resetToken = token;
  user.resetExpire = Date.now() + 15 * 60 * 1000;

  await user.save();

  res.json({
    message: "Reset token generated",
    token,
  });
});