export type AIToolName = "searchProducts" | "getProduct" | "checkStock" | "getBusinessInfo" | "createOrder" | "calculateOrderTotal" | "createPayment"

export type AIToolCall = {
  id: string
  name: AIToolName
  arguments: Record<string, unknown>
  result?: unknown
  error?: string
}

export type AIContext = {
  sellerId: string
  customerPhone: string
  pendingProductId?: string
  pendingProductName?: string
  pendingQuantity?: number
  pendingAddress?: string
  awaitingConfirmation?: boolean
  awaitingAddress?: boolean
  awaitingProductChoice?: boolean
  lastSearchResults?: Array<{ id: string; name: string; price: number; stock: number }>
  lastOrderId?: string
  lastOrderTotal?: number
}

export type AIResponse = {
  reply: string
  toolCalls: AIToolCall[]
  orderId?: string
  intent: string
}

export type AIToolDefinition = {
  name: AIToolName
  description: string
  parameters: Record<string, { type: string; required: boolean; description: string }>
}
