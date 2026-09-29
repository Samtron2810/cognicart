import type {
  ManualChannel,
  ManualOrderItemInput,
  ManualOrderPayload,
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
  UpdateManualOrderPayload,
} from "../types/order"

export type ManualItemDraft = {
  /** Empty for a custom/off-catalog item. */
  productId?: string
  variantId?: string
  name: string
  /** Free-text so a seller can type a negotiated price; empty = use catalog price. */
  price: string
  quantity: string
  image?: string
  isCustom: boolean
}

export type ManualOrderDraft = {
  customerName: string
  customerPhone: string
  customerEmail: string
  deliveryAddress: string
  items: ManualItemDraft[]
  deliveryFee: string
  sourceChannel: ManualChannel
  sourceNote: string
  notes: string
  expectedDeliveryDate: string
  orderStatus: OrderStatus
  paymentStatus: PaymentStatus
  paymentMethod: PaymentMethod
  paymentReference: string
  adjustInventory: boolean
}

export function emptyManualItem(isCustom = false): ManualItemDraft {
  return { productId: undefined, variantId: undefined, name: "", price: "", quantity: "1", isCustom }
}

export function emptyManualOrderDraft(): ManualOrderDraft {
  return {
    customerName: "",
    customerPhone: "",
    customerEmail: "",
    deliveryAddress: "",
    items: [],
    deliveryFee: "0",
    sourceChannel: "instagram",
    sourceNote: "",
    notes: "",
    expectedDeliveryDate: "",
    orderStatus: "Pending",
    paymentStatus: "Pending",
    paymentMethod: "bank_transfer",
    paymentReference: "",
    adjustInventory: false,
  }
}

export function validateManualOrderDraft(draft: ManualOrderDraft): string | null {
  if (!draft.customerName.trim()) return "Customer name is required."
  if (!draft.customerPhone.trim()) return "Customer phone number is required."
  if (draft.items.length === 0) return "Add at least one item to the order."
  for (const item of draft.items) {
    const quantity = Number(item.quantity)
    if (!Number.isInteger(quantity) || quantity < 1) return "Every item needs a quantity of at least 1."
    if (item.isCustom) {
      if (!item.name.trim()) return "Custom items need a name."
      if (item.price === "" || Number.isNaN(Number(item.price)) || Number(item.price) < 0) return "Custom items need a valid price."
    } else if (!item.productId) {
      return "Select a product for every catalog item."
    } else if (item.price !== "" && (Number.isNaN(Number(item.price)) || Number(item.price) < 0)) {
      return "Negotiated prices must be zero or more."
    }
  }
  if (draft.deliveryFee !== "" && (Number.isNaN(Number(draft.deliveryFee)) || Number(draft.deliveryFee) < 0)) {
    return "Delivery fee must be zero or more."
  }
  return null
}

function toItemInput(item: ManualItemDraft): ManualOrderItemInput {
  const quantity = Number(item.quantity)
  if (item.isCustom || !item.productId) {
    return {
      name: item.name.trim(),
      price: Number(item.price),
      quantity,
      image: item.image || undefined,
    }
  }
  return {
    productId: item.productId,
    variantId: item.variantId || undefined,
    // A seller may enter the actual negotiated price; blank uses catalog price.
    price: item.price === "" ? undefined : Number(item.price),
    quantity,
  }
}

/**
 * Build the POST /orders/manual payload from the seller's form draft.
 * Matches the backend manualOrderService contract exactly.
 */
export function buildManualOrderPayload(draft: ManualOrderDraft): ManualOrderPayload {
  return {
    customer: {
      name: draft.customerName.trim(),
      phone: draft.customerPhone.trim(),
      email: draft.customerEmail.trim() || undefined,
      address: draft.deliveryAddress.trim() || undefined,
    },
    items: draft.items.map(toItemInput),
    deliveryAddress: draft.deliveryAddress.trim() || undefined,
    deliveryFee: draft.deliveryFee === "" ? undefined : Number(draft.deliveryFee),
    sourceChannel: draft.sourceChannel,
    sourceNote: draft.sourceNote.trim() || undefined,
    notes: draft.notes.trim() || undefined,
    expectedDeliveryDate: draft.expectedDeliveryDate || null,
    orderStatus: draft.orderStatus,
    paymentStatus: draft.paymentStatus,
    paymentMethod: draft.paymentMethod,
    paymentReference: draft.paymentReference.trim() || undefined,
    adjustInventory: draft.adjustInventory,
  }
}

/**
 * Build the PATCH /orders/manual/:id payload. Payment fields are deliberately
 * excluded — offline payment is recorded through the dedicated payment
 * endpoint, and automatic orders can never reach either endpoint.
 */
export function buildManualOrderUpdatePayload(draft: ManualOrderDraft): UpdateManualOrderPayload {
  return {
    customer: {
      name: draft.customerName.trim(),
      phone: draft.customerPhone.trim(),
      email: draft.customerEmail.trim() || undefined,
      address: draft.deliveryAddress.trim() || undefined,
    },
    items: draft.items.map(toItemInput),
    deliveryAddress: draft.deliveryAddress.trim() || undefined,
    deliveryFee: draft.deliveryFee === "" ? undefined : Number(draft.deliveryFee),
    sourceChannel: draft.sourceChannel,
    sourceNote: draft.sourceNote.trim(),
    notes: draft.notes.trim(),
    expectedDeliveryDate: draft.expectedDeliveryDate || null,
    orderStatus: draft.orderStatus,
    adjustInventory: draft.adjustInventory,
  }
}

/** Client-side preview of what the backend will compute; server stays authoritative. */
export function estimateManualOrderTotals(draft: ManualOrderDraft, catalogPrices: Map<string, number>) {
  const subtotal = draft.items.reduce((sum, item) => {
    const quantity = Number(item.quantity) || 0
    const price = item.price !== ""
      ? Number(item.price) || 0
      : catalogPrices.get(`${item.productId || ""}::${item.variantId || ""}`) || 0
    return sum + price * quantity
  }, 0)
  const deliveryFee = Number(draft.deliveryFee) || 0
  return { subtotal, deliveryFee, total: subtotal + deliveryFee }
}
