import { useState } from "react"
import { Mail, Phone, MapPin, MessageCircle } from "lucide-react"

export default function Contact() {
  const [sent, setSent] = useState(false)
  const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); setSent(true); setTimeout(() => setSent(false), 2500) }
  return (
    <div className="min-h-screen bg-[#FFFBF5]">
      <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8 py-10">
        <h1 className="font-display text-[36px] font-bold tracking-tight leading-none">Contact</h1>
        <p className="mt-2 text-sm text-[#5a5a5a]">Talk to the founder or support. We reply on WhatsApp first.</p>

        <div className="mt-8 grid lg:grid-cols-[1.1fr_0.9fr] gap-6">
          <form onSubmit={handleSubmit} className="rounded-[22px] bg-white border border-[#F3E6D3] p-6 space-y-4">
            {sent && <div className="rounded-xl bg-[#E6F7F1] border border-[#0B9C74]/20 px-3 py-2.5 text-sm font-medium text-[#0B9C74]">Message received. We will reply on WhatsApp or email.</div>}
            <div className="grid sm:grid-cols-2 gap-4">
              <label className="text-sm"><span className="text-xs font-bold">Name</span><input required placeholder="Amara" className="mt-1 w-full rounded-xl border border-[#F3E6D3] px-3 py-2.5 text-sm focus:border-[#0B9C74] outline-none" /></label>
              <label className="text-sm"><span className="text-xs font-bold">WhatsApp or email</span><input required placeholder="+234 ... or you@mail.com" className="mt-1 w-full rounded-xl border border-[#F3E6D3] px-3 py-2.5 text-sm focus:border-[#0B9C74] outline-none" /></label>
            </div>
            <label className="text-sm block"><span className="text-xs font-bold">How can we help</span><textarea required rows={4} placeholder="I sell fashion in Lagos, need help connecting WhatsApp..." className="mt-1 w-full rounded-xl border border-[#F3E6D3] px-3 py-2.5 text-sm focus:border-[#0B9C74] outline-none resize-none" /></label>
            <button type="submit" className="rounded-full bg-[#0B9C74] px-6 py-2.5 text-sm font-bold text-white hover:bg-[#0a8a66]">Send message</button>
            <p className="text-xs text-[#9a9a9a]">Or email hello@cognicart.ng • We never share your contact.</p>
          </form>

          <div className="space-y-4">
            <div className="rounded-[22px] bg-[#1a1a1a] text-white p-6">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-bold"><MessageCircle className="h-3.5 w-3.5" /> WhatsApp AI</div>
              <h3 className="mt-3 font-display text-xl font-bold leading-tight">Chat to sell smarter</h3>
              <p className="mt-2 text-sm text-white/70 leading-6">Sellers get priority support inside WhatsApp. Customers chat naturally and AI checks stock, price and delivery from your dashboard.</p>
              <a href="https://wa.me/2340000000000" target="_blank" rel="noreferrer" className="mt-4 inline-flex rounded-full bg-[#0B9C74] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#0a8a66]">Open WhatsApp</a>
            </div>
            <div className="rounded-2xl bg-white border border-[#F3E6D3] p-5 space-y-3 text-sm">
              <div className="flex gap-3"><Mail className="h-4 w-4 mt-0.5 text-[#0B9C74]" /><div><div className="font-bold">Email</div><div className="text-[#6b6b6b]">hello@cognicart.ng</div></div></div>
              <div className="flex gap-3"><Phone className="h-4 w-4 mt-0.5 text-[#0B9C74]" /><div><div className="font-bold">Phone</div><div className="text-[#6b6b6b]">+234 800 000 0000</div></div></div>
              <div className="flex gap-3"><MapPin className="h-4 w-4 mt-0.5 text-[#0B9C74]" /><div><div className="font-bold">Port Harcourt</div><div className="text-[#6b6b6b]">Built for sellers everywhere</div></div></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
