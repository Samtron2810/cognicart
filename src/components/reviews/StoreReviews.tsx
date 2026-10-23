import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { MessageSquare, ShieldCheck, Star } from "lucide-react"
import { StarRating } from "./StarRating"
import { WriteReview } from "./WriteReview"
import { reviewService } from "../../services/reviewService"
import { useShopper } from "../../context/ShopperContext"
import { distributionPercent } from "../../types/review"
import type { EligibleOrder, Review, ReviewSummary } from "../../types/review"

type StoreReviewsProps = {
  /** Slug or sellerId — whatever the store page was addressed by. */
  identifier: string
  sellerId: string
  storeName: string
  /** Called when the average changes, so the store header can stay in step. */
  onSummaryChange?: (summary: ReviewSummary) => void
}

const STARS = [5, 4, 3, 2, 1] as const

/**
 * The reviews block on a store page: the score breakdown, the list, and the
 * write form for a buyer who has earned the right to post.
 */
export function StoreReviews({ identifier, sellerId, storeName, onSummaryChange }: StoreReviewsProps) {
  const { isVerified } = useShopper()
  const [reviews, setReviews] = useState<Review[]>([])
  const [summary, setSummary] = useState<ReviewSummary>({
    average: null,
    total: 0,
    distribution: { "1": 0, "2": 0, "3": 0, "4": 0, "5": 0 },
  })
  const [eligibleOrders, setEligibleOrders] = useState<EligibleOrder[]>([])
  const [loading, setLoading] = useState(true)

  const load = async () => {
    try {
      const data = await reviewService.listForStore(identifier)
      setReviews(data.reviews)
      setSummary(data.summary)
      onSummaryChange?.(data.summary)
    } catch {
      // A store with no reviews endpoint response is simply a store with no
      // reviews; it must not break the page around it.
      setReviews([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!identifier) return
    setLoading(true)
    void load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [identifier])

  // Eligibility is a buyer-session question, so it is only asked when there
  // is a session to ask about.
  useEffect(() => {
    if (!isVerified || !sellerId) {
      setEligibleOrders([])
      return
    }
    let active = true
    reviewService
      .getEligibility(sellerId)
      .then((result) => {
        if (active) setEligibleOrders(result.eligibleOrders)
      })
      .catch(() => {
        if (active) setEligibleOrders([])
      })
    return () => {
      active = false
    }
  }, [isVerified, sellerId])

  const handleSubmitted = () => {
    setEligibleOrders([])
    void load()
  }

  return (
    <section className="mt-10" id="reviews">
      <h2 className="font-display text-2xl font-bold">Reviews</h2>

      <div className="mt-4 grid gap-5 lg:grid-cols-[320px_1fr]">
        {/* Score summary */}
        <div className="h-fit rounded-2xl border border-[#F3E6D3] bg-white p-5">
          {summary.total === 0 ? (
            <div className="text-center">
              <span className="mx-auto grid h-11 w-11 place-items-center rounded-2xl bg-[#FFF1DA]">
                <Star className="h-5 w-5 text-[#E85D26]" />
              </span>
              <div className="mt-2 font-bold">No ratings yet</div>
              <p className="mt-1 text-xs text-[#6b6b6b]">
                Only buyers with a delivered order from {storeName} can leave one.
              </p>
            </div>
          ) : (
            <>
              <div className="flex items-end gap-3">
                <span className="font-display text-[44px] font-bold leading-none">
                  {(summary.average ?? 0).toFixed(1)}
                </span>
                <div className="pb-1">
                  <StarRating value={summary.average ?? 0} size={16} />
                  <div className="mt-1 text-xs text-[#6b6b6b]">
                    {summary.total} {summary.total === 1 ? "review" : "reviews"}
                  </div>
                </div>
              </div>

              <div className="mt-4 space-y-1.5">
                {STARS.map((star) => (
                  <div key={star} className="flex items-center gap-2">
                    <span className="w-3 text-[11px] font-bold text-[#6b6b6b]">{star}</span>
                    <Star className="h-3 w-3 fill-[#E85D26] text-[#E85D26]" />
                    <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-[#F3E6D3]">
                      <span
                        className="block h-full rounded-full bg-[#E85D26]"
                        style={{ width: `${distributionPercent(summary, star)}%` }}
                      />
                    </span>
                    <span className="w-6 text-right text-[11px] text-[#9a9a9a]">
                      {summary.distribution[String(star) as "1"] || 0}
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}

          <p className="mt-4 inline-flex items-start gap-1.5 border-t border-[#F3E6D3] pt-3 text-[11px] leading-4 text-[#6b6b6b]">
            <ShieldCheck className="mt-px h-3.5 w-3.5 shrink-0 text-[#0B9C74]" />
            Every review here comes from a delivered order. One review per order.
          </p>
        </div>

        {/* Write form + list */}
        <div className="space-y-4">
          {eligibleOrders.length > 0 && (
            <WriteReview
              sellerId={sellerId}
              storeName={storeName}
              eligibleOrders={eligibleOrders}
              onSubmitted={handleSubmitted}
            />
          )}

          {!isVerified && summary.total === 0 && (
            <div className="rounded-2xl border border-dashed border-[#F3E6D3] bg-white p-5 text-sm text-[#6b6b6b]">
              Bought from {storeName} before?{" "}
              <Link to="/track" className="font-bold text-[#0B9C74] underline">
                Verify your email
              </Link>{" "}
              to leave a review.
            </div>
          )}

          {loading ? (
            <div className="grid place-items-center py-10">
              <div className="h-7 w-7 animate-spin rounded-full border-2 border-[#0B9C74] border-t-transparent" />
            </div>
          ) : reviews.length === 0 ? (
            summary.total === 0 && (
              <div className="rounded-2xl border border-[#F3E6D3] bg-white p-8 text-center text-sm text-[#6b6b6b]">
                This store has not been reviewed yet.
              </div>
            )
          ) : (
            <ul className="space-y-3">
              {reviews.map((review) => (
                <li key={review.id} className="rounded-2xl border border-[#F3E6D3] bg-white p-5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <StarRating value={review.rating} />
                      <span className="text-sm font-bold">{review.buyerName}</span>
                      <span className="inline-flex items-center gap-1 rounded-full bg-[#E6F7F1] px-2 py-0.5 text-[10px] font-bold text-[#0B9C74]">
                        <ShieldCheck className="h-2.5 w-2.5" /> VERIFIED PURCHASE
                      </span>
                    </div>
                    <time className="text-[11px] text-[#9a9a9a]" dateTime={review.createdAt}>
                      {new Date(review.createdAt).toLocaleDateString("en-NG", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </time>
                  </div>

                  {review.comment && (
                    <p className="mt-2.5 text-sm leading-6 text-[#2b2b2b]">{review.comment}</p>
                  )}

                  {review.sellerReply?.text && (
                    <div className="mt-3 rounded-xl bg-[#FFFBF5] p-3.5">
                      <div className="flex items-center gap-1.5 text-xs font-bold">
                        <MessageSquare className="h-3.5 w-3.5 text-[#0B9C74]" />
                        {storeName} replied
                      </div>
                      <p className="mt-1 text-sm leading-6 text-[#4a4a4a]">{review.sellerReply.text}</p>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  )
}
