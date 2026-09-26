import { useEffect, useState } from "react"
import { Search, User, MapPin, Phone, ShoppingBag } from "lucide-react"
import { Link } from "react-router-dom"
import { customerService } from "../../services/customerService"
import type { Customer } from "../../types/customer"
import { orderService } from "../../services/orderService"
import { productService } from "../../services/productService"

export default function Customers() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    const data = await customerService.list({ search: search || undefined })
    setCustomers(data)
    setLoading(false)
  }

  useEffect(() => {
    productService.seedDemo()
    // ensure demo customers and orders exist so aggregates are populated
    customerService.seedDemo()
    orderService.seedDemo()
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const t = setTimeout(load, 300)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search])

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight">Customers</h1>
        <p className="text-sm text-[#6b6b6b]">Seller-scoped by sellerId and phone. Same WhatsApp user can exist across different sellers but data is isolated.</p>
      </div>

      <div className="rounded-2xl bg-white border border-[#F3E6D3] p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9a9a9a]" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name, phone or WhatsApp" className="w-full rounded-xl border border-[#F3E6D3] bg-white pl-9 pr-3 py-2.5 text-sm focus:border-[#0B9C74] focus:ring-2 focus:ring-[#0B9C74]/15 outline-none" />
        </div>
      </div>

      {loading ? (
        <div className="grid place-items-center py-16"><div className="h-8 w-8 rounded-full border-2 border-[#0B9C74] border-t-transparent animate-spin" /></div>
      ) : customers.length === 0 ? (
        <div className="rounded-2xl bg-white border border-[#F3E6D3] p-10 text-center">
          <div className="mx-auto h-12 w-12 rounded-full bg-[#FFF1DA] border border-[#F3E6D3] grid place-items-center"><User className="h-6 w-6 text-[#E85D26]" /></div>
          <div className="mt-3 font-bold">No customers yet</div>
          <div className="text-sm text-[#6b6b6b]">Customers appear when WhatsApp orders are created. Create a test order in Orders to generate one.</div>
          <Link to="/dashboard/orders" className="mt-4 inline-flex rounded-full bg-[#0B9C74] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#0a8a66]">Go to orders</Link>
        </div>
      ) : (
        <div className="grid gap-3">
          <div className="hidden lg:grid grid-cols-[1fr_140px_140px_120px] gap-3 px-4 text-xs font-bold tracking-widest text-[#9a9a9a]">
            <span>CUSTOMER</span>
            <span>ORDERS</span>
            <span>TOTAL SPENT</span>
            <span>LAST ORDER</span>
          </div>
          {customers.map((c) => (
            <div key={c.id} className="rounded-2xl bg-white border border-[#F3E6D3] p-4 lg:grid lg:grid-cols-[1fr_140px_140px_120px] lg:items-center gap-4">
              <div className="flex gap-3 min-w-0">
                <div className="h-11 w-11 rounded-full bg-[#FFF1DA] border border-[#F3E6D3] grid place-items-center shrink-0"><User className="h-5 w-5 text-[#E85D26]" /></div>
                <div className="min-w-0">
                  <div className="text-sm font-bold leading-tight truncate">{c.name}</div>
                  <div className="text-xs text-[#6b6b6b] flex items-center gap-1 truncate"><Phone className="h-3 w-3" /> {c.phone} • WhatsApp {c.whatsappId}</div>
                  <div className="text-xs text-[#6b6b6b] flex items-center gap-1 truncate"><MapPin className="h-3 w-3" /> {c.addresses[0] || "No address"}</div>
                </div>
              </div>

              <div className="mt-3 lg:mt-0 flex items-center gap-2 text-sm lg:block">
                <span className="inline-flex items-center gap-1 rounded-full bg-[#E6F7F1] border border-[#0B9C74]/20 px-2.5 py-1 text-xs font-bold text-[#0B9C74]"><ShoppingBag className="h-3.5 w-3.5" /> {c.totalOrders} order{c.totalOrders !== 1 ? "s" : ""}</span>
                <div className="lg:hidden text-xs text-[#6b6b6b]">Spent ₦{c.totalSpent.toLocaleString()}</div>
              </div>

              <div className="hidden lg:block text-sm font-bold">₦{c.totalSpent.toLocaleString()}</div>
              <div className="hidden lg:block text-xs text-[#6b6b6b]">{c.lastOrderAt ? new Date(c.lastOrderAt).toLocaleDateString() : "—"}</div>

              <div className="lg:hidden mt-2 text-xs text-[#6b6b6b]">Last order {c.lastOrderAt ? new Date(c.lastOrderAt).toLocaleDateString() : "—"} • Spent ₦{c.totalSpent.toLocaleString()}</div>
            </div>
          ))}
        </div>
      )}

      <div className="rounded-2xl bg-[#FFF1DA] border border-[#F3E6D3] p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="text-sm"><span className="font-bold">Multi-tenant note:</span> <span className="text-[#6b6b6b]">find customer by phone + sellerId. Cross-seller isolation enforced.</span></div>
        <Link to="/dashboard/orders" className="rounded-full bg-[#1a1a1a] px-4 py-2 text-xs font-bold text-white hover:bg-black">View orders</Link>
      </div>
    </div>
  )
}
