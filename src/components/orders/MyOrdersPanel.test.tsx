import { describe, expect, it } from "vitest"
import { render, screen } from "@testing-library/react"
import { MemoryRouter } from "react-router-dom"
import { MyOrdersPanel } from "./MyOrdersPanel"
import type { ShopperOrder } from "../../types/shopper"

/**
 * "Rate this product" must appear on delivered catalog items and nowhere
 * else, and must point at the product's review form.
 */

const order = (overrides: Partial<ShopperOrder> = {}): ShopperOrder =>
  ({
    id: "order-1",
    sellerId: "seller-1",
    reference: "#00124",
    createdAt: "2026-09-01T10:00:00.000Z",
    total: 42000,
    subtotal: 40500,
    deliveryFee: 1500,
    orderStatus: "Delivered",
    paymentStatus: "Paid",
    store: { name: "Vivid Fashions", slug: "vivid-fashions" },
    items: [
      {
        productId: "p1",
        name: "Ankara Wrap Dress",
        price: 18000,
        quantity: 1,
        subtotal: 18000,
        image: "",
      },
    ],
    ...overrides,
  }) as unknown as ShopperOrder

const renderPanel = (orders: ShopperOrder[], props = {}) =>
  render(
    <MemoryRouter>
      <MyOrdersPanel orders={orders} {...props} />
    </MemoryRouter>,
  )

describe("MyOrdersPanel", () => {
  it("lists the products inside each order, not just the order", () => {
    renderPanel([order()])
    expect(screen.getByText("Ankara Wrap Dress")).toBeTruthy()
    expect(screen.getByText(/#00124/)).toBeTruthy()
  })

  it("offers Rate this product on a delivered item", () => {
    renderPanel([order()])
    const link = screen.getByRole("link", { name: /rate this product/i })
    expect(link.getAttribute("href")).toBe("/store/vivid-fashions/products/p1?review=1")
  })

  it("does not offer rating before delivery", () => {
    renderPanel([order({ orderStatus: "Processing" })])
    expect(screen.queryByRole("link", { name: /rate this product/i })).toBeNull()
  })

  it("does not offer rating on a cancelled order", () => {
    renderPanel([order({ orderStatus: "Cancelled" })])
    expect(screen.queryByRole("link", { name: /rate this product/i })).toBeNull()
  })

  it("skips custom items that have no product page", () => {
    // Sellers can log an order line that was never in the catalog.
    renderPanel([
      order({
        items: [
          { name: "Bespoke alteration", price: 5000, quantity: 1, subtotal: 5000 },
        ] as unknown as ShopperOrder["items"],
      }),
    ])
    expect(screen.getByText("Bespoke alteration")).toBeTruthy()
    expect(screen.queryByRole("link", { name: /rate this product/i })).toBeNull()
  })

  it("falls back to the sellerId when the store has no slug", () => {
    renderPanel([order({ store: { name: "Vivid Fashions" } as ShopperOrder["store"] })])
    const link = screen.getByRole("link", { name: /rate this product/i })
    expect(link.getAttribute("href")).toBe("/store/seller-1/products/p1?review=1")
  })

  it("rates each delivered item separately", () => {
    renderPanel([
      order({
        items: [
          { productId: "p1", name: "Dress", price: 1, quantity: 1, subtotal: 1 },
          { productId: "p2", name: "Tote", price: 1, quantity: 1, subtotal: 1 },
        ] as unknown as ShopperOrder["items"],
      }),
    ])
    expect(screen.getAllByRole("link", { name: /rate this product/i })).toHaveLength(2)
  })

  it("marks the order being viewed and does not link it to itself", () => {
    renderPanel([order()], { activeOrderId: "order-1" })
    expect(screen.getByText(/viewing/)).toBeTruthy()
    expect(screen.queryByRole("link", { name: "#00124" })).toBeNull()
  })

  it("links the other orders in the list", () => {
    renderPanel([order({ id: "order-2", reference: "#00125" })], { activeOrderId: "order-1" })
    const link = screen.getByRole("link", { name: "#00125" })
    expect(link.getAttribute("href")).toBe("/track/orders/order-2")
  })

  it("shows a spinner while loading rather than an empty state", () => {
    renderPanel([], { loading: true })
    expect(screen.queryByText(/No orders linked/)).toBeNull()
  })

  it("invites browsing when there are no orders", () => {
    renderPanel([])
    expect(screen.getByText(/No orders linked/)).toBeTruthy()
    expect(screen.getByRole("link", { name: /browse stores/i }).getAttribute("href")).toBe("/stores")
  })

  it("offers Rate this store on a delivered order", () => {
    // Both ratings feed the directory ranking, so both need a button here.
    renderPanel([order()])
    const link = screen.getByRole("link", { name: /rate vivid fashions/i })
    expect(link.getAttribute("href")).toBe("/store/vivid-fashions?review=1")
  })

  it("offers the store and product ratings independently", () => {
    renderPanel([order()])
    expect(screen.getByRole("link", { name: /rate this product/i })).toBeTruthy()
    expect(screen.getByRole("link", { name: /rate vivid fashions/i })).toBeTruthy()
  })

  it("offers one store rating per order, not one per item", () => {
    renderPanel([
      order({
        items: [
          { productId: "p1", name: "Dress", price: 1, quantity: 1, subtotal: 1 },
          { productId: "p2", name: "Tote", price: 1, quantity: 1, subtotal: 1 },
        ] as unknown as ShopperOrder["items"],
      }),
    ])
    expect(screen.getAllByRole("link", { name: /rate this product/i })).toHaveLength(2)
    expect(screen.getAllByRole("link", { name: /rate vivid fashions/i })).toHaveLength(1)
  })

  it("does not offer a store rating before delivery", () => {
    renderPanel([order({ orderStatus: "Processing" })])
    expect(screen.queryByRole("link", { name: /rate vivid fashions/i })).toBeNull()
  })

  it("falls back to the sellerId for the store rating link", () => {
    renderPanel([order({ store: { name: "Vivid Fashions" } as ShopperOrder["store"] })])
    const link = screen.getByRole("link", { name: /rate vivid fashions/i })
    expect(link.getAttribute("href")).toBe("/store/seller-1?review=1")
  })
})