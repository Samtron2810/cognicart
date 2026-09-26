import { useEffect, useMemo, useState } from "react"
import { adminService } from "../../services/adminService"
import { Download, Filter } from "lucide-react"

type Range = "7" | "30" | "all"

export default function AdminRevenue() {
  const [data, setData] = useState<Awaited<ReturnType<typeof adminService.getRevenueBreakdown>> | null>(null)
  const [range, setRange] = useState<Range>("30")
  const [sellerFilter, setSellerFilter] = useState("all")

  useEffect(() => { adminService.getRevenueBreakdown().then(setData) }, [])

  const sellers = useMemo(() => {
    if (!data) return []
    const uniq = Array.from(new Set(data.breakdown.map((b) => b.sellerId)))
    return uniq
  }, [data])

  const filtered = useMemo(() => {
    if (!data) return []
    let list = [...data.breakdown]
    if (sellerFilter !== "all") list = list.filter((b) => b.sellerId === sellerFilter)
    if (range !== "all") {
      const days = range === "7" ? 7 : 30
      const cutoff = Date.now() - days * 86400000
      list = list.filter((b) => new Date(b.createdAt).getTime() >= cutoff)
    }
    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }, [data, range, sellerFilter])

  if (!data) return <div className="grid place-items-center py-16"><div className="h-8 w-8 rounded-full border-2 border-[#0B9C74] border-t-transparent animate-spin" /></div>

  const totalSales = filtered.reduce((sum, b) => sum + b.total, 0)
  const platformRevenue = filtered.reduce((sum, b) => sum + b.fee, 0)
  const paystackFees = filtered.reduce((sum, b) => sum + b.paystackFee, 0)
  const sellerEarnings = Math.max(0, totalSales - platformRevenue - paystackFees)

  const exportCsv = () => {
    const header = ["orderId", "sellerId", "customer", "total", "platformFee", "paystackFee", "sellerEarning", "currency", "reference", "createdAt"]
    const rows = filtered.map((b) => [b.orderId, b.sellerId, b.customerName, String(b.total), String(b.fee), String(b.paystackFee), String(b.sellerEarning), "NGN", b.reference, b.createdAt].map((v) => `"${v}"`).join(","))
    const csv = [header.join(","), ...rows].join("\n")
    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `platform_revenue_${range}_${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight">Platform revenue — Phase 8</h1>
          <p className="text-sm text-[#6b6b6b]">Every transaction: orderAmount, platformFee, sellerAmount, paystackFee, currency NGN, reference, status. Fee {data.fee.percentage}% + ₦{data.fee.fixed} per paid order.</p>
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-[#9a9a9a]" />
          <select value={range} onChange={(e) => setRange(e.target.value as Range)} className="rounded-xl border border-[#F3E6D3] bg-white px-3 py-2 text-sm font-bold">
            <option value="7">7 days</option>
            <option value="30">30 days</option>
            <option value="all">All time</option>
          </select>
          <select value={sellerFilter} onChange={(e) => setSellerFilter(e.target.value)} className="rounded-xl border border-[#F3E6D3] bg-white px-3 py-2 text-sm font-bold">
            <option value="all">All sellers</option>
            {sellers.map((s) => <option key={s} value={s}>Seller ...{s.slice(-6)}</option>)}
          </select>
          <button onClick={exportCsv} className="inline-flex items-center gap-1.5 rounded-full bg-[#1a1a1a] px-4 py-2 text-xs font-bold text-white hover:bg-black"><Download className="h-3.5 w-3.5" /> Export</button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl bg-[#1a1a1a] text-white p-5"><div className="text-xs tracking-widest opacity-60">TOTAL SALES ({filtered.length})</div><div className="text-2xl font-bold">₦{totalSales.toLocaleString()}</div><div className="text-xs opacity-60">Gross • {range}</div></div>
        <div className="rounded-2xl bg-white border border-[#F3E6D3] p-5"><div className="text-xs tracking-widest text-[#9a9a9a]">PLATFORM REVENUE</div><div className="text-2xl font-bold">₦{platformRevenue.toLocaleString()}</div><div className="text-xs text-[#6b6b6b]">{data.fee.percentage}% fee</div></div>
        <div className="rounded-2xl bg-white border border-[#F3E6D3] p-5"><div className="text-xs tracking-widest text-[#9a9a9a]">PAYSTACK FEE</div><div className="text-2xl font-bold">₦{paystackFees.toLocaleString()}</div><div className="text-xs text-[#6b6b6b]">1.5% capped 2000</div></div>
        <div className="rounded-2xl bg-[#E6F7F1] border border-[#0B9C74]/20 p-5"><div className="text-xs tracking-widest text-[#0B9C74]">SELLER EARNINGS</div><div className="text-2xl font-bold text-[#0B9C74]">₦{sellerEarnings.toLocaleString()}</div><div className="text-xs text-[#6b6b6b]">Net to sellers</div></div>
      </div>

      <div className="rounded-2xl bg-white border border-[#F3E6D3] p-4">
        <div className="text-sm font-bold">Platform ledger — {filtered.length} transactions • Reconciliation: gross sales vs platform vs seller</div>
        <div className="mt-3 space-y-2">
          {filtered.slice(0, 30).map((b) => (
            <div key={b.orderId} className="grid lg:grid-cols-[1.1fr_0.9fr] gap-2 rounded-xl border border-[#F3E6D3] p-3 text-xs leading-5">
              <div>
                <div className="font-bold font-mono">#{b.orderId.slice(-6).toUpperCase()} • Seller ...{b.sellerId.slice(-6)} • {b.reference} • NGN • Paid</div>
                <div className="text-[#6b6b6b]">{b.customerName} • {new Date(b.createdAt).toLocaleString()} • Seller ...{b.sellerId.slice(-6)}</div>
              </div>
              <div className="text-left lg:text-right">
                <div>Order <span className="font-bold">₦{b.total.toLocaleString()}</span> • Platform <span className="font-bold">₦{b.fee.toLocaleString()}</span> • Paystack <span className="font-bold">₦{b.paystackFee.toLocaleString()}</span> • Seller <span className="font-bold text-[#0B9C74]">₦{b.sellerEarning.toLocaleString()}</span></div>
              </div>
            </div>
          ))}
          {filtered.length === 0 && <div className="text-sm text-[#6b6b6b] py-6 text-center">No paid orders in filter. Adjust range or seller.</div>}
        </div>
        <div className="mt-4 rounded-xl bg-[#FFFBF5] border border-[#F3E6D3] p-3 text-xs leading-5 text-[#6b6b6b]">
          Reconciliation: each row is a transaction record with orderAmount, platformFee, sellerAmount, paystackFee, currency, reference, status. Seller earnings = total - platform - paystack. Pending orders excluded.
        </div>
      </div>
    </div>
  )
}
