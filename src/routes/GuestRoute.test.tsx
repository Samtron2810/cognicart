import { render, screen } from "@testing-library/react"
import { MemoryRouter, Route, Routes } from "react-router-dom"
import { beforeEach, describe, expect, it, vi } from "vitest"

const mockUseAuth = vi.fn()
vi.mock("../context/AuthContext", () => ({
  useAuth: () => mockUseAuth(),
}))

import { GuestRoute } from "./GuestRoute"

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/login" element={<GuestRoute><div>Login form</div></GuestRoute>} />
        <Route path="/register" element={<GuestRoute><div>Register form</div></GuestRoute>} />
        <Route path="/dashboard" element={<div>Seller dashboard</div>} />
        <Route path="/admin" element={<div>Admin dashboard</div>} />
        <Route path="/verify-email" element={<div>Verification code screen</div>} />
      </Routes>
    </MemoryRouter>,
  )
}

beforeEach(() => {
  mockUseAuth.mockReset()
})

describe("GuestRoute", () => {
  it("shows the auth page to unauthenticated visitors", () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: false, isLoading: false, user: null })
    renderAt("/register")
    expect(screen.getByText("Register form")).toBeInTheDocument()
  })

  it("redirects a logged-in seller from /register to the dashboard", () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: true, isLoading: false, user: { role: "seller", email: "s@x.com", isEmailVerified: true } })
    renderAt("/register")
    expect(screen.queryByText("Register form")).not.toBeInTheDocument()
    expect(screen.getByText("Seller dashboard")).toBeInTheDocument()
  })

  it("redirects a logged-in seller from /login to the dashboard", () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: true, isLoading: false, user: { role: "seller", email: "s@x.com", isEmailVerified: true } })
    renderAt("/login")
    expect(screen.getByText("Seller dashboard")).toBeInTheDocument()
  })

  it("redirects logged-in admins to the admin area", () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: true, isLoading: false, user: { role: "admin" } })
    renderAt("/register")
    expect(screen.getByText("Admin dashboard")).toBeInTheDocument()
  })

  it("holds a freshly registered, unverified seller on the OTP screen", () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      user: { role: "seller", email: "new@x.com", isEmailVerified: false },
    })
    renderAt("/register")
    expect(screen.queryByText("Seller dashboard")).not.toBeInTheDocument()
    expect(screen.getByText("Verification code screen")).toBeInTheDocument()
  })

  it("waits for the session check before deciding", () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: false, isLoading: true, user: null })
    renderAt("/register")
    expect(screen.queryByText("Register form")).not.toBeInTheDocument()
    expect(screen.queryByText("Seller dashboard")).not.toBeInTheDocument()
  })
})
