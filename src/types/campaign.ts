export const CAMPAIGN_SEGMENTS = ["ALL", "VIP", "INACTIVE", "NEW", "CUSTOM"] as const
export type CampaignSegment = (typeof CAMPAIGN_SEGMENTS)[number]

export const CAMPAIGN_SEGMENT_LABELS: Record<CampaignSegment, string> = {
  ALL: "All Telegram customers",
  VIP: "VIP (2+ orders or ₦30,000+ spent)",
  INACTIVE: "Inactive (no order in 30 days)",
  NEW: "New (joined in the last 7 days)",
  CUSTOM: "Custom customer list",
}

export type CampaignStatus = "draft" | "scheduled" | "sending" | "completed" | "failed"

export type CampaignRecipient = {
  customerId?: string
  channel: "telegram"
  channelUserId: string
  handle?: string
  phone?: string
  name?: string
  status: "pending" | "sent" | "failed"
  sentAt?: string | null
  error?: string
}

export type Campaign = {
  id: string
  sellerId: string
  title: string
  message: string
  channel: "telegram"
  segment: CampaignSegment
  status: CampaignStatus
  scheduledAt?: string | null
  sentAt?: string | null
  stats: {
    totalRecipients: number
    sentCount: number
    failedCount: number
  }
  recipients: CampaignRecipient[]
  createdAt: string
  updatedAt: string
}

export type CreateCampaignPayload = {
  title: string
  message: string
  segment: CampaignSegment
  customerIds?: string[]
}

export type SegmentPreview = {
  segment: CampaignSegment
  totalAudience: number
  customers: Array<{
    id: string
    name: string
    phone: string
    totalOrders: number
    totalSpent: number
    lastOrderAt: string | null
  }>
}

export type AbandonedReminderResult = {
  success: boolean
  remindersSentCount: number
  reminders: Array<{ orderId: string; channelUserId: string; sentAt: string }>
}
