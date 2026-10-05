import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { Megaphone, Plus, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { useConfirm } from "../../context/ConfirmContext"
import { broadcastService } from "../../services/broadcastService"
import type { Broadcast, BroadcastStatus } from "../../types/broadcast"

const STATUS_STYLES: Record<BroadcastStatus, string> = {
  draft: "bg-[#FFF1DA] text-[#6b6b6b] border-[#F3E6D3]",
  sending: "bg-[#E7F4FB] text-[#1c82b3] border-[#229ED9]/25",
  completed: "bg-[#E8F6F1] text-[#0B9C74] border-[#0B9C74]/25",
  failed: "bg-red-50 text-red-700 border-red-200",
}

export default function AdminBroadcasts() {
  const [rows, setRows] = useState<Broadcast[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const confirm = useConfirm()

  const load = async () => {
    try {
      setRows(await broadcastService.list())
      setError("")
    } catch {
      setError("Could not load broadcasts.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const remove = async (id: string) => {
    const confirmed = await confirm({
      title: "Delete this broadcast?",
      description: "Its delivery history goes with it. This cannot be undone.",
      confirmLabel: "Delete broadcast",
    })
    if (!confirmed) return
    await broadcastService.remove(id)
    toast.success("Broadcast deleted")
    load()
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight">Seller broadcasts</h1>
          <p className="text-sm text-[#6b6b6b]">
            Platform announcements, reminders and updates sent by email to sellers. Sellers who opted out of
            announcements are always skipped; account and order emails are never affected.
          </p>
        </div>
        <Link to="/admin/broadcasts/new" className="inline-flex items-center gap-2 rounded-full bg-[#0B9C74] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#0a8a66]">
          <Plus className="h-4 w-4" /> New broadcast
        </Link>
      </div>

      {error && <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}

      {loading ? (
        <div className="rounded-2xl bg-white border border-[#F3E6D3] p-8 text-sm text-[#6b6b6b]">Loading…</div>
      ) : rows.length === 0 ? (
        <div className="rounded-2xl bg-white border border-[#F3E6D3] p-8 text-center">
          <Megaphone className="mx-auto h-8 w-8 text-[#9a9a9a]" />
          <div className="mt-2 text-sm font-bold">No broadcasts yet</div>
          <p className="text-sm text-[#6b6b6b]">Draft one, preview the audience, then send.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {rows.map((row) => (
            <div key={row.id} className="rounded-2xl bg-white border border-[#F3E6D3] p-4 lg:grid lg:grid-cols-[1fr_120px_160px_120px] lg:items-center gap-4">
              <div className="min-w-0">
                <Link to={`/admin/broadcasts/${row.id}`} className="text-sm font-bold hover:underline truncate block">{row.subject}</Link>
                <div className="text-xs text-[#6b6b6b] truncate">{row.body.slice(0, 110)}</div>
                <div className="text-xs text-[#9a9a9a]">
                  {new Date(row.createdAt).toLocaleString()} • {row.createdByEmail || "admin"}
                </div>
              </div>
              <div>
                <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-bold uppercase ${STATUS_STYLES[row.status]}`}>{row.status}</span>
              </div>
              <div className="text-xs text-[#6b6b6b]">
                {row.stats.total > 0
                  ? <>{row.stats.sent}/{row.stats.total} sent{row.stats.failed > 0 && <span className="text-red-600 font-bold"> • {row.stats.failed} failed</span>}</>
                  : "Not sent"}
              </div>
              <div className="flex justify-end gap-2">
                <Link to={`/admin/broadcasts/${row.id}`} className="rounded-full border border-[#F3E6D3] px-3 py-1.5 text-xs font-bold hover:bg-[#FFF1DA]">Open</Link>
                {row.status !== "sending" && (
                  <button onClick={() => remove(row.id)} className="rounded-full border border-red-200 px-3 py-1.5 text-xs font-bold text-red-700 hover:bg-red-50" aria-label="Delete broadcast">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
