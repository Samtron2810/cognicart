import { Link } from "react-router-dom"

const plans = [
  { name: "Starter", price: "Free", features: ["50 AI chats/mo", "20 products"] },
  { name: "Growth", price: "₦9,500/mo", features: ["Unlimited AI", "1,000 products", "Broadcasts"], popular: true },
  { name: "Scale", price: "Custom", features: ["Multi-branch", "API", "SLA"] },
]

export default function AdminSubscriptions() {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight">Handles subscriptions or platform billing later</h1>
        <p className="text-sm text-[#6b6b6b]">SaaS billing preview. In production, subscriptions are per seller with Paystack recurring.</p>
      </div>
      <div className="grid lg:grid-cols-3 gap-4">
        {plans.map((p) => (
          <div key={p.name} className={`rounded-2xl border p-5 ${p.popular ? "bg-[#1a1a1a] text-white border-[#1a1a1a]" : "bg-white border-[#F3E6D3]"}`}>
            <div className="font-bold flex items-center gap-2">{p.name} {p.popular && <span className="rounded-full bg-[#0B9C74] px-2 py-0.5 text-xs">POPULAR</span>}</div>
            <div className="text-xl font-bold mt-2">{p.price}</div>
            <ul className="mt-3 space-y-1 text-sm list-disc pl-5 opacity-80">{p.features.map((f) => <li key={f}>{f}</li>)}</ul>
          </div>
        ))}
      </div>
      <div className="rounded-2xl bg-[#FFF1DA] border border-[#F3E6D3] p-4 text-sm">
        <span className="font-bold">Later:</span> Paystack subscription webhook, grace period, downgrade, invoices. Configured per seller in admin Sellers detail.
      </div>
      <Link to="/admin/sellers" className="inline-flex rounded-full bg-[#0B9C74] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#0a8a66]">View sellers</Link>
    </div>
  )
}
