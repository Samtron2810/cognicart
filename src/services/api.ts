import axios from "axios"
import { logger } from "./logger"

/**
 * API client for the Chatstand backend.
 *
 * Set VITE_API_URL to the deployed backend's `/api` URL in production. The
 * localhost default only points to a running backend during local development;
 * it never falls back to browser-stored data.
 */
/**
 * 60s timeout: free-tier backend hosting cold-starts can take 30-50s after the
 * server has been idle, and mobile networks can be slow. Cutting requests off
 * at 15s made perfectly good requests fail with a timeout error.
 */
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
  headers: { "Content-Type": "application/json" },
  timeout: 60000,
  withCredentials: true,
})

let accessToken: string | null = null

export function setAccessToken(token: string | null) {
  accessToken = token
}

export function getAccessToken() {
  return accessToken
}

api.interceptors.request.use((config) => {
  if (config.data) {
    const size = new Blob([JSON.stringify(config.data)]).size
    if (size > 500 * 1024) return Promise.reject(new Error("Payload too large (500KB limit)"))
  }

  if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`
  logger.debug("api: request", { method: config.method, url: config.url })
  return config
})

api.interceptors.response.use(
  (response) => {
    logger.debug("api: response", { url: response.config.url, status: response.status })
    return response
  },
  (error) => {
    const status = error.response?.status
    const url = error.config?.url

    // Retry GETs once after a timeout or dropped connection. Reads are safe to
    // repeat (never retry writes — payments/orders must not be double-submitted),
    // and a single retry absorbs flaky mobile networks and server cold starts.
    const config = error.config as (typeof error.config & { __retried?: boolean }) | undefined
    const isTransient = error.code === "ECONNABORTED" || (!error.response && !axios.isCancel(error))
    if (config && config.method === "get" && isTransient && !config.__retried) {
      config.__retried = true
      logger.warn("api: retrying GET after timeout/network error", { url })
      return api.request(config)
    }

    if (status === 401) {
      setAccessToken(null)
      logger.warn("api: unauthorized", { url })
    } else if (status === 403 && error.response?.data?.code === "EMAIL_NOT_VERIFIED") {
      // The backend gate fired on a route the UI should not have reached.
      // Send the seller to the OTP screen instead of surfacing a dead 403.
      logger.warn("api: email not verified", { url })
      const email = error.response?.data?.email
      const target = `/verify-email${email ? `?email=${encodeURIComponent(email)}` : ""}`
      if (typeof window !== "undefined" && !window.location.pathname.startsWith("/verify-email")) {
        window.location.assign(target)
      }
    } else if (!error.response) {
      logger.error("api: backend unavailable", { url, message: error.message })
    } else {
      logger.error("api: error", { url, status, message: error.message })
    }
    return Promise.reject(error)
  },
)

export default api
