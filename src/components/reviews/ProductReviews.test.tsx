import { describe, expect, it, vi, beforeEach, afterEach } from "vitest"
import { render, screen, waitFor } from "@testing-library/react"
import { MemoryRouter } from "react-router-dom"
import { ProductReviews } from "./ProductReviews"
import { reviewService } from "../../services/reviewService"
import * as ShopperContext from "../../context/ShopperContext"
import type { ReviewListResponse } from "../../types/review"

/**
 * Who sees the review form.
 *
 * The form is a convenience, not the control — the server decides. What is
 * tested here is that the page never *implies* someone can review when they
 * cannot, and that it explains why instead of silently hiding the form.
 */

const EMPTY_LIST: ReviewListResponse = {
  reviews: [],
  summary: { average: null, total: 0, distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } },
  pagination: { total: 0, page: 1, limit: 10, totalPages: 1, hasMore: false },
}

const LIST_WITH_ONE: ReviewListResponse = {
  ...EMPTY_LIST,
  reviews: [
    {
      id: "r1",
      sellerId: "seller-1",
      orderId: "order-1",
      productId: "p1",
      buyerName: "Adaobi N.",
      rating: 5,
      comment: "Fabric is lovely.",
      isVerifiedPurchase: true,
      createdAt: "2026-09-02T10:00:00.000Z",
      updatedAt: "2026-09-02T10:00:00.000Z",
    },
  ],
  summary: { average: 5, total: 1, distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 1 } },
}

function mockShopper(isVerified: boolean) {
  vi.spyOn(ShopperContext, "useShopper").mockReturnValue({
    isVerified,
    shopper: null,
    isLoading: false,
  } as unknown as ReturnType<typeof ShopperContext.useShopper>)
}

const renderSection = (openForm = false) =>
  render(
    <MemoryRouter>
      <ProductReviews
        productId="p1"
        productName="Ankara Wrap Dress"
        sellerId="seller-1"
        storeName="Vivid Fashions"
        openForm={openForm}
      />
    </MemoryRouter>,
  )

describe("ProductReviews", () => {
  beforeEach(() => {
    vi.spyOn(reviewService, "listForProduct").mockResolvedValue(EMPTY_LIST)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it("tells a signed-out visitor to buy the product first", async () => {
    mockShopper(false)
    renderSection()

    expect(await screen.findByText("Buy this product to review it")).toBeTruthy()
    expect(screen.queryByRole("button", { name: /post review/i })).toBeNull()
  })

  it("offers the verify shortcut to a signed-out visitor who already bought", async () => {
    mockShopper(false)
    renderSection()

    expect(await screen.findByRole("link", { name: /verify your email/i })).toBeTruthy()
  })

  it("tells a verified shopper who never bought it to buy it first", async () => {
    mockShopper(true)
    vi.spyOn(reviewService, "getProductEligibility").mockResolvedValue({
      canReview: false,
      eligibleOrders: [],
      hasPurchased: false,
      hasReviewed: false,
    })
    renderSection()

    expect(await screen.findByText("Buy this product to review it")).toBeTruthy()
    // No point offering verification to someone already verified.
    expect(screen.queryByRole("link", { name: /verify your email/i })).toBeNull()
  })

  it("shows the form to a buyer with a delivered order", async () => {
    mockShopper(true)
    vi.spyOn(reviewService, "getProductEligibility").mockResolvedValue({
      canReview: true,
      hasPurchased: true,
      hasReviewed: false,
      eligibleOrders: [
        {
          orderId: "order-1",
          sellerId: "seller-1",
          reference: "#00124",
          createdAt: "2026-09-01T10:00:00.000Z",
          itemSummary: "Ankara Wrap Dress",
        },
      ],
    })
    renderSection()

    expect(await screen.findByRole("button", { name: /post review/i })).toBeTruthy()
    expect(screen.getByText(/Rate Ankara Wrap Dress/)).toBeTruthy()
    expect(screen.queryByText("Buy this product to review it")).toBeNull()
  })

  it("distinguishes 'already reviewed' from 'never bought'", async () => {
    mockShopper(true)
    vi.spyOn(reviewService, "getProductEligibility").mockResolvedValue({
      canReview: false,
      eligibleOrders: [],
      hasPurchased: true,
      hasReviewed: true,
    })
    renderSection()

    expect(await screen.findByText(/already reviewed this product/i)).toBeTruthy()
    expect(screen.queryByText("Buy this product to review it")).toBeNull()
  })

  it("explains the wait when the order has not arrived yet", async () => {
    mockShopper(true)
    vi.spyOn(reviewService, "getProductEligibility").mockResolvedValue({
      canReview: false,
      eligibleOrders: [],
      hasPurchased: true,
      hasReviewed: false,
    })
    renderSection()

    expect(await screen.findByText(/once it is delivered/i)).toBeTruthy()
  })

  it("never shows the form when the eligibility check fails", async () => {
    mockShopper(true)
    vi.spyOn(reviewService, "getProductEligibility").mockRejectedValue(new Error("offline"))
    renderSection()

    await waitFor(() => {
      expect(screen.getByText("Buy this product to review it")).toBeTruthy()
    })
    expect(screen.queryByRole("button", { name: /post review/i })).toBeNull()
  })

  it("lists published reviews with the verified-purchase badge", async () => {
    mockShopper(false)
    vi.spyOn(reviewService, "listForProduct").mockResolvedValue(LIST_WITH_ONE)
    renderSection()

    expect(await screen.findByText("Fabric is lovely.")).toBeTruthy()
    expect(screen.getByText("Adaobi N.")).toBeTruthy()
    expect(screen.getByText("Verified purchase")).toBeTruthy()
    expect(screen.getByText("(1 review)")).toBeTruthy()
  })

  it("says so when a product has no reviews", async () => {
    mockShopper(false)
    renderSection()
    expect(await screen.findByText(/No reviews for this product yet/)).toBeTruthy()
  })
})
