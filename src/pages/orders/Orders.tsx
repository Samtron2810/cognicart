import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { Search, Eye, Package, Filter, PencilLine, Plus } from "lucide-react"
import { orderService } from "../../services/orderService"
import { OrderSourceBadge } from "../../components/orders/OrderSourceBadge"
import { MANUAL_CHANNELS, MANUAL_CHANNEL_LABELS, ORDER_SOURCES, ORDER_STATUSES, PAYMENT_STATUSES } from "../../types/order"
import type { Order, OrderSource, OrderStatus } from "../../types/order"

const statusColor: Record<OrderStatus, string> = {
  Pending: "bg-[#FFF1DA] text-[#E85D26] border-[#F3E6D3]",
  Confirmed: "bg-[#E6F7F1] text-[#0B9C74] border-[#0B9C74]/20",
  Processing: "bg-[#E6F7F1] text-[#0B9C74] border-[#0B9C74]/20",
  Shipped: "bg-[#E6F7F1] text-[#0B9C74] border-[#0B9C74]/20",
  Delivered: "bg-[#1a1a1a] text-white border-[#1a1a1a]",
  Cancelled: "bg-red-50 text-red-700 border-red-200",
}

const SOURCE_TABS: Array<{ value: "" | OrderSource; label: string; hint: string }> = [
  { value: "", label: "All orders", hint: "Every channel" },
  { value: "storefront", label: "Storefront", hint: "Automatic" },
  { value: "telegram", label: "Telegram", hint: "Automatic" },
  { value: "manual", label: "Manual", hint: "Seller-logged" },
]

