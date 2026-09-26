import { Outlet } from "react-router-dom"
import { Header } from "../components/layout/Header"
import { Footer } from "../components/layout/Footer"

export function PublicLayout() {
  return (
    <div className="min-h-screen bg-[#FFFBF5] text-[#1a1a1a] selection:bg-[#0B9C74]/20 flex flex-col">
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}
