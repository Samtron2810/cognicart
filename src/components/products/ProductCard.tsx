import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { Check, Plus } from "lucide-react"
import { useCart } from "../../context/CartContext"
import { getDisplayPrice, getEffectivePrice, getTotalStock } from "../../types/product"
import { productPath } from "../../types/store"
import type { Product } from "../../types/product"

/**
 * The one product card used everywhere products are listed.
 *
 * Two interactions on purpose: "Add" puts the item straight in the cart,
 * anywhere else on the card opens the product. Previously each page
 * hand-rolled its own card, which is how three of them ended up linking to
 * a URL that no longer resolved to a product.
 *
 * A product with variants cannot be added blind — size and colour have to be
 * chosen — so for those the button opens the product page instead of
 * silently adding the wrong thing.
 */
export function ProductCard({
  product,
  storeIdentifier,
  storeName,
}: {
  product: Product
  /** Slug or sellerId owning the product. Defaults to the product's own seller. */
  storeIdentifier?: string
  /** Pass in cross-store listings; omit inside a store, where it is noise. */
  storeName?: string
}) {
  const { addItem } = useCart()
  const navigate = useNavigate()
  const [added, setAdded] = useState(false)

  const href = productPath(storeIdentifier || product.sellerId, product.id)
  const display = getDisplayPrice(product)
  const price = getEffectivePrice(product)
  const hasVariants = Boolean(product.variants && product.variants.length > 0)
  const stock = getTotalStock(product)
  const soldOut = !hasVariants && stock < 1

  const handleAdd = () => {
    if (hasVariants) {
      navigate(href)
      return
    }
    if (soldOut) return
    addItem({ productId: product.id, sellerId: product.sellerId })
    setAdded(true)
    window.setTimeout(() => setAdded(false), 1600)
  }

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-[20px] border border-[#F3E6D3] bg-white transition hover:shadow-[0_12px_30px_rgba(0,0,0,0.08)]">
      <Link to={href} className="block aspect-square bg-[#FFFBF5] p-4" aria-label={product.name}>
        {product.images?.[0] ? (
          <img
            src={product.images[0]}
            alt={product.name}
            className="h-full w-full object-contain mix-blend-multiply transition group-hover:scale-[1.02]"
          />
        ) : (
          <span className="grid h-full w-full place-items-center text-xs text-[#9a9a9a]">No image</span>
        )}
      </Link>

      <div className="flex flex-1 flex-col p-3.5">
        <Link to={href} className="block text-[13px] font-bold leading-tight line-clamp-1 hover:text-[#0B9C74]">
          {product.name}
        </Link>

        {storeName ? (
          <span className="mt-0.5 line-clamp-1 text-[11px] text-[#9a9a9a]">{storeName}</span>
        ) : (
          product.category && <span className="mt-0.5 line-clamp-1 text-[11px] text-[#9a9a9a]">{product.category}</span>
        )}

        <div className="mt-2 text-sm font-bold">
          {display.hasDiscount ? (
            <>
              <span className="text-[#E85D26]">₦{price.toLocaleString()}</span>
              <span className="ml-1.5 text-[11px] font-medium text-[#9a9a9a] line-through">
                ₦{display.original.toLocaleString()}
              </span>
            </>
          ) : (
            <span>₦{price.toLocaleString()}</span>
          )}
        </div>

        <button
          type="button"
          onClick={handleAdd}
          disabled={soldOut}
          aria-label={hasVariants ? `Choose options for ${product.name}` : `Add ${product.name} to cart`}
          className={`mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-full px-3 py-2 text-xs font-bold text-white transition disabled:cursor-not-allowed disabled:bg-[#c9c9c9] ${
            added ? "bg-[#0a8a66]" : "bg-[#0B9C74] hover:bg-[#0a8a66]"
          }`}
        >
          {soldOut ? (
            "Sold out"
          ) : added ? (
            <>
              <Check className="h-3.5 w-3.5" />
              Added
            </>
          ) : hasVariants ? (
            "Choose options"
          ) : (
            <>
              <Plus className="h-3.5 w-3.5" />
              Add to cart
            </>
          )}
        </button>
      </div>
    </div>
  )
}
