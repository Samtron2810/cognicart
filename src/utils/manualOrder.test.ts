import { describe, expect, it } from "vitest"
import {
  buildManualOrderPayload,
  buildManualOrderUpdatePayload,
  emptyManualItem,
  emptyManualOrderDraft,
  estimateManualOrderTotals,
  validateManualOrderDraft,
  type ManualOrderDraft,
} from "./manualOrder"

function baseDraft(): ManualOrderDraft {
  return {
    ...emptyManualOrderDraft(),
    customerName: "Chidi Eze",
    customerPhone: "+2347010000000",
    deliveryAddress: "4 Market Lane, Aba",
    sourceChannel: "whatsapp",
    items: [
      { ...emptyManualItem(), productId: "prod-1", variantId: "var-1", name: "Ankara Dress", price: "", quantity: "2" },
    ],
  }
}

describe("validateManualOrderDraft", () => {
  it("accepts a valid catalog-item draft", () => {
    expect(validateManualOrderDraft(baseDraft())).toBeNull()
  })

  it("requires customer name, phone, and at least one item", () => {
    expect(validateManualOrderDraft({ ...baseDraft(), customerName: "" })).toMatch(/name/i)
    expect(validateManualOrderDraft({ ...baseDraft(), customerPhone: "" })).toMatch(/phone/i)
    expect(validateManualOrderDraft({ ...baseDraft(), items: [] })).toMatch(/at least one item/i)
  })

  it("requires custom items to carry a name and price", () => {
    const draft = baseDraft()
    draft.items = [{ ...emptyManualItem(true), name: "", price: "5000", quantity: "1" }]
    expect(validateManualOrderDraft(draft)).toMatch(/custom items need a name/i)
    draft.items = [{ ...emptyManualItem(true), name: "Gift wrap", price: "", quantity: "1" }]
    expect(validateManualOrderDraft(draft)).toMatch(/valid price/i)
  })

  it("rejects non-positive quantities and negative negotiated prices", () => {
    const draft = baseDraft()
    draft.items[0].quantity = "0"
    expect(validateManualOrderDraft(draft)).toMatch(/quantity/i)
    draft.items[0].quantity = "2"
    draft.items[0].price = "-10"
    expect(validateManualOrderDraft(draft)).toMatch(/zero or more/i)
  })
})

describe("buildManualOrderPayload", () => {
  it("sends catalog items with product/variant ids and omits price when using catalog pricing", () => {
    const payload = buildManualOrderPayload(baseDraft())
    expect(payload.items).toEqual([
      { productId: "prod-1", variantId: "var-1", price: undefined, quantity: 2 },
    ])
    expect(payload.sourceChannel).toBe("whatsapp")
  })

  it("keeps negotiated prices when the seller typed one", () => {
    const draft = baseDraft()
    draft.items[0].price = "8500"
    const payload = buildManualOrderPayload(draft)
    expect(payload.items[0].price).toBe(8500)
  })

  it("sends custom off-catalog items with name and price, without productId", () => {
    const draft = baseDraft()
    draft.items = [{ ...emptyManualItem(true), name: "Custom cake topper", price: "3000", quantity: "1" }]
    const payload = buildManualOrderPayload(draft)
    expect(payload.items[0]).toEqual({ name: "Custom cake topper", price: 3000, quantity: 1, image: undefined })
    expect(payload.items[0]).not.toHaveProperty("productId")
  })

  it("carries offline payment, source note, delivery, and inventory options", () => {
    const draft: ManualOrderDraft = {
      ...baseDraft(),
      deliveryFee: "1500",
      sourceNote: "Negotiated in DM",
      notes: "Fragile",
      expectedDeliveryDate: "2026-10-05",
      paymentStatus: "Paid",
      paymentMethod: "cash",
      paymentReference: "CASH-99",
      adjustInventory: true,
    }
    const payload = buildManualOrderPayload(draft)
    expect(payload.deliveryFee).toBe(1500)
    expect(payload.sourceNote).toBe("Negotiated in DM")
    expect(payload.notes).toBe("Fragile")
    expect(payload.expectedDeliveryDate).toBe("2026-10-05")
    expect(payload.paymentStatus).toBe("Paid")
    expect(payload.paymentMethod).toBe("cash")
    expect(payload.paymentReference).toBe("CASH-99")
    expect(payload.adjustInventory).toBe(true)
  })
})

describe("buildManualOrderUpdatePayload", () => {
  it("never includes payment fields — offline payment uses the dedicated endpoint", () => {
    const payload = buildManualOrderUpdatePayload({ ...baseDraft(), paymentStatus: "Paid", paymentReference: "X" })
    expect(payload).not.toHaveProperty("paymentStatus")
    expect(payload).not.toHaveProperty("paymentMethod")
    expect(payload).not.toHaveProperty("paymentReference")
  })
})

describe("estimateManualOrderTotals", () => {
  it("uses negotiated prices when present and catalog prices otherwise", () => {
    const draft = baseDraft()
    draft.items.push({ ...emptyManualItem(true), name: "Wrap", price: "500", quantity: "1" })
    draft.deliveryFee = "1000"
    const catalog = new Map([["prod-1::var-1", 4000]])
    const totals = estimateManualOrderTotals(draft, catalog)
    expect(totals.subtotal).toBe(4000 * 2 + 500)
    expect(totals.deliveryFee).toBe(1000)
    expect(totals.total).toBe(9500)
  })
})
