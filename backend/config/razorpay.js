import dotenv from "dotenv";
dotenv.config(); // 🔥 Load env here directly

import Razorpay from "razorpay";

if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
  console.error("RAZORPAY_KEY_ID:", process.env.RAZORPAY_KEY_ID);
  console.error("RAZORPAY_KEY_SECRET:", process.env.RAZORPAY_KEY_SECRET);
  throw new Error("Razorpay keys are missing in .env file");
}

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

export default razorpay;