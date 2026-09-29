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
import { campaignService } from "./campaignService"

const mockedApi = vi.mocked(api)

beforeEach(() => {
  vi.clearAllMocks()
})

describe("campaignService (Telegram broadcasts)", () => {
  it("always creates campaigns on the telegram channel", async () => {
    mockedApi.post.mockResolvedValueOnce({ data: { id: "c1" } })

    await campaignService.create({ title: "Restock", message: "New arrivals!", segment: "VIP" })

    expect(mockedApi.post).toHaveBeenCalledWith("/campaigns", {
      title: "Restock",
      message: "New arrivals!",
      segment: "VIP",
      channel: "telegram",
    })
  })

  it("passes custom audiences through customerIds", async () => {
    mockedApi.post.mockResolvedValueOnce({ data: { id: "c2" } })
    await campaignService.create({ title: "T", message: "M", segment: "CUSTOM", customerIds: ["a", "b"] })
    expect(mockedApi.post.mock.calls[0][1]).toMatchObject({ segment: "CUSTOM", customerIds: ["a", "b"] })
  })

  it("previews a segment audience before sending", async () => {
    const preview = { segment: "INACTIVE", totalAudience: 3, customers: [] }
    mockedApi.get.mockResolvedValueOnce({ data: preview })
    const result = await campaignService.previewSegment("INACTIVE")
    expect(mockedApi.get).toHaveBeenCalledWith("/campaigns/segments/INACTIVE/preview")
    expect(result).toEqual(preview)
  })

  it("sends only through the explicit send endpoint — there is no scheduler", async () => {
    mockedApi.post.mockResolvedValueOnce({ data: { id: "c1", status: "completed" } })
    await campaignService.send("c1")
    expect(mockedApi.post).toHaveBeenCalledWith("/campaigns/c1/send")
  })

  it("surfaces send conflicts (already sent / zero recipients) to the caller", async () => {
    mockedApi.post.mockRejectedValueOnce(new Error("Campaign already completed"))
    await expect(campaignService.send("c1")).rejects.toThrow("already completed")
  })

  it("triggers abandoned Telegram order reminders on demand", async () => {
    mockedApi.post.mockResolvedValueOnce({ data: { success: true, remindersSentCount: 2, reminders: [] } })
    const result = await campaignService.triggerAbandonedReminders(90)
    expect(mockedApi.post).toHaveBeenCalledWith("/campaigns/abandoned-orders/trigger", { ageMinutes: 90 })
    expect(result.remindersSentCount).toBe(2)
  })
})
