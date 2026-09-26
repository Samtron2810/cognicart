import { useEffect, useMemo, useState } from "react"
import { Bot, Check, Inbox, MessageCircle, Phone, RefreshCw, Send, Shield, Unplug, Webhook } from "lucide-react"
import { useBusiness } from "../../context/BusinessContext"
import { aiService } from "../../services/aiService"
import { whatsappService } from "../../services/whatsappService"
import type { WhatsAppConfig, WhatsAppConversation, WhatsAppMessage } from "../../types/whatsapp"

export default function WhatsAppPage() {
  const { business, connectWhatsApp, disconnectWhatsApp } = useBusiness()
  const [config, setConfig] = useState<WhatsAppConfig | null>(null)
  const [messages, setMessages] = useState<WhatsAppMessage[]>([])
  const [conversations, setConversations] = useState<WhatsAppConversation[]>([])
  const [selectedCustomer, setSelectedCustomer] = useState("")
  const [phone, setPhone] = useState("")
  const [recipient, setRecipient] = useState("")
  const [body, setBody] = useState("")
  const [loading, setLoading] = useState(true)
  const [connecting, setConnecting] = useState(false)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const webhookUrl = `${(import.meta.env.VITE_API_URL || "http://localhost:5000/api").replace(/\/$/, "")}/whatsapp/webhook`
  const isConnected = Boolean(business?.whatsappConnected)
  const selectedMessages = useMemo(() => messages.filter((message) => message.customerPhone === selectedCustomer), [messages, selectedCustomer])

  const refresh = async () => {
    setError(null)
    try {
      const [nextConfig, nextMessages, nextConversations] = await Promise.all([
        whatsappService.getConfig(),
        whatsappService.listMessages(),
        whatsappService.getConversations(),
      ])
      setConfig(nextConfig)
      setMessages(nextMessages)
      setConversations(nextConversations)
      setSelectedCustomer((current) => current || nextConversations[0]?.customerPhone || "")
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to load WhatsApp data.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { void refresh() }, [])

  const handleConnect = async (event: React.FormEvent) => {
    event.preventDefault()
    setConnecting(true)
    setError(null)
    try {
      await connectWhatsApp(phone)
      const next = await whatsappService.getConfig()
      setConfig(next)
      await refresh()
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to connect WhatsApp.")
    } finally {
      setConnecting(false)
    }
  }

  const handleDisconnect = async () => {
    setError(null)
    try {
      await disconnectWhatsApp()
      await refresh()
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to disconnect WhatsApp.")
    }
  }

  const handleSend = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!recipient || !body.trim()) return
    setSending(true)
    setError(null)
    try {
      await whatsappService.sendOutbound({ to: recipient, body: body.trim() })
      setBody("")
      await refresh()
      setSelectedCustomer(recipient)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to send message.")
    } finally {
      setSending(false)
    }
  }

  if (loading) return <div className="grid place-items-center py-16"><div className="h-8 w-8 animate-spin rounded-full border-2 border-[#0B9C74] border-t-transparent" /></div>

  return <div className="mx-auto max-w-5xl space-y-6">
    <div className="flex flex-wrap items-start justify-between gap-3"><div><h1 className="font-display text-2xl font-bold tracking-tight">WhatsApp Business</h1><p className="text-sm text-[#6b6b6b]">Your connection, messages, and AI sales agent are managed by the backend.</p></div><button onClick={() => void refresh()} className="inline-flex items-center gap-2 rounded-full border border-[#F3E6D3] bg-white px-4 py-2 text-sm font-bold hover:bg-[#FFF1DA]"><RefreshCw className="h-4 w-4"/>Refresh</button></div>
    {error && <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">{error}</div>}

    <div className={`rounded-2xl border p-6 ${isConnected ? "border-[#0B9C74]/20 bg-[#E6F7F1]" : "border-[#F3E6D3] bg-white"}`}><div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center"><div className="flex gap-3"><span className={`grid h-11 w-11 place-items-center rounded-xl ${isConnected ? "bg-[#0B9C74] text-white" : "bg-[#FFF1DA] text-[#E85D26]"}`}><MessageCircle className="h-5 w-5"/></span><div><div className="font-bold">{isConnected ? "WhatsApp connected" : "WhatsApp not connected"}</div><p className="mt-1 text-sm text-[#6b6b6b]">{isConnected ? `Business number: ${business?.whatsappPhone || config?.businessPhone}` : "Connect your approved WhatsApp Business number to activate messaging."}</p>{config?.phoneNumberId && <p className="mt-1 text-xs text-[#6b6b6b]">Phone number ID: {config.phoneNumberId}</p>}</div></div>{isConnected && <button onClick={() => void handleDisconnect()} className="inline-flex items-center justify-center gap-2 rounded-full border border-[#F3E6D3] bg-white px-4 py-2 text-sm font-bold hover:bg-red-50 hover:text-red-700"><Unplug className="h-4 w-4"/>Disconnect</button>}</div></div>

    {!isConnected ? <form onSubmit={handleConnect} className="max-w-xl rounded-2xl border border-[#F3E6D3] bg-white p-6"><h2 className="flex items-center gap-2 font-bold"><Phone className="h-4 w-4 text-[#0B9C74]"/>Connect WhatsApp Business</h2><p className="mt-1 text-xs leading-5 text-[#6b6b6b]">Backend administrators configure Meta credentials and verification secrets. Enter the number assigned to this business.</p><input required value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="+2348010000001" className="mt-4 w-full rounded-xl border border-[#F3E6D3] px-3 py-2.5 text-sm outline-none focus:border-[#0B9C74]"/><button disabled={connecting} className="mt-4 rounded-full bg-[#0B9C74] px-6 py-2.5 text-sm font-bold text-white disabled:opacity-60">{connecting ? "Connecting…" : "Connect"}</button></form> : <>
      <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]"><section className="rounded-2xl border border-[#F3E6D3] bg-white p-5"><h2 className="flex items-center gap-2 font-bold"><Webhook className="h-4 w-4 text-[#0B9C74]"/>Webhook setup</h2><p className="mt-2 text-xs leading-5 text-[#6b6b6b]">Register this URL in Meta. The backend validates webhook signatures and routes incoming messages to the correct seller.</p><code className="mt-3 block break-all rounded-xl bg-[#FFFBF5] p-3 text-xs">{webhookUrl}</code><div className="mt-3 flex items-center gap-2 text-xs font-bold"><Shield className="h-4 w-4 text-[#0B9C74]"/>{config?.webhookVerified ? "Webhook verified" : "Verification is pending in Meta"}</div></section><section className="rounded-2xl bg-[#1a1a1a] p-5 text-white"><h2 className="flex items-center gap-2 font-bold"><Bot className="h-4 w-4 text-[#0B9C74]"/>AI sales agent</h2><p className="mt-2 text-xs leading-5 text-white/70">The backend decides which live-catalog tools to use and validates every order and payment action.</p><div className="mt-3 flex flex-wrap gap-2">{aiService.getToolDefinitions().map((tool) => <span key={tool.name} className="rounded-full bg-white/10 px-2.5 py-1 text-xs">{tool.name}</span>)}</div></section></div>
      <div className="grid gap-4 lg:grid-cols-[0.75fr_1.25fr]"><section className="rounded-2xl border border-[#F3E6D3] bg-white p-4"><h2 className="mb-3 flex items-center gap-2 font-bold"><Inbox className="h-4 w-4 text-[#0B9C74]"/>Conversations</h2><div className="space-y-2">{conversations.map((conversation) => <button key={conversation.customerPhone} onClick={() => { setSelectedCustomer(conversation.customerPhone); setRecipient(conversation.customerPhone) }} className={`w-full rounded-xl border p-3 text-left ${selectedCustomer === conversation.customerPhone ? "border-[#1a1a1a] bg-[#1a1a1a] text-white" : "border-[#F3E6D3] hover:bg-[#FFFBF5]"}`}><div className="text-sm font-bold">{conversation.customerPhone}</div><div className="mt-1 truncate text-xs opacity-70">{conversation.messages?.at(-1)?.body || "No messages"}</div></button>)}{!conversations.length && <p className="py-6 text-center text-sm text-[#6b6b6b]">No conversations yet.</p>}</div></section><section className="rounded-2xl border border-[#F3E6D3] bg-white p-4"><h2 className="font-bold">Messages</h2><div className="mt-3 min-h-[240px] space-y-3 rounded-xl bg-[#FFFBF5] p-3">{selectedMessages.map((message) => <div key={message.id} className={`max-w-[80%] rounded-2xl p-3 text-sm ${message.direction === "outbound" ? "ml-auto bg-[#1a1a1a] text-white" : "bg-white border border-[#F3E6D3]"}`}><div className="text-xs font-bold opacity-60">{message.direction === "outbound" ? "Business" : "Customer"}</div><div className="mt-1 whitespace-pre-wrap">{message.body}</div></div>)}{selectedCustomer && !selectedMessages.length && <p className="py-12 text-center text-sm text-[#6b6b6b]">No messages for this customer.</p>}</div><form onSubmit={handleSend} className="mt-3 flex flex-col gap-2 sm:flex-row"><input value={recipient} onChange={(event) => setRecipient(event.target.value)} placeholder="Recipient phone" className="rounded-xl border border-[#F3E6D3] px-3 py-2 text-sm outline-none focus:border-[#0B9C74] sm:w-44"/><input value={body} onChange={(event) => setBody(event.target.value)} placeholder="Type a message" className="min-w-0 flex-1 rounded-xl border border-[#F3E6D3] px-3 py-2 text-sm outline-none focus:border-[#0B9C74]"/><button disabled={sending} className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#0B9C74] px-4 py-2 text-sm font-bold text-white disabled:opacity-60"><Send className="h-4 w-4"/>Send</button></form></section></div>
    </>}
    {config?.whatsappConnected && <div className="flex items-center gap-2 rounded-xl border border-[#0B9C74]/20 bg-[#E6F7F1] px-3 py-2 text-sm text-[#0B9C74]"><Check className="h-4 w-4"/>Backend connection is active.</div>}
  </div>
}
