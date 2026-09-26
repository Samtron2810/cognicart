import { useEffect, useState } from "react"
import { MessageCircle, Check, Shield, ExternalLink, Phone, Unplug, Copy, Send, Webhook, Inbox, User, Clock, Trash2, Play, MessageSquare, Bot, Zap, Sparkles } from "lucide-react"
import { useBusiness } from "../../context/BusinessContext"
import { whatsappService } from "../../services/whatsappService"
import { aiService } from "../../services/aiService"
import type { WhatsAppMessage, WhatsAppConfig } from "../../types/whatsapp"

export default function WhatsApp() {
  const { business, connectWhatsApp, disconnectWhatsApp } = useBusiness()
  const [phone, setPhone] = useState(business?.whatsappPhone || "")
  const [connecting, setConnecting] = useState(false)
  const [copied, setCopied] = useState(false)
  const [tab, setTab] = useState<"overview" | "webhook" | "inbox" | "simulator" | "ai">("overview")
  const [config, setConfig] = useState<WhatsAppConfig | null>(null)
  const [verifyToken, setVerifyToken] = useState("")
  const [challenge, setChallenge] = useState("12345")
  const [verifyResult, setVerifyResult] = useState<string | null>(null)
  const [verifyError, setVerifyError] = useState<string | null>(null)
  const [messages, setMessages] = useState<WhatsAppMessage[]>([])
  const [conversations, setConversations] = useState<{ customerPhone: string; lastMessage: WhatsAppMessage; count: number }[]>([])
  const [selectedCustomer, setSelectedCustomer] = useState<string | null>(null)
  const [simFrom, setSimFrom] = useState("+2348031112222")
  const [simBody, setSimBody] = useState("Hi, is Elixir Glow Serum in stock?")
  const [simBusinessPhone, setSimBusinessPhone] = useState("")
  const [simLoading, setSimLoading] = useState(false)
  const [aiEnabled, setAiEnabled] = useState(false)
  const [expandedTools, setExpandedTools] = useState<Record<string, boolean>>({})

  const isConnected = business?.whatsappConnected

  useEffect(() => {
    setPhone(business?.whatsappPhone || "")
    whatsappService.getConfig().then(setConfig)
    // load AI enabled
    try {
      const raw = localStorage.getItem("cognicart_seller")
      const sid = raw ? (JSON.parse(raw).id as string) : "mock_seller"
      setAiEnabled(aiService.isEnabled(sid))
    } catch {
      setAiEnabled(aiService.isEnabled())
    }
  }, [business])

  const loadMessages = async () => {
    const msgs = await whatsappService.listMessages()
    setMessages(msgs)
    const convs = await whatsappService.getConversations()
    setConversations(convs)
    if (convs.length > 0 && !selectedCustomer) setSelectedCustomer(convs[0].customerPhone)
  }

  useEffect(() => {
    loadMessages()
  }, [])

  useEffect(() => {
    if (config) {
      setSimBusinessPhone(config.businessPhone)
      setVerifyToken(config.verifyToken)
    }
  }, [config])

  const handleAiToggle = () => {
    const next = !aiEnabled
    setAiEnabled(next)
    try {
      const raw = localStorage.getItem("cognicart_seller")
      const sid = raw ? (JSON.parse(raw).id as string) : undefined
      aiService.setEnabled(next, sid)
    } catch {
      aiService.setEnabled(next)
    }
  }

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!phone || phone.length < 10) return
    setConnecting(true)
    await connectWhatsApp(phone)
    const cfg = await whatsappService.connect({ businessPhone: phone, verifyToken: "verify_" + phone.slice(-4), accessToken: "token_" + phone.slice(-4) })
    setConfig(cfg)
    setConnecting(false)
    setTab("webhook")
  }

  const handleDisconnect = async () => {
    if (!confirm("Disconnect WhatsApp? AI will stop replying.")) return
    await disconnectWhatsApp()
    await whatsappService.disconnect()
    setConfig(null)
    setMessages([])
    setConversations([])
  }

  const copyWebhook = async () => {
    await navigator.clipboard.writeText(`${window.location.origin}/api/whatsapp/webhook`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    setVerifyResult(null)
    setVerifyError(null)
    try {
      const res = await whatsappService.verifyWebhook({ mode: "subscribe", verifyToken, challenge })
      setVerifyResult(res)
      const cfg = await whatsappService.getConfig()
      setConfig(cfg)
    } catch (err) {
      setVerifyError(err instanceof Error ? err.message : "Verify failed")
    }
  }

  const handleSimulate = async (e: React.FormEvent) => {
    e.preventDefault()
    setSimLoading(true)
    try {
      await whatsappService.handleIncoming({ from: simFrom, body: simBody, businessPhone: simBusinessPhone || config?.businessPhone })
      await loadMessages()
      setTab("inbox")
      setSelectedCustomer(simFrom)
    } finally {
      setSimLoading(false)
    }
  }

  const handleClear = async () => {
    if (!confirm("Clear all logged messages for this seller?")) return
    whatsappService.clearAll()
    // clear AI contexts as well for demo
    try {
      const keys = Object.keys(localStorage)
      keys.forEach((k) => {
        if (k.startsWith("cognicart_ai_")) localStorage.removeItem(k)
      })
    } catch {}
    loadMessages()
  }

  const filteredMessages = selectedCustomer ? messages.filter((m) => m.customerPhone === selectedCustomer) : []

  const getToolCalls = (msgId: string) => {
    try {
      const raw = localStorage.getItem(`cognicart_ai_tool_${msgId}`)
      if (raw) return JSON.parse(raw)
    } catch {}
    return null
  }

  return (
    <div className="max-w-5xl space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight">WhatsApp Business</h1>
          <p className="text-sm text-[#6b6b6b]">Phase 5 webhook + Phase 6 AI sales agent. Deterministic before, AI with controlled tools now.</p>
        </div>
        <div className="flex items-center gap-2 rounded-full bg-white border border-[#F3E6D3] p-1">
          <span className="pl-3 text-xs font-bold flex items-center gap-1"><Bot className="h-3.5 w-3.5 text-[#0B9C74]" /> AI Agent</span>
          <button onClick={handleAiToggle} className={`relative h-7 w-12 rounded-full transition ${aiEnabled ? "bg-[#0B9C74]" : "bg-[#F3E6D3]"}`}>
            <span className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition ${aiEnabled ? "left-5" : "left-0.5"}`} />
          </button>
          <span className={`pr-3 text-xs font-bold ${aiEnabled ? "text-[#0B9C74]" : "text-[#9a9a9a]"}`}>{aiEnabled ? "ON" : "OFF"}</span>
        </div>
      </div>

      {aiEnabled && (
        <div className="rounded-2xl bg-[#1a1a1a] text-white p-4 flex flex-col sm:flex-row items-start justify-between gap-3">
          <div className="flex gap-3">
            <span className="h-10 w-10 rounded-xl bg-[#0B9C74] grid place-items-center shrink-0"><Sparkles className="h-5 w-5" /></span>
            <div>
              <div className="text-sm font-bold flex items-center gap-2">AI Sales Agent active <span className="rounded-full bg-[#0B9C74] px-2 py-0.5 text-xs">Phase 6</span></div>
              <div className="text-xs leading-5 text-white/70">AI decides when to call <span className="font-mono font-bold text-white">searchProducts, getProduct, checkStock, getBusinessInfo, createOrder, calculateOrderTotal</span>. Backend validates.</div>
            </div>
          </div>
          <button onClick={() => setTab("ai")} className="rounded-full bg-white px-4 py-2 text-xs font-bold text-[#1a1a1a] hover:bg-[#FFF1DA] shrink-0">View tools</button>
        </div>
      )}

      <div className={`rounded-[22px] border p-6 flex flex-col lg:flex-row items-start justify-between gap-4 ${isConnected ? "bg-[#E6F7F1] border-[#0B9C74]/20" : "bg-white border-[#F3E6D3]"}`}>
        <div className="flex gap-3">
          <div className={`h-11 w-11 rounded-xl grid place-items-center ${isConnected ? "bg-[#0B9C74] text-white" : "bg-[#FFF1DA] border border-[#F3E6D3] text-[#E85D26]"}`}>
            <MessageCircle className="h-5 w-5" />
          </div>
          <div>
            <div className="text-sm font-bold flex items-center gap-2">
              {isConnected ? "Connected" : "Not connected"}
              {isConnected && <span className="inline-flex items-center gap-1 rounded-full bg-[#0B9C74] px-2 py-0.5 text-xs font-bold text-white"><Check className="h-3 w-3" /> Active</span>}
              {config?.webhookVerified && <span className="inline-flex items-center gap-1 rounded-full bg-[#1a1a1a] px-2 py-0.5 text-xs font-bold text-white"><Shield className="h-3 w-3" /> Verified</span>}
              {aiEnabled && <span className="inline-flex items-center gap-1 rounded-full bg-[#E85D26] px-2 py-0.5 text-xs font-bold text-white"><Bot className="h-3 w-3" /> AI</span>}
            </div>
            <div className="text-sm text-[#6b6b6b] leading-5">
              {isConnected
                ? `Replies on ${business?.whatsappPhone}. Verified ${business?.whatsappVerifiedAt ? new Date(business.whatsappVerifiedAt).toLocaleString() : ""}.`
                : "AI will reply inside WhatsApp after you connect. Webhook verification isolates sellers by phoneNumberId."}
            </div>
            {isConnected && <div className="mt-1 inline-flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-2 rounded-full bg-white border border-[#0B9C74]/20 px-3 py-1 text-xs font-bold"><Phone className="h-3 w-3" /> {business?.whatsappPhone}</span>
              {config && <span className="inline-flex rounded-full bg-white border border-[#F3E6D3] px-3 py-1 text-xs font-mono">pnid {config.phoneNumberId}</span>}
            </div>}
          </div>
        </div>
        {isConnected ? (
          <button onClick={handleDisconnect} className="inline-flex items-center gap-2 rounded-full bg-white border border-[#F3E6D3] px-4 py-2 text-sm font-bold hover:bg-red-50 hover:border-red-200 hover:text-red-700">
            <Unplug className="h-4 w-4" /> Disconnect
          </button>
        ) : (
          <div className="rounded-xl bg-[#FFF1DA] border border-[#F3E6D3] px-3 py-2 text-xs font-bold">Mock local — stores per sellerId</div>
        )}
      </div>

      {!isConnected ? (
        <form onSubmit={handleConnect} className="rounded-2xl bg-white border border-[#F3E6D3] p-6 space-y-4">
          <div className="text-sm font-bold flex items-center gap-2"><Phone className="h-4 w-4 text-[#0B9C74]" /> Connect WhatsApp Business</div>
          <p className="text-xs text-[#6b6b6b] leading-5">Each seller has independent Cloud API credentials. We store <span className="font-mono font-bold">phoneNumberId, verifyToken, accessToken</span> per sellerId. In production this is OAuth onboarding.</p>
          <label className="block">
            <span className="text-xs font-bold">WhatsApp Business phone *</span>
            <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+2348010000001" className="mt-1 w-full rounded-xl border border-[#F3E6D3] px-3 py-2.5 text-sm focus:border-[#0B9C74] outline-none" required />
          </label>
          <button type="submit" disabled={connecting} className="rounded-full bg-[#0B9C74] px-6 py-2.5 text-sm font-bold text-white hover:bg-[#0a8a66] disabled:opacity-60">
            {connecting ? "Connecting..." : "Connect WhatsApp"}
          </button>
        </form>
      ) : (
        <div className="space-y-4">
          <div className="flex gap-2 overflow-auto pb-1">
            {[
              { id: "overview", label: "Overview", icon: Shield },
              { id: "ai", label: "AI Agent", icon: Bot },
              { id: "webhook", label: "Webhook", icon: Webhook },
              { id: "inbox", label: "Inbox", icon: Inbox },
              { id: "simulator", label: "Simulator", icon: Play },
            ].map((t) => (
              <button key={t.id} onClick={() => setTab(t.id as never)} className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold border whitespace-nowrap ${tab === t.id ? "bg-[#1a1a1a] text-white border-[#1a1a1a]" : "bg-white border-[#F3E6D3] hover:bg-[#FFF1DA]"}`}>
                <t.icon className="h-4 w-4" /> {t.label}
              </button>
            ))}
            <button onClick={loadMessages} className="ml-auto rounded-full bg-white border border-[#F3E6D3] px-3 py-2 text-xs font-bold hover:bg-[#FFF1DA]">Refresh</button>
          </div>

          {tab === "overview" && (
            <div className="space-y-4">
              <div className="rounded-2xl bg-white border border-[#F3E6D3] p-6">
                <div className="text-sm font-bold">Seller identification</div>
                <p className="text-xs text-[#6b6b6b] leading-5 mt-1">Webhook payload contains <span className="font-mono">phone_number_id</span> or business phone. We map it to <span className="font-mono">sellerId</span> before any product lookup. Seller A never sees Seller B messages.</p>
                <div className="mt-3 grid sm:grid-cols-3 gap-3 text-xs">
                  <div className="rounded-xl bg-[#FFFBF5] border border-[#F3E6D3] p-3"><div className="font-bold">Business phone</div><div className="font-mono">{config?.businessPhone}</div></div>
                  <div className="rounded-xl bg-[#FFFBF5] border border-[#F3E6D3] p-3"><div className="font-bold">Phone number ID</div><div className="font-mono">{config?.phoneNumberId}</div></div>
                  <div className="rounded-xl bg-[#FFFBF5] border border-[#F3E6D3] p-3"><div className="font-bold">Verify token</div><div className="font-mono">{config?.verifyToken}</div></div>
                </div>
              </div>

              <div className="rounded-2xl bg-white border border-[#F3E6D3] p-6">
                <div className="text-sm font-bold flex items-center gap-2"><Zap className="h-4 w-4 text-[#E85D26]" /> Phase 5 → Phase 6</div>
                <p className="text-xs text-[#6b6b6b] mt-1">{aiEnabled ? "AI is ON: decides tools to call. OFF: deterministic rule-based." : "Deterministic is ON: rule-based before AI."} Toggle at top to compare.</p>
                <div className="mt-3 grid sm:grid-cols-2 gap-3 text-xs">
                  <div className={`rounded-xl border p-3 ${aiEnabled ? "bg-[#E6F7F1] border-[#0B9C74]/20" : "bg-[#FFFBF5] border-[#F3E6D3]"}`}>
                    <div className="font-bold flex items-center gap-2"><Bot className="h-3.5 w-3.5" /> AI Agent (Phase 6)</div>
                    <div className="text-[#5a5a5a] leading-5">Natural conversation, collects product/qty/address, confirms order, calls <span className="font-mono">createOrder</span>.</div>
                  </div>
                  <div className={`rounded-xl border p-3 ${!aiEnabled ? "bg-[#E6F7F1] border-[#0B9C74]/20" : "bg-[#FFFBF5] border-[#F3E6D3]"}`}>
                    <div className="font-bold flex items-center gap-2"><MessageSquare className="h-3.5 w-3.5" /> Deterministic (Phase 5)</div>
                    <div className="text-[#5a5a5a] leading-5">Rule-based: <span className="font-mono">searchProducts, checkStock, getBusinessInfo</span>.</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {tab === "ai" && (
            <div className="space-y-4">
              <div className="rounded-2xl bg-[#1a1a1a] text-white p-6">
                <div className="flex items-center gap-2 text-sm font-bold"><Sparkles className="h-4 w-4 text-[#0B9C74]" /> AI Sales Agent — controlled tools</div>
                <p className="text-xs leading-5 text-white/70 mt-1">AI never writes DB directly. It decides when to call backend tools, backend validates and is seller-scoped. OpenAI key optional: uses <span className="font-mono">VITE_OPENAI_API_KEY</span> if present else mock.</p>
                <div className="mt-4 grid sm:grid-cols-2 gap-3 text-xs">
                  {aiService.getToolDefinitions().map((tool) => (
                    <div key={tool.name} className="rounded-xl bg-white/10 border border-white/10 p-3">
                      <div className="font-mono font-bold text-white">{tool.name}</div>
                      <div className="text-white/70 leading-5">{tool.description}</div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 rounded-xl bg-white/10 p-3 text-xs leading-5 text-white/70">
                  <div className="font-bold text-white">Multi-tenant guard</div>
                  Every tool query is <span className="font-mono">WHERE sellerId = authenticatedSellerId</span>. Never <span className="font-mono">find product by id only</span>.
                </div>
              </div>

              <div className="rounded-2xl bg-white border border-[#F3E6D3] p-6">
                <div className="text-sm font-bold">Try AI conversation</div>
                <p className="text-xs text-[#6b6b6b]">Turn AI ON, go to Simulator, and try:</p>
                <ol className="mt-3 space-y-2 text-xs leading-5 list-decimal pl-5 text-[#5a5a5a]">
                  <li>Customer: "Hi" → AI greets + lists top 3 via <span className="font-mono">searchProducts</span></li>
                  <li>"I want Elixir Glow Serum x1 deliver to 12 Allen Ikeja" → AI checks stock then asks confirmation via <span className="font-mono">calculateOrderTotal</span></li>
                  <li>"Yes" → AI calls <span className="font-mono">createOrder</span> and order appears in Orders</li>
                  <li>Try two customers with different phones — logs are isolated per sellerId.</li>
                </ol>
              </div>
            </div>
          )}

          {tab === "webhook" && (
            <div className="space-y-4">
              <div className="rounded-2xl bg-white border border-[#F3E6D3] p-6">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-bold flex items-center gap-2"><Webhook className="h-4 w-4 text-[#0B9C74]" /> Webhook verification</div>
                  <button onClick={copyWebhook} className="inline-flex items-center gap-2 rounded-full bg-white border border-[#F3E6D3] px-3 py-1.5 text-xs font-bold hover:bg-[#FFF1DA]">
                    <Copy className="h-3.5 w-3.5" /> {copied ? "Copied" : "Copy webhook URL"}
                  </button>
                </div>
                <div className="mt-3 rounded-xl bg-[#1a1a1a] text-white p-3 font-mono text-xs break-all">{config?.webhookUrl || `${window.location.origin}/api/whatsapp/webhook`}</div>
                <form onSubmit={handleVerify} className="mt-4 grid sm:grid-cols-3 gap-3">
                  <label><span className="text-xs font-bold">hub.mode</span><input value="subscribe" readOnly className="mt-1 w-full rounded-xl border border-[#F3E6D3] bg-[#FFFBF5] px-3 py-2 text-xs font-mono" /></label>
                  <label><span className="text-xs font-bold">hub.verify_token</span><input value={verifyToken} onChange={(e) => setVerifyToken(e.target.value)} placeholder={config?.verifyToken} className="mt-1 w-full rounded-xl border border-[#F3E6D3] px-3 py-2 text-xs font-mono focus:border-[#0B9C74] outline-none" /></label>
                  <label><span className="text-xs font-bold">hub.challenge</span><input value={challenge} onChange={(e) => setChallenge(e.target.value)} className="mt-1 w-full rounded-xl border border-[#F3E6D3] px-3 py-2 text-xs font-mono focus:border-[#0B9C74] outline-none" /></label>
                  <button type="submit" className="sm:col-span-3 rounded-full bg-[#0B9C74] px-6 py-2.5 text-sm font-bold text-white hover:bg-[#0a8a66]">Verify webhook</button>
                </form>
                {verifyResult && <div className="mt-3 rounded-xl bg-[#E6F7F1] border border-[#0B9C74]/20 px-3 py-2 text-sm font-mono">✓ Challenge returned: {verifyResult}</div>}
                {verifyError && <div className="mt-3 rounded-xl bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">{verifyError}</div>}
                {config?.webhookVerified && <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-[#1a1a1a] px-3 py-1 text-xs font-bold text-white"><Check className="h-3 w-3" /> Webhook verified for this seller</div>}
              </div>
            </div>
          )}

          {tab === "inbox" && (
            <div className="grid lg:grid-cols-[280px_1fr] gap-4">
              <div className="rounded-2xl bg-white border border-[#F3E6D3] p-3">
                <div className="flex items-center justify-between px-1">
                  <div className="text-sm font-bold flex items-center gap-2"><Inbox className="h-4 w-4 text-[#0B9C74]" /> Conversations</div>
                  <span className="text-xs bg-[#1a1a1a] text-white rounded-full px-2 py-0.5 font-bold">{conversations.length}</span>
                </div>
                <div className="mt-3 space-y-2 max-h-[420px] overflow-auto">
                  {conversations.length === 0 ? (
                    <div className="text-xs text-[#6b6b6b] p-3 text-center">No messages yet. Use Simulator.</div>
                  ) : (
                    conversations.map((c) => (
                      <button key={c.customerPhone} onClick={() => setSelectedCustomer(c.customerPhone)} className={`w-full text-left rounded-xl border p-3 flex gap-3 items-center ${selectedCustomer === c.customerPhone ? "bg-[#1a1a1a] text-white border-[#1a1a1a]" : "bg-[#FFFBF5] border-[#F3E6D3] hover:bg-[#FFF1DA]"}`}>
                        <span className="h-8 w-8 rounded-full bg-white border border-[#F3E6D3] grid place-items-center shrink-0 text-[#1a1a1a]"><User className="h-4 w-4" /></span>
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-bold truncate">{c.customerPhone}</div>
                          <div className={`text-xs truncate ${selectedCustomer === c.customerPhone ? "text-white/70" : "text-[#6b6b6b]"}`}>{c.lastMessage.body.slice(0, 44)}</div>
                        </div>
                        <span className="text-xs font-bold shrink-0">{c.count}</span>
                      </button>
                    ))
                  )}
                </div>
                <button onClick={handleClear} className="mt-3 w-full inline-flex justify-center items-center gap-2 rounded-full bg-white border border-[#F3E6D3] px-3 py-2 text-xs font-bold hover:bg-red-50 hover:border-red-200 hover:text-red-700"><Trash2 className="h-3.5 w-3.5" /> Clear logs</button>
              </div>

              <div className="rounded-2xl bg-white border border-[#F3E6D3] flex flex-col min-h-[420px]">
                <div className="px-4 py-3 border-b border-[#F3E6D3] flex items-center justify-between">
                  <div>
                    <div className="text-sm font-bold flex items-center gap-2"><MessageCircle className="h-4 w-4 text-[#0B9C74]" /> {selectedCustomer || "Select conversation"}</div>
                    <div className="text-xs text-[#6b6b6b]">Logging • sellerId isolated {aiEnabled ? "• AI tools" : "• deterministic"}</div>
                  </div>
                  <span className="text-xs rounded-full bg-[#E6F7F1] border border-[#0B9C74]/20 px-2 py-1 font-bold text-[#0B9C74]">{filteredMessages.length} messages</span>
                </div>
                <div className="flex-1 p-4 space-y-3 overflow-auto bg-[#FFFBF5]">
                  {filteredMessages.length === 0 ? (
                    <div className="text-center text-xs text-[#6b6b6b] py-10">No messages for this customer. Simulate to see {aiEnabled ? "AI" : "deterministic"} reply.</div>
                  ) : (
                    filteredMessages.map((m) => {
                      const toolCalls = m.direction === "outbound" ? getToolCalls(m.id) : null
                      return (
                        <div key={m.id} className="space-y-2">
                          <div className={`max-w-[78%] rounded-2xl p-3 text-sm leading-5 shadow-sm ${m.direction === "inbound" ? "bg-white border border-[#F3E6D3] ml-0" : "bg-[#1a1a1a] text-white ml-auto"}`}>
                            <div className="text-xs font-bold opacity-60 flex items-center gap-1">
                              {m.direction === "inbound" ? <User className="h-3 w-3" /> : aiEnabled && !m.deterministic ? <Bot className="h-3 w-3" /> : <Send className="h-3 w-3" />}
                              {m.direction === "inbound" ? "Customer" : aiEnabled && !m.deterministic ? "AI Agent" : "Cognicart"} • {new Date(m.timestamp).toLocaleTimeString()}
                              {m.deterministic && <span className="ml-1 rounded-full bg-[#E6F7F1] px-1.5 py-0.5 text-[10px] font-bold text-[#0B9C74]">deterministic</span>}
                              {aiEnabled && !m.deterministic && <span className="ml-1 rounded-full bg-[#0B9C74] px-1.5 py-0.5 text-[10px] font-bold text-white">AI</span>}
                            </div>
                            <div className="mt-1 whitespace-pre-wrap">{m.body}</div>
                            <div className="mt-1 flex items-center gap-2 text-[11px] opacity-60"><Clock className="h-3 w-3" /> {m.status} • {m.businessPhone} → {m.customerPhone}</div>
                          </div>
                          {toolCalls && (
                            <div className={`max-w-[78%] ml-auto rounded-xl border p-2 text-xs ${expandedTools[m.id] ? "bg-white border-[#F3E6D3]" : "bg-[#FFF1DA] border-[#F3E6D3]"}`}>
                              <button onClick={() => setExpandedTools({ ...expandedTools, [m.id]: !expandedTools[m.id] })} className="w-full flex items-center justify-between font-bold">
                                <span className="flex items-center gap-1"><Zap className="h-3 w-3 text-[#E85D26]" /> {toolCalls.length} tool call{toolCalls.length !== 1 ? "s" : ""}</span>
                                <span className="text-[#0B9C74]">{expandedTools[m.id] ? "hide" : "show"}</span>
                              </button>
                              {expandedTools[m.id] && (
                                <div className="mt-2 space-y-2">
                                  {(toolCalls as Array<{ name: string; arguments: unknown; result?: unknown }>)?.map((tc, idx) => (
                                    <div key={idx} className="rounded-lg bg-[#FFFBF5] border border-[#F3E6D3] p-2 font-mono text-[11px]">
                                      <div className="font-bold">{tc.name}({JSON.stringify(tc.arguments)})</div>
                                      <div className="mt-1 whitespace-pre-wrap break-all text-[#5a5a5a]">{JSON.stringify(tc.result || tc, null, 2).slice(0, 400)}</div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )
                    })
                  )}
                </div>
              </div>
            </div>
          )}

          {tab === "simulator" && (
            <div className="grid lg:grid-cols-[1fr_1fr] gap-4">
              <form onSubmit={handleSimulate} className="rounded-2xl bg-white border border-[#F3E6D3] p-6 space-y-4">
                <div className="text-sm font-bold flex items-center gap-2"><Play className="h-4 w-4 text-[#E85D26]" /> Simulate incoming WhatsApp</div>
                <p className="text-xs text-[#6b6b6b] leading-5">Customer sends to <span className="font-mono font-bold">{config?.businessPhone}</span> → seller identification → {aiEnabled ? "AI tools" : "deterministic"} → outbound.</p>
                <label><span className="text-xs font-bold">Business phone (to)</span><input value={simBusinessPhone} onChange={(e) => setSimBusinessPhone(e.target.value)} placeholder={config?.businessPhone || ""} className="mt-1 w-full rounded-xl border border-[#F3E6D3] px-3 py-2.5 text-sm font-mono focus:border-[#0B9C74] outline-none" /></label>
                <label><span className="text-xs font-bold">Customer phone (from)</span><input value={simFrom} onChange={(e) => setSimFrom(e.target.value)} className="mt-1 w-full rounded-xl border border-[#F3E6D3] px-3 py-2.5 text-sm focus:border-[#0B9C74] outline-none" /></label>
                <label><span className="text-xs font-bold">Message body</span><textarea value={simBody} onChange={(e) => setSimBody(e.target.value)} rows={3} className="mt-1 w-full rounded-xl border border-[#F3E6D3] px-3 py-2.5 text-sm focus:border-[#0B9C74] outline-none resize-none" /></label>
                <div className="flex flex-wrap gap-2 text-xs">
                  {["Hi", "show me serums", "price of Cozy Knit Hoodie", "I want Elixir Glow Serum x1 deliver to 12 Allen Ikeja", "Yes"].map((ex) => (
                    <button key={ex} type="button" onClick={() => setSimBody(ex)} className="rounded-full bg-[#FFF1DA] border border-[#F3E6D3] px-3 py-1 font-bold hover:bg-white">{ex}</button>
                  ))}
                </div>
                <button type="submit" disabled={simLoading} className="w-full rounded-full bg-[#0B9C74] px-6 py-3 text-sm font-bold text-white hover:bg-[#0a8a66] disabled:opacity-60 flex items-center justify-center gap-2">
                  <Send className="h-4 w-4" /> {simLoading ? "Sending..." : `Send as customer ${aiEnabled ? "(AI)" : ""}`}
                </button>
              </form>

              <div className="rounded-2xl bg-[#1a1a1a] text-white p-6">
                <div className="text-sm font-bold flex items-center gap-2"><Bot className="h-4 w-4 text-[#0B9C74]" /> {aiEnabled ? "AI flow" : "Deterministic flow"}</div>
                <ol className="mt-3 space-y-2 text-sm leading-6 text-white/80 list-decimal pl-5">
                  <li>WhatsApp Cloud API → <span className="font-mono">POST /api/whatsapp/webhook</span></li>
                  <li>identifySeller(businessPhone)</li>
                  <li>Log inbound sellerId scoped</li>
                  <li>{aiEnabled ? "AI decides tools → searchProducts/checkStock/getBusinessInfo/createOrder" : "Deterministic → searchProducts/checkStock/getBusinessInfo"}</li>
                  <li>Log outbound + send via Cloud API</li>
                </ol>
                <a href="https://wa.me/2348000000000" target="_blank" rel="noreferrer" className="mt-4 inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-bold text-[#1a1a1a] hover:bg-[#FFF1DA]">
                  Open WhatsApp <ExternalLink className="h-4 w-4" />
                </a>
                <div className="mt-4 rounded-xl bg-white/10 p-3 text-xs leading-5 text-white/70">
                  {aiEnabled ? "Try full order: \"Hi\" → \"I want Elixir x1 deliver to Yaba\" → \"Yes\" to create order. Check Orders page." : "Toggle AI ON top to try natural order creation."}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="rounded-2xl bg-[#FFF1DA] border border-[#F3E6D3] p-4">
        <div className="text-sm font-bold">Phase 5 + 6 success</div>
        <p className="text-xs leading-5 text-[#5a5a5a] mt-1">Customer can send WhatsApp → platform replies via deterministic or AI. With AI ON, a natural conversation creates an order via <span className="font-mono">createOrder</span> tool.</p>
      </div>
    </div>
  )
}
