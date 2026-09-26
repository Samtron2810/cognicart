import { Users, MessageCircle, Store, TrendingUp } from "lucide-react"

const features = [
  {
    icon: Users,
    title: "Built for Sellers",
    desc: "List in 2 minutes. No code, no website. Your shop lives where customers already chat.",
  },
  {
    icon: MessageCircle,
    title: "AI that Sells",
    desc: "Answers FAQs, recommends sizes and bundles, and nudges abandoned carts in your tone.",
  },
  {
    icon: Store,
    title: "One Tap Checkout",
    desc: "Customers check out inside WhatsApp. Cash, transfer or card. Auto receipts and tracking.",
  },
  {
    icon: TrendingUp,
    title: "Seller Growth Kit",
    desc: "Broadcasts, coupons, and restock alerts. See what is selling with a calm, clear dashboard.",
  },
] as const

export function Features() {
  return (
    <section id="features" className="bg-white border-y border-[#F3E6D3]">
      <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8 py-10 lg:py-14">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-10">
          {features.map((f) => (
            <div key={f.title} className="text-center lg:text-left">
              <div className="mx-auto lg:mx-0 h-10 w-10 rounded-xl border border-[#E6F7F1] bg-[#F0FFF8] grid place-items-center text-[#0B9C74]">
                <f.icon className="h-5 w-5" />
              </div>
              <div className="mt-3 font-display font-bold text-[16px] leading-tight">{f.title}</div>
              <div className="mt-1.5 text-sm leading-6 text-[#5a5a5a]">{f.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
