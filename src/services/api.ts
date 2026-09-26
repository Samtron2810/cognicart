import axios from "axios"
import { logger } from "./logger"
import { checkRateLimit } from "./rateLimitService"

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 15000,
})

// Secure token: add expiry check (mock 7 days)
function isTokenExpired(token: string): boolean {
  try {
    if (token.startsWith("mock_")) {
      return false
    }
    const payload = JSON.parse(atob(token.split(".")[1] || ""))
    if (payload.exp && Date.now() >= payload.exp * 1000) return true
  } catch {}
  return false
}

api.interceptors.request.use((config) => {
  // Request size limit: 500KB
  const dataStr = config.data ? JSON.stringify(config.data) : ""
  if (dataStr && new Blob([dataStr]).size > 500 * 1024) {
    logger.warn("api: request size limit exceeded", { url: config.url, size: new Blob([dataStr]).size })
    return Promise.reject(new Error("Payload too large (500KB limit)"))
  }

  // Rate limiting per endpoint (client-side abuse protection)
  const key = `api:${config.method}:${config.url}`
  const rl = checkRateLimit(key, 30, 10000) // 30 req per 10s per endpoint
  if (!rl.allowed) {
    logger.warn("api: rate limit exceeded", { key })
    return Promise.reject(new Error("Too many requests. Please slow down."))
  }

  // Idempotency: for POST /orders and /payments, add X-Idempotency-Key if not present
  if (config.method?.toLowerCase() === "post" && (config.url?.includes("/orders") || config.url?.includes("/payments"))) {
    const existing = (config.headers as Record<string, string>)["X-Idempotency-Key"]
    if (!existing && config.data) {
      const payloadStr = JSON.stringify(config.data)
      let hash = 0
      for (let i = 0; i < payloadStr.length; i++) hash = (hash * 31 + payloadStr.charCodeAt(i)) >>> 0
      ;(config.headers as Record<string, string>)["X-Idempotency-Key"] = `idem_${hash.toString(36)}_${Date.now().toString(36)}`
    }
  }

  const token = localStorage.getItem("cognicart_token")
  if (token) {
    if (isTokenExpired(token)) {
      logger.warn("api: token expired, clearing")
      localStorage.removeItem("cognicart_token")
      localStorage.removeItem("cognicart_seller")
      // don't attach expired token
    } else {
      config.headers.Authorization = `Bearer ${token}`
    }
  }

  // Structured logging for request (without sensitive data)
  logger.debug("api: request", { method: config.method, url: config.url })

  return config
})

api.interceptors.response.use(
  (res) => {
    logger.debug("api: response", { url: res.config.url, status: res.status })
    return res
  },
  (error) => {
    const status = error.response?.status
    const url = error.config?.url
    if (status === 401) {
      logger.warn("api: 401 unauthorized", { url })
      localStorage.removeItem("cognicart_token")
      localStorage.removeItem("cognicart_seller")
      if (!window.location.pathname.startsWith("/login") && !window.location.pathname.startsWith("/register")) {
        window.location.href = "/login"
      }
    } else if (status === 429) {
      logger.warn("api: 429 rate limited by server", { url })
    } else if (status === 413) {
      logger.warn("api: 413 payload too large", { url })
    } else if (status === 422) {
      logger.warn("api: 422 validation failed", { url, data: error.response?.data })
    } else if (!error.response) {
      // Network error - will fallback to mock, but log
      logger.debug("api: network fallback to mock", { url })
    } else {
      logger.error("api: error", { url, status, message: error.message })
    }
    return Promise.reject(error)
  }
)

export default api
