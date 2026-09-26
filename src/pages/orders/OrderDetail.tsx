import { useEffect, useState } from "react"
import { useParams, Link } from "react-router-dom"
import { ArrowLeft, Package, User, MapPin, Phone, Clock, CreditCard, Truck, CheckCircle } from "lucide-react"
import { orderService } from "../../services/orderService"
import { paymentService } from "../../services/paymentService"
import { ORDER_STATUSES } from "../../types/order"
import type { Order, OrderStatus } from "../../types/order"
import type { Transaction } from "../../types/payment"

const statusColor: Record<OrderStatus, string> = {
  Pending: "bg-[#FFF1DA] text-[#E85D26] border-[#F3E6D3]",
  Confirmed: "bg-[#E6F7F1] text-[#0B9C74] border-[#0B9C74]/20",
  Processing: "bg-[#E6F7F1] text-[#0B9C74] border-[#0B9C74]/20",
  Shipped: "bg-[#E6F7F1] text-[#0B9C74] border-[#0B9C74]/20",
  Delivered: "bg-[#1a1a1a] text-white border-[#1a1a1a]",
  Cancelled: "bg-red-50 text-red-700 border-red-200",
}

export default function OrderDetail() {
  const { id } = useParams<{ id: string }>()
  const [order, setOrder] = useState<Order | null>(null)
  const [txn, setTxn] = useState<Transaction | null>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [paying, setPaying] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = async () => {
    if (!id) return
    setLoading(true)
    try {
      const o = await orderService.getById(id)
      setOrder(o)
      setTxn(paymentService.getByOrderId(o.id))
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  const handleStatus = async (newStatus: OrderStatus) => {
    if (!order || !id) return
    setUpdating(true)
    setError(null)
    try {
      const updated = await orderService.updateStatus(id, newStatus)
      setOrder(updated)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to update")
    } finally {
      setUpdating(false)
    }
  }

  const handleMarkPaid = async () => {
    if (!order || !id) return
    setUpdating(true)
    setError(null)
    try {
      const updated = await orderService.updatePaymentStatus(id, "Paid")
      setOrder(updated)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to update payment")
    } finally {
      setUpdating(false)
    }
  }

  const handlePaystack = async () => {
    if (!order) return
    setPaying(true)
    setError(null)
    try {
      const email = `${order.customerPhone.replace(/[^0-9]/g, "")}@cognicart.test`
      const ref = await paymentService.payWithPaystack({
        orderId: order.id,
        amount: order.total,
        email,
        sellerId: order.sellerId,
        subtotal: order.subtotal,
        deliveryFee: order.deliveryFee,
      })
      const updated = await orderService.getById(order.id)
      setOrder(updated)
      setTxn(paymentService.getByReference(ref) || paymentService.getByOrderId(order.id))
    } catch (e) {
      setError(e instanceof Error ? e.message : "Paystack failed")
    } finally {
      setPaying(false)
    }
  }

  if (loading) return <div className="grid place-items-center py-16"><div className="h-8 w-8 rounded-full border-2 border-[#0B9C74] border-t-transparent animate-spin" /></div>
  if (error && !order) return <div className="rounded-2xl bg-white border border-[#F3E6D3] p-8 text-center"><div className="font-bold">Not found</div><div className="text-sm text-[#6b6b6b]">{error}</div><Link to="/dashboard/orders" className="mt-4 inline-flex rounded-full bg-[#0B9C74] px-5 py-2.5 text-sm font-bold text-white">Back to orders</Link></div>
  if (!order) return null

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Link to="/dashboard/orders" className="inline-flex items-center gap-2 text-sm font-medium text-[#6b6b6b] hover:text-[#1a1a1a]"><ArrowLeft className="h-4 w-4" /> Back to orders</Link>

      {error && <div className="rounded-xl bg-red-50 border border-red-200 px-3 py-2.5 text-sm text-red-700">{error}</div>}

      <div className="rounded-[22px] bg-white border border-[#F3E6D3] p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-display text-2xl font-bold">Order #{order.id.slice(-6).toUpperCase()}</h1>
              <span className={`rounded-full px-3 py-1 text-xs font-bold border ${statusColor[order.orderStatus]}`}>{order.orderStatus}</span>
            </div>
            <div className="mt-1 flex items-center gap-2 text-xs text-[#6b6b6b]">
              <Clock className="h-3.5 w-3.5" /> {new Date(order.createdAt).toLocaleString()} • {order.items.length} item{order.items.length > 1 ? "s" : ""}
              <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-bold border ${order.paymentStatus === "Paid" ? "bg-[#E6F7F1] text-[#0B9C74]" : "bg-[#FFF1DA] text-[#E85D26]"}`}>{order.paymentStatus}</span>
              {order.paymentReference && <span className="font-mono hidden sm:inline">Ref {order.paymentReference}</span>}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs font-bold">Status</label>
            <select value={order.orderStatus} onChange={(e) => handleStatus(e.target.value as OrderStatus)} disabled={updating} className="rounded-xl border border-[#F3E6D3] bg-white px-3 py-2 text-sm font-bold focus:border-[#0B9C74] outline-none disabled:opacity-60">
              {ORDER_STATUSES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-6 grid lg:grid-cols-[1.2fr_0.8fr] gap-6">
          <div className="space-y-4">
            <div className="rounded-2xl bg-[#FFFBF5] border border-[#F3E6D3] p-4">
              <div className="flex items-center gap-2 text-sm font-bold"><User className="h-4 w-4 text-[#0B9C74]" /> Customer</div>
              <div className="mt-2 text-sm"><span className="font-bold">{order.customerName}</span> • <span className="text-[#6b6b6b]">{order.customerPhone}</span></div>
              <div className="text-xs text-[#6b6b6b] flex items-center gap-1"><Phone className="h-3 w-3" /> WhatsApp {order.customerWhatsappId}</div>
              <Link to={`/dashboard/customers`} className="mt-2 inline-flex text-xs font-bold text-[#0B9C74] hover:underline">View customer →</Link>
            </div>

            <div className="rounded-2xl bg-white border border-[#F3E6D3] p-0 overflow-hidden">
              <div className="px-4 py-3 flex items-center gap-2 text-sm font-bold border-b border-[#F3E6D3]"><Package className="h-4 w-4 text-[#0B9C74]" /> Ordered products <span className="ml-auto text-xs font-normal text-[#6b6b6b]">Prices preserved at order time</span></div>
              <div className="divide-y divide-[#F3E6D3]">
                {order.items.map((item) => (
                  <div key={item.productId} className="flex gap-3 p-4">
                    <img src={item.image || "https://via.placeholder.com/80"} alt={item.name} className="h-14 w-14 rounded-xl object-cover bg-[#FFFBF5] border border-[#F3E6D3]" />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-bold leading-tight truncate">{item.name}</div>
                      <div className="text-xs text-[#6b6b6b]">₦{item.price.toLocaleString()} × {item.quantity}</div>
                    </div>
                    <div className="text-sm font-bold">₦{item.subtotal.toLocaleString()}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-2xl bg-white border border-[#F3E6D3] p-4">
              <div className="flex items-center gap-2 text-sm font-bold"><MapPin className="h-4 w-4 text-[#0B9C74]" /> Delivery</div>
              <div className="mt-2 text-sm leading-6">{order.deliveryAddress || "No address provided"}</div>
              <div className="mt-3 flex items-center gap-2 text-xs"><Truck className="h-4 w-4 text-[#6b6b6b]" /> Fee ₦{order.deliveryFee.toLocaleString()} • Tenant scoped</div>
            </div>

            <div className="rounded-2xl bg-white border border-[#F3E6D3] p-4">
              <div className="flex items-center gap-2 text-sm font-bold"><CreditCard className="h-4 w-4 text-[#0B9C74]" /> Payment</div>
              <div className="mt-3 space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-[#6b6b6b]">Subtotal</span><span className="font-bold">₦{order.subtotal.toLocaleString()}</span></div>
                <div className="flex justify-between"><span className="text-[#6b6b6b]">Delivery</span><span>₦{order.deliveryFee.toLocaleString()}</span></div>
                <div className="flex justify-between pt-2 border-t border-[#F3E6D3] text-base font-bold"><span>Total</span><span>₦{order.total.toLocaleString()}</span></div>
                {order.paymentReference && <div className="flex justify-between text-xs"><span className="text-[#6b6b6b]">Reference</span><span className="font-mono font-bold">{order.paymentReference}</span></div>}
                {txn && <div className="rounded-xl bg-[#FFFBF5] border border-[#F3E6D3] p-2 text-xs leading-5"><div>Platform fee ₦{txn.platformFee.toLocaleString()} • Paystack ₦{txn.paystackFee.toLocaleString()} • Seller ₦{txn.sellerAmount.toLocaleString()}</div><div className="text-[#6b6b6b]">{txn.reference} • {txn.status} • {new Date(txn.createdAt).toLocaleString()}</div></div>}
                <div className="text-xs text-[#9a9a9a]">Order totals use price at creation, not current product price.</div>
              </div>
              {order.paymentStatus === "Pending" ? (
                <div className="mt-3 space-y-2">
                  <button onClick={handlePaystack} disabled={paying} className="w-full flex justify-center items-center gap-2 rounded-full bg-[#0B9C74] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#0a8a66] disabled:opacity-60">
                    <CreditCard className="h-4 w-4" /> {paying ? "Processing..." : "Pay with Paystack (test)"}
                  </button>
                  <button onClick={handleMarkPaid} disabled={updating} className="w-full flex justify-center items-center gap-2 rounded-full bg-white border border-[#F3E6D3] px-4 py-2.5 text-sm font-bold hover:bg-[#FFF1DA] disabled:opacity-60">
                    <CheckCircle className="h-4 w-4" /> Mark as Paid (manual)
                  </button>
                  <div className="rounded-xl bg-[#FFF1DA] border border-[#F3E6D3] p-3 text-xs leading-5">Pending. Customer can pay via Paystack link. Platform fee from Settings will be split on verification.</div>
                </div>
              ) : (
                <div className="mt-3 rounded-xl bg-[#E6F7F1] border border-[#0B9C74]/20 p-3 text-xs leading-5 text-[#0B9C74]">Paid. Platform fee split recorded. Payout to seller bank on file.</div>
              )}
            </div>

            <div className="rounded-2xl bg-[#1a1a1a] text-white p-4">
              <div className="text-sm font-bold">WhatsApp source</div>
              <p className="text-xs leading-5 text-white/70 mt-1">This order would have been created by AI via <span className="font-bold text-white">createOrder</span> tool after confirming stock, price and delivery. Customer was found by phone + sellerId isolation.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
