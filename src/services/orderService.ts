import api from "./api"
import type {
  CreateOrderPayload,
  ManualOrderPayload,
  ManualPaymentPayload,
  Order,
  OrderShare,
  OrderShareVariant,
  OrderStatus,
  OrderSummary,
  UpdateManualOrderPayload,
} from "../types/order"
import { getIdempotencyKey } from "../utils/idempotency"

export type OrderFilters = {
  search?: string
  status?: string
  paymentStatus?: string
  source?: string
  sourceChannel?: string
  from?: string
  to?: string
}

export const orderService = {
  async list(params: OrderFilters = {}): Promise<Order[]> {
    const { data } = await api.get<Order[]>("/orders", { params })
    return data
  },

  async getById(id: string): Promise<Order> {
    const { data } = await api.get<Order>(`/orders/${id}`)
    return data
  },

  /** Global seller totals computed server-side, never from the loaded page. */
  async summary(params: { from?: string; to?: string } = {}): Promise<OrderSummary> {
    const { data } = await api.get<OrderSummary>("/orders/summary", { params })
    return data
  },

  /** Automatic storefront checkout: the backend owns pricing and stock. */
  async create(payload: CreateOrderPayload): Promise<Order> {
    const { data } = await api.post<Order>("/orders", payload, {
      headers: { "X-Idempotency-Key": getIdempotencyKey("order") },
    })
    return data
  },

  async updateStatus(id: string, orderStatus: OrderStatus): Promise<Order> {
    const { data } = await api.patch<Order>(`/orders/${id}/status`, { orderStatus })
    return data
  },

  /** Log an order the seller took on an external channel (Instagram, WhatsApp, walk-in…). */
  async createManual(payload: ManualOrderPayload): Promise<Order> {
    const { data } = await api.post<Order>("/orders/manual", payload)
    return data
  },

  /** Correct a manually logged order. The backend rejects automatic orders with 404. */
  async updateManual(id: string, payload: UpdateManualOrderPayload): Promise<Order> {
    const { data } = await api.patch<Order>(`/orders/manual/${id}`, payload)
    return data
  },

  /** Record offline payment for a manual order. Never available for automatic orders. */
  async updateManualPayment(id: string, payload: ManualPaymentPayload): Promise<Order> {
    const { data } = await api.patch<Order>(`/orders/manual/${id}/payment`, payload)
    return data
  },

  /**
   * Backend-composed share payload: copyable text plus a pre-filled wa.me
   * link the seller opens themselves. No Meta API and no automated sending.
   */
  async getShare(id: string, variant: OrderShareVariant = "confirmation"): Promise<OrderShare> {
    const { data } = await api.get<OrderShare>(`/orders/${id}/share`, { params: { variant } })
    return data
  },
}
