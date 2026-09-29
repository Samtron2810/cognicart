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
import { telegramService } from "./telegramService"

const mockedApi = vi.mocked(api)

beforeEach(() => {
  vi.clearAllMocks()
  window.localStorage.clear()
})

describe("telegramService", () => {
  it("reads masked config from the root-mounted /telegram routes and unwraps the envelope", async () => {
    const config = { connected: true, botUsername: "acme_bot" }
    mockedApi.get.mockResolvedValueOnce({ data: { success: true, data: config } })

    const result = await telegramService.getConfig()

    expect(mockedApi.get).toHaveBeenCalledWith("http://localhost:5000/telegram/config")
    expect(result).toEqual(config)
  })

  it("submits the bot token once on connect and never stores it in the browser", async () => {
    const config = { connected: true, botUsername: "acme_bot" }
    mockedApi.post.mockResolvedValueOnce({ data: { success: true, data: config } })

    const result = await telegramService.connect({ botToken: "123456:SECRET", dropPendingUpdates: true })

    expect(mockedApi.post).toHaveBeenCalledWith("http://localhost:5000/telegram/connect", {
      botToken: "123456:SECRET",
      dropPendingUpdates: true,
    })
    expect(result).toEqual(config)
    // The token must never touch persistent browser storage.
    expect(window.localStorage.length).toBe(0)
    expect(JSON.stringify(window.localStorage)).not.toContain("SECRET")
  })

  it("disconnects with DELETE, matching the backend route", async () => {
    mockedApi.delete.mockResolvedValueOnce({ data: { success: true, data: null } })
    await telegramService.disconnect()
    expect(mockedApi.delete).toHaveBeenCalledWith("http://localhost:5000/telegram/disconnect")
  })

  it("lists conversation messages scoped to a channel user", async () => {
    mockedApi.get.mockResolvedValueOnce({ data: { success: true, count: 1, data: [{ id: "m1" }] } })
    const messages = await telegramService.listMessages({ channelUserId: "42" })
    expect(mockedApi.get).toHaveBeenCalledWith("http://localhost:5000/telegram/messages", {
      params: { channelUserId: "42" },
    })
    expect(messages).toEqual([{ id: "m1" }])
  })

  it("surfaces backend errors instead of fabricating a connection state", async () => {
    mockedApi.post.mockRejectedValueOnce(new Error("Invalid bot token"))
    await expect(telegramService.connect({ botToken: "bad" })).rejects.toThrow("Invalid bot token")
  })
})
