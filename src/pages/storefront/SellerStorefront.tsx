import { useEffect, useState } from "react"
import { Link, useParams } from "react-router-dom"
import { MapPin, Send, Share2, ShoppingBag, Store } from "lucide-react"
import { productService } from "../../services/productService"
import { getDisplayPrice, getEffectivePrice, getTotalStock } from "../../types/product"
import type { StorefrontProfile } from "../../types/business"
import type { Product } from "../../types/product"

export default function SellerStorefront() {
  const { sellerId } = useParams<{ sellerId: string }>()
  const [store, setStore] = useState<StorefrontProfile | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!sellerId) return
    const load = async () => {
      try {
        const [nextStore, nextProducts] = await Promise.all([
          productService.getStorefront(sellerId),
          productService.listStorefrontProducts(sellerId),
        ])
        setStore(nextStore)
        setProducts(nextProducts)
      } finally {
        setLoading(false)
      }
    }
    void load()
  }, [sellerId])

  if (loading) return <div className="grid min-h-[50vh] place-items-center"><div className="h-8 w-8 animate-spin rounded-full border-2 border-[#0B9C74] border-t-transparent" /></div>
  if (!store) return <div className="grid min-h-[50vh] place-items-center px-4"><div className="text-center"><h1 className="font-display text-2xl font-bold">Store not found</h1><Link to="/store" className="mt-4 inline-flex rounded-full bg-[#0B9C74] px-5 py-2.5 text-sm font-bold text-white">Browse stores</Link></div></div>

  // Optional share action only: opens the visitor's own WhatsApp with a
  // pre-filled message about this store. No API, no automated sending.
  const storeUrl = typeof window !== "undefined" ? window.location.href : ""
  const waShareLink = `https://wa.me/?text=${encodeURIComponent(`Check out ${store.name} on Chatstand: ${storeUrl}`)}`

  return <div className="min-h-screen bg-[#FFFBF5]"><div className="mx-auto max-w-[1280px] px-4 py-8 sm:px-6 lg:px-8"><section className="rounded-[24px] bg-[#1a1a1a] p-6 text-white sm:p-8"><div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-start"><div className="flex gap-4"><div className="grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-2xl bg-white/10">{store.logo ? <img src={store.logo} alt="" className="h-full w-full object-cover"/> : <Store className="h-7 w-7"/>}</div><div><h1 className="font-display text-3xl font-bold">{store.name}</h1>{store.description && <p className="mt-2 max-w-xl text-sm leading-6 text-white/70">{store.description}</p>}<div className="mt-3 flex flex-wrap gap-3 text-xs text-white/70">{store.location && <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5"/>{store.location}</span>}<span>{store.deliveryInfo || "Delivery details available at checkout"}</span></div></div></div><div className="flex flex-col items-stretch gap-2 sm:items-end">{store.telegramBotUrl && <a href={store.telegramBotUrl} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center gap-2 rounded-full bg-[#229ED9] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#1c82b3]"><Send className="h-4 w-4"/>Open in Telegram</a>}<a href={waShareLink} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center gap-2 rounded-full border border-white/20 bg-white/10 px-5 py-2.5 text-sm font-bold text-white hover:bg-white/20"><Share2 className="h-4 w-4"/>Share on WhatsApp</a></div></div></section><div className="mt-8 flex items-center justify-between"><div><h2 className="font-display text-2xl font-bold">Products</h2><p className="text-sm text-[#6b6b6b]">Live catalog from {store.name}. Buy online as a guest{store.telegramBotUrl ? ", or chat with the store's bot on Telegram" : ""}.</p></div><Link to="/cart" className="inline-flex items-center gap-2 rounded-full border border-[#F3E6D3] bg-white px-4 py-2 text-sm font-bold"><ShoppingBag className="h-4 w-4"/>Cart</Link></div>{products.length ? <div className="mt-5 grid grid-cols-2 gap-4 lg:grid-cols-4">{products.map((product) => { const display = getDisplayPrice(product); const price = getEffectivePrice(product); return <Link key={product.id} to={`/store/${product.id}`} className="group overflow-hidden rounded-2xl border border-[#F3E6D3] bg-white hover:shadow-md"><img src={product.images[0]} alt={product.name} className="aspect-square w-full bg-[#FFFBF5] object-contain p-4"/><div className="p-3.5"><div className="truncate text-sm font-bold">{product.name}</div><div className="mt-1 text-xs text-[#6b6b6b]">{getTotalStock(product)} in stock</div><div className="mt-2 font-bold">{display.hasDiscount ? <><span className="text-[#E85D26]">₦{price.toLocaleString()}</span><span className="ml-1 text-xs text-[#9a9a9a] line-through">₦{display.original.toLocaleString()}</span></> : `₦${price.toLocaleString()}`}</div></div></Link>})}</div> : <div className="mt-5 rounded-2xl border border-[#F3E6D3] bg-white p-10 text-center text-sm text-[#6b6b6b]">This store has no active products yet.</div>}</div></div>
}
