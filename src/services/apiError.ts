import axios from "axios"

/**
 * Pulls the human-readable message the backend sent with an error response.
 * Backend errors are JSON like { message: "Invalid email or password" };
 * HTML error pages from proxies are ignored.
 */
const extractBackendMessage = (data: unknown): string | null => {
  if (!data) return null
  if (typeof data === "string") {
    const trimmed = data.trim()
    return trimmed && !trimmed.startsWith("<") ? trimmed : null
  }
  if (typeof data === "object") {
    const record = data as Record<string, unknown>
    for (const key of ["message", "error"]) {
      const value = record[key]
      if (typeof value === "string" && value.trim()) return value.trim()
    }
  }
  return null
}

/**
 * Turns any thrown value into a message that is safe and useful to show users.
 *
 * Priority: the backend's own message (e.g. "Invalid email or password") →
 * friendly explanations for timeouts/network failures/common HTTP statuses →
 * the provided fallback. Raw Axios jargon such as
 * "Request failed with status code 401" never reaches the UI.
 */
export function getApiErrorMessage(error: unknown, fallback = "Something went wrong. Please try again."): string {
  if (axios.isAxiosError(error)) {
    const backendMessage = extractBackendMessage(error.response?.data)
    if (backendMessage) return backendMessage

    if (error.code === "ECONNABORTED" || /timeout/i.test(error.message)) {
      return "The server is taking longer than usual — it may be waking up or your network is slow. Please try again in a moment."
    }
    if (!error.response) {
      return "Can't reach the server. Check your internet connection and try again."
    }

    const status = error.response.status
    if (status === 401) return "You're not signed in, or your session has expired. Please log in again."
    if (status === 403) return "You don't have permission to do that."
    if (status === 404) return "We couldn't find what you were looking for."
    if (status === 429) return "Too many attempts. Please wait a moment and try again."
    if (status >= 500) return "Something went wrong on our side. Please try again shortly."
    return fallback
  }

  // Local, intentional errors (e.g. client-side validation) keep their message.
  if (error instanceof Error && error.message && !/^Request failed/i.test(error.message)) {
    return error.message
  }
  return fallback
}
