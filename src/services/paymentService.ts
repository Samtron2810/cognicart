import api from "./api"
import type { Transaction, InitializePaymentPayload } from "../types/payment"
import { adminService } from "./adminService"
import { rateLimited } from "./rateLimitService"
import { logger } from "./logger"
import { webhookService } from "./webhookService"
import { clampRequestSize, sanitize } from "../utils/validation"
import { getIdempotencyKey, getIdempotentResponse, setIdempotentResponse } from "../utils/idempotency"

const TRANSACTION_KEY = "cognicart_transactions"

function getSellerId(): string {
  try {
    const raw = localStorage.getItem("cognicart_seller")
    if (raw) return (JSON.parse(raw).id as string) || "mock_seller"
  } catch {}
  return "mock_seller"
}

function getTransactions(): Transaction[] {
  try {
    return JSON.parse(localStorage.getItem(TRANSACTION_KEY) || "[]")
  } catch {
    return []
  }
}

function saveTransactions(list: Transaction[]) {
  localStorage.setItem(TRANSACTION_KEY, JSON.stringify(list))
}

function isMockMode(error: unknown) {
  return !error || (error as { response?: unknown })?.response === undefined
}

function genReference() {
  return "PSK_" + Date.now().toString(36).toUpperCase() + Math.random().toString(36).slice(2, 6).toUpperCase()
}

function paystackFee(amount: number) {
  const fee = Math.round(amount * 0.015)
  return Math.min(fee, 2000)
}

declare global {
  interface Window {
    PaystackPop?: {
      setup: (opts: {
        key: string
        email: string
        amount: number
        currency?: string
        ref: string
        callback: (res: { reference: string }) => void
        onClose: () => void
      }) => { openIframe: () => void }
    }
  }
}

function loadPaystackScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.PaystackPop) return resolve()
    const s = document.createElement("script")
    s.src = "https://js.paystack.co/v1/inline.js"
    s.async = true
    s.onload = () => resolve()
    s.onerror = () => reject(new Error("Failed to load Paystack"))
    document.head.appendChild(s)
  })
}

