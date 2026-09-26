import api from "./api"
import type { WhatsAppConfig, WhatsAppConversation, WhatsAppMessage } from "../types/whatsapp"

type IncomingPayload = { from: string; body: string; businessPhone?: string; sellerId?: string }

export const whatsappService = {
  async getConfig(): Promise<WhatsAppConfig> {
    const { data } = await api.get<WhatsAppConfig>("/whatsapp/config")
    return data
  },

  async connect(payload: { businessPhone: string; phoneNumberId?: string; verifyToken?: string; accessToken?: string }): Promise<WhatsAppConfig> {
    const { data } = await api.post<WhatsAppConfig>("/whatsapp/connect", payload)
    return data
  },

  async disconnect(): Promise<void> {
    await api.post("/whatsapp/disconnect")
  },

  /** Calls the server's webhook verification endpoint; Meta should call this URL in production. */
  async verifyWebhook(payload: { mode: string; verifyToken: string; challenge: string }): Promise<string> {
    const { data } = await api.get<string>("/whatsapp/webhook", { params: payload })
    return data
  },

  async listMessages(filters: { customerPhone?: string; direction?: string } = {}): Promise<WhatsAppMessage[]> {
    const { data } = await api.get<WhatsAppMessage[]>("/whatsapp/messages", { params: filters })
    return data
  },

  async getConversations(): Promise<WhatsAppConversation[]> {
    const { data } = await api.get<WhatsAppConversation[]>("/whatsapp/conversations")
    return data
  },

  /** A backend-backed simulator for an incoming message; production traffic arrives via Meta's webhook. */
  async handleIncoming(payload: IncomingPayload): Promise<{ inbound: WhatsAppMessage; outbound: WhatsAppMessage; toolCalls?: unknown }> {
    const { data } = await api.post<{ inbound: WhatsAppMessage; outbound: WhatsAppMessage; toolCalls?: unknown }>("/whatsapp/incoming", payload)
    return data
  },

  async sendOutbound(payload: { to: string; body: string }): Promise<WhatsAppMessage> {
    const { data } = await api.post<WhatsAppMessage>("/whatsapp/send", payload)
    return data
  },
}
