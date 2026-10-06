import { useEffect, useState } from "react"
import { Link, useNavigate, useSearchParams } from "react-router-dom"
import { Heart, ShoppingBag, Star, SlidersHorizontal, Store } from "lucide-react"
import { productService } from "../../services/productService"
import { PRODUCT_CATEGORIES } from "../../types/product"
import type { Product } from "../../types/product"
import type { StorefrontProfile } from "../../types/business"
import { getEffectivePrice, getDisplayPrice } from "../../types/product"
import { useSEO } from "../../hooks/useSEO"
import { useCart } from "../../context/CartContext"


export default function Storefront() {
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()
  const { items: cartItems, addItem } = useCart()
  const [addedId, setAddedId] = useState<string | null>(null)
  const [cartError, setCartError] = useState<string | null>(null)
  const category = searchParams.get("category") || ""
  const q = searchParams.get("q") || ""
  const [products, setProducts] = useState<Product[]>([])
  const [stores, setStores] = useState<Record<string, StorefrontProfile>>({})
  const [loading, setLoading] = useState(true)

  const title = q ? `Search "${q}" — Storefront | Chatstand` : category ? `${category} — Storefront | Chatstand` : "Storefront — Shop African Sellers Online | Chatstand"
  const desc = "Public catalog on Chatstand. Buy online with guest checkout, or chat with sellers' AI assistants for the same live prices and stock."
  const canonical = typeof window !== "undefined" ? window.location.href : "https://chatstand.ng/store"

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
    setLoading(false)
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category, q])

  // Resolve the public store profiles (name + logo) for the sellers whose
  // products are on screen, so the marketplace can show store identity.
  useEffect(() => {
    const ids = [...new Set(products.map((p) => p.sellerId))].filter(Boolean).slice(0, 12)
    if (!ids.length) { setStores({}); return }
    let active = true
    Promise.all(ids.map((id) => productService.getStorefront(id).then((profile) => [id, profile] as const).catch(() => null)))
      .then((pairs) => {
        if (!active) return
        setStores(Object.fromEntries(pairs.filter((pair): pair is readonly [string, StorefrontProfile] => pair !== null)))
      })
    return () => { active = false }
  }, [products])

  const handleQuickAdd = (p: Product) => {
    setCartError(null)
    // Products with variants need a size/color choice first.
    if (p.variants && p.variants.length > 0) {
      navigate(`/store/${p.id}`)
      return
    }
    if (p.stock < 1) return
    if (cartItems.length > 0 && cartItems[0].sellerId !== p.sellerId) {
      setCartError("Checkout supports one store at a time. Complete or clear your current cart before adding from another store.")
      return
    }
    addItem({ productId: p.id, sellerId: p.sellerId })
    setAddedId(p.id)
    setTimeout(() => setAddedId((current) => (current === p.id ? null : current)), 1600)
  }

  return (
    <div className="min-h-screen bg-[#FFFBF5]">
      <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-[34px] sm:text-[40px] font-bold tracking-tight leading-none">Storefront</h1>
            <p className="mt-2 text-sm text-[#6b6b6b]">Public catalog with live prices and stock. Buy online as a guest, or chat with a seller’s Telegram bot. SEO-friendly store and product pages per seller.</p>
          </div>
          <Link to="/cart" className="hidden lg:inline-flex items-center gap-2 rounded-full bg-[#1a1a1a] px-5 py-2.5 text-sm font-bold text-white hover:bg-black">
            <ShoppingBag className="h-4 w-4" /> View cart
          </Link>
        </div>

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

        {cartError && <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">{cartError}</div>}

        {!loading && Object.keys(stores).length > 0 && (
          <div className="mt-4 flex items-center gap-2 overflow-x-auto pb-1">
            <span className="shrink-0 text-xs font-bold tracking-widest text-[#9a9a9a]">STORES</span>
            {Object.entries(stores).map(([id, s]) => (
              <Link key={id} to={`/store/seller/${id}`} className="inline-flex shrink-0 items-center gap-2 rounded-full border border-[#F3E6D3] bg-white py-1.5 pl-1.5 pr-3.5 text-sm font-bold hover:bg-[#FFF1DA]">
                <span className="grid h-6 w-6 place-items-center overflow-hidden rounded-full border border-[#F3E6D3] bg-[#FFF1DA]">{s.logo ? <img src={s.logo} alt="" className="h-full w-full object-cover" /> : <Store className="h-3 w-3 text-[#E85D26]" />}</span>
                {s.name}
              </Link>
            ))}
          </div>
        )}

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
              <div key={p.id} className="group relative rounded-[20px] bg-white border border-[#F3E6D3] overflow-hidden hover:shadow-[0_12px_30px_rgba(0,0,0,0.08)] hover:-translate-y-0.5 transition">
                <div className="absolute left-2 top-2 z-10 flex items-center gap-1.5">
                  <span className="h-6 w-6 rounded-full bg-white border border-[#F3E6D3] grid place-items-center shadow-sm"><Star className="h-3 w-3 fill-[#0B9C74] text-[#0B9C74]" /></span>
                  {p.stock <= 5 && p.stock > 0 && <span className="rounded-full bg-[#FFF1DA] border border-[#F3E6D3] px-2 py-1 text-[11px] font-bold text-[#E85D26]">Low stock</span>}
                  {p.stock === 0 && <span className="rounded-full bg-red-50 border border-red-200 px-2 py-1 text-[11px] font-bold text-red-700">Out</span>}
                </div>
                <button type="button" aria-label="Wishlist" className="absolute right-2 top-2 z-10 h-8 w-8 rounded-full bg-white border border-[#F3E6D3] grid place-items-center shadow-sm hover:bg-[#FFF1DA]"><Heart className="h-4 w-4" /></button>
                <Link to={`/store/${p.id}`} className="block aspect-square bg-[#FFFBF5] p-4 flex items-center justify-center"><img src={p.images[0]} alt={p.name} className="h-full w-full object-contain mix-blend-multiply group-hover:scale-[1.02] transition" /></Link>
                <div className="p-3.5">
                  <Link to={`/store/${p.id}`} className="block text-[13px] font-bold leading-tight line-clamp-1 hover:text-[#0B9C74]">{p.name}</Link>
                  <div className="mt-1 text-xs text-[#6b6b6b] line-clamp-1">{p.category} • {p.description.slice(0, 44)}{p.variants?.length ? ` • ${p.variants.length} variants` : ""}</div>
                  <div className="mt-2">
                    {(() => { const d = getDisplayPrice(p); const ep = getEffectivePrice(p); return d.hasDiscount ? <span className="flex items-center gap-1"><span className="text-sm font-bold text-[#E85D26]">₦{ep.toLocaleString()}</span><span className="text-xs line-through text-[#9a9a9a]">₦{d.original.toLocaleString()}</span></span> : <span className="text-sm font-bold">₦{ep.toLocaleString()}</span> })()}
                  </div>
                  {stores[p.sellerId] && <div className="mt-2 flex min-w-0 items-center gap-1.5 text-xs font-bold text-[#6b6b6b]"><span className="grid h-4 w-4 shrink-0 place-items-center overflow-hidden rounded-full border border-[#F3E6D3] bg-[#FFF1DA]">{stores[p.sellerId].logo ? <img src={stores[p.sellerId].logo} alt="" className="h-full w-full object-cover" /> : <Store className="h-2.5 w-2.5 text-[#E85D26]" />}</span><span className="truncate">{stores[p.sellerId].name}</span></div>}
                  <div className="mt-3 flex gap-1.5">
                    <button type="button" onClick={() => handleQuickAdd(p)} disabled={p.stock < 1 && !(p.variants && p.variants.length > 0)} className={`flex-1 inline-flex items-center justify-center gap-1.5 rounded-full px-2 py-2 text-xs font-bold text-white transition disabled:cursor-not-allowed disabled:opacity-50 ${addedId === p.id ? "bg-[#0a8a66]" : "bg-[#0B9C74] hover:bg-[#0a8a66]"}`}>
                      <ShoppingBag className="h-3.5 w-3.5" /> {addedId === p.id ? "Added ✓" : p.variants && p.variants.length > 0 ? "Options" : p.stock < 1 ? "Out" : "Add to cart"}
                    </button>
                    <Link to={`/store/${p.id}`} className="flex-1 inline-flex items-center justify-center rounded-full border border-[#F3E6D3] bg-white px-2 py-2 text-xs font-bold hover:bg-[#FFF1DA]">Details</Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-8 rounded-2xl bg-white border border-[#F3E6D3] p-6 flex flex-col lg:flex-row items-center justify-between gap-4">
          <div className="text-sm"><span className="font-bold">Prefer to chat?</span> <span className="text-[#6b6b6b]">Open a seller’s Telegram bot from their store page — the AI checks the same stock and price.</span></div>
          <Link to="/contact" className="rounded-full bg-[#0B9C74] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#0a8a66]">Talk to founder</Link>
        </div>
      </div>
    </div>
  )
}
