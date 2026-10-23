import { describe, expect, it } from "vitest"
import { render, screen } from "@testing-library/react"
import { MemoryRouter } from "react-router-dom"
import { StoreCard } from "./StoreCard"
import type { StoreCard as StoreCardType } from "../../types/store"

const baseStore: StoreCardType = {
  sellerId: "abc123",
  slug: "vivid-fashions",
  name: "Vivid Fashions",
  description: "Ready-to-wear for work and weekends.",
  logo: "",
  productCount: 12,
  rating: null,
  ratingCount: 0,
  isSponsored: false,
  isNew: false,
  deliveryTime: "1-3 days",
  createdAt: new Date().toISOString(),
}

const renderCard = (store: Partial<StoreCardType> = {}) =>
  render(
    <MemoryRouter>
      <StoreCard store={{ ...baseStore, ...store }} />
    </MemoryRouter>,
  )

describe("StoreCard", () => {
  it("links to the store page, not a product", () => {
    renderCard()
    const link = screen.getByRole("link")
    expect(link).toHaveAttribute("href", "/store/vivid-fashions")
  })

  it("shows the product count", () => {
    renderCard({ productCount: 12 })
    expect(screen.getByText("12 products")).toBeInTheDocument()
  })

  it("singularises a one-product store", () => {
    renderCard({ productCount: 1 })
    expect(screen.getByText("1 product")).toBeInTheDocument()
  })

  it('says "No ratings yet" rather than printing a misleading 0.0', () => {
    // No review system exists yet, so every store starts unrated. Showing
    // 0.0 out of 5 would read as "rated terribly" instead of "not rated".
    renderCard({ rating: null, ratingCount: 0 })
    expect(screen.getByText("No ratings yet")).toBeInTheDocument()
    expect(screen.queryByText(/0\.0/)).not.toBeInTheDocument()
  })

  it("shows the rating and its sample size once the store has one", () => {
    renderCard({ rating: 4.6, ratingCount: 23 })
    expect(screen.getByText("4.6")).toBeInTheDocument()
    expect(screen.getByText("(23)")).toBeInTheDocument()
    expect(screen.queryByText("No ratings yet")).not.toBeInTheDocument()
  })

  it("labels paid placement, so a buyer knows why it ranks high", () => {
    renderCard({ isSponsored: true })
    expect(screen.getByText("SPONSORED")).toBeInTheDocument()
  })

  it("badges a new seller", () => {
    renderCard({ isNew: true })
    expect(screen.getByText("NEW")).toBeInTheDocument()
  })

  it("does not stack SPONSORED and NEW on the same card", () => {
    renderCard({ isNew: true, isSponsored: true })
    expect(screen.getByText("SPONSORED")).toBeInTheDocument()
    expect(screen.queryByText("NEW")).not.toBeInTheDocument()
  })

  it("falls back to placeholder copy when a seller wrote no description", () => {
    renderCard({ description: "" })
    expect(screen.getByText(/has not added a store description/i)).toBeInTheDocument()
  })
})
