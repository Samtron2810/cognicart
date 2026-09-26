import api, { getAccessToken, setAccessToken } from "./api"
import type { AuthResponse, LoginPayload, RegisterPayload, Seller } from "../types/auth"
import { isEmail, isNigerianPhone, isStrongPassword, sanitize } from "../utils/validation"
import { logger } from "./logger"

let currentUser: Seller | null = null

function validateCredentials(email: string, password: string) {
  if (!isEmail(email.trim())) throw new Error("Enter a valid email address")
  if (!password) throw new Error("Password is required")
}

function normalizeResponse(data: AuthResponse): AuthResponse {
  if (!data?.token || !data?.seller) throw new Error("The backend returned an invalid authentication response")
  return data
}

export const authService = {
  async register(payload: RegisterPayload): Promise<AuthResponse> {
    const businessName = sanitize(payload.businessName, 80)
    const email = payload.email.trim().toLowerCase()
    const phone = payload.phone?.trim() || ""
    if (businessName.length < 2) throw new Error("Business name must be at least 2 characters")
    validateCredentials(email, payload.password)
    if (!isStrongPassword(payload.password)) throw new Error("Password must be 8+ characters with an uppercase letter and number")
    if (phone && !isNigerianPhone(phone)) throw new Error("Enter a valid Nigerian phone number")

    const { data } = await api.post<AuthResponse>("/auth/register", { businessName, email, password: payload.password, phone })
    logger.info("auth: registration completed", { email })
    return normalizeResponse(data)
  },

  async login(payload: LoginPayload): Promise<AuthResponse> {
    const email = payload.email.trim().toLowerCase()
    validateCredentials(email, payload.password)
    const { data } = await api.post<AuthResponse>("/auth/login", { email, password: payload.password })
    logger.info("auth: login completed", { email })
    return normalizeResponse(data)
  },

  async me(): Promise<Seller | null> {
    try {
      const { data } = await api.get<Seller>("/auth/me")
      currentUser = data
      return data
    } catch {
      return null
    }
  },

  async logout() {
    try {
      await api.post("/auth/logout")
    } finally {
      setAccessToken(null)
      currentUser = null
    }
  },

  /** Keeps the JWT in memory while the secure backend cookie handles browser sessions. */
  persist(token: string, seller: Seller) {
    setAccessToken(token)
    currentUser = seller
  },

  getStoredSeller(): Seller | null {
    return currentUser
  },

  getToken(): string | null {
    return getAccessToken()
  },
}
