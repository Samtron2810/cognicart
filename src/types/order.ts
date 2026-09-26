export const ORDER_STATUSES = [
  "Pending",
  "Confirmed",
  "Processing",
  "Shipped",
  "Delivered",
  "Cancelled",
] as const

export type OrderStatus = (typeof ORDER_STATUSES)[number]

export const PAYMENT_STATUSES = ["Pending", "Paid", "Failed", "Refunded"] as const
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number]

export type OrderItem = {
  productId: string
  variantId?: string
  variantLabel?: string
  name: string
  price: number
  quantity: number
  image?: string
  subtotal: number
}

export type Order = {
  id: string
  sellerId: string
  customerId: string
  customerName: string
  customerPhone: string
  customerWhatsappId: string
  deliveryAddress: string
  items: OrderItem[]
  subtotal: number
  deliveryFee: number
  total: number
  paymentStatus: PaymentStatus
  paymentReference?: string
  currency?: string
  orderStatus: OrderStatus
  createdAt: string
  updatedAt: string
}

export type CreateOrderPayload = {
  customer: {
    name: string
    phone: string
    whatsappId?: string
    address?: string
  }
  items: Array<{ productId: string; quantity: number; variantId?: string }>
  deliveryAddress?: string
  deliveryFee?: number
  paymentStatus?: PaymentStatus
}
