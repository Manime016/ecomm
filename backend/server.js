import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { fileURLToPath } from "url";
import path from "path";

import connectDB from "./config/db.js";

import authRoutes from "./routes/authRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import cartRoutes from "./routes/cartRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import couponRoutes from "./routes/couponRoutes.js";
import userRoutes from "./routes/userRoutes.js";

import { notFound, errorHandler } from "./middleware/errorMiddleware.js";

connectDB();

const app = express();

app.set("trust proxy", 1);

/* ================= PATH SETUP ================= */
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/* ================= SECURITY ================= */
app.use(
  helmet({
    crossOriginResourcePolicy: false,
    crossOriginEmbedderPolicy: false,
  })
);

/* ================= CORS FIX (🔥 IMPORTANT) ================= */
app.use(
  cors({
    origin: "*", // ✅ FIXED: allow mobile + web
    credentials: true,
  })
);

/* ================= BODY PARSER ================= */
app.use(express.json());

/* ================= LOGGER ================= */
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

/* ================= ROUTES ================= */
app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/coupons", couponRoutes);
app.use("/api/users", userRoutes);

/* ================= ROOT ================= */
app.get("/", (req, res) => {
  res.status(200).send("API Running...");
});

/* ================= ERROR HANDLING ================= */
app.use(notFound);
app.use(errorHandler);

/* ================= SERVER ================= */
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});