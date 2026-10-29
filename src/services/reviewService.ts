import api from "./api"
import type { CreateReviewPayload, Review, ReviewEligibility, ReviewListResponse } from "../types/review"

export const reviewService = {
  /** Published reviews for a store. Public — no session needed. */
  async listForStore(identifier: string, page = 1, limit = 10): Promise<ReviewListResponse> {
    const { data } = await api.get<ReviewListResponse>(`/storefront/${identifier}/reviews`, {
      params: { page, limit },
    })
    return data
  },

  /**
   * Which of the buyer's delivered orders with this seller can still be
   * reviewed. Requires a verified buyer session; callers treat a failure as
   * "not eligible" rather than an error.
   */
  async getEligibility(sellerId: string): Promise<ReviewEligibility> {
    const { data } = await api.get<ReviewEligibility>("/reviews/eligibility", { params: { sellerId } })
    return data
  },

  /** Published reviews for a single product. Public — no session needed. */
  async listForProduct(productId: string, page = 1, limit = 10): Promise<ReviewListResponse> {
    const { data } = await api.get<ReviewListResponse>(`/products/${productId}/reviews`, {
      params: { page, limit },
    })
    return data
  },

  /**
   * Whether the signed-in buyer may review this product, and against which
   * delivered orders. Callers treat a failure as "not eligible".
   */
  async getProductEligibility(productId: string): Promise<ReviewEligibility> {
    const { data } = await api.get<ReviewEligibility>("/reviews/eligibility", { params: { productId } })
    return data
  },

  async create(payload: CreateReviewPayload): Promise<Review> {
    const { data } = await api.post<Review>("/reviews", payload)
    return data
  },

  /** The signed-in seller's own reviews, including moderated ones. */
  async listForDashboard(page = 1, limit = 20): Promise<{ reviews: Review[]; pagination: { total: number } }> {
    const { data } = await api.get<{ reviews: Review[]; pagination: { total: number } }>("/reviews/seller", {
      params: { page, limit },
    })
    return data
  },

  async reply(reviewId: string, text: string): Promise<Review> {
    const { data } = await api.post<Review>(`/reviews/${reviewId}/reply`, { text })
    return data
  },
}
