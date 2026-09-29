import { Navigate } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import type { ReactNode } from "react"

/**
 * Guards the seller dashboard. Unauthenticated visitors go to /login;
 * admins have their own workspace and are sent to /admin instead of
 * seller pages whose endpoints their role cannot use.
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

  return <>{children}</>
}
