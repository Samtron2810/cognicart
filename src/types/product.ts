export type ProductDiscount = {
  active: boolean
  type: "percentage" | "fixed"
  value: number
}

export type ProductVariant = {
  id: string
  sku?: string
  size?: string
  color?: string
  stock: number
  price?: number
  image?: string
}

export type Product = {
  id: string
  sellerId: string
  name: string
  description: string
  price: number
  currency: string
  stock: number
  category: string
  images: string[]
  isActive: boolean
  discount?: ProductDiscount
  variants?: ProductVariant[]
  createdAt: string
  updatedAt: string
}

export type CreateProductPayload = {
  name: string
  description: string
  price: number
  currency?: string
  stock: number
  category: string
  images: string[]
  isActive: boolean
  discount?: ProductDiscount
  variants?: ProductVariant[]
}

export type UpdateProductPayload = Partial<CreateProductPayload>

export const PRODUCT_CATEGORIES = [
  "Beauty",
  "Fashion",
  "Food",
  "Home",
  "Electronics",
  "Other",
] as const

export type ProductCategory = (typeof PRODUCT_CATEGORIES)[number]

export function getEffectivePrice(product: Product, variant?: ProductVariant | null): number {
  const base = variant?.price ?? product.price
  const d = product.discount
  if (!d || !d.active || !d.value) return base
  if (d.type === "percentage") {
    const pct = Math.min(Math.max(d.value, 0), 90)
    return Math.max(1, Math.round(base * (1 - pct / 100)))
  }
  // fixed
  return Math.max(1, base - Math.min(d.value, base - 1))
}

export function getDisplayPrice(product: Product): { original: number; sale: number | null; hasDiscount: boolean } {
  const sale = getEffectivePrice(product)
  const hasDiscount = !!product.discount?.active && sale < product.price
  return { original: product.price, sale: hasDiscount ? sale : null, hasDiscount }
}

export function getTotalStock(product: Product): number {
  if (product.variants && product.variants.length > 0) {
    return product.variants.reduce((s, v) => s + (v.stock || 0), 0)
  }
  return product.stock
}
