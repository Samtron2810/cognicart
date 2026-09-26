import { useEffect, useState } from "react"
import { adminService } from "../../services/adminService"

export default function AdminReports() {
  const [stats, setStats] = useState<Awaited<ReturnType<typeof adminService.getPlatformStats>> | null>(null)

  useEffect(() => { adminService.getPlatformStats().then(setStats) }, [])

  if (!stats) return <div className="grid place-items-center py-10"><div className="h-8 w-8 rounded-full border-2 border-[#0B9C74] border-t-transparent animate-spin" /></div>

  const flagged = (stats.sellers as Array<{ businessName: string; email: string; isActive?: boolean }>).filter((s) => s.isActive === false)

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight">Monitors platform activity • Handles abuse, disputes and system administration</h1>
        <p className="text-sm text-[#6b6b6b]">Sellers flagged, order disputes, API abuse. Platform owner can suspend and review logs.</p>
      </div>
      <div className="grid lg:grid-cols-3 gap-4">
        <div className="rounded-2xl bg-white border border-[#F3E6D3] p-5"><div className="text-xs tracking-widest text-[#9a9a9a]">TOTAL SELLERS</div><div className="text-2xl font-bold">{stats.totalSellers}</div><div className="text-xs text-[#6b6b6b]">{stats.activeSellers} active • {stats.suspendedSellers} suspended</div></div>
        <div className="rounded-2xl bg-white border border-[#F3E6D3] p-5"><div className="text-xs tracking-widest text-[#9a9a9a]">MESSAGES (API USAGE)</div><div className="text-2xl font-bold">{stats.totalMessages}</div><div className="text-xs text-[#6b6b6b]">{stats.inboundMessages} in • {stats.outboundMessages} out</div></div>
        <div className="rounded-2xl bg-white border border-[#F3E6D3] p-5"><div className="text-xs tracking-widest text-[#9a9a9a]">ORDERS DISPUTES</div><div className="text-2xl font-bold">{stats.pendingOrders} pending</div><div className="text-xs text-[#6b6b6b]">{stats.totalOrders} total • check Orders</div></div>
      </div>
      <div className="rounded-2xl bg-white border border-[#F3E6D3] p-5">
        <h3 className="font-bold">Suspended / flagged sellers</h3>
        {flagged.length === 0 ? (
          <div className="text-sm text-[#6b6b6b] mt-2">No flagged sellers. Use Sellers → Suspend for abuse (fake products, spam, API abuse).</div>
        ) : (
          <div className="mt-3 space-y-2">
            {flagged.map((s) => (
              <div key={s.email} className="flex justify-between rounded-xl border border-red-200 bg-red-50 p-3 text-sm">
                <span className="font-bold">{s.businessName} • {s.email}</span>
                <span className="rounded-full bg-red-600 px-2 py-1 text-xs font-bold text-white">Suspended</span>
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="rounded-2xl bg-[#1a1a1a] text-white p-5">
        <div className="text-sm font-bold">System administration</div>
        <ul className="mt-2 space-y-1 text-sm list-disc pl-5 text-white/70">
          <li>All queries are <span className="font-mono font-bold text-white">WHERE sellerId = sellerId</span> — cross-tenant access blocked.</li>
          <li>Logs: WhatsApp messages, orders, payments per sellerId. Check WhatsApp tab for API usage.</li>
          <li>Disputes: review Orders → SellerDetails → toggle active. Future: evidence upload, refunds.</li>
        </ul>
      </div>
    </div>
  )
}
