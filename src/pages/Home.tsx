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
    title: "Cognicart — WhatsApp AI Commerce for African Sellers",
    description: "Sell where your customers chat. AI knows your products, prices and stock and replies inside WhatsApp in 3 seconds. No website needed.",
    ogTitle: "Cognicart — WhatsApp AI Commerce",
    ogDescription: "Give every seller an AI salesperson on WhatsApp. Search, price, stock, orders — all inside WhatsApp.",
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
