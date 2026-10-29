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
 * anywhere else on the card opens the product.
 *
 * Every row of this card is a FIXED height — a short image box, a two-line
 * title, one line of meta, one line of price, one button. Nothing here grows
 * with its content, so a long product name can no longer stretch one card
 * and leave a ragged grid. The image box is a fixed pixel height rather than
 * a square aspect ratio, which also stops cards becoming enormous as the
 * column gets wider on a large screen.
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
  const lowStock = !soldOut && stock > 0 && stock <= 5

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
    <div className="group relative flex flex-col overflow-hidden rounded-2xl border border-[#F3E6D3] bg-white transition hover:shadow-[0_10px_24px_rgba(0,0,0,0.07)]">
      <Link
        to={href}
        aria-label={product.name}
        className="relative block h-32 shrink-0 bg-[#FFFBF5] p-3 sm:h-36"
      >
        {product.images?.[0] ? (
          <img
            src={product.images[0]}
            alt={product.name}
            loading="lazy"
            className="h-full w-full object-contain mix-blend-multiply transition group-hover:scale-[1.03]"
          />
        ) : (
          <span className="grid h-full w-full place-items-center text-[11px] text-[#9a9a9a]">No image</span>
        )}

        {soldOut && (
          <span className="absolute left-2 top-2 rounded-full border border-red-200 bg-red-50 px-2 py-0.5 text-[10px] font-bold text-red-700">
            Sold out
          </span>
        )}
        {lowStock && (
          <span className="absolute left-2 top-2 rounded-full border border-[#F3E6D3] bg-[#FFF1DA] px-2 py-0.5 text-[10px] font-bold text-[#E85D26]">
            Low stock
          </span>
        )}
      </Link>

      <div className="flex flex-1 flex-col p-2.5">
        {/* Exactly two lines, always — the main cause of ragged grids. */}
        <Link
          to={href}
          className="line-clamp-2 h-[2.1rem] text-[12.5px] font-bold leading-[1.05rem] hover:text-[#0B9C74]"
        >
          {product.name}
        </Link>

        <span className="mt-1 line-clamp-1 h-4 text-[10.5px] leading-4 text-[#9a9a9a]">
          {storeName || product.category || ""}
        </span>

        <div className="mt-1 flex h-5 items-baseline gap-1 text-[13px] font-bold leading-5">
          {display.hasDiscount ? (
            <>
              <span className="text-[#E85D26]">₦{price.toLocaleString()}</span>
              <span className="text-[10px] font-medium text-[#9a9a9a] line-through">
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
          className={`mt-2 inline-flex h-8 w-full items-center justify-center gap-1 rounded-full px-2 text-[11px] font-bold text-white transition disabled:cursor-not-allowed disabled:bg-[#c9c9c9] ${
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

/**
 * Shared grid wrapper so every product listing breaks at the same widths.
 * Denser on large screens than the old four-column grid, which produced very
 * large cards on a desktop.
 */
export const PRODUCT_GRID =
  "grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6"
