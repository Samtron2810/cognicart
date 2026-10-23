import api from "./api"

export type QuickReply = { label: string; value: string }

export type ChatMessage = {
  role: "user" | "assistant"
  content: string
  quickReplies?: QuickReply[]
  createdAt?: string
}

export type ChatOpenPayload = {
  storeName: string
  storeLogo: string
  /** "Chat with Vivid Fashions Bot" — built server-side from the store. */
  title: string
  messages: ChatMessage[]
  quickReplies: QuickReply[]
  /** False when the browser blocked the visitor cookie: chat works, history will not persist. */
  persisted: boolean
}

export type ChatReply = {
  reply: string
  intent: string
  quickReplies: QuickReply[]
  toolCalls: { name: string; result: unknown }[]
}

/**
 * Per-store chatbot.
 *
 * Every call is addressed to a store identifier, and the backend resolves the
 * tenant from it — the seller is never sent from here. That is deliberate:
 * it means no request this client can construct is able to reach another
 * store's catalog or orders.
 */
export const storeChatService = {
  async open(identifier: string): Promise<ChatOpenPayload> {
    const { data } = await api.get<ChatOpenPayload>(`/storefront/${identifier}/chat`)
    return data
  },

  async send(identifier: string, body: string): Promise<ChatReply> {
    const { data } = await api.post<ChatReply>(`/storefront/${identifier}/chat`, { body })
    return data
  },

  async clear(identifier: string): Promise<void> {
    await api.delete(`/storefront/${identifier}/chat`)
  },
}
