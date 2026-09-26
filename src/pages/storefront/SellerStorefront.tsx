import { useEffect, useState } from "react"
import { Link, useParams } from "react-router-dom"
import { Store, MapPin, Phone, MessageCircle, Share2, Star, ShoppingBag, ArrowLeft, Copy, Check } from "lucide-react"
import { productService } from "../../services/productService"
import { useSEO } from "../../hooks/useSEO"
import type { Product } from "../../types/product"
import { getEffectivePrice, getDisplayPrice, getTotalStock } from "../../types/product"
import type { Seller } from "../../types/auth"
import type { Business } from "../../types/business"

function slugify(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")
}

export default function SellerStorefront() {
  const { sellerId, slug } = useParams<{ sellerId: string; slug: string }>()
  const rawId = sellerId || slug || ""
  const [seller, setSeller] = useState<(Seller & { businessName: string }) | null>(null)
  const [business, setBusiness] = useState<Business | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    productService.seedDemo()
    const sellersRaw = localStorage.getItem("cognicart_mock_sellers")
    const sellers: Array<Seller & { businessName: string }> = sellersRaw ? JSON.parse(sellersRaw) : []
    let found: (Seller & { businessName: string }) | null = null
    // match by id, or slug of businessName
    found = sellers.find((s) => s.id === rawId) || sellers.find((s) => slugify(s.businessName) === rawId) || null
    if (!found && sellers.length > 0 && rawId === "demo") {
      found = sellers.find((s) => s.email.includes("demo")) || sellers[0]
    }
    if (!found) {
      setNotFound(true)
      setLoading(false)
      return
    }
    setSeller(found)
    const bizRaw = localStorage.getItem("cognicart_business")
    const businesses: Business[] = bizRaw ? JSON.parse(bizRaw) : []
    const biz = businesses.find((b) => b.sellerId === found!.id) || null
    setBusiness(biz)
    productService.listPublic({}).then((all) => {
      setProducts(all.filter((p) => p.sellerId === found!.id && p.isActive))
      setLoading(false)
    })
  }, [rawId])

  const url = typeof window !== "undefined" ? window.location.href : `https://cognicart.ng/store/seller/${rawId}`
  const sellerName = business?.name || seller?.businessName || "Seller Store"
  const desc = business?.description || `Shop ${sellerName} on Cognicart — WhatsApp AI commerce. ${products.length} products, delivery in ${business?.deliveryTime || "1-3 days"}.`
  const ogImage = products[0]?.images[0] || business?.logo || "https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=1200&h=630&fit=crop"

  useSEO({
    title: `${sellerName} — Store on Cognicart`,
    description: desc.slice(0, 160),
    canonical: url,
    ogTitle: `${sellerName} — Store on Cognicart`,
    ogDescription: desc.slice(0, 160),
    ogImage,
    ogUrl: url,
    ogType: "profile",
    jsonLd: seller ? {
      "@context": "https://schema.org",
      "@type": "Store",
      name: sellerName,
      description: desc,
      url,
      image: ogImage,
      address: business?.location,
      telephone: business?.phone || seller.phone,
    } : undefined,
  })

  const handleCopy = async () => {
    await navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const waLink = (product?: Product) => {
    const phone = (business?.whatsappPhone || business?.phone || seller?.phone || "+2348000000000").replace(/[^0-9]/g, "")
    const text = product ? `Hi ${sellerName}, is ${product.name} still available for ₦${product.price.toLocaleString()}?` : `Hi ${sellerName}, I found your store on Cognicart and would like to chat.`
    return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`
  }

  if (loading) return <div className="min-h-[40vh] grid place-items-center"><div className="h-8 w-8 rounded-full border-2 border-[#0B9C74] border-t-transparent animate-spin" /></div>
  if (notFound || !seller) return <div className="min-h-[40vh] grid place-items-center px-4"><div className="text-center rounded-2xl bg-white border border-[#F3E6D3] p-8"><div className="font-bold">Store not found</div><div className="text-sm text-[#6b6b6b]">Seller store "{rawId}" does not exist.</div><Link to="/store" className="mt-3 inline-flex rounded-full bg-[#0B9C74] px-5 py-2.5 text-sm font-bold text-white">Browse store</Link></div></div>

  return (
    <div className="min-h-screen bg-[#FFFBF5]">
      <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8 py-6">
        <Link to="/store" className="inline-flex items-center gap-2 text-sm font-medium text-[#6b6b6b] hover:text-[#1a1a1a]"><ArrowLeft className="h-4 w-4" /> Back to marketplace</Link>

        <div className="mt-4 rounded-[24px] bg-white border border-[#F3E6D3] overflow-hidden">
          <div className="h-28 bg-gradient-to-r from-[#0B9C74] to-[#1a1a1a] relative">
            {business?.logo && <img src={business.logo} alt="" className="absolute -bottom-10 left-6 h-20 w-20 rounded-2xl border-4 border-white object-cover bg-white" />}
            {!business?.logo && <div className="absolute -bottom-10 left-6 h-20 w-20 rounded-2xl border-4 border-white bg-white grid place-items-center text-xl font-bold">{sellerName.charAt(0)}</div>}
          </div>
          <div className="pt-14 pb-6 px-6">
            <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
              <div>
                <h1 className="font-display text-[28px] font-bold leading-tight">{sellerName}</h1>
                <p className="mt-1 text-sm leading-6 text-[#5a5a5a] max-w-2xl">{business?.description || `WhatsApp AI store — ${products.length} products available. Chat to buy instantly.`}</p>
                <div className="mt-3 flex flex-wrap gap-2 text-xs">
                  {business?.location && <span className="inline-flex items-center gap-1 rounded-full bg-[#FFFBF5] border border-[#F3E6D3] px-3 py-1.5"><MapPin className="h-3.5 w-3.5 text-[#0B9C74]" /> {business.location}</span>}
                  {business?.phone && <span className="inline-flex items-center gap-1 rounded-full bg-[#FFFBF5] border border-[#F3E6D3] px-3 py-1.5"><Phone className="h-3.5 w-3.5 text-[#0B9C74]" /> {business.phone}</span>}
                  <span className="inline-flex items-center gap-1 rounded-full bg-[#E6F7F1] border border-[#0B9C74]/20 px-3 py-1.5 font-bold text-[#0B9C74]"><Store className="h-3.5 w-3.5" /> {products.length} products</span>
                  {business?.deliveryInfo && <span className="rounded-full bg-white border border-[#F3E6D3] px-3 py-1.5">{business.deliveryInfo}</span>}
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-2 lg:ml-auto">
                <a href={waLink()} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center gap-2 rounded-full bg-[#0B9C74] px-6 py-3 text-sm font-bold text-white hover:bg-[#0a8a66]"><MessageCircle className="h-4 w-4" /> Order on WhatsApp</a>
                <button onClick={handleCopy} className="inline-flex items-center justify-center gap-2 rounded-full bg-white border border-[#F3E6D3] px-6 py-3 text-sm font-bold hover:bg-[#FFF1DA]">{copied ? <Check className="h-4 w-4 text-[#0B9C74]" /> : <Copy className="h-4 w-4" />} {copied ? "Copied" : "Copy store link"}</button>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <a href={`https://wa.me/${(business?.whatsappPhone || business?.phone || "").replace(/[^0-9]/g, "")}?text=${encodeURIComponent(`Hi ${sellerName}, I saw your store on Cognicart`)}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-full bg-[#E6F7F1] border border-[#0B9C74]/20 px-4 py-2 text-xs font-bold text-[#0B9C74] hover:bg-[#0B9C74] hover:text-white"><Share2 className="h-3.5 w-3.5" /> Share on WhatsApp</a>
              <a href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(`Shop ${sellerName} on Cognicart`)}&url=${encodeURIComponent(url)}`} target="_blank" rel="noreferrer" className="rounded-full bg-white border border-[#F3E6D3] px-4 py-2 text-xs font-bold hover:bg-[#FFF1DA]">Share on X</a>
              <button onClick={handleCopy} className="rounded-full bg-white border border-[#F3E6D3] px-4 py-2 text-xs font-bold hover:bg-[#FFF1DA]">Copy link</button>
            </div>
          </div>
        </div>

        <div className="mt-6">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-xl font-bold">Products by {sellerName}</h2>
            <span className="text-sm text-[#6b6b6b]">{products.length} items</span>
          </div>
          {products.length === 0 ? (
            <div className="mt-4 rounded-2xl bg-white border border-[#F3E6D3] p-10 text-center">
              <div className="font-bold">No products yet</div>
              <div className="text-sm text-[#6b6b6b]">This seller has not published active products. Check the public marketplace.</div>
              <Link to="/store" className="mt-3 inline-flex rounded-full bg-[#0B9C74] px-5 py-2.5 text-sm font-bold text-white">Browse marketplace</Link>
            </div>
          ) : (
            <div className="mt-4 grid grid-cols-2 lg:grid-cols-4 gap-4">
              {products.map((p) => (
                <div key={p.id} className="group relative rounded-[20px] bg-white border border-[#F3E6D3] overflow-hidden hover:shadow-[0_12px_30px_rgba(0,0,0,0.08)] hover:-translate-y-0.5 transition">
                  <Link to={`/store/${p.id}`} className="block">
                    <div className="aspect-square bg-[#FFFBF5] p-4 flex items-center justify-center"><img src={p.images[0]} alt={p.name} className="h-full w-full object-contain mix-blend-multiply group-hover:scale-[1.02] transition" /></div>
                  </Link>
                  <div className="absolute left-2 top-2 z-10 rounded-full bg-white border border-[#F3E6D3] px-2 py-1 text-[11px] font-bold flex items-center gap-1"><Star className="h-3 w-3 fill-[#0B9C74] text-[#0B9C74]" /> {p.category}</div>
                  <div className="p-3.5">
                    <Link to={`/store/${p.id}`} className="text-[13px] font-bold leading-tight line-clamp-1 hover:text-[#0B9C74]">{p.name}</Link>
                    <div className="mt-1 text-xs text-[#6b6b6b] line-clamp-1">{p.description.slice(0, 48)}</div>
                    <div className="mt-2 flex items-center justify-between">{(() => { const d = getDisplayPrice(p); const ep = getEffectivePrice(p); const stock = getTotalStock(p); return <><span className="text-sm font-bold">{d.hasDiscount ? <><span className="text-[#E85D26]">₦{ep.toLocaleString()}</span> <span className="text-xs line-through text-[#9a9a9a]">₦{d.original.toLocaleString()}</span></> : `₦${ep.toLocaleString()}`}</span><span className={`rounded-full px-2 py-1 text-xs font-bold border ${stock === 0 ? "bg-red-50 text-red-700 border-red-200" : "bg-[#E6F7F1] text-[#0B9C74] border-[#0B9C74]/20"}`}>{stock === 0 ? "Out" : `${stock} left`}</span></> })()}</div>
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      <Link to={`/store/${p.id}`} className="inline-flex justify-center items-center gap-1 rounded-full bg-[#1a1a1a] px-3 py-2 text-xs font-bold text-white hover:bg-black"><ShoppingBag className="h-3 w-3" /> View</Link>
                      <a href={waLink(p)} target="_blank" rel="noreferrer" className="inline-flex justify-center items-center gap-1 rounded-full bg-[#0B9C74] px-3 py-2 text-xs font-bold text-white hover:bg-[#0a8a66]"><MessageCircle className="h-3 w-3" /> WhatsApp</a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-8 rounded-2xl bg-[#1a1a1a] text-white p-6 flex flex-col lg:flex-row items-center justify-between gap-4">
          <div>
            <div className="font-bold">Want your own store?</div>
            <div className="text-sm text-white/70">Create a Cognicart seller account and get a shareable store like this in minutes.</div>
          </div>
          <Link to="/register" className="rounded-full bg-[#0B9C74] px-6 py-3 text-sm font-bold text-white hover:bg-[#0a8a66]">Start selling</Link>
        </div>
      </div>
    </div>
  )
}
