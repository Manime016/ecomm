// Base URL from environment variable
const BASE_URL = import.meta.env.VITE_API_URL;

/*
  IMPORTANT:
  - In local development → .env must contain:
      VITE_API_URL=http://localhost:5000

  - In Vercel → Add Environment Variable:
      VITE_API_URL=https://your-backend-name.onrender.com
*/

// ================= AUTH =================
export const AUTH_API = `${BASE_URL}/api/auth`;

// ================= PRODUCTS =================
export const PRODUCT_API = `${BASE_URL}/api/products`;

// ================= CART =================
export const CART_API = `${BASE_URL}/api/cart`;

// ================= ORDERS =================
export const ORDER_API = `${BASE_URL}/api/orders`;

// ================= USERS =================
export const USER_API = `${BASE_URL}/api/users`;

// ================= COUPONS =================
export const COUPON_API = `${BASE_URL}/api/coupons`;