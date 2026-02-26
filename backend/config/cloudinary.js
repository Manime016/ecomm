import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.726791459125595,
  api_secret: process.env.L07s9MjP86_MYxajA8wWuE8U6tU,
});

export default cloudinary;