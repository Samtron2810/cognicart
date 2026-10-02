import { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { ArrowLeft, Eye, Send, Users } from "lucide-react"
import { broadcastService } from "../../services/broadcastService"
import {
  BROADCAST_SEGMENTS,
  BROADCAST_SEGMENT_HINTS,
  BROADCAST_SEGMENT_LABELS,
} from "../../types/broadcast"
import type { AudiencePreview, BroadcastSegment } from "../../types/broadcast"

/** Chip input for typed-in email addresses. Commas, spaces and Enter all commit. */
function EmailChips({ label, hint, value, onChange }: { label: string; hint: string; value: string[]; onChange: (next: string[]) => void }) {
  const [draft, setDraft] = useState("")

  const commit = (raw: string) => {
    const parts = raw.split(/[\s,;]+/).map((p) => p.trim().toLowerCase()).filter(Boolean)
    if (parts.length === 0) return
    onChange(Array.from(new Set([...value, ...parts])))
    setDraft("")
  }

  return (
    <div>
      <label className="text-xs font-bold tracking-widest text-[#9a9a9a]">{label}</label>
      <div className="mt-1 flex flex-wrap gap-2 rounded-xl border border-[#F3E6D3] p-2 focus-within:border-[#0B9C74]">
        {value.map((email) => (
          <span key={email} className="inline-flex items-center gap-1 rounded-full bg-[#FFF1DA] px-2.5 py-1 text-xs font-bold">
            {email}
            <button type="button" onClick={() => onChange(value.filter((e) => e !== email))} aria-label={`Remove ${email}`} className="text-[#9a9a9a] hover:text-red-600">×</button>
          </span>
        ))}
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === "," || e.key === " ") { e.preventDefault(); commit(draft) }
            if (e.key === "Backspace" && !draft && value.length) onChange(value.slice(0, -1))
          }}
          onBlur={() => commit(draft)}
          onPaste={(e) => { e.preventDefault(); commit(e.clipboardData.getData("text")) }}
          placeholder="type an address and press Enter"
          className="min-w-[220px] flex-1 px-1 py-1 text-sm outline-none"
        />
      </div>
      <p className="mt-1 text-xs text-[#9a9a9a]">{hint}</p>
    </div>
  )
}

