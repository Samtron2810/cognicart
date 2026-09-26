import { ArrowRight, Play, ShoppingBag, Heart } from "lucide-react"
import { Link } from "react-router-dom"

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 -z-10 bg-[#FFFBF5]" />
      <div className="absolute -z-10 top-0 left-0 w-[78%] lg:w-[62%] h-[86%] bg-[#FDEDD3] rounded-br-[90px] lg:rounded-br-[140px]" />
      <div className="absolute -z-10 top-0 right-0 w-[45%] h-[62%] bg-[#F6C68B]/70 hidden lg:block" style={{ clipPath: "ellipse(80% 90% at 80% 0%)" }} />
      <div className="absolute -z-10 bottom-0 right-0 w-[58%] lg:w-[46%] h-[220px] lg:h-[300px] bg-[#E85D26] rounded-tl-[80px] lg:rounded-tl-[120px]" />
      <div className="absolute -z-10 left-[18%] top-[52%] h-3 w-20 hidden lg:flex items-center gap-2">
        <span className="h-2 w-2 rounded-full bg-[#0B9C74]" />
        <span className="h-2 w-2 rounded-full bg-white/80" />
        <span className="h-2 w-2 rounded-full bg-white/50" />
      </div>
      <div className="pointer-events-none absolute -z-10 left-[52%] top-[18%] hidden lg:block text-2xl">🪴</div>
      <div className="pointer-events-none absolute -z-10 right-[14%] top-[38%] hidden lg:block text-lg">🍋</div>

      <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-[1.05fr_1fr] gap-8 lg:gap-10 items-center py-8 lg:py-14">
          <div className="pt-2 lg:pt-8">
            <div className="inline-flex items-center gap-2 rounded-full bg-white border border-[#F3E6D3] px-3 py-1 text-xs font-medium shadow-sm">
              <span className="h-2 w-2 rounded-full bg-[#0B9C74] animate-pulse" /> Trusted by 5,000+ sellers on WhatsApp
            </div>
            <h1 className="font-display font-bold tracking-tight leading-[0.9] text-[38px] sm:text-[54px] lg:text-[62px] mt-5">
              WhatsApp
              <br />
              <span className="relative inline-block">
                Commerce,
                <span className="absolute -right-6 -top-2 hidden sm:inline-flex rotate-3 bg-[#0B9C74] text-white text-[10px] font-bold tracking-widest px-2 py-1 rounded-full">NEW AI</span>
              </span>
              <br />
              <span className="text-[#E85D26]">without</span> the
              <br />
              chaos.
            </h1>
            <p className="mt-5 max-w-[520px] text-[15px] sm:text-[16px] leading-7 text-[#4a4a4a]">
              Chat to sell smarter. List once and let your AI handle DMs, upsells and "where is my order?" questions while you focus on making. No website headaches.
            </p>

            <div className="mt-7 flex flex-wrap gap-3">
              <Link to="/register" className="inline-flex items-center justify-center gap-2 rounded-full bg-[#0B9C74] px-7 py-3.5 text-sm font-bold text-white shadow-[0_8px_20px_rgba(11,156,116,0.25)] hover:bg-[#0a8a66] active:scale-[0.98] transition">
                Start selling free <ArrowRight className="h-4 w-4" />
              </Link>
              <Link to="/demo" className="inline-flex items-center justify-center gap-2 rounded-full bg-[#E85D26] px-7 py-3.5 text-sm font-bold text-white shadow-[0_8px_20px_rgba(232,93,38,0.25)] hover:bg-[#d55422] active:scale-[0.98] transition">
                <Play className="h-4 w-4 fill-white" /> Watch 30s demo
              </Link>
            </div>
            <div className="mt-3 flex items-center gap-4 text-xs font-bold text-[#6b6b6b]">
              <Link to="/about" className="hover:text-[#1a1a1a] underline decoration-[#F3E6D3] underline-offset-4">How it works</Link>
              <Link to="/contact" className="hover:text-[#1a1a1a] underline decoration-[#F3E6D3] underline-offset-4">Talk to founder</Link>
            </div>
          </div>

          <div className="relative lg:h-[520px] flex items-center">
            <div className="grid grid-cols-2 gap-3 sm:gap-4 w-full">
              <Link to="/store" className="relative rounded-[22px] bg-white p-3 sm:p-4 shadow-[0_20px_40px_rgba(0,0,0,0.08)] border border-[#F3E6D3] flex flex-col hover:shadow-[0_24px_40px_rgba(0,0,0,0.12)] transition">
                <div className="absolute -top-2 -right-2 bg-[#0B9C74] text-white text-[10px] font-bold px-2 py-1 rounded-full rotate-3 shadow">BESTSELLER</div>
                <div className="flex-1 rounded-xl bg-[#FFF6E8] p-3 flex items-center justify-center">
                  <img src="https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=400&h=400&fit=crop" alt="Elixir bottle" className="h-28 w-28 object-contain mix-blend-multiply" />
                </div>
                <div className="mt-3">
                  <div className="text-xs font-bold leading-tight">Elixir Glow Serum</div>
                  <div className="text-[11px] text-[#6b6b6b]">30ml • Vitamin C</div>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-sm font-bold">₦8,500</span>
                    <span className="h-7 w-7 grid place-items-center rounded-full bg-[#0B9C74] text-white">
                      <ShoppingBag className="h-3.5 w-3.5" />
                    </span>
                  </div>
                </div>
                <span className="pointer-events-none absolute -right-6 top-10 hidden lg:block text-[#E85D26] text-xl rotate-12">🖍️</span>
              </Link>

              <Link to="/demo" className="relative rounded-[22px] overflow-hidden bg-[#FFF1DA] border border-[#F3E6D3] shadow-[0_20px_40px_rgba(0,0,0,0.08)] p-0 flex flex-col hover:shadow-[0_24px_40px_rgba(0,0,0,0.12)] transition">
                <div className="relative flex-1 bg-white m-2 rounded-2xl overflow-hidden border border-[#F3E6D3]">
                  <img src="https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=600&h=400&fit=crop" alt="laptop" className="h-28 sm:h-32 w-full object-cover opacity-90" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                  <div className="absolute bottom-2 left-2 right-2">
                    <div className="rounded-2xl bg-white p-2.5 shadow-lg max-w-[85%]">
                      <div className="text-[11px] font-bold leading-tight">Is it in stock? And a SPF one? Need advice for oily skin 🙏</div>
                      <div className="mt-2 rounded-xl bg-[#E6F7F1] p-2 text-[11px] leading-snug">
                        <span className="font-bold text-[#0B9C74]">Cognicart AI •</span> Yes! For oily skin try Elixir plus Matte Sunscreen. Bundle at 499 with free delivery. Want me to add to cart?
                      </div>
                    </div>
                  </div>
                  <div className="absolute top-2 right-2 bg-white rounded-full p-1 shadow">
                    <span className="h-6 w-6 rounded-full bg-[#0B9C74] grid place-items-center text-white text-xs">💬</span>
                  </div>
                </div>
                <div className="px-3 py-2 flex items-center gap-2 text-[11px] font-medium text-[#6b6b6b]">
                  <span className="h-6 w-6 rounded-full bg-white border border-[#F3E6D3] grid place-items-center">🌿</span> Replies in 3 seconds
                </div>
              </Link>

              <div className="relative rounded-[22px] overflow-hidden shadow-[0_20px_40px_rgba(0,0,0,0.08)] border border-[#F3E6D3] h-[168px] sm:h-[190px]">
                <img src="https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=600&h=600&fit=crop" alt="two sellers smiling" className="h-full w-full object-cover" />
                <div className="absolute bottom-2 left-2 bg-white/95 backdrop-blur rounded-full px-3 py-1.5 text-xs font-bold shadow flex items-center gap-2">
                  <span className="h-6 w-6 rounded-full bg-[#FFE7C2] grid place-items-center">✦</span> Amara and Lisa • Lagos
                </div>
              </div>

              <div className="relative rounded-[22px] overflow-hidden shadow-[0_20px_40px_rgba(0,0,0,0.08)] border border-[#F3E6D3] h-[168px] sm:h-[190px]">
                <img src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=600&h=600&fit=crop" alt="two sellers" className="h-full w-full object-cover" />
                <div className="absolute top-2 left-2 bg-[#0B9C74] text-white text-[10px] font-bold px-2.5 py-1 rounded-full">⭐ 2,341 orders via WhatsApp</div>
                <div className="absolute bottom-2 left-2 right-2 flex gap-2">
                  <span className="flex-1 bg-white/95 backdrop-blur rounded-full px-2 py-1.5 text-[11px] font-bold text-center">Eco • Fashion</span>
                  <span className="h-8 w-8 grid place-items-center rounded-full bg-white shadow">
                    <Heart className="h-4 w-4 text-[#E85D26]" />
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
