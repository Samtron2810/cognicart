export function isEmail(v: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim())
}

export function isNigerianPhone(v: string) {
  const d = v.replace(/\D/g, "")
  return d.length >= 10 && d.length <= 15
}

export function isStrongPassword(v: string) {
  return v.length >= 8 && /[A-Z]/.test(v) && /[0-9]/.test(v)
}

export function sanitize(str: string, max = 500) {
  return str.trim().slice(0, max).replace(/[<>]/g, "")
}

export function validateBusinessName(v: string) {
  const s = sanitize(v, 80)
  if (s.length < 2) throw new Error("Business name must be at least 2 characters")
  return s
}

export function validateDiscount(d: unknown): import("../types/product").ProductDiscount | undefined {
  if (d == null) return undefined
  const disc = d as { active?: unknown; type?: unknown; value?: unknown }
  if (!disc.active) return { active: false, type: "percentage", value: 0 }
  const active = !!disc.active
  const type = disc.type === "fixed" ? "fixed" : "percentage"
  const value = Number(disc.value)
  if (!Number.isFinite(value) || value <= 0) throw new Error("Discount value must be > 0")
  if (type === "percentage" && (value < 1 || value > 90)) throw new Error("Percentage discount must be 1 - 90")
  if (type === "fixed" && (value < 100 || value > 5000000)) throw new Error("Fixed discount must be ₦100 - ₦5,000,000")
  return { active, type, value: Math.round(value) }
}

export function validateVariants(variants: unknown): import("../types/product").ProductVariant[] | undefined {
  if (variants == null) return undefined
  if (!Array.isArray(variants)) throw new Error("Variants must be an array")
  if (variants.length === 0) return []
  if (variants.length > 20) throw new Error("Max 20 variants")
  return variants.map((raw, idx) => {
    const v = raw as Record<string, unknown>
    const id = typeof v.id === "string" && v.id ? sanitize(v.id, 40) : `var_${idx}_${Date.now().toString(36)}`
    const size = v.size ? sanitize(String(v.size), 20) : undefined
    const color = v.color ? sanitize(String(v.color), 20) : undefined
    const sku = v.sku ? sanitize(String(v.sku), 40) : undefined
    if (!size && !color && !sku) throw new Error(`Variant ${idx + 1}: provide at least size, color or SKU`)
    const stock = Number(v.stock)
    if (!Number.isInteger(stock) || stock < 0 || stock > 100000) throw new Error(`Variant ${idx + 1}: stock 0 - 100,000`)
    let price: number | undefined
    if (v.price !== undefined && v.price !== null && v.price !== "") {
      const p = Number(v.price)
      if (!Number.isFinite(p) || p < 100 || p > 5000000) throw new Error(`Variant ${idx + 1}: price ₦100 - ₦5,000,000`)
      price = Math.round(p)
    }
    const image = v.image ? sanitize(String(v.image), 2000) : undefined
    return { id, sku, size, color, stock, price, image }
  })
}

export function validateProductPayload(p: {
  name: string
  description: string
  price: number
  stock: number
  images: string[]
  discount?: unknown
  variants?: unknown
}) {
  const name = sanitize(p.name, 80)
  if (name.length < 2) throw new Error("Product name too short")
  const desc = sanitize(p.description, 2000)
  if (desc.length < 10) throw new Error("Description too short (10+ chars)")
  if (!Number.isFinite(p.price) || p.price < 100 || p.price > 5000000) throw new Error("Price must be ₦100 - ₦5,000,000")
  if (!Number.isInteger(p.stock) || p.stock < 0 || p.stock > 100000) throw new Error("Stock must be 0 - 100,000")
  if (!Array.isArray(p.images) || p.images.length === 0) throw new Error("At least one image required")
  if (p.images.length > 5) throw new Error("Max 5 images")
  const discount = validateDiscount(p.discount)
  const variants = validateVariants(p.variants)
  // if variants present, product stock should equal sum variants or be ignored - we compute but allow caller to pass stock as sum
  if (variants && variants.length > 0) {
    const sum = variants.reduce((s, v) => s + v.stock, 0)
    // if stock mismatch, we normalize to sum to keep truth
    if (p.stock !== sum) {
      // not throw, just correct via caller
    }
  }
  return { name, description: desc, price: Math.round(p.price), stock: p.stock, images: p.images, discount, variants }
}

export function validateCustomer(p: { name: string; phone: string; address?: string }) {
  const name = sanitize(p.name, 80)
  if (name.length < 2) throw new Error("Customer name too short")
  if (!isNigerianPhone(p.phone)) throw new Error("Invalid phone number")
  const address = p.address ? sanitize(p.address, 200) : ""
  if (address && address.length < 8) throw new Error("Address too short")
  return { name, phone: p.phone.trim(), address }
}

export function validateOrderItems(items: Array<{ productId: string; quantity: number; variantId?: string }>) {
  if (!Array.isArray(items) || items.length === 0) throw new Error("No items")
  if (items.length > 20) throw new Error("Max 20 items per order")
  for (const it of items) {
    if (!it.productId || typeof it.productId !== "string") throw new Error("Invalid productId")
    if (it.variantId !== undefined && typeof it.variantId !== "string") throw new Error("Invalid variantId")
    if (it.variantId && it.variantId.length > 50) throw new Error("variantId too long")
    if (!Number.isInteger(it.quantity) || it.quantity < 1 || it.quantity > 100) throw new Error("Quantity must be 1-100")
  }
  return items
}

export function clampRequestSize(json: string, limitKb = 500) {
  const sizeKb = new Blob([json]).size / 1024
  if (sizeKb > limitKb) throw new Error(`Payload too large (${Math.round(sizeKb)}KB > ${limitKb}KB)`)
}
