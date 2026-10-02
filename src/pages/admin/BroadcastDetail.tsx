import { useCallback, useEffect, useState } from "react"
import { Link, useParams } from "react-router-dom"
import { ArrowLeft, RefreshCw, Send } from "lucide-react"
import { broadcastService } from "../../services/broadcastService"
import type { Broadcast } from "../../types/broadcast"

const ROW_STYLES: Record<string, string> = {
  sent: "text-[#0B9C74]",
  failed: "text-red-700",
  pending: "text-[#9a9a9a]",
  skipped: "text-[#9a9a9a]",
}

export default function AdminBroadcastDetail() {
  const { id = "" } = useParams()
  const [broadcast, setBroadcast] = useState<Broadcast | null>(null)
  const [error, setError] = useState("")
  const [busy, setBusy] = useState(false)
  const [filter, setFilter] = useState<"all" | "sent" | "failed" | "pending">("all")

  const load = useCallback(async () => {
    try {
      setBroadcast(await broadcastService.getById(id))
    } catch {
      setError("Could not load this broadcast.")
    }
  }, [id])

  useEffect(() => { load() }, [load])

  // Delivery runs in the background, so poll while it is in flight.
  useEffect(() => {
    if (broadcast?.status !== "sending") return
    const timer = setInterval(load, 4000)
    return () => clearInterval(timer)
  }, [broadcast?.status, load])

  const act = async (action: "send" | "retry") => {
    setBusy(true); setError("")
    try {
      if (action === "send") {
        if (!confirm("Send this broadcast now? It cannot be recalled.")) return
        await broadcastService.send(id)
      } else {
        await broadcastService.retryFailed(id)
      }
      await load()
    } catch (err) {
      const message = (err as { response?: { data?: { message?: string } } }).response?.data?.message
      setError(message || "Action failed.")
    } finally {
      setBusy(false)
    }
  }

  if (error && !broadcast) return <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>
  if (!broadcast) return <div className="rounded-2xl bg-white border border-[#F3E6D3] p-8 text-sm text-[#6b6b6b]">Loading…</div>

  const recipients = broadcast.recipients || []
  const visible = filter === "all" ? recipients : recipients.filter((r) => r.status === filter)

  return (
    <div className="space-y-5">
      <Link to="/admin/broadcasts" className="inline-flex items-center gap-2 text-sm font-bold text-[#6b6b6b] hover:text-[#1a1a1a]">
        <ArrowLeft className="h-4 w-4" /> Back to broadcasts
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="font-display text-2xl font-bold tracking-tight">{broadcast.subject}</h1>
          <p className="text-sm text-[#6b6b6b]">
            {broadcast.status.toUpperCase()} • created {new Date(broadcast.createdAt).toLocaleString()} by {broadcast.createdByEmail || "admin"}
          </p>
        </div>
        <div className="flex gap-2">
          {broadcast.status === "draft" && (
            <button disabled={busy} onClick={() => act("send")} className="inline-flex items-center gap-2 rounded-full bg-[#0B9C74] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#0a8a66] disabled:opacity-50">
              <Send className="h-4 w-4" /> Send now
            </button>
          )}
          {broadcast.stats.failed > 0 && broadcast.status !== "sending" && (
            <button disabled={busy} onClick={() => act("retry")} className="inline-flex items-center gap-2 rounded-full border border-[#F3E6D3] px-4 py-2.5 text-sm font-bold hover:bg-[#FFF1DA] disabled:opacity-50">
              <RefreshCw className="h-4 w-4" /> Retry {broadcast.stats.failed} failed
            </button>
          )}
        </div>
      </div>

      {error && <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}

      <div className="grid gap-3 sm:grid-cols-4">
        {([["Recipients", broadcast.stats.total], ["Sent", broadcast.stats.sent], ["Failed", broadcast.stats.failed], ["Skipped", broadcast.stats.skipped]] as const).map(([label, value]) => (
          <div key={label} className="rounded-2xl bg-white border border-[#F3E6D3] p-4">
            <div className="text-xs font-bold tracking-widest text-[#9a9a9a]">{label.toUpperCase()}</div>
            <div className="text-2xl font-bold">{value}</div>
          </div>
        ))}
      </div>

      <section className="rounded-2xl bg-white border border-[#F3E6D3] p-5">
        <h2 className="text-sm font-bold">Message</h2>
        <div className="mt-2 whitespace-pre-wrap text-sm text-[#3a3a3a]">{broadcast.body}</div>
        {broadcast.ctaUrl && <div className="mt-3 text-xs text-[#6b6b6b]">Button: <span className="font-bold">{broadcast.ctaLabel}</span> → {broadcast.ctaUrl}</div>}
        <div className="mt-3 text-xs text-[#9a9a9a]">
          Audience: {broadcast.segments.length ? broadcast.segments.join(", ") : "typed addresses only"}
          {broadcast.includeEmails?.length ? ` • +${broadcast.includeEmails.length} typed` : ""}
          {broadcast.excludeEmails?.length ? ` • -${broadcast.excludeEmails.length} excluded` : ""}
        </div>
      </section>

      <section className="rounded-2xl bg-white border border-[#F3E6D3] p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-sm font-bold">Delivery</h2>
          <div className="flex gap-2">
            {(["all", "sent", "failed", "pending"] as const).map((key) => (
              <button key={key} onClick={() => setFilter(key)} className={`rounded-full border px-3 py-1.5 text-xs font-bold ${filter === key ? "bg-[#1a1a1a] text-white border-[#1a1a1a]" : "border-[#F3E6D3] hover:bg-[#FFF1DA]"}`}>
                {key}
              </button>
            ))}
          </div>
        </div>

        {recipients.length === 0 ? (
          <p className="mt-3 text-sm text-[#6b6b6b]">No recipients yet — the audience is resolved when the broadcast is sent.</p>
        ) : (
          <div className="mt-3 max-h-[460px] overflow-auto">
            <table className="w-full text-left text-sm">
              <thead className="sticky top-0 bg-white text-xs font-bold tracking-widest text-[#9a9a9a]">
                <tr><th className="py-2">EMAIL</th><th>SELLER</th><th>STATUS</th><th>DETAIL</th></tr>
              </thead>
              <tbody>
                {visible.map((recipient) => (
                  <tr key={recipient.email} className="border-t border-[#F3E6D3]">
                    <td className="py-2 pr-3">{recipient.email}{recipient.adHoc && <span className="ml-2 rounded-full bg-[#FFF1DA] px-2 py-0.5 text-xs">typed</span>}</td>
                    <td className="pr-3 text-[#6b6b6b]">{recipient.businessName || "—"}</td>
                    <td className={`pr-3 font-bold ${ROW_STYLES[recipient.status] || ""}`}>{recipient.status}</td>
                    <td className="text-xs text-[#9a9a9a]">{recipient.error || (recipient.sentAt ? new Date(recipient.sentAt).toLocaleTimeString() : "—")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}
