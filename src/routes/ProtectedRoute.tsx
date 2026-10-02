import { Navigate } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import type { ReactNode } from "react"

/**
 * Guards the seller dashboard. Unauthenticated visitors go to /login;
 * admins have their own workspace and are sent to /admin instead of
 * seller pages whose endpoints their role cannot use.
 *
 * A seller who has not confirmed their email with the signup OTP is pushed to
 * /verify-email, so typing a dashboard URL by hand cannot bypass verification.
 * This mirrors the backend `requireVerifiedEmail` gate, which is the real
 * enforcement point - this guard only saves the user a wall of 403s. The rule
 * is uniform across roles; admins are provisioned already-verified by the CLI
 * rather than exempted.
 */
export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading, user } = useAuth()

  if (isLoading) {
    return (
      <div className="min-h-screen grid place-items-center bg-[#FFFBF5]">
        <div className="h-8 w-8 rounded-full border-2 border-[#0B9C74] border-t-transparent animate-spin" />
      </div>
    )
  }

  if (!isAuthenticated) return <Navigate to="/login" replace />

  const role = user?.role
  if (role === "admin" || role === "platform_owner") {
    return <Navigate to="/admin" replace />
  }

  // Treat anything other than an explicit `true` as unverified: a missing flag
  // must fail closed, never silently open the dashboard.
  if (user && user.isEmailVerified !== true) {
    return <Navigate to={`/verify-email?email=${encodeURIComponent(user.email)}`} replace />
  }

  return <>{children}</>
}
