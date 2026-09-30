import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { Bot, ExternalLink, Inbox, Megaphone, RefreshCw, Send, Shield, Unplug } from "lucide-react"
import { telegramService } from "../../services/telegramService"
import { useBusiness } from "../../context/BusinessContext"
import type { ChannelConversation, ChannelMessage, TelegramConfig } from "../../types/telegram"

export default function TelegramPage() {
  const { refresh: refreshBusiness } = useBusiness()
  const [config, setConfig] = useState<TelegramConfig | null>(null)
  const [conversations, setConversations] = useState<ChannelConversation[]>([])
  const [selectedMessages, setSelectedMessages] = useState<ChannelMessage[]>([])
  const [messagesLoading, setMessagesLoading] = useState(false)
  const [selectedUser, setSelectedUser] = useState("")
  const [botToken, setBotToken] = useState("")
  const [loading, setLoading] = useState(true)
  const [connecting, setConnecting] = useState(false)
  const [disconnecting, setDisconnecting] = useState(false)
  const [confirmDisconnect, setConfirmDisconnect] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isConnected = Boolean(config?.connected)

  const refresh = async () => {
    setError(null)
    try {
      const nextConfig = await telegramService.getConfig()
      setConfig(nextConfig)
      if (nextConfig.connected) {
        const nextConversations = await telegramService.getConversations()
        setConversations(nextConversations)
        setSelectedUser((current) => current || nextConversations[0]?.channelUserId || "")
      } else {
        setConversations([])
        setSelectedMessages([])
      }
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to load Telegram data.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { void refresh() }, [])

  // Load the transcript for one conversation at a time — the full history of
  // that buyer, without pulling every message of every conversation at once.
  useEffect(() => {
    if (!selectedUser) {
      setSelectedMessages([])
      return
    }
    let cancelled = false
    setMessagesLoading(true)
    telegramService
      .listMessages({ channelUserId: selectedUser })
      .then((next) => { if (!cancelled) setSelectedMessages(next) })
      .catch(() => { if (!cancelled) setSelectedMessages([]) })
      .finally(() => { if (!cancelled) setMessagesLoading(false) })
    return () => { cancelled = true }
  }, [selectedUser])

  const handleConnect = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!botToken.trim()) return
    setConnecting(true)
    setError(null)
    try {
      const next = await telegramService.connect({ botToken: botToken.trim() })
      // The token is never kept: it lives in this controlled input only until
      // the backend accepts it, and the backend registers the webhook itself.
      setBotToken("")
      setConfig(next)
      await Promise.all([refresh(), refreshBusiness()])
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to connect the Telegram bot.")
    } finally {
      setConnecting(false)
    }
  }

  const handleDisconnect = async () => {
    setDisconnecting(true)
    setError(null)
    try {
      await telegramService.disconnect()
      setConfirmDisconnect(false)
      setSelectedUser("")
      await Promise.all([refresh(), refreshBusiness()])
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to disconnect the Telegram bot.")
    } finally {
      setDisconnecting(false)
    }
  }

  if (loading) return <div className="grid place-items-center py-16"><div className="h-8 w-8 animate-spin rounded-full border-2 border-[#0B9C74] border-t-transparent" /></div>

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight">Telegram bot</h1>
          <p className="text-sm text-[#6b6b6b]">Connect your Telegram bot so customers can browse, ask questions, and order in chat. Telegram orders land in your unified order dashboard automatically.</p>
        </div>
        <button onClick={() => void refresh()} className="inline-flex items-center gap-2 rounded-full border border-[#F3E6D3] bg-white px-4 py-2 text-sm font-bold hover:bg-[#FFF1DA]"><RefreshCw className="h-4 w-4" />Refresh</button>
      </div>

      {error && <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">{error}</div>}

      <div className={`rounded-2xl border p-6 ${isConnected ? "border-[#229ED9]/25 bg-[#E7F4FB]" : "border-[#F3E6D3] bg-white"}`}>
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div className="flex min-w-0 gap-3">
            <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${isConnected ? "bg-[#229ED9] text-white" : "bg-[#FFF1DA] text-[#E85D26]"}`}><Send className="h-5 w-5" /></span>
            <div>
              <div className="break-all font-bold">{isConnected ? `Connected — @${config?.botUsername || config?.botId}` : "No Telegram bot connected"}</div>
              <p className="mt-1 text-sm text-[#6b6b6b]">
                {isConnected
                  ? `Mode: ${config?.mode === "webhook" ? "webhook (verified by the backend)" : config?.mode}. Connected ${config?.connectedAt ? new Date(config.connectedAt).toLocaleString() : ""}`
                  : "Create a bot with @BotFather in Telegram, then paste its token below. The backend validates the token and registers the webhook — nothing is stored in your browser."}
              </p>
              {isConnected && (
                <div className="mt-2 flex flex-wrap items-center gap-2 text-xs font-bold">
                  <span className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-[#1c82b3]"><Shield className="h-3.5 w-3.5" />{config?.webhookVerified ? "Webhook registered by backend" : "Polling mode (development)"}</span>
                  <span className="rounded-full bg-white px-2.5 py-1 text-[#6b6b6b]">Token: stored server-side only</span>
                </div>
              )}
            </div>
          </div>
          {isConnected && (
            <div className="flex flex-col gap-2 sm:items-end">
              {config?.botUrl && (
                <a href={config.botUrl} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center gap-2 rounded-full bg-[#229ED9] px-4 py-2 text-sm font-bold text-white hover:bg-[#1c82b3]"><ExternalLink className="h-4 w-4" />Open bot in Telegram</a>
              )}
              {!confirmDisconnect ? (
                <button onClick={() => setConfirmDisconnect(true)} className="inline-flex items-center justify-center gap-2 rounded-full border border-[#F3E6D3] bg-white px-4 py-2 text-sm font-bold hover:bg-red-50 hover:text-red-700"><Unplug className="h-4 w-4" />Disconnect</button>
              ) : (
                <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-2 text-xs">
                  <span className="font-bold text-red-700">Remove this bot?</span>
                  <button onClick={() => void handleDisconnect()} disabled={disconnecting} className="rounded-full bg-red-600 px-3 py-1.5 font-bold text-white disabled:opacity-60">{disconnecting ? "Removing…" : "Yes, disconnect"}</button>
                  <button onClick={() => setConfirmDisconnect(false)} className="rounded-full bg-white px-3 py-1.5 font-bold">Cancel</button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {!isConnected ? (
        <form onSubmit={handleConnect} className="max-w-xl rounded-2xl border border-[#F3E6D3] bg-white p-6">
          <h2 className="flex items-center gap-2 font-bold"><Bot className="h-4 w-4 text-[#229ED9]" />Connect your bot</h2>
          <ol className="mt-2 list-decimal space-y-1 pl-5 text-xs leading-5 text-[#6b6b6b]">
            <li>Open Telegram and message <span className="font-bold">@BotFather</span>.</li>
            <li>Send <code className="rounded bg-[#FFFBF5] px-1">/newbot</code> and follow the prompts.</li>
            <li>Paste the bot token below. It is sent once over HTTPS, validated with Telegram, and kept only on the server.</li>
          </ol>
          <input
            required
            type="password"
            autoComplete="off"
            value={botToken}
            onChange={(event) => setBotToken(event.target.value)}
            placeholder="123456789:AA…"
            className="mt-4 w-full rounded-xl border border-[#F3E6D3] px-3 py-2.5 text-sm outline-none focus:border-[#229ED9]"
          />
          <button disabled={connecting || !botToken.trim()} className="mt-4 rounded-full bg-[#229ED9] px-6 py-2.5 text-sm font-bold text-white disabled:opacity-60">{connecting ? "Connecting…" : "Connect bot"}</button>
          <p className="mt-3 text-xs leading-5 text-[#9a9a9a]">The webhook URL and secret are generated and managed by the backend. You never need to configure Telegram webhooks yourself.</p>
        </form>
      ) : (
        <>
          <div className="grid min-w-0 gap-4 lg:grid-cols-[0.75fr_1.25fr]">
            <section className="min-w-0 rounded-2xl border border-[#F3E6D3] bg-white p-4">
              <h2 className="mb-3 flex items-center gap-2 font-bold"><Inbox className="h-4 w-4 text-[#229ED9]" />Conversations</h2>
              <div className="max-h-[320px] space-y-2 overflow-y-auto pr-1 lg:max-h-[480px]">
                {conversations.map((conversation) => (
                  <button
                    key={conversation.channelUserId}
                    onClick={() => setSelectedUser(conversation.channelUserId)}
                    className={`w-full min-w-0 overflow-hidden rounded-xl border p-3 text-left ${selectedUser === conversation.channelUserId ? "border-[#1a1a1a] bg-[#1a1a1a] text-white" : "border-[#F3E6D3] hover:bg-[#FFFBF5]"}`}
                  >
                    <div className="truncate text-sm font-bold">{conversation.customerName || (conversation.channelUsername ? `@${conversation.channelUsername}` : conversation.channelUserId)}</div>
                    <div className="mt-0.5 truncate text-xs opacity-70">{conversation.channelUsername ? `@${conversation.channelUsername} · ` : ""}{conversation.customerPhone || "no phone shared yet"}</div>
                    <div className="mt-1 truncate text-xs opacity-70">{conversation.lastMessage || "No messages"}</div>
                  </button>
                ))}
                {!conversations.length && <p className="py-6 text-center text-sm text-[#6b6b6b]">No conversations yet. Share your bot link so customers can start chatting.</p>}
              </div>
            </section>

            <section className="min-w-0 rounded-2xl border border-[#F3E6D3] bg-white p-4">
              <h2 className="font-bold">Message history</h2>
              <div className="mt-3 max-h-[420px] min-h-[240px] space-y-3 overflow-y-auto rounded-xl bg-[#FFFBF5] p-3 lg:max-h-[520px]">
                {selectedMessages.map((message) => (
                  <div key={message.id} className={`max-w-[85%] min-w-0 rounded-2xl p-3 text-sm ${message.direction === "outbound" ? "ml-auto bg-[#1a1a1a] text-white" : "border border-[#F3E6D3] bg-white"}`}>
                    <div className="text-xs font-bold opacity-60">
                      {message.direction === "outbound" ? (message.deterministic ? "Bot (automatic)" : "Bot (AI)") : message.customerName || "Customer"}
                      <span className="ml-2 font-normal">{new Date(message.timestamp).toLocaleString()}</span>
                    </div>
                    <div className="mt-1 whitespace-pre-wrap break-words [overflow-wrap:anywhere]">{message.body}</div>
                  </div>
                ))}
                {messagesLoading && <p className="py-12 text-center text-sm text-[#6b6b6b]">Loading transcript…</p>}
                {!messagesLoading && selectedUser && !selectedMessages.length && <p className="py-12 text-center text-sm text-[#6b6b6b]">No messages in this conversation.</p>}
                {!selectedUser && <p className="py-12 text-center text-sm text-[#6b6b6b]">Select a conversation to inspect its transcript.</p>}
              </div>
              <p className="mt-3 text-xs leading-5 text-[#9a9a9a]">Replies in this channel are handled by the commerce assistant inside Telegram. To reach these customers with promotions, use <Link to="/dashboard/campaigns" className="font-bold text-[#0B9C74] hover:underline">Telegram campaigns</Link>.</p>
            </section>
          </div>

          <div className="rounded-2xl bg-[#1a1a1a] p-5 text-white">
            <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
              <div>
                <h2 className="flex items-center gap-2 font-bold"><Megaphone className="h-4 w-4 text-[#229ED9]" />Telegram marketing</h2>
                <p className="mt-1 text-xs leading-5 text-white/70">Broadcast promotions to customers who started your bot and haven't opted out, and nudge unpaid Telegram orders.</p>
              </div>
              <Link to="/dashboard/campaigns" className="rounded-full bg-white px-4 py-2 text-sm font-bold text-[#1a1a1a] hover:bg-[#FFF1DA]">Open campaigns</Link>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
