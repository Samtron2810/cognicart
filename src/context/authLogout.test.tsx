import { fireEvent, render, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

const logoutMock = vi.fn()
const meMock = vi.fn()

vi.mock("../services/authService", () => ({
  authService: {
    logout: () => logoutMock(),
    me: () => meMock(),
    persist: vi.fn(),
  },
  OTP_LENGTH: 6,
}))

import { AuthProvider, useAuth } from "./AuthContext"

function Probe() {
  const { isAuthenticated, logout } = useAuth()
  return (
    <>
      <span>{isAuthenticated ? "signed-in" : "signed-out"}</span>
      <button onClick={() => void logout().catch(() => {})}>Sign out</button>
    </>
  )
}

beforeEach(() => {
  logoutMock.mockReset()
  meMock.mockReset()
  meMock.mockResolvedValue({ id: "1", email: "s@x.com", role: "seller", isEmailVerified: false })
})

describe("AuthContext.logout", () => {
  it("clears the session when the server call succeeds", async () => {
    logoutMock.mockResolvedValue(undefined)
    render(<AuthProvider><Probe /></AuthProvider>)
    expect(await screen.findByText("signed-in")).toBeInTheDocument()

    fireEvent.click(screen.getByRole("button", { name: "Sign out" }))
    expect(await screen.findByText("signed-out")).toBeInTheDocument()
  })

  // Regression: a failed logout used to leave `user` set, so an unverified
  // seller clicking "Back to login" was bounced straight back to /verify-email.
  it("clears the session even when the server call fails", async () => {
    logoutMock.mockRejectedValue(new Error("network down"))
    render(<AuthProvider><Probe /></AuthProvider>)
    expect(await screen.findByText("signed-in")).toBeInTheDocument()

    fireEvent.click(screen.getByRole("button", { name: "Sign out" }))
    expect(await screen.findByText("signed-out")).toBeInTheDocument()
  })
})
