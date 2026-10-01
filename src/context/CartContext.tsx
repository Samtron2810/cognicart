import { createContext, useContext, useState, type ReactNode } from "react"

export type CartEntry = { productId: string; sellerId: string; variantId?: string; quantity: number }

type AddCartInput = { productId: string; sellerId: string; variantId?: string; quantity?: number }

type CartContextValue = {
  items: CartEntry[]
  addItem: (item: AddCartInput) => void
  removeItem: (index: number) => void
  setQuantity: (index: number, quantity: number) => void
  clear: () => void
}

const CartContext = createContext<CartContextValue | null>(null)

const isSameLine = (a: CartEntry, b: AddCartInput) =>
  a.productId === b.productId && (a.variantId || "") === (b.variantId || "")

/**
 * A short-lived checkout basket. Catalog, orders, inventory, and payments always
 * come from the backend; basket entries are intentionally kept only in React state.
 *
 * Adding the same product + variant again increments its quantity instead of
 * duplicating the line; different variants of the same product stay separate.
 * Stock limits are enforced where live product data is available (cart page,
 * product pages) and re-validated at checkout.
 */
export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartEntry[]>([])

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

  const clear = () => setItems([])

  return <CartContext.Provider value={{ items, addItem, removeItem, setQuantity, clear }}>{children}</CartContext.Provider>
}

export function useCart() {
  const context = useContext(CartContext)
  if (!context) throw new Error("useCart must be used within CartProvider")
  return context
}
