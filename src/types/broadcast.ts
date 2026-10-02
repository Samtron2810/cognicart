/**
 * Admin broadcast: platform-owner bulk email to sellers.
 *
 * Distinct from `campaign.ts`, which is the seller-owned Telegram feature.
 * Segments are unioned server-side, then `includeEmails` are added and
 * `excludeEmails` removed, then opted-out accounts are suppressed.
 */

export const BROADCAST_SEGMENTS = [
  "ALL_SELLERS",
  "VERIFIED",
  "UNVERIFIED",
  "ACTIVE",
  "SUSPENDED",
  "TELEGRAM_CONNECTED",
  "TELEGRAM_NOT_CONNECTED",
  "NO_PRODUCTS",
  "HAS_SALES",
  "NO_SALES",
  "NEW_SIGNUPS",
  "DORMANT",
  "ADMINS",
] as const

export type BroadcastSegment = (typeof BROADCAST_SEGMENTS)[number] | "CUSTOM"

export const BROADCAST_SEGMENT_LABELS: Record<BroadcastSegment, string> = {
  ALL_SELLERS: "All sellers",
  VERIFIED: "Verified sellers",
  UNVERIFIED: "Unverified sellers",
  ACTIVE: "Active sellers",
  SUSPENDED: "Suspended sellers",
  TELEGRAM_CONNECTED: "Telegram connected",
  TELEGRAM_NOT_CONNECTED: "Telegram not connected",
  NO_PRODUCTS: "No products listed",
  HAS_SALES: "Has made sales",
  NO_SALES: "No sales yet",
  NEW_SIGNUPS: "New signups (within window)",
  DORMANT: "Dormant (no orders in window)",
  ADMINS: "Platform admins",
  CUSTOM: "Typed addresses only",
}

export const BROADCAST_SEGMENT_HINTS: Partial<Record<BroadcastSegment, string>> = {
  NEW_SIGNUPS: "Uses the day window below.",
  DORMANT: "Uses the day window below.",
  CUSTOM: "Sends only to the addresses you type in.",
}

export type BroadcastStatus = "draft" | "sending" | "completed" | "failed"

export type BroadcastRecipient = {
  userId?: string
  email: string
  businessName?: string
  /** True when the address was typed in rather than resolved from an account. */
  adHoc?: boolean
  status: "pending" | "sent" | "failed" | "skipped"
  sentAt?: string | null
  error?: string
}

export type BroadcastStats = {
  total: number
  sent: number
  failed: number
  skipped: number
}

export type BroadcastComposerFields = {
  subject: string
  /** Plain text. Blank lines separate paragraphs; markup is escaped server-side. */
  body: string
  preheader?: string
  ctaLabel?: string
  ctaUrl?: string
  segments: BroadcastSegment[]
  segmentDays?: number
  includeEmails?: string[]
  excludeEmails?: string[]
}

export type Broadcast = BroadcastComposerFields & {
  id: string
  status: BroadcastStatus
  stats: BroadcastStats
  /** Only populated on the detail endpoint; the list omits it by design. */
  recipients?: BroadcastRecipient[]
  createdBy?: string
  createdByEmail?: string
  startedAt?: string | null
  completedAt?: string | null
  createdAt: string
  updatedAt: string
}

export type AudiencePreview = {
  count: number
  /** Accounts matched but suppressed because they opted out. */
  optedOut: number
  /** Typed addresses with no matching account. */
  adHoc: number
  overLimit: boolean
  maxRecipients: number
  sample: string[]
}

export type SendResult = {
  success: boolean
  id?: string
  queued: number
  message: string
}
