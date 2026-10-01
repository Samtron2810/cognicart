import { useEffect, useState } from "react"
import { useSearchParams } from "react-router-dom"
import { CheckCircle, XCircle, RefreshCw, MessageCircle } from "lucide-react"
import { paymentService } from "../../services/paymentService"

type State = "verifying" | "success" | "refunded" | "refund_pending" | "failed"

/**
 * /checkout/done — lightweight payment confirmation page.
 *
 * Used as the redirect target for Telegram bot payments specifically.
 * No Header, no Footer, no cart — just a focused result screen that
 * works cleanly inside Telegram's mini browser (WebApp or embedded link).
 *
 * The backend paymentCallback redirects here (instead of /checkout) when
 * the order source is "telegram". The reference is always in the URL so
 * this page can independently verify if needed.
 */
export default function PaymentDone() {
  const [searchParams] = useSearchParams()
  const paymentParam = searchParams.get("payment") as State | null
  const reference = searchParams.get("reference") || ""
  const [state, setState] = useState<State>(paymentParam ?? "verifying")
  const [verified, setVerified] = useState(false)

  useEffect(() => {
    if (!reference || verified) return

    if (state === "success" || state === "refunded" || state === "refund_pending") {
      // Backend already reconciled — background confirm, no UI change
      paymentService.verify(reference).catch(() => {}).finally(() => setVerified(true))
      return
    }

    // No param or "failed" with reference — attempt verify
    setState("verifying")
    paymentService.verify(reference)
      .then(() => { setState("success"); setVerified(true) })
      .catch(() => { setState("failed"); setVerified(true) })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reference])

  const screens: Record<State, { icon: React.ReactNode; title: string; body: string; accent: string }> = {
    verifying: {
      icon: <div className="h-10 w-10 animate-spin rounded-full border-[3px] border-[#0B9C74] border-t-transparent" />,
      title: "Confirming payment…",
      body: "This takes just a moment.",
      accent: "#0B9C74",
    },
    success: {
      icon: <CheckCircle className="h-12 w-12 text-[#0B9C74]" />,
      title: "Payment confirmed",
      body: "Your order is placed. The seller has been notified and will reach out on Telegram with updates.",
      accent: "#0B9C74",
    },
    refunded: {
      icon: <RefreshCw className="h-12 w-12 text-purple-500" />,
      title: "Payment refunded",
      body: "Your payment was refunded because the order was cancelled. It should appear in your account within 5–10 business days.",
      accent: "#8b5cf6",
    },
    refund_pending: {
      icon: <RefreshCw className="h-12 w-12 text-purple-500" />,
      title: "Refund in progress",
      body: "A refund is being processed and may take 5–10 business days to appear in your account.",
      accent: "#8b5cf6",
    },
    failed: {
      icon: <XCircle className="h-12 w-12 text-red-500" />,
      title: "Payment unsuccessful",
      body: "Your payment did not go through. You have not been charged. Go back to the bot and type PAY to try again.",
      accent: "#ef4444",
    },
  }

  const screen = screens[state]

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-6 py-12"
      style={{ background: "#FFFBF5" }}
    >
      <div className="w-full max-w-sm">
        {/* Brand mark */}
        <div className="mb-8 text-center">
          <span className="inline-block rounded-2xl bg-[#0B9C74] px-4 py-1.5 text-sm font-bold text-white tracking-wide">
            Cognicart
          </span>
        </div>

        {/* Status card */}
        <div
          className="rounded-[24px] border bg-white p-8 text-center shadow-sm"
          style={{ borderColor: "#F3E6D3" }}
        >
          <div className="flex justify-center">{screen.icon}</div>
          <h1
            className="mt-4 text-xl font-bold tracking-tight"
            style={{ color: "#1a1a1a", fontFamily: "'Instrument Serif', Georgia, serif" }}
          >
            {screen.title}
          </h1>
          <p className="mt-2 text-sm leading-6" style={{ color: "#6b6b6b" }}>
            {screen.body}
          </p>

          {reference && state !== "verifying" && (
            <p className="mt-4 font-mono text-[11px]" style={{ color: "#b0b0b0" }}>
              Ref: {reference}
            </p>
          )}
        </div>

        {/* Return to Telegram prompt */}
        {state !== "verifying" && (
          <div
            className="mt-4 flex items-center gap-3 rounded-2xl border p-4"
            style={{ borderColor: "#E3F3FB", background: "#F0F9FF" }}
          >
            <MessageCircle className="h-5 w-5 shrink-0" style={{ color: "#229ED9" }} />
            <p className="text-xs leading-5" style={{ color: "#4a6b7a" }}>
              Return to Telegram to see your order update from the bot.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
