import { useEffect, useState } from "react"
import { useParams, Link } from "react-router-dom"
import { ArrowLeft, Ban, CheckCircle, Package, ShoppingCart, UserCircle, MessageSquare } from "lucide-react"
import { adminService } from "../../services/adminService"

export default function SellerDetails() {
  const { id } = useParams<{ id: string }>()
  const [data, setData] = useState<Awaited<ReturnType<typeof adminService.getSellerDetails>> | null>(null)
  const [loading, setLoading] = useState(true)

  const load = async () => {
    if (!id) return
    setLoading(true)
    try {
      const res = await adminService.getSellerDetails(id)
      setData(res)
    } catch {}
    setLoading(false)
  }

  useEffect(() => { load() }, [id])

  const toggle = async () => {
    if (!data) return
    const isActive = data.seller.isActive !== false
    if (!confirm(isActive ? "Suspend seller?" : "Activate seller?")) return
    await adminService.toggleSellerActive(data.seller.id, !isActive)
    load()
  }

  if (loading) return <div className="grid place-items-center py-16"><div className="h-8 w-8 rounded-full border-2 border-[#0B9C74] border-t-transparent animate-spin" /></div>
  if (!data) return <div className="rounded-2xl bg-white border border-[#F3E6D3] p-8 text-center">Seller not found <Link to="/admin/sellers" className="ml-2 font-bold text-[#0B9C74]">Back</Link></div>

  const { seller, business, products, orders, customers, messages, config } = data
  const revenue = orders.filter((o) => o.paymentStatus === "Paid").reduce((sum, o) => sum + o.total, 0)

  return (
    <div className="max-w-5xl space-y-6">
      <Link to="/admin/sellers" className="inline-flex items-center gap-2 text-sm font-medium text-[#6b6b6b] hover:text-[#1a1a1a]"><ArrowLeft className="h-4 w-4" /> Back to sellers</Link>

      <div className="rounded-[22px] bg-white border border-[#F3E6D3] p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex gap-3">
            <div className="h-12 w-12 rounded-xl bg-[#1a1a1a] text-white grid place-items-center font-bold">{seller.businessName.charAt(0)}</div>
            <div>
              <div className="font-display text-xl font-bold flex items-center gap-2">{seller.businessName} {seller.role === "admin" && <span className="rounded-full bg-[#0B9C74] px-2 py-0.5 text-xs text-white">ADMIN</span>} {seller.isActive === false && <span className="rounded-full bg-red-50 border border-red-200 px-2 py-0.5 text-xs font-bold text-red-700">SUSPENDED</span>}</div>
              <div className="text-sm text-[#6b6b6b]">{seller.email} • {seller.phone || "—"} • {seller.role}</div>
              <div className="text-xs text-[#9a9a9a]">Created {new Date(seller.createdAt).toLocaleString()}</div>
            </div>
          </div>
          <button onClick={toggle} className={`inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-bold border ${seller.isActive === false ? "bg-[#E6F7F1] text-[#0B9C74] border-[#0B9C74]/20" : "bg-white border-red-200 text-red-700 hover:bg-red-50"}`}>
            {seller.isActive === false ? <><CheckCircle className="h-4 w-4" /> Activate</> : <><Ban className="h-4 w-4" /> Suspend</>}
          </button>
        </div>

        <div className="mt-6 grid sm:grid-cols-4 gap-3 text-center">
          <div className="rounded-xl bg-[#FFFBF5] border border-[#F3E6D3] p-3"><div className="text-lg font-bold">{products.length}</div><div className="text-xs text-[#6b6b6b]">Products</div></div>
          <div className="rounded-xl bg-[#FFFBF5] border border-[#F3E6D3] p-3"><div className="text-lg font-bold">{orders.length}</div><div className="text-xs text-[#6b6b6b]">Orders</div></div>
          <div className="rounded-xl bg-[#FFFBF5] border border-[#F3E6D3] p-3"><div className="text-lg font-bold">{customers.length}</div><div className="text-xs text-[#6b6b6b]">Customers</div></div>
          <div className="rounded-xl bg-[#FFFBF5] border border-[#F3E6D3] p-3"><div className="text-lg font-bold">₦{revenue.toLocaleString()}</div><div className="text-xs text-[#6b6b6b]">Revenue</div></div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="rounded-2xl bg-white border border-[#F3E6D3] p-5">
          <h3 className="font-bold">Business profile</h3>
          {business ? (
            <div className="mt-3 space-y-2 text-sm">
              <div><span className="font-bold">Name:</span> {business.name}</div>
              <div><span className="font-bold">Phone:</span> {business.phone || "—"}</div>
              <div><span className="font-bold">Location:</span> {business.location || "—"}</div>
              <div><span className="font-bold">Delivery:</span> {business.deliveryInfo || "—"} • Fee ₦{business.deliveryFee ?? "—"}</div>
              <div><span className="font-bold">WhatsApp:</span> {business.whatsappPhone || "—"} {business.whatsappConnected ? "Connected" : "Not connected"}</div>
            </div>
          ) : <div className="text-sm text-[#6b6b6b]">No business yet</div>}
        </div>

        <div className="rounded-2xl bg-white border border-[#F3E6D3] p-5">
          <h3 className="font-bold flex items-center gap-2"><MessageSquare className="h-4 w-4 text-[#0B9C74]" /> WhatsApp</h3>
          {config ? (
            <div className="mt-3 space-y-2 text-sm font-mono text-xs">
              <div>Phone: {config.businessPhone}</div>
              <div>PNID: {config.phoneNumberId}</div>
              <div>Verified: {config.webhookVerified ? "Yes" : "No"}</div>
              <div>Messages: {messages.length} ({messages.filter((m) => m.direction === "inbound").length} in / {messages.filter((m) => m.direction === "outbound").length} out)</div>
            </div>
          ) : <div className="text-sm text-[#6b6b6b]">No WhatsApp config</div>}
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <div className="rounded-2xl bg-white border border-[#F3E6D3] p-5">
          <h3 className="font-bold flex items-center gap-2"><Package className="h-4 w-4" /> Products ({products.length})</h3>
          <div className="mt-3 space-y-2 max-h-64 overflow-auto">
            {products.slice(0, 8).map((p) => <div key={p.id} className="flex justify-between text-sm border-b border-[#F3E6D3] py-2"><span className="truncate">{p.name}</span><span className="font-bold">₦{p.price.toLocaleString()}</span></div>)}
            {products.length === 0 && <div className="text-xs text-[#6b6b6b]">No products</div>}
          </div>
        </div>
        <div className="rounded-2xl bg-white border border-[#F3E6D3] p-5">
          <h3 className="font-bold flex items-center gap-2"><ShoppingCart className="h-4 w-4" /> Orders ({orders.length})</h3>
          <div className="mt-3 space-y-2 max-h-64 overflow-auto">
            {orders.slice(0, 8).map((o) => <div key={o.id} className="flex justify-between text-sm border-b border-[#F3E6D3] py-2"><span className="truncate">#{o.id.slice(-6)} • {o.customerName}</span><span className="font-bold">{o.orderStatus}</span></div>)}
            {orders.length === 0 && <div className="text-xs text-[#6b6b6b]">No orders</div>}
          </div>
        </div>
        <div className="rounded-2xl bg-white border border-[#F3E6D3] p-5">
          <h3 className="font-bold flex items-center gap-2"><UserCircle className="h-4 w-4" /> Customers ({customers.length})</h3>
          <div className="mt-3 space-y-2 max-h-64 overflow-auto">
            {customers.slice(0, 8).map((c) => <div key={c.id} className="flex justify-between text-sm border-b border-[#F3E6D3] py-2"><span className="truncate">{c.name}</span><span className="text-xs">{c.phone}</span></div>)}
            {customers.length === 0 && <div className="text-xs text-[#6b6b6b]">No customers</div>}
          </div>
        </div>
      </div>
    </div>
  )
}
