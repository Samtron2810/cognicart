import { useEffect, useState } from "react"
import { useParams, Link } from "react-router-dom"
import { ArrowLeft, User, MapPin, Phone, Clock, CreditCard, Truck, Copy, Check, Share2, PencilLine, Mail, StickyNote } from "lucide-react"
import { orderService } from "../../services/orderService"
import { paymentService } from "../../services/paymentService"
import { OrderSourceBadge } from "../../components/orders/OrderSourceBadge"
import {
  ORDER_STATUSES,
  PAYMENT_METHODS,
  PAYMENT_METHOD_LABELS,
  PAYMENT_STATUSES,
  canEditLineItems,
  canRecordOfflinePayment,
} from "../../types/order"
import type { Order, OrderShare, OrderShareVariant, OrderStatus, PaymentMethod, PaymentStatus } from "../../types/order"
import type { Transaction } from "../../types/payment"
import { getApiErrorMessage } from "../../services/apiError"

const statusColor: Record<OrderStatus, string> = {
  Pending: "bg-[#FFF1DA] text-[#E85D26] border-[#F3E6D3]",
  Confirmed: "bg-[#E6F7F1] text-[#0B9C74] border-[#0B9C74]/20",
  Processing: "bg-[#E6F7F1] text-[#0B9C74] border-[#0B9C74]/20",
  Shipped: "bg-[#E6F7F1] text-[#0B9C74] border-[#0B9C74]/20",
  Delivered: "bg-[#1a1a1a] text-white border-[#1a1a1a]",
  Cancelled: "bg-red-50 text-red-700 border-red-200",
}

const SHARE_VARIANTS: Array<{ value: OrderShareVariant; label: string }> = [
  { value: "confirmation", label: "Confirmation" },
  { value: "dispatch", label: "Dispatch update" },
  { value: "payment_reminder", label: "Payment reminder" },
]

