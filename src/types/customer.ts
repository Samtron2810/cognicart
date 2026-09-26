export type Customer = {
  id: string
  sellerId: string
  name: string
  phone: string
  whatsappId: string
  addresses: string[]
  email?: string
  totalOrders: number
  totalSpent: number
  lastOrderAt?: string
  createdAt: string
  updatedAt: string
}

export type CreateCustomerPayload = {
  name: string
  phone: string
  whatsappId?: string
  address?: string
  email?: string
}

export type UpdateCustomerPayload = Partial<CreateCustomerPayload>
