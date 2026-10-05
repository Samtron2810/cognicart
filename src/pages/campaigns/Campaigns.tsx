import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { AlarmClock, Megaphone, Plus, RefreshCw, Send, Users } from "lucide-react"
import { useConfirm } from "../../context/ConfirmContext"
import { campaignService } from "../../services/campaignService"
import { CAMPAIGN_SEGMENTS, CAMPAIGN_SEGMENT_LABELS } from "../../types/campaign"
import type { Campaign, CampaignSegment, SegmentPreview } from "../../types/campaign"
import { getApiErrorMessage } from "../../services/apiError"

const statusStyle: Record<Campaign["status"], string> = {
  draft: "bg-[#FFF1DA] text-[#6b6b6b] border-[#F3E6D3]",
  scheduled: "bg-[#FFF1DA] text-[#E85D26] border-[#F3E6D3]",
  sending: "bg-[#E7F4FB] text-[#1c82b3] border-[#229ED9]/25",
  completed: "bg-[#E6F7F1] text-[#0B9C74] border-[#0B9C74]/20",
  failed: "bg-red-50 text-red-700 border-red-200",
}

export default function Campaigns() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  const [showCreate, setShowCreate] = useState(false)
  const [title, setTitle] = useState("")
  const [message, setMessage] = useState("")
  const [segment, setSegment] = useState<CampaignSegment>("ALL")
  const [preview, setPreview] = useState<SegmentPreview | null>(null)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [creating, setCreating] = useState(false)
  const [triggeringReminders, setTriggeringReminders] = useState(false)
  const confirm = useConfirm()

  const load = async () => {
    setError(null)
    try {
      setCampaigns(await campaignService.list())
    } catch (reason) {
      setError(getApiErrorMessage(reason, "Unable to load campaigns."))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { void load() }, [])

  useEffect(() => {
    if (!showCreate || segment === "CUSTOM") {
      setPreview(null)
      return
    }
    let active = true
    setPreviewLoading(true)
    campaignService
      .previewSegment(segment)
      .then((next) => { if (active) setPreview(next) })
      .catch(() => { if (active) setPreview(null) })
      .finally(() => { if (active) setPreviewLoading(false) })
    return () => { active = false }
  }, [segment, showCreate])

  const handleCreate = async (event: React.FormEvent) => {
    event.preventDefault()
    setCreating(true)
    setError(null)
    try {
      const campaign = await campaignService.create({ title: title.trim(), message: message.trim(), segment })
      setTitle("")
      setMessage("")
      setSegment("ALL")
      setShowCreate(false)
      setNotice(`Campaign "${campaign.title}" created with ${campaign.stats.totalRecipients} Telegram recipient${campaign.stats.totalRecipients === 1 ? "" : "s"}. Open it to review and send.`)
      await load()
    } catch (reason) {
      setError(getApiErrorMessage(reason, "Unable to create the campaign."))
    } finally {
      setCreating(false)
    }
  }

  const handleAbandonedReminders = async () => {
    const confirmed = await confirm({
      title: "Send Telegram reminders now?",
      description: "Every customer with an unpaid Telegram order gets a reminder message right away.",
      confirmLabel: "Send reminders",
    })
    if (!confirmed) return
    setTriggeringReminders(true)
    setError(null)
    try {
      const result = await campaignService.triggerAbandonedReminders()
      setNotice(`Sent ${result.remindersSentCount} abandoned-order reminder${result.remindersSentCount === 1 ? "" : "s"} on Telegram.`)
    } catch (reason) {
      setError(getApiErrorMessage(reason, "Unable to trigger reminders."))
    } finally {
      setTriggeringReminders(false)
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight">Telegram campaigns</h1>
          <p className="text-sm text-[#6b6b6b]">Broadcast promotions to customers who started your Telegram bot. Audiences automatically exclude customers without a Telegram identity and anyone who opted out of marketing.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => void load()} className="inline-flex items-center gap-2 rounded-full border border-[#F3E6D3] bg-white px-4 py-2 text-sm font-bold hover:bg-[#FFF1DA]"><RefreshCw className="h-4 w-4" />Refresh</button>
          <button onClick={() => setShowCreate((current) => !current)} className="inline-flex items-center gap-2 rounded-full bg-[#0B9C74] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#0a8a66]"><Plus className="h-4 w-4" />New campaign</button>
        </div>
      </div>

      {error && <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">{error}</div>}
      {notice && <div className="rounded-xl border border-[#0B9C74]/20 bg-[#E6F7F1] px-3 py-2.5 text-sm text-[#0B9C74]">{notice}</div>}

      {showCreate && (
        <form onSubmit={handleCreate} className="rounded-2xl border border-[#F3E6D3] bg-white p-5">
          <h2 className="flex items-center gap-2 font-bold"><Megaphone className="h-4 w-4 text-[#229ED9]" />Create campaign</h2>
          <div className="mt-4 grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="space-y-3">
              <input required maxLength={150} value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Campaign title (internal)" className="w-full rounded-xl border border-[#F3E6D3] px-3 py-2.5 text-sm outline-none focus:border-[#0B9C74]" />
              <textarea required maxLength={2000} rows={5} value={message} onChange={(event) => setMessage(event.target.value)} placeholder={"Message sent on Telegram. Personalise with {{name}} and {{store}}."} className="w-full resize-none rounded-xl border border-[#F3E6D3] px-3 py-2.5 text-sm outline-none focus:border-[#0B9C74]" />
              <label className="block text-xs font-bold text-[#6b6b6b]">
                Audience segment
                <select value={segment} onChange={(event) => setSegment(event.target.value as CampaignSegment)} className="mt-1 w-full rounded-xl border border-[#F3E6D3] bg-white px-3 py-2.5 text-sm font-normal outline-none focus:border-[#0B9C74]">
                  {CAMPAIGN_SEGMENTS.filter((value) => value !== "CUSTOM").map((value) => (
                    <option key={value} value={value}>{CAMPAIGN_SEGMENT_LABELS[value]}</option>
                  ))}
                </select>
              </label>
              <button disabled={creating || !title.trim() || !message.trim()} className="rounded-full bg-[#0B9C74] px-6 py-2.5 text-sm font-bold text-white disabled:opacity-60">{creating ? "Creating…" : "Create campaign"}</button>
              <p className="text-xs leading-5 text-[#9a9a9a]">Creating a campaign never sends anything. You review the audience and confirm the send from the campaign page.</p>
            </div>
            <div className="rounded-xl border border-[#F3E6D3] bg-[#FFFBF5] p-4">
              <div className="flex items-center gap-2 text-sm font-bold"><Users className="h-4 w-4 text-[#0B9C74]" />Audience preview</div>
              {previewLoading ? (
                <div className="grid place-items-center py-8"><div className="h-6 w-6 animate-spin rounded-full border-2 border-[#0B9C74] border-t-transparent" /></div>
              ) : preview ? (
                <>
                  <div className="mt-2 text-2xl font-bold">{preview.totalAudience}</div>
                  <div className="text-xs text-[#6b6b6b]">reachable Telegram customer{preview.totalAudience === 1 ? "" : "s"} (opted-in only)</div>
                  <div className="mt-3 max-h-40 space-y-1 overflow-auto text-xs">
                    {preview.customers.slice(0, 12).map((customer) => (
                      <div key={customer.id} className="flex justify-between gap-2 border-b border-[#F3E6D3] py-1">
                        <span className="truncate font-medium">{customer.name}</span>
                        <span className="shrink-0 text-[#9a9a9a]">{customer.totalOrders} orders</span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <p className="mt-2 text-xs leading-5 text-[#6b6b6b]">Audience preview unavailable. The count is confirmed when the campaign is created.</p>
              )}
            </div>
          </div>
        </form>
      )}

      {loading ? (
        <div className="grid place-items-center py-16"><div className="h-8 w-8 animate-spin rounded-full border-2 border-[#0B9C74] border-t-transparent" /></div>
      ) : campaigns.length === 0 ? (
        <div className="rounded-2xl border border-[#F3E6D3] bg-white p-10 text-center">
          <div className="mx-auto grid h-12 w-12 place-items-center rounded-full border border-[#F3E6D3] bg-[#FFF1DA]"><Megaphone className="h-6 w-6 text-[#E85D26]" /></div>
          <div className="mt-3 font-bold">No campaigns yet</div>
          <div className="text-sm text-[#6b6b6b]">Create your first Telegram broadcast to re-engage your customers.</div>
        </div>
      ) : (
        <div className="space-y-3">
          {campaigns.map((campaign) => (
            <Link key={campaign.id} to={`/dashboard/campaigns/${campaign.id}`} className="block rounded-2xl border border-[#F3E6D3] bg-white p-4 transition hover:bg-[#FFFBF5]">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-sm font-bold">{campaign.title}</span>
                    <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-bold ${statusStyle[campaign.status]}`}>{campaign.status}</span>
                  </div>
                  <div className="mt-1 truncate text-xs text-[#6b6b6b]">{campaign.message}</div>
                  <div className="mt-1 text-xs text-[#9a9a9a]">{CAMPAIGN_SEGMENT_LABELS[campaign.segment] || campaign.segment} • created {new Date(campaign.createdAt).toLocaleDateString()}</div>
                </div>
                <div className="flex items-center gap-4 text-center text-xs">
                  <div><div className="text-base font-bold">{campaign.stats.totalRecipients}</div><div className="text-[#9a9a9a]">audience</div></div>
                  <div><div className="text-base font-bold text-[#0B9C74]">{campaign.stats.sentCount}</div><div className="text-[#9a9a9a]">sent</div></div>
                  <div><div className={`text-base font-bold ${campaign.stats.failedCount ? "text-red-600" : ""}`}>{campaign.stats.failedCount}</div><div className="text-[#9a9a9a]">failed</div></div>
                  <Send className="h-4 w-4 text-[#229ED9]" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      <div className="flex flex-col items-start justify-between gap-3 rounded-2xl bg-[#1a1a1a] p-5 text-white sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2 font-bold"><AlarmClock className="h-4 w-4 text-[#E85D26]" />Abandoned Telegram orders</div>
          <p className="mt-1 text-xs leading-5 text-white/70">Send a one-tap payment reminder to Telegram customers with pending, unpaid orders. Opted-out customers are skipped automatically.</p>
        </div>
        <button onClick={() => void handleAbandonedReminders()} disabled={triggeringReminders} className="rounded-full bg-white px-5 py-2.5 text-sm font-bold text-[#1a1a1a] hover:bg-[#FFF1DA] disabled:opacity-60">{triggeringReminders ? "Sending…" : "Send reminders now"}</button>
      </div>
    </div>
  )
}
