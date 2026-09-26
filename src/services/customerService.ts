import api from "./api"
import type { CreateCustomerPayload, Customer } from "../types/customer"

export const customerService = {
  async list(params: { search?: string } = {}): Promise<Customer[]> {
    const { data } = await api.get<Customer[]>("/customers", { params })
    return data
  },

  async getById(id: string): Promise<Customer> {
    const { data } = await api.get<Customer>(`/customers/${id}`)
    return data
  },

  async create(payload: CreateCustomerPayload): Promise<Customer> {
    const { data } = await api.post<Customer>("/customers", payload)
    return data
  },
}
