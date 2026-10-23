import { createContext, useContext, useEffect, useState, type ReactNode } from "react"

export type CartEntry = { productId: string; sellerId: string; variantId?: string; quantity: number }

type AddCartInput = { productId: string; sellerId: string; variantId?: string; quantity?: number }

type CartContextValue = {
  items: CartEntry[]
  addItem: (item: AddCartInput) => void
  removeItem: (index: number) => void
  setQuantity: (index: number, quantity: number) => void
  /** Drop every line from one store, keeping the rest of the basket. */
  removeSeller: (sellerId: string) => void
  clear: () => void
  /** Distinct stores currently in the basket. */
  sellerIds: string[]
}

const CartContext = createContext<CartContextValue | null>(null)

const STORAGE_KEY = "chatstand.cart.v1"

const isSameLine = (a: CartEntry, b: AddCartInput) =>
  a.productId === b.productId && (a.variantId || "") === (b.variantId || "")

/**
 * Read the saved basket, defensively.
 *
 * Anything unparseable or shaped wrong is discarded rather than trusted:
 * this is user-editable storage, and a malformed entry reaching checkout
 * would be a request to the order API built from junk. Prices, stock and
 * totals are never stored here — only which product, which variant, how
 * many — so the backend stays the only authority on what anything costs.
 */
function loadCart(): CartEntry[] {
  if (typeof window === "undefined") return []
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed
      .filter((entry): entry is CartEntry => {
        if (!entry || typeof entry !== "object") return false
        const value = entry as Record<string, unknown>
        return (
          typeof value.productId === "string" &&
          value.productId.length > 0 &&
          typeof value.sellerId === "string" &&
          value.sellerId.length > 0 &&
          typeof value.quantity === "number" &&
          Number.isFinite(value.quantity) &&
          value.quantity > 0
        )
      })
      .map((entry) => ({
        productId: entry.productId,
        sellerId: entry.sellerId,
        variantId: typeof entry.variantId === "string" ? entry.variantId : undefined,
        // Cap a tampered quantity; the backend re-checks stock anyway.
        quantity: Math.min(99, Math.max(1, Math.floor(entry.quantity))),
      }))
      .slice(0, 50)
  } catch {
    return []
  }
}

/**
 * The buyer's basket, which may span several stores.
 *
 * Entries carry `sellerId` so the cart can be grouped by store and checked
 * out as one payment that splits into a sub-order per seller. Catalog,
 * pricing, stock and orders always come from the backend; this holds only
 * the buyer's selection.
 *
 * Persisted to localStorage so a refresh, an accidental back-navigation or
 * a return from Paystack does not empty the basket. Adding the same product
 * and variant again increments that line; different variants stay separate.
 */
export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartEntry[]>(loadCart)

  useEffect(() => {
    if (typeof window === "undefined") return
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
    } catch {
      // Private mode or a full quota: the basket still works for this
      // session, it just will not survive a refresh.
    }
  }, [items])

  const addItem = (item: AddCartInput) =>
    setItems((current) => {
      const quantity = Math.max(1, item.quantity ?? 1)
      const existingIndex = current.findIndex((entry) => isSameLine(entry, item))
      if (existingIndex >= 0) {
        return current.map((entry, index) =>
          index === existingIndex ? { ...entry, quantity: entry.quantity + quantity } : entry,
        )
      }
      return [...current, { productId: item.productId, sellerId: item.sellerId, variantId: item.variantId, quantity }]
    })

  const removeItem = (index: number) =>
    setItems((current) => current.filter((_, currentIndex) => currentIndex !== index))

  const setQuantity = (index: number, quantity: number) =>
    setItems((current) =>
      quantity < 1
        ? current.filter((_, currentIndex) => currentIndex !== index)
        : current.map((entry, currentIndex) => (currentIndex === index ? { ...entry, quantity } : entry)),
    )

  const removeSeller = (sellerId: string) =>
    setItems((current) => current.filter((entry) => entry.sellerId !== sellerId))

  const clear = () => setItems([])

  const sellerIds = [...new Set(items.map((entry) => entry.sellerId))]

  return (
    <CartContext.Provider value={{ items, addItem, removeItem, setQuantity, removeSeller, clear, sellerIds }}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)
  if (!context) throw new Error("useCart must be used within CartProvider")
  return context
}

export const CART_STORAGE_KEY = STORAGE_KEY
