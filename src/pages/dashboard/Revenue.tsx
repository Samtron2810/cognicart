import { useEffect, useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { Wallet, TrendingUp, PieChart, Calendar, Award, ArrowUpRight, Download, Filter, ArrowUpDown } from "lucide-react"
import { orderService } from "../../services/orderService"
import { productService } from "../../services/productService"
import { adminService } from "../../services/adminService"
import { paymentService } from "../../services/paymentService"
import type { Order } from "../../types/order"
import type { Transaction } from "../../types/payment"

type Range = "7" | "30" | "all"

export default function Revenue() {
  const [orders, setOrders] = useState<Order[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [fee, setFee] = useState({ percentage: 5, fixed: 0 })
  const [loading, setLoading] = useState(true)
  const [range, setRange] = useState<Range>("30")
  const [txFilter, setTxFilter] = useState<"all" | "success" | "pending" | "abandoned">("all")

  useEffect(() => {
    productService.seedDemo()
    orderService.seedDemo()
    // Seed transactions for demo Paid orders if none exist
    const demoTxCheck = () => {
      const txs = paymentService.list()
      if (txs.length === 0) {
        const allOrdersRaw = localStorage.getItem("cognicart_orders")
        const feeCfg = adminService.getFeeConfig()
        if (allOrdersRaw) {
          const allOrders = JSON.parse(allOrdersRaw) as Order[]
          const sellerId = (() => {
            try { return JSON.parse(localStorage.getItem("cognicart_seller") || "{}").id || "mock_seller" } catch { return "mock_seller" }
          })()
          const paidWithoutTx = allOrders.filter((o) => o.sellerId === sellerId && o.paymentStatus === "Paid" && !txs.find((t) => t.orderId === o.id))
          if (paidWithoutTx.length > 0) {
            const existing = JSON.parse(localStorage.getItem("cognicart_transactions") || "[]")
            paidWithoutTx.forEach((o) => {
              const platformFee = Math.round(o.total * (feeCfg.percentage / 100) + feeCfg.fixed)
              const paystackFee = Math.min(Math.round(o.total * 0.015), 2000)
              existing.push({
                id: "txn_" + o.id,
                sellerId: o.sellerId,
                orderId: o.id,
                amount: o.total,
                subtotal: o.subtotal,
                deliveryFee: o.deliveryFee,
                platformFee,
                sellerAmount: o.total - platformFee - paystackFee,
                paystackFee,
                currency: "NGN",
                reference: o.paymentReference || "PSK_DEMO_" + o.id.slice(-6).toUpperCase(),
                email: `${o.customerPhone.replace(/[^0-9]/g, "")}@cognicart.test`,
                status: "success",
                createdAt: o.createdAt,
                verifiedAt: o.updatedAt,
                channel: "paystack",
              })
            })
            localStorage.setItem("cognicart_transactions", JSON.stringify(existing))
          }
        }
      }
    }
    demoTxCheck()
    setFee(adminService.getFeeConfig())
    orderService.list().then((data) => {
      setOrders(data)
      setTransactions(paymentService.list())
      setLoading(false)
    })
  }, [])

  const filteredByRange = useMemo(() => {
    if (range === "all") return orders
    const days = range === "7" ? 7 : 30
    const cutoff = Date.now() - days * 86400000
    return orders.filter((o) => new Date(o.createdAt).getTime() >= cutoff)
  }, [orders, range])

  const paidOrders = filteredByRange.filter((o) => o.paymentStatus === "Paid")
  const pendingPaid = filteredByRange.filter((o) => o.paymentStatus === "Pending").length
  const failedCount = filteredByRange.filter((o) => o.paymentStatus === "Failed").length
  const totalSales = paidOrders.reduce((sum, o) => sum + o.total, 0)
  const txSuccess = transactions.filter((t) => t.status === "success")
  const platformFee = txSuccess.length > 0 ? txSuccess.reduce((sum, t) => sum + t.platformFee, 0) : Math.round(totalSales * (fee.percentage / 100) + paidOrders.length * fee.fixed)
  const paystackFees = txSuccess.reduce((sum, t) => sum + t.paystackFee, 0)
  const sellerEarnings = Math.max(0, totalSales - platformFee - paystackFees)
  const pendingOrders = filteredByRange.filter((o) => o.orderStatus === "Pending").length
  const deliveredOrders = filteredByRange.filter((o) => o.orderStatus === "Delivered").length

  // Sales by day
  const daysCount = range === "7" ? 7 : range === "30" ? 14 : 7
  const chartData = Array.from({ length: daysCount }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (daysCount - 1 - i))
    const key = d.toISOString().slice(0, 10)
    const dayOrders = paidOrders.filter((o) => o.createdAt.slice(0, 10) === key)
    const sales = dayOrders.reduce((sum, o) => sum + o.total, 0)
    return { label: d.toLocaleDateString(undefined, { month: "short", day: "numeric" }), sales, count: dayOrders.length }
  })
  const maxSales = Math.max(1, ...chartData.map((d) => d.sales))

  // Top products
  const productSales = new Map<string, { name: string; qty: number; revenue: number }>()
  paidOrders.forEach((o) => {
    o.items.forEach((it) => {
      const cur = productSales.get(it.name) || { name: it.name, qty: 0, revenue: 0 }
      cur.qty += it.quantity
      cur.revenue += it.price * it.quantity
      productSales.set(it.name, cur)
    })
  })
  const topProducts = Array.from(productSales.values()).sort((a, b) => b.revenue - a.revenue).slice(0, 5)

  const filteredTx = useMemo(() => {
    let list = [...transactions].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    if (txFilter !== "all") list = list.filter((t) => t.status === txFilter)
    if (range !== "all") {
      const days = range === "7" ? 7 : 30
      const cutoff = Date.now() - days * 86400000
      list = list.filter((t) => new Date(t.createdAt).getTime() >= cutoff)
    }
    return list
  }, [transactions, txFilter, range])

  const exportCsv = () => {
    const header = ["orderId", "reference", "amount", "platformFee", "paystackFee", "sellerAmount", "currency", "status", "createdAt"]
    const rows = filteredTx.map((t) => [t.orderId, t.reference, String(t.amount), String(t.platformFee), String(t.paystackFee), String(t.sellerAmount), t.currency, t.status, t.createdAt].map((v) => `"${v}"`).join(","))
    const csv = [header.join(","), ...rows].join("\n")
    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `cognicart_transactions_${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (loading) return <div className="grid place-items-center py-16"><div className="h-8 w-8 rounded-full border-2 border-[#0B9C74] border-t-transparent animate-spin" /></div>

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight">Sales and Revenue — Phase 8</h1>
          <p className="text-sm text-[#6b6b6b]">Transaction ledger shows orderAmount, platformFee, sellerAmount, paystackFee, currency, reference, status per plan 17. Fee {fee.percentage}% + ₦{fee.fixed} configurable in Admin Settings.</p>
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-[#9a9a9a]" />
          <select value={range} onChange={(e) => setRange(e.target.value as Range)} className="rounded-xl border border-[#F3E6D3] bg-white px-3 py-2 text-sm font-bold">
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="all">All time</option>
          </select>
          <button onClick={exportCsv} className="inline-flex items-center gap-1.5 rounded-full bg-[#1a1a1a] px-4 py-2 text-xs font-bold text-white hover:bg-black"><Download className="h-3.5 w-3.5" /> Export CSV</button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl bg-[#0B9C74] text-white p-5">
          <div className="flex items-center gap-2 text-xs font-bold tracking-widest opacity-80"><Wallet className="h-4 w-4" /> GROSS SALES</div>
          <div className="mt-2 text-2xl font-bold">₦{totalSales.toLocaleString()}</div>
          <div className="text-xs opacity-80">{paidOrders.length} paid • ₦{paystackFees.toLocaleString()} Paystack</div>
        </div>
        <div className="rounded-2xl bg-white border border-[#F3E6D3] p-5">
          <div className="flex items-center gap-2 text-xs font-bold tracking-widest text-[#9a9a9a]"><TrendingUp className="h-4 w-4" /> SELLER EARNINGS</div>
          <div className="mt-2 text-2xl font-bold text-[#0B9C74]">₦{sellerEarnings.toLocaleString()}</div>
          <div className="text-xs text-[#6b6b6b]">Net after platform+Paystack</div>
        </div>
        <div className="rounded-2xl bg-white border border-[#F3E6D3] p-5">
          <div className="flex items-center gap-2 text-xs font-bold tracking-widest text-[#9a9a9a]"><PieChart className="h-4 w-4" /> PLATFORM FEE</div>
          <div className="mt-2 text-2xl font-bold">₦{platformFee.toLocaleString()}</div>
          <div className="text-xs text-[#6b6b6b]">{fee.percentage}% • {paidOrders.length} orders • NGN</div>
        </div>
        <div className="rounded-2xl bg-white border border-[#F3E6D3] p-5">
          <div className="flex items-center gap-2 text-xs font-bold tracking-widest text-[#9a9a9a]"><Calendar className="h-4 w-4" /> RECONCILIATION</div>
          <div className="mt-2 text-sm font-bold">{filteredByRange.length} total • {pendingPaid} pending pay • {failedCount} failed</div>
          <div className="text-xs text-[#6b6b6b]">{pendingOrders} pending fulfill • {deliveredOrders} delivered</div>
        </div>
      </div>

      <div className="grid lg:grid-cols-[1.6fr_0.9fr] gap-6">
        <div className="rounded-2xl bg-white border border-[#F3E6D3] p-5">
          <div className="flex items-center justify-between">
            <h2 className="font-bold">Sales trend — {range === "7" ? "7 days" : range === "30" ? "14 days" : "7 days"}</h2>
            <span className="text-xs font-bold text-[#6b6b6b]">Paid only • {range}</span>
          </div>
          <div className="mt-6 flex items-end gap-1.5 h-36">
            {chartData.map((d) => (
              <div key={d.label} className="flex-1 flex flex-col items-center gap-1.5">
                <div className="w-full flex justify-center" style={{ height: "96px" }}>
                  <div className="w-full max-w-12 rounded-t-xl bg-[#0B9C74] hover:bg-[#0a8a66] transition" style={{ height: `${Math.max(8, (d.sales / maxSales) * 96)}px`, alignSelf: "flex-end" }} title={`₦${d.sales.toLocaleString()} • ${d.count} orders`} />
                </div>
                <span className="text-[10px] font-bold text-center leading-tight">{d.label}</span>
                <span className="text-[11px] text-[#6b6b6b]">₦{d.sales ? d.sales.toLocaleString() : "0"}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-2xl bg-white border border-[#F3E6D3] p-5">
            <h3 className="font-bold flex items-center gap-2"><Award className="h-4 w-4 text-[#E85D26]" /> Top products (paid)</h3>
            <div className="mt-4 space-y-3">
              {topProducts.length === 0 ? <div className="text-xs text-[#6b6b6b]">No sales in range.</div> : topProducts.map((p) => (
                <div key={p.name} className="flex items-center justify-between text-sm">
                  <div><div className="font-bold leading-tight">{p.name}</div><div className="text-xs text-[#6b6b6b]">{p.qty} sold</div></div>
                  <div className="font-bold">₦{p.revenue.toLocaleString()}</div>
                </div>
              ))}
            </div>
            <Link to="/dashboard/products" className="mt-3 inline-flex text-xs font-bold text-[#0B9C74] hover:underline">Manage catalog →</Link>
          </div>

          <div className="rounded-2xl bg-[#1a1a1a] text-white p-6">
            <h3 className="font-bold">Payout — reconciliation</h3>
            <p className="text-xs leading-5 text-white/70 mt-1">Every Paid transaction creates a record: orderAmount, platformFee, sellerAmount, paystackFee, currency, reference, status. Pending orders excluded.</p>
            <div className="mt-4 rounded-xl bg-white/10 p-3 text-sm space-y-1">
              <div className="flex justify-between"><span className="text-white/70">Gross sales</span><span className="font-bold">₦{totalSales.toLocaleString()}</span></div>
              <div className="flex justify-between"><span className="text-white/70">Platform fee</span><span>₦{platformFee.toLocaleString()}</span></div>
              <div className="flex justify-between"><span className="text-white/70">Paystack fee</span><span>₦{paystackFees.toLocaleString()}</span></div>
              <div className="flex justify-between border-t border-white/10 pt-1"><span className="font-bold">Seller net</span><span className="font-bold text-[#7CFFB2]">₦{sellerEarnings.toLocaleString()}</span></div>
            </div>
            <Link to="/dashboard/orders" className="mt-4 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-bold text-[#1a1a1a] hover:bg-[#FFF1DA]">View orders <ArrowUpRight className="h-4 w-4" /></Link>
          </div>
        </div>
      </div>

      <div className="rounded-2xl bg-white border border-[#F3E6D3] p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-bold flex items-center gap-2"><ArrowUpDown className="h-4 w-4 text-[#0B9C74]" /> Transaction ledger — {filteredTx.length} records</h2>
          <div className="flex items-center gap-2">
            <select value={txFilter} onChange={(e) => setTxFilter(e.target.value as never)} className="rounded-xl border border-[#F3E6D3] bg-white px-3 py-1.5 text-xs font-bold">
              <option value="all">All status</option>
              <option value="success">Success</option>
              <option value="pending">Pending</option>
              <option value="abandoned">Abandoned</option>
            </select>
            <span className="text-xs text-[#6b6b6b] hidden sm:block">orderAmount • platformFee • sellerAmount • paystackFee • NGN • ref • status</span>
          </div>
        </div>
        <div className="mt-4 space-y-2">
          {filteredTx.slice(0, 30).map((t) => (
            <div key={t.id} className="grid lg:grid-cols-[1.1fr_0.9fr] gap-2 rounded-xl border border-[#F3E6D3] p-3 text-xs leading-5">
              <div>
                <div className="font-bold font-mono">Order #{t.orderId.slice(-6).toUpperCase()} • {t.reference} • {t.currency} • <span className={`rounded-full px-2 py-0.5 text-[11px] ${t.status === "success" ? "bg-[#E6F7F1] text-[#0B9C74]" : t.status === "pending" ? "bg-[#FFF1DA] text-[#E85D26]" : "bg-red-50 text-red-700"}`}>{t.status}</span></div>
                <div className="text-[#6b6b6b]">{new Date(t.createdAt).toLocaleString()} • {t.email} • {t.channel}</div>
              </div>
              <div className="text-left lg:text-right">
                <div>Amount <span className="font-bold">₦{t.amount.toLocaleString()}</span> • Platform <span className="font-bold">₦{t.platformFee.toLocaleString()}</span> • Seller <span className="font-bold text-[#0B9C74]">₦{t.sellerAmount.toLocaleString()}</span></div>
                <div className="text-[#6b6b6b]">Paystack ₦{t.paystackFee.toLocaleString()} • Subtotal ₦{t.subtotal.toLocaleString()} + Delivery ₦{t.deliveryFee.toLocaleString()}</div>
              </div>
            </div>
          ))}
          {filteredTx.length === 0 && <div className="text-sm text-[#6b6b6b] py-6 text-center">No transactions in range. Pay via Cart or Checkout, or use WhatsApp AI pay flow.</div>}
        </div>
      </div>

      <div className="rounded-2xl bg-white border border-[#F3E6D3] p-5">
        <div className="flex items-center justify-between">
          <h2 className="font-bold">Recent paid orders</h2>
          <Link to="/dashboard/orders" className="text-sm font-bold text-[#0B9C74] hover:underline">View all</Link>
        </div>
        <div className="mt-4 grid gap-2">
          {paidOrders.slice(0, 5).map((o) => (
            <Link key={o.id} to={`/dashboard/orders/${o.id}`} className="flex items-center justify-between rounded-xl border border-[#F3E6D3] p-3 hover:bg-[#FFFBF5]">
              <div>
                <div className="text-sm font-bold">#{o.id.slice(-6).toUpperCase()} • {o.customerName} • {o.paymentReference || "no ref"}</div>
                <div className="text-xs text-[#6b6b6b]">{new Date(o.createdAt).toLocaleDateString()} • {o.items.length} items • {o.items.map((i) => i.name).slice(0, 2).join(", ")}</div>
              </div>
              <div className="text-sm font-bold">₦{o.total.toLocaleString()}</div>
            </Link>
          ))}
          {paidOrders.length === 0 && <div className="text-sm text-[#6b6b6b] py-4 text-center">No paid orders in range.</div>}
        </div>
      </div>
    </div>
  )
}
