export type Business = {
  id: string
  sellerId: string
  name: string
  description?: string
  phone?: string
  email?: string
  location?: string
  logo?: string
  deliveryInfo?: string
  deliveryFee?: number
  deliveryTime?: string
  freeDeliveryThreshold?: number
  paymentMethod?: "paystack" | "transfer" | "both"
  paystackEnabled?: boolean
  bankName?: string
  accountNumber?: string
  accountName?: string
  whatsappPhone?: string
  whatsappConnected?: boolean
  whatsappVerifiedAt?: string
  createdAt: string
  updatedAt: string
}

export type CreateBusinessPayload = Partial<Omit<Business, "id" | "sellerId" | "createdAt" | "updatedAt">>
