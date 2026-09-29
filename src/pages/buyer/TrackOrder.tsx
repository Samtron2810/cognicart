import { useEffect, useState } from "react"
import { Link, useParams } from "react-router-dom"
import { ArrowLeft, MapPin, Package, Store } from "lucide-react"
import { useShopper } from "../../context/ShopperContext"
import { shopperService } from "../../services/shopperService"
import type { ShopperOrder } from "../../types/shopper"

/** Single owned order for a verified buyer. */
export default function TrackOrder() {
  const { id } = useParams<{ id: string }>()
  const { isVerified, isLoading } = useShopper()
  const [order, setOrder] = useState<ShopperOrder | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id || isLoading) return
    if (!isVerified) {
      setLoading(false)
      return
    }
    let active = true
    shopperService.getOrderById(id)
      .then((next) => { if (active) setOrder(next) })
      .catch(() => { if (active) setError("Order not found, or it belongs to a different verified buyer.") })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [id, isVerified, isLoading])

  if (loading || isLoading) return <div className="min-h-[50vh] grid place-items-center bg-[#FFFBF5]"><div className="h-8 w-8 animate-spin rounded-full border-2 border-[#0B9C74] border-t-transparent" /></div>

  if (!isVerified) {
    return (
      <div className="min-h-[50vh] grid place-items-center bg-[#FFFBF5] px-4">
        <div className="max-w-md text-center">
          <h1 className="font-display text-2xl font-bold">Verify to view this order</h1>
          <p className="mt-2 text-sm text-[#6b6b6b]">Use the link in your order email, or request a one-time code — no password needed.</p>
          <Link to="/track" className="mt-4 inline-flex rounded-full bg-[#0B9C74] px-6 py-3 text-sm font-bold text-white">Verify with email</Link>
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
              <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${order.paymentStatus === "Paid" ? "border-[#0B9C74]/20 bg-[#E6F7F1] text-[#0B9C74]" : "border-[#F3E6D3] bg-[#FFF1DA] text-[#E85D26]"}`}>{order.paymentStatus}</span>
              <span className="inline-flex rounded-full border border-[#F3E6D3] bg-white px-3 py-1 text-xs font-bold">{order.orderStatus}</span>
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
      </div>
    </div>
  )
}
