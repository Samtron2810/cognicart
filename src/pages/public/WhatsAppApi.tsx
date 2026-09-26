import { Link } from "react-router-dom"
import { MessageCircle, Shield, Zap, Code } from "lucide-react"

export default function WhatsAppApi() {
  return (
    <div className="min-h-screen bg-[#FFFBF5]">
      <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8 py-10">
        <h1 className="font-display text-[36px] font-bold tracking-tight leading-none">WhatsApp Business API</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-[#5a5a5a]">Each seller gets an isolated WhatsApp Cloud API connection. Webhooks hit our backend, AI calls constrained tools, and replies go back through the official API. No scraping.</p>

        <div className="mt-8 grid lg:grid-cols-3 gap-4">
          <div className="rounded-[22px] bg-white border border-[#F3E6D3] p-6"><MessageCircle className="h-6 w-6 text-[#0B9C74]" /><div className="mt-3 font-bold">Tool-gated AI</div><div className="mt-1 text-sm leading-6 text-[#5a5a5a]">searchProducts, getProduct, checkStock, getBusinessInformation, createOrder. AI cannot write to DB directly.</div></div>
          <div className="rounded-[22px] bg-white border border-[#F3E6D3] p-6"><Shield className="h-6 w-6 text-[#0B9C74]" /><div className="mt-3 font-bold">Tenant isolation</div><div className="mt-1 text-sm leading-6 text-[#5a5a5a]">Every query scoped by sellerId. Seller A never sees Seller B catalog or orders.</div></div>
          <div className="rounded-[22px] bg-white border border-[#F3E6D3] p-6"><Zap className="h-6 w-6 text-[#0B9C74]" /><div className="mt-3 font-bold">3-second replies</div><div className="mt-1 text-sm leading-6 text-[#5a5a5a]">Answers stock, size, delivery and sends cart links inside the WhatsApp thread.</div></div>
        </div>

        <div className="mt-6 rounded-[22px] bg-[#1a1a1a] text-white p-6 grid lg:grid-cols-[1.4fr_0.9fr] gap-6 items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-bold"><Code className="h-3.5 w-3.5" /> Developer doc</div>
            <h3 className="mt-3 font-display text-xl font-bold leading-tight">Webhook flow</h3>
            <p className="mt-2 text-sm text-white/70 leading-6">Customer to WhatsApp to Cloud API to our webhook to Backend to AI agent to Tools to DB to AI response to Cloud API to Customer. Each seller has separate credentials stored encrypted.</p>
          </div>
          <div className="rounded-2xl bg-white p-4 text-[#1a1a1a]">
            <div className="text-xs font-bold tracking-widest text-[#6b6b6b]">MVP ROADMAP</div>
            <div className="mt-2 text-sm leading-6">Phase 5: WhatsApp onboarding UI inside <Link to="/dashboard/whatsapp" className="font-bold text-[#0B9C74] underline">Dashboard → WhatsApp</Link>. Phase 4: Order creation and payment first.</div>
            <Link to="/register" className="mt-3 inline-flex rounded-full bg-[#0B9C74] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#0a8a66]">Start selling</Link>
          </div>
        </div>
      </div>
    </div>
  )
}
