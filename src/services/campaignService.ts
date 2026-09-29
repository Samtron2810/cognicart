import api from "./api"
import type {
  AbandonedReminderResult,
  Campaign,
  CampaignSegment,
  CreateCampaignPayload,
  SegmentPreview,
} from "../types/campaign"

/**
 * Telegram marketing campaigns. Audiences are resolved server-side and only
 * include customers with a linked Telegram identity who have not opted out
 * of marketing. Delivery happens when the seller explicitly sends a campaign;
 * the backend has no background scheduler that dispatches campaigns on its own.
 */
export const campaignService = {
  async list(filters: { status?: string; segment?: string } = {}): Promise<Campaign[]> {
    const { data } = await api.get<Campaign[]>("/campaigns", { params: filters })
    return data
  },

  async getById(id: string): Promise<Campaign> {
    const { data } = await api.get<Campaign>(`/campaigns/${id}`)
    return data
  },

  async create(payload: CreateCampaignPayload): Promise<Campaign> {
    const { data } = await api.post<Campaign>("/campaigns", {
      ...payload,
      channel: "telegram",
    })
    return data
  },

  /** Broadcast to the campaign's Telegram recipients. Requires explicit confirmation in the UI. */
  async send(id: string): Promise<Campaign> {
    const { data } = await api.post<Campaign>(`/campaigns/${id}/send`)
    return data
  },

  async previewSegment(segment: CampaignSegment): Promise<SegmentPreview> {
    const { data } = await api.get<SegmentPreview>(`/campaigns/segments/${segment}/preview`)
    return data
  },

  /** Send Telegram reminders for unpaid Telegram orders older than ageMinutes. */
  async triggerAbandonedReminders(ageMinutes = 0): Promise<AbandonedReminderResult> {
    const { data } = await api.post<AbandonedReminderResult>("/campaigns/abandoned-orders/trigger", { ageMinutes })
    return data
  },
}
