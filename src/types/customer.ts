export type ChannelIdentity = {
  channel: "telegram"
  externalId: string
  handle?: string
  displayName?: string
  linkedAt?: string
}

export type Customer = {
  id: string
  sellerId: string
  /** Links this per-seller CRM record to the global email-verified buyer identity. */
  shopperId?: string | null
  name: string
  phone: string
  email?: string
  /** Channel identities (e.g. a Telegram account that has started the bot). */
  identities?: ChannelIdentity[]
  addresses: string[]
  totalOrders: number
  totalSpent: number
  marketingOptOut?: boolean
  lastOrderAt?: string
  createdAt: string
  updatedAt: string
}

export type CreateCustomerPayload = {
  name: string
  phone: string
  address?: string
  email?: string
}

export type UpdateCustomerPayload = Partial<CreateCustomerPayload>
