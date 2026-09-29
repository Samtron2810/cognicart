import type { CreateOrderPayload } from "../types/order"

export type CheckoutCustomer = {
  name: string
  phone: string
  email: string
  address: string
}

export type CheckoutItem = { productId: string; variantId?: string; quantity?: number }

export function validateCheckoutCustomer(customer: CheckoutCustomer): string | null {
  if (!customer.name.trim()) return "Full name is required."
  if (!customer.phone.trim()) return "Phone number is required."
  if (!customer.email.trim()) return "Email is required for your receipt and order updates."
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customer.email.trim())) return "Enter a valid email address."
  if (!customer.address.trim()) return "Delivery address is required."
  return null
}

/**
 * Build the guest storefront checkout payload.
 *
 * The buyer's email always travels with their name, phone, and address so the
 * backend can send Brevo transactional email and link future order history.
 * No WhatsApp identity fields exist anywhere in checkout, and no account or
 * password is ever required.
 */
export function buildCheckoutPayload(
  sellerId: string,
  customer: CheckoutCustomer,
  items: CheckoutItem[],
): CreateOrderPayload {
  return {
    sellerId,
    customer: {
      name: customer.name.trim(),
      phone: customer.phone.trim(),
      email: customer.email.trim().toLowerCase(),
      address: customer.address.trim(),
    },
    items: items.map((item) => ({
      productId: item.productId,
      variantId: item.variantId,
      quantity: item.quantity ?? 1,
    })),
    deliveryAddress: customer.address.trim(),
  }
}
