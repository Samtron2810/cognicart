import { useEffect, useState } from "react"
import { Link, useSearchParams } from "react-router-dom"
import { Heart, ShoppingBag, Star, SlidersHorizontal, Store, MapPin } from "lucide-react"
import { productService } from "../../services/productService"
import { PRODUCT_CATEGORIES } from "../../types/product"
import type { Product } from "../../types/product"
import { getEffectivePrice, getDisplayPrice } from "../../types/product"
import { useSEO } from "../../hooks/useSEO"

type SellerCard = { id: string; businessName: string; location?: string; productsCount: number }

export default function Storefront() {
  const [searchParams, setSearchParams] = useSearchParams()
  const category = searchParams.get("category") || ""
  const q = searchParams.get("q") || ""
  const [products, setProducts] = useState<Product[]>([])
  const [sellers, setSellers] = useState<SellerCard[]>([])
  const [loading, setLoading] = useState(true)

  const title = q ? `Search "${q}" — Storefront | Cognicart` : category ? `${category} — Storefront | Cognicart` : "Storefront — WhatsApp AI Commerce | Cognicart"
  const desc = "Public catalog on Cognicart. Same price and stock WhatsApp AI uses. Order on WhatsApp in one message."
  const canonical = typeof window !== "undefined" ? window.location.href : "https://cognicart.ng/store"

  useSEO({
    title,
    description: desc,
    canonical,
    ogTitle: title,
    ogDescription: desc,
    ogImage: "https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=1200&h=630&fit=crop",
    ogUrl: canonical,
    ogType: "website",
  })

  const load = async () => {
    setLoading(true)
    const data = await productService.listPublic({ search: q || undefined, category: category || undefined })
    setProducts(data.filter((p) => p.isActive))
    // sellers for directory
    try {
      const sellersRaw = localStorage.getItem("cognicart_mock_sellers")
      const sellersParsed = sellersRaw ? JSON.parse(sellersRaw) : []
      const prodsRaw = localStorage.getItem("cognicart_products")
      const allProds = prodsRaw ? JSON.parse(prodsRaw) : []
      const bizRaw = localStorage.getItem("cognicart_business")
      const businesses = bizRaw ? JSON.parse(bizRaw) : []
      const cards: SellerCard[] = sellersParsed.slice(0, 8).map((s: { id: string; businessName: string }) => {
        const count = allProds.filter((p: { sellerId: string; isActive: boolean }) => p.sellerId === s.id && p.isActive).length
        const biz = businesses.find((b: { sellerId: string; location?: string }) => b.sellerId === s.id)
        return { id: s.id, businessName: s.businessName, location: biz?.location, productsCount: count }
      }).filter((c: SellerCard) => c.productsCount > 0)
      setSellers(cards)
    } catch {}
    setLoading(false)
  }

  useEffect(() => {
    productService.seedDemo()
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category, q])

  return (
    <div className="min-h-screen bg-[#FFFBF5]">
      <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-[34px] sm:text-[40px] font-bold tracking-tight leading-none">Storefront</h1>
            <p className="mt-2 text-sm text-[#6b6b6b]">Public catalog. Prices and stock are the same WhatsApp AI uses. Chat to buy on WhatsApp. SEO-friendly store and product pages per seller.</p>
          </div>
          <Link to="/cart" className="hidden lg:inline-flex items-center gap-2 rounded-full bg-[#1a1a1a] px-5 py-2.5 text-sm font-bold text-white hover:bg-black">
            <ShoppingBag className="h-4 w-4" /> View cart
          </Link>
        </div>

        {sellers.length > 0 && (
          <div className="mt-6 rounded-2xl bg-white border border-[#F3E6D3] p-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold flex items-center gap-2"><Store className="h-4 w-4 text-[#0B9C74]" /> Seller stores — SEO directory</h2>
              <Link to="/store" className="text-xs font-bold text-[#0B9C74] hover:underline">All products</Link>
            </div>
            <div className="mt-3 grid grid-cols-2 lg:grid-cols-4 gap-3">
              {sellers.map((s) => (
                <Link key={s.id} to={`/store/seller/${s.id}`} className="rounded-xl bg-[#FFFBF5] border border-[#F3E6D3] p-3 hover:bg-white hover:shadow-sm transition">
                  <div className="text-sm font-bold leading-tight line-clamp-1">{s.businessName}</div>
                  <div className="text-xs text-[#6b6b6b] flex items-center gap-1 mt-1"><MapPin className="h-3 w-3" /> {s.location || "Nigeria"} • {s.productsCount} products</div>
                  <div className="mt-2 text-xs font-bold text-[#0B9C74]">Visit store →</div>
                </Link>
              ))}
            </div>
          </div>
        )}

        <div className="mt-6 rounded-2xl bg-white border border-[#F3E6D3] p-4 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <input
              value={q}
              onChange={(e) => {
                const v = e.target.value
                const next = new URLSearchParams(searchParams)
                if (v) next.set("q", v)
                else next.delete("q")
                setSearchParams(next, { replace: true })
              }}
              placeholder="Search products, e.g. serum, tote, hoodie"
              className="w-full rounded-xl border border-[#F3E6D3] px-3 py-2.5 text-sm focus:border-[#0B9C74] focus:ring-2 focus:ring-[#0B9C74]/15 outline-none"
            />
          </div>
          <div className="flex items-center gap-2 overflow-auto">
            <span className="hidden sm:inline-flex items-center gap-1 text-xs font-bold text-[#6b6b6b]">
              <SlidersHorizontal className="h-4 w-4" /> Filter
            </span>
            <button onClick={() => setSearchParams((p) => { const n = new URLSearchParams(p); n.delete("category"); return n })} className={`rounded-full px-4 py-2 text-sm font-bold border ${!category ? "bg-[#1a1a1a] text-white border-[#1a1a1a]" : "bg-white border-[#F3E6D3] hover:bg-[#FFF1DA]"}`}>All</button>
            {PRODUCT_CATEGORIES.map((c) => (
              <button key={c} onClick={() => setSearchParams((p) => { const n = new URLSearchParams(p); n.set("category", c); return n })} className={`rounded-full px-4 py-2 text-sm font-bold border whitespace-nowrap ${category === c ? "bg-[#1a1a1a] text-white border-[#1a1a1a]" : "bg-white border-[#F3E6D3] hover:bg-[#FFF1DA]"}`}>{c}</button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="grid place-items-center py-16"><div className="h-8 w-8 rounded-full border-2 border-[#0B9C74] border-t-transparent animate-spin" /></div>
        ) : products.length === 0 ? (
          <div className="mt-6 rounded-2xl bg-white border border-[#F3E6D3] p-10 text-center">
            <div className="font-bold">No products found</div>
            <div className="text-sm text-[#6b6b6b]">Try another category or search.</div>
          </div>
        ) : (
          <div className="mt-6 grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
            {products.map((p) => (
              <Link key={p.id} to={`/store/${p.id}`} className="group relative rounded-[20px] bg-white border border-[#F3E6D3] overflow-hidden hover:shadow-[0_12px_30px_rgba(0,0,0,0.08)] hover:-translate-y-0.5 transition">
                <div className="absolute left-2 top-2 z-10 flex items-center gap-1.5">
                  <span className="h-6 w-6 rounded-full bg-white border border-[#F3E6D3] grid place-items-center shadow-sm"><Star className="h-3 w-3 fill-[#0B9C74] text-[#0B9C74]" /></span>
                  {p.stock <= 5 && p.stock > 0 && <span className="rounded-full bg-[#FFF1DA] border border-[#F3E6D3] px-2 py-1 text-[11px] font-bold text-[#E85D26]">Low stock</span>}
                  {p.stock === 0 && <span className="rounded-full bg-red-50 border border-red-200 px-2 py-1 text-[11px] font-bold text-red-700">Out</span>}
                </div>
                <button onClick={(e) => { e.preventDefault(); }} aria-label="Wishlist" className="absolute right-2 top-2 z-10 h-8 w-8 rounded-full bg-white border border-[#F3E6D3] grid place-items-center shadow-sm hover:bg-[#FFF1DA]"><Heart className="h-4 w-4" /></button>
                <div className="aspect-square bg-[#FFFBF5] p-4 flex items-center justify-center"><img src={p.images[0]} alt={p.name} className="h-full w-full object-contain mix-blend-multiply group-hover:scale-[1.02] transition" /></div>
                <div className="p-3.5">
                  <div className="text-[13px] font-bold leading-tight line-clamp-1">{p.name}</div>
                  <div className="mt-1 text-xs text-[#6b6b6b] line-clamp-1">{p.category} • {p.description.slice(0, 44)}{p.variants?.length ? ` • ${p.variants.length} variants` : ""}</div>
                  <div className="mt-2 flex items-center justify-between">
                    {(() => { const d = getDisplayPrice(p); const ep = getEffectivePrice(p); return d.hasDiscount ? <span className="flex items-center gap-1"><span className="text-sm font-bold text-[#E85D26]">₦{ep.toLocaleString()}</span><span className="text-xs line-through text-[#9a9a9a]">₦{d.original.toLocaleString()}</span></span> : <span className="text-sm font-bold">₦{ep.toLocaleString()}</span> })()}
                    <span className="h-8 w-8 rounded-full bg-[#1a1a1a] text-white grid place-items-center"><ShoppingBag className="h-4 w-4" /></span>
                  </div>
                  <div className="mt-2 text-xs text-[#0B9C74] font-bold">View • SEO product page →</div>
                </div>
              </Link>
            ))}
          </div>
        )}

        <div className="mt-8 rounded-2xl bg-white border border-[#F3E6D3] p-6 flex flex-col lg:flex-row items-center justify-between gap-4">
          <div className="text-sm"><span className="font-bold">Prefer to chat?</span> <span className="text-[#6b6b6b]">Message the seller on WhatsApp and AI will check the same stock and price.</span></div>
          <Link to="/contact" className="rounded-full bg-[#0B9C74] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#0a8a66]">Talk to founder</Link>
        </div>
      </div>
    </div>
  )
}
