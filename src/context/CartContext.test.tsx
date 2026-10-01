import { act, renderHook } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import { CartProvider, useCart } from "./CartContext"
import type { ReactNode } from "react"

const wrapper = ({ children }: { children: ReactNode }) => <CartProvider>{children}</CartProvider>

describe("CartContext", () => {
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
})
