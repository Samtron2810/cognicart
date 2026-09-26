import { Store, MessageCircle, TrendingUp, Sparkles } from "lucide-react"

const steps = [
  {
    step: "01",
    title: "List your products",
    desc: "Snap photos, add prices. We generate descriptions and WhatsApp catalogs automatically.",
    icon: Store,
    img: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=600&h=400&fit=crop",
  },
  {
    step: "02",
    title: "AI handles the chat",
    desc: "Answers stock, size, delivery and haggles politely. Sends cart links inside the chat.",
    icon: MessageCircle,
    img: "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=600&h=400&fit=crop",
  },
  {
    step: "03",
    title: "You pack and get paid",
    desc: "Orders sync to your dashboard. Print waybill, confirm payment, trigger delivery.",
    icon: TrendingUp,
    img: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=600&h=400&fit=crop",
  },
] as const

export function HowItWorks() {
  return (
    <section id="sellers" className="bg-white border-y border-[#F3E6D3]">
      <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="mx-auto max-w-2xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-[#E6F7F1] border border-[#0B9C74]/10 px-3 py-1 text-xs font-bold text-[#0B9C74]">
            <Sparkles className="h-3.5 w-3.5" /> How Cognicart works
          </span>
          <h2 className="font-display text-[32px] lg:text-[40px] font-bold tracking-tight leading-none mt-4">From chat to checkout in 3 taps</h2>
          <p className="mt-3 text-sm leading-6 text-[#5a5a5a]">No website needed. Your AI shop lives in WhatsApp where your customers already are.</p>
        </div>

        <div className="mt-10 grid lg:grid-cols-3 gap-6">
          {steps.map((s) => (
            <div key={s.step} className="rounded-[22px] bg-[#FFFBF5] border border-[#F3E6D3] overflow-hidden hover:shadow-[0_16px_30px_rgba(0,0,0,0.06)] transition group">
              <div className="h-44 overflow-hidden relative">
                <img src={s.img} alt="" className="h-full w-full object-cover group-hover:scale-[1.03] transition duration-700" />
                <span className="absolute left-3 top-3 rounded-full bg-white border border-[#F3E6D3] px-3 py-1 text-xs font-bold">{s.step}</span>
                <span className="absolute right-3 bottom-3 h-10 w-10 rounded-xl bg-white border border-[#F3E6D3] grid place-items-center shadow-sm">
                  <s.icon className="h-5 w-5 text-[#0B9C74]" />
                </span>
              </div>
              <div className="p-6">
                <div className="font-display font-bold text-[18px] leading-tight">{s.title}</div>
                <div className="mt-2 text-sm leading-6 text-[#5a5a5a]">{s.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
