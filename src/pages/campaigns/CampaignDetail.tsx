import { useEffect, useState } from "react"
import { Link, useParams } from "react-router-dom"
import { AlertTriangle, ArrowLeft, CheckCircle2, Send, Users } from "lucide-react"
import { campaignService } from "../../services/campaignService"
import { CAMPAIGN_SEGMENT_LABELS } from "../../types/campaign"
import type { Campaign } from "../../types/campaign"

export default function CampaignDetail() {
  const { id } = useParams<{ id: string }>()
  const [campaign, setCampaign] = useState<Campaign | null>(null)
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [confirmingSend, setConfirmingSend] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = async () => {
    if (!id) return
    try {
      setCampaign(await campaignService.getById(id))
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Campaign not found")
    } finally {
      setLoading(false)
    }
  }

  // The route parameter is the refresh boundary for this detail page.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { void load() }, [id])

  const handleSend = async () => {
    if (!id) return
    setSending(true)
    setError(null)
    try {
      const sent = await campaignService.send(id)
      setCampaign(sent)
      setConfirmingSend(false)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to send the campaign.")
      await load()
    } finally {
      setSending(false)
    }
  }

  if (loading) return <div className="grid place-items-center py-16"><div className="h-8 w-8 animate-spin rounded-full border-2 border-[#0B9C74] border-t-transparent" /></div>
  if (!campaign) {
    return (
      <div className="rounded-2xl border border-[#F3E6D3] bg-white p-8 text-center">
        <div className="font-bold">Campaign not found</div>
        {error && <div className="mt-1 text-sm text-[#6b6b6b]">{error}</div>}
        <Link to="/dashboard/campaigns" className="mt-4 inline-flex rounded-full bg-[#0B9C74] px-5 py-2.5 text-sm font-bold text-white">Back to campaigns</Link>
      </div>
    )
  }

  const canSend = campaign.status === "draft" || campaign.status === "scheduled" || campaign.status === "failed"
  const failures = campaign.recipients.filter((recipient) => recipient.status === "failed")

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Link to="/dashboard/campaigns" className="inline-flex items-center gap-2 text-sm font-medium text-[#6b6b6b] hover:text-[#1a1a1a]"><ArrowLeft className="h-4 w-4" /> Back to campaigns</Link>

      {error && <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">{error}</div>}

      <div className="rounded-[22px] border border-[#F3E6D3] bg-white p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-display text-xl font-bold">{campaign.title}</h1>
              <span className="inline-flex rounded-full border border-[#229ED9]/25 bg-[#E7F4FB] px-2.5 py-0.5 text-xs font-bold text-[#1c82b3]">Telegram</span>
              <span className="inline-flex rounded-full border border-[#F3E6D3] bg-[#FFFBF5] px-2.5 py-0.5 text-xs font-bold">{campaign.status}</span>
            </div>
            <div className="mt-1 text-xs text-[#6b6b6b]">{CAMPAIGN_SEGMENT_LABELS[campaign.segment] || campaign.segment} • created {new Date(campaign.createdAt).toLocaleString()}{campaign.sentAt ? ` • sent ${new Date(campaign.sentAt).toLocaleString()}` : ""}</div>
          </div>

          {canSend && (
            !confirmingSend ? (
              <button onClick={() => setConfirmingSend(true)} className="inline-flex items-center gap-2 rounded-full bg-[#229ED9] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#1c82b3]"><Send className="h-4 w-4" />Send campaign</button>
            ) : (
              <div className="rounded-xl border border-[#F3E6D3] bg-[#FFFBF5] p-3 text-sm">
                <div className="font-bold">Broadcast to {campaign.stats.totalRecipients} Telegram customer{campaign.stats.totalRecipients === 1 ? "" : "s"}?</div>
                <p className="mt-1 text-xs text-[#6b6b6b]">This cannot be undone. Delivery starts immediately.</p>
                <div className="mt-2 flex gap-2">
                  <button onClick={() => void handleSend()} disabled={sending} className="rounded-full bg-[#229ED9] px-4 py-2 text-xs font-bold text-white disabled:opacity-60">{sending ? "Sending…" : "Yes, send now"}</button>
                  <button onClick={() => setConfirmingSend(false)} disabled={sending} className="rounded-full border border-[#F3E6D3] bg-white px-4 py-2 text-xs font-bold">Cancel</button>
                </div>
              </div>
            )
          )}
        </div>

        {campaign.status === "scheduled" && (
          <div className="mt-4 flex items-start gap-2 rounded-xl border border-[#F3E6D3] bg-[#FFF1DA] p-3 text-xs leading-5 text-[#6b6b6b]">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-[#E85D26]" />
            Scheduled campaigns are not dispatched automatically — there is no background scheduler. Send this campaign manually when you're ready.
          </div>
        )}

        <div className="mt-5 rounded-xl bg-[#FFFBF5] p-4 text-sm leading-6 whitespace-pre-wrap">{campaign.message}</div>

        <div className="mt-5 grid grid-cols-3 gap-3 text-center">
          <div className="rounded-xl border border-[#F3E6D3] bg-[#FFFBF5] p-3"><div className="text-xl font-bold">{campaign.stats.totalRecipients}</div><div className="text-xs text-[#6b6b6b]">Audience</div></div>
          <div className="rounded-xl border border-[#0B9C74]/20 bg-[#E6F7F1] p-3"><div className="text-xl font-bold text-[#0B9C74]">{campaign.stats.sentCount}</div><div className="text-xs text-[#6b6b6b]">Delivered</div></div>
          <div className={`rounded-xl border p-3 ${campaign.stats.failedCount ? "border-red-200 bg-red-50" : "border-[#F3E6D3] bg-[#FFFBF5]"}`}><div className={`text-xl font-bold ${campaign.stats.failedCount ? "text-red-600" : ""}`}>{campaign.stats.failedCount}</div><div className="text-xs text-[#6b6b6b]">Failed</div></div>
        </div>
      </div>

      <div className="rounded-2xl border border-[#F3E6D3] bg-white p-5">
        <h2 className="flex items-center gap-2 font-bold"><Users className="h-4 w-4 text-[#0B9C74]" />Recipients ({campaign.recipients.length})</h2>
        <div className="mt-3 max-h-[420px] space-y-1 overflow-auto">
          {campaign.recipients.map((recipient, index) => (
            <div key={`${recipient.channelUserId}-${index}`} className="flex items-center justify-between gap-3 border-b border-[#F3E6D3] py-2 text-sm">
              <div className="min-w-0">
                <div className="truncate font-medium">{recipient.name || recipient.handle || recipient.channelUserId}</div>
                <div className="truncate text-xs text-[#9a9a9a]">{recipient.handle ? `@${recipient.handle}` : `id ${recipient.channelUserId}`}{recipient.phone ? ` • ${recipient.phone}` : ""}</div>
                {recipient.status === "failed" && recipient.error && <div className="truncate text-xs text-red-600">{recipient.error}</div>}
              </div>
              <span className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-bold ${recipient.status === "sent" ? "border-[#0B9C74]/20 bg-[#E6F7F1] text-[#0B9C74]" : recipient.status === "failed" ? "border-red-200 bg-red-50 text-red-700" : "border-[#F3E6D3] bg-[#FFFBF5] text-[#6b6b6b]"}`}>
                {recipient.status === "sent" && <CheckCircle2 className="h-3 w-3" />}{recipient.status}
              </span>
            </div>
          ))}
          {!campaign.recipients.length && <p className="py-6 text-center text-sm text-[#6b6b6b]">No eligible Telegram recipients. Customers appear here after they start your bot (and only if they haven't opted out of marketing).</p>}
        </div>
      </div>

      {failures.length > 0 && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-5">
          <h2 className="flex items-center gap-2 font-bold text-red-700"><AlertTriangle className="h-4 w-4" />Delivery failures ({failures.length})</h2>
          <p className="mt-1 text-xs leading-5 text-red-700/80">Common causes: the customer blocked the bot or deleted their account. These customers are unreachable until they message the bot again.</p>
        </div>
      )}
    </div>
  )
}
