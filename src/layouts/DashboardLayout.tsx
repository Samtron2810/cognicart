import { NavLink, Outlet, useNavigate } from "react-router-dom"
import { MessageCircle, LayoutDashboard, Package, ShoppingCart, Users, Settings, LogOut, Menu, X, Store, Wallet, MessageSquare, Shield } from "lucide-react"
import { useAuth } from "../context/AuthContext"
import { useState } from "react"

const nav = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/dashboard/products", label: "Products", icon: Package },
  { to: "/dashboard/orders", label: "Orders", icon: ShoppingCart },
  { to: "/dashboard/customers", label: "Customers", icon: Users },
  { to: "/dashboard/revenue", label: "Revenue", icon: Wallet },
  { to: "/dashboard/whatsapp", label: "WhatsApp", icon: MessageSquare },
  { to: "/store", label: "Storefront", icon: Store },
  { to: "/dashboard/settings", label: "Settings", icon: Settings },
]

export function DashboardLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)

  const handleLogout = () => {
    logout()
    navigate("/login")
  }

  return (
    <div className="min-h-screen bg-[#FFFBF5] text-[#1a1a1a]">
      <header className="sticky top-0 z-40 h-[64px] bg-white border-b border-[#F3E6D3] flex items-center">
        <div className="mx-auto max-w-[1400px] w-full px-4 sm:px-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button onClick={() => setOpen(!open)} className="lg:hidden h-9 w-9 grid place-items-center rounded-xl border border-[#F3E6D3] bg-white">
              {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>
            <div className="flex items-center gap-2.5">
              <span className="h-8 w-8 rounded-lg bg-[#0B9C74] grid place-items-center text-white">
                <MessageCircle className="h-4 w-4 fill-white/20" />
              </span>
              <span className="font-display font-bold">Cognicart</span>
              <span className="hidden sm:inline-flex text-[11px] font-bold tracking-widest text-[#0B9C74] bg-[#E6F7F1] px-2 py-0.5 rounded">SELLER</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:block text-right">
              <div className="text-sm font-bold leading-none">{user?.businessName || "Seller"}</div>
              <div className="text-xs text-[#6b6b6b]">{user?.email}</div>
            </div>
            <div className="h-9 w-9 rounded-full bg-[#1a1a1a] text-white grid place-items-center text-sm font-bold">{user?.businessName?.charAt(0)?.toUpperCase() || "S"}</div>
            <button onClick={handleLogout} className="hidden sm:inline-flex items-center gap-2 rounded-full border border-[#F3E6D3] bg-white px-3 py-1.5 text-sm font-medium hover:bg-[#FFF1DA]">
              <LogOut className="h-4 w-4" /> Logout
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-[1400px] px-4 sm:px-6 py-6 grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-6">
        <aside className={`${open ? "block" : "hidden"} lg:block`}>
          <div className="sticky top-[80px] rounded-2xl bg-white border border-[#F3E6D3] p-3">
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
              {(user?.role === "admin" || user?.role === "platform_owner") && (
                <NavLink
                  to="/admin"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold bg-[#E6F7F1] text-[#0B9C74] border border-[#0B9C74]/20 hover:bg-[#0B9C74] hover:text-white transition"
                >
                  <Shield className="h-4 w-4" /> Platform Admin
                </NavLink>
              )}
            </nav>
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
