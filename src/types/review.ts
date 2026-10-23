export type Review = {
  id: string
  sellerId: string
  orderId: string
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
}

export type ReviewEligibility = {
  canReview: boolean
  eligibleOrders: EligibleOrder[]
}

export type CreateReviewPayload = {
  sellerId: string
  orderId: string
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
