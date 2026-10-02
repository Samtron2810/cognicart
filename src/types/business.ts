export type Business = {
  id: string
  sellerId: string
  name: string
  slug?: string
  description?: string
  phone?: string
  email?: string
  location?: string
  logo?: string
  /** Cloudinary asset id behind `logo`; lets the server destroy a replaced asset. */
  logoPublicId?: string
  deliveryInfo?: string
  deliveryFee?: number
  deliveryTime?: string
  freeDeliveryThreshold?: number
  paymentMethod?: "paystack" | "transfer" | "both"
  paystackEnabled?: boolean
  bankName?: string
  accountNumber?: string
  accountName?: string
  /**
   * Telegram bot connection state. The bot token and webhook secret are
   * write-only server-side secrets and are never returned by the API.
   */
  telegramConnected?: boolean
  telegramBotId?: string
  telegramBotUsername?: string
  telegramWebhookUrl?: string
  telegramWebhookVerified?: boolean
  telegramConnectedAt?: string | null
  createdAt: string
  updatedAt: string
}

/** Public storefront profile returned by GET /storefront/:identifier. */
export type StorefrontProfile = {
  sellerId: string
  name: string
  slug: string
  description: string
  phone: string
  email: string
  location: string
  logo: string
  logoPublicId: string
  deliveryInfo: string
  deliveryFee: number
  deliveryTime: string
  freeDeliveryThreshold: number
  paymentMethod: string
  paystackEnabled: boolean
  telegramBotUsername: string
  /** Backend-provided https://t.me/... link when the seller has connected a bot. */
  telegramBotUrl: string
  currency: string
  createdAt: string
}

export type CreateBusinessPayload = Partial<Omit<Business, "id" | "sellerId" | "createdAt" | "updatedAt">>
