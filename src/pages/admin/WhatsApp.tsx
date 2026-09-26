import { useEffect, useState } from "react"
import { adminService } from "../../services/adminService"

export default function AdminWhatsApp() {
  const [stats, setStats] = useState<Awaited<ReturnType<typeof adminService.getWhatsAppStats>>>([])

  useEffect(() => { adminService.getWhatsAppStats().then(setStats) }, [])

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight">Monitors WhatsApp/API usage</h1>
        <p className="text-sm text-[#6b6b6b]">Per seller Cloud API usage. Webhook verified, AI vs deterministic, inbound/outbound counts. Isolation by sellerId.</p>
      </div>
      <div className="space-y-2">
        {stats.map((s) => (
          <div key={s.sellerId} className="rounded-2xl bg-white border border-[#F3E6D3] p-4 flex flex-wrap gap-3 justify-between items-center">
            <div>
              <div className="text-sm font-bold">{s.businessName} • {s.email}</div>
              <div className="text-xs text-[#6b6b6b] font-mono">Phone {s.businessPhone} • {s.webhookVerified ? "Verified" : "Not verified"}</div>
              <div className="text-xs text-[#6b6b6b]">Total {s.totalMessages} • In {s.inbound} • Out {s.outbound} • AI {s.aiMessages}</div>
            </div>
            <div className="text-right">
              <span className={`inline-flex rounded-full px-3 py-1 text-xs font-bold border ${s.webhookVerified ? "bg-[#E6F7F1] text-[#0B9C74] border-[#0B9C74]/20" : "bg-[#FFF1DA] text-[#E85D26] border-[#F3E6D3]"}`}>{s.webhookVerified ? "Verified" : "Pending"}</span>
              <div className="text-xs text-[#9a9a9a] mt-1">Last {s.lastMessageAt ? new Date(s.lastMessageAt).toLocaleDateString() : "—"}</div>
            </div>
          </div>
        ))}
        {stats.length === 0 && <div className="text-sm text-[#6b6b6b] py-6 text-center">No sellers yet</div>}
      </div>
    </div>
  )
}
