import api from "./api"
import { logger } from "./logger"

/**
 * Signed direct-to-Cloudinary uploads.
 *
 * The file never passes through the Chatstand API. We ask the backend for a
 * short-lived signature scoped to this seller's folder, then POST the file
 * straight to Cloudinary and keep only the returned URL + public_id.
 *
 * Note this deliberately uses `fetch`, not the shared axios instance: the
 * request goes to Cloudinary, so it must not carry our Authorization header
 * or hit our interceptors.
 */

export type UploadKind = "logo" | "product"

export type UploadedAsset = {
  url: string
  publicId: string
}

type UploadTicket = {
  cloudName: string
  apiKey: string
  timestamp: number
  signature: string
  folder: string
  tags: string
  uploadUrl: string
}

/** Client-side guard; Cloudinary and the signature are the real limits. */
export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024
const ACCEPTED_PREFIX = "image/"

function assertUploadable(file: File) {
  if (!file.type.startsWith(ACCEPTED_PREFIX)) {
    throw new Error("Only image files can be uploaded (jpeg, png, webp, gif)")
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    throw new Error(`"${file.name}" is larger than 5MB. Please choose a smaller image.`)
  }
}

async function getTicket(kind: UploadKind): Promise<UploadTicket> {
  const { data } = await api.post<UploadTicket>("/uploads/signature", { kind })
  return data
}

/** Upload one file and resolve to its permanent URL + asset id. */
export async function uploadImage(file: File, kind: UploadKind): Promise<UploadedAsset> {
  assertUploadable(file)

  const ticket = await getTicket(kind)

  // Only signed parameters may be sent, and they must match exactly what the
  // server signed, or Cloudinary rejects the upload.
  const form = new FormData()
  form.append("file", file)
  form.append("api_key", ticket.apiKey)
  form.append("timestamp", String(ticket.timestamp))
  form.append("signature", ticket.signature)
  form.append("folder", ticket.folder)
  form.append("tags", ticket.tags)

  const response = await fetch(ticket.uploadUrl, { method: "POST", body: form })

  if (!response.ok) {
    let detail = ""
    try {
      const body = await response.json()
      detail = body?.error?.message || ""
    } catch {
      // Cloudinary returned a non-JSON error; the status is all we have.
    }
    logger.error("upload: cloudinary rejected the file", { status: response.status, detail })
    throw new Error(detail || "Image upload failed. Please try again.")
  }

  const result = await response.json()
  return { url: result.secure_url || result.url, publicId: result.public_id }
}

/** Upload several files in parallel, preserving input order. */
export async function uploadImages(files: File[], kind: UploadKind): Promise<UploadedAsset[]> {
  return Promise.all(files.map((file) => uploadImage(file, kind)))
}
