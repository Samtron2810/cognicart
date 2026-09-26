export type TransactionStatus = "pending" | "success" | "failed" | "abandoned"

export type Transaction = {
  id: string
  sellerId: string
  orderId: string
  amount: number
  subtotal: number
  deliveryFee: number
  platformFee: number
  sellerAmount: number
  paystackFee: number
  currency: string
  reference: string
  email: string
  status: TransactionStatus
  createdAt: string
  verifiedAt?: string
  channel?: string
}

export type InitializePaymentPayload = {
  sellerId?: string
  orderId: string
  amount: number
  email: string
  subtotal?: number
  deliveryFee?: number
}
