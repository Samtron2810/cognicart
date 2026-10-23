import api from "./api"

export type QuickReply = { label: string; value: string }

/** A product the assistant found, compact enough to render inside the chat. */
export type ChatProduct = {
  id: string
  name: string
  price: number
  currency: string
  image: string
  category: string
  sellerId: string
  storeName: string
  storeSlug: string
  stock: number | null
  hasVariants: boolean
}

export type ChatStore = {
  sellerId: string
  slug: string
  name: string
  logo: string
  productCount: number
  rating: number | null
}

export type ChatMessage = {
  role: "user" | "assistant"
  content: string
  quickReplies?: QuickReply[]
  products?: ChatProduct[]
  stores?: ChatStore[]
  createdAt?: string
}

export type ChatOpenPayload = {
  title: string
  subtitle: string
  messages: ChatMessage[]
  quickReplies: QuickReply[]
}

export type ChatReply = {
  reply: string
  intent: string
  quickReplies: QuickReply[]
  products: ChatProduct[]
  stores: ChatStore[]
}

/**
 * The marketplace assistant.
 *
 * One assistant for the whole site rather than one per store, so a shopper
 * can find something without first guessing which seller carries it.
 *
 * Identity is never sent from here: the backend reads it from the signed,
 * httpOnly visitor cookie or the shopper session. A conversation therefore
 * cannot be read by replaying someone else's id.
 */
export const marketplaceChatService = {
  async open(): Promise<ChatOpenPayload> {
    const { data } = await api.get<ChatOpenPayload>("/chat")
    return data
  },

  /**
   * @param storeContext sellerId of the store currently being viewed. Used
   *        only to offer a "narrow to this store" shortcut — results are
   *        marketplace-wide regardless.
   */
  async send(body: string, storeContext?: string): Promise<ChatReply> {
    const { data } = await api.post<ChatReply>("/chat", { body, storeContext })
    return data
  },

  async clear(): Promise<void> {
    await api.delete("/chat")
  },
}
