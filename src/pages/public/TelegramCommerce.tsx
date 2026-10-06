import { Link } from "react-router-dom"
import { Bot, CheckCircle, Globe, PackageCheck, Send, ShieldCheck, ShoppingBag, Zap } from "lucide-react"
import { useSEO } from "../../hooks/useSEO"

export default function TelegramCommerce() {
  useSEO({
    title: "Telegram Commerce — Sell in chat with your own AI bot | Chatstand",
    description: "Connect your own Telegram bot to Chatstand. An AI assistant answers buyers from your live catalog, takes orders in chat, and every sale lands in one unified dashboard alongside storefront and manual orders.",
    canonical: "https://chatstand.ng/telegram-commerce",
    ogTitle: "Telegram Commerce on Chatstand",
    ogDescription: "Your own Telegram bot, powered by AI that only speaks from your catalog. Orders sync to one dashboard with your storefront and manual sales.",
  })

  return (
    <div className="min-h-screen bg-[#FFFBF5]">
      <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8 py-10">
        {/* Hero */}
        <div className="rounded-[24px] bg-[#1a1a1a] text-white p-8 sm:p-12">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-[#229ED9]/20 border border-[#229ED9]/40 px-3 py-1 text-xs font-bold text-[#7fd0f5]"><Send className="h-3.5 w-3.5" /> TELEGRAM COMMERCE</div>
            <h1 className="mt-4 font-display text-[36px] sm:text-[44px] font-bold tracking-tight leading-tight">Your store, inside Telegram — answered by AI, run by you.</h1>
            <p className="mt-4 text-sm sm:text-base leading-7 text-white/70">Connect a Telegram bot you own and Chatstand turns it into a shop assistant. It answers product questions, quotes live prices and stock, and takes orders — all from your real catalog, never invented data. Every conversation and order shows up in your seller dashboard.</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link to="/register" className="rounded-full bg-[#229ED9] px-6 py-3 text-sm font-bold text-white hover:bg-[#1c82b3]">Start selling on Telegram</Link>
              <Link to="/store" className="rounded-full bg-white/10 border border-white/20 px-6 py-3 text-sm font-bold text-white hover:bg-white/20">Browse stores</Link>
            </div>
          </div>
        </div>

        {/* How it works */}
        <div className="mt-10">
          <h2 className="font-display text-2xl font-bold">How it works</h2>
          <div className="mt-4 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { icon: Bot, title: "1. Create your bot", body: "Make a bot with Telegram's @BotFather in two minutes. You own the bot and its name." },
              { icon: ShieldCheck, title: "2. Connect it securely", body: "Paste the bot token once in your dashboard. It's stored server-side only — never in your browser." },
              { icon: Zap, title: "3. AI answers buyers", body: "The assistant replies from your live products, prices, variants and stock. No hallucinated offers." },
              { icon: PackageCheck, title: "4. Orders sync instantly", body: "Telegram orders appear in your unified dashboard next to storefront and manual sales." },
            ].map(({ icon: Icon, title, body }) => (
              <div key={title} className="rounded-2xl bg-white border border-[#F3E6D3] p-5">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-[#E7F4FB]"><Icon className="h-5 w-5 text-[#1c82b3]" /></div>
                <div className="mt-3 font-bold text-sm">{title}</div>
                <p className="mt-1 text-xs leading-5 text-[#6b6b6b]">{body}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Features */}
        <div className="mt-10 grid lg:grid-cols-2 gap-6">
          <div className="rounded-[22px] bg-white border border-[#F3E6D3] p-6">
            <h3 className="font-display text-xl font-bold">Built for real selling</h3>
            <ul className="mt-4 space-y-3 text-sm text-[#5a5a5a]">
              <li className="flex gap-2"><CheckCircle className="h-4 w-4 mt-0.5 shrink-0 text-[#0B9C74]" /> Conversation inbox — read every buyer chat and the AI's replies from your dashboard.</li>
              <li className="flex gap-2"><CheckCircle className="h-4 w-4 mt-0.5 shrink-0 text-[#0B9C74]" /> Telegram campaigns — broadcast to segments of your Telegram customers, with delivery and failure stats.</li>
              <li className="flex gap-2"><CheckCircle className="h-4 w-4 mt-0.5 shrink-0 text-[#0B9C74]" /> Abandoned-order reminders — nudge Telegram buyers who started but didn't finish.</li>
              <li className="flex gap-2"><CheckCircle className="h-4 w-4 mt-0.5 shrink-0 text-[#0B9C74]" /> Marketing opt-out respected automatically for every campaign audience.</li>
              <li className="flex gap-2"><CheckCircle className="h-4 w-4 mt-0.5 shrink-0 text-[#0B9C74]" /> Disconnect anytime — your bot, your rules.</li>
            </ul>
          </div>
          <div className="rounded-[22px] bg-white border border-[#F3E6D3] p-6">
            <h3 className="font-display text-xl font-bold">One dashboard, every channel</h3>
            <ul className="mt-4 space-y-3 text-sm text-[#5a5a5a]">
              <li className="flex gap-2"><Send className="h-4 w-4 mt-0.5 shrink-0 text-[#229ED9]" /> <span><span className="font-bold text-[#1a1a1a]">Telegram orders</span> — captured automatically from bot conversations.</span></li>
              <li className="flex gap-2"><Globe className="h-4 w-4 mt-0.5 shrink-0 text-[#0B9C74]" /> <span><span className="font-bold text-[#1a1a1a]">Storefront orders</span> — guest checkout on your public store page, with email receipts via Brevo.</span></li>
              <li className="flex gap-2"><ShoppingBag className="h-4 w-4 mt-0.5 shrink-0 text-[#E85D26]" /> <span><span className="font-bold text-[#1a1a1a]">Manual orders</span> — log sales you closed on Instagram, WhatsApp chats, phone calls or in person, with negotiated prices and offline payments.</span></li>
            </ul>
            <p className="mt-4 text-xs leading-5 text-[#6b6b6b]">Every order is badged by source, so you always know where revenue comes from. Summary reports break totals down by channel, status and payment state.</p>
          </div>
        </div>

        {/* Trust */}
        <div className="mt-10 rounded-[22px] bg-[#E7F4FB] border border-[#229ED9]/20 p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
            <div className="max-w-2xl">
              <h3 className="font-display text-xl font-bold">Security first</h3>
              <p className="mt-2 text-sm leading-6 text-[#3a5a6b]">Bot tokens live only on our servers — never in your browser or local storage. Webhooks are configured and verified by the backend automatically when you connect. Buyers on your storefront can check out as guests; no passwords, ever.</p>
            </div>
            <Link to="/register" className="shrink-0 rounded-full bg-[#229ED9] px-6 py-3 text-sm font-bold text-white hover:bg-[#1c82b3] text-center">Connect your bot</Link>
          </div>
        </div>

        {/* FAQ */}
        <div className="mt-10">
          <h2 className="font-display text-2xl font-bold">Common questions</h2>
          <div className="mt-4 grid sm:grid-cols-2 gap-4 text-sm">
            {[
              { q: "Do I need my own Telegram bot?", a: "Yes — you create it free with @BotFather and connect it with its token. Buyers chat with your brand, not ours." },
              { q: "Can the AI make up prices or discounts?", a: "No. It only reads your live catalog through controlled tools. If it doesn't know, it says so." },
              { q: "What about WhatsApp?", a: "Chatstand doesn't automate WhatsApp. You can still log WhatsApp-negotiated sales as manual orders and share order updates via wa.me links you open yourself." },
              { q: "How do buyers who don't use Telegram order?", a: "Through your public storefront — guest checkout with name, phone, email and address. They get email updates and can track orders with a passwordless code." },
            ].map(({ q, a }) => (
              <div key={q} className="rounded-2xl bg-white border border-[#F3E6D3] p-5">
                <div className="font-bold">{q}</div>
                <p className="mt-1.5 text-[#6b6b6b] leading-6">{a}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
