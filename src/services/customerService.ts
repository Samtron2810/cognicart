import api from "./api"
import type { Customer } from "../types/customer"

const STORAGE_KEY = "cognicart_customers"

function getSellerId(): string {
  try {
    const raw = localStorage.getItem("cognicart_seller")
    if (raw) return (JSON.parse(raw).id as string) || "mock_seller"
  } catch {}
  return "mock_seller"
}

function getCustomers(): Customer[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]")
  } catch {
    return []
  }
}

function saveCustomers(customers: Customer[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(customers))
}

function isMockMode(error: unknown) {
  return !error || (error as { response?: unknown })?.response === undefined
}

export const customerService = {
  async list(params?: { search?: string }): Promise<Customer[]> {
    try {
      const { data } = await api.get<Customer[]>("/customers", { params })
      return data
    } catch (error) {
      if (!isMockMode(error)) throw error
      let customers = getCustomers().filter((c) => c.sellerId === getSellerId())
      if (params?.search) {
        const q = params.search.toLowerCase()
        customers = customers.filter((c) => c.name.toLowerCase().includes(q) || c.phone.includes(q) || c.whatsappId.toLowerCase().includes(q))
      }
      return customers.sort((a, b) => new Date(b.lastOrderAt || b.createdAt).getTime() - new Date(a.lastOrderAt || a.createdAt).getTime())
    }
  },

  async getById(id: string): Promise<Customer> {
    try {
      const { data } = await api.get<Customer>(`/customers/${id}`)
      return data
    } catch (error) {
      if (!isMockMode(error)) throw error
      const found = getCustomers().find((c) => c.id === id && c.sellerId === getSellerId())
      if (!found) throw new Error("Customer not found")
      return found
    }
  },

  async findByPhone(phone: string): Promise<Customer | null> {
    const all = getCustomers().filter((c) => c.sellerId === getSellerId())
    return all.find((c) => c.phone === phone) || null
  },

  async create(payload: { name: string; phone: string; whatsappId?: string; address?: string; email?: string }): Promise<Customer> {
    try {
      const { data } = await api.post<Customer>("/customers", payload)
      return data
    } catch (error) {
      if (!isMockMode(error)) throw error
      const now = new Date().toISOString()
      const customer: Customer = {
        id: "cust_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
        sellerId: getSellerId(),
        name: payload.name,
        phone: payload.phone,
        whatsappId: payload.whatsappId || payload.phone,
        addresses: payload.address ? [payload.address] : [],
        email: payload.email,
        totalOrders: 0,
        totalSpent: 0,
        createdAt: now,
        updatedAt: now,
      }
      const all = getCustomers()
      all.push(customer)
      saveCustomers(all)
      return customer
    }
  },

  async upsert(payload: { name: string; phone: string; whatsappId?: string; address?: string }): Promise<Customer> {
    const existing = await this.findByPhone(payload.phone)
    if (existing) {
      // update address if new
      if (payload.address && !existing.addresses.includes(payload.address)) {
        existing.addresses.push(payload.address)
        existing.updatedAt = new Date().toISOString()
        const all = getCustomers()
        const idx = all.findIndex((c) => c.id === existing.id)
        if (idx !== -1) {
          all[idx] = existing
          saveCustomers(all)
        }
      }
      return existing
    }
    return this.create(payload)
  },

  // Internal helpers for orderService to update aggregates
  _incrementOnOrder(customerId: string, amount: number) {
    const all = getCustomers()
    const idx = all.findIndex((c) => c.id === customerId && c.sellerId === getSellerId())
    if (idx !== -1) {
      const c = all[idx]
      c.totalOrders += 1
      c.totalSpent += amount
      c.lastOrderAt = new Date().toISOString()
      c.updatedAt = c.lastOrderAt
      all[idx] = c
      saveCustomers(all)
    }
  },

  seedDemo() {
    const sellerId = getSellerId()
    const existing = getCustomers().filter((c) => c.sellerId === sellerId)
    if (existing.length > 0) return
    const now = new Date().toISOString()
    const demo: Customer[] = [
      {
        id: "cust_demo1",
        sellerId,
        name: "Amara Okafor",
        phone: "+2348030000001",
        whatsappId: "+2348030000001",
        addresses: ["12 Allen Avenue, Ikeja, Lagos"],
        totalOrders: 0,
        totalSpent: 0,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: "cust_demo2",
        sellerId,
        name: "Tunde Bayo",
        phone: "+2348020000002",
        whatsappId: "+2348020000002",
        addresses: ["5 Aba Road, Port Harcourt"],
        totalOrders: 0,
        totalSpent: 0,
        createdAt: now,
        updatedAt: now,
      },
    ]
    const all = getCustomers()
    all.push(...demo)
    saveCustomers(all)
  },
}
