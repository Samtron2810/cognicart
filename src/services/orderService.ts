import api from "./api"
import type { CreateOrderPayload, Order, OrderStatus } from "../types/order"
import { getIdempotencyKey } from "../utils/idempotency"

type OrderFilters = { search?: string; status?: string; paymentStatus?: string }

export const orderService = {
  async list(params: OrderFilters = {}): Promise<Order[]> {
    const { data } = await api.get<Order[]>("/orders", { params })
    return data
  },

  async getById(id: string): Promise<Order> {
    const { data } = await api.get<Order>(`/orders/${id}`)
    return data
  },

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
}
