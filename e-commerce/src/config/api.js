const configuredBaseUrl = import.meta.env.VITE_API_URL?.trim()
const BASE_URL = (configuredBaseUrl || 'http://localhost:5000').replace(/\/+$/, '')

// The FastAPI backend exposes all application routes under /api.
export const AUTH_API = `${BASE_URL}/api/auth`
export const PRODUCT_API = `${BASE_URL}/api/products`
export const CART_API = `${BASE_URL}/api/cart`
export const ORDER_API = `${BASE_URL}/api/orders`
export const USER_API = `${BASE_URL}/api/users`
export const COUPON_API = `${BASE_URL}/api/coupons`

export const API_BASE_URL = BASE_URL
