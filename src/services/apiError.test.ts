import { describe, expect, it } from "vitest"
import { getApiErrorMessage } from "./apiError"

const axiosError = (overrides: Record<string, unknown>) => ({
  isAxiosError: true,
  name: "AxiosError",
  message: "Request failed with status code 500",
  ...overrides,
})

describe("getApiErrorMessage", () => {
  it("prefers the backend's own message over everything else", () => {
    const error = axiosError({
      message: "Request failed with status code 401",
      response: { status: 401, data: { message: "Invalid email or password" } },
    })
    expect(getApiErrorMessage(error, "Login failed")).toBe("Invalid email or password")
  })

  it("never shows raw axios status jargon for a 401 without a backend message", () => {
    const error = axiosError({
      message: "Request failed with status code 401",
      response: { status: 401, data: {} },
    })
    const message = getApiErrorMessage(error, "Login failed")
    expect(message).not.toMatch(/status code/i)
    expect(message).toMatch(/session|signed in/i)
  })

  it("explains timeouts in plain language", () => {
    const error = axiosError({ code: "ECONNABORTED", message: "timeout of 60000ms exceeded" })
    expect(getApiErrorMessage(error)).toMatch(/taking longer than usual/i)
  })

  it("explains network failures in plain language", () => {
    const error = axiosError({ code: "ERR_NETWORK", message: "Network Error", response: undefined })
    expect(getApiErrorMessage(error)).toMatch(/internet connection/i)
  })

  it("maps server errors to a friendly message", () => {
    const error = axiosError({ response: { status: 500, data: null } })
    expect(getApiErrorMessage(error)).toMatch(/our side/i)
  })

  it("ignores HTML error pages from proxies", () => {
    const error = axiosError({ response: { status: 502, data: "<html><body>Bad Gateway</body></html>" } })
    expect(getApiErrorMessage(error)).not.toMatch(/html/i)
  })

  it("keeps messages from intentional local errors", () => {
    expect(getApiErrorMessage(new Error("Payload too large (500KB limit)"))).toBe("Payload too large (500KB limit)")
  })

  it("falls back for unknown values", () => {
    expect(getApiErrorMessage(undefined, "Unable to save the order.")).toBe("Unable to save the order.")
  })
})
