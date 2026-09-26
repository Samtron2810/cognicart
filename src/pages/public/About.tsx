import { Link } from "react-router-dom"
import { Users, MessageCircle, Heart, Target } from "lucide-react"

export default function About() {
  return (
    <div className="min-h-screen bg-[#FFFBF5]">
      <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8 py-10">
        <div className="max-w-3xl">
          <h1 className="font-display text-[36px] font-bold tracking-tight leading-none">About Cognicart</h1>
          <p className="mt-3 text-sm leading-6 text-[#5a5a5a]">WhatsApp AI commerce for African sellers. We help traders sell where customers already chat, without the overhead of a website.</p>
        </div>

        <div className="mt-8 grid lg:grid-cols-2 gap-6">
          <div className="rounded-[22px] bg-white border border-[#F3E6D3] p-6">
            <h2 className="font-display text-xl font-bold">Our story</h2>
            <p className="mt-2 text-sm leading-6 text-[#5a5a5a]">Cognicart started in Port Harcourt listening to Instagram vendors who stayed up replying DMs. We built an AI that knows a seller's products, prices and stock and replies inside WhatsApp in 3 seconds. No invented prices. No hallucinations. Just the seller's database through controlled tools.</p>
            <p className="mt-3 text-sm leading-6 text-[#5a5a5a]">Today sellers on Cognicart list once and let AI handle FAQs, upsells and "where is my order" while they focus on making.</p>
            <div className="mt-5 flex gap-3">
              <Link to="/register" className="rounded-full bg-[#0B9C74] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#0a8a66]">Start selling</Link>
              <Link to="/contact" className="rounded-full bg-white border border-[#F3E6D3] px-5 py-2.5 text-sm font-bold hover:bg-[#FFF1DA]">Contact us</Link>
            </div>
          </div>
          <div className="rounded-[22px] bg-[#1a1a1a] text-white p-6">
            <h3 className="font-bold">What we believe</h3>
            <ul className="mt-3 space-y-3 text-sm text-white/80">
              <li className="flex gap-2"><Target className="h-4 w-4 mt-0.5 text-[#0B9C74]" /> Commerce should be conversational, not catalog browsing.</li>
              <li className="flex gap-2"><Users className="h-4 w-4 mt-0.5 text-[#0B9C74]" /> Sellers deserve calm dashboards, not chaos.</li>
              <li className="flex gap-2"><MessageCircle className="h-4 w-4 mt-0.5 text-[#0B9C74]" /> AI must be constrained to the seller's truth.</li>
              <li className="flex gap-2"><Heart className="h-4 w-4 mt-0.5 text-[#0B9C74]" /> Built in Port Harcourt for sellers everywhere.</li>
            </ul>
          </div>
        </div>

        <div className="mt-6 grid lg:grid-cols-3 gap-4 text-sm">
          <div className="rounded-2xl bg-white border border-[#F3E6D3] p-5"><div className="font-bold">5,000+ sellers</div><div className="text-[#6b6b6b]">On WhatsApp AI</div></div>
          <div className="rounded-2xl bg-white border border-[#F3E6D3] p-5"><div className="font-bold">2,341 orders/day via WhatsApp</div><div className="text-[#6b6b6b]">Handled by AI</div></div>
          <div className="rounded-2xl bg-white border border-[#F3E6D3] p-5"><div className="font-bold">3 seconds</div><div className="text-[#6b6b6b]">Average reply time</div></div>
        </div>
      </div>
    </div>
  )
}