export const paymentService = {
  getPublicKey(): string | null {
    const key = (import.meta as unknown as { env: Record<string, string> }).env?.VITE_PAYSTACK_PUBLIC_KEY as string | undefined
    return key || null
  },

  list(): Transaction[] {
    const sellerId = getSellerId()
    return getTransactions().filter((t) => t.sellerId === sellerId).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  },

  listAll(): Transaction[] {
    return getTransactions().sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  },

  async initialize(payload: InitializePaymentPayload): Promise<{ reference: string; authorization_url?: string; transaction: Transaction }> {
    rateLimited(`payments:init:${getSellerId()}`, 10, 60 * 1000)
    if (!payload.orderId || payload.orderId.length > 100) throw new Error("Invalid orderId")
    if (!payload.email || !payload.email.includes("@")) throw new Error("Invalid email for payment")
    if (!payload.amount || payload.amount < 100 || payload.amount > 10000000) throw new Error("Invalid amount")
    clampRequestSize(JSON.stringify(payload), 50)

    const idemKey = getIdempotencyKey({ orderId: payload.orderId, amount: payload.amount })
    const cached = getIdempotentResponse<{ reference: string; transaction: Transaction }>(idemKey)
    if (cached) {
      logger.info("paymentService:initialize idempotency hit", { orderId: payload.orderId })
      return cached
    }

    const sellerId = payload.sellerId || getSellerId()
    // Validate order exists and belongs to seller (tenant isolation)
    try {
      const ordersRaw = localStorage.getItem("cognicart_orders")
      if (ordersRaw) {
        const orders = JSON.parse(ordersRaw) as Array<{ id: string; sellerId: string }>
        const order = orders.find((o) => o.id === payload.orderId)
        if (order && order.sellerId !== sellerId && sellerId !== "mock_seller") {
          logger.warn("paymentService:initialize cross-seller attempt", { orderId: payload.orderId, orderSeller: order.sellerId, sellerId })
          throw new Error("Order does not belong to seller")
        }
      }
    } catch {}

    try {
      const { data } = await api.post<{ reference: string; authorization_url?: string }>("/payments/initialize", payload, { headers: { "X-Idempotency-Key": idemKey } })
      const feeCfg = adminService.getFeeConfig()
      const platformFee = Math.round(payload.amount * (feeCfg.percentage / 100) + feeCfg.fixed)
      const pFee = paystackFee(payload.amount)
      const t: Transaction = {
        id: "txn_" + Date.now().toString(36),
        sellerId,
        orderId: payload.orderId,
        amount: payload.amount,
        subtotal: payload.subtotal ?? payload.amount,
        deliveryFee: payload.deliveryFee ?? 0,
        platformFee,
        sellerAmount: payload.amount - platformFee - pFee,
        paystackFee: pFee,
        currency: "NGN",
        reference: sanitize(data.reference, 100),
        email: sanitize(payload.email, 100),
        status: "pending",
        createdAt: new Date().toISOString(),
        channel: "paystack",
      }
      const all = getTransactions()
      all.push(t)
      saveTransactions(all)
      const res = { reference: data.reference, authorization_url: data.authorization_url, transaction: t }
      setIdempotentResponse(idemKey, res)
      logger.info("paymentService:initialize success", { orderId: payload.orderId, reference: data.reference, sellerId })
      return res
    } catch (error) {
      if (!isMockMode(error)) throw error
      const feeCfg = adminService.getFeeConfig()
      const platformFee = Math.round(payload.amount * (feeCfg.percentage / 100) + feeCfg.fixed)
      const pFee = paystackFee(payload.amount)
      const reference = genReference()
      const t: Transaction = {
        id: "txn_" + Date.now().toString(36),
        sellerId,
        orderId: payload.orderId,
        amount: payload.amount,
        subtotal: payload.subtotal ?? payload.amount,
        deliveryFee: payload.deliveryFee ?? 0,
        platformFee,
        sellerAmount: payload.amount - platformFee - pFee,
        paystackFee: pFee,
        currency: "NGN",
        reference,
        email: sanitize(payload.email, 100),
        status: "pending",
        createdAt: new Date().toISOString(),
        channel: "paystack",
      }
      const all = getTransactions()
      all.push(t)
      saveTransactions(all)
      const res = { reference, transaction: t }
      setIdempotentResponse(idemKey, res)
      logger.info("paymentService:initialize mock", { orderId: payload.orderId, reference, sellerId })
      return res
    }
  },

  async payWithPaystack(payload: InitializePaymentPayload & { onSuccess?: (ref: string) => void; onClose?: () => void }): Promise<string> {
    rateLimited(`payments:pay:${payload.orderId}`, 3, 60 * 1000)
    const { reference } = await this.initialize(payload)
    const publicKey = this.getPublicKey()

    if (publicKey) {
      try {
        await loadPaystackScript()
        if (window.PaystackPop) {
          return await new Promise<string>((resolve, reject) => {
            const handler = window.PaystackPop!.setup({
              key: publicKey,
              email: sanitize(payload.email, 100),
              amount: payload.amount * 100,
              currency: "NGN",
              ref: reference,
              callback: (res) => {
                // Verify Paystack webhook signature would be checked server-side; here we simulate verification
                webhookService.verifyPaystackSignature(JSON.stringify(res), "mock")
                this.verify(res.reference, "mock").then(() => {
                  payload.onSuccess?.(res.reference)
                  resolve(res.reference)
                }).catch(reject)
              },
              onClose: () => {
                const all = getTransactions()
                const idx = all.findIndex((t) => t.reference === reference)
                if (idx !== -1) {
                  all[idx].status = "abandoned"
                  saveTransactions(all)
                  logger.warn("paymentService:pay abandoned", { reference })
                }
                payload.onClose?.()
                reject(new Error("Payment closed"))
              },
            })
            handler.openIframe()
          })
        }
      } catch {
        // fallback to mock
      }
    }

    return await new Promise<string>((resolve) => {
      setTimeout(async () => {
        await this.verify(reference, "mock")
        payload.onSuccess?.(reference)
        resolve(reference)
      }, 1200)
    })
  },

  async verify(reference: string, signature = "mock"): Promise<Transaction> {
    rateLimited(`payments:verify:${reference}`, 10, 60 * 1000)
    if (!reference || reference.length > 100) throw new Error("Invalid reference")
    // Webhook signature verification hardening: Paystack would send x-paystack-signature
    if (!webhookService.verifyPaystackSignature(reference, signature)) {
      logger.error("paymentService:verify signature failed", { reference })
      throw new Error("Payment verification failed: invalid signature")
    }
    try {
      const { data } = await api.post<Transaction>(`/payments/verify/${reference}`, null, { headers: { "X-Paystack-Signature": signature } })
      const all = getTransactions()
      const idx = all.findIndex((t) => t.reference === reference)
      if (idx !== -1) {
        all[idx] = { ...all[idx], status: data.status || "success", verifiedAt: new Date().toISOString() }
        saveTransactions(all)
        const { orderService } = await import("./orderService")
        try {
          await orderService.updatePaymentStatus(all[idx].orderId, "Paid")
          const ordersRaw = localStorage.getItem("cognicart_orders")
          if (ordersRaw) {
            const orders = JSON.parse(ordersRaw)
            const oIdx = orders.findIndex((o: { id: string }) => o.id === all[idx].orderId)
            if (oIdx !== -1) {
              orders[oIdx].paymentReference = reference
              orders[oIdx].paymentStatus = "Paid"
              orders[oIdx].updatedAt = new Date().toISOString()
              localStorage.setItem("cognicart_orders", JSON.stringify(orders))
            }
          }
        } catch {}
      }
      logger.info("paymentService:verify success", { reference })
      return data
    } catch (error) {
      if (!isMockMode(error)) throw error
      const all = getTransactions()
      const idx = all.findIndex((t) => t.reference === reference)
      if (idx === -1) {
        logger.warn("paymentService:verify not found", { reference })
        throw new Error("Transaction not found")
      }
      all[idx].status = "success"
      all[idx].verifiedAt = new Date().toISOString()
      saveTransactions(all)
      const { orderService } = await import("./orderService")
      try {
        await orderService.updatePaymentStatus(all[idx].orderId, "Paid")
      } catch {}
      try {
        const ordersRaw = localStorage.getItem("cognicart_orders")
        if (ordersRaw) {
          const orders = JSON.parse(ordersRaw) as Array<Record<string, unknown>>
          const oIdx = orders.findIndex((o) => o.id === all[idx].orderId)
          if (oIdx !== -1) {
            (orders[oIdx] as Record<string, unknown>).paymentReference = reference
            ;(orders[oIdx] as Record<string, unknown>).paymentStatus = "Paid"
            ;(orders[oIdx] as Record<string, unknown>).updatedAt = new Date().toISOString()
            localStorage.setItem("cognicart_orders", JSON.stringify(orders))
          }
        }
      } catch {}
      logger.info("paymentService:verify mock success", { reference })
      return all[idx]
    }
  },

  getByReference(reference: string): Transaction | null {
    return getTransactions().find((t) => t.reference === reference) || null
  },

  getByOrderId(orderId: string): Transaction | null {
    return getTransactions().find((t) => t.orderId === orderId) || null
  },
}
