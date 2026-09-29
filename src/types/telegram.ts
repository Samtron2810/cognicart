export type TelegramMode = "webhook" | "polling" | "disconnected"

/**
 * Seller Telegram bot connection state as reported by GET /telegram/config.
 * Secrets are never returned in the clear — the backend masks the bot token
 * and webhook secret as "***configured***" and owns webhook registration.
 */
export type TelegramConfig = {
  sellerId: string
  connected: boolean
  botId: string
  botUsername: string
  botUrl: string
  /** Masked placeholder when configured; never the real token. */
  token: string
  /** Masked placeholder when configured; never the real secret. */
  webhookSecret: string
  webhookUrl: string
  webhookVerified: boolean
  mode: TelegramMode
  connectedAt: string | null
}

export type ConnectTelegramPayload = {
  /** Submitted once over HTTPS and never persisted client-side. */
  botToken: string
  dropPendingUpdates?: boolean
}

export type MessageDirection = "inbound" | "outbound"

/** A channel transcript entry. Currently Telegram is the only live channel. */
export type ChannelMessage = {
  id: string
  sellerId: string
  channel: "telegram"
  channelAccountId?: string
  channelUserId: string
  channelUsername?: string
  customerName?: string
  customerPhone?: string
  direction: MessageDirection
  body: string
  timestamp: string
  status: "sent" | "delivered" | "read" | "received" | "failed"
  deterministic?: boolean
  toolCalls?: unknown
}

export type ChannelConversation = {
  id: string
  sellerId: string
  channel: "telegram"
  channelAccountId?: string
  channelUserId: string
  channelUsername?: string
  customerName?: string
  customerPhone?: string
  lastMessage: string
  lastMessageAt: string
  unreadCount: number
}
