import api from "./api"
import type { Business, CreateBusinessPayload } from "../types/business"

export const businessService = {
  async get(): Promise<Business | null> {
    const { data } = await api.get<Business>("/business")
    return data
  },

  async update(payload: CreateBusinessPayload): Promise<Business> {
    const { data } = await api.patch<Business>("/business", payload)
    return data
  },

  async connectWhatsApp(phone: string): Promise<Business> {
    const { data } = await api.post("/whatsapp/connect", { businessPhone: phone })
    // The connection endpoint returns connection configuration; retrieve the source-of-truth business profile.
    void data
    const { data: business } = await api.get<Business>("/business")
    return business
  },

  async disconnectWhatsApp(): Promise<Business> {
    await api.post("/whatsapp/disconnect")
    const { data } = await api.get<Business>("/business")
    return data
  },
}
