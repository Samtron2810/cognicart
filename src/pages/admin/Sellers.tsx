import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { Search, Eye, Ban, CheckCircle, Store, Wallet } from "lucide-react"
import { adminService } from "../../services/adminService"

export default function AdminSellers() {
  const [sellers, setSellers] = useState<Awaited<ReturnType<typeof adminService.listSellers>>>([])
  const [search, setSearch] = useState("")

  const load = async () => {
    const data = await adminService.listSellers()
    setSellers(data)
  }

  useEffect(() => { load() }, [])

  const filtered = sellers.filter((s) => !search || s.seller.businessName.toLowerCase().includes(search.toLowerCase()) || s.seller.email.toLowerCase().includes(search.toLowerCase()))

  const toggle = async (sellerId: string, isActive: boolean) => {
    if (!confirm(isActive ? "Suspend this seller?" : "Activate this seller?")) return
    await adminService.toggleSellerActive(sellerId, !isActive)
    load()
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight">Manages sellers</h1>
        <p className="text-sm text-[#6b6b6b]">Platform owner view. All sellers tenant-isolated. You can view business, products, orders, revenue and suspend for abuse.</p>
      </div>

      <div className="rounded-2xl bg-white border border-[#F3E6D3] p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9a9a9a]" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by business or email" className="w-full rounded-xl border border-[#F3E6D3] pl-9 pr-3 py-2.5 text-sm focus:border-[#0B9C74] outline-none" />
        </div>
      </div>

      <div className="space-y-3">
        <div className="hidden lg:grid grid-cols-[1fr_90px_90px_110px_110px_160px] gap-3 px-4 text-xs font-bold tracking-widest text-[#9a9a9a]">
          <span>SELLER</span><span>PRODUCTS</span><span>ORDERS</span><span>REVENUE</span><span>WHATSAPP</span><span className="text-right">ACTION</span>
        </div>
        {filtered.map(({ seller, productsCount, ordersCount, revenue, whatsappConnected, webhookVerified }) => (
          <div key={seller.id} className="rounded-2xl bg-white border border-[#F3E6D3] p-4 lg:grid lg:grid-cols-[1fr_90px_90px_110px_110px_160px] lg:items-center gap-4">
            <div className="min-w-0">
              <div className="text-sm font-bold truncate flex items-center gap-2">
                {seller.businessName}
                {seller.role === "admin" && <span className="rounded-full bg-[#0B9C74] px-2 py-0.5 text-xs text-white">ADMIN</span>}
                {seller.isActive === false && <span className="rounded-full bg-red-50 border border-red-200 px-2 py-0.5 text-xs font-bold text-red-700">SUSPENDED</span>}
              </div>
              <div className="text-xs text-[#6b6b6b] truncate">{seller.email} • {seller.phone || "—"}</div>
              <div className="text-xs text-[#9a9a9a]">{seller.role || "seller"} • {new Date(seller.createdAt).toLocaleDateString()}</div>
            </div>
            <div className="hidden lg:block text-sm font-bold">{productsCount}</div>
            <div className="hidden lg:block text-sm font-bold">{ordersCount}</div>
            <div className="hidden lg:block text-sm font-bold">₦{revenue.toLocaleString()}</div>
            <div className="hidden lg:block">
              <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold border ${whatsappConnected ? "bg-[#E6F7F1] text-[#0B9C74] border-[#0B9C74]/20" : "bg-[#FFF1DA] text-[#6b6b6b] border-[#F3E6D3]"}`}>
                {whatsappConnected ? <><Store className="h-3 w-3" /> Connected</> : "Not connected"}
              </span>
              {webhookVerified && <span className="ml-1 inline-flex rounded-full bg-[#1a1a1a] px-2 py-1 text-xs font-bold text-white">Verified</span>}
            </div>
            <div className="mt-3 lg:mt-0 flex justify-end gap-2">
              <Link to={`/admin/sellers/${seller.id}`} className="inline-flex items-center gap-1 rounded-full bg-[#1a1a1a] px-4 py-2 text-xs font-bold text-white hover:bg-black"><Eye className="h-3.5 w-3.5" /> View</Link>
              <button onClick={() => toggle(seller.id, seller.isActive !== false)} className={`inline-flex items-center gap-1 rounded-full px-4 py-2 text-xs font-bold border ${seller.isActive === false ? "bg-[#E6F7F1] text-[#0B9C74] border-[#0B9C74]/20" : "bg-white border-red-200 text-red-700 hover:bg-red-50"}`}>
                {seller.isActive === false ? <><CheckCircle className="h-3.5 w-3.5" /> Activate</> : <><Ban className="h-3.5 w-3.5" /> Suspend</>}
              </button>
            </div>
            <div className="lg:hidden mt-2 flex flex-wrap gap-2 text-xs">
              <span className="rounded-full bg-[#FFF1DA] border border-[#F3E6D3] px-2 py-1"><Wallet className="h-3 w-3 inline" /> ₦{revenue.toLocaleString()}</span>
              <span className="rounded-full bg-white border border-[#F3E6D3] px-2 py-1">{productsCount} products</span>
              <span className="rounded-full bg-white border border-[#F3E6D3] px-2 py-1">{ordersCount} orders</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
