import { Link } from "react-router-dom"
import { Flame } from "lucide-react"
import type { PromotedProduct } from "../../types/store"
import { productPath, promotedPrice } from "../../types/store"

/**
 * The "Trending Now" strip above the seller list.
 *
 * Deliberately small — a horizontal row of icon-sized tiles, capped at 8 by
 * the backend. This page is seller-first, and a full product grid here would
 * bury the stores it exists to promote.
 */
export function PromotedStrip({ items }: { items: PromotedProduct[] }) {
  if (!items.length) return null

  return (
    <section className="mt-6 rounded-[20px] border border-[#F3E6D3] bg-white px-4 py-3.5">
      <div className="flex items-center gap-2">
        <Flame className="h-4 w-4 text-[#E85D26]" />
        <h2 className="text-xs font-bold tracking-widest text-[#1a1a1a]">TRENDING NOW</h2>
        <span className="text-[11px] text-[#9a9a9a]">Promoted products</span>
      </div>

      <ul className="mt-3 flex gap-3 overflow-x-auto pb-1">
        {items.map((item) => {
          const price = promotedPrice(item)
          return (
            <li key={item.id} className="shrink-0">
              <Link
                to={productPath({ slug: item.storeSlug, sellerId: item.sellerId }, item.id)}
                className="group flex w-[132px] flex-col gap-1.5"
                title={`${item.name} — ${item.storeName}`}
              >
                <span className="grid h-[72px] w-[72px] place-items-center overflow-hidden rounded-xl border border-[#F3E6D3] bg-[#FFFBF5]">
                  {item.image ? (
                    <img
                      src={item.image}
                      alt={item.name}
                      className="h-full w-full object-contain p-1.5 transition group-hover:scale-105"
                    />
                  ) : (
                    <span className="text-[10px] text-[#9a9a9a]">No image</span>
                  )}
                </span>
                <span className="line-clamp-1 text-[12px] font-bold leading-tight group-hover:text-[#0B9C74]">
                  {item.name}
                </span>
                <span className="text-[12px] font-bold text-[#E85D26]">₦{price.toLocaleString()}</span>
                <span className="line-clamp-1 text-[10px] text-[#9a9a9a]">{item.storeName}</span>
              </Link>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
