import fs from "fs";
import path from "path";
import mongoose from "mongoose";
import dotenv from "dotenv";
import Product from "./models/product.js";

dotenv.config();

await mongoose.connect(process.env.MONGO_URI);

const uploadsPath = path.join("uploads");

const products = await Product.find();

const usedImages = products.map((p) => {
  if (!p.image) return null;
  return p.image.split("/uploads/")[1];
}).filter(Boolean);

const files = fs.readdirSync(uploadsPath);

let deleted = 0;

for (const file of files) {
  if (!usedImages.includes(file)) {
    fs.unlinkSync(path.join(uploadsPath, file));
    deleted++;
    console.log("Deleted:", file);
  }
}

console.log("Cleanup complete. Deleted:", deleted);
process.exit();