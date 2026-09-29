import { Globe, PencilLine, Send } from "lucide-react"
import type { ManualChannel, OrderSource } from "../../types/order"
import { MANUAL_CHANNEL_LABELS } from "../../types/order"

/**
 * Makes an order's origin unmistakable everywhere it is rendered:
 *  - Storefront — automatic web checkout
 *  - Telegram — automatic bot checkout
 *  - Manual — seller-entered, always with the original sales channel
 */
export function OrderSourceBadge({
  source,
  sourceChannel,
  className = "",
}: {
  source: OrderSource
  sourceChannel?: ManualChannel | ""
  className?: string
}) {
  if (source === "telegram") {
    return (
      <span
        data-testid="order-source-badge"
        className={`inline-flex items-center gap-1 rounded-full border border-[#229ED9]/25 bg-[#E7F4FB] px-2.5 py-1 text-xs font-bold text-[#1c82b3] ${className}`}
      >
        <Send className="h-3 w-3" /> Telegram
      </span>
    )
  }

  if (source === "manual") {
    const channelLabel = sourceChannel ? MANUAL_CHANNEL_LABELS[sourceChannel] ?? sourceChannel : ""
    return (
      <span
        data-testid="order-source-badge"
        className={`inline-flex items-center gap-1 rounded-full border border-[#E85D26]/25 bg-[#FFF1DA] px-2.5 py-1 text-xs font-bold text-[#E85D26] ${className}`}
      >
        <PencilLine className="h-3 w-3" /> Manual{channelLabel ? ` · ${channelLabel}` : ""}
      </span>
    )
  }

  return (
    <span
      data-testid="order-source-badge"
      className={`inline-flex items-center gap-1 rounded-full border border-[#0B9C74]/25 bg-[#E6F7F1] px-2.5 py-1 text-xs font-bold text-[#0B9C74] ${className}`}
    >
      <Globe className="h-3 w-3" /> Storefront
    </span>
  )
}
