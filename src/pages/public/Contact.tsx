import { useState } from "react"
import { Mail, Phone, MapPin, MessageCircle } from "lucide-react"

const CONTACT_EMAIL = "trewallaffiliates@gmail.com"
// Generic on purpose: one subject that reads correctly whether the sender wants
// help, has a request, or is reporting a problem.
const CONTACT_SUBJECT = "Chatstand support request"

export default function Contact() {
  const [name, setName] = useState("")
  const [contact, setContact] = useState("")
  const [message, setMessage] = useState("")
  const [sent, setSent] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // CRLF rather than \n: Outlook and several mobile clients collapse bare
    // newlines in a mailto body.
    const body = [
      `Name: ${name}`,
      `Phone or email: ${contact}`,
      "",
      "Message:",
      message,
    ].join("\r\n")
    const href = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(CONTACT_SUBJECT)}&body=${encodeURIComponent(body)}`
    // Hands the draft to whatever mail app the device has registered. Nothing
    // is sent until the sender hits send there, so the notice below says
    // "opening" rather than claiming we received anything.
    window.location.href = href
    setSent(true)
    setTimeout(() => setSent(false), 8000)
  }

  return (
    <div className="min-h-screen bg-[#FFFBF5]">
      <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8 py-10">
        <h1 className="font-display text-[36px] font-bold tracking-tight leading-none">Contact</h1>
        <p className="mt-2 text-sm text-[#5a5a5a]">Talk to the founder or support. We reply by email or Telegram.</p>

        <div className="mt-8 grid lg:grid-cols-[1.1fr_0.9fr] gap-6">
          <form onSubmit={handleSubmit} className="rounded-[22px] bg-white border border-[#F3E6D3] p-6 space-y-4">
            {sent && (
              <div className="rounded-xl bg-[#E6F7F1] border border-[#0B9C74]/20 px-3 py-2.5 text-sm font-medium text-[#0B9C74]" role="status">
                Opening your email app with the message ready to send. If nothing happened, email{" "}
                <a href={`mailto:${CONTACT_EMAIL}`} className="underline">{CONTACT_EMAIL}</a> directly.
              </div>
            )}
            <div className="grid sm:grid-cols-2 gap-4">
              <label className="text-sm"><span className="text-xs font-bold">Name</span><input required value={name} onChange={(e) => setName(e.target.value)} name="name" autoComplete="name" placeholder="Amara" className="mt-1 w-full rounded-xl border border-[#F3E6D3] px-3 py-2.5 text-sm focus:border-[#0B9C74] outline-none" /></label>
              <label className="text-sm"><span className="text-xs font-bold">Phone or email</span><input required value={contact} onChange={(e) => setContact(e.target.value)} name="contact" placeholder="+234 ... or you@mail.com" className="mt-1 w-full rounded-xl border border-[#F3E6D3] px-3 py-2.5 text-sm focus:border-[#0B9C74] outline-none" /></label>
            </div>
            <label className="text-sm block"><span className="text-xs font-bold">How can we help</span><textarea required value={message} onChange={(e) => setMessage(e.target.value)} name="message" rows={4} placeholder="I sell fashion, need help connecting my Telegram bot..." className="mt-1 w-full rounded-xl border border-[#F3E6D3] px-3 py-2.5 text-sm focus:border-[#0B9C74] outline-none resize-none" /></label>
            <button type="submit" className="rounded-full bg-[#0B9C74] px-6 py-2.5 text-sm font-bold text-white hover:bg-[#0a8a66]">Send message</button>
            <p className="text-xs text-[#9a9a9a]">Opens in your email app. Or email {CONTACT_EMAIL} • We never share your contact.</p>
          </form>

          <div className="space-y-4">
            <div className="rounded-[22px] bg-[#1a1a1a] text-white p-6">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-bold"><MessageCircle className="h-3.5 w-3.5" /> Telegram</div>
              <h3 className="mt-3 font-display text-xl font-bold leading-tight">Chat to sell smarter</h3>
              <p className="mt-2 text-sm text-white/70 leading-6">Sellers get priority support on Telegram. Customers chat naturally with your bot and AI checks stock, price and delivery from your live catalog.</p>
              <a href="https://t.me/chatstand" target="_blank" rel="noreferrer" className="mt-4 inline-flex rounded-full bg-[#229ED9] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#1c82b3]">Open Telegram</a>
            </div>
            <div className="rounded-2xl bg-white border border-[#F3E6D3] p-5 space-y-3 text-sm">
              <div className="flex gap-3"><Mail className="h-4 w-4 mt-0.5 text-[#0B9C74]" /><div><div className="font-bold">Email</div><div className="text-[#6b6b6b]"><a href={`mailto:${CONTACT_EMAIL}`} className="hover:text-[#0B9C74]">{CONTACT_EMAIL}</a></div></div></div>
              <div className="flex gap-3"><Phone className="h-4 w-4 mt-0.5 text-[#0B9C74]" /><div><div className="font-bold">Phone</div><div className="text-[#6b6b6b]">+234 800 000 0000</div></div></div>
              <div className="flex gap-3"><MapPin className="h-4 w-4 mt-0.5 text-[#0B9C74]" /><div><div className="font-bold">Nigeria</div><div className="text-[#6b6b6b]">Built for sellers everywhere</div></div></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
