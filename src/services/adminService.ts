import api from "./api"
import type { Seller } from "../types/auth"
import type { Product } from "../types/product"
import type { Order } from "../types/order"
import type { Customer } from "../types/customer"
import type { WhatsAppMessage, WhatsAppConfig } from "../types/whatsapp"
import type { Business } from "../types/business"

const SELLERS_KEY = "cognicart_mock_sellers"
const PRODUCTS_KEY = "cognicart_products"
const ORDERS_KEY = "cognicart_orders"
const CUSTOMERS_KEY = "cognicart_customers"
const MESSAGES_KEY = "cognicart_whatsapp_messages"
const CONFIG_KEY = "cognicart_whatsapp_config"
const BUSINESS_KEY = "cognicart_business"
const FEE_KEY = "cognicart_platform_fee"
const TRANSACTION_KEY = "cognicart_transactions"

function isMockMode(error: unknown) {
  return !error || (error as { response?: unknown })?.response === undefined
}

type PlatformFeeConfig = { percentage: number; fixed: number }

function getFeeConfig(): PlatformFeeConfig {
  try {
    const raw = localStorage.getItem(FEE_KEY)
    if (raw) return JSON.parse(raw)
  } catch {}
  return { percentage: 5, fixed: 0 }
}

function getSellers(): Array<Seller & { password?: string }> {
  try {
    return JSON.parse(localStorage.getItem(SELLERS_KEY) || "[]")
  } catch {
    return []
  }
}

function getBusinesses(): Business[] {
  try {
    return JSON.parse(localStorage.getItem(BUSINESS_KEY) || "[]")
  } catch {
    return []
  }
}

function getProducts(): Product[] {
  try {
    return JSON.parse(localStorage.getItem(PRODUCTS_KEY) || "[]")
  } catch {
    return []
  }
}

function getOrders(): Order[] {
  try {
    return JSON.parse(localStorage.getItem(ORDERS_KEY) || "[]")
  } catch {
    return []
  }
}

function getCustomers(): Customer[] {
  try {
    return JSON.parse(localStorage.getItem(CUSTOMERS_KEY) || "[]")
  } catch {
    return []
  }
}

function getMessages(): WhatsAppMessage[] {
  try {
    return JSON.parse(localStorage.getItem(MESSAGES_KEY) || "[]")
  } catch {
    return []
  }
}

function getConfigs(): WhatsAppConfig[] {
  try {
    return JSON.parse(localStorage.getItem(CONFIG_KEY) || "[]")
  } catch {
    return []
  }
}

function getTransactions(): Array<{ sellerId: string; orderId: string; amount: number; platformFee: number; paystackFee: number; sellerAmount: number; reference: string; status: string; createdAt: string; email?: string }> {
  try {
    return JSON.parse(localStorage.getItem(TRANSACTION_KEY) || "[]")
  } catch {
    return []
  }
}

function ensureDemoTransactions() {
  const txs = getTransactions()
  if (txs.length > 0) return
  const orders = getOrders().filter((o) => o.paymentStatus === "Paid")
  if (orders.length === 0) return
  const fee = getFeeConfig()
  const seeded = orders.map((o) => {
    const platformFee = Math.round(o.total * (fee.percentage / 100) + fee.fixed)
    const paystackFee = Math.min(Math.round(o.total * 0.015), 2000)
    return {
      id: "txn_" + o.id,
      sellerId: o.sellerId,
      orderId: o.id,
      amount: o.total,
      subtotal: o.subtotal,
      deliveryFee: o.deliveryFee,
      platformFee,
      sellerAmount: o.total - platformFee - paystackFee,
      paystackFee,
      currency: "NGN",
      reference: o.paymentReference || "PSK_DEMO_" + o.id.slice(-6).toUpperCase(),
      email: `${o.customerPhone.replace(/[^0-9]/g, "")}@cognicart.test`,
      status: "success",
      createdAt: o.createdAt,
      verifiedAt: o.updatedAt,
      channel: "paystack",
    }
  })
  localStorage.setItem(TRANSACTION_KEY, JSON.stringify(seeded))
}

