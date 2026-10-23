import { describe, expect, it } from "vitest"
import { buildOrderGroupPayload, sellersInCart } from "./checkout"
import type { CheckoutCustomer } from "./checkout"

const customer: CheckoutCustomer = {
  name: "  Adaobi Nwosu  ",
  phone: " 08031234567 ",
  email: "  Adaobi@Example.COM ",
  address: "  12 Aba Road  ",
}

describe("buildOrderGroupPayload", () => {
  it("keeps every line's sellerId so the backend can split the basket", () => {
    const payload = buildOrderGroupPayload(customer, [
      { sellerId: "store-a", productId: "p1", quantity: 2 },
      { sellerId: "store-b", productId: "p2" },
    ])

    expect(payload.items).toHaveLength(2)
    expect(payload.items[0]).toMatchObject({ sellerId: "store-a", productId: "p1", quantity: 2 })
    expect(payload.items[1]).toMatchObject({ sellerId: "store-b", productId: "p2", quantity: 1 })
  })

  it("normalises the customer details", () => {
    const payload = buildOrderGroupPayload(customer, [{ sellerId: "s1", productId: "p1" }])
    expect(payload.customer.name).toBe("Adaobi Nwosu")
    expect(payload.customer.phone).toBe("08031234567")
    expect(payload.customer.email).toBe("adaobi@example.com")
    expect(payload.deliveryAddress).toBe("12 Aba Road")
  })

  it("sends no prices or totals at all", () => {
    // The browser must never be able to state what anything costs. The
    // backend prices each sub-order and returns the authoritative total.
    const payload = buildOrderGroupPayload(customer, [
      { sellerId: "store-a", productId: "p1", quantity: 2 },
    ])
    const serialised = JSON.stringify(payload)

    expect(serialised).not.toMatch(/price|total|amount|subtotal|deliveryFee/i)
    for (const item of payload.items) {
      expect(Object.keys(item).sort()).toEqual(["productId", "quantity", "sellerId", "variantId"])
    }
  })

  it("keeps variants distinct within one store", () => {
    const payload = buildOrderGroupPayload(customer, [
      { sellerId: "s1", productId: "p1", variantId: "red", quantity: 1 },
      { sellerId: "s1", productId: "p1", variantId: "blue", quantity: 2 },
    ])
    expect(payload.items.map((item) => item.variantId)).toEqual(["red", "blue"])
  })
})

describe("sellersInCart", () => {
  it("returns each store once, in the order it was added", () => {
    expect(
      sellersInCart([
        { sellerId: "b" },
        { sellerId: "a" },
        { sellerId: "b" },
        { sellerId: "c" },
      ]),
    ).toEqual(["b", "a", "c"])
  })

  it("handles an empty cart", () => {
    expect(sellersInCart([])).toEqual([])
  })
})
