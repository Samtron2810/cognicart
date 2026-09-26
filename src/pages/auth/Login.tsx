import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { useAuth } from "../../context/AuthContext"
import { AuthLayout } from "../../layouts/AuthLayout"
import { authService } from "../../services/authService"

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: "", password: "" })
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!form.email || !form.password) {
      setError("Email and password are required")
      return
    }
    setLoading(true)
    try {
      await login(form)
      const seller = authService.getStoredSeller()
      if (seller?.role === "admin" || seller?.role === "platform_owner") {
        navigate("/admin")
      } else {
        navigate("/dashboard")
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : (err as { response?: { data?: { message?: string } } })?.response?.data?.message || "Login failed"
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  const fillDemo = (role: "seller" | "admin") => {
    if (role === "admin") {
      setForm({ email: "admin@cognicart.ng", password: "Admin123!" })
    } else {
      setForm({ email: "demo@cognicart.ng", password: "demo123" })
    }
  }

  return (
    <AuthLayout>
      <div className="rounded-2xl bg-white border border-[#F3E6D3] p-6 sm:p-8 shadow-sm">
        <h1 className="font-display text-2xl font-bold tracking-tight">Welcome back</h1>
        <p className="mt-1 text-sm text-[#6b6b6b]">Login to manage your WhatsApp store or platform.</p>

        {error && <div className="mt-4 rounded-xl bg-red-50 border border-red-200 px-3 py-2.5 text-sm text-red-700">{error}</div>}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <label className="block">
            <span className="text-xs font-bold text-[#1a1a1a]">Email</span>
            <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="you@example.com" className="mt-1 w-full rounded-xl border border-[#F3E6D3] bg-white px-3 py-2.5 text-sm focus:border-[#0B9C74] focus:ring-2 focus:ring-[#0B9C74]/15 outline-none" />
          </label>
          <label className="block">
            <span className="text-xs font-bold text-[#1a1a1a]">Password</span>
            <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Your password" className="mt-1 w-full rounded-xl border border-[#F3E6D3] bg-white px-3 py-2.5 text-sm focus:border-[#0B9C74] focus:ring-2 focus:ring-[#0B9C74]/15 outline-none" />
          </label>

          <button type="submit" disabled={loading} className="w-full rounded-full bg-[#1a1a1a] py-3 text-sm font-bold text-white hover:bg-black disabled:opacity-60 transition">
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        <div className="mt-4 grid grid-cols-2 gap-2">
          <button onClick={() => fillDemo("seller")} className="rounded-xl border border-[#F3E6D3] bg-[#FFFBF5] px-3 py-2 text-xs font-bold hover:bg-[#FFF1DA]">Fill seller demo</button>
          <button onClick={() => fillDemo("admin")} className="rounded-xl border border-[#F3E6D3] bg-[#1a1a1a] text-white px-3 py-2 text-xs font-bold hover:bg-black">Fill admin demo</button>
        </div>
        <div className="mt-2 rounded-xl bg-[#FFFBF5] border border-[#F3E6D3] p-3 text-xs leading-5 text-[#6b6b6b]">
          <div className="font-bold text-[#1a1a1a]">Demo accounts</div>
          Seller: demo@cognicart.ng / demo123 • Admin: admin@cognicart.ng / Admin123! • Owner: owner@cognicart.ng / Owner123!
        </div>

        <p className="mt-6 text-center text-sm text-[#6b6b6b]">
          No account? <Link to="/register" className="font-bold text-[#0B9C74] hover:underline">Create one</Link>
        </p>
      </div>
    </AuthLayout>
  )
}
