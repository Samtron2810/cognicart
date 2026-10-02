import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { MailCheck } from "lucide-react"
import { useAuth } from "../../context/AuthContext"
import { PasswordInput } from "../../components/forms/PasswordInput"
import { AuthLayout } from "../../layouts/AuthLayout"
import { getApiErrorMessage } from "../../services/apiError"
import { authService } from "../../services/authService"

export default function Register() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ businessName: "", email: "", phone: "", password: "", confirm: "" })
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [registeredEmail, setRegisteredEmail] = useState<string | null>(null)
  const [resending, setResending] = useState(false)
  const [resent, setResent] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!form.businessName || !form.email || !form.password) {
      setError("Business name, email and password are required")
      return
    }
    if (form.password.length < 6) {
      setError("Password must be at least 6 characters")
      return
    }
    if (form.password !== form.confirm) {
      setError("Passwords do not match")
      return
    }
    setLoading(true)
    try {
      await register({ businessName: form.businessName, email: form.email, password: form.password, phone: form.phone })
      // Account is created and the seller is already signed in - a
      // verification email was sent in the background. Pause here instead
      // of jumping straight to the dashboard so they actually see that.
      setRegisteredEmail(form.email.trim())
    } catch (err: unknown) {
      const msg = getApiErrorMessage(err, "Registration failed")
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    if (!registeredEmail) return
    setResending(true)
    try {
      await authService.resendVerification(registeredEmail)
      setResent(true)
    } catch {
      // Resend endpoint is intentionally generic/always-success server-side;
      // a failure here is almost always a network blip, not worth alarming over.
    } finally {
      setResending(false)
    }
  }

  if (registeredEmail) {
    return (
      <AuthLayout>
        <div className="rounded-2xl bg-white border border-[#F3E6D3] p-6 sm:p-8 shadow-sm text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#E6F7F1]">
            <MailCheck className="h-6 w-6 text-[#0B9C74]" />
          </div>
          <h1 className="mt-4 font-display text-xl font-bold">Check your email</h1>
          <p className="mt-2 text-sm leading-6 text-[#6b6b6b]">
            Your account is ready. We sent a verification link to <span className="font-bold text-[#1a1a1a]">{registeredEmail}</span> — confirm it
            to secure your account.
          </p>

          <button
            onClick={() => navigate("/dashboard")}
            className="mt-6 w-full rounded-full bg-[#0B9C74] py-3 text-sm font-bold text-white hover:bg-[#0a8a66] transition"
          >
            Go to dashboard
          </button>

          {resent ? (
            <p className="mt-4 text-sm font-bold text-[#0B9C74]">Verification link resent — check your inbox.</p>
          ) : (
            <button onClick={() => void handleResend()} disabled={resending} className="mt-4 text-sm font-bold text-[#0B9C74] hover:underline disabled:opacity-60">
              {resending ? "Resending..." : "Didn't get it? Resend link"}
            </button>
          )}
        </div>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout>
      <div className="rounded-2xl bg-white border border-[#F3E6D3] p-6 sm:p-8 shadow-sm">
        <h1 className="font-display text-2xl font-bold tracking-tight">Create your Cognicart account</h1>
        <p className="mt-1 text-sm text-[#6b6b6b]">Start selling online and on Telegram in 2 minutes. No card required.</p>

        {error && <div className="mt-4 rounded-xl bg-red-50 border border-red-200 px-3 py-2.5 text-sm text-red-700">{error}</div>}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <label className="block">
            <span className="text-xs font-bold text-[#1a1a1a]">Business name</span>
            <input value={form.businessName} onChange={(e) => setForm({ ...form, businessName: e.target.value })} placeholder="Glow by N" className="mt-1 w-full rounded-xl border border-[#F3E6D3] bg-white px-3 py-2.5 text-sm focus:border-[#0B9C74] focus:ring-2 focus:ring-[#0B9C74]/15 outline-none" />
          </label>
          <label className="block">
            <span className="text-xs font-bold text-[#1a1a1a]">Email</span>
            <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="you@example.com" className="mt-1 w-full rounded-xl border border-[#F3E6D3] bg-white px-3 py-2.5 text-sm focus:border-[#0B9C74] focus:ring-2 focus:ring-[#0B9C74]/15 outline-none" />
          </label>
          <label className="block">
            <span className="text-xs font-bold text-[#1a1a1a]">Phone (optional)</span>
            <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="080... " className="mt-1 w-full rounded-xl border border-[#F3E6D3] bg-white px-3 py-2.5 text-sm focus:border-[#0B9C74] focus:ring-2 focus:ring-[#0B9C74]/15 outline-none" />
          </label>
          <label className="block">
            <span className="text-xs font-bold text-[#1a1a1a]">Password</span>
            <PasswordInput value={form.password} onChange={(password) => setForm({ ...form, password })} placeholder="At least 6 characters" />
          </label>
          <label className="block">
            <span className="text-xs font-bold text-[#1a1a1a]">Confirm password</span>
            <PasswordInput value={form.confirm} onChange={(confirm) => setForm({ ...form, confirm })} placeholder="Repeat password" />
          </label>

          <button type="submit" disabled={loading} className="w-full rounded-full bg-[#0B9C74] py-3 text-sm font-bold text-white hover:bg-[#0a8a66] disabled:opacity-60 transition">
            {loading ? "Creating account..." : "Create account"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-[#6b6b6b]">
          Already have an account? <Link to="/login" className="font-bold text-[#0B9C74] hover:underline">Login</Link>
        </p>
      </div>
    </AuthLayout>
  )
}
