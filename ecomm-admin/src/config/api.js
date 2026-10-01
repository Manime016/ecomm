import axios from "axios"

const configuredBaseUrl = import.meta.env.VITE_API_URL?.trim()
const baseURL = (configuredBaseUrl || "http://localhost:5000").replace(/\/+$/, "")

const api = axios.create({
  baseURL: `${baseURL}/api`,
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token")
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token")
      window.location.reload()
    }
    return Promise.reject(error)
  },
)

export const PRODUCT_API = "/products"
export const API_BASE_URL = baseURL

export default api
