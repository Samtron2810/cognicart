import { Share2, Mail, Globe } from "lucide-react"
import { Link } from "react-router-dom"

export function Footer() {
  return (
    <footer className="bg-[#1a1a1a] text-white">
      <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid lg:grid-cols-[1.4fr_1fr_1fr_1.2fr] gap-8">
          <div>
            <Link to="/" className="flex items-center gap-2.5">
              <span className="h-8 w-8 rounded-lg bg-white text-[#1a1a1a] grid place-items-center font-bold text-sm">C</span>
              <span className="font-display font-bold text-lg">Cognicart</span>
            </Link>
            <p className="mt-3 text-sm leading-6 text-white/60 max-w-[320px]">WhatsApp AI Commerce for African sellers. Sell where your customers chat.</p>
            <div className="mt-4 flex gap-2">
              <a href="https://wa.me/2340000000000" target="_blank" rel="noreferrer" aria-label="Share" className="h-8 w-8 rounded-full bg-white/10 grid place-items-center hover:bg-white/20 transition">
                <Share2 className="h-4 w-4" />
              </a>
              <Link to="/contact" aria-label="Mail" className="h-8 w-8 rounded-full bg-white/10 grid place-items-center hover:bg-white/20 transition">
                <Mail className="h-4 w-4" />
              </Link>
              <Link to="/about" aria-label="Website" className="h-8 w-8 rounded-full bg-white/10 grid place-items-center hover:bg-white/20 transition">
                <Globe className="h-4 w-4" />
              </Link>
            </div>
          </div>

          <div>
            <div className="text-sm font-bold">Product</div>
            <ul className="mt-3 space-y-2 text-sm text-white/60">
              <li><a href="/#features" className="hover:text-white transition">Features</a></li>
              <li><Link to="/store" className="hover:text-white transition">Marketplace</Link></li>
              <li><a href="/#pricing" className="hover:text-white transition">Pricing</a></li>
              <li><Link to="/whatsapp-api" className="hover:text-white transition">WhatsApp API</Link></li>
              <li><Link to="/demo" className="hover:text-white transition">Watch demo</Link></li>
              <li><Link to="/search" className="hover:text-white transition">Search</Link></li>
            </ul>
          </div>

          <div>
            <div className="text-sm font-bold">Company</div>
            <ul className="mt-3 space-y-2 text-sm text-white/60">
              <li><Link to="/about" className="hover:text-white transition">About</Link></li>
              <li><Link to="/careers" className="hover:text-white transition">Careers</Link></li>
              <li><Link to="/contact" className="hover:text-white transition">Contact</Link></li>
              <li><Link to="/privacy" className="hover:text-white transition">Privacy</Link></li>
              <li><Link to="/terms" className="hover:text-white transition">Terms</Link></li>
              <li><Link to="/cart" className="hover:text-white transition">Cart</Link></li>
            </ul>
          </div>

          <div>
            <div className="text-sm font-bold">Get updates</div>
            <p className="mt-3 text-sm text-white/60">New sellers, tips and promo codes. No spam.</p>
            <form onSubmit={(e) => e.preventDefault()} className="mt-3 flex gap-2">
              <input placeholder="Your WhatsApp or email" className="flex-1 rounded-full bg-white/10 border border-white/10 px-4 py-2.5 text-sm placeholder:text-white/40 focus:outline-none focus:border-[#0B9C74]" />
              <button className="rounded-full bg-[#0B9C74] px-5 py-2.5 text-sm font-bold hover:bg-[#0a8a66] transition">Join</button>
            </form>
            <div className="mt-3 flex gap-2 text-xs text-white/50">
              <Link to="/login" className="hover:text-white underline">Login</Link>
              <span>•</span>
              <Link to="/register" className="hover:text-white underline">Register</Link>
              <span>•</span>
              <Link to="/dashboard" className="hover:text-white underline">Dashboard</Link>
            </div>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-white/50">
          <span>© 2026 Cognicart. Built in Port Harcourt for sellers everywhere.</span>
          <span>Made with love for WhatsApp • <Link to="/privacy" className="hover:text-white underline">Privacy and Terms</Link></span>
        </div>
      </div>
    </footer>
  )
}
