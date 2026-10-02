import api from "./api"
import type { Seller } from "../types/auth"
import type { Business } from "../types/business"
import type { Customer } from "../types/customer"
import type { Order } from "../types/order"
import type { Product } from "../types/product"
import type { ChannelMessage } from "../types/telegram"

export type PlatformFeeConfig = { percentage: number; fixed: number }

export type SellerSummary = {
  seller: Seller
  business?: Business | null
  productsCount: number
  activeProducts: number
  ordersCount: number
  customersCount: number
  messagesCount: number
  revenue: number
  telegramConnected: boolean
}

export type SellerDetails = {
  seller: Seller
  business: Business | null
  products: Product[]
  orders: Order[]
  customers: Customer[]
  messages: ChannelMessage[]
}

export type RevenueBreakdown = {
  breakdown: Array<{ orderId: string; sellerId: string; customerName: string; total: number; fee: number; paystackFee: number; sellerEarning: number; reference: string; createdAt: string }>
  totalSales: number
  platformRevenue: number
  paystackFees: number
  sellerEarnings: number
  fee: PlatformFeeConfig
  /** Successful transactions counted for this breakdown (the array itself was never used). */
  transactionsCount: number
  /** True when more paid orders exist than the breakdown cap returned. */
  truncated: boolean
}

export type PlatformStats = {
  totalSellers: number
  activeSellers: number
  suspendedSellers: number
  totalProducts: number
  activeProducts: number
  totalOrders: number
  pendingOrders: number
  deliveredOrders: number
  totalCustomers: number
  totalMessages: number
  inboundMessages: number
  outboundMessages: number
  totalSales: number
  platformRevenue: number
  paystackFees: number
  sellerEarnings: number
  fee: PlatformFeeConfig
  /** The 5 newest platform orders for the overview table. */
  recentOrders: Order[]
}

export type TelegramSellerStats = {
  sellerId: string
  businessName: string
  email: string
  botUsername: string
  telegramConnected: boolean
  totalMessages: number
  inbound: number
  outbound: number
  aiMessages: number
  lastMessageAt: string | null
}

export const adminService = {
  async getPlatformStats(): Promise<PlatformStats> {
    const { data } = await api.get<PlatformStats>("/admin/stats")
    return data
  },

  async listSellers(): Promise<SellerSummary[]> {
    const { data } = await api.get<SellerSummary[]>("/admin/sellers")
    return data
  },

  async getSellerDetails(sellerId: string): Promise<SellerDetails> {
    const { data } = await api.get<SellerDetails>(`/admin/sellers/${sellerId}`)
    return data
  },

  async toggleSellerActive(sellerId: string, isActive: boolean): Promise<Seller> {
    const { data } = await api.patch<Seller>(`/admin/sellers/${sellerId}/status`, { isActive })
    return data
  },

  /** Newest first, capped server-side (default 500, max 1000). */
  async listAllOrders(limit?: number): Promise<Order[]> {
    const { data } = await api.get<Order[]>("/admin/orders", { params: limit ? { limit } : undefined })
    return data
  },

  async listAllCustomers(limit?: number): Promise<Customer[]> {
    const { data } = await api.get<Customer[]>("/admin/customers", { params: limit ? { limit } : undefined })
    return data
  },

  async getRevenueBreakdown(): Promise<RevenueBreakdown> {
    const { data } = await api.get<RevenueBreakdown>("/admin/revenue")
    return data
  },

  /** Per-seller Telegram bot analytics: connection, bot username, and message volumes. */
  async getTelegramStats(): Promise<TelegramSellerStats[]> {
    const { data } = await api.get<TelegramSellerStats[]>("/admin/telegram")
    return data
  },

  async getFeeConfig(): Promise<PlatformFeeConfig> {
    const { data } = await api.get<PlatformFeeConfig>("/admin/fee")
    return data
  },

  async setFeeConfig(config: PlatformFeeConfig): Promise<PlatformFeeConfig> {
    const { data } = await api.patch<PlatformFeeConfig>("/admin/fee", config)
    return data
  },
}
