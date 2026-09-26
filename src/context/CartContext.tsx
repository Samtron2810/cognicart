import { createContext, useContext, useState, type ReactNode } from "react"

export type CartEntry = { productId: string; sellerId: string; variantId?: string }

type CartContextValue = {
  items: CartEntry[]
  addItem: (item: CartEntry) => void
  removeItem: (index: number) => void
  clear: () => void
}

const CartContext = createContext<CartContextValue | null>(null)

/**
 * A short-lived checkout basket. Catalog, orders, inventory, and payments always
 * come from the backend; basket entries are intentionally kept only in React state.
 */
export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartEntry[]>([])
  const addItem = (item: CartEntry) => setItems((current) => [...current, item])
  const removeItem = (index: number) => setItems((current) => current.filter((_, currentIndex) => currentIndex !== index))
  const clear = () => setItems([])

  return <CartContext.Provider value={{ items, addItem, removeItem, clear }}>{children}</CartContext.Provider>
}

export function useCart() {
  const context = useContext(CartContext)
  if (!context) throw new Error("useCart must be used within CartProvider")
  return context
}