export const adminService = {
  getFeeConfig,
  setFeeConfig(cfg: PlatformFeeConfig) {
    localStorage.setItem(FEE_KEY, JSON.stringify(cfg))
  },

  async getPlatformStats() {
    try {
      const { data } = await api.get("/admin/stats")
      return data
    } catch (error) {
      if (!isMockMode(error)) throw error
      ensureDemoTransactions()
      const sellers = getSellers()
      const products = getProducts()
      const orders = getOrders()
      const customers = getCustomers()
      const messages = getMessages()
      const transactions = getTransactions().filter((t) => t.status === "success")
      const fee = getFeeConfig()
      const totalSales = orders.filter((o) => o.paymentStatus === "Paid").reduce((sum, o) => sum + o.total, 0)
      const platformRevenueByTx = transactions.reduce((sum, t) => sum + t.platformFee, 0)
      const paystackFees = transactions.reduce((sum, t) => sum + (t.paystackFee || 0), 0)
      const platformRevenueComputed = Math.round(totalSales * (fee.percentage / 100) + orders.filter((o) => o.paymentStatus === "Paid").length * fee.fixed)
      const platformRevenue = transactions.length > 0 ? platformRevenueByTx : platformRevenueComputed
      const sellerEarnings = totalSales - platformRevenue - paystackFees
      return {
        totalSellers: sellers.length,
        activeSellers: sellers.filter((s) => s.isActive !== false).length,
        suspendedSellers: sellers.filter((s) => s.isActive === false).length,
        sellers, // raw for later
        totalProducts: products.length,
        activeProducts: products.filter((p) => p.isActive).length,
        totalOrders: orders.length,
        pendingOrders: orders.filter((o) => o.orderStatus === "Pending").length,
        deliveredOrders: orders.filter((o) => o.orderStatus === "Delivered").length,
        totalCustomers: customers.length,
        totalMessages: messages.length,
        inboundMessages: messages.filter((m) => m.direction === "inbound").length,
        outboundMessages: messages.filter((m) => m.direction === "outbound").length,
        totalSales,
        platformRevenue,
        paystackFees,
        sellerEarnings: Math.max(0, sellerEarnings),
        fee,
        orders,
        products,
        customers,
        messages,
        transactions,
      }
    }
  },

  async listSellers() {
    const sellers = getSellers()
    const products = getProducts()
    const orders = getOrders()
    const customers = getCustomers()
    const businesses = getBusinesses()
    const configs = getConfigs()
    const messages = getMessages()

    return sellers.map((s) => {
      const sellerProducts = products.filter((p) => p.sellerId === s.id)
      const sellerOrders = orders.filter((o) => o.sellerId === s.id)
      const sellerCustomers = customers.filter((c) => c.sellerId === s.id)
      const sellerMessages = messages.filter((m) => m.sellerId === s.id)
      const business = businesses.find((b) => b.sellerId === s.id)
      const config = configs.find((c) => c.sellerId === s.id)
      const revenue = sellerOrders.filter((o) => o.paymentStatus === "Paid").reduce((sum, o) => sum + o.total, 0)
      return {
        seller: s,
        business,
        config,
        productsCount: sellerProducts.length,
        activeProducts: sellerProducts.filter((p) => p.isActive).length,
        ordersCount: sellerOrders.length,
        customersCount: sellerCustomers.length,
        messagesCount: sellerMessages.length,
        revenue,
        whatsappConnected: !!business?.whatsappConnected,
        webhookVerified: !!config?.webhookVerified,
      }
    })
  },

  async getSellerDetails(sellerId: string) {
    const sellers = getSellers()
    const seller = sellers.find((s) => s.id === sellerId)
    if (!seller) throw new Error("Seller not found")
    const products = getProducts().filter((p) => p.sellerId === sellerId)
    const orders = getOrders().filter((o) => o.sellerId === sellerId)
    const customers = getCustomers().filter((c) => c.sellerId === sellerId)
    const businesses = getBusinesses()
    const business = businesses.find((b) => b.sellerId === sellerId) || null
    const messages = getMessages().filter((m) => m.sellerId === sellerId)
    const configs = getConfigs()
    const config = configs.find((c) => c.sellerId === sellerId) || null
    return { seller, business, products, orders, customers, messages, config }
  },

  async toggleSellerActive(sellerId: string, isActive: boolean) {
    const sellers = getSellers()
    const idx = sellers.findIndex((s) => s.id === sellerId)
    if (idx === -1) throw new Error("Seller not found")
    sellers[idx].isActive = isActive
    localStorage.setItem(SELLERS_KEY, JSON.stringify(sellers))
    return sellers[idx]
  },

  async listAllOrders() {
    const orders = getOrders()
    return orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  },

  async listAllCustomers() {
    const customers = getCustomers()
    return customers
  },

  async getRevenueBreakdown() {
    ensureDemoTransactions()
    const orders = getOrders().filter((o) => o.paymentStatus === "Paid")
    const transactions = getTransactions()
    const fee = getFeeConfig()
    const breakdown = orders.map((o) => {
      const tx = transactions.find((t) => t.orderId === o.id && t.status === "success")
      const feeAmount = tx ? tx.platformFee : Math.round(o.total * (fee.percentage / 100) + fee.fixed)
      const paystackFee = tx?.paystackFee ?? Math.min(Math.round(o.total * 0.015), 2000)
      const sellerEarning = o.total - feeAmount - paystackFee
      return { orderId: o.id, sellerId: o.sellerId, customerName: o.customerName, total: o.total, fee: feeAmount, paystackFee, sellerEarning, reference: tx?.reference || o.paymentReference || "—", createdAt: o.createdAt }
    })
    const totalSales = orders.reduce((sum, o) => sum + o.total, 0)
    const platformRevenue = breakdown.reduce((sum, b) => sum + b.fee, 0)
    const paystackFees = breakdown.reduce((sum, b) => sum + b.paystackFee, 0)
    return { breakdown, totalSales, platformRevenue, paystackFees, sellerEarnings: Math.max(0, totalSales - platformRevenue - paystackFees), fee, transactions }
  },

  async getWhatsAppStats() {
    const sellers = getSellers()
    const messages = getMessages()
    const configs = getConfigs()
    return sellers.map((s) => {
      const sellerMessages = messages.filter((m) => m.sellerId === s.id)
      const cfg = configs.find((c) => c.sellerId === s.id)
      return {
        sellerId: s.id,
        businessName: s.businessName,
        email: s.email,
        businessPhone: cfg?.businessPhone || "—",
        webhookVerified: !!cfg?.webhookVerified,
        totalMessages: sellerMessages.length,
        inbound: sellerMessages.filter((m) => m.direction === "inbound").length,
        outbound: sellerMessages.filter((m) => m.direction === "outbound").length,
        aiMessages: sellerMessages.filter((m) => !m.deterministic && m.direction === "outbound").length,
        lastMessageAt: sellerMessages.length ? sellerMessages[sellerMessages.length - 1].timestamp : null,
      }
    })
  },
}
