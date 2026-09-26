import { useEffect, useState } from "react"
import { adminService } from "../../services/adminService"

export default function AdminCustomers() {
  const [customers, setCustomers] = useState<Awaited<ReturnType<typeof adminService.listAllCustomers>>>([])

  useEffect(() => { adminService.listAllCustomers().then(setCustomers) }, [])

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight">Platform customers</h1>
        <p className="text-sm text-[#6b6b6b]">Customers per seller. Same WhatsApp phone can exist across sellers but data is isolated by sellerId.</p>
      </div>
      <div className="rounded-2xl bg-white border border-[#F3E6D3] p-4">
        <div className="grid gap-2">
          {customers.slice(0, 30).map((c) => (
            <div key={c.id} className="flex flex-wrap gap-3 justify-between items-center rounded-xl border border-[#F3E6D3] p-3 bg-[#FFFBF5]">
              <div>
                <div className="text-sm font-bold">{c.name} • {c.phone}</div>
                <div className="text-xs text-[#6b6b6b]">Seller {c.sellerId.slice(-6)} • {c.whatsappId} • {c.addresses[0] || "—"}</div>
              </div>
              <div className="text-xs">
                <span className="rounded-full bg-white border border-[#F3E6D3] px-2 py-1 font-bold">{c.totalOrders} orders</span>
                <span className="ml-2 rounded-full bg-[#E6F7F1] border border-[#0B9C74]/20 px-2 py-1 font-bold">₦{c.totalSpent.toLocaleString()}</span>
              </div>
            </div>
          ))}
          {customers.length === 0 && <div className="text-sm text-[#6b6b6b] py-6 text-center">No customers yet</div>}
        </div>
      </div>
    </div>
  )
}
