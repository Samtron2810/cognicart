import { NavLink, Outlet, useNavigate } from "react-router-dom"
import { LayoutDashboard, Users, ShoppingCart, UserCircle, Wallet, CreditCard, MessageSquare, Crown, BarChart3, Settings, LogOut, Menu, X, Shield } from "lucide-react"
import { useAuth } from "../context/AuthContext"
import { useState } from "react"

const nav = [
  { to: "/admin", label: "Overview", icon: LayoutDashboard, end: true },
  { to: "/admin/sellers", label: "Sellers", icon: Users },
  { to: "/admin/orders", label: "Orders", icon: ShoppingCart },
  { to: "/admin/customers", label: "Customers", icon: UserCircle },
  { to: "/admin/revenue", label: "Revenue", icon: Wallet },
  { to: "/admin/payments", label: "Payments", icon: CreditCard },
  { to: "/admin/whatsapp", label: "WhatsApp", icon: MessageSquare },
  { to: "/admin/subscriptions", label: "Subscriptions", icon: Crown },
  { to: "/admin/reports", label: "Reports", icon: BarChart3 },
  { to: "/admin/settings", label: "Settings", icon: Settings },
]

export function AdminLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)

  const handleLogout = () => {
    logout()
    navigate("/login")
  }

  return (
    <div className="min-h-screen bg-[#FFFBF5] text-[#1a1a1a]">
      <header className="sticky top-0 z-40 h-[64px] bg-[#1a1a1a] text-white flex items-center">
        <div className="mx-auto max-w-[1400px] w-full px-4 sm:px-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button onClick={() => setOpen(!open)} className="lg:hidden h-9 w-9 grid place-items-center rounded-xl border border-white/20 bg-white/10">
              {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>
            <div className="flex items-center gap-2.5">
              <span className="h-8 w-8 rounded-lg bg-[#0B9C74] grid place-items-center text-white">
                <Shield className="h-4 w-4" />
              </span>
              <span className="font-display font-bold">Cognicart</span>
              <span className="hidden sm:inline-flex text-[11px] font-bold tracking-widest bg-[#E6F7F1] text-[#0B9C74] px-2 py-0.5 rounded">PLATFORM</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:block text-right">
              <div className="text-sm font-bold leading-none">{user?.businessName || "Platform"}</div>
              <div className="text-xs text-white/60">{user?.email} • {user?.role}</div>
            </div>
            <div className="h-9 w-9 rounded-full bg-white text-[#1a1a1a] grid place-items-center text-sm font-bold">{user?.businessName?.charAt(0)?.toUpperCase() || "A"}</div>
            <button onClick={handleLogout} className="hidden sm:inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-sm font-medium hover:bg-white/20">
              <LogOut className="h-4 w-4" /> Logout
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-[1400px] px-4 sm:px-6 py-6 grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-6">
        <aside className={`${open ? "block" : "hidden"} lg:block`}>
          <div className="sticky top-[80px] rounded-2xl bg-white border border-[#F3E6D3] p-3">
            <div className="px-3 py-2 text-[11px] font-bold tracking-widest text-[#9a9a9a]">PLATFORM OWNER</div>
            <nav className="grid gap-1">
              {nav.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  onClick={() => setOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${isActive ? "bg-[#1a1a1a] text-white" : "text-[#2b2b2b] hover:bg-[#FFF1DA]"}`
                  }
                >
                  <item.icon className="h-4 w-4" /> {item.label}
                </NavLink>
              ))}
            </nav>
            <div className="mt-3 rounded-xl bg-[#FFFBF5] border border-[#F3E6D3] p-3 text-xs leading-5 text-[#6b6b6b]">
              <div className="font-bold text-[#1a1a1a]">admin@cognicart.ng / Admin123!</div>
              <div>owner@cognicart.ng / Owner123!</div>
            </div>
            <button onClick={handleLogout} className="mt-3 w-full lg:hidden flex items-center gap-2 rounded-xl border border-[#F3E6D3] px-3 py-2.5 text-sm font-medium">
              <LogOut className="h-4 w-4" /> Logout
            </button>
          </div>
        </aside>

        <main className="min-w-0">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