export default function Orders() {
  const [orders, setOrders] = useState<Order[]>([])
  const [search, setSearch] = useState("")
  const [status, setStatus] = useState("")
  const [paymentStatus, setPaymentStatus] = useState("")
  const [source, setSource] = useState<"" | OrderSource>("")
  const [sourceChannel, setSourceChannel] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await orderService.list({
        search: search || undefined,
        status: status || undefined,
        paymentStatus: paymentStatus || undefined,
        source: source || undefined,
        sourceChannel: source === "manual" && sourceChannel ? sourceChannel : undefined,
      })
      setOrders(data)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to load orders.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const t = setTimeout(load, 300)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, status, paymentStatus, source, sourceChannel])

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight">Orders</h1>
          <p className="text-sm text-[#6b6b6b]">One dashboard for every sale: automatic storefront and Telegram checkouts, plus orders you log manually from any other channel.</p>
        </div>
        <Link to="/dashboard/orders/manual/new" className="inline-flex items-center gap-2 rounded-full bg-[#E85D26] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#d55422]">
          <Plus className="h-4 w-4" /> Log manual order
        </Link>
      </div>

      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Order source">
        {SOURCE_TABS.map((tab) => (
          <button
            key={tab.value || "all"}
            role="tab"
            aria-selected={source === tab.value}
            onClick={() => { setSource(tab.value); if (tab.value !== "manual") setSourceChannel("") }}
            className={`rounded-full border px-4 py-2 text-sm font-bold transition ${source === tab.value ? "border-[#1a1a1a] bg-[#1a1a1a] text-white" : "border-[#F3E6D3] bg-white hover:bg-[#FFF1DA]"}`}
          >
            {tab.label} <span className={`ml-1 text-[11px] font-medium ${source === tab.value ? "text-white/60" : "text-[#9a9a9a]"}`}>{tab.hint}</span>
          </button>
        ))}
      </div>

      <div className="rounded-2xl bg-white border border-[#F3E6D3] p-4">
        <div className="flex flex-col lg:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9a9a9a]" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by reference, customer or product" className="w-full rounded-xl border border-[#F3E6D3] bg-white pl-9 pr-3 py-2.5 text-sm focus:border-[#0B9C74] focus:ring-2 focus:ring-[#0B9C74]/15 outline-none" />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Filter className="h-4 w-4 text-[#9a9a9a]" />
            <select value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Fulfilment status" className="rounded-xl border border-[#F3E6D3] bg-white px-3 py-2.5 text-sm focus:border-[#0B9C74] outline-none">
              <option value="">All statuses</option>
              {ORDER_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <select value={paymentStatus} onChange={(e) => setPaymentStatus(e.target.value)} aria-label="Payment status" className="rounded-xl border border-[#F3E6D3] bg-white px-3 py-2.5 text-sm focus:border-[#0B9C74] outline-none">
              <option value="">All payments</option>
              {PAYMENT_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            {source === "manual" && (
              <select value={sourceChannel} onChange={(e) => setSourceChannel(e.target.value)} aria-label="Manual source channel" className="rounded-xl border border-[#F3E6D3] bg-white px-3 py-2.5 text-sm focus:border-[#0B9C74] outline-none">
                <option value="">All channels</option>
                {MANUAL_CHANNELS.map((c) => <option key={c} value={c}>{MANUAL_CHANNEL_LABELS[c]}</option>)}
              </select>
            )}
          </div>
        </div>
      </div>

      {error && <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">{error}</div>}

      {loading ? (
        <div className="grid place-items-center py-16"><div className="h-8 w-8 rounded-full border-2 border-[#0B9C74] border-t-transparent animate-spin" /></div>
      ) : orders.length === 0 ? (
        <div className="rounded-2xl bg-white border border-[#F3E6D3] p-10 text-center">
          <div className="mx-auto h-12 w-12 rounded-full bg-[#FFF1DA] border border-[#F3E6D3] grid place-items-center"><Package className="h-6 w-6 text-[#E85D26]" /></div>
          <div className="mt-3 font-bold">No orders match</div>
          <div className="text-sm text-[#6b6b6b]">Storefront checkouts and Telegram bot orders appear automatically. Sales from Instagram, WhatsApp, walk-ins and other channels can be logged manually.</div>
          <Link to="/dashboard/orders/manual/new" className="mt-4 inline-flex items-center gap-2 rounded-full bg-[#E85D26] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#d55422]"><PencilLine className="h-4 w-4" /> Log a manual order</Link>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="hidden lg:grid grid-cols-[130px_150px_1fr_110px_100px_110px_90px] gap-3 px-4 text-xs font-bold tracking-widest text-[#9a9a9a]">
            <span>ORDER</span>
            <span>SOURCE</span>
            <span>CUSTOMER</span>
            <span>TOTAL</span>
            <span>PAYMENT</span>
            <span>STATUS</span>
            <span className="text-right">Action</span>
          </div>
          {orders.map((o) => (
            <div key={o.id} className="rounded-2xl bg-white border border-[#F3E6D3] p-4 lg:py-3 lg:grid lg:grid-cols-[130px_150px_1fr_110px_100px_110px_90px] lg:items-center gap-4">
              <div>
                <div className="text-sm font-bold font-mono">{o.reference || `#${o.id.slice(-6).toUpperCase()}`}</div>
                <div className="text-xs text-[#6b6b6b]">{new Date(o.createdAt).toLocaleDateString()} • {o.items.length} item{o.items.length > 1 ? "s" : ""}</div>
              </div>

              <div className="mt-2 lg:mt-0">
                <OrderSourceBadge source={o.source} sourceChannel={o.sourceChannel || ""} />
              </div>

              <div className="min-w-0 mt-2 lg:mt-0">
                <div className="text-sm font-bold truncate">{o.customerName}</div>
                <div className="text-xs text-[#6b6b6b] truncate">{o.customerPhone}{o.deliveryAddress ? ` • ${o.deliveryAddress.slice(0, 36)}` : ""}</div>
                <div className="hidden lg:block text-xs text-[#6b6b6b] truncate">{o.items.map((i) => i.name).join(", ")}</div>
              </div>

              <div className="hidden sm:block mt-2 lg:mt-0">
                <div className="text-sm font-bold">₦{o.total.toLocaleString()}</div>
                <div className="text-xs text-[#6b6b6b]">Sub ₦{o.subtotal.toLocaleString()} + ₦{o.deliveryFee.toLocaleString()}</div>
              </div>

              <div className="mt-2 lg:mt-0">
                <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold border ${o.paymentStatus === "Paid" ? "bg-[#E6F7F1] text-[#0B9C74] border-[#0B9C74]/20" : o.paymentStatus === "Pending" ? "bg-[#FFF1DA] text-[#E85D26] border-[#F3E6D3]" : "bg-red-50 text-red-700 border-red-200"}`}>{o.paymentStatus}</span>
              </div>

              <div className="mt-2 lg:mt-0">
                <span className={`inline-flex rounded-full px-3 py-1 text-xs font-bold border ${statusColor[o.orderStatus]}`}>{o.orderStatus}</span>
              </div>

              <div className="mt-3 lg:mt-0 flex justify-end">
                <Link to={`/dashboard/orders/${o.id}`} className="inline-flex items-center gap-2 rounded-full bg-[#1a1a1a] px-4 py-2 text-xs font-bold text-white hover:bg-black"><Eye className="h-3.5 w-3.5" /> View</Link>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="rounded-2xl bg-[#1a1a1a] text-white p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="text-sm"><span className="font-bold">Sources:</span> <span className="text-white/70">Storefront and Telegram orders are created automatically with backend pricing. Manual orders record sales you made anywhere else ({ORDER_SOURCES.length} sources, clearly badged).</span></div>
        <Link to="/dashboard/customers" className="rounded-full bg-white px-4 py-2 text-xs font-bold text-[#1a1a1a] hover:bg-[#FFF1DA] shrink-0">View customers</Link>
      </div>
    </div>
  )
}
