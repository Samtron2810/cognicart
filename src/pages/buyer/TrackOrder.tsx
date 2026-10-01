import { useEffect, useState } from "react"
import { Link, useParams } from "react-router-dom"
import { AlertTriangle, ArrowLeft, MapPin, Package, Store, X } from "lucide-react"
import { useShopper } from "../../context/ShopperContext"
import { shopperService } from "../../services/shopperService"
import type { ShopperOrder } from "../../types/shopper"

type CancelMode = "idle" | "confirm" | "guest_form" | "submitting" | "done"

function isCancellable(order: ShopperOrder) {
  return (
    order.source !== "manual" &&
    ["Pending", "Confirmed"].includes(order.orderStatus) &&
    order.paymentStatus !== "Paid" &&
    order.paymentStatus !== "Refunded" &&
    order.orderStatus !== "Cancelled"
  )
}

/** Single owned order for a verified buyer — with buyer self-cancel. */
export default function TrackOrder() {
  const { id } = useParams<{ id: string }>()
  const { isVerified, isLoading } = useShopper()
  const [order, setOrder] = useState<ShopperOrder | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Cancel state
  const [cancelMode, setCancelMode] = useState<CancelMode>("idle")
  const [cancelReason, setCancelReason] = useState("")
  const [guestEmail, setGuestEmail] = useState("")
  const [guestOrderRef, setGuestOrderRef] = useState("")
  const [cancelError, setCancelError] = useState<string | null>(null)

  useEffect(() => {
    if (!id || isLoading) return
    if (!isVerified) {
      setLoading(false)
      return
    }
    let active = true
    shopperService.getOrderById(id)
      .then((next) => {
        if (active) {
          setOrder(next)
          setGuestOrderRef(next.reference || next.id)
        }
      })
      .catch(() => { if (active) setError("Order not found, or it belongs to a different verified buyer.") })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [id, isVerified, isLoading])

  const handleCancelVerified = async () => {
    if (!order || !id) return
    setCancelMode("submitting")
    setCancelError(null)
    try {
      const updated = await shopperService.cancelMyOrder(id, cancelReason || undefined)
      setOrder(updated)
      setCancelMode("done")
    } catch (err) {
      setCancelError(err instanceof Error ? err.message : "Cancellation failed. Try again.")
      setCancelMode("confirm")
    }
  }

  const handleCancelGuest = async (event: React.FormEvent) => {
    event.preventDefault()
    setCancelMode("submitting")
    setCancelError(null)
    try {
      const updated = await shopperService.cancelGuestOrder({
        email: guestEmail,
        orderId: guestOrderRef,
        reason: cancelReason || undefined,
      })
      setOrder(updated)
      setCancelMode("done")
    } catch (err) {
      setCancelError(err instanceof Error ? err.message : "Cancellation failed. Check the email and order reference.")
      setCancelMode("guest_form")
    }
  }

  if (loading || isLoading) return <div className="min-h-[50vh] grid place-items-center bg-[#FFFBF5]"><div className="h-8 w-8 animate-spin rounded-full border-2 border-[#0B9C74] border-t-transparent" /></div>

  // Guest (no verified session) — show a lightweight cancel form so they're not locked out
  if (!isVerified) {
    return (
      <div className="min-h-screen bg-[#FFFBF5] py-10">
        <div className="mx-auto max-w-[760px] px-4 sm:px-6">
          <Link to="/track" className="inline-flex items-center gap-2 text-sm font-medium text-[#6b6b6b] hover:text-[#1a1a1a]"><ArrowLeft className="h-4 w-4" /> Back</Link>

          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            {/* Guest cancel panel */}
            <div className="rounded-[22px] border border-[#F3E6D3] bg-white p-6">
              <h1 className="font-display text-xl font-bold">Cancel an order</h1>
              <p className="mt-1 text-sm text-[#6b6b6b]">Enter the email you used at checkout and your order reference to cancel an unpaid order.</p>

              {cancelMode === "done" ? (
                <div className="mt-4 rounded-xl border border-[#0B9C74]/20 bg-[#E6F7F1] px-4 py-3 text-sm text-[#0B9C74] font-bold">
                  Order cancelled. Stock has been returned and any open payment links are closed.
                </div>
              ) : (
                <form onSubmit={handleCancelGuest} className="mt-4 space-y-3">
                  {cancelError && <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">{cancelError}</div>}
                  <input
                    required
                    type="email"
                    value={guestEmail}
                    onChange={(e) => setGuestEmail(e.target.value)}
                    placeholder="Email used at checkout"
                    className="w-full rounded-xl border border-[#F3E6D3] px-3 py-2.5 text-sm outline-none focus:border-[#0B9C74]"
                  />
                  <input
                    required
                    value={guestOrderRef}
                    onChange={(e) => setGuestOrderRef(e.target.value)}
                    placeholder="Order reference (e.g. #00012)"
                    className="w-full rounded-xl border border-[#F3E6D3] px-3 py-2.5 text-sm outline-none focus:border-[#0B9C74]"
                  />
                  <input
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                    placeholder="Reason (optional)"
                    className="w-full rounded-xl border border-[#F3E6D3] px-3 py-2.5 text-sm outline-none focus:border-[#0B9C74]"
                  />
                  <button
                    disabled={cancelMode === "submitting"}
                    className="w-full rounded-full border border-red-200 bg-red-50 px-5 py-3 text-sm font-bold text-red-700 hover:bg-red-100 disabled:opacity-60"
                  >
                    {cancelMode === "submitting" ? "Cancelling…" : "Cancel order"}
                  </button>
                  <p className="text-xs text-[#9a9a9a]">Only unpaid Pending or Confirmed orders can be self-cancelled. Paid or fulfilled orders require seller contact.</p>
                </form>
              )}
            </div>

            {/* Verify prompt */}
            <div className="rounded-[22px] bg-[#1a1a1a] p-6 text-white">
              <h2 className="font-bold">View your full order history</h2>
              <p className="mt-2 text-sm text-white/70">Verify your email to see all orders, track shipments, and manage orders in one place — no password needed.</p>
              <Link to="/track" className="mt-4 inline-flex rounded-full bg-[#0B9C74] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#0a8a66]">Verify with email</Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className="min-h-[50vh] grid place-items-center bg-[#FFFBF5] px-4">
        <div className="text-center">
          <h1 className="font-display text-2xl font-bold">Order not found</h1>
          {error && <p className="mt-2 text-sm text-[#6b6b6b]">{error}</p>}
          <Link to="/track" className="mt-4 inline-flex rounded-full bg-[#0B9C74] px-6 py-3 text-sm font-bold text-white">Back to your orders</Link>
        </div>
      </div>
    )
  }

  const cancellable = isCancellable(order)

  return (
    <div className="min-h-screen bg-[#FFFBF5] py-10">
      <div className="mx-auto max-w-[760px] px-4 sm:px-6">
        <Link to="/track" className="inline-flex items-center gap-2 text-sm font-medium text-[#6b6b6b] hover:text-[#1a1a1a]"><ArrowLeft className="h-4 w-4" /> Back to your orders</Link>

        <div className="mt-4 rounded-[22px] border border-[#F3E6D3] bg-white p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="font-display text-xl font-bold">{order.reference || `#${order.id.slice(-6).toUpperCase()}`}</h1>
              {order.store && <div className="mt-1 flex items-center gap-1 text-sm text-[#6b6b6b]"><Store className="h-4 w-4 text-[#0B9C74]" /> {order.store.name}</div>}
              <div className="mt-1 text-xs text-[#9a9a9a]">Placed {new Date(order.createdAt).toLocaleString()}</div>
            </div>
            <div className="flex flex-col items-end gap-1">
              <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${order.paymentStatus === "Paid" ? "border-[#0B9C74]/20 bg-[#E6F7F1] text-[#0B9C74]" : order.paymentStatus === "Refunded" ? "border-purple-200 bg-purple-50 text-purple-700" : "border-[#F3E6D3] bg-[#FFF1DA] text-[#E85D26]"}`}>{order.paymentStatus}</span>
              <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${order.orderStatus === "Cancelled" ? "border-red-200 bg-red-50 text-red-700" : "border-[#F3E6D3] bg-white"}`}>{order.orderStatus}</span>
            </div>
          </div>

          <div className="mt-5">
            <h2 className="flex items-center gap-2 text-xs font-bold tracking-widest text-[#9a9a9a]"><Package className="h-3.5 w-3.5" /> ITEMS</h2>
            <div className="mt-2 space-y-2">
              {order.items.map((item, index) => (
                <div key={`${item.name}-${index}`} className="flex items-center gap-3 rounded-xl border border-[#F3E6D3] p-3">
                  {item.image ? <img src={item.image} alt="" className="h-11 w-11 rounded-lg border border-[#F3E6D3] bg-[#FFFBF5] object-cover" /> : <div className="h-11 w-11 rounded-lg border border-[#F3E6D3] bg-[#FFFBF5]" />}
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-bold">{item.name}</div>
                    <div className="text-xs text-[#6b6b6b]">{item.variantLabel ? `${item.variantLabel} • ` : ""}₦{item.price.toLocaleString()} × {item.quantity}</div>
                  </div>
                  <div className="text-sm font-bold">₦{item.subtotal.toLocaleString()}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl bg-[#FFFBF5] border border-[#F3E6D3] p-4 text-sm">
              <div className="flex items-center gap-2 font-bold"><MapPin className="h-4 w-4 text-[#0B9C74]" /> Delivery</div>
              <p className="mt-1 text-[#6b6b6b]">{order.deliveryAddress || "No address on file"}</p>
              {order.expectedDeliveryDate && <p className="mt-1 text-xs text-[#9a9a9a]">Expected {new Date(order.expectedDeliveryDate).toLocaleDateString()}</p>}
            </div>
            <div className="rounded-xl bg-[#FFFBF5] border border-[#F3E6D3] p-4 text-sm">
              <div className="font-bold">Totals</div>
              <div className="mt-1 space-y-0.5 text-[#6b6b6b]">
                <div className="flex justify-between"><span>Subtotal</span><span>₦{order.subtotal.toLocaleString()}</span></div>
                <div className="flex justify-between"><span>Delivery</span><span>₦{order.deliveryFee.toLocaleString()}</span></div>
                <div className="flex justify-between font-bold text-[#1a1a1a]"><span>Total</span><span>₦{order.total.toLocaleString()}</span></div>
              </div>
            </div>
          </div>

          {order.store?.phone && (
            <p className="mt-5 text-xs leading-5 text-[#9a9a9a]">Questions about this order? Contact {order.store.name} on {order.store.phone}.</p>
          )}
        </div>

        {/* ── Cancel panel ── */}
        {order.orderStatus === "Cancelled" && (
          <div className="mt-4 rounded-[22px] border border-red-200 bg-red-50 px-5 py-4">
            <div className="flex items-center gap-2 font-bold text-red-700"><X className="h-4 w-4" /> This order has been cancelled</div>
            {order.cancellationReason && <p className="mt-1 text-xs text-red-600">{order.cancellationReason}</p>}
            {order.paymentStatus === "Refunded" && <p className="mt-1 text-xs text-red-600">Payment has been refunded.</p>}
          </div>
        )}

        {cancelMode === "done" && order.orderStatus !== "Cancelled" && (
          <div className="mt-4 rounded-[22px] border border-[#0B9C74]/20 bg-[#E6F7F1] px-5 py-4">
            <p className="font-bold text-[#0B9C74]">Order cancelled. Reserved stock was returned and any open payment links are now closed.</p>
          </div>
        )}

        {cancellable && cancelMode === "idle" && (
          <div className="mt-4 rounded-[22px] border border-[#F3E6D3] bg-white p-5">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-[#E85D26]" />
              <div>
                <p className="text-sm font-bold">Want to cancel this order?</p>
                <p className="mt-0.5 text-xs text-[#6b6b6b]">You can cancel before the seller processes it. This cannot be undone — reserved stock will be returned.</p>
              </div>
            </div>
            <button
              onClick={() => setCancelMode("confirm")}
              className="mt-4 inline-flex items-center gap-2 rounded-full border border-red-200 bg-red-50 px-5 py-2.5 text-sm font-bold text-red-700 hover:bg-red-100"
            >
              <X className="h-4 w-4" /> Cancel this order
            </button>
          </div>
        )}

        {cancellable && cancelMode === "confirm" && (
          <div className="mt-4 rounded-[22px] border border-red-200 bg-white p-5">
            <h2 className="font-bold text-red-700">Confirm cancellation</h2>
            <p className="mt-1 text-sm text-[#6b6b6b]">Cancelling <span className="font-bold">{order.reference || order.id}</span> for <span className="font-bold">₦{order.total.toLocaleString()}</span>. This cannot be undone.</p>

            {cancelError && <div className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">{cancelError}</div>}

            <div className="mt-3">
              <input
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Reason for cancellation (optional)"
                className="w-full rounded-xl border border-[#F3E6D3] px-3 py-2.5 text-sm outline-none focus:border-red-300"
              />
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <button
                onClick={handleCancelVerified}
                className="rounded-full bg-red-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-red-700"
              >
                Yes, cancel order
              </button>
              <button
                onClick={() => { setCancelMode("idle"); setCancelError(null); setCancelReason("") }}
                className="rounded-full border border-[#F3E6D3] bg-white px-5 py-2.5 text-sm font-bold hover:bg-[#FFFBF5]"
              >
                Keep order
              </button>
            </div>
          </div>
        )}

        {cancelMode === "submitting" && (
          <div className="mt-4 flex items-center gap-3 rounded-[22px] border border-[#F3E6D3] bg-white px-5 py-4">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#0B9C74] border-t-transparent" />
            <span className="text-sm text-[#6b6b6b]">Cancelling your order…</span>
          </div>
        )}
      </div>
    </div>
  )
}
