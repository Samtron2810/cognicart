import axios from "axios"
import { logger } from "./logger"

/**
 * API client for the WABAC backend.
 *
 * Set VITE_API_URL to the deployed backend's `/api` URL in production. The
 * localhost default only points to a running backend during local development;
 * it never falls back to browser-stored data.
 */
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
  headers: { "Content-Type": "application/json" },
  timeout: 15000,
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
    if (status === 401) {
      setAccessToken(null)
      logger.warn("api: unauthorized", { url })
    } else if (!error.response) {
      logger.error("api: backend unavailable", { url, message: error.message })
    } else {
      logger.error("api: error", { url, status, message: error.message })
    }
    return Promise.reject(error)
  },
)

export default api
