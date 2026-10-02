import { Navigate } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import type { ReactNode } from "react"

/**
 * Guards the platform admin workspace. Verification is enforced here too, so
 * there is no role-shaped hole in the UI: `npm run create-admin` provisions
 * privileged accounts with `isEmailVerified: true`, and an older account that
 * predates the gate is sent to the OTP screen (resend works for any
 * unverified account) rather than silently keeping elevated access.
 */
export function AdminRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading, user } = useAuth()
  if (isLoading) return <div className="min-h-[60vh] grid place-items-center"><div className="h-8 w-8 rounded-full border-2 border-[#0B9C74] border-t-transparent animate-spin" /></div>
  if (!isAuthenticated) return <Navigate to="/login" replace />
  const role = user?.role
  if (role !== "admin" && role !== "platform_owner") {
    return <Navigate to="/dashboard" replace />
  }
  if (user && user.isEmailVerified !== true) {
    return <Navigate to={`/verify-email?email=${encodeURIComponent(user.email)}`} replace />
  }
  return <>{children}</>
}
