import { Navigate } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import type { ReactNode } from "react"

/**
 * Wraps auth pages (/login, /register). A user with an active session has no
 * business on them, so they are redirected to their workspace instead:
 * admins to /admin, sellers to /dashboard.
 */
export function GuestRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading, user } = useAuth()

  if (isLoading) {
    return (
      <div className="min-h-screen grid place-items-center bg-[#FFFBF5]">
        <div className="h-8 w-8 rounded-full border-2 border-[#0B9C74] border-t-transparent animate-spin" />
      </div>
    )
  }

  if (isAuthenticated) {
    const role = user?.role
    return <Navigate to={role === "admin" || role === "platform_owner" ? "/admin" : "/dashboard"} replace />
  }

  return <>{children}</>
}
