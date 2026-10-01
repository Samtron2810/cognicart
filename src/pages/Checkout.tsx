import { useEffect, useState } from "react"
import { Link, useSearchParams } from "react-router-dom"
import { CheckCircle, XCircle, RefreshCw, Clock } from "lucide-react"
import { paymentService } from "../services/paymentService"
import Cart from "./Cart"
import { getApiErrorMessage } from "../services/apiError"

type ReturnState = "success" | "failed" | "refunded" | "refund_pending" | "verifying" | null

/**
 * /checkout — dual purpose:
 *   1. Cart + checkout form (when no ?payment param present)
 *   2. Payment return landing after Paystack redirects back here via the
 *      backend callback. Works whether the buyer is logged in or not,
 *      and works inside Telegram's mini browser without any session.
 *
 * The backend already verified the transaction server-to-server inside
 * paymentCallback() before redirecting here. This page:
 *   - Shows an appropriate status screen immediately.
 *   - Calls verify once more in the background as a safety net (idempotent).
 *   - Handles the tab-close edge case: if the buyer closed the tab before
 *     the backend callback fired but the reference is in the URL, we call
 *     verify which marks the order Paid on the spot.
 */
export default function Checkout() {
  const [searchParams] = useSearchParams()
  const paymentParam = searchParams.get("payment") as ReturnState
  const reference = searchParams.get("reference") || ""

  const [state, setState] = useState<ReturnState>(paymentParam)
  const [verified, setVerified] = useState(false)
  const [verifyError, setVerifyError] = useState<string | null>(null)

  // When we have a reference in the URL, call verify once as a safety net.
  // This handles: buyer closed tab before backend callback could redirect them,
  // Telegram mini browser closing before redirect, or any transient backend hiccup.
  // paymentService.verify() is fully idempotent — safe to call multiple times.
  useEffect(() => {
    if (!reference || verified) return
    if (state === "success" || state === "refunded" || state === "refund_pending") {
      // Backend already reconciled via callback — just confirm in the background
      paymentService.verify(reference)
        .then(() => setVerified(true))
        .catch(() => setVerified(true)) // Silently ignore; callback already did the work
      return
    }
    if (state === "failed" || !paymentParam) return

    // Unknown or missing state but reference present — verify to find out
    setState("verifying")
    paymentService.verify(reference)
      .then(() => {
        setState("success")
        setVerified(true)
      })
      .catch((err) => {
        setState("failed")
        setVerifyError(getApiErrorMessage(err, "Payment could not be verified."))
        setVerified(true)
      })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reference])

  // No payment param — show the normal cart/checkout form
  if (!paymentParam && state === null) {
    return <Cart />
  }

  if (state === "verifying") {
    return (
      <div className="min-h-[70vh] grid place-items-center bg-[#FFFBF5] px-4">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-2 border-[#0B9C74] border-t-transparent" />
          <h1 className="font-display mt-5 text-2xl font-bold">Confirming your payment…</h1>
          <p className="mt-2 text-sm text-[#6b6b6b]">This only takes a moment.</p>
        </div>
      </div>
    )
  }

  if (state === "success") {
    return (
      <div className="min-h-[70vh] grid place-items-center bg-[#FFFBF5] px-4">
        <div className="w-full max-w-md text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#E6F7F1]">
            <CheckCircle className="h-8 w-8 text-[#0B9C74]" />
          </div>
          <h1 className="font-display mt-5 text-2xl font-bold">Payment confirmed</h1>
          <p className="mt-2 text-sm leading-6 text-[#6b6b6b]">
            Your order is placed and the seller has been notified. Check your email for the receipt and tracking updates.
          </p>
          {reference && (
            <p className="mt-3 font-mono text-xs text-[#9a9a9a]">Ref: {reference}</p>
          )}
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link
              to="/track"
              className="inline-flex items-center gap-2 rounded-full bg-[#0B9C74] px-6 py-3 text-sm font-bold text-white hover:bg-[#0a8a66]"
            >
              Track your order
            </Link>
            <Link
              to="/store"
              className="inline-flex items-center gap-2 rounded-full border border-[#F3E6D3] bg-white px-6 py-3 text-sm font-bold hover:bg-[#FFF1DA]"
            >
              Continue shopping
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (state === "refunded" || state === "refund_pending") {
    return (
      <div className="min-h-[70vh] grid place-items-center bg-[#FFFBF5] px-4">
        <div className="w-full max-w-md text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-purple-50">
            <RefreshCw className="h-8 w-8 text-purple-600" />
          </div>
          <h1 className="font-display mt-5 text-2xl font-bold">
            {state === "refunded" ? "Payment refunded" : "Refund in progress"}
          </h1>
          <p className="mt-2 text-sm leading-6 text-[#6b6b6b]">
            {state === "refunded"
              ? "Your payment was refunded because the order was cancelled. It should appear in your account within 5–10 business days."
              : "A refund is being processed. It may take a few minutes to initiate and 5–10 business days to appear in your account."}
          </p>
          {reference && (
            <p className="mt-3 font-mono text-xs text-[#9a9a9a]">Ref: {reference}</p>
          )}
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link
              to="/track"
              className="inline-flex items-center gap-2 rounded-full bg-[#0B9C74] px-6 py-3 text-sm font-bold text-white hover:bg-[#0a8a66]"
            >
              View order history
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // "failed" or any unrecognised state
  return (
    <div className="min-h-[70vh] grid place-items-center bg-[#FFFBF5] px-4">
      <div className="w-full max-w-md text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-50">
          <XCircle className="h-8 w-8 text-red-500" />
        </div>
        <h1 className="font-display mt-5 text-2xl font-bold">Payment unsuccessful</h1>
        <p className="mt-2 text-sm leading-6 text-[#6b6b6b]">
          {verifyError || "Your payment did not complete. Your order has not been placed and you have not been charged."}
        </p>
        {reference && (
          <p className="mt-3 font-mono text-xs text-[#9a9a9a]">Ref: {reference}</p>
        )}
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link
            to="/cart"
            className="inline-flex items-center gap-2 rounded-full bg-[#0B9C74] px-6 py-3 text-sm font-bold text-white hover:bg-[#0a8a66]"
          >
            Try again
          </Link>
          <Link
            to="/track"
            className="inline-flex items-center gap-2 rounded-full border border-[#F3E6D3] bg-white px-6 py-3 text-sm font-bold hover:bg-[#FFF1DA]"
          >
            <Clock className="h-4 w-4" /> Check existing orders
          </Link>
        </div>
      </div>
    </div>
  )
}
