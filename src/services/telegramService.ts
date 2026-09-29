import api from "./api"
import type {
  ChannelConversation,
  ChannelMessage,
  ConnectTelegramPayload,
  TelegramConfig,
} from "../types/telegram"

type Wrapped<T> = { success: boolean; data: T; count?: number }

/**
 * Telegram management routes are mounted at the backend server root
 * (`/telegram/...`), not under the `/api` prefix the shared client uses.
 * Absolute URLs bypass the axios baseURL while keeping the shared
 * interceptors (auth header, logging) from the same instance.
 */
const ROOT_BASE = (import.meta.env.VITE_API_URL || "http://localhost:5000/api").replace(/\/api\/?$/, "")

const telegramUrl = (path: string) => `${ROOT_BASE}/telegram${path}`

/**
 * Seller Telegram bot management.
 *
 * The bot token is submitted once during connect and never stored in the
 * browser (no localStorage, no state beyond the controlled form input while
 * typing). Webhook registration, secrets, and update handling are owned by
 * the backend — the client only reads masked connection status.
 */
export const telegramService = {
  async getConfig(): Promise<TelegramConfig> {
    const { data } = await api.get<Wrapped<TelegramConfig>>(telegramUrl("/config"))
    return data.data
  },

  async connect(payload: ConnectTelegramPayload): Promise<TelegramConfig> {
    const { data } = await api.post<Wrapped<TelegramConfig>>(telegramUrl("/connect"), {
      botToken: payload.botToken,
      dropPendingUpdates: payload.dropPendingUpdates === true,
    })
    return data.data
  },

  async disconnect(): Promise<void> {
    await api.delete(telegramUrl("/disconnect"))
  },

  async listMessages(filters: { channelUserId?: string; direction?: string } = {}): Promise<ChannelMessage[]> {
    const { data } = await api.get<Wrapped<ChannelMessage[]>>(telegramUrl("/messages"), { params: filters })
    return data.data
  },

  async getConversations(): Promise<ChannelConversation[]> {
    const { data } = await api.get<Wrapped<ChannelConversation[]>>(telegramUrl("/conversations"))
    return data.data
  },
}
