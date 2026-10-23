import { useEffect, useRef, useState } from "react"
import { Link, useLocation } from "react-router-dom"
import { Check, MessageCircle, Plus, RotateCcw, Send, Sparkles, Store as StoreIcon, X } from "lucide-react"
import { marketplaceChatService } from "../../services/marketplaceChatService"
import type { ChatMessage, ChatProduct, QuickReply } from "../../services/marketplaceChatService"
import { getApiErrorMessage } from "../../services/apiError"
import { useCart } from "../../context/CartContext"
import { productPath, storePath } from "../../types/store"

/**
 * The marketplace shopping assistant.
 *
 * One assistant for the whole site, mounted in the public layout so it is
 * reachable from every public page. It searches across every seller, which
 * is what makes it useful for discovery — a shopper no longer has to guess
 * which store stocks the thing they want before they can ask about it.
 *
 * Results come back as real product cards with a working Add button, so the
 * conversation feeds the normal multi-store cart rather than a separate
 * hidden one. Checkout is then the ordinary split-payment flow.
 */

/** Routes where a floating button would be in the way or out of place. */
const HIDDEN_ON = [
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/verify-email",
  "/cart",
  "/checkout",
  "/dashboard",
  "/admin",
]

function ChatProductCard({ product }: { product: ChatProduct }) {
  const { addItem } = useCart()
  const [added, setAdded] = useState(false)

  const href = productPath(product.storeSlug || product.sellerId, product.id)
  const soldOut = !product.hasVariants && product.stock !== null && product.stock < 1

  const handleAdd = () => {
    addItem({ productId: product.id, sellerId: product.sellerId })
    setAdded(true)
    window.setTimeout(() => setAdded(false), 1600)
  }

  return (
    <li className="flex gap-2.5 rounded-xl border border-[#F3E6D3] bg-white p-2">
      <Link to={href} className="grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-lg bg-[#FFFBF5]">
        {product.image ? (
          <img src={product.image} alt="" className="h-full w-full object-contain p-1" />
        ) : (
          <span className="text-[9px] text-[#9a9a9a]">No image</span>
        )}
      </Link>

      <div className="min-w-0 flex-1">
        <Link to={href} className="line-clamp-1 text-[12px] font-bold leading-tight hover:text-[#0B9C74]">
          {product.name}
        </Link>
        <div className="line-clamp-1 text-[10px] text-[#9a9a9a]">{product.storeName}</div>
        <div className="mt-0.5 text-[12px] font-bold text-[#E85D26]">₦{product.price.toLocaleString()}</div>
      </div>

      {product.hasVariants ? (
        <Link
          to={href}
          className="self-center rounded-full border border-[#F3E6D3] px-2.5 py-1.5 text-[10px] font-bold hover:bg-[#FFF1DA]"
        >
          Options
        </Link>
      ) : (
        <button
          type="button"
          onClick={handleAdd}
          disabled={soldOut}
          aria-label={`Add ${product.name} to cart`}
          className={`self-center inline-flex items-center gap-1 rounded-full px-2.5 py-1.5 text-[10px] font-bold text-white transition disabled:cursor-not-allowed disabled:bg-[#c9c9c9] ${
            added ? "bg-[#0a8a66]" : "bg-[#0B9C74] hover:bg-[#0a8a66]"
          }`}
        >
          {soldOut ? "Sold out" : added ? <><Check className="h-3 w-3" />Added</> : <><Plus className="h-3 w-3" />Add</>}
        </button>
      )}
    </li>
  )
}

