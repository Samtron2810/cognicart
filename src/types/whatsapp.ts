export type WhatsAppDirection = "inbound" | "outbound"

export type WhatsAppMessage = {
  id: string
  sellerId: string
  businessPhone: string
  customerPhone: string
  direction: WhatsAppDirection
  body: string
  timestamp: string
  status: "sent" | "delivered" | "read" | "received"
  deterministic?: boolean
}

export type WhatsAppConfig = {
  sellerId: string
  businessPhone: string
  phoneNumberId: string
  verifyToken: string
  accessToken: string
  webhookUrl: string
  webhookVerified: boolean
  verifiedAt?: string
  connectedAt: string
  createdAt: string
  updatedAt: string
}

export type WhatsAppConversation = {
  customerPhone: string
  businessPhone: string
  sellerId: string
  messages: WhatsAppMessage[]
  lastMessageAt: string
  unreadCount: number
}
