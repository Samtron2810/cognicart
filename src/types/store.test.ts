import { describe, expect, it } from "vitest"
import { productPath, promotedPrice, storePath } from "./store"
import type { PromotedProduct } from "./store"

/**
 * The URL scheme is load-bearing: it is what freed /store/:identifier for the
 * store page, and it has to match the nested shape the backend sitemap and
 * SEO metadata already advertise. These pin it.
 */
describe("storePath", () => {
  it("prefers the slug, because that is what gets shared", () => {
    expect(storePath({ slug: "vivid-fashions", sellerId: "abc123" })).toBe("/store/vivid-fashions")
  })

  it("falls back to the sellerId when a profile has no slug yet", () => {
    expect(storePath({ sellerId: "abc123" })).toBe("/store/abc123")
    expect(storePath({ slug: "", sellerId: "abc123" })).toBe("/store/abc123")
  })
})

describe("productPath", () => {
  it("nests the product under its store", () => {
    expect(productPath({ slug: "vivid-fashions", sellerId: "abc123" }, "p1")).toBe(
      "/store/vivid-fashions/products/p1",
    )
  })

  it("accepts a bare identifier string", () => {
    expect(productPath("vivid-fashions", "p1")).toBe("/store/vivid-fashions/products/p1")
  })

  it("never collides with the store page itself", () => {
    const store = { slug: "vivid-fashions", sellerId: "abc123" }
    expect(productPath(store, "p1")).not.toBe(storePath(store))
    expect(productPath(store, "p1").startsWith(`${storePath(store)}/`)).toBe(true)
  })
})

describe("promotedPrice", () => {
  const base: PromotedProduct = {
    id: "p1",
    name: "Tote",
    price: 10000,
    currency: "NGN",
    image: "",
    discount: null,
    sellerId: "s1",
    storeName: "Vivid Fashions",
    storeSlug: "vivid-fashions",
    storeLogo: "",
  }

  it("returns the list price when there is no discount", () => {
    expect(promotedPrice(base)).toBe(10000)
    expect(promotedPrice({ ...base, discount: { active: false, type: "percentage", value: 20 } })).toBe(10000)
  })

  it("applies a percentage discount", () => {
    expect(promotedPrice({ ...base, discount: { active: true, type: "percentage", value: 20 } })).toBe(8000)
  })

  it("applies a fixed discount", () => {
    expect(promotedPrice({ ...base, discount: { active: true, type: "fixed", value: 2500 } })).toBe(7500)
  })

  it("never produces a free or negative price", () => {
    expect(promotedPrice({ ...base, discount: { active: true, type: "fixed", value: 999999 } })).toBeGreaterThan(0)
    expect(promotedPrice({ ...base, discount: { active: true, type: "percentage", value: 100 } })).toBeGreaterThan(0)
  })
})
