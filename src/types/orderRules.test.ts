import { describe, expect, it } from "vitest"
import {
  MANUAL_CHANNELS,
  ORDER_SOURCES,
  canEditLineItems,
  canRecordOfflinePayment,
  isManualOrder,
} from "./order"

describe("order source rules", () => {
  it("recognizes only manual orders as manual", () => {
    expect(isManualOrder({ source: "manual" })).toBe(true)
    expect(isManualOrder({ source: "storefront" })).toBe(false)
    expect(isManualOrder({ source: "telegram" })).toBe(false)
  })

  it("allows line-item editing only on manual orders", () => {
    expect(canEditLineItems({ source: "manual" })).toBe(true)
    expect(canEditLineItems({ source: "storefront" })).toBe(false)
    expect(canEditLineItems({ source: "telegram" })).toBe(false)
  })

  it("allows offline payment recording only on manual orders", () => {
    expect(canRecordOfflinePayment({ source: "manual" })).toBe(true)
    expect(canRecordOfflinePayment({ source: "storefront" })).toBe(false)
    expect(canRecordOfflinePayment({ source: "telegram" })).toBe(false)
  })

  it("matches the backend source and manual-channel enums", () => {
    expect([...ORDER_SOURCES]).toEqual(["storefront", "telegram", "manual"])
    expect([...MANUAL_CHANNELS]).toEqual([
      "whatsapp",
      "instagram",
      "facebook",
      "tiktok",
      "x",
      "snapchat",
      "phone_call",
      "sms",
      "email",
      "walk_in",
      "referral",
      "other",
    ])
  })
})
