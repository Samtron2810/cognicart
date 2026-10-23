/** One seller's slice of a multi-store basket. */
export type SubOrder = {
  sellerId: string
  orderId: string
  /** A, B, C — the suffix on the quotable reference ORD-1042-A. */
  label: string
  storeName: string
  subtotal: number
  deliveryFee: number
  total: number
  settledAt: string | null
  paymentReference: string
  orderStatus?: string
  paymentStatus?: string
}

/**
 * The parent of a multi-store checkout: the basket the buyer actually paid
 * for. It owns the grand total and the single payment reference; the items,
 * prices and statuses live on the sub-orders.
 */
export type OrderGroup = {
  id: string
  /** ORD-1042 */
  reference: string
  groupNumber: number
  customerName: string
  customerPhone: string
  customerEmail: string
  deliveryAddress: string
  orders: SubOrder[]
  sellerIds: string[]
  subtotal: number
  deliveryTotal: number
  grandTotal: number
  currency: string
  paymentReference: string
  /** "Partially Settled" means the buyer paid but not every seller is credited yet. */
  paymentStatus: "Pending" | "Paid" | "Failed" | "Partially Settled"
  paidAt: string | null
  createdAt: string
}
