import api from "./api"
import type { Business, CreateBusinessPayload } from "../types/business"

const STORAGE_KEY = "cognicart_business"

function getSellerId(): string {
  try {
    const raw = localStorage.getItem("cognicart_seller")
    if (raw) return (JSON.parse(raw).id as string) || "mock_seller"
  } catch {}
  return "mock_seller"
}

function getSellerEmail(): string {
  try {
    const raw = localStorage.getItem("cognicart_seller")
    if (raw) return (JSON.parse(raw).email as string) || ""
  } catch {}
  return ""
}

function getBusinessNameFallback(): string {
  try {
    const raw = localStorage.getItem("cognicart_seller")
    if (raw) return (JSON.parse(raw).businessName as string) || "My Store"
  } catch {}
  return "My Store"
}

function getBusinesses(): Business[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]")
  } catch {
    return []
  }
}

function saveBusinesses(list: Business[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
}

function isMockMode(error: unknown) {
  return !error || (error as { response?: unknown })?.response === undefined
}

export const businessService = {
  async get(): Promise<Business | null> {
    try {
      const { data } = await api.get<Business>("/business")
      return data
    } catch (error) {
      if (!isMockMode(error)) throw error
      const all = getBusinesses()
      const found = all.find((b) => b.sellerId === getSellerId())
      if (found) return found
      // create default from seller
      const now = new Date().toISOString()
      const def: Business = {
        id: "biz_" + getSellerId(),
        sellerId: getSellerId(),
        name: getBusinessNameFallback(),
        email: getSellerEmail(),
        phone: "",
        location: "",
        description: "",
        deliveryInfo: "Lagos 1-2 days, outside Lagos 2-4 days",
        deliveryFee: 1500,
        deliveryTime: "1-3 days",
        freeDeliveryThreshold: 25000,
        paymentMethod: "both",
        paystackEnabled: true,
        whatsappConnected: false,
        createdAt: now,
        updatedAt: now,
      }
      all.push(def)
      saveBusinesses(all)
      return def
    }
  },

  async update(payload: CreateBusinessPayload): Promise<Business> {
    try {
      const { data } = await api.patch<Business>("/business", payload)
      return data
    } catch (error) {
      if (!isMockMode(error)) throw error
      const all = getBusinesses()
      let idx = all.findIndex((b) => b.sellerId === getSellerId())
      const now = new Date().toISOString()
      if (idx === -1) {
        const def: Business = {
          id: "biz_" + getSellerId(),
          sellerId: getSellerId(),
          name: payload.name || getBusinessNameFallback(),
          email: getSellerEmail(),
          createdAt: now,
          updatedAt: now,
          ...payload,
        } as Business
        all.push(def)
        saveBusinesses(all)
        return def
      }
      const updated = { ...all[idx], ...payload, updatedAt: now }
      all[idx] = updated
      saveBusinesses(all)
      return updated
    }
  },

  async connectWhatsApp(phone: string): Promise<Business> {
    return this.update({ whatsappPhone: phone, whatsappConnected: true, whatsappVerifiedAt: new Date().toISOString() })
  },

  async disconnectWhatsApp(): Promise<Business> {
    return this.update({ whatsappConnected: false, whatsappVerifiedAt: undefined })
  },
}
