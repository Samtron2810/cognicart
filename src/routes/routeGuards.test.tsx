import { render, screen } from "@testing-library/react"
import { MemoryRouter, Route, Routes } from "react-router-dom"
import { beforeEach, describe, expect, it, vi } from "vitest"

const mockUseAuth = vi.fn()
vi.mock("../context/AuthContext", () => ({
  useAuth: () => mockUseAuth(),
}))

import { ProtectedRoute } from "./ProtectedRoute"
import { AdminRoute } from "./AdminRoute"

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/login" element={<div>Login form</div>} />
        <Route path="/dashboard" element={<ProtectedRoute><div>Seller dashboard</div></ProtectedRoute>} />
        <Route path="/admin" element={<AdminRoute><div>Admin dashboard</div></AdminRoute>} />
      </Routes>
    </MemoryRouter>,
  )
}

beforeEach(() => {
  mockUseAuth.mockReset()
})

describe("ProtectedRoute", () => {
  it("sends unauthenticated visitors to /login", () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: false, isLoading: false, user: null })
    renderAt("/dashboard")
    expect(screen.getByText("Login form")).toBeInTheDocument()
  })

  it("lets sellers into the dashboard", () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: true, isLoading: false, user: { role: "seller" } })
    renderAt("/dashboard")
    expect(screen.getByText("Seller dashboard")).toBeInTheDocument()
  })

  it("redirects admins from seller pages to their own workspace", () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: true, isLoading: false, user: { role: "admin" } })
    renderAt("/dashboard")
    expect(screen.queryByText("Seller dashboard")).not.toBeInTheDocument()
    expect(screen.getByText("Admin dashboard")).toBeInTheDocument()
  })

  it("redirects platform owners from seller pages too", () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: true, isLoading: false, user: { role: "platform_owner" } })
    renderAt("/dashboard")
    expect(screen.getByText("Admin dashboard")).toBeInTheDocument()
  })

  it("renders nothing sensitive while the session check is pending", () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: false, isLoading: true, user: null })
    renderAt("/dashboard")
    expect(screen.queryByText("Seller dashboard")).not.toBeInTheDocument()
    expect(screen.queryByText("Login form")).not.toBeInTheDocument()
  })
})

describe("AdminRoute", () => {
  it("sends unauthenticated visitors to /login", () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: false, isLoading: false, user: null })
    renderAt("/admin")
    expect(screen.getByText("Login form")).toBeInTheDocument()
  })

  it("redirects sellers from admin pages to their dashboard", () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: true, isLoading: false, user: { role: "seller" } })
    renderAt("/admin")
    expect(screen.queryByText("Admin dashboard")).not.toBeInTheDocument()
    expect(screen.getByText("Seller dashboard")).toBeInTheDocument()
  })

  it("lets admins and platform owners in", () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: true, isLoading: false, user: { role: "admin" } })
    renderAt("/admin")
    expect(screen.getByText("Admin dashboard")).toBeInTheDocument()
  })
})
