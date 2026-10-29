import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { Lock, MessageSquare } from "lucide-react"
import { StarRating } from "./StarRating"
import { WriteReview } from "./WriteReview"
import { useShopper } from "../../context/ShopperContext"
import { reviewService } from "../../services/reviewService"
import type { EligibleOrder, Review, ReviewSummary } from "../../types/review"

type ProductReviewsProps = {
  productId: string
  productName: string
  sellerId: string
  storeName: string
  /** Open straight into the form — set by ?review=1 from "Rate this product". */
  openForm?: boolean
}

const EMPTY_SUMMARY: ReviewSummary = {
  average: null,
  total: 0,
  distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
}

/**
 * Reviews for one product: the published list, and — only for someone who
 * actually bought and received it — the form.
 *
 * The gate shown to everyone else is deliberately explicit rather than just
 * hiding the form. A shopper who sees no form assumes the feature is broken;
 * a shopper who reads "buy this product to review it" understands the rule
 * and, incidentally, learns that every rating here came from a real sale.
 *
 * Eligibility is only ever a hint for the UI. The real enforcement is in
 * reviewService.create on the server, which re-checks ownership, delivery
 * and that the order contained this product.
 */
export function ProductReviews({
  productId,
  productName,
  sellerId,
  storeName,
  openForm = false,
}: ProductReviewsProps) {
  const { isVerified } = useShopper()
  const [reviews, setReviews] = useState<Review[]>([])
  const [summary, setSummary] = useState<ReviewSummary>(EMPTY_SUMMARY)
  const [loading, setLoading] = useState(true)
  const [eligibleOrders, setEligibleOrders] = useState<EligibleOrder[]>([])
  const [hasPurchased, setHasPurchased] = useState(false)
  const [hasReviewed, setHasReviewed] = useState(false)

  useEffect(() => {
    if (!productId) return
    let active = true
    setLoading(true)

    reviewService
      .listForProduct(productId)
      .then((result) => {
        if (!active) return
        setReviews(result.reviews)
        setSummary(result.summary)
      })
      .catch(() => {
        if (active) setReviews([])
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [productId])

  useEffect(() => {
    if (!isVerified || !productId) {
      setEligibleOrders([])
      setHasPurchased(false)
      setHasReviewed(false)
      return
    }
    let active = true

    reviewService
      .getProductEligibility(productId)
      .then((result) => {
        if (!active) return
        setEligibleOrders(result.eligibleOrders)
        setHasPurchased(Boolean(result.hasPurchased))
        setHasReviewed(Boolean(result.hasReviewed))
      })
      .catch(() => {
        // A failure here must never imply eligibility.
        if (active) setEligibleOrders([])
      })

    return () => {
      active = false
    }
  }, [isVerified, productId])

  const handleSubmitted = (review: Review) => {
    setReviews((current) => [review, ...current])
    setSummary((current) => {
      const total = current.total + 1
      const previous = (current.average ?? 0) * current.total
      return {
        average: Math.round(((previous + review.rating) / total) * 10) / 10,
        total,
        distribution: {
          ...current.distribution,
          [String(review.rating) as "1" | "2" | "3" | "4" | "5"]:
            current.distribution[String(review.rating) as "1" | "2" | "3" | "4" | "5"] + 1,
        },
      }
    })
    setEligibleOrders((current) => current.filter((order) => order.orderId !== review.orderId))
    setHasReviewed(true)
  }

  return (
    <section className="mt-10" id="reviews">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 font-display text-xl font-bold">
          <MessageSquare className="h-5 w-5 text-[#0B9C74]" />
          Reviews
        </h2>
        {summary.total > 0 && (
          <div className="flex items-center gap-2">
            <StarRating value={summary.average ?? 0} />
            <span className="text-sm font-bold">{(summary.average ?? 0).toFixed(1)}</span>
            <span className="text-sm text-[#6b6b6b]">
              ({summary.total} review{summary.total === 1 ? "" : "s"})
            </span>
          </div>
        )}
      </div>

      {/* Write, or an honest explanation of why not. */}
      <div className="mt-4">
        {eligibleOrders.length > 0 ? (
          <WriteReview
            sellerId={eligibleOrders[0].sellerId || sellerId}
            storeName={storeName}
            productId={productId}
            productName={productName}
            eligibleOrders={eligibleOrders}
            onSubmitted={handleSubmitted}
            autoFocus={openForm}
          />
        ) : (
          <div className="rounded-2xl border border-[#F3E6D3] bg-[#FFFBF5] p-5">
            <div className="flex items-start gap-3">
              <Lock className="mt-0.5 h-4 w-4 shrink-0 text-[#9a9a9a]" />
              <div>
                {hasReviewed ? (
                  <>
                    <p className="text-sm font-bold">You have already reviewed this product</p>
                    <p className="mt-0.5 text-xs text-[#6b6b6b]">
                      One review per product per order keeps these ratings worth reading.
                    </p>
                  </>
                ) : hasPurchased ? (
                  <>
                    <p className="text-sm font-bold">You can review this once it is delivered</p>
                    <p className="mt-0.5 text-xs text-[#6b6b6b]">
                      Your order is on its way. The form appears here when it arrives.
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-sm font-bold">Buy this product to review it</p>
                    <p className="mt-0.5 text-xs leading-5 text-[#6b6b6b]">
                      Only shoppers who bought this item and had it delivered can rate it. That is
                      why every review below is from a real purchase.
                    </p>
                    {!isVerified && (
                      <Link
                        to="/track"
                        className="mt-2 inline-flex rounded-full border border-[#F3E6D3] bg-white px-4 py-2 text-xs font-bold hover:bg-[#FFF1DA]"
                      >
                        Already bought it? Verify your email
                      </Link>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* The published list. */}
      {loading ? (
        <div className="grid place-items-center py-10">
          <div className="h-7 w-7 animate-spin rounded-full border-2 border-[#0B9C74] border-t-transparent" />
        </div>
      ) : reviews.length === 0 ? (
        <p className="mt-4 text-sm text-[#6b6b6b]">
          No reviews for this product yet — be the first once yours arrives.
        </p>
      ) : (
        <ul className="mt-4 space-y-3">
          {reviews.map((review) => (
            <li key={review.id} className="rounded-2xl border border-[#F3E6D3] bg-white p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <StarRating value={review.rating} />
                  <span className="text-sm font-bold">{review.buyerName}</span>
                  <span className="rounded-full bg-[#E6F7F1] px-2 py-0.5 text-[10px] font-bold text-[#0B9C74]">
                    Verified purchase
                  </span>
                </div>
                <span className="text-xs text-[#9a9a9a]">
                  {new Date(review.createdAt).toLocaleDateString()}
                </span>
              </div>
              {review.comment && (
                <p className="mt-2 text-sm leading-6 text-[#4a4a4a]">{review.comment}</p>
              )}
              {review.sellerReply?.text && (
                <div className="mt-3 rounded-xl bg-[#FFFBF5] p-3">
                  <div className="text-xs font-bold text-[#0B9C74]">{storeName} replied</div>
                  <p className="mt-0.5 text-sm text-[#4a4a4a]">{review.sellerReply.text}</p>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
