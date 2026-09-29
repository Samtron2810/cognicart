import type { Order } from "./order"

/**
 * Passwordless buyer identity. A shopper never registers and never holds a
 * password — they verify through a Brevo email one-time code or a single-use
 * magic link, and the backend keeps the session in an httpOnly cookie.
 */
export type Shopper = {
  id: string
  phone: string
  name: string
  email?: string
  verifiedAt: string | null
  lastLoginAt: string | null
  createdAt: string
  updatedAt: string
}

export type ShopperProfile = Shopper & {
  stores: Array<{ sellerId: string; name: string; slug?: string }>
  totalOrders: number
  totalSpent: number
  addresses: string[]
}

export type ShopperSession = {
  token: string
  shopper: Shopper
  /** Number of previously guest orders claimed by this verification. */
  claimed?: number
}

export type RequestOtpPayload = {
  phone: string
  email?: string
  sellerId?: string
}

export type RequestOtpResult = {
  success: boolean
  message: string
  expiresInSeconds: number
}

export type VerifyOtpPayload = {
  phone: string
  email: string
  code: string
}

export type UpdateShopperPayload = {
  name?: string
  email?: string
}

/** Buyer-facing order view: internal bookkeeping removed, store details attached. */
export type ShopperOrder = Omit<Order, "customerId" | "shopperId"> & {
  store: { name: string; slug?: string; phone?: string } | null
}
