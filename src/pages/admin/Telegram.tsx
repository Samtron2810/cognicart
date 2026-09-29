import { useEffect, useState } from "react"
import { Bot, Send } from "lucide-react"
import { adminService, type TelegramSellerStats } from "../../services/adminService"

export default function AdminTelegram() {
  const [stats, setStats] = useState<TelegramSellerStats[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    adminService.getTelegramStats()
      .then(setStats)
      .catch((reason) => setError(reason instanceof Error ? reason.message : "Unable to load Telegram analytics."))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight">Telegram analytics</h1>
        <p className="text-sm text-[#6b6b6b]">Per-seller bot usage: connection status, bot username, inbound/outbound volumes, and AI-generated replies. Isolation by sellerId.</p>
      </div>

      {error && <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">{error}</div>}

      {loading ? (
        <div className="grid place-items-center py-16"><div className="h-8 w-8 animate-spin rounded-full border-2 border-[#0B9C74] border-t-transparent" /></div>
      ) : (
        <div className="space-y-2">
          {stats.map((s) => (
            <div key={s.sellerId} className="rounded-2xl bg-white border border-[#F3E6D3] p-4 flex flex-wrap gap-3 justify-between items-center">
              <div>
                <div className="text-sm font-bold">{s.businessName} • {s.email}</div>
                <div className="text-xs text-[#6b6b6b] font-mono flex items-center gap-1"><Bot className="h-3.5 w-3.5" />{s.botUsername ? `@${s.botUsername}` : "No bot"}</div>
                <div className="text-xs text-[#6b6b6b]">Total {s.totalMessages} • In {s.inbound} • Out {s.outbound} • AI {s.aiMessages}</div>
              </div>
              <div className="text-right">
                <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold border ${s.telegramConnected ? "bg-[#E7F4FB] text-[#1c82b3] border-[#229ED9]/25" : "bg-[#FFF1DA] text-[#E85D26] border-[#F3E6D3]"}`}>
                  <Send className="h-3 w-3" />{s.telegramConnected ? "Connected" : "Not connected"}
                </span>
                <div className="text-xs text-[#9a9a9a] mt-1">Last activity {s.lastMessageAt ? new Date(s.lastMessageAt).toLocaleDateString() : "—"}</div>
              </div>
            </div>
          ))}
          {stats.length === 0 && <div className="text-sm text-[#6b6b6b] py-6 text-center">No sellers yet</div>}
        </div>
      )}
    </div>
  )
}
