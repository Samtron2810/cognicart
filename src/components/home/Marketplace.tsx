import { ArrowRight, ShoppingBag } from "lucide-react"
import { Link } from "react-router-dom"

/** The marketplace always loads its catalog from the backend on the storefront route. */
export function Marketplace() {
  return <section id="marketplace" className="bg-[#FFFBF5]"><div className="mx-auto max-w-[1280px] px-4 py-10 sm:px-6 lg:px-8 lg:py-14"><div className="rounded-[28px] border border-[#F3E6D3] bg-white p-8 text-center sm:p-12"><div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-[#E6F7F1] text-[#0B9C74]"><ShoppingBag className="h-6 w-6"/></div><h2 className="mt-4 font-display text-[34px] font-bold tracking-tight">Marketplace</h2><p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-[#6b6b6b]">Explore products published by real businesses. Catalog availability, pricing, and inventory are loaded directly from the backend.</p><Link to="/store" className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#1a1a1a] px-6 py-3 text-sm font-bold text-white hover:bg-black">Browse live stores <ArrowRight className="h-4 w-4"/></Link></div></div></section>
}
