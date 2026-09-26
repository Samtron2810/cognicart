import { useEffect, useState } from "react"
import { adminService } from "../../services/adminService"

export default function AdminPayments() {
  const [data, setData] = useState<Awaited<ReturnType<typeof adminService.getRevenueBreakdown>> | null>(null)

  useEffect(() => { adminService.getRevenueBreakdown().then(setData) }, [])

  if (!data) return <div className="grid place-items-center py-10"><div className="h-8 w-8 rounded-full border-2 border-[#0B9C74] border-t-transparent animate-spin" /></div>

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight">Payments</h1>
        <p className="text-sm text-[#6b6b6b]">Paystack reconciliation. Each paid order has reference, platform fee {data.fee.percentage}% + ₦{data.fee.fixed}, Paystack 1.5% capped ₦2000, seller settle.</p>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl bg-[#1a1a1a] text-white p-4"><div className="text-xs opacity-60">TOTAL SALES</div><div className="text-xl font-bold">₦{data.totalSales.toLocaleString()}</div></div>
        <div className="rounded-2xl bg-white border border-[#F3E6D3] p-4"><div className="text-xs text-[#9a9a9a]">PLATFORM FEE</div><div className="text-xl font-bold">₦{data.platformRevenue.toLocaleString()}</div></div>
        <div className="rounded-2xl bg-white border border-[#F3E6D3] p-4"><div className="text-xs text-[#9a9a9a]">PAYSTACK FEE</div><div className="text-xl font-bold">₦{data.paystackFees.toLocaleString()}</div></div>
        <div className="rounded-2xl bg-white border border-[#F3E6D3] p-4"><div className="text-xs text-[#9a9a9a]">SELLER EARNINGS</div><div className="text-xl font-bold">₦{data.sellerEarnings.toLocaleString()}</div></div>
      </div>
      <div className="rounded-2xl bg-white border border-[#F3E6D3] p-5">
        <div className="text-sm font-bold">Transactions — {data.breakdown.length} paid orders</div>
        <div className="mt-3 space-y-2">
          {data.breakdown.slice(0, 25).map((b) => (
            <div key={b.orderId} className="flex flex-wrap gap-3 justify-between rounded-xl border border-[#F3E6D3] p-3 bg-[#FFFBF5] text-sm">
              <div>
                <div className="font-bold font-mono">#{b.orderId.slice(-6).toUpperCase()} • {b.reference}</div>
                <div className="text-xs text-[#6b6b6b]">Seller {b.sellerId.slice(-6)} • {b.customerName} • {new Date(b.createdAt).toLocaleDateString()}</div>
              </div>
              <div className="text-right">
                <div className="font-bold">₦{b.total.toLocaleString()} • Platform ₦{b.fee.toLocaleString()} • Paystack ₦{b.paystackFee.toLocaleString()} • Seller ₦{b.sellerEarning.toLocaleString()}</div>
              </div>
            </div>
          ))}
          {data.breakdown.length === 0 && <div className="text-sm text-[#6b6b6b] py-6 text-center">No paid orders yet. Pay in Cart or Checkout, or mark order Paid in OrderDetail. Paystack verifies and splits fee.</div>}
        </div>
      </div>
    </div>
  )
}
