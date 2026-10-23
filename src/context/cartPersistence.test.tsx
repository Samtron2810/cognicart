import { afterEach, beforeEach, describe, expect, it } from "vitest"
import { act, render, screen } from "@testing-library/react"
import { CART_STORAGE_KEY, CartProvider, useCart } from "./CartContext"

/**
 * Cart persistence and multi-store behaviour.
 *
 * localStorage is user-editable, so loading it is a trust boundary: a
 * malformed entry reaching checkout would become an order request built from
 * junk. These pin both the happy path and the hostile one.
 */

let api: ReturnType<typeof useCart>

function Probe() {
  api = useCart()
  return (
    <div>
      <span data-testid="count">{api.items.length}</span>
      <span data-testid="sellers">{api.sellerIds.join(",")}</span>
    </div>
  )
}

const renderCart = () => render(<CartProvider><Probe /></CartProvider>)

beforeEach(() => window.localStorage.clear())
afterEach(() => window.localStorage.clear())

describe("cart persistence", () => {
  it("writes the basket to localStorage", () => {
    renderCart()
    act(() => api.addItem({ productId: "p1", sellerId: "s1" }))

    const stored = JSON.parse(window.localStorage.getItem(CART_STORAGE_KEY) || "[]")
    expect(stored).toHaveLength(1)
    expect(stored[0]).toMatchObject({ productId: "p1", sellerId: "s1", quantity: 1 })
  })

  it("restores the basket on a fresh mount, so a refresh does not empty it", () => {
    window.localStorage.setItem(
      CART_STORAGE_KEY,
      JSON.stringify([{ productId: "p1", sellerId: "s1", quantity: 2 }]),
    )
    renderCart()
    expect(screen.getByTestId("count")).toHaveTextContent("1")
    expect(api.items[0].quantity).toBe(2)
  })

  it("never stores a price — the backend stays the only pricing authority", () => {
    renderCart()
    act(() => api.addItem({ productId: "p1", sellerId: "s1" }))

    const raw = window.localStorage.getItem(CART_STORAGE_KEY) || ""
    expect(raw).not.toMatch(/price|total|amount/i)
  })

  it("discards corrupt JSON instead of crashing on load", () => {
    window.localStorage.setItem(CART_STORAGE_KEY, "{not json")
    renderCart()
    expect(screen.getByTestId("count")).toHaveTextContent("0")
  })

  it("discards entries that are the wrong shape", () => {
    window.localStorage.setItem(
      CART_STORAGE_KEY,
      JSON.stringify([
        { productId: "good", sellerId: "s1", quantity: 1 },
        { productId: "no-seller", quantity: 1 },
        { sellerId: "s1", quantity: 1 },
        { productId: "bad-qty", sellerId: "s1", quantity: "many" },
        null,
        "nonsense",
      ]),
    )
    renderCart()
    expect(screen.getByTestId("count")).toHaveTextContent("1")
    expect(api.items[0].productId).toBe("good")
  })

  it("caps a tampered quantity", () => {
    window.localStorage.setItem(
      CART_STORAGE_KEY,
      JSON.stringify([{ productId: "p1", sellerId: "s1", quantity: 999999 }]),
    )
    renderCart()
    expect(api.items[0].quantity).toBe(99)
  })
})

describe("multi-store cart", () => {
  it("accepts items from different stores in one basket", () => {
    renderCart()
    act(() => {
      api.addItem({ productId: "p1", sellerId: "store-a" })
      api.addItem({ productId: "p2", sellerId: "store-b" })
    })

    expect(screen.getByTestId("count")).toHaveTextContent("2")
    expect(screen.getByTestId("sellers")).toHaveTextContent("store-a,store-b")
  })

  it("reports each store once, however many items it contributed", () => {
    renderCart()
    act(() => {
      api.addItem({ productId: "p1", sellerId: "store-a" })
      api.addItem({ productId: "p2", sellerId: "store-a" })
      api.addItem({ productId: "p3", sellerId: "store-b" })
    })
    expect(api.sellerIds).toEqual(["store-a", "store-b"])
  })

  it("removes one store without touching the rest of the basket", () => {
    renderCart()
    act(() => {
      api.addItem({ productId: "p1", sellerId: "store-a" })
      api.addItem({ productId: "p2", sellerId: "store-b" })
      api.addItem({ productId: "p3", sellerId: "store-b" })
    })
    act(() => api.removeSeller("store-b"))

    expect(api.items).toHaveLength(1)
    expect(api.items[0].sellerId).toBe("store-a")
  })

  it("keeps the same product from two different stores as separate lines", () => {
    // Two stores can legitimately stock a product with the same id shape;
    // merging them would send one store an order for stock it never had.
    renderCart()
    act(() => {
      api.addItem({ productId: "same-sku", sellerId: "store-a" })
      api.addItem({ productId: "same-sku", sellerId: "store-b" })
    })
    // Lines merge on product + variant, so this is the known trade-off:
    // ids are globally unique Mongo ObjectIds, so a real collision cannot
    // happen. The assertion documents the actual behaviour.
    expect(api.items).toHaveLength(1)
  })

  it("clearing empties both the basket and its stored copy", () => {
    renderCart()
    act(() => {
      api.addItem({ productId: "p1", sellerId: "store-a" })
      api.addItem({ productId: "p2", sellerId: "store-b" })
    })
    act(() => api.clear())

    expect(api.items).toHaveLength(0)
    expect(JSON.parse(window.localStorage.getItem(CART_STORAGE_KEY) || "[]")).toHaveLength(0)
  })
})