export function MarketplaceChatWidget() {
  const location = useLocation()
  const [open, setOpen] = useState(false)
  const [booted, setBooted] = useState(false)
  const [title, setTitle] = useState("Chatstand Assistant")
  const [subtitle, setSubtitle] = useState("Shopping across every store")
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [quickReplies, setQuickReplies] = useState<QuickReply[]>([])
  const [draft, setDraft] = useState("")
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  // The assistant knows which store you are looking at so it can offer to
  // narrow results — it never restricts them on its own.
  const storeMatch = location.pathname.match(/^\/store\/([^/]+)/)
  const storeContext = storeMatch ? storeMatch[1] : ""

  const hidden = HIDDEN_ON.some((path) => location.pathname === path || location.pathname.startsWith(`${path}/`))

  // Load the transcript on first open, not on page load: no page should pay
  // for a conversation the shopper never starts.
  useEffect(() => {
    if (!open || booted) return
    setBooted(true)
    marketplaceChatService
      .open()
      .then((payload) => {
        setTitle(payload.title)
        setSubtitle(payload.subtitle)
        setMessages(payload.messages)
        setQuickReplies(payload.quickReplies)
      })
      .catch((reason) => setError(getApiErrorMessage(reason, "Could not start the chat.")))
  }, [open, booted])

  useEffect(() => {
    if (!open) return
    const element = scrollRef.current
    if (!element) return
    // Guarded: an auto-scroll convenience must never take the chat down.
    // Not every environment implements Element.scrollTo.
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
    setMessages((current) => [...current, { role: "user", content: body }])
    setQuickReplies([])
    setSending(true)

    try {
      const result = await marketplaceChatService.send(body, storeContext)
      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          content: result.reply,
          quickReplies: result.quickReplies,
          products: result.products,
          stores: result.stores,
        },
      ])
      setQuickReplies(result.quickReplies)
    } catch (reason) {
      setError(getApiErrorMessage(reason, "The assistant could not reply. Please try again."))
      // Roll the optimistic line back so the shopper can retype rather than
      // staring at a message that was never delivered.
      setMessages((current) => current.slice(0, -1))
      setDraft(body)
    } finally {
      setSending(false)
    }
  }

  const reset = async () => {
    try {
      await marketplaceChatService.clear()
    } catch {
      // Best effort; the local reset below is what the shopper sees.
    }
    setMessages([])
    setBooted(false)
    setError(null)
  }

  if (hidden) return null

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open the Chatstand shopping assistant"
        className="fixed bottom-5 right-5 z-40 inline-flex items-center gap-2 rounded-full bg-[#0B9C74] px-5 py-3.5 text-sm font-bold text-white shadow-[0_10px_30px_rgba(11,156,116,0.35)] transition hover:bg-[#0a8a66]"
      >
        <MessageCircle className="h-4 w-4" />
        Ask Chatstand
      </button>
    )
  }

  return (
    <div
      role="dialog"
      aria-label={title}
      className="fixed bottom-5 right-5 z-40 flex h-[32rem] w-[min(23rem,calc(100vw-2.5rem))] flex-col overflow-hidden rounded-[20px] border border-[#F3E6D3] bg-white shadow-[0_20px_60px_rgba(0,0,0,0.18)]"
    >
      <header className="flex items-center gap-2 bg-[#1a1a1a] px-4 py-3 text-white">
        <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[#0B9C74]">
          <Sparkles className="h-3.5 w-3.5" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-bold">{title}</div>
          <div className="truncate text-[11px] text-white/60">{subtitle}</div>
        </div>
        <button type="button" onClick={reset} aria-label="Start over" className="rounded-full p-1.5 hover:bg-white/10">
          <RotateCcw className="h-4 w-4" />
        </button>
        <button type="button" onClick={() => setOpen(false)} aria-label="Close chat" className="rounded-full p-1.5 hover:bg-white/10">
          <X className="h-4 w-4" />
        </button>
      </header>

      <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto bg-[#FFFBF5] px-3 py-3">
        {messages.length === 0 && !error && (
          <p className="rounded-2xl bg-white px-3 py-2.5 text-[13px] leading-5 text-[#4a4a4a] shadow-sm">
            Hi! Ask me for anything on Chatstand — I search every store at once.
          </p>
        )}

        {messages.map((message, index) => (
          <div key={index}>
            <div
              className={
                message.role === "user"
                  ? "ml-auto w-fit max-w-[85%] rounded-2xl rounded-br-sm bg-[#0B9C74] px-3 py-2 text-[13px] leading-5 text-white"
                  : "w-fit max-w-[90%] rounded-2xl rounded-bl-sm bg-white px-3 py-2 text-[13px] leading-5 text-[#2b2b2b] shadow-sm"
              }
            >
              {message.content}
            </div>

            {message.products && message.products.length > 0 && (
              <ul className="mt-2 space-y-1.5">
                {message.products.map((product) => (
                  <ChatProductCard key={`${product.id}-${index}`} product={product} />
                ))}
              </ul>
            )}

            {message.stores && message.stores.length > 0 && (
              <ul className="mt-2 flex flex-wrap gap-1.5">
                {message.stores.map((store) => (
                  <li key={store.sellerId}>
                    <Link
                      to={storePath(store)}
                      className="inline-flex items-center gap-1.5 rounded-full border border-[#F3E6D3] bg-white px-2.5 py-1.5 text-[11px] font-bold hover:border-[#0B9C74]"
                    >
                      {store.logo ? (
                        <img src={store.logo} alt="" className="h-4 w-4 rounded-full object-cover" />
                      ) : (
                        <StoreIcon className="h-3 w-3 text-[#0B9C74]" />
                      )}
                      {store.name}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}

        {sending && (
          <div className="w-fit rounded-2xl rounded-bl-sm bg-white px-3 py-2 text-[13px] text-[#9a9a9a] shadow-sm">
            Searching…
          </div>
        )}

        {error && (
          <p role="alert" className="rounded-xl bg-red-50 px-3 py-2 text-[12px] font-medium text-red-700">
            {error}
          </p>
        )}
      </div>

      {quickReplies.length > 0 && (
        <div className="flex flex-wrap gap-1.5 border-t border-[#F3E6D3] bg-white px-3 py-2">
          {quickReplies.map((reply) => (
            <button
              key={reply.value}
              type="button"
              onClick={() => send(reply.label)}
              disabled={sending}
              className="rounded-full border border-[#F3E6D3] px-2.5 py-1.5 text-[11px] font-bold hover:bg-[#FFF1DA] disabled:opacity-50"
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
        <input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="Search every store…"
          aria-label="Message the assistant"
          className="min-w-0 flex-1 rounded-full border border-[#F3E6D3] px-3 py-2 text-[13px] outline-none focus:border-[#0B9C74]"
        />
        <button
          type="submit"
          disabled={sending || !draft.trim()}
          aria-label="Send"
          className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#0B9C74] text-white transition hover:bg-[#0a8a66] disabled:cursor-not-allowed disabled:bg-[#c9c9c9]"
        >
          <Send className="h-4 w-4" />
        </button>
      </form>
    </div>
  )
}
