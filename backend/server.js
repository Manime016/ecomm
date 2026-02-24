// ================= LOAD ENV FIRST =================
import dotenv from "dotenv";
dotenv.config();

// ================= IMPORTS =================
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import path from "path";
import { fileURLToPath } from "url";

import connectDB from "./config/db.js";

import authRoutes from "./routes/authRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import cartRoutes from "./routes/cartRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import couponRoutes from "./routes/couponRoutes.js";
import userRoutes from "./routes/userRoutes.js";

import { notFound, errorHandler } from "./middleware/errorMiddleware.js";

// ================= INIT =================
connectDB();
const app = express();

// Needed for Render HTTPS proxy
app.set("trust proxy", 1);

// Fix __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ================= SECURITY =================
app.use(
  helmet({
    crossOriginResourcePolicy: false,
    crossOriginEmbedderPolicy: false,
  })
);

// ================= CORS (SMART DEV SETUP) =================
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);

      // Allow localhost
      if (origin.includes("localhost")) {
        return callback(null, true);
      }

      // Allow ALL vercel preview & production domains
      if (origin.endsWith(".vercel.app")) {
        return callback(null, true);
      }

      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);

// ================= BODY PARSER =================
app.use(express.json());

// ================= LOGGER =================
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// ================= STATIC UPLOADS =================
app.use(
  "/uploads",
  express.static(path.join(__dirname, "uploads"))
);

// ================= ROUTES =================
app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/coupons", couponRoutes);
app.use("/api/users", userRoutes);

// ================= HEALTH CHECK =================
app.get("/", (req, res) => {
  res.status(200).send("API Running...");
});

// ================= ERROR HANDLER =================
app.use(notFound);
app.use(errorHandler);

// ================= SERVER START =================
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});