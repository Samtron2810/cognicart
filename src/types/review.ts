export type Review = {
  id: string
  sellerId: string
  orderId: string
  /** null for a store review, set for a review of one product. */
  productId?: string | null
  /** Snapshot of the product name at review time. */
  productName?: string
  /** Already anonymised server-side to "Adaobi N." — never a full name. */
  buyerName: string
  rating: number
  comment: string
  sellerReply?: { text: string; repliedAt: string | null }
  status?: "published" | "hidden"
  /** Always true: a review cannot exist without a delivered order behind it. */
  isVerifiedPurchase: boolean
  createdAt: string
  updatedAt: string
}

export type ReviewSummary = {
  /** null when the store has no published reviews yet. */
  average: number | null
  total: number
  distribution: Record<"1" | "2" | "3" | "4" | "5", number>
}

export type ReviewListResponse = {
  reviews: Review[]
  summary: ReviewSummary
  pagination: { total: number; page: number; limit: number; totalPages: number; hasMore: boolean }
}

/** A delivered order the signed-in buyer has not reviewed yet. */
export type EligibleOrder = {
  orderId: string
  reference: string
  createdAt: string
  itemSummary: string
  /** Present on product eligibility: which store the order was placed with. */
  sellerId?: string
}

export type ReviewEligibility = {
  canReview: boolean
  eligibleOrders: EligibleOrder[]
  /**
   * Product eligibility only. Separates "you never bought this" from "you
   * bought it and already reviewed it" — the page says something different
   * for each, and conflating them reads as a bug to the shopper.
   */
  hasPurchased?: boolean
  hasReviewed?: boolean
}

export type CreateReviewPayload = {
  sellerId: string
  orderId: string
  /** Omit to review the store; set to review one product in that order. */
  productId?: string
  rating: number
  comment?: string
}

/**
 * Percentage width for one bar of the rating histogram.
 * Guards the zero-reviews case so the bars render empty rather than NaN.
 */
export function distributionPercent(summary: ReviewSummary, star: 1 | 2 | 3 | 4 | 5): number {
  if (!summary.total) return 0
  const count = summary.distribution[String(star) as "1" | "2" | "3" | "4" | "5"] || 0
  return Math.round((count / summary.total) * 100)
}
