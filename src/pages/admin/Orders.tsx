import { useEffect, useState } from "react"
import { Search } from "lucide-react"
import { adminService } from "../../services/adminService"

export default function AdminOrders() {
  const [orders, setOrders] = useState<Awaited<ReturnType<typeof adminService.listAllOrders>>>([])
  const [search, setSearch] = useState("")

  useEffect(() => { adminService.listAllOrders().then(setOrders) }, [])

  const filtered = orders.filter((o) => !search || o.id.toLowerCase().includes(search.toLowerCase()) || o.customerName.toLowerCase().includes(search.toLowerCase()) || o.sellerId.toLowerCase().includes(search.toLowerCase()))

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight">Platform orders</h1>
        <p className="text-sm text-[#6b6b6b]">All orders across sellers. For isolation, seller dashboard only shows own sellerId.</p>
      </div>
      <div className="rounded-2xl bg-white border border-[#F3E6D3] p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9a9a9a]" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search order, customer or sellerId" className="w-full rounded-xl border border-[#F3E6D3] pl-9 pr-3 py-2.5 text-sm focus:border-[#0B9C74] outline-none" />
        </div>
      </div>
      <div className="space-y-2">
        {filtered.slice(0, 20).map((o) => (
          <div key={o.id} className="rounded-2xl bg-white border border-[#F3E6D3] p-4 flex flex-wrap gap-3 justify-between items-center">
            <div>
              <div className="text-sm font-bold font-mono">#{o.id.slice(-6).toUpperCase()} • {o.customerName}</div>
              <div className="text-xs text-[#6b6b6b]">Seller {o.sellerId.slice(-6)} • {o.customerPhone} • {new Date(o.createdAt).toLocaleDateString()}</div>
              <div className="text-xs text-[#6b6b6b]">{o.items.map((i) => `${i.name} x${i.quantity}`).join(", ")}</div>
            </div>
            <div className="text-right">
              <div className="text-sm font-bold">₦{o.total.toLocaleString()}</div>
              <div className="flex gap-2 justify-end mt-1">
                <span className="rounded-full bg-[#FFF1DA] border border-[#F3E6D3] px-2 py-1 text-xs font-bold">{o.orderStatus}</span>
                <span className="rounded-full bg-[#E6F7F1] border border-[#0B9C74]/20 px-2 py-1 text-xs font-bold">{o.paymentStatus}</span>
              </div>
            </div>
          </div>
        ))}
        {filtered.length === 0 && <div className="text-center text-sm text-[#6b6b6b] py-10">No orders yet</div>}
      </div>
    </div>
  )
}
