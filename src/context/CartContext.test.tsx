import { act, renderHook } from "@testing-library/react"
import { beforeEach, describe, expect, it } from "vitest"
import { CartProvider, useCart } from "./CartContext"
import type { ReactNode } from "react"

const wrapper = ({ children }: { children: ReactNode }) => <CartProvider>{children}</CartProvider>

describe("CartContext", () => {
  // The cart now persists to localStorage so a basket survives navigating
  // between stores. That persistence is shared across tests in a file, so
  // each case has to start from an empty basket.
  beforeEach(() => window.localStorage.clear())

  it("increments quantity when the same product is added again", () => {
    const { result } = renderHook(() => useCart(), { wrapper })
    act(() => result.current.addItem({ productId: "p1", sellerId: "s1" }))
    act(() => result.current.addItem({ productId: "p1", sellerId: "s1" }))
    expect(result.current.items).toHaveLength(1)
    expect(result.current.items[0].quantity).toBe(2)
  })

  it("keeps different variants of the same product as separate lines", () => {
    const { result } = renderHook(() => useCart(), { wrapper })
    act(() => result.current.addItem({ productId: "p1", sellerId: "s1", variantId: "red" }))
    act(() => result.current.addItem({ productId: "p1", sellerId: "s1", variantId: "blue" }))
    act(() => result.current.addItem({ productId: "p1", sellerId: "s1", variantId: "red" }))
    expect(result.current.items).toHaveLength(2)
    expect(result.current.items.find((i) => i.variantId === "red")?.quantity).toBe(2)
    expect(result.current.items.find((i) => i.variantId === "blue")?.quantity).toBe(1)
  })

  it("updates quantities directly and removes the line at zero", () => {
    const { result } = renderHook(() => useCart(), { wrapper })
    act(() => result.current.addItem({ productId: "p1", sellerId: "s1" }))
    act(() => result.current.setQuantity(0, 5))
    expect(result.current.items[0].quantity).toBe(5)
    act(() => result.current.setQuantity(0, 0))
    expect(result.current.items).toHaveLength(0)
  })

  it("supports adding with an explicit quantity", () => {
    const { result } = renderHook(() => useCart(), { wrapper })
    act(() => result.current.addItem({ productId: "p1", sellerId: "s1", quantity: 3 }))
    act(() => result.current.addItem({ productId: "p1", sellerId: "s1", quantity: 2 }))
    expect(result.current.items[0].quantity).toBe(5)
  })

  it("holds items from several stores at once", () => {
    const { result } = renderHook(() => useCart(), { wrapper })
    act(() => result.current.addItem({ productId: "p1", sellerId: "s1" }))
    act(() => result.current.addItem({ productId: "p2", sellerId: "s2" }))
    expect(result.current.items).toHaveLength(2)
    expect(result.current.sellerIds).toEqual(["s1", "s2"])
  })

  it("drops a whole store without touching the others", () => {
    const { result } = renderHook(() => useCart(), { wrapper })
    act(() => result.current.addItem({ productId: "p1", sellerId: "s1" }))
    act(() => result.current.addItem({ productId: "p2", sellerId: "s2" }))
    act(() => result.current.removeSeller("s1"))
    expect(result.current.items).toHaveLength(1)
    expect(result.current.items[0].sellerId).toBe("s2")
  })

  it("restores a basket saved by an earlier visit", () => {
    const first = renderHook(() => useCart(), { wrapper })
    act(() => first.result.current.addItem({ productId: "p1", sellerId: "s1", quantity: 2 }))
    first.unmount()

    // A fresh provider stands in for a page reload or a navigation that
    // remounted the tree.
    const second = renderHook(() => useCart(), { wrapper })
    expect(second.result.current.items).toHaveLength(1)
    expect(second.result.current.items[0].quantity).toBe(2)
  })
})