export default function OrderDetail() {
  const { id } = useParams<{ id: string }>()
  const [order, setOrder] = useState<Order | null>(null)
  const [txn, setTxn] = useState<Transaction | null>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Share panel
  const [shareVariant, setShareVariant] = useState<OrderShareVariant>("confirmation")
  const [share, setShare] = useState<OrderShare | null>(null)
  const [shareLoading, setShareLoading] = useState(false)
  const [copied, setCopied] = useState(false)

  // Manual offline payment controls
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>("Pending")
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("bank_transfer")
  const [paymentReference, setPaymentReference] = useState("")
  const [savingPayment, setSavingPayment] = useState(false)
  const [paymentSaved, setPaymentSaved] = useState(false)

  const load = async () => {
    if (!id) return
    setLoading(true)
    try {
      const o = await orderService.getById(id)
      setOrder(o)
      setPaymentStatus(o.paymentStatus)
      setPaymentMethod(o.paymentMethod && o.paymentMethod !== "paystack" ? o.paymentMethod : "bank_transfer")
      setPaymentReference(o.paymentReference || "")
      setTxn(o.paymentReference && o.source !== "manual" ? await paymentService.getByReference(o.paymentReference).catch(() => null) : null)
    } catch (e) {
      setError(getApiErrorMessage(e, "Failed to load"))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  useEffect(() => {
    if (!id || !order) return
    let active = true
    setShareLoading(true)
    orderService
      .getShare(id, shareVariant)
      .then((next) => { if (active) setShare(next) })
      .catch(() => { if (active) setShare(null) })
      .finally(() => { if (active) setShareLoading(false) })
    return () => { active = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, shareVariant, order?.paymentStatus, order?.orderStatus])

  const handleStatus = async (newStatus: OrderStatus) => {
    if (!order || !id) return
    setUpdating(true)
    setError(null)
    try {
      const updated = await orderService.updateStatus(id, newStatus)
      setOrder(updated)
    } catch (e) {
      setError(getApiErrorMessage(e, "Failed to update"))
    } finally {
      setUpdating(false)
    }
  }

  const handleRecordPayment = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!order || !id || !canRecordOfflinePayment(order)) return
    setSavingPayment(true)
    setError(null)
    setPaymentSaved(false)
    try {
      const updated = await orderService.updateManualPayment(id, { paymentStatus, paymentMethod, paymentReference })
      setOrder(updated)
      setPaymentSaved(true)
      setTimeout(() => setPaymentSaved(false), 2500)
    } catch (e) {
      setError(getApiErrorMessage(e, "Failed to record payment"))
    } finally {
      setSavingPayment(false)
    }
  }

  const handleCopyShare = async () => {
    if (!share) return
    await navigator.clipboard.writeText(share.message)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading) return <div className="grid place-items-center py-16"><div className="h-8 w-8 rounded-full border-2 border-[#0B9C74] border-t-transparent animate-spin" /></div>
  if (error && !order) return <div className="rounded-2xl bg-white border border-[#F3E6D3] p-8 text-center"><div className="font-bold">Not found</div><div className="text-sm text-[#6b6b6b]">{error}</div><Link to="/dashboard/orders" className="mt-4 inline-flex rounded-full bg-[#0B9C74] px-5 py-2.5 text-sm font-bold text-white">Back to orders</Link></div>
  if (!order) return null

  const isManual = canEditLineItems(order)

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Link to="/dashboard/orders" className="inline-flex items-center gap-2 text-sm font-medium text-[#6b6b6b] hover:text-[#1a1a1a]"><ArrowLeft className="h-4 w-4" /> Back to orders</Link>

      {error && <div className="rounded-xl bg-red-50 border border-red-200 px-3 py-2.5 text-sm text-red-700">{error}</div>}

      <div className="rounded-[22px] bg-white border border-[#F3E6D3] p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-display text-xl font-bold font-mono">{order.reference || `#${order.id.slice(-6).toUpperCase()}`}</h1>
              <OrderSourceBadge source={order.source} sourceChannel={order.sourceChannel || ""} />
              <span className={`inline-flex rounded-full px-3 py-1 text-xs font-bold border ${statusColor[order.orderStatus]}`}>{order.orderStatus}</span>
            </div>
            <div className="mt-1 text-xs text-[#6b6b6b] flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {new Date(order.createdAt).toLocaleString()}{order.expectedDeliveryDate ? ` • expected ${new Date(order.expectedDeliveryDate).toLocaleDateString()}` : ""}</div>
            {order.sourceNote && <div className="mt-1 text-xs text-[#9a9a9a]">Source note: {order.sourceNote}</div>}
          </div>
          <div className="flex items-center gap-2">
            {isManual && (
              <Link to={`/dashboard/orders/manual/${order.id}/edit`} className="inline-flex items-center gap-2 rounded-full border border-[#F3E6D3] bg-white px-4 py-2 text-xs font-bold hover:bg-[#FFF1DA]"><PencilLine className="h-3.5 w-3.5" /> Edit order</Link>
            )}
            <div className="text-right">
              <div className="text-2xl font-bold">₦{order.total.toLocaleString()}</div>
              <div className="text-xs text-[#6b6b6b]">₦{order.subtotal.toLocaleString()} + ₦{order.deliveryFee.toLocaleString()} delivery</div>
            </div>
          </div>
        </div>

        <div className="mt-6 grid lg:grid-cols-[1.2fr_0.8fr] gap-6">
          <div className="space-y-4">
            <section>
              <h2 className="text-xs font-bold tracking-widest text-[#9a9a9a]">ITEMS</h2>
              <div className="mt-2 space-y-2">
                {order.items.map((item, index) => (
                  <div key={`${item.productId || item.name}-${index}`} className="flex items-center gap-3 rounded-xl border border-[#F3E6D3] p-3">
                    {item.image ? <img src={item.image} alt="" className="h-11 w-11 rounded-lg border border-[#F3E6D3] bg-[#FFFBF5] object-cover" /> : <div className="h-11 w-11 rounded-lg border border-[#F3E6D3] bg-[#FFFBF5]" />}
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-bold truncate">{item.name}{item.isCustomItem && <span className="ml-2 rounded-full bg-[#FFF1DA] px-2 py-0.5 text-[10px] font-bold text-[#E85D26]">CUSTOM</span>}</div>
                      <div className="text-xs text-[#6b6b6b]">{item.variantLabel ? `${item.variantLabel} • ` : ""}₦{item.price.toLocaleString()} × {item.quantity}</div>
                    </div>
                    <div className="text-sm font-bold">₦{item.subtotal.toLocaleString()}</div>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-xl border border-[#F3E6D3] bg-[#FFFBF5] p-4">
              <h2 className="text-xs font-bold tracking-widest text-[#9a9a9a]">CUSTOMER</h2>
              <div className="mt-2 space-y-1.5 text-sm">
                <div className="flex items-center gap-2"><User className="h-4 w-4 text-[#0B9C74]" /> {order.customerName}</div>
                <div className="flex items-center gap-2"><Phone className="h-4 w-4 text-[#0B9C74]" /> {order.customerPhone}</div>
                {order.customerEmail && <div className="flex items-center gap-2"><Mail className="h-4 w-4 text-[#0B9C74]" /> {order.customerEmail}</div>}
                <div className="flex items-center gap-2"><MapPin className="h-4 w-4 text-[#0B9C74]" /> {order.deliveryAddress || "No delivery address"}</div>
                {order.source === "telegram" && order.channelUsername && <div className="text-xs text-[#6b6b6b]">Telegram: @{order.channelUsername}</div>}
              </div>
            </section>

            {order.notes && (
              <section className="rounded-xl border border-[#F3E6D3] bg-white p-4">
                <h2 className="flex items-center gap-1 text-xs font-bold tracking-widest text-[#9a9a9a]"><StickyNote className="h-3.5 w-3.5" /> INTERNAL NOTES</h2>
                <p className="mt-2 text-sm leading-6 whitespace-pre-wrap">{order.notes}</p>
              </section>
            )}

            <section className="rounded-xl border border-[#F3E6D3] bg-white p-4">
              <h2 className="flex items-center gap-2 font-bold text-sm"><Share2 className="h-4 w-4 text-[#0B9C74]" /> Share order update</h2>
              <p className="mt-1 text-xs leading-5 text-[#6b6b6b]">Copy a ready-made summary or open your own WhatsApp with the message pre-filled. This is a manual share you send yourself — nothing is sent automatically and no WhatsApp API is involved.</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {SHARE_VARIANTS.map((variant) => (
                  <button key={variant.value} onClick={() => setShareVariant(variant.value)} className={`rounded-full border px-3.5 py-1.5 text-xs font-bold ${shareVariant === variant.value ? "border-[#1a1a1a] bg-[#1a1a1a] text-white" : "border-[#F3E6D3] bg-white hover:bg-[#FFF1DA]"}`}>{variant.label}</button>
                ))}
              </div>
              {shareLoading ? (
                <div className="mt-3 grid place-items-center py-6"><div className="h-6 w-6 rounded-full border-2 border-[#0B9C74] border-t-transparent animate-spin" /></div>
              ) : share ? (
                <>
                  <pre className="mt-3 max-h-48 overflow-auto whitespace-pre-wrap rounded-xl bg-[#FFFBF5] p-3 text-xs leading-5">{share.message}</pre>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button onClick={() => void handleCopyShare()} className="inline-flex items-center gap-2 rounded-full border border-[#F3E6D3] bg-white px-4 py-2 text-xs font-bold hover:bg-[#FFF1DA]">{copied ? <><Check className="h-3.5 w-3.5 text-[#0B9C74]" /> Copied</> : <><Copy className="h-3.5 w-3.5" /> Copy text</>}</button>
                    <a href={share.whatsappUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-full bg-[#0B9C74] px-4 py-2 text-xs font-bold text-white hover:bg-[#0a8a66]">
                      <Share2 className="h-3.5 w-3.5" /> Share via WhatsApp{share.canSend && share.phone ? ` (${share.phone})` : ""}
                    </a>
                  </div>
                </>
              ) : (
                <p className="mt-3 text-xs text-[#9a9a9a]">Share text unavailable right now.</p>
              )}
            </section>
          </div>

          <div className="space-y-4">
            <section className="rounded-xl border border-[#F3E6D3] bg-white p-4">
              <h2 className="flex items-center gap-2 font-bold text-sm"><Truck className="h-4 w-4 text-[#0B9C74]" /> Fulfilment status</h2>
              <div className="mt-3 grid gap-2">
                {ORDER_STATUSES.map((s) => (
                  <button key={s} disabled={updating || s === order.orderStatus} onClick={() => void handleStatus(s)} className={`rounded-xl border px-3 py-2 text-left text-sm font-bold transition disabled:cursor-default ${s === order.orderStatus ? statusColor[s] : "border-[#F3E6D3] bg-white hover:bg-[#FFFBF5]"}`}>{s}{s === order.orderStatus ? " • current" : ""}</button>
                ))}
              </div>
            </section>

            <section className="rounded-xl border border-[#F3E6D3] bg-white p-4">
              <h2 className="flex items-center gap-2 font-bold text-sm"><CreditCard className="h-4 w-4 text-[#0B9C74]" /> Payment</h2>
              <div className="mt-2 text-sm">
                <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold border ${order.paymentStatus === "Paid" ? "bg-[#E6F7F1] text-[#0B9C74] border-[#0B9C74]/20" : order.paymentStatus === "Pending" ? "bg-[#FFF1DA] text-[#E85D26] border-[#F3E6D3]" : "bg-red-50 text-red-700 border-red-200"}`}>{order.paymentStatus}</span>
                <div className="mt-2 text-xs text-[#6b6b6b]">
                  {order.paymentMethod ? `${PAYMENT_METHOD_LABELS[order.paymentMethod] ?? order.paymentMethod}` : "—"}
                  {order.paymentReference ? ` • ref ${order.paymentReference}` : ""}
                  {order.paidAt ? ` • paid ${new Date(order.paidAt).toLocaleString()}` : ""}
                </div>
              </div>

              {isManual ? (
                <form onSubmit={handleRecordPayment} className="mt-3 space-y-2 border-t border-[#F3E6D3] pt-3">
                  <div className="text-xs font-bold text-[#6b6b6b]">Record offline payment</div>
                  <select value={paymentStatus} onChange={(e) => setPaymentStatus(e.target.value as PaymentStatus)} aria-label="Payment status" className="w-full rounded-xl border border-[#F3E6D3] bg-white px-3 py-2 text-sm outline-none focus:border-[#0B9C74]">
                    {PAYMENT_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                  <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)} aria-label="Payment method" className="w-full rounded-xl border border-[#F3E6D3] bg-white px-3 py-2 text-sm outline-none focus:border-[#0B9C74]">
                    {PAYMENT_METHODS.filter((m) => m !== "paystack").map((m) => <option key={m} value={m}>{PAYMENT_METHOD_LABELS[m]}</option>)}
                  </select>
                  <input value={paymentReference} onChange={(e) => setPaymentReference(e.target.value)} placeholder="Payment reference (optional)" className="w-full rounded-xl border border-[#F3E6D3] px-3 py-2 text-sm outline-none focus:border-[#0B9C74]" />
                  <button disabled={savingPayment} className="w-full rounded-full bg-[#1a1a1a] px-4 py-2 text-xs font-bold text-white hover:bg-black disabled:opacity-60">{savingPayment ? "Saving…" : paymentSaved ? "Saved ✓" : "Save payment"}</button>
                </form>
              ) : (
                <p className="mt-3 border-t border-[#F3E6D3] pt-3 text-xs leading-5 text-[#9a9a9a]">
                  This is an automatic {order.source} order. Payment status is reconciled by Paystack verification and webhooks — it cannot be marked paid manually.
                </p>
              )}

              {txn && (
                <div className="mt-3 rounded-xl bg-[#FFFBF5] p-3 text-xs">
                  <div className="font-bold">Paystack transaction</div>
                  <div className="mt-1 text-[#6b6b6b]">Ref {txn.reference} • {txn.status}</div>
                </div>
              )}
            </section>

            <div className="rounded-2xl bg-[#1a1a1a] text-white p-4">
              <div className="text-sm font-bold">Order provenance</div>
              <p className="text-xs leading-5 text-white/70 mt-1">
                {order.source === "storefront" && "Placed by the buyer through the public storefront checkout. Prices, stock, and totals were computed by the backend."}
                {order.source === "telegram" && "Placed in a Telegram chat with your bot. The commerce assistant confirmed stock and price against the live catalog before creating it."}
                {order.source === "manual" && `Logged manually by you from ${order.sourceChannel ? `a ${order.sourceChannel.replace(/_/g, " ")} sale` : "an external channel"}. Line items and offline payment are seller-controlled for this order only.`}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
