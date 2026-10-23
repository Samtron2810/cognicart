import { useState } from "react"
import { toast } from "sonner"
import { PenLine } from "lucide-react"
import { StarPicker } from "./StarRating"
import { reviewService } from "../../services/reviewService"
import { getApiErrorMessage } from "../../services/apiError"
import type { EligibleOrder, Review } from "../../types/review"

type WriteReviewProps = {
  sellerId: string
  storeName: string
  eligibleOrders: EligibleOrder[]
  onSubmitted: (review: Review) => void
}

/**
 * Review form, shown only to a buyer who has a delivered order from this
 * store that they have not reviewed yet.
 *
 * The order being reviewed is named explicitly. "Rate this store" invites a
 * mood; "how did order #00124 go" invites a report.
 */
export function WriteReview({ sellerId, storeName, eligibleOrders, onSubmitted }: WriteReviewProps) {
  const [orderId, setOrderId] = useState(eligibleOrders[0]?.orderId || "")
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState("")
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!rating) {
      toast.error("Choose a rating from 1 to 5 stars")
      return
    }
    if (!orderId) {
      toast.error("Choose which order you are reviewing")
      return
    }

    setSubmitting(true)
    try {
      const review = await reviewService.create({ sellerId, orderId, rating, comment: comment.trim() })
      toast.success("Thanks — your review is live")
      setRating(0)
      setComment("")
      onSubmitted(review)
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Could not submit your review"))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl border border-[#F3E6D3] bg-white p-5">
      <div className="flex items-center gap-2">
        <PenLine className="h-4 w-4 text-[#0B9C74]" />
        <h3 className="font-display text-lg font-bold">Review {storeName}</h3>
      </div>
      <p className="mt-1 text-xs text-[#6b6b6b]">
        You can review this store because an order from them was delivered to you.
      </p>

      {eligibleOrders.length > 1 && (
        <label className="mt-4 block">
          <span className="text-xs font-bold text-[#1a1a1a]">Which order?</span>
          <select
            value={orderId}
            onChange={(event) => setOrderId(event.target.value)}
            className="mt-1 w-full rounded-xl border border-[#F3E6D3] px-3 py-2.5 text-sm outline-none focus:border-[#0B9C74]"
          >
            {eligibleOrders.map((order) => (
              <option key={order.orderId} value={order.orderId}>
                {order.reference || "Order"} — {order.itemSummary || "items"}
              </option>
            ))}
          </select>
        </label>
      )}

      {eligibleOrders.length === 1 && eligibleOrders[0].itemSummary && (
        <p className="mt-3 rounded-xl bg-[#FFFBF5] px-3 py-2 text-xs text-[#6b6b6b]">
          Reviewing {eligibleOrders[0].reference || "your order"}: {eligibleOrders[0].itemSummary}
        </p>
      )}

      <div className="mt-4">
        <span className="text-xs font-bold text-[#1a1a1a]">Your rating</span>
        <div className="mt-1">
          <StarPicker value={rating} onChange={setRating} disabled={submitting} />
        </div>
      </div>

      <label className="mt-4 block">
        <span className="text-xs font-bold text-[#1a1a1a]">Anything else? (optional)</span>
        <textarea
          value={comment}
          onChange={(event) => setComment(event.target.value.slice(0, 1000))}
          rows={3}
          placeholder="How was the product, the packaging and the delivery?"
          className="mt-1 w-full resize-y rounded-xl border border-[#F3E6D3] px-3 py-2.5 text-sm outline-none focus:border-[#0B9C74]"
        />
        <span className="mt-1 block text-right text-[11px] text-[#9a9a9a]">{comment.length}/1000</span>
      </label>

      <button
        type="submit"
        disabled={submitting}
        className="mt-2 inline-flex items-center justify-center rounded-full bg-[#0B9C74] px-6 py-2.5 text-sm font-bold text-white transition hover:bg-[#0a8a66] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {submitting ? "Posting…" : "Post review"}
      </button>
    </form>
  )
}
