import { useEffect, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { Search, ShoppingBag, Menu, X, MessageCircle, ChevronDown } from "lucide-react"
import { useAuth } from "../../context/AuthContext"

export function Header() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const { isAuthenticated, user } = useAuth()
  const navigate = useNavigate()
  const [cartCount, setCartCount] = useState(0)

  useEffect(() => {
    const read = () => {
      try {
        const raw = localStorage.getItem("cognicart_cart")
        const arr = raw ? JSON.parse(raw) : []
        setCartCount(Array.isArray(arr) ? arr.length : 0)
      } catch {
        setCartCount(0)
      }
    }
    read()
    window.addEventListener("storage", read)
    const id = setInterval(read, 800)
    return () => {
      window.removeEventListener("storage", read)
      clearInterval(id)
    }
  }, [])

  const scrollTo = (id: string) => {
    const el = document.getElementById(id)
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" })
    } else {
      navigate(`/#${id}`)
      setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: "smooth" }), 100)
    }
    setMobileOpen(false)
  }

  return (
    <header className="sticky top-0 z-50 bg-[#FFFBF5]/90 backdrop-blur-md border-b border-[#F3E6D3]">
      <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8">
        <div className="flex h-[72px] items-center justify-between gap-6">
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center gap-2.5">
              <span className="h-9 w-9 rounded-xl bg-[#0B9C74] flex items-center justify-center text-white shadow-sm">
                <MessageCircle className="h-5 w-5 fill-white/20" />
              </span>
              <span className="font-display text-[22px] font-bold tracking-tight leading-none">Cognicart</span>
              <span className="hidden sm:block text-[11px] font-bold tracking-widest text-[#0B9C74] border border-[#0B9C74]/20 bg-[#E6F7F1] px-1.5 py-0.5 rounded">WHATSAPP AI</span>
            </Link>
            <nav className="hidden lg:flex items-center gap-1 text-[14px] font-medium text-[#2b2b2b]">
              <button onClick={() => scrollTo("features")} className="px-3 py-2 rounded-full hover:bg-[#FFF1DA] transition">Features</button>
              <Link to="/store" className="px-3 py-2 rounded-full hover:bg-[#FFF1DA] transition flex items-center gap-1">
                Marketplace <ChevronDown className="h-3.5 w-3.5 opacity-60" />
              </Link>
              <button onClick={() => scrollTo("sellers")} className="px-3 py-2 rounded-full hover:bg-[#FFF1DA] transition">Sellers</button>
              <button onClick={() => scrollTo("pricing")} className="px-3 py-2 rounded-full hover:bg-[#FFF1DA] transition">Pricing</button>
              <Link to="/contact" className="px-3 py-2 rounded-full hover:bg-[#FFF1DA] transition">Contact</Link>
            </nav>
          </div>

          <div className="hidden lg:flex items-center gap-3">
            <Link to="/search" aria-label="Search" className="h-10 w-10 grid place-items-center rounded-full bg-white border border-[#F3E6D3] hover:bg-[#FFF1DA] transition">
              <Search className="h-4 w-4 text-[#6b6b6b]" />
            </Link>
            <Link to="/cart" aria-label="Cart" className="relative h-10 w-10 grid place-items-center rounded-full bg-white border border-[#F3E6D3] hover:bg-[#FFF1DA] transition">
              <ShoppingBag className="h-4 w-4 text-[#2b2b2b]" />
              {cartCount > 0 && <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-[#E85D26] text-white text-[11px] font-bold grid place-items-center">{cartCount}</span>}
            </Link>
            {isAuthenticated ? (
              <Link to="/dashboard" className="ml-1 inline-flex items-center justify-center rounded-full bg-[#1a1a1a] px-6 py-2.5 text-sm font-bold text-white hover:bg-black transition">
                Dashboard{user?.businessName ? ` • ${user.businessName.split(" ")[0]}` : ""}
              </Link>
            ) : (
              <>
                <Link to="/login" className="text-sm font-bold px-3 py-2 hover:bg-[#FFF1DA] rounded-full">Login</Link>
                <Link to="/register" className="inline-flex items-center justify-center rounded-full bg-[#0B9C74] px-6 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-[#0a8a66] transition">
                  Start Selling
                </Link>
              </>
            )}
          </div>

          <button onClick={() => setMobileOpen(!mobileOpen)} className="lg:hidden h-10 w-10 grid place-items-center rounded-full bg-white border border-[#F3E6D3]">
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {mobileOpen && (
          <div className="lg:hidden pb-6 border-t border-[#F3E6D3] pt-4 bg-[#FFFBF5]">
            <nav className="grid gap-1 text-sm font-medium">
              <button onClick={() => scrollTo("features")} className="text-left px-3 py-2.5 rounded-xl bg-white border border-[#F3E6D3]">Features</button>
              <Link to="/store" onClick={() => setMobileOpen(false)} className="px-3 py-2.5 rounded-xl bg-white border border-[#F3E6D3]">Marketplace</Link>
              <button onClick={() => scrollTo("sellers")} className="text-left px-3 py-2.5 rounded-xl bg-white border border-[#F3E6D3]">Sellers</button>
              <button onClick={() => scrollTo("pricing")} className="text-left px-3 py-2.5 rounded-xl bg-white border border-[#F3E6D3]">Pricing</button>
              <Link to="/contact" onClick={() => setMobileOpen(false)} className="px-3 py-2.5 rounded-xl bg-white border border-[#F3E6D3]">Contact</Link>
              <div className="mt-2 grid gap-2">
                <Link to="/search" onClick={() => setMobileOpen(false)} className="inline-flex justify-center items-center gap-2 rounded-full bg-white border border-[#F3E6D3] px-6 py-3 font-bold">Search</Link>
                <Link to="/cart" onClick={() => setMobileOpen(false)} className="inline-flex justify-center items-center gap-2 rounded-full bg-white border border-[#F3E6D3] px-6 py-3 font-bold">Cart {cartCount > 0 ? `(${cartCount})` : ""}</Link>
                {isAuthenticated ? (
                  <Link to="/dashboard" onClick={() => setMobileOpen(false)} className="inline-flex justify-center rounded-full bg-[#1a1a1a] px-6 py-3 font-bold text-white">Dashboard</Link>
                ) : (
                  <>
                    <Link to="/login" onClick={() => setMobileOpen(false)} className="inline-flex justify-center rounded-full bg-white border border-[#F3E6D3] px-6 py-3 font-bold">Login</Link>
                    <Link to="/register" onClick={() => setMobileOpen(false)} className="inline-flex justify-center rounded-full bg-[#0B9C74] px-6 py-3 font-bold text-white">Start Selling</Link>
                  </>
                )}
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  )
}
