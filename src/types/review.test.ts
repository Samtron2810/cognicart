import { describe, expect, it } from "vitest"
import { distributionPercent } from "./review"
import type { ReviewSummary } from "./review"

const summary = (distribution: Partial<Record<"1" | "2" | "3" | "4" | "5", number>>): ReviewSummary => {
  const full = { "1": 0, "2": 0, "3": 0, "4": 0, "5": 0, ...distribution }
  const total = Object.values(full).reduce((sum, value) => sum + value, 0)
  const weighted = Object.entries(full).reduce((sum, [star, count]) => sum + Number(star) * count, 0)
  return { average: total ? weighted / total : null, total, distribution: full }
}

describe("distributionPercent", () => {
  it("returns the share of reviews at each star", () => {
    const data = summary({ "5": 6, "4": 3, "1": 1 })
    expect(distributionPercent(data, 5)).toBe(60)
    expect(distributionPercent(data, 4)).toBe(30)
    expect(distributionPercent(data, 1)).toBe(10)
  })

  it("returns 0 for a star nobody chose", () => {
    expect(distributionPercent(summary({ "5": 4 }), 2)).toBe(0)
  })

  it("does not divide by zero when there are no reviews", () => {
    // The histogram renders before any review exists; NaN would reach the DOM
    // as width:NaN% and silently break the bars.
    const empty = summary({})
    for (const star of [1, 2, 3, 4, 5] as const) {
      expect(distributionPercent(empty, star)).toBe(0)
      expect(Number.isNaN(distributionPercent(empty, star))).toBe(false)
    }
  })

  it("never exceeds 100", () => {
    const data = summary({ "5": 12 })
    expect(distributionPercent(data, 5)).toBe(100)
  })
})
