import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    password: {
      type: String,
      required: true,
    },

    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },

    resetToken: String,
    resetExpire: Date,

    // 🔐 OTP FIELDS
    emailOtp: String,
    emailOtpExpire: Date,
    otpAttempts: {
      type: Number,
      default: 0,
    },

    recentSearches: {
      type: [String],
      default: [],
    },
  },
  { timestamps: true }
);

userSchema.index({ email: 1 });

export default mongoose.model("User", userSchema);