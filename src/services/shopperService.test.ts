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
import { shopperService } from "./shopperService"

const mockedApi = vi.mocked(api)

beforeEach(() => {
  vi.clearAllMocks()
  window.localStorage.clear()
})

describe("shopperService (passwordless buyer identity)", () => {
  it("requests an email OTP without any password", async () => {
    mockedApi.post.mockResolvedValueOnce({ data: { success: true, message: "sent", expiresInSeconds: 600 } })

    const result = await shopperService.requestOtp({ phone: "+2348011112222", email: "buyer@x.ng" })

    expect(mockedApi.post).toHaveBeenCalledWith("/shop/auth/request-otp", {
      phone: "+2348011112222",
      email: "buyer@x.ng",
    })
    expect(JSON.stringify(mockedApi.post.mock.calls[0][1]).toLowerCase()).not.toContain("password")
    expect(result.expiresInSeconds).toBe(600)
  })

  it("verifies the OTP and relies on the backend session cookie, not browser storage", async () => {
    const session = { token: "jwt", shopper: { id: "s1", name: "Ada" }, claimed: 2 }
    mockedApi.post.mockResolvedValueOnce({ data: session })

    const result = await shopperService.verifyOtp({ phone: "+2348011112222", email: "buyer@x.ng", code: "123456" })

    expect(mockedApi.post).toHaveBeenCalledWith("/shop/auth/verify-otp", {
      phone: "+2348011112222",
      email: "buyer@x.ng",
      code: "123456",
    })
    expect(result).toEqual(session)
    expect(window.localStorage.length).toBe(0)
  })

  it("redeems a magic-link token from /track?t=...", async () => {
    mockedApi.post.mockResolvedValueOnce({ data: { token: "jwt", shopper: { id: "s1" } } })
    await shopperService.consumeMagicLink("magic-token")
    expect(mockedApi.post).toHaveBeenCalledWith("/shop/auth/magic", { token: "magic-token" })
  })

  it("returns null from me() when no session exists so guest checkout keeps working", async () => {
    mockedApi.get.mockRejectedValueOnce(new Error("401"))
    await expect(shopperService.me()).resolves.toBeNull()
  })

  it("loads the cross-store order history for a verified buyer", async () => {
    mockedApi.get.mockResolvedValueOnce({ data: [{ id: "o1" }] })
    const orders = await shopperService.listOrders({ sellerId: "seller-1" })
    expect(mockedApi.get).toHaveBeenCalledWith("/shop/me/orders", { params: { sellerId: "seller-1" } })
    expect(orders).toEqual([{ id: "o1" }])
  })

  it("logs out through the backend to clear the httpOnly cookie", async () => {
    mockedApi.post.mockResolvedValueOnce({ data: {} })
    await shopperService.logout()
    expect(mockedApi.post).toHaveBeenCalledWith("/shop/auth/logout")
  })
})
