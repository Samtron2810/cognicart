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
}
