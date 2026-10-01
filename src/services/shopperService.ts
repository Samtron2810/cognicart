import api from "./api"
import type {
  RequestOtpPayload,
  RequestOtpResult,
  Shopper,
  ShopperOrder,
  ShopperProfile,
  ShopperSession,
  UpdateShopperPayload,
  VerifyOtpPayload,
} from "../types/shopper"

/**
 * Passwordless buyer identity backed by the /api/shop endpoints.
 *
 * There is no buyer signup, registration, or password anywhere: a buyer
 * verifies through a Brevo email one-time code or a single-use magic link
 * from their order email. The backend sets an httpOnly session cookie
 * (sent automatically because the API client uses withCredentials), so no
 * token is ever persisted in browser storage.
 */
export const shopperService = {
  async requestOtp(payload: RequestOtpPayload): Promise<RequestOtpResult> {
    const { data } = await api.post<RequestOtpResult>("/shop/auth/request-otp", payload)
    return data
  },

  async verifyOtp(payload: VerifyOtpPayload): Promise<ShopperSession> {
    const { data } = await api.post<ShopperSession>("/shop/auth/verify-otp", payload)
    return data
  },

  /** Redeem the single-use token from a /track?t=... email link. */
  async consumeMagicLink(token: string): Promise<ShopperSession> {
    const { data } = await api.post<ShopperSession>("/shop/auth/magic", { token })
    return data
  },

  async logout(): Promise<void> {
    await api.post("/shop/auth/logout")
  },

  /** Returns null when no shopper session exists so guest checkout keeps working. */
  async me(): Promise<ShopperProfile | null> {
    try {
      const { data } = await api.get<ShopperProfile>("/shop/me")
      return data
    } catch {
      return null
    }
  },

  async updateMe(payload: UpdateShopperPayload): Promise<Shopper> {
    const { data } = await api.patch<Shopper>("/shop/me", payload)
    return data
  },

  /** Cross-store purchase history for the verified buyer. */
  async listOrders(filters: { sellerId?: string; status?: string; paymentStatus?: string } = {}): Promise<ShopperOrder[]> {
    const { data } = await api.get<ShopperOrder[]>("/shop/me/orders", { params: filters })
    return data
  },

  async getOrderById(id: string): Promise<ShopperOrder> {
    const { data } = await api.get<ShopperOrder>(`/shop/me/orders/${id}`)
    return data
  },

  /**
   * Cancel a verified buyer's own unpaid Pending/Confirmed order.
   * Only works for automatic (storefront/telegram) orders with no payment.
   */
  async cancelMyOrder(id: string, reason?: string): Promise<ShopperOrder> {
    const { data } = await api.post<ShopperOrder>(`/shop/me/orders/${id}/cancel`, { reason: reason || "Cancelled by buyer" })
    return data
  },

  /**
   * Cancel a guest order (no shopper session) by proving ownership with
   * the email address used at checkout + the order reference/id.
   * Used on the storefront for buyers who never verified their email.
   */
  async cancelGuestOrder(payload: { email: string; orderId: string; reason?: string }): Promise<ShopperOrder> {
    const { data } = await api.post<ShopperOrder>("/orders/cancel-guest", {
      email: payload.email.trim().toLowerCase(),
      orderId: payload.orderId.trim(),
      reason: payload.reason || "Cancelled by buyer (guest)",
    })
    return data
  },
}
