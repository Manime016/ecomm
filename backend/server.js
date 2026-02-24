// 🔥 LOAD ENV FIRST (ABSOLUTE TOP)
import dotenv from "dotenv";
dotenv.config({ path: "./.env" });

// THEN other imports
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
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

/* ================= SECURITY ================= */
app.use(
  helmet({
    crossOriginResourcePolicy: false,
    crossOriginEmbedderPolicy: false,
  })
);

/* ================= CORS FIX ================= */
app.use(
  cors({
    origin: [
      "https://ecomm-kz0cbs634-manime016s-projects.vercel.app",
    ],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true,
  })
);

// Handle preflight requests
app.options("*", cors());

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

/* ================= STATIC FILES ================= */
app.use("/uploads", express.static("uploads"));

/* ================= HEALTH CHECK ================= */
app.get("/", (req, res) => {
  res.send("API Running...");
});

/* ================= ERROR HANDLING ================= */
app.use(notFound);
app.use(errorHandler);

/* ================= SERVER ================= */
const PORT = process.env.PORT || 5000;

app.listen(PORT, () =>
  console.log(`Server running on port ${PORT}`)
);