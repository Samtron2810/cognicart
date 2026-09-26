import api from "./api"
import type { AuthResponse, LoginPayload, RegisterPayload, Seller } from "../types/auth"
import { isEmail, isStrongPassword, sanitize, isNigerianPhone } from "../utils/validation"
import { rateLimited } from "./rateLimitService"
import { logger } from "./logger"

// Local mock fallback when backend is not reachable
const MOCK_KEY = "cognicart_mock_sellers"
const TOKEN_KEY = "cognicart_token"
const SELLER_KEY = "cognicart_seller"
const TOKEN_EXPIRY_KEY = "cognicart_token_expiry"

function getMockSellers(): Array<Seller & { password: string }> {
  try {
    return JSON.parse(localStorage.getItem(MOCK_KEY) || "[]")
  } catch {
    return []
  }
}

function saveMockSellers(sellers: Array<Seller & { password: string }>) {
  localStorage.setItem(MOCK_KEY, JSON.stringify(sellers))
}

function mockToken() {
  return "mock_" + Math.random().toString(36).slice(2) + Date.now().toString(36)
}

function ensureAdminSeed() {
  const sellers = getMockSellers()
  let mutated = false
  const adminEmail = "admin@cognicart.ng"
  if (!sellers.find((s) => s.email.toLowerCase() === adminEmail)) {
    sellers.push({
      id: "seller_admin",
      businessName: "Cognicart Platform",
      email: adminEmail,
      phone: "+2348000000000",
      password: "Admin123!",
      role: "admin",
      isActive: true,
      createdAt: new Date(Date.now() - 86400000 * 30).toISOString(),
    } as Seller & { password: string })
    mutated = true
  }
  const ownerEmail = "owner@cognicart.ng"
  if (!sellers.find((s) => s.email.toLowerCase() === ownerEmail)) {
    sellers.push({
      id: "seller_owner",
      businessName: "Cognicart Owner",
      email: ownerEmail,
      phone: "+2348000000001",
      password: "Owner123!",
      role: "platform_owner",
      isActive: true,
      createdAt: new Date(Date.now() - 86400000 * 60).toISOString(),
    } as Seller & { password: string })
    mutated = true
  }
  if (mutated) saveMockSellers(sellers)
}

export const authService = {
  async register(payload: RegisterPayload): Promise<AuthResponse> {
    // Input validation (frontend hardening)
    const businessName = sanitize(payload.businessName, 80)
    const email = payload.email.trim().toLowerCase()
    const phone = (payload.phone || "").trim()
    const password = payload.password
    if (businessName.length < 2) throw new Error("Business name must be at least 2 characters")
    if (!isEmail(email)) throw new Error("Invalid email format")
    if (!isNigerianPhone(phone)) throw new Error("Invalid Nigerian phone (10-15 digits)")
    if (!isStrongPassword(password)) throw new Error("Password must be 8+ chars with uppercase and number")
    rateLimited(`register:${email}`, 3, 60 * 60 * 1000) // 3 per hour per email
    rateLimited("register:global", 10, 60 * 1000) // 10 per minute globally

    try {
      const { data } = await api.post<AuthResponse>("/auth/register", payload)
      logger.info("auth: register success", { email })
      return data
    } catch {
      ensureAdminSeed()
      const sellers = getMockSellers()
      if (sellers.find((s) => s.email.toLowerCase() === email)) {
        logger.warn("auth: register email already exists", { email })
        throw new Error("Email already registered")
      }
      const isAdminEmail = email === "admin@cognicart.ng" || email === "owner@cognicart.ng"
      const seller: Seller & { password: string } = {
        id: "seller_" + Date.now().toString(36),
        businessName,
        email,
        phone,
        password, // mock: in prod would be bcrypt hashed server-side
        role: isAdminEmail ? "admin" : "seller",
        isActive: true,
        createdAt: new Date().toISOString(),
      }
      sellers.push(seller)
      saveMockSellers(sellers)
      const token = mockToken()
      const { password: _pw, ...rest } = seller
      logger.info("auth: register mock success", { email, sellerId: rest.id })
      return { token, seller: rest }
    }
  },

  async login(payload: LoginPayload): Promise<AuthResponse> {
    const email = payload.email.trim().toLowerCase()
    if (!isEmail(email)) throw new Error("Invalid email")
    if (!payload.password || payload.password.length < 6) throw new Error("Invalid password")
    rateLimited(`login:${email}`, 5, 5 * 60 * 1000) // 5 attempts per 5 min per email
    rateLimited("login:global", 20, 60 * 1000)

    try {
      const { data } = await api.post<AuthResponse>("/auth/login", payload)
      logger.info("auth: login success", { email })
      return data
    } catch {
      ensureAdminSeed()
      const sellers = getMockSellers()
      const found = sellers.find((s) => s.email.toLowerCase() === email && s.password === payload.password)
      if (!found) {
        logger.warn("auth: login failed", { email })
        throw new Error("Invalid email or password")
      }
      if (found.isActive === false) {
        logger.warn("auth: login suspended", { email })
        throw new Error("Account suspended. Contact platform support.")
      }
      const token = mockToken()
      const { password: _pw, ...rest } = found
      if (!rest.role) rest.role = rest.email.includes("admin") || rest.email.includes("owner") ? "admin" : "seller"
      logger.info("auth: login mock success", { email, sellerId: rest.id })
      return { token, seller: rest }
    }
  },

  async me(token?: string): Promise<Seller | null> {
    const t = token || localStorage.getItem(TOKEN_KEY)
    if (!t) return null
    // Check expiry
    const expiry = localStorage.getItem(TOKEN_EXPIRY_KEY)
    if (expiry && Date.now() > Number(expiry)) {
      logger.warn("auth: token expired")
      this.logout()
      return null
    }
    try {
      const { data } = await api.get<Seller>("/auth/me")
      return data
    } catch {
      const raw = localStorage.getItem(SELLER_KEY)
      if (raw) {
        try {
          return JSON.parse(raw) as Seller
        } catch {
          return null
        }
      }
      return null
    }
  },

  logout() {
    logger.info("auth: logout", { sellerId: this.getStoredSeller()?.id })
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(SELLER_KEY)
    localStorage.removeItem(TOKEN_EXPIRY_KEY)
  },

  persist(token: string, seller: Seller) {
    localStorage.setItem(TOKEN_KEY, token)
    localStorage.setItem(SELLER_KEY, JSON.stringify(seller))
    // Secure token: 7 day expiry, httpOnly not available in localStorage but we simulate expiry and log
    localStorage.setItem(TOKEN_EXPIRY_KEY, String(Date.now() + 7 * 86400000))
    logger.info("auth: persist token", { sellerId: seller.id, role: seller.role })
  },

  getStoredSeller(): Seller | null {
    const raw = localStorage.getItem(SELLER_KEY)
    if (!raw) return null
    try {
      return JSON.parse(raw)
    } catch {
      return null
    }
  },

  getToken(): string | null {
    const expiry = localStorage.getItem(TOKEN_EXPIRY_KEY)
    if (expiry && Date.now() > Number(expiry)) {
      this.logout()
      return null
    }
    return localStorage.getItem(TOKEN_KEY)
  },
}
