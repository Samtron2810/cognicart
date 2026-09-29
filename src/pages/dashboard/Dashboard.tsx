import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { Package, ShoppingCart, AlertTriangle, TrendingUp, Plus, ClipboardList, Wallet, Banknote, Hourglass, Send } from "lucide-react"
import { productService } from "../../services/productService"
import { orderService } from "../../services/orderService"
import { OrderSourceBadge } from "../../components/orders/OrderSourceBadge"
import type { Product } from "../../types/product"
import type { Order, OrderSummary } from "../../types/order"

export default function Dashboard() {
  const [products, setProducts] = useState<Product[]>([])
  const [recentOrders, setRecentOrders] = useState<Order[]>([])
  const [summary, setSummary] = useState<OrderSummary | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)

  useEffect(() => {
    productService.list().then(setProducts).catch(() => {})
    orderService.list().then((orders) => setRecentOrders(orders.slice(0, 5))).catch(() => {})
    // Global totals always come from the backend aggregation — never from
    // whatever page of orders happens to be loaded in the browser.
    orderService.summary().then(setSummary).catch(() => setLoadError("Unable to load order summary."))
  }, [])

  const totalProducts = products.length
  const lowStock = products.filter((p) => p.stock > 0 && p.stock <= 5).length
  const outOfStock = products.filter((p) => p.stock === 0).length

  const totals = summary?.totals
  const sourceCount = (source: string) => summary?.bySource.find((s) => s._id === source)?.orders ?? 0
  const statusCount = (status: string) => summary?.byStatus.find((s) => s._id === status)?.orders ?? 0
  const paymentCount = (status: string) => summary?.byPaymentStatus.find((s) => s._id === status)?.orders ?? 0

  const orderStats = [
    { label: "Total orders", value: totals ? totals.orders.toLocaleString() : "—", icon: ClipboardList, color: "bg-[#1a1a1a]" },
    { label: "Gross order value", value: totals ? `₦${totals.grossOrderValue.toLocaleString()}` : "—", icon: Wallet, color: "bg-[#0B9C74]" },
    { label: "Paid revenue", value: totals ? `₦${totals.paidRevenue.toLocaleString()}` : "—", icon: Banknote, color: "bg-[#0B9C74]" },
    { label: "Outstanding", value: totals ? `₦${totals.outstanding.toLocaleString()}` : "—", icon: Hourglass, color: "bg-[#E85D26]" },
  ]

  const productStats = [
    { label: "Total products", value: totalProducts, icon: Package, color: "bg-[#0B9C74]" },
    { label: "Low stock", value: lowStock, icon: AlertTriangle, color: "bg-[#E85D26]" },
    { label: "Out of stock", value: outOfStock, icon: ShoppingCart, color: "bg-[#6b6b6b]" },
    { label: "Active", value: products.filter((p) => p.isActive).length, icon: TrendingUp, color: "bg-[#1a1a1a]" },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-sm text-[#6b6b6b]">Storefront, Telegram, and manually logged sales in one place. Data is tenant-isolated by sellerId.</p>
        </div>
        <div className="flex gap-2">
          <Link to="/dashboard/orders/manual/new" className="hidden sm:inline-flex items-center gap-2 rounded-full bg-white border border-[#F3E6D3] px-5 py-2.5 text-sm font-bold hover:bg-[#FFF1DA]">
            <ClipboardList className="h-4 w-4" /> Log manual order
          </Link>
          <Link to="/dashboard/products/new" className="inline-flex items-center gap-2 rounded-full bg-[#0B9C74] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#0a8a66]">
            <Plus className="h-4 w-4" /> Add product
          </Link>
        </div>
      </div>

      {loadError && <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">{loadError}</div>}

      <div>
        <h2 className="text-xs font-bold tracking-widest text-[#9a9a9a] mb-2">ORDERS & REVENUE (ALL TIME, SERVER-AGGREGATED)</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {orderStats.map((s) => (
            <div key={s.label} className="rounded-2xl bg-white border border-[#F3E6D3] p-4">
              <div className={`h-9 w-9 rounded-xl ${s.color} text-white grid place-items-center`}>
                <s.icon className="h-4 w-4" />
              </div>
              <div className="mt-3 text-xl font-bold truncate">{s.value}</div>
              <div className="text-xs font-medium text-[#6b6b6b]">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-2xl bg-white border border-[#F3E6D3] p-4">
          <h3 className="text-xs font-bold tracking-widest text-[#9a9a9a]">BY SOURCE</h3>
          <div className="mt-3 space-y-2 text-sm">
            <div className="flex items-center justify-between"><OrderSourceBadge source="storefront" /><span className="font-bold">{sourceCount("storefront")}</span></div>
            <div className="flex items-center justify-between"><OrderSourceBadge source="telegram" /><span className="font-bold">{sourceCount("telegram")}</span></div>
            <div className="flex items-center justify-between"><OrderSourceBadge source="manual" /><span className="font-bold">{sourceCount("manual")}</span></div>
          </div>
        </div>
        <div className="rounded-2xl bg-white border border-[#F3E6D3] p-4">
          <h3 className="text-xs font-bold tracking-widest text-[#9a9a9a]">FULFILMENT</h3>
          <div className="mt-3 space-y-2 text-sm">
            {["Pending", "Processing", "Shipped", "Delivered", "Cancelled"].map((status) => (
              <div key={status} className="flex items-center justify-between"><span>{status}</span><span className="font-bold">{statusCount(status)}</span></div>
            ))}
          </div>
        </div>
        <div className="rounded-2xl bg-white border border-[#F3E6D3] p-4">
          <h3 className="text-xs font-bold tracking-widest text-[#9a9a9a]">PAYMENTS</h3>
          <div className="mt-3 space-y-2 text-sm">
            {["Paid", "Pending", "Failed", "Refunded"].map((status) => (
              <div key={status} className="flex items-center justify-between"><span>{status}</span><span className="font-bold">{paymentCount(status)}</span></div>
            ))}
          </div>
        </div>
      </div>

      <div>
        <h2 className="text-xs font-bold tracking-widest text-[#9a9a9a] mb-2">PRODUCTS</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {productStats.map((s) => (
            <div key={s.label} className="rounded-2xl bg-white border border-[#F3E6D3] p-4">
              <div className={`h-9 w-9 rounded-xl ${s.color} text-white grid place-items-center`}>
                <s.icon className="h-4 w-4" />
              </div>
              <div className="mt-3 text-2xl font-bold">{s.value}</div>
              <div className="text-xs font-medium text-[#6b6b6b]">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-2xl bg-white border border-[#F3E6D3] p-5">
            <div className="flex items-center justify-between">
              <h2 className="font-bold">Recent orders</h2>
              <Link to="/dashboard/orders" className="text-sm font-bold text-[#0B9C74] hover:underline">
                View all
              </Link>
            </div>
            <div className="mt-4 space-y-3">
              {recentOrders.map((o) => (
                <Link key={o.id} to={`/dashboard/orders/${o.id}`} className="flex items-center gap-3 rounded-xl border border-[#F3E6D3] p-3 hover:bg-[#FFFBF5] transition">
                  <div className="h-10 w-10 rounded-xl bg-[#1a1a1a] text-white grid place-items-center shrink-0"><ClipboardList className="h-4 w-4" /></div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-bold truncate">{o.reference || `#${o.id.slice(-6).toUpperCase()}`} • {o.customerName}</div>
                    <div className="text-xs text-[#6b6b6b] truncate">{o.items.map((i) => i.name).join(", ")} • ₦{o.total.toLocaleString()}</div>
                  </div>
                  <OrderSourceBadge source={o.source} sourceChannel={o.sourceChannel || ""} className="shrink-0" />
                </Link>
              ))}
              {recentOrders.length === 0 && <div className="text-sm text-[#6b6b6b] py-6 text-center">No orders yet. Storefront and Telegram orders appear automatically; other sales can be logged manually.</div>}
            </div>
          </div>

          <div className="rounded-2xl bg-white border border-[#F3E6D3] p-5">
            <div className="flex items-center justify-between">
              <h2 className="font-bold">Recent products</h2>
              <Link to="/dashboard/products" className="text-sm font-bold text-[#0B9C74] hover:underline">
                View all
              </Link>
            </div>
            <div className="mt-4 space-y-3">
              {products.slice(0, 4).map((p) => (
                <div key={p.id} className="flex items-center gap-3 rounded-xl border border-[#F3E6D3] p-3">
                  <img src={p.images[0] || "https://via.placeholder.com/80"} alt={p.name} className="h-12 w-12 rounded-lg object-cover bg-[#FFFBF5]" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-bold truncate">{p.name}</div>
                    <div className="text-xs text-[#6b6b6b]">₦{p.price.toLocaleString()} • Stock {p.stock} • {p.category}</div>
                  </div>
                  <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${p.isActive ? "bg-[#E6F7F1] text-[#0B9C74]" : "bg-[#FFF1DA] text-[#6b6b6b]"}`}>{p.isActive ? "Active" : "Inactive"}</span>
                </div>
              ))}
              {products.length === 0 && <div className="text-sm text-[#6b6b6b] py-8 text-center">No products yet. Create your first product.</div>}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-2xl bg-[#1a1a1a] text-white p-6">
            <h3 className="font-bold flex items-center gap-2"><Send className="h-4 w-4 text-[#229ED9]" /> Telegram commerce</h3>
            <p className="mt-2 text-sm text-white/70 leading-6">Connect your Telegram bot so customers can browse and order in chat. Telegram orders join this dashboard automatically.</p>
            <Link to="/dashboard/telegram" className="mt-4 inline-flex rounded-full bg-white px-4 py-2 text-sm font-bold text-[#1a1a1a] hover:bg-[#FFF1DA]">
              Manage Telegram
            </Link>
            <div className="mt-6 rounded-xl bg-white/10 p-3 text-xs leading-5 text-white/70">
              <div className="font-bold text-white">How it works</div>
              Storefront and Telegram checkouts verify live stock and freeze prices at order time. Manual orders record sales you made anywhere else.
            </div>
          </div>

          <div className="rounded-2xl bg-white border border-[#F3E6D3] p-5">
            <h3 className="font-bold text-sm">Low stock alert</h3>
            <div className="mt-3 space-y-2">
              {products.filter((p) => p.stock > 0 && p.stock <= 5).slice(0, 3).map((p) => (
                <div key={p.id} className="flex items-center justify-between text-sm">
                  <span className="truncate font-medium">{p.name}</span>
                  <span className="rounded-full bg-[#FFF1DA] border border-[#F3E6D3] px-2 py-1 text-xs font-bold text-[#E85D26]">Stock {p.stock}</span>
                </div>
              ))}
              {products.filter((p) => p.stock > 0 && p.stock <= 5).length === 0 && <div className="text-xs text-[#6b6b6b]">No low stock items.</div>}
            </div>
            <Link to="/dashboard/products" className="mt-3 inline-flex text-xs font-bold text-[#0B9C74] hover:underline">Restock →</Link>
          </div>
        </div>
      </div>
    </div>
  )
}
