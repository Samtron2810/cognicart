import { Header } from "../components/layout/Header"
import { Footer } from "../components/layout/Footer"
import { Hero } from "../components/home/Hero"
import { Features } from "../components/home/Features"
import { Marketplace } from "../components/home/Marketplace"
import { HowItWorks } from "../components/home/HowItWorks"
import { Pricing } from "../components/home/Pricing"
import { FinalCTA } from "../components/home/FinalCTA"
import { useSEO } from "../hooks/useSEO"

export default function Home() {
  useSEO({
    title: "Cognicart — Telegram AI Commerce for African Sellers",
    description: "Sell online and in chat. Your Telegram bot answers buyers from your live catalog, your storefront takes guest checkout, and every order lands in one dashboard.",
    ogTitle: "Cognicart — Telegram AI Commerce",
    ogDescription: "Give every seller an AI salesperson on Telegram plus a public storefront. Search, price, stock, orders — one unified dashboard.",
    ogImage: "https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=1200&h=630&fit=crop",
    ogUrl: typeof window !== "undefined" ? window.location.origin : "https://cognicart.ng",
  })
  return (
    <div className="min-h-screen bg-[#FFFBF5] text-[#1a1a1a] selection:bg-[#0B9C74]/20">
      <Header />
      <main>
        <Hero />
        <Features />
        <Marketplace />
        <HowItWorks />
        <Pricing />
        <FinalCTA />
      </main>
      <Footer />
    </div>
  )
}
