import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { Users, ShoppingCart, Wallet, Package, MessageSquare, TrendingUp, AlertTriangle, CreditCard } from "lucide-react"
import { adminService } from "../../services/adminService"

export default function AdminDashboard() {
  const [stats, setStats] = useState<Awaited<ReturnType<typeof adminService.getPlatformStats>> | null>(null)

  useEffect(() => {
    adminService.getPlatformStats().then(setStats)
  }, [])

  if (!stats) return <div className="grid place-items-center py-16"><div className="h-8 w-8 rounded-full border-2 border-[#0B9C74] border-t-transparent animate-spin" /></div>

  const cards = [
    { label: "Total sellers", value: stats.totalSellers, sub: `${stats.activeSellers} active`, icon: Users, color: "bg-[#1a1a1a]" },
    { label: "Total orders", value: stats.totalOrders, sub: `${stats.pendingOrders} pending`, icon: ShoppingCart, color: "bg-[#E85D26]" },
    { label: "Platform revenue", value: `₦${stats.platformRevenue.toLocaleString()}`, sub: `${stats.fee.percentage}% fee • Paystack ₦${(stats as { paystackFees?: number }).paystackFees?.toLocaleString() || "0"}`, icon: Wallet, color: "bg-[#0B9C74]" },
    { label: "Total products", value: stats.totalProducts, sub: `${stats.activeProducts} active`, icon: Package, color: "bg-[#6b6b6b]" },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight">Platform overview — Phase 8</h1>
        <p className="text-sm text-[#6b6b6b]">Transaction ledger shows orderAmount, platformFee, sellerAmount, paystackFee, currency, reference, status. Tenant data aggregated but isolated per sellerId.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c) => (
          <div key={c.label} className="rounded-2xl bg-white border border-[#F3E6D3] p-4">
            <div className={`h-9 w-9 rounded-xl ${c.color} text-white grid place-items-center`}><c.icon className="h-4 w-4" /></div>
            <div className="mt-3 text-xl font-bold">{c.value}</div>
            <div className="text-xs font-medium text-[#6b6b6b]">{c.label}</div>
            <div className="text-xs text-[#9a9a9a]">{c.sub}</div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 rounded-2xl bg-white border border-[#F3E6D3] p-5">
          <div className="flex items-center justify-between">
            <h2 className="font-bold">Recent platform orders</h2>
            <Link to="/admin/orders" className="text-sm font-bold text-[#0B9C74] hover:underline">View all</Link>
          </div>
          <div className="mt-4 space-y-2">
            {(stats.orders as Array<{ id: string; sellerId: string; customerName: string; total: number; orderStatus: string; paymentStatus: string }>).slice(0, 5).map((o) => (
              <div key={o.id} className="flex items-center gap-3 rounded-xl border border-[#F3E6D3] p-3">
                <div className="h-10 w-10 rounded-xl bg-[#1a1a1a] text-white grid place-items-center"><ShoppingCart className="h-4 w-4" /></div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold truncate">#{o.id.slice(-6).toUpperCase()} • {o.customerName} • <span className="text-xs font-normal">Paid {o.paymentStatus === "Paid" ? "✓" : "○"}</span></div>
                  <div className="text-xs text-[#6b6b6b]">Seller {o.sellerId.slice(-6)} • ₦{o.total.toLocaleString()}</div>
                </div>
                <span className="rounded-full bg-[#FFF1DA] border border-[#F3E6D3] px-2 py-1 text-xs font-bold">{o.orderStatus}</span>
              </div>
            ))}
          </div>
          <Link to="/admin/revenue" className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-[#0B9C74] hover:underline"><Wallet className="h-3.5 w-3.5" /> View ledger →</Link>
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl bg-white border border-[#F3E6D3] p-5">
            <h3 className="font-bold flex items-center gap-2"><MessageSquare className="h-4 w-4 text-[#0B9C74]" /> WhatsApp usage</h3>
            <div className="mt-3 grid grid-cols-2 gap-3 text-center">
              <div className="rounded-xl bg-[#FFFBF5] border border-[#F3E6D3] p-3"><div className="text-lg font-bold">{stats.totalMessages}</div><div className="text-xs text-[#6b6b6b]">Messages</div></div>
              <div className="rounded-xl bg-[#FFFBF5] border border-[#F3E6D3] p-3"><div className="text-lg font-bold">{stats.inboundMessages}</div><div className="text-xs text-[#6b6b6b]">Inbound</div></div>
            </div>
            <Link to="/admin/whatsapp" className="mt-3 inline-flex text-xs font-bold text-[#0B9C74] hover:underline">Monitor WhatsApp →</Link>
          </div>

          <div className="rounded-2xl bg-[#1a1a1a] text-white p-6">
            <h3 className="font-bold flex items-center gap-2"><TrendingUp className="h-4 w-4" /> Sales — Reconciliation</h3>
            <div className="mt-2 text-2xl font-bold">₦{stats.totalSales.toLocaleString()}</div>
            <div className="text-xs text-white/60">Gross sales • Seller earnings ₦{stats.sellerEarnings.toLocaleString()} • Paystack ₦{(stats as { paystackFees?: number }).paystackFees?.toLocaleString() || "0"}</div>
            <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
              <div className="rounded-xl bg-white/10 p-2 text-center"><div className="font-bold">₦{stats.platformRevenue.toLocaleString()}</div><div className="text-white/60">Platform {stats.fee.percentage}%</div></div>
              <div className="rounded-xl bg-white/10 p-2 text-center"><div className="font-bold">{stats.pendingOrders} pending</div><div className="text-white/60">To reconcile</div></div>
            </div>
            <div className="mt-3 flex gap-2">
              <Link to="/admin/revenue" className="flex-1 inline-flex justify-center items-center gap-1 rounded-full bg-white px-3 py-2 text-xs font-bold text-[#1a1a1a] hover:bg-[#FFF1DA]"><CreditCard className="h-3.5 w-3.5" /> Ledger</Link>
              <Link to="/admin/payments" className="flex-1 inline-flex justify-center rounded-full bg-[#0B9C74] px-3 py-2 text-xs font-bold text-white hover:bg-[#0a8a66]">Payments</Link>
            </div>
            <div className="mt-4 rounded-xl bg-white/10 p-3 text-xs leading-5 text-white/70">
              <div className="font-bold text-white flex items-center gap-1"><AlertTriangle className="h-3.5 w-3.5" /> Reconciliation</div>
              Every Paid transaction has orderAmount, platformFee, sellerAmount, paystackFee, NGN, reference, status. See Revenue → Export.
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
