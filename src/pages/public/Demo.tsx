import { Link } from "react-router-dom"
import { Play, MessageCircle } from "lucide-react"

export default function Demo() {
  return (
    <div className="min-h-screen bg-[#FFFBF5]">
      <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8 py-10">
        <h1 className="font-display text-[36px] font-bold tracking-tight leading-none">30 second demo</h1>
        <p className="mt-2 text-sm text-[#5a5a5a]">See how Cognicart AI sells inside WhatsApp. No website, no DMs chaos.</p>

        <div className="mt-8 grid lg:grid-cols-[1.1fr_0.9fr] gap-6">
          <div className="rounded-[22px] bg-[#1a1a1a] p-2">
            <div className="rounded-2xl bg-white overflow-hidden">
              <div className="aspect-video bg-[#FFFBF5] grid place-items-center relative">
                <img src="https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=900&h=500&fit=crop" alt="" className="absolute inset-0 h-full w-full object-cover opacity-90" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                <a href="#" onClick={(e) => e.preventDefault()} className="relative inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-bold shadow-xl">
                  <span className="h-8 w-8 rounded-full bg-[#E85D26] grid place-items-center text-white"><Play className="h-4 w-4 fill-white" /></span> Play demo
                </a>
              </div>
              <div className="p-4 flex items-center justify-between text-sm">
                <div className="font-bold">WhatsApp chat demo</div><span className="rounded-full bg-[#E6F7F1] border border-[#0B9C74]/20 px-2.5 py-1 text-xs font-bold text-[#0B9C74]">3 sec reply</span>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-[22px] bg-white border border-[#F3E6D3] p-6">
              <div className="flex items-center gap-2 text-xs font-bold tracking-widest text-[#0B9C74]"><MessageCircle className="h-4 w-4" /> CONVERSATION</div>
              <div className="mt-3 space-y-3 text-sm leading-6">
                <div className="rounded-2xl bg-[#FFF1DA] border border-[#F3E6D3] p-3">Customer: Hi, need black sneaker around ₦30k</div>
                <div className="rounded-2xl bg-[#E6F7F1] border border-[#0B9C74]/15 p-3"><span className="font-bold text-[#0B9C74]">Cognicart AI:</span> Found 3 black sneakers within range. Second is ₦28,500 with 6 units available. Want one?</div>
                <div className="rounded-2xl bg-[#FFF1DA] border border-[#F3E6D3] p-3">Customer: Yes, add one. Deliver to Yaba.</div>
                <div className="rounded-2xl bg-[#E6F7F1] border border-[#0B9C74]/15 p-3">AI: Great, your total ₦30,500 with delivery ₦2,000. Confirm?</div>
              </div>
            </div>
            <div className="flex gap-3">
              <Link to="/register" className="rounded-full bg-[#0B9C74] px-6 py-3 text-sm font-bold text-white hover:bg-[#0a8a66]">Start selling free</Link>
              <Link to="/store" className="rounded-full bg-white border border-[#F3E6D3] px-6 py-3 text-sm font-bold hover:bg-[#FFF1DA]">Browse store</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
