import { Check } from "lucide-react"
import { Link } from "react-router-dom"

type Tier = {
  name: string
  price: string
  sub: string
  features: string[]
  cta: string
  featured: boolean
  to: string
}

const tiers: Tier[] = [
  {
    name: "Starter",
    price: "Free",
    sub: "For testing the waters",
    features: ["50 AI conversations / mo", "20 products", "Basic dashboard", "Community support"],
    cta: "Start free",
    featured: false,
    to: "/register",
  },
  {
    name: "Growth",
    price: "₦9,500",
    sub: "/month, most popular",
    features: ["Unlimited AI chats", "1,000 products", "Broadcasts and coupons", "Paystack and Flutterwave", "Priority support"],
    cta: "Start 14-day trial",
    featured: true,
    to: "/register",
  },
  {
    name: "Scale",
    price: "Custom",
    sub: "For teams and wholesalers",
    features: ["Multi-seller and branches", "API and webhooks", "Dedicated success manager", "SLA and invoicing"],
    cta: "Contact sales",
    featured: false,
    to: "/contact",
  },
]

export function Pricing() {
  return (
    <section id="pricing" className="bg-white">
      <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-display text-[34px] lg:text-[40px] font-bold tracking-tight leading-none">Simple, fair pricing</h2>
          <p className="mt-3 text-sm text-[#5a5a5a]">Start free. Grow with you. Only pay when you sell. Cancel anytime.</p>
        </div>

        <div className="mt-10 grid lg:grid-cols-3 gap-6 max-w-[1000px] mx-auto">
          {tiers.map((tier) => (
            <div
              key={tier.name}
              className={`rounded-[22px] border p-6 flex flex-col ${tier.featured ? "bg-[#1a1a1a] text-white border-[#1a1a1a] shadow-[0_20px_40px_rgba(0,0,0,0.15)] scale-[1.02]" : "bg-[#FFFBF5] border-[#F3E6D3]"}`}
            >
              <div className="text-sm font-bold tracking-widest flex items-center gap-2">
                {tier.name} {tier.featured && <span className="rounded-full bg-[#0B9C74] px-2 py-0.5 text-[11px] text-white">POPULAR</span>}
              </div>
              <div className="mt-3 font-display text-[32px] font-bold leading-none">{tier.price}</div>
              <div className={`text-xs ${tier.featured ? "text-white/60" : "text-[#6b6b6b]"}`}>{tier.sub}</div>
              <ul className="mt-6 space-y-3 text-sm flex-1">
                {tier.features.map((f) => (
                  <li key={f} className="flex gap-2">
                    <Check className="h-4 w-4 mt-0.5 shrink-0 text-[#0B9C74]" />
                    <span className={tier.featured ? "text-white/90" : "text-[#2b2b2b]"}>{f}</span>
                  </li>
                ))}
              </ul>
              <Link to={tier.to} className={`mt-6 w-full rounded-full py-3 text-sm font-bold transition text-center ${tier.featured ? "bg-[#0B9C74] text-white hover:bg-[#0a8a66]" : "bg-white border border-[#F3E6D3] hover:bg-[#FFF1DA] text-[#1a1a1a]"}`}>
                {tier.cta}
              </Link>
            </div>
          ))}
        </div>
        <div className="mt-6 text-center text-xs text-[#6b6b6b]">Questions? <Link to="/contact" className="font-bold text-[#0B9C74] underline">Talk to founder</Link> or <Link to="/privacy" className="font-bold underline">see privacy and terms</Link></div>
      </div>
    </section>
  )
}
