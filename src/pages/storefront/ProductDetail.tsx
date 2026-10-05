import { useEffect, useState } from "react"
import { useParams, Link } from "react-router-dom"
import { ArrowLeft, ShoppingBag, Heart, Check, Truck, Shield, Share2, Copy, Send, Store, ChevronRight, Tag, Palette } from "lucide-react"
import { toast } from "sonner"
import { productService } from "../../services/productService"
import { useCart } from "../../context/CartContext"
import { useSEO } from "../../hooks/useSEO"
import type { Product } from "../../types/product"
import type { StorefrontProfile } from "../../types/business"
import { getEffectivePrice, getDisplayPrice, getTotalStock } from "../../types/product"

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>()
  const [product, setProduct] = useState<Product | null>(null)
  const [store, setStore] = useState<StorefrontProfile | null>(null)
  const [sellerId, setSellerId] = useState("")
  const [loading, setLoading] = useState(true)
  const [added, setAdded] = useState(false)
  const [copied, setCopied] = useState(false)
  const [selectedVariant, setSelectedVariant] = useState<string | null>(null)
  const { items: cartItems, addItem } = useCart()

  const sellerName = store?.name || "Cognicart Seller"

  useEffect(() => {
    if (!id) return
    const load = async () => {
      try {
        const nextProduct = await productService.getById(id)
        setProduct(nextProduct)
        setSellerId(nextProduct.sellerId)
        if (nextProduct.variants && nextProduct.variants.length > 0) setSelectedVariant(nextProduct.variants[0].id)
        try {
          setStore(await productService.getStorefront(nextProduct.sellerId))
        } catch {
          // The product can still be viewed if optional public business metadata is unavailable.
        }
      } catch {
        setProduct(null)
      } finally {
        setLoading(false)
      }
    }
    void load()
  }, [id])

  const variant = product?.variants?.find((v) => v.id === selectedVariant) || null
  const effectivePrice = product ? getEffectivePrice(product, variant) : 0
  const display = product ? getDisplayPrice(product) : { original: 0, sale: null, hasDiscount: false }
  const totalStock = product ? getTotalStock(product) : 0
  const variantStock = variant ? variant.stock : totalStock
  const isOut = variant ? variant.stock === 0 : totalStock === 0

  const url = typeof window !== "undefined" ? window.location.href : `https://cognicart.ng/store/${id}`
  const title = product ? `${product.name} — ₦${effectivePrice.toLocaleString()}${display.hasDiscount ? ` (was ₦${display.original.toLocaleString()})` : ""} | ${sellerName} on Cognicart` : "Product — Cognicart"
  const desc = product ? `${product.description.slice(0, 155)} • ${product.category}${product.variants ? ` • ${product.variants.length} variants` : ""} • ${totalStock > 0 ? `In stock ${totalStock}` : "Out of stock"} • Guest checkout online${store?.telegramBotUrl ? " or order in Telegram chat" : ""}.` : "Product on Cognicart"
  const ogImage = product?.images[0] || "https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=1200&h=630&fit=crop"

  useSEO({
    title,
    description: desc,
    canonical: url,
    ogTitle: title,
    ogDescription: desc,
    ogImage,
    ogUrl: url,
    ogType: "product",
    jsonLd: product ? {
      "@context": "https://schema.org",
      "@type": "Product",
      name: product.name,
      description: product.description,
      image: product.images,
      brand: { "@type": "Brand", name: sellerName },
      offers: {
        "@type": "Offer",
        price: effectivePrice,
        priceCurrency: product.currency || "NGN",
        availability: variantStock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
        url,
        seller: { "@type": "Organization", name: sellerName },
      },
    } : undefined,
  })

  const handleAdd = () => {
    if (!product) return
    if (product.variants && product.variants.length > 0 && !selectedVariant) {
      toast.error("Please select size and color")
      return
    }
    if (isOut) return
    if (cartItems.length > 0 && cartItems[0].sellerId !== product.sellerId) {
      toast.error("Checkout supports one store at a time. Complete or clear your current cart first.")
      return
    }
    addItem({ productId: product.id, sellerId: product.sellerId, variantId: selectedVariant || undefined })
    setAdded(true)
    setTimeout(() => setAdded(false), 2000)
  }

  const handleCopy = async () => {
    await navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const variantLabel = variant ? [variant.size, variant.color].filter(Boolean).join(" / ") || variant.sku || "" : ""
  // Share-only wa.me link: opens the visitor's own WhatsApp with pre-filled
  // text so they can share the product. Not a checkout or notification channel.
  const waShareText = product ? `${product.name}${variantLabel ? ` (${variantLabel})` : ""} — ₦${effectivePrice.toLocaleString()} from ${sellerName} on Cognicart: ${url}` : ""
  const waShareLink = `https://wa.me/?text=${encodeURIComponent(waShareText)}`

  if (loading) return <div className="min-h-[50vh] grid place-items-center"><div className="h-8 w-8 rounded-full border-2 border-[#0B9C74] border-t-transparent animate-spin" /></div>
  if (!product) return <div className="min-h-[50vh] grid place-items-center px-4"><div className="text-center"><div className="font-bold">Product not found</div><Link to="/store" className="mt-3 inline-flex rounded-full bg-[#0B9C74] px-5 py-2.5 text-sm font-bold text-white">Back to store</Link></div></div>

  return (
    <div className="min-h-screen bg-[#FFFBF5]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <nav className="flex items-center gap-1.5 text-xs text-[#6b6b6b]">
          <Link to="/" className="hover:text-[#1a1a1a]">Home</Link> <ChevronRight className="h-3 w-3" />
          <Link to="/store" className="hover:text-[#1a1a1a]">Store</Link> <ChevronRight className="h-3 w-3" />
          {sellerName && <><Link to={sellerId ? `/store/seller/${sellerId}` : "/store"} className="hover:text-[#1a1a1a] inline-flex items-center gap-1"><Store className="h-3 w-3" /> {sellerName}</Link> <ChevronRight className="h-3 w-3" /></>}
          <span className="font-bold text-[#1a1a1a] line-clamp-1">{product.name}</span>
        </nav>

        <Link to="/store" className="mt-3 inline-flex items-center gap-2 text-sm font-medium text-[#6b6b6b] hover:text-[#1a1a1a]"><ArrowLeft className="h-4 w-4" /> Back to store</Link>

        <div className="mt-6 grid lg:grid-cols-2 gap-8">
          <div className="rounded-[22px] bg-white border border-[#F3E6D3] p-4">
            <div className="aspect-square rounded-2xl bg-[#FFFBF5] border border-[#F3E6D3] p-6 flex items-center justify-center"><img src={variant?.image || product.images[0]} alt={product.name} className="h-full w-full object-contain mix-blend-multiply" /></div>
            {product.images.length > 1 && <div className="mt-3 grid grid-cols-4 gap-3">{product.images.slice(1, 4).map((src, i) => <img key={i} src={src} alt="" className="h-20 w-full rounded-xl object-cover border border-[#F3E6D3] bg-white" />)}</div>}
            <div className="mt-4 flex gap-2">
              <button onClick={handleAdd} disabled={isOut} className="flex-1 inline-flex justify-center items-center gap-2 rounded-full bg-[#0B9C74] px-4 py-3 text-sm font-bold text-white hover:bg-[#0a8a66] disabled:opacity-50"><ShoppingBag className="h-4 w-4" /> {added ? "Added" : isOut ? "Out of stock" : "Buy now"}</button>
              <button onClick={handleCopy} className="inline-flex items-center gap-2 rounded-full bg-white border border-[#F3E6D3] px-4 py-3 text-sm font-bold hover:bg-[#FFF1DA]">{copied ? <Check className="h-4 w-4 text-[#0B9C74]" /> : <Copy className="h-4 w-4" />} {copied ? "Copied" : "Copy link"}</button>
            </div>
          </div>

          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-[#E6F7F1] border border-[#0B9C74]/15 px-3 py-1 text-xs font-bold text-[#0B9C74]">{product.category} {product.isActive ? "• Active" : "• Inactive"}</div>
            <h1 className="font-display text-[30px] font-bold leading-tight mt-3">{product.name}</h1>
            <div className="mt-2 flex items-center gap-2 text-xs">
              <Link to={sellerId ? `/store/seller/${sellerId}` : "/store"} className="inline-flex items-center gap-1.5 rounded-full bg-white border border-[#F3E6D3] py-1 pl-1.5 pr-3 font-bold hover:bg-[#FFF1DA]">{store?.logo ? <img src={store.logo} alt="" className="h-4 w-4 rounded-full object-cover" /> : <Store className="h-3 w-3" />} {sellerName}</Link>
              {store?.telegramBotUrl && <a href={store.telegramBotUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 rounded-full bg-[#E7F4FB] border border-[#229ED9]/25 px-3 py-1 font-bold text-[#1c82b3]"><Send className="h-3 w-3" /> Open in Telegram</a>}
            </div>
            <p className="mt-3 text-sm leading-6 text-[#5a5a5a]">{product.description}</p>

            <div className="mt-4">
              {display.hasDiscount ? (
                <div className="flex items-baseline gap-3 flex-wrap">
                  <span className="text-2xl font-bold text-[#E85D26]">₦{effectivePrice.toLocaleString()}</span>
                  <span className="text-sm line-through text-[#9a9a9a]">₦{display.original.toLocaleString()}</span>
                  <span className="rounded-full bg-[#E85D26] text-white px-2.5 py-1 text-xs font-bold flex items-center gap-1"><Tag className="h-3 w-3" /> {product.discount?.type === "percentage" ? `${product.discount.value}% OFF` : `Save ₦${product.discount?.value.toLocaleString()}`}</span>
                </div>
              ) : (
                <div className="flex items-baseline gap-3"><span className="text-2xl font-bold">₦{effectivePrice.toLocaleString()}</span>{variant?.price ? <span className="text-xs text-[#6b6b6b]">variant price</span> : null}</div>
              )}
              <div className="mt-2 flex items-center gap-2">
                <span className={`rounded-full px-2.5 py-1 text-xs font-bold border ${variantStock === 0 ? "bg-red-50 text-red-700 border-red-200" : variantStock <= 5 ? "bg-[#FFF1DA] text-[#E85D26] border-[#F3E6D3]" : "bg-[#E6F7F1] text-[#0B9C74] border-[#0B9C74]/20"}`}>{variantStock === 0 ? "Out of stock" : `In stock: ${variantStock}`}</span>
                {!isOut && <span className="text-xs text-[#6b6b6b]">Total {totalStock} units</span>}
              </div>
            </div>

            {product.variants && product.variants.length > 0 && (
              <div className="mt-6 rounded-2xl bg-white border border-[#F3E6D3] p-4">
                <div className="flex items-center gap-2 text-sm font-bold"><Palette className="h-4 w-4" /> Choose size and color</div>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  {product.variants.map((v) => {
                    const label = [v.size, v.color].filter(Boolean).join(" / ") || v.sku || v.id
                    const active = selectedVariant === v.id
                    const vp = getEffectivePrice(product, v)
                    const isVOut = v.stock === 0
                    return (
                      <button key={v.id} onClick={() => !isVOut && setSelectedVariant(v.id)} disabled={isVOut} className={`rounded-xl border px-3 py-3 text-left ${active ? "bg-[#1a1a1a] text-white border-[#1a1a1a]" : isVOut ? "bg-[#f9f9f9] text-[#9a9a9a] border-[#F3E6D3]" : "bg-white border-[#F3E6D3] hover:bg-[#FFF1DA]"} `}>
                        <div className="text-sm font-bold">{label}</div>
                        <div className={`text-xs ${active ? "text-white/80" : "text-[#6b6b6b]"}`}>₦{vp.toLocaleString()} • {isVOut ? "Out" : `${v.stock} left`}{v.sku ? ` • ${v.sku}` : ""}</div>
                      </button>
                    )
                  })}
                </div>
                {variant && <div className="mt-2 text-xs text-[#6b6b6b]">Selected {variantLabel} • SKU {variant.sku || "—"} • Stock {variant.stock}</div>}
              </div>
            )}

            <div className="mt-6 flex flex-wrap gap-3">
              <button onClick={handleAdd} disabled={isOut} className="inline-flex items-center gap-2 rounded-full bg-[#0B9C74] px-7 py-3.5 text-sm font-bold text-white hover:bg-[#0a8a66] disabled:opacity-50">
                <ShoppingBag className="h-4 w-4" /> {added ? "Added" : isOut ? "Out of stock" : "Add to cart"}
              </button>
              {store?.telegramBotUrl && (
                <a href={store.telegramBotUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-full bg-[#229ED9] px-7 py-3.5 text-sm font-bold text-white hover:bg-[#1c82b3]"><Send className="h-4 w-4" /> Open in Telegram</a>
              )}
              <button className="inline-flex items-center gap-2 rounded-full bg-white border border-[#F3E6D3] px-6 py-3.5 text-sm font-bold hover:bg-[#FFF1DA]"><Heart className="h-4 w-4" /> Wishlist</button>
            </div>
            {added && <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-[#1a1a1a] px-3 py-1.5 text-xs font-bold text-white"><Check className="h-4 w-4" /> Added to cart • <Link to="/cart" className="underline">View cart</Link></div>}

            <div className="mt-4 flex flex-wrap gap-2">
              <button onClick={handleCopy} className="inline-flex items-center gap-2 rounded-full bg-white border border-[#F3E6D3] px-4 py-2 text-xs font-bold hover:bg-[#FFF1DA]"><Share2 className="h-3.5 w-3.5" /> {copied ? "Link copied" : "Share this product"}</button>
              <a href={waShareLink} target="_blank" rel="noreferrer" className="rounded-full bg-white border border-[#F3E6D3] px-4 py-2 text-xs font-bold hover:bg-[#FFF1DA]">Share on WhatsApp</a>
              <a href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(product.name)}&url=${encodeURIComponent(url)}`} target="_blank" rel="noreferrer" className="rounded-full bg-white border border-[#F3E6D3] px-4 py-2 text-xs font-bold hover:bg-[#FFF1DA]">Share on X</a>
            </div>

            <div className="mt-6 grid sm:grid-cols-2 gap-3 text-sm">
              <div className="rounded-2xl bg-white border border-[#F3E6D3] p-4 flex gap-3"><Truck className="h-5 w-5 text-[#0B9C74]" /><div><div className="font-bold">Delivery</div><div className="text-[#6b6b6b] text-xs leading-5">{store?.deliveryInfo || "Lagos 1-2 days. Rest of Nigeria 2-4 days."} Fee is calculated by the store at checkout.</div></div></div>
              <div className="rounded-2xl bg-white border border-[#F3E6D3] p-4 flex gap-3"><Shield className="h-5 w-5 text-[#0B9C74]" /><div><div className="font-bold">Live price & stock</div><div className="text-[#6b6b6b] text-xs leading-5">The same catalog powers this page{store?.telegramBotUrl ? " and the store's Telegram bot" : ""} — no stale prices.</div></div></div>
            </div>

            <div className="mt-6 rounded-2xl bg-white border border-[#F3E6D3] p-4">
              <div className="flex items-center gap-2.5"><span className="grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-xl bg-[#FFF1DA] border border-[#F3E6D3]">{store?.logo ? <img src={store.logo} alt="" className="h-full w-full object-cover" /> : <Store className="h-4 w-4 text-[#E85D26]" />}</span><div className="text-sm font-bold">Seller — {sellerName}</div></div>
              <p className="text-xs text-[#6b6b6b] leading-5 mt-1">View all products from this seller in their SEO-friendly store. Shareable link for Google and social.</p>
              <div className="mt-3 flex gap-2">
                <Link to={sellerId ? `/store/seller/${sellerId}` : "/store"} className="inline-flex rounded-full bg-[#FFF1DA] border border-[#F3E6D3] px-4 py-2 text-xs font-bold hover:bg-white">Visit {sellerName} store</Link>
                {store?.telegramBotUrl && <a href={store.telegramBotUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 rounded-full bg-[#229ED9] px-4 py-2 text-xs font-bold text-white hover:bg-[#1c82b3]"><Send className="h-3 w-3" /> Chat on Telegram</a>}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