export default function AdminBroadcastCompose() {
  const navigate = useNavigate()

  const [subject, setSubject] = useState("")
  const [body, setBody] = useState("")
  const [preheader, setPreheader] = useState("")
  const [ctaLabel, setCtaLabel] = useState("")
  const [ctaUrl, setCtaUrl] = useState("")
  const [segments, setSegments] = useState<BroadcastSegment[]>(["ALL_SELLERS"])
  const [segmentDays, setSegmentDays] = useState(30)
  const [includeEmails, setIncludeEmails] = useState<string[]>([])
  const [excludeEmails, setExcludeEmails] = useState<string[]>([])

  const [preview, setPreview] = useState<AudiencePreview | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")
  const [notice, setNotice] = useState("")
  const [draftId, setDraftId] = useState("")
  const [confirmText, setConfirmText] = useState("")

  const audience = useMemo(
    () => ({ segments, segmentDays, includeEmails, excludeEmails }),
    [segments, segmentDays, includeEmails, excludeEmails]
  )

  // Live recipient count. Debounced so each chip keystroke is not a request.
  useEffect(() => {
    if (segments.length === 0 && includeEmails.length === 0) { setPreview(null); return }
    const timer = setTimeout(() => {
      broadcastService.preview(audience).then(setPreview).catch(() => setPreview(null))
    }, 400)
    return () => clearTimeout(timer)
  }, [audience, segments.length, includeEmails.length])

  const toggleSegment = (segment: BroadcastSegment) => {
    setSegments((current) => (current.includes(segment) ? current.filter((s) => s !== segment) : [...current, segment]))
    setConfirmText("")
  }

  const fields = { subject, body, preheader, ctaLabel, ctaUrl, ...audience }

  /** Persist a draft so test/send have something to act on, and reuse it after. */
  const ensureDraft = async () => {
    if (draftId) {
      await broadcastService.update(draftId, fields)
      return draftId
    }
    const created = await broadcastService.create(fields)
    setDraftId(created.id)
    return created.id
  }

  const run = async (action: "save" | "test" | "send") => {
    setBusy(true); setError(""); setNotice("")
    try {
      const id = await ensureDraft()
      if (action === "save") { navigate(`/admin/broadcasts/${id}`); return }
      if (action === "test") { setNotice((await broadcastService.sendTest(id)).message); return }
      const result = await broadcastService.send(id)
      setNotice(result.message)
      navigate(`/admin/broadcasts/${id}`)
    } catch (err) {
      const message = (err as { response?: { data?: { message?: string } } }).response?.data?.message
      setError(message || "Something went wrong. Nothing was sent.")
    } finally {
      setBusy(false)
    }
  }

  const count = preview?.count ?? 0
  // Typing the exact recipient count is the last gate before mailing everyone.
  const canSend = Boolean(subject.trim()) && Boolean(body.trim()) && count > 0 && !preview?.overLimit && confirmText.trim() === String(count)

  return (
    <div className="space-y-5">
      <button onClick={() => navigate("/admin/broadcasts")} className="inline-flex items-center gap-2 text-sm font-bold text-[#6b6b6b] hover:text-[#1a1a1a]">
        <ArrowLeft className="h-4 w-4" /> Back to broadcasts
      </button>

      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight">New broadcast</h1>
        <p className="text-sm text-[#6b6b6b]">Pick an audience, write the message in plain text, preview, then send. Sending cannot be undone.</p>
      </div>

      {error && <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}
      {notice && <div className="rounded-2xl border border-[#0B9C74]/25 bg-[#E8F6F1] p-4 text-sm text-[#0B9C74]">{notice}</div>}

      <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
        <div className="space-y-5">
          <section className="rounded-2xl bg-white border border-[#F3E6D3] p-5 space-y-4">
            <h2 className="text-sm font-bold">Audience</h2>
            <div className="flex flex-wrap gap-2">
              {BROADCAST_SEGMENTS.map((segment) => (
                <button
                  key={segment}
                  type="button"
                  onClick={() => toggleSegment(segment)}
                  title={BROADCAST_SEGMENT_HINTS[segment] || ""}
                  className={`rounded-full border px-3 py-1.5 text-xs font-bold ${segments.includes(segment) ? "bg-[#0B9C74] text-white border-[#0B9C74]" : "border-[#F3E6D3] hover:bg-[#FFF1DA]"}`}
                >
                  {BROADCAST_SEGMENT_LABELS[segment]}
                </button>
              ))}
            </div>
            <p className="text-xs text-[#9a9a9a]">Segments are combined, not intersected: a seller matching any selected group is included once.</p>

            {(segments.includes("NEW_SIGNUPS") || segments.includes("DORMANT")) && (
              <label className="block text-sm">
                <span className="text-xs font-bold tracking-widest text-[#9a9a9a]">WINDOW (DAYS)</span>
                <input type="number" min={1} max={365} value={segmentDays} onChange={(e) => setSegmentDays(Number(e.target.value))} className="mt-1 w-32 rounded-xl border border-[#F3E6D3] px-3 py-2 text-sm outline-none focus:border-[#0B9C74]" />
              </label>
            )}

            <EmailChips label="ALSO SEND TO" hint="Typed addresses are added even if they match no account. They get no unsubscribe link." value={includeEmails} onChange={setIncludeEmails} />
            <EmailChips label="NEVER SEND TO" hint="Removed from the audience after the segments resolve." value={excludeEmails} onChange={setExcludeEmails} />
          </section>

          <section className="rounded-2xl bg-white border border-[#F3E6D3] p-5 space-y-4">
            <h2 className="text-sm font-bold">Message</h2>
            <label className="block">
              <span className="text-xs font-bold tracking-widest text-[#9a9a9a]">SUBJECT</span>
              <input value={subject} onChange={(e) => setSubject(e.target.value)} maxLength={150} className="mt-1 w-full rounded-xl border border-[#F3E6D3] px-3 py-2.5 text-sm outline-none focus:border-[#0B9C74]" />
            </label>
            <label className="block">
              <span className="text-xs font-bold tracking-widest text-[#9a9a9a]">PREVIEW LINE (OPTIONAL)</span>
              <input value={preheader} onChange={(e) => setPreheader(e.target.value)} maxLength={150} placeholder="Shown next to the subject in most inboxes" className="mt-1 w-full rounded-xl border border-[#F3E6D3] px-3 py-2.5 text-sm outline-none focus:border-[#0B9C74]" />
            </label>
            <label className="block">
              <span className="text-xs font-bold tracking-widest text-[#9a9a9a]">BODY</span>
              <textarea value={body} onChange={(e) => setBody(e.target.value)} maxLength={5000} rows={10} placeholder={"Plain text. Leave a blank line between paragraphs.\n\nYou can use {{businessName}}, {{firstName}} and {{email}}."} className="mt-1 w-full rounded-xl border border-[#F3E6D3] px-3 py-2.5 text-sm outline-none focus:border-[#0B9C74]" />
              <span className="text-xs text-[#9a9a9a]">{body.length}/5000 • placeholders: {"{{businessName}}"}, {"{{firstName}}"}, {"{{email}}"}</span>
            </label>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block">
                <span className="text-xs font-bold tracking-widest text-[#9a9a9a]">BUTTON LABEL</span>
                <input value={ctaLabel} onChange={(e) => setCtaLabel(e.target.value)} maxLength={60} className="mt-1 w-full rounded-xl border border-[#F3E6D3] px-3 py-2.5 text-sm outline-none focus:border-[#0B9C74]" />
              </label>
              <label className="block">
                <span className="text-xs font-bold tracking-widest text-[#9a9a9a]">BUTTON LINK</span>
                <input value={ctaUrl} onChange={(e) => setCtaUrl(e.target.value)} placeholder="https://" className="mt-1 w-full rounded-xl border border-[#F3E6D3] px-3 py-2.5 text-sm outline-none focus:border-[#0B9C74]" />
              </label>
            </div>
          </section>
        </div>

        <div className="space-y-5">
          <section className="rounded-2xl bg-white border border-[#F3E6D3] p-5 space-y-3">
            <h2 className="flex items-center gap-2 text-sm font-bold"><Users className="h-4 w-4" /> Recipients</h2>
            <div className="text-3xl font-bold">{count.toLocaleString()}</div>
            {preview && (
              <ul className="space-y-1 text-xs text-[#6b6b6b]">
                {preview.optedOut > 0 && <li>{preview.optedOut} skipped (opted out of announcements)</li>}
                {preview.adHoc > 0 && <li>{preview.adHoc} typed address{preview.adHoc === 1 ? "" : "es"} with no account</li>}
                {preview.overLimit && <li className="font-bold text-red-700">Over the {preview.maxRecipients.toLocaleString()} recipient limit — narrow the audience.</li>}
                {preview.sample.length > 0 && <li className="pt-1 text-[#9a9a9a]">e.g. {preview.sample.slice(0, 5).join(", ")}</li>}
              </ul>
            )}
          </section>

          <section className="rounded-2xl bg-white border border-[#F3E6D3] p-5 space-y-3">
            <h2 className="flex items-center gap-2 text-sm font-bold"><Eye className="h-4 w-4" /> Preview</h2>
            <div className="rounded-xl border border-[#F3E6D3] bg-[#FFFCF7] p-4">
              <div className="text-sm font-bold">{subject || "Subject"}</div>
              {preheader && <div className="text-xs text-[#9a9a9a]">{preheader}</div>}
              <div className="mt-3 space-y-2 text-sm whitespace-pre-wrap">{body || "Your message appears here."}</div>
              {ctaUrl && <div className="mt-3 inline-flex rounded-full bg-[#0B9C74] px-4 py-2 text-xs font-bold text-white">{ctaLabel || "Open"}</div>}
              <div className="mt-4 border-t border-[#F3E6D3] pt-2 text-xs text-[#9a9a9a]">Unsubscribe from announcements — added automatically, cannot be removed.</div>
            </div>
          </section>

          <section className="rounded-2xl bg-white border border-[#F3E6D3] p-5 space-y-3">
            <h2 className="text-sm font-bold">Send</h2>
            <div className="flex flex-wrap gap-2">
              <button disabled={busy || !subject.trim() || !body.trim()} onClick={() => run("save")} className="rounded-full border border-[#F3E6D3] px-4 py-2 text-sm font-bold hover:bg-[#FFF1DA] disabled:opacity-50">Save draft</button>
              <button disabled={busy || !subject.trim() || !body.trim()} onClick={() => run("test")} className="rounded-full border border-[#F3E6D3] px-4 py-2 text-sm font-bold hover:bg-[#FFF1DA] disabled:opacity-50">Send test to me</button>
            </div>
            <label className="block">
              <span className="text-xs font-bold tracking-widest text-[#9a9a9a]">TYPE {count} TO CONFIRM</span>
              <input value={confirmText} onChange={(e) => setConfirmText(e.target.value)} placeholder={String(count)} className="mt-1 w-full rounded-xl border border-[#F3E6D3] px-3 py-2.5 text-sm outline-none focus:border-[#0B9C74]" />
            </label>
            <button disabled={busy || !canSend} onClick={() => run("send")} className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#0B9C74] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#0a8a66] disabled:opacity-50">
              <Send className="h-4 w-4" /> {busy ? "Working…" : `Send to ${count.toLocaleString()}`}
            </button>
            <p className="text-xs text-[#9a9a9a]">Sending starts immediately and cannot be recalled.</p>
          </section>
        </div>
      </div>
    </div>
  )
}
