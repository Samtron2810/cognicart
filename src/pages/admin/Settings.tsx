import { useEffect, useState } from "react"
import { adminService } from "../../services/adminService"

export default function AdminSettings() {
  const [fee, setFee] = useState({ percentage: 5, fixed: 0 })
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    setFee(adminService.getFeeConfig())
  }, [])

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    adminService.setFeeConfig(fee)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="max-w-2xl space-y-5">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight">Configures transaction fees</h1>
        <p className="text-sm text-[#6b6b6b]">Platform owner sets take rate. Applied per paid order: fee = total * percentage + fixed. Preview in Revenue.</p>
      </div>
      {saved && <div className="rounded-xl bg-[#E6F7F1] border border-[#0B9C74]/20 px-3 py-2 text-sm font-bold text-[#0B9C74]">Fee saved. New orders will use this.</div>}
      <form onSubmit={handleSave} className="rounded-2xl bg-white border border-[#F3E6D3] p-6 space-y-4">
        <label>
          <span className="text-xs font-bold">Transaction fee percentage (%)</span>
          <input type="number" step="0.5" min={0} max={20} value={fee.percentage} onChange={(e) => setFee({ ...fee, percentage: Number(e.target.value) })} className="mt-1 w-full rounded-xl border border-[#F3E6D3] px-3 py-2.5 text-sm focus:border-[#0B9C74] outline-none" />
        </label>
        <label>
          <span className="text-xs font-bold">Fixed fee per order (NGN)</span>
          <input type="number" min={0} value={fee.fixed} onChange={(e) => setFee({ ...fee, fixed: Number(e.target.value) })} className="mt-1 w-full rounded-xl border border-[#F3E6D3] px-3 py-2.5 text-sm focus:border-[#0B9C74] outline-none" />
        </label>
        <div className="rounded-xl bg-[#FFFBF5] border border-[#F3E6D3] p-3 text-xs leading-5 text-[#6b6b6b]">
          Example: ₦10,000 order at 5% + ₦0 = ₦500 platform, ₦9,500 seller. Change reflects in Admin Revenue and seller Revenue (mock 5%).
        </div>
        <button type="submit" className="rounded-full bg-[#0B9C74] px-6 py-2.5 text-sm font-bold text-white hover:bg-[#0a8a66]">Save fee</button>
      </form>

      <div className="rounded-2xl bg-white border border-[#F3E6D3] p-5">
        <h3 className="font-bold">Platform billing later</h3>
        <p className="text-xs leading-5 text-[#6b6b6b]">Subscriptions will use this fee plus plan price. See Subscriptions for plan preview and Paystack recurring setup.</p>
      </div>
    </div>
  )
}
