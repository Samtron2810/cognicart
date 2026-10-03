import { useState } from "react"
import { Link, useNavigate, useSearchParams } from "react-router-dom"
import { CheckCircle2 } from "lucide-react"
import { useAuth } from "../../context/AuthContext"
import { PasswordInput } from "../../components/forms/PasswordInput"
import { AuthLayout } from "../../layouts/AuthLayout"
import { authService } from "../../services/authService"
import { getApiErrorMessage } from "../../services/apiError"
import { isStrongPassword } from "../../utils/validation"

export default function ResetPassword() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get("t") || ""
  const navigate = useNavigate()
  const { refreshUser } = useAuth()

  const [form, setForm] = useState({ password: "", confirm: "" })
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!token) {
      setError("This reset link is missing its token. Request a new one.")
      return
    }
    if (!isStrongPassword(form.password)) {
      setError("Password must be 8+ characters with an uppercase letter and a number")
      return
    }
    if (form.password !== form.confirm) {
      setError("Passwords do not match")
      return
    }
    setLoading(true)
    try {
      const { token: jwt, seller } = await authService.resetPassword(token, form.password)
      authService.persist(jwt, seller)
      await refreshUser()
      setDone(true)
      setTimeout(() => navigate("/dashboard"), 1500)
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, "That link is invalid or has expired."))
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout>
      <div className="rounded-2xl bg-white border border-[#F3E6D3] p-6 sm:p-8 shadow-sm">
        <h1 className="font-display text-2xl font-bold tracking-tight">Set a new password</h1>
        <p className="mt-1 text-sm text-[#6b6b6b]">Choose a new password for your Cognicart account.</p>

        {error && <div className="mt-4 rounded-xl bg-red-50 border border-red-200 px-3 py-2.5 text-sm text-red-700">{error}</div>}

        {done ? (
          <div className="mt-6 flex items-center gap-2 rounded-xl border border-[#0B9C74]/20 bg-[#E6F7F1] px-3 py-2.5 text-sm font-bold text-[#0B9C74]">
            <CheckCircle2 className="h-4 w-4" /> Password updated — taking you to your dashboard...
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <label className="block">
              <span className="text-xs font-bold text-[#1a1a1a]">New password</span>
              <PasswordInput value={form.password} onChange={(password) => setForm({ ...form, password })} placeholder="8+ characters, 1 uppercase, 1 number" />
            </label>
            <label className="block">
              <span className="text-xs font-bold text-[#1a1a1a]">Confirm new password</span>
              <PasswordInput value={form.confirm} onChange={(confirm) => setForm({ ...form, confirm })} placeholder="Repeat password" />
            </label>

            <button type="submit" disabled={loading || !token} className="w-full rounded-full bg-[#0B9C74] py-3 text-sm font-bold text-white hover:bg-[#0a8a66] disabled:opacity-60 transition">
              {loading ? "Resetting..." : "Reset password"}
            </button>
          </form>
        )}

        <p className="mt-6 text-center text-sm text-[#6b6b6b]">
          <Link to="/forgot-password" className="font-bold text-[#0B9C74] hover:underline">Request a new link</Link>
        </p>
      </div>
    </AuthLayout>
  )
}
