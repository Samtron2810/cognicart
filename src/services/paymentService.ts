import api from "./api"
import type { InitializePaymentPayload, Transaction } from "../types/payment"
import { getIdempotencyKey } from "../utils/idempotency"

type PaymentInitialization = { reference: string; authorization_url?: string; transaction?: Transaction }

export const paymentService = {
  async initialize(payload: InitializePaymentPayload): Promise<PaymentInitialization> {
    const { data } = await api.post<PaymentInitialization>("/payments/initialize", payload, {
      headers: { "X-Idempotency-Key": getIdempotencyKey("payment") },
    })
    return data
  },

  /** Opens the checkout URL issued by the backend; no client-side payment simulation is used. */
  async payWithPaystack(payload: InitializePaymentPayload): Promise<string> {
    const payment = await this.initialize(payload)
    if (!payment.reference) throw new Error("The backend did not return a payment reference")
    if (!payment.authorization_url) throw new Error("The backend did not return a Paystack checkout URL")
    window.location.assign(payment.authorization_url)
    return payment.reference
  },

  async verify(reference: string): Promise<Transaction> {
    const { data } = await api.get<Transaction>(`/payments/verify/${reference}`)
    return data
  },

  async getByReference(reference: string): Promise<Transaction> {
    const { data } = await api.get<Transaction>(`/payments/${reference}`)
    return data
  },

  async list(): Promise<Transaction[]> {
    const { data } = await api.get<Transaction[]>("/payments")
    return data
  },
}
