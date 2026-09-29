import { describe, expect, it } from "vitest"
import { buildCheckoutPayload, validateCheckoutCustomer, type CheckoutCustomer } from "./checkout"

const validCustomer: CheckoutCustomer = {
  name: "Ada Obi",
  phone: "+2348012345678",
  email: "Ada.Obi@Example.com",
  address: "12 Aba Road, Port Harcourt",
}

describe("validateCheckoutCustomer", () => {
  it("accepts a complete guest customer", () => {
    expect(validateCheckoutCustomer(validCustomer)).toBeNull()
  })

  it("requires the buyer email for receipts and order history", () => {
    expect(validateCheckoutCustomer({ ...validCustomer, email: "" })).toMatch(/email is required/i)
    expect(validateCheckoutCustomer({ ...validCustomer, email: "   " })).toMatch(/email is required/i)
  })

  it("rejects malformed email addresses", () => {
    expect(validateCheckoutCustomer({ ...validCustomer, email: "not-an-email" })).toMatch(/valid email/i)
    expect(validateCheckoutCustomer({ ...validCustomer, email: "a@b" })).toMatch(/valid email/i)
  })

  it("requires name, phone, and delivery address", () => {
    expect(validateCheckoutCustomer({ ...validCustomer, name: " " })).toMatch(/name/i)
    expect(validateCheckoutCustomer({ ...validCustomer, phone: "" })).toMatch(/phone/i)
    expect(validateCheckoutCustomer({ ...validCustomer, address: "" })).toMatch(/address/i)
  })
})

describe("buildCheckoutPayload", () => {
  it("always submits the buyer email alongside name, phone, and address", () => {
    const payload = buildCheckoutPayload("seller-1", validCustomer, [{ productId: "p1", quantity: 2 }])
    expect(payload.customer).toEqual({
      name: "Ada Obi",
      phone: "+2348012345678",
      email: "ada.obi@example.com",
      address: "12 Aba Road, Port Harcourt",
    })
    expect(payload.deliveryAddress).toBe("12 Aba Road, Port Harcourt")
  })

  it("normalizes email casing and trims whitespace", () => {
    const payload = buildCheckoutPayload(
      "seller-1",
      { ...validCustomer, email: "  BUYER@SHOP.NG  ", name: "  Ada  " },
      [{ productId: "p1" }],
    )
    expect(payload.customer.email).toBe("buyer@shop.ng")
    expect(payload.customer.name).toBe("Ada")
  })

  it("contains no WhatsApp identity fields anywhere", () => {
    const payload = buildCheckoutPayload("seller-1", validCustomer, [{ productId: "p1" }])
    const keys = JSON.stringify(payload).toLowerCase()
    expect(keys).not.toContain("whatsapp")
    expect(Object.keys(payload.customer)).toEqual(["name", "phone", "email", "address"])
  })

  it("defaults quantity to 1 and preserves variant selection", () => {
    const payload = buildCheckoutPayload("seller-1", validCustomer, [
      { productId: "p1" },
      { productId: "p2", variantId: "v9", quantity: 3 },
    ])
    expect(payload.items).toEqual([
      { productId: "p1", variantId: undefined, quantity: 1 },
      { productId: "p2", variantId: "v9", quantity: 3 },
    ])
  })
})
