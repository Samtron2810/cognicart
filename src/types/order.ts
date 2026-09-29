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

/**
 * Where an order came from.
 *
 * "storefront" and "telegram" are automatic sources: the backend computed the
 * prices and the buyer placed the order themselves. "manual" orders were typed
 * in by the seller after selling on an external channel, so only they expose
 * line-item editing and offline payment controls.
 */
export const ORDER_SOURCES = ["storefront", "telegram", "manual"] as const
export type OrderSource = (typeof ORDER_SOURCES)[number]

export const AUTOMATIC_SOURCES: readonly OrderSource[] = ["storefront", "telegram"]

/** Where a manually logged order was actually taken. Display/reporting only. */
export const MANUAL_CHANNELS = [
  "whatsapp",
  "instagram",
  "facebook",
  "tiktok",
  "x",
  "snapchat",
  "phone_call",
  "sms",
  "email",
  "walk_in",
  "referral",
  "other",
] as const
export type ManualChannel = (typeof MANUAL_CHANNELS)[number]

export const MANUAL_CHANNEL_LABELS: Record<ManualChannel, string> = {
  whatsapp: "WhatsApp",
  instagram: "Instagram",
  facebook: "Facebook",
  tiktok: "TikTok",
  x: "X (Twitter)",
  snapchat: "Snapchat",
  phone_call: "Phone call",
  sms: "SMS",
  email: "Email",
  walk_in: "Walk-in",
  referral: "Referral",
  other: "Other",
}

export const PAYMENT_METHODS = ["paystack", "cash", "bank_transfer", "pos", "other"] as const
export type PaymentMethod = (typeof PAYMENT_METHODS)[number]

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  paystack: "Paystack",
  cash: "Cash",
  bank_transfer: "Bank transfer",
  pos: "POS",
  other: "Other",
}

export type OrderItem = {
  /** Absent for custom/off-catalog items on manually logged orders. */
  productId?: string
  isCustomItem?: boolean
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
  shopperId?: string | null
  customerName: string
  customerPhone: string
  customerEmail?: string
  source: OrderSource
  sourceChannel?: ManualChannel | ""
  channel?: "storefront" | "telegram" | ""
  channelAccountId?: string
  channelUserId?: string
  channelUsername?: string
  sourceNote?: string
  enteredBy?: string
  orderNumber?: number
  /** Human-quotable zero-padded reference like #00124, derived by the backend. */
  reference?: string
  isManual?: boolean
  deliveryAddress: string
  items: OrderItem[]
  subtotal: number
  deliveryFee: number
  total: number
  paymentStatus: PaymentStatus
  paymentMethod?: PaymentMethod
  paymentReference?: string
  paidAt?: string | null
  expectedDeliveryDate?: string | null
  notes?: string
  inventoryAdjusted?: boolean
  currency?: string
  orderStatus: OrderStatus
  createdAt: string
  updatedAt: string
}

export type CreateOrderPayload = {
  /** Required for unauthenticated storefront checkout; the backend ignores it for a signed-in seller. */
  sellerId?: string
  customer: {
    name: string
    phone: string
    /** Powers Brevo receipts and links the order to future buyer history. */
    email: string
    address?: string
  }
  items: Array<{ productId: string; quantity: number; variantId?: string }>
  deliveryAddress?: string
  deliveryFee?: number
}

export type ManualOrderItemInput = {
  /** Set for catalog items; omit for custom/off-catalog items. */
  productId?: string
  variantId?: string
  /** Required for custom items; optional override for catalog items. */
  name?: string
  /** Negotiated price. Omit on catalog items to use the current catalog price. */
  price?: number
  quantity: number
  image?: string
}

export type ManualOrderPayload = {
  customer: {
    name: string
    phone: string
    email?: string
    address?: string
  }
  items: ManualOrderItemInput[]
  deliveryAddress?: string
  deliveryFee?: number
  sourceChannel: ManualChannel
  sourceNote?: string
  notes?: string
  expectedDeliveryDate?: string | null
  orderStatus?: OrderStatus
  paymentStatus?: PaymentStatus
  paymentMethod?: PaymentMethod
  paymentReference?: string
  adjustInventory?: boolean
}

export type UpdateManualOrderPayload = Partial<Omit<ManualOrderPayload, "paymentStatus" | "paymentMethod" | "paymentReference">>

export type ManualPaymentPayload = {
  paymentStatus: PaymentStatus
  paymentMethod?: PaymentMethod
  paymentReference?: string
}

export type OrderSummary = {
  totals: {
    orders: number
    grossOrderValue: number
    paidRevenue: number
    outstanding: number
  }
  bySource: Array<{ _id: OrderSource; orders: number; value: number }>
  byStatus: Array<{ _id: OrderStatus; orders: number }>
  byPaymentStatus: Array<{ _id: PaymentStatus; orders: number; value: number }>
}

/**
 * Copyable order text plus a pre-filled wa.me link composed by the backend.
 * This is plain client-side sharing the seller taps themselves — no Meta API,
 * access token, webhook, or automated send is involved.
 */
export type OrderShare = {
  message: string
  phone: string
  whatsappUrl: string
  canSend: boolean
}

export type OrderShareVariant = "confirmation" | "dispatch" | "payment_reminder"

/** True when the order was typed in by the seller and may be edited manually. */
export function isManualOrder(order: Pick<Order, "source">): boolean {
  return order.source === "manual"
}

/**
 * Automatic (storefront/Telegram) orders can never be edited or marked paid
 * through the manual-order endpoints — payment state comes from Paystack.
 */
export function canEditLineItems(order: Pick<Order, "source">): boolean {
  return isManualOrder(order)
}

export function canRecordOfflinePayment(order: Pick<Order, "source">): boolean {
  return isManualOrder(order)
}
