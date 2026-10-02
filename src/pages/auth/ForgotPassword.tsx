import { useState } from "react"
import { Link } from "react-router-dom"
import { Mail, ShieldCheck } from "lucide-react"
import { AuthLayout } from "../../layouts/AuthLayout"
import { authService } from "../../services/authService"
import { getApiErrorMessage } from "../../services/apiError"

export default function ForgotPassword() {
  const [email, setEmail] = useState("")
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!email.trim()) {
      setError("Enter your account email")
      return
    }
    setLoading(true)
    try {
      await authService.forgotPassword(email)
      setSent(true)
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, "Something went wrong. Try again."))
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout>
      <div className="rounded-2xl bg-white border border-[#F3E6D3] p-6 sm:p-8 shadow-sm">
        <h1 className="font-display text-2xl font-bold tracking-tight">Reset your password</h1>
        <p className="mt-1 text-sm text-[#6b6b6b]">Enter your account email and we'll send a link to reset it.</p>

        {error && <div className="mt-4 rounded-xl bg-red-50 border border-red-200 px-3 py-2.5 text-sm text-red-700">{error}</div>}

        {sent ? (
          <div className="mt-6 rounded-xl border border-[#0B9C74]/20 bg-[#E6F7F1] p-5">
            <div className="flex items-center gap-2 font-bold text-[#0B9C74]">
              <ShieldCheck className="h-4 w-4" /> Check your inbox
            </div>
            <p className="mt-2 text-sm leading-6 text-[#1a1a1a]">
              If <span className="font-bold">{email.trim()}</span> is registered, a password reset link is on its way. The link expires in 30 minutes.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <label className="block">
              <span className="text-xs font-bold text-[#1a1a1a]">Email</span>
              <div className="relative mt-1">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9a9a9a]" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full rounded-xl border border-[#F3E6D3] bg-white py-2.5 pl-9 pr-3 text-sm outline-none focus:border-[#0B9C74] focus:ring-2 focus:ring-[#0B9C74]/15"
                />
              </div>
            </label>

            <button type="submit" disabled={loading} className="w-full rounded-full bg-[#1a1a1a] py-3 text-sm font-bold text-white hover:bg-black disabled:opacity-60 transition">
              {loading ? "Sending..." : "Send reset link"}
            </button>
          </form>
        )}

        <p className="mt-6 text-center text-sm text-[#6b6b6b]">
          Remembered it? <Link to="/login" className="font-bold text-[#0B9C74] hover:underline">Back to login</Link>
        </p>
      </div>
    </AuthLayout>
  )
}
