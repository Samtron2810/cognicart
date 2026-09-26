import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { useAuth } from "../../context/AuthContext"
import { AuthLayout } from "../../layouts/AuthLayout"

export default function Register() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ businessName: "", email: "", phone: "", password: "", confirm: "" })
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

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
      navigate("/dashboard")
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : (err as { response?: { data?: { message?: string } } })?.response?.data?.message || "Registration failed"
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout>
      <div className="rounded-2xl bg-white border border-[#F3E6D3] p-6 sm:p-8 shadow-sm">
        <h1 className="font-display text-2xl font-bold tracking-tight">Create your Cognicart account</h1>
        <p className="mt-1 text-sm text-[#6b6b6b]">Start selling on WhatsApp in 2 minutes. No card required.</p>

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
            <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="At least 6 characters" className="mt-1 w-full rounded-xl border border-[#F3E6D3] bg-white px-3 py-2.5 text-sm focus:border-[#0B9C74] focus:ring-2 focus:ring-[#0B9C74]/15 outline-none" />
          </label>
          <label className="block">
            <span className="text-xs font-bold text-[#1a1a1a]">Confirm password</span>
            <input type="password" value={form.confirm} onChange={(e) => setForm({ ...form, confirm: e.target.value })} placeholder="Repeat password" className="mt-1 w-full rounded-xl border border-[#F3E6D3] bg-white px-3 py-2.5 text-sm focus:border-[#0B9C74] focus:ring-2 focus:ring-[#0B9C74]/15 outline-none" />
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
