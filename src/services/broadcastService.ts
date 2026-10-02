import api from "./api"
import type { AudiencePreview, Broadcast, BroadcastComposerFields, SendResult } from "../types/broadcast"

/**
 * Admin/platform-owner broadcast email to sellers.
 *
 * Sending is always a deliberate second step: create (or update) a draft,
 * preview the audience, optionally send yourself a test, then send. The server
 * snapshots the audience at send time and delivers in the background, so the
 * detail endpoint is what reports progress.
 */
export const broadcastService = {
  /** Dry run. Never sends anything. */
  async preview(payload: Pick<BroadcastComposerFields, "segments" | "segmentDays" | "includeEmails" | "excludeEmails">): Promise<AudiencePreview> {
    const { data } = await api.post<AudiencePreview>("/admin/broadcasts/preview", payload)
    return data
  },

  async list(limit = 50): Promise<Broadcast[]> {
    const { data } = await api.get<Broadcast[]>("/admin/broadcasts", { params: { limit } })
    return data
  },

  async getById(id: string): Promise<Broadcast> {
    const { data } = await api.get<Broadcast>(`/admin/broadcasts/${id}`)
    return data
  },

  async create(payload: BroadcastComposerFields): Promise<Broadcast> {
    const { data } = await api.post<Broadcast>("/admin/broadcasts", payload)
    return data
  },

  /** Drafts only; the server rejects edits once a send has started. */
  async update(id: string, payload: BroadcastComposerFields): Promise<Broadcast> {
    const { data } = await api.patch<Broadcast>(`/admin/broadcasts/${id}`, payload)
    return data
  },

  async remove(id: string): Promise<{ success: boolean; message: string }> {
    const { data } = await api.delete<{ success: boolean; message: string }>(`/admin/broadcasts/${id}`)
    return data
  },

  /** Mails one copy to the signed-in admin only. */
  async sendTest(id: string): Promise<{ success: boolean; message: string }> {
    const { data } = await api.post<{ success: boolean; message: string }>(`/admin/broadcasts/${id}/test`)
    return data
  },

  async send(id: string): Promise<SendResult> {
    const { data } = await api.post<SendResult>(`/admin/broadcasts/${id}/send`)
    return data
  },

  async retryFailed(id: string): Promise<SendResult> {
    const { data } = await api.post<SendResult>(`/admin/broadcasts/${id}/retry-failed`)
    return data
  },

  /** Public endpoint: no auth, token comes from the email link. */
  async unsubscribe(token: string): Promise<{ success: boolean; message: string; email?: string }> {
    const { data } = await api.post<{ success: boolean; message: string; email?: string }>("/broadcasts/unsubscribe", { token })
    return data
  },

  async resubscribe(token: string): Promise<{ success: boolean; message: string }> {
    const { data } = await api.post<{ success: boolean; message: string }>("/broadcasts/resubscribe", { token })
    return data
  },
}

export default broadcastService
