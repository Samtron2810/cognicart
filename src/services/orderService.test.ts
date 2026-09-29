import { beforeEach, describe, expect, it, vi } from "vitest"

vi.mock("./api", () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    delete: vi.fn(),
    patch: vi.fn(),
  },
}))

import api from "./api"
import { orderService } from "./orderService"

const mockedApi = vi.mocked(api)

beforeEach(() => {
  vi.clearAllMocks()
})

describe("orderService", () => {
  it("filters the unified list by source and channel", async () => {
    mockedApi.get.mockResolvedValueOnce({ data: [] })
    await orderService.list({ source: "manual", sourceChannel: "whatsapp", paymentStatus: "Pending" })
    expect(mockedApi.get).toHaveBeenCalledWith("/orders", {
      params: { source: "manual", sourceChannel: "whatsapp", paymentStatus: "Pending" },
    })
  })

  it("reads dashboard totals from the backend summary endpoint, never a page of orders", async () => {
    const summary = {
      totals: { orders: 12, grossOrderValue: 90000, paidRevenue: 60000, outstanding: 30000 },
      bySource: [],
      byStatus: [],
      byPaymentStatus: [],
    }
    mockedApi.get.mockResolvedValueOnce({ data: summary })
    const result = await orderService.summary({ from: "2026-09-01" })
    expect(mockedApi.get).toHaveBeenCalledWith("/orders/summary", { params: { from: "2026-09-01" } })
    expect(result.totals.paidRevenue).toBe(60000)
  })

  it("fetches backend-composed share messages as user-opened wa.me links", async () => {
    const share = {
      message: "Your order is confirmed",
      phone: "+2348011112222",
      whatsappUrl: "https://wa.me/2348011112222?text=Your%20order%20is%20confirmed",
      canSend: true,
    }
    mockedApi.get.mockResolvedValueOnce({ data: share })

    const result = await orderService.getShare("o1", "dispatch")

    expect(mockedApi.get).toHaveBeenCalledWith("/orders/o1/share", { params: { variant: "dispatch" } })
    // Share links are wa.me deep links the seller opens themselves —
    // no WhatsApp API endpoint is ever called to deliver them.
    expect(result.whatsappUrl).toMatch(/^https:\/\/wa\.me\//)
    expect(mockedApi.post).not.toHaveBeenCalled()
  })

  it("records offline payment through the manual-only payment endpoint", async () => {
    mockedApi.patch.mockResolvedValueOnce({ data: { id: "o2", paymentStatus: "Paid" } })
    await orderService.updateManualPayment("o2", { paymentStatus: "Paid", paymentMethod: "cash" })
    expect(mockedApi.patch).toHaveBeenCalledWith("/orders/manual/o2/payment", {
      paymentStatus: "Paid",
      paymentMethod: "cash",
    })
  })

  it("propagates the backend 404 when a manual endpoint is used on an automatic order", async () => {
    mockedApi.patch.mockRejectedValueOnce(new Error("Request failed with status code 404"))
    await expect(
      orderService.updateManualPayment("auto-1", { paymentStatus: "Paid" }),
    ).rejects.toThrow("404")
  })
})
