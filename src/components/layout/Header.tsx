import { useState } from "react";
import { Link } from "react-router-dom";
import { ShoppingBag, Menu, X } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useCart } from "../../context/CartContext";
import { GlobalSearch } from "../search/GlobalSearch";

export function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { isAuthenticated, user } = useAuth();
  const { items } = useCart();
  const cartCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <header className="sticky top-0 z-50 bg-[#FFFBF5]/90 backdrop-blur-md border-b border-[#F3E6D3]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-6">
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center gap-2.5">
              <img src="/logo.png" alt="" aria-hidden="true" width={36} height={36} className="h-9 w-9 object-contain" />
              <span className="font-display text-[22px] font-bold tracking-tight leading-none">
                Chatstand
              </span>
              <span className="hidden sm:block text-[11px] font-bold tracking-widest text-[#0B9C74] border border-[#0B9C74]/25 bg-[#E6F7F1] px-1.5 py-0.5 rounded">
                AI COMMERCE
              </span>
            </Link>
            {/* Global search: reachable from every page, which is the point
                of the "easy navigation" requirement. */}
            <div className="hidden min-w-0 flex-1 px-6 lg:block lg:max-w-sm">
              <GlobalSearch />
            </div>

            {/* Buyer-facing destinations only. The landing-page anchors
                (Features / Sellers / Pricing) were dropped: they scrolled
                nowhere from any route except "/", and seller acquisition is
                already covered by the Start Selling button. */}
            <nav className="hidden lg:flex items-center gap-1 text-[14px] font-medium text-[#2b2b2b]">
              <Link
                to="/stores"
                className="px-3 py-2 rounded-full hover:bg-[#FFF1DA] transition"
              >
                Stores
              </Link>
              <Link
                to="/track"
                className="px-3 py-2 rounded-full hover:bg-[#FFF1DA] transition"
              >
                Track order
              </Link>
              <Link
                to="/contact"
                className="px-3 py-2 rounded-full hover:bg-[#FFF1DA] transition"
              >
                Contact
              </Link>
            </nav>
          </div>

          <div className="hidden lg:flex items-center gap-3">
            <Link
              to="/cart"
              aria-label="Cart"
              className="relative h-10 w-10 grid place-items-center rounded-full bg-white border border-[#F3E6D3] hover:bg-[#FFF1DA] transition"
            >
              <ShoppingBag className="h-4 w-4 text-[#2b2b2b]" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-[#E85D26] text-white text-[11px] font-bold grid place-items-center">
                  {cartCount}
                </span>
              )}
            </Link>
            {isAuthenticated ? (
              <Link
                to="/dashboard"
                className="ml-1 inline-flex items-center justify-center rounded-full bg-[#1a1a1a] px-6 py-2.5 text-sm font-bold text-white hover:bg-black transition"
              >
                Dashboard
                {user?.businessName
                  ? ` • ${user.businessName.split(" ")[0]}`
                  : ""}
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-sm font-bold px-3 py-2 hover:bg-[#FFF1DA] rounded-full"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="inline-flex items-center justify-center rounded-full bg-[#0B9C74] px-6 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-[#0a8a66] transition"
                >
                  Start Selling
                </Link>
              </>
            )}
          </div>

          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="lg:hidden h-10 w-10 grid place-items-center rounded-full bg-white border border-[#F3E6D3]"
          >
            {mobileOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </button>
        </div>

        {mobileOpen && (
          <div className="lg:hidden pb-6 border-t border-[#F3E6D3] pt-4 bg-[#FFFBF5]">
            <div className="mb-3 lg:hidden">
              <GlobalSearch onNavigate={() => setMobileOpen(false)} />
            </div>

            <nav className="grid gap-1 text-sm font-medium">
              <Link
                to="/stores"
                onClick={() => setMobileOpen(false)}
                className="px-3 py-2.5 rounded-xl bg-white border border-[#F3E6D3]"
              >
                Stores
              </Link>
              <Link
                to="/track"
                onClick={() => setMobileOpen(false)}
                className="px-3 py-2.5 rounded-xl bg-white border border-[#F3E6D3]"
              >
                Track order
              </Link>
              <Link
                to="/contact"
                onClick={() => setMobileOpen(false)}
                className="px-3 py-2.5 rounded-xl bg-white border border-[#F3E6D3]"
              >
                Contact
              </Link>
              <div className="mt-2 grid gap-2">
                <Link
                  to="/search"
                  onClick={() => setMobileOpen(false)}
                  className="inline-flex justify-center items-center gap-2 rounded-full bg-white border border-[#F3E6D3] px-6 py-3 font-bold"
                >
                  Search
                </Link>
                <Link
                  to="/cart"
                  onClick={() => setMobileOpen(false)}
                  className="inline-flex justify-center items-center gap-2 rounded-full bg-white border border-[#F3E6D3] px-6 py-3 font-bold"
                >
                  Cart {cartCount > 0 ? `(${cartCount})` : ""}
                </Link>
                {isAuthenticated ? (
                  <Link
                    to="/dashboard"
                    onClick={() => setMobileOpen(false)}
                    className="inline-flex justify-center rounded-full bg-[#1a1a1a] px-6 py-3 font-bold text-white"
                  >
                    Dashboard
                  </Link>
                ) : (
                  <>
                    <Link
                      to="/login"
                      onClick={() => setMobileOpen(false)}
                      className="inline-flex justify-center rounded-full bg-white border border-[#F3E6D3] px-6 py-3 font-bold"
                    >
                      Login
                    </Link>
                    <Link
                      to="/register"
                      onClick={() => setMobileOpen(false)}
                      className="inline-flex justify-center rounded-full bg-[#0B9C74] px-6 py-3 font-bold text-white"
                    >
                      Start Selling
                    </Link>
                  </>
                )}
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
