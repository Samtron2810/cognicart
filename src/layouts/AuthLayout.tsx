import { Link } from "react-router-dom"
import { MessageCircle } from "lucide-react"
import type { ReactNode } from "react"

export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[#FFFBF5] flex flex-col">
      <header className="h-[64px] border-b border-[#F3E6D3] bg-white/80 backdrop-blur">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 h-full flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <span className="h-8 w-8 rounded-lg bg-[#0B9C74] grid place-items-center text-white">
              <MessageCircle className="h-4 w-4 fill-white/20" />
            </span>
            <span className="font-display font-bold text-lg">Cognicart</span>
          </Link>
          <Link to="/" className="text-sm font-medium text-[#6b6b6b] hover:text-[#1a1a1a]">
            Back to home
          </Link>
        </div>
      </header>

      <main className="flex-1 grid place-items-center px-4 py-10">
        <div className="w-full max-w-[420px]">{children}</div>
      </main>

      <footer className="py-6 text-center text-xs text-[#9a9a9a]">© 2026 Cognicart. Built in Port Harcourt.</footer>
    </div>
  )
}
