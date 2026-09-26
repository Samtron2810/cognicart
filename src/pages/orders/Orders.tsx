import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { Search, Plus, Trash2, Eye, Package, Filter } from "lucide-react"
import { orderService } from "../../services/orderService"
import { productService } from "../../services/productService"
import { ORDER_STATUSES } from "../../types/order"
import type { Order, OrderStatus } from "../../types/order"

const statusColor: Record<OrderStatus, string> = {
  Pending: "bg-[#FFF1DA] text-[#E85D26] border-[#F3E6D3]",
  Confirmed: "bg-[#E6F7F1] text-[#0B9C74] border-[#0B9C74]/20",
  Processing: "bg-[#E6F7F1] text-[#0B9C74] border-[#0B9C74]/20",
  Shipped: "bg-[#E6F7F1] text-[#0B9C74] border-[#0B9C74]/20",
  Delivered: "bg-[#1a1a1a] text-white border-[#1a1a1a]",
  Cancelled: "bg-red-50 text-red-700 border-red-200",
}

export default function Orders() {
  const [orders, setOrders] = useState<Order[]>([])
  const [search, setSearch] = useState("")
  const [status, setStatus] = useState("")
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = async () => {
    setLoading(true)
    const data = await orderService.list({ search: search || undefined, status: status || undefined })
    setOrders(data)
    setLoading(false)
  }

  useEffect(() => {
    productService.seedDemo()
    orderService.seedDemo()
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const t = setTimeout(load, 300)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, status])

  const handleCreateTest = async () => {
    setCreating(true)
    setError(null)
    try {
      const products = await productService.list({ isActive: true })
      const available = products.filter((p) => p.stock > 0)
      if (available.length === 0) throw new Error("No products with stock. Add stock first.")
      const randomProduct = available[Math.floor(Math.random() * available.length)]
      const qty = Math.random() > 0.7 ? 2 : 1
      const customers = [
        { name: "Chiamaka Nnaji", phone: "+234801000000" + Math.floor(Math.random() * 9), address: "22 Bode Thomas, Surulere, Lagos" },
        { name: "Emeka John", phone: "+234802000000" + Math.floor(Math.random() * 9), address: "10 Stadium Road, Port Harcourt" },
        { name: "Fatima Bello", phone: "+234803000000" + Math.floor(Math.random() * 9), address: "3 Wuse 2, Abuja" },
      ]
      const customer = customers[Math.floor(Math.random() * customers.length)]
      await orderService.create({
        customer,
        items: [{ productId: randomProduct.id, quantity: qty }],
        deliveryAddress: customer.address,
      })
      load()
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to create order"
      setError(msg)
    } finally {
      setCreating(false)
    }
  }

  const handleClear = () => {
    if (!confirm("Clear all demo orders for this seller?")) return
    orderService.clearAll()
    load()
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight">Orders</h1>
          <p className="text-sm text-[#6b6b6b]">Every order from WhatsApp lands here. Customer, items, total and status are tenant-isolated by sellerId.</p>
          {error && <div className="mt-2 rounded-xl bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">{error}</div>}
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={handleCreateTest} disabled={creating} className="inline-flex items-center gap-2 rounded-full bg-[#0B9C74] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#0a8a66] disabled:opacity-60">
            <Plus className="h-4 w-4" /> {creating ? "Creating..." : "Create test order"}
          </button>
          <button onClick={handleClear} className="inline-flex items-center gap-2 rounded-full bg-white border border-[#F3E6D3] px-4 py-2.5 text-sm font-bold hover:bg-[#FFF1DA]">
            <Trash2 className="h-4 w-4" /> Clear
          </button>
        </div>
      </div>

      <div className="rounded-2xl bg-white border border-[#F3E6D3] p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9a9a9a]" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by order id, customer or product" className="w-full rounded-xl border border-[#F3E6D3] bg-white pl-9 pr-3 py-2.5 text-sm focus:border-[#0B9C74] focus:ring-2 focus:ring-[#0B9C74]/15 outline-none" />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-[#9a9a9a]" />
            <select value={status} onChange={(e) => setStatus(e.target.value)} className="rounded-xl border border-[#F3E6D3] bg-white px-3 py-2.5 text-sm focus:border-[#0B9C74] outline-none">
              <option value="">All statuses</option>
              {ORDER_STATUSES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="grid place-items-center py-16"><div className="h-8 w-8 rounded-full border-2 border-[#0B9C74] border-t-transparent animate-spin" /></div>
      ) : orders.length === 0 ? (
        <div className="rounded-2xl bg-white border border-[#F3E6D3] p-10 text-center">
          <div className="mx-auto h-12 w-12 rounded-full bg-[#FFF1DA] border border-[#F3E6D3] grid place-items-center"><Package className="h-6 w-6 text-[#E85D26]" /></div>
          <div className="mt-3 font-bold">No orders yet</div>
          <div className="text-sm text-[#6b6b6b]">Create a test order. In production WhatsApp AI will create orders via the test endpoint before AI is connected.</div>
          <button onClick={handleCreateTest} className="mt-4 inline-flex rounded-full bg-[#1a1a1a] px-5 py-2.5 text-sm font-bold text-white hover:bg-black">Create test order</button>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="hidden lg:grid grid-cols-[140px_1fr_120px_100px_120px_100px] gap-3 px-4 text-xs font-bold tracking-widest text-[#9a9a9a]">
            <span>ORDER</span>
            <span>CUSTOMER</span>
            <span>TOTAL</span>
            <span>PAYMENT</span>
            <span>STATUS</span>
            <span className="text-right">Action</span>
          </div>
          {orders.map((o) => (
            <div key={o.id} className="rounded-2xl bg-white border border-[#F3E6D3] p-4 lg:py-3 lg:grid lg:grid-cols-[140px_1fr_120px_100px_120px_100px] lg:items-center gap-4">
              <div>
                <div className="text-sm font-bold font-mono">#{o.id.slice(-6).toUpperCase()}</div>
                <div className="text-xs text-[#6b6b6b]">{new Date(o.createdAt).toLocaleDateString()} • {o.items.length} item{o.items.length > 1 ? "s" : ""}</div>
                <div className="lg:hidden mt-1 text-xs text-[#6b6b6b]">{o.items.map((i) => `${i.name} x${i.quantity}`).join(", ")}</div>
              </div>

              <div className="min-w-0">
                <div className="text-sm font-bold truncate">{o.customerName}</div>
                <div className="text-xs text-[#6b6b6b] truncate">{o.customerPhone} • {o.deliveryAddress.slice(0, 36)}</div>
                <div className="hidden lg:block text-xs text-[#6b6b6b] truncate">{o.items.map((i) => i.name).join(", ")}</div>
              </div>

              <div className="hidden sm:block">
                <div className="text-sm font-bold">₦{o.total.toLocaleString()}</div>
                <div className="text-xs text-[#6b6b6b]">Sub ₦{o.subtotal.toLocaleString()} + ₦{o.deliveryFee.toLocaleString()}</div>
              </div>

              <div>
                <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold border ${o.paymentStatus === "Paid" ? "bg-[#E6F7F1] text-[#0B9C74] border-[#0B9C74]/20" : o.paymentStatus === "Pending" ? "bg-[#FFF1DA] text-[#E85D26] border-[#F3E6D3]" : "bg-red-50 text-red-700 border-red-200"}`}>{o.paymentStatus}</span>
              </div>

              <div>
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
        <div className="text-sm"><span className="font-bold">Backend test endpoint:</span> <span className="text-white/70">POST /api/orders will also create orders. For now use Create test order above.</span></div>
        <Link to="/dashboard/customers" className="rounded-full bg-white px-4 py-2 text-xs font-bold text-[#1a1a1a] hover:bg-[#FFF1DA]">View customers</Link>
      </div>
    </div>
  )
}
