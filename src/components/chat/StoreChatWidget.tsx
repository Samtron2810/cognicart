import { useEffect, useRef, useState } from "react"
import { MessageCircle, RotateCcw, Send, Store as StoreIcon, X } from "lucide-react"
import { storeChatService } from "../../services/storeChatService"
import type { ChatMessage, QuickReply } from "../../services/storeChatService"
import { getApiErrorMessage } from "../../services/apiError"

/**
 * Floating per-store chatbot.
 *
 * Mounted only on a store page and addressed only by that store's
 * identifier, so it can never be pointed at another seller's catalog. The
 * title, the transcript and the quick-reply menu all come from the backend,
 * which resolves the tenant from the URL rather than trusting this client.
 *
 * When no OpenAI key is configured the backend falls back to the
 * deterministic agent, whose menu arrives as `quickReplies` — so the widget
 * is a working button-driven shop either way, with no separate code path
 * here.
 */
export function StoreChatWidget({
  identifier,
  storeName,
}: {
  identifier: string
  storeName: string
}) {
  const [open, setOpen] = useState(false)
  const [booted, setBooted] = useState(false)
  const [title, setTitle] = useState(`Chat with ${storeName} Bot`)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [quickReplies, setQuickReplies] = useState<QuickReply[]>([])
  const [draft, setDraft] = useState("")
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [persisted, setPersisted] = useState(true)
  const scrollRef = useRef<HTMLDivElement>(null)

  // Load the transcript the first time it is opened, not on page load: the
  // store page should not pay for a chat the buyer never starts.
  useEffect(() => {
    if (!open || booted) return
    setBooted(true)
    storeChatService
      .open(identifier)
      .then((payload) => {
        setTitle(payload.title)
        setMessages(payload.messages)
        setQuickReplies(payload.quickReplies)
        setPersisted(payload.persisted)
      })
      .catch((reason) => setError(getApiErrorMessage(reason, "Could not start the chat.")))
  }, [open, booted, identifier])

  useEffect(() => {
    if (!open) return
    const element = scrollRef.current
    if (!element) return
    // Guarded: an auto-scroll convenience must never be able to take the
    // chat down. Not every environment implements Element.scrollTo, and
    // throwing here would unmount the widget mid-conversation.
    if (typeof element.scrollTo === "function") {
      element.scrollTo({ top: element.scrollHeight, behavior: "smooth" })
    } else {
      element.scrollTop = element.scrollHeight
    }
  }, [messages, open, sending])

  const send = async (text: string) => {
    const body = text.trim()
    if (!body || sending) return

    setError(null)
    setDraft("")
    // Optimistic: the buyer's own words appear immediately.
    setMessages((current) => [...current, { role: "user", content: body }])
    setQuickReplies([])
    setSending(true)

    try {
      const result = await storeChatService.send(identifier, body)
      setMessages((current) => [
        ...current,
        { role: "assistant", content: result.reply, quickReplies: result.quickReplies },
      ])
      setQuickReplies(result.quickReplies)
    } catch (reason) {
      setError(getApiErrorMessage(reason, "The bot could not reply. Please try again."))
      // Roll the optimistic line back so the buyer can retype rather than
      // staring at a message that was never delivered.
      setMessages((current) => current.slice(0, -1))
      setDraft(body)
    } finally {
      setSending(false)
    }
  }

  const reset = async () => {
    try {
      await storeChatService.clear(identifier)
    } catch {
      // Clearing is best effort; the local reset below is what the buyer sees.
    }
    setMessages([])
    setBooted(false)
    setError(null)
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={`Chat with ${storeName}`}
        className="fixed bottom-5 right-5 z-40 inline-flex items-center gap-2 rounded-full bg-[#0B9C74] px-5 py-3.5 text-sm font-bold text-white shadow-[0_10px_30px_rgba(11,156,116,0.35)] transition hover:bg-[#0a8a66]"
      >
        <MessageCircle className="h-4 w-4" />
        Chat with Bot
      </button>
    )
  }

  return (
    <div
      role="dialog"
      aria-label={title}
      className="fixed bottom-5 right-5 z-40 flex h-[min(560px,calc(100vh-2.5rem))] w-[min(380px,calc(100vw-2.5rem))] flex-col overflow-hidden rounded-2xl border border-[#F3E6D3] bg-white shadow-[0_24px_60px_rgba(0,0,0,0.18)]"
    >
      <header className="flex items-center gap-2.5 border-b border-[#F3E6D3] bg-[#0B9C74] px-4 py-3 text-white">
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-white/15">
          <StoreIcon className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold">{title}</p>
          <p className="text-[11px] text-white/75">Only this store's products</p>
        </div>
        <button
          type="button"
          onClick={reset}
          aria-label="Start a new conversation"
          className="grid h-7 w-7 place-items-center rounded-full hover:bg-white/15"
        >
          <RotateCcw className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          aria-label="Close chat"
          className="grid h-7 w-7 place-items-center rounded-full hover:bg-white/15"
        >
          <X className="h-4 w-4" />
        </button>
      </header>

      <div ref={scrollRef} className="flex-1 space-y-2.5 overflow-y-auto bg-[#FFFBF5] px-3.5 py-3">
        {messages.length === 0 && (
          <div className="rounded-2xl rounded-tl-sm border border-[#F3E6D3] bg-white px-3.5 py-2.5 text-sm leading-6">
            Hi! I can help you find anything from {storeName} and place an order
            right here. What are you looking for?
          </div>
        )}

        {messages.map((message, index) => (
          <div
            key={index}
            className={
              message.role === "user"
                ? "ml-auto max-w-[85%] rounded-2xl rounded-br-sm bg-[#0B9C74] px-3.5 py-2.5 text-sm leading-6 text-white"
                : "max-w-[90%] whitespace-pre-wrap rounded-2xl rounded-tl-sm border border-[#F3E6D3] bg-white px-3.5 py-2.5 text-sm leading-6"
            }
          >
            {message.content}
          </div>
        ))}

        {sending && (
          <div className="flex w-16 items-center justify-center gap-1 rounded-2xl rounded-tl-sm border border-[#F3E6D3] bg-white px-3.5 py-3">
            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#9a9a9a] [animation-delay:-0.3s]" />
            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#9a9a9a] [animation-delay:-0.15s]" />
            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#9a9a9a]" />
          </div>
        )}

        {error && (
          <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
            {error}
          </p>
        )}

        {!persisted && messages.length > 0 && (
          <p className="text-center text-[11px] text-[#9a9a9a]">
            This conversation will not be saved — your browser blocked cookies.
          </p>
        )}
      </div>

      {quickReplies.length > 0 && !sending && (
        <div className="flex flex-wrap gap-1.5 border-t border-[#F3E6D3] bg-white px-3.5 py-2.5">
          {quickReplies.map((reply) => (
            <button
              key={reply.value}
              type="button"
              onClick={() => void send(reply.value)}
              className="rounded-full border border-[#0B9C74]/30 bg-[#E6F7F1] px-3 py-1.5 text-xs font-bold text-[#0a7d5d] hover:bg-[#d4f0e6]"
            >
              {reply.label}
            </button>
          ))}
        </div>
      )}

      <form
        onSubmit={(event) => {
          event.preventDefault()
          void send(draft)
        }}
        className="flex items-center gap-2 border-t border-[#F3E6D3] bg-white px-3 py-2.5"
      >
        <label className="sr-only" htmlFor="store-chat-input">
          Message {storeName}
        </label>
        <input
          id="store-chat-input"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="Ask about a product…"
          autoComplete="off"
          className="flex-1 rounded-full border border-[#F3E6D3] px-3.5 py-2 text-sm outline-none focus:border-[#0B9C74]"
        />
        <button
          type="submit"
          disabled={sending || !draft.trim()}
          aria-label="Send message"
          className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#0B9C74] text-white hover:bg-[#0a8a66] disabled:opacity-40"
        >
          <Send className="h-4 w-4" />
        </button>
      </form>
    </div>
  )
}
