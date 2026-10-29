import { describe, expect, it, vi, beforeEach, afterEach } from "vitest"
import { render, screen, waitFor } from "@testing-library/react"
import { MemoryRouter, Route, Routes } from "react-router-dom"
import TrackOrder from "./TrackOrder"
import { shopperService } from "../../services/shopperService"
import * as ShopperContext from "../../context/ShopperContext"
import type { ShopperOrder } from "../../types/shopper"

/**
 * The My Orders panel beside the tracking view.
 *
 * The case worth protecting is the contradictory one: if the order list
 * fails to load, the page must not tell a buyer they have no orders while
 * showing them one of their orders.
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
    source: "storefront",
    deliveryAddress: "12 Marina, Lagos",
    store: { name: "Vivid Fashions", slug: "vivid-fashions" },
    items: [
      { productId: "p1", name: "Ankara Wrap Dress", price: 18000, quantity: 1, subtotal: 18000 },
    ],
    ...overrides,
  }) as unknown as ShopperOrder

function mockShopper(isVerified: boolean) {
  vi.spyOn(ShopperContext, "useShopper").mockReturnValue({
    isVerified,
    isLoading: false,
    shopper: null,
  } as unknown as ReturnType<typeof ShopperContext.useShopper>)
}

const renderPage = () =>
  render(
    <MemoryRouter initialEntries={["/track/orders/order-1"]}>
      <Routes>
        <Route path="/track/orders/:id" element={<TrackOrder />} />
      </Routes>
    </MemoryRouter>,
  )

describe("TrackOrder — My Orders panel", () => {
  beforeEach(() => {
    mockShopper(true)
    vi.spyOn(shopperService, "getOrderById").mockResolvedValue(order())
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it("lists the buyer's other orders beside the one being tracked", async () => {
    vi.spyOn(shopperService, "listOrders").mockResolvedValue([
      order(),
      order({ id: "order-2", reference: "#00125" }),
    ])
    renderPage()

    expect(await screen.findByText("My orders")).toBeTruthy()
    expect(await screen.findByRole("link", { name: "#00125" })).toBeTruthy()
  })

  it("marks the order being tracked as the active one", async () => {
    vi.spyOn(shopperService, "listOrders").mockResolvedValue([order()])
    renderPage()

    expect(await screen.findByText(/viewing/)).toBeTruthy()
  })

  it("never claims there are no orders while showing one", async () => {
    // The regression: a failed list left the panel saying "No orders linked
    // to this profile yet" right next to the buyer's order.
    vi.spyOn(shopperService, "listOrders").mockRejectedValue(new Error("offline"))
    renderPage()

    await waitFor(() => {
      expect(screen.getByText("My orders")).toBeTruthy()
    })
    expect(screen.queryByText(/No orders linked to this profile yet/)).toBeNull()
    expect(screen.queryByRole("link", { name: /browse stores/i })).toBeNull()
  })

  it("falls back to the order on screen when the list comes back empty", async () => {
    vi.spyOn(shopperService, "listOrders").mockResolvedValue([])
    renderPage()

    await waitFor(() => {
      expect(screen.queryByText(/No orders linked to this profile yet/)).toBeNull()
    })
    // The panel still shows the order being tracked, marked as active.
    expect(screen.getByText(/viewing/)).toBeTruthy()
  })

  it("still renders the tracking view when the order list fails", async () => {
    vi.spyOn(shopperService, "listOrders").mockRejectedValue(new Error("offline"))
    renderPage()

    // The panel is secondary; tracking must survive its failure.
    expect(await screen.findByText("12 Marina, Lagos")).toBeTruthy()
  })

  it("shows no panel at all to an unverified visitor", async () => {
    mockShopper(false)
    const listOrders = vi.spyOn(shopperService, "listOrders").mockResolvedValue([])
    renderPage()

    expect(await screen.findByText(/Cancel an order/)).toBeTruthy()
    expect(screen.queryByText("My orders")).toBeNull()
    expect(listOrders).not.toHaveBeenCalled()
  })
})
