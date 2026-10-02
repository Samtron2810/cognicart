import { useEffect, useState } from "react"
import { Link, useSearchParams } from "react-router-dom"
import { CheckCircle2, XCircle, Mail } from "lucide-react"
import { useAuth } from "../../context/AuthContext"
import { AuthLayout } from "../../layouts/AuthLayout"
import { authService } from "../../services/authService"
import { getApiErrorMessage } from "../../services/apiError"

export default function VerifyEmail() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get("t") || ""
  const { refreshUser, isAuthenticated, user } = useAuth()

  const [status, setStatus] = useState<"verifying" | "done" | "error">("verifying")
  const [error, setError] = useState<string | null>(null)
  const [resendEmail, setResendEmail] = useState(user?.email || "")
  const [resending, setResending] = useState(false)
  const [resent, setResent] = useState(false)

  useEffect(() => {
    if (!token) {
      setStatus("error")
      setError("This verification link is missing its token.")
      return
    }
    let active = true
    authService
      .verifyEmail(token)
      .then(async () => {
        if (!active) return
        if (isAuthenticated) await refreshUser()
        setStatus("done")
      })
      .catch((err: unknown) => {
        if (!active) return
        setError(getApiErrorMessage(err, "That link is invalid or has expired."))
        setStatus("error")
      })
    return () => {
      active = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token])

  return (
    <AuthLayout>
      <div className="rounded-2xl bg-white border border-[#F3E6D3] p-6 sm:p-8 shadow-sm text-center">
        {status === "verifying" && (
          <>
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-[#0B9C74] border-t-transparent" />
            <p className="mt-4 text-sm text-[#6b6b6b]">Verifying your email...</p>
          </>
        )}

        {status === "done" && (
          <>
            <CheckCircle2 className="mx-auto h-10 w-10 text-[#0B9C74]" />
            <h1 className="mt-3 font-display text-xl font-bold">Email verified</h1>
            <p className="mt-1 text-sm text-[#6b6b6b]">Your Cognicart account is fully set up.</p>
            <Link to={isAuthenticated ? "/dashboard" : "/login"} className="mt-6 inline-flex rounded-full bg-[#0B9C74] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#0a8a66]">
              {isAuthenticated ? "Go to dashboard" : "Go to login"}
            </Link>
          </>
        )}

        {status === "error" && (
          <>
            <XCircle className="mx-auto h-10 w-10 text-red-500" />
            <h1 className="mt-3 font-display text-xl font-bold">Verification failed</h1>
            <p className="mt-1 text-sm text-[#6b6b6b]">{error}</p>

            {resent ? (
              <p className="mt-6 text-sm font-bold text-[#0B9C74]">New link sent — check your inbox.</p>
            ) : (
              <div className="mt-6 space-y-3 text-left">
                <label className="block">
                  <span className="text-xs font-bold text-[#1a1a1a]">Resend verification link to</span>
                  <div className="relative mt-1">
                    <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9a9a9a]" />
                    <input
                      type="email"
                      value={resendEmail}
                      onChange={(e) => setResendEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="w-full rounded-xl border border-[#F3E6D3] bg-white py-2.5 pl-9 pr-3 text-sm outline-none focus:border-[#0B9C74] focus:ring-2 focus:ring-[#0B9C74]/15"
                    />
                  </div>
                </label>
                <button
                  onClick={() => {
                    setResending(true)
                    authService
                      .resendVerification(resendEmail)
                      .then(() => setResent(true))
                      .finally(() => setResending(false))
                  }}
                  disabled={resending || !resendEmail.trim()}
                  className="w-full rounded-full bg-[#1a1a1a] py-2.5 text-sm font-bold text-white hover:bg-black disabled:opacity-60"
                >
                  {resending ? "Sending..." : "Resend link"}
                </button>
              </div>
            )}

            <Link to={isAuthenticated ? "/dashboard" : "/login"} className="mt-4 inline-block text-sm font-bold text-[#0B9C74] hover:underline">
              {isAuthenticated ? "Back to dashboard" : "Back to login"}
            </Link>
          </>
        )}
      </div>
    </AuthLayout>
  )
}
