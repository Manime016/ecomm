import User from "../models/user.js";
import bcrypt from "bcryptjs";
import asyncHandler from "../utils/asyncHandler.js";

/* ================= GET PROFILE ================= */
export const getProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select("-password");
  res.json(user);
});

/* ================= SEND OTP ================= */
export const sendOtp = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  // 🔐 Resend limit
  if (user.otpAttempts >= 3) {
    res.status(400);
    throw new Error("Maximum OTP attempts reached");
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  user.emailOtp = otp;
  user.emailOtpExpire = Date.now() + 5 * 60 * 1000; // 5 min
  user.otpAttempts += 1;

  await user.save();

  // ⚠ For testing (remove in production)
  res.json({
    message: "OTP generated",
    otp,
  });
});

/* ================= UPDATE PROFILE ================= */
export const updateProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  const { name, email, otp, oldPassword, newPassword } = req.body;

  // ✅ Update name
  if (name) {
    user.name = name;
  }

  // ✅ Email change with OTP verification
  if (email && email !== user.email) {
    if (!otp) {
      res.status(400);
      throw new Error("OTP required to change email");
    }

    if (
      user.emailOtp !== otp ||
      !user.emailOtpExpire ||
      user.emailOtpExpire < Date.now()
    ) {
      res.status(400);
      throw new Error("Invalid or expired OTP");
    }

    user.email = email;

    // Reset OTP data
    user.emailOtp = undefined;
    user.emailOtpExpire = undefined;
    user.otpAttempts = 0;
  }

  // ✅ Password change
  if (oldPassword && newPassword) {
    const match = await bcrypt.compare(oldPassword, user.password);

    if (!match) {
      res.status(400);
      throw new Error("Old password incorrect");
    }

    user.password = await bcrypt.hash(newPassword, 10);
  }

  await user.save();

  res.json({
    message: "Profile updated successfully",
    name: user.name,
    email: user.email,
  });
});