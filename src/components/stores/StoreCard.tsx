import { Link } from "react-router-dom"
import { ArrowRight, Package, Sparkles, Star, Store } from "lucide-react"
import type { StoreCard as StoreCardType } from "../../types/store"
import { storePath } from "../../types/store"

/**
 * One seller on the public directory.
 *
 * The card sells the *store*, not a product: logo, name, what they stock, how
 * many items, and how they are rated. The only action is to go in.
 */
export function StoreCard({ store }: { store: StoreCardType }) {
  return (
    <Link
      to={storePath(store)}
      className="group flex flex-col rounded-[20px] border border-[#F3E6D3] bg-white p-5 transition hover:-translate-y-0.5 hover:shadow-[0_12px_30px_rgba(0,0,0,0.08)]"
    >
      <div className="flex items-start gap-3.5">
        <span className="grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-2xl border border-[#F3E6D3] bg-[#FFF1DA]">
          {store.logo ? (
            <img src={store.logo} alt="" className="h-full w-full object-cover" />
          ) : (
            <Store className="h-6 w-6 text-[#E85D26]" />
          )}
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <h3 className="truncate font-display text-[17px] font-bold leading-tight">{store.name}</h3>
            {/* Paid placement is labelled. A buyer is entitled to know why a
                store is at the top of the list. */}
            {store.isSponsored && (
              <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-[#FFF1DA] px-2 py-0.5 text-[10px] font-bold tracking-wide text-[#E85D26]">
                <Sparkles className="h-2.5 w-2.5" /> SPONSORED
              </span>
            )}
            {store.isNew && !store.isSponsored && (
              <span className="inline-flex shrink-0 rounded-full bg-[#E6F7F1] px-2 py-0.5 text-[10px] font-bold tracking-wide text-[#0B9C74]">
                NEW
              </span>
            )}
          </div>

          <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[#6b6b6b]">
            <span className="inline-flex items-center gap-1 font-bold">
              <Package className="h-3.5 w-3.5 text-[#0B9C74]" />
              {store.productCount} {store.productCount === 1 ? "product" : "products"}
            </span>

            {store.rating === null ? (
              // No review system has rated this store yet. Say so plainly
              // rather than printing a misleading 0.0 out of 5.
              <span className="text-[#9a9a9a]">No ratings yet</span>
            ) : (
              <span className="inline-flex items-center gap-1 font-bold">
                <Star className="h-3.5 w-3.5 fill-[#E85D26] text-[#E85D26]" />
                {store.rating.toFixed(1)}
                <span className="font-normal text-[#9a9a9a]">({store.ratingCount})</span>
              </span>
            )}
          </div>
        </div>
      </div>

      <p className="mt-3.5 min-h-[40px] flex-1 text-[13px] leading-5 text-[#6b6b6b] line-clamp-2">
        {store.description || "This seller has not added a store description yet."}
      </p>

      <div className="mt-4 flex items-center justify-between border-t border-[#F3E6D3] pt-3.5">
        {store.deliveryTime ? (
          <span className="text-[11px] font-medium text-[#9a9a9a]">Delivery {store.deliveryTime}</span>
        ) : (
          <span />
        )}
        <span className="inline-flex items-center gap-1.5 text-sm font-bold text-[#0B9C74] group-hover:gap-2.5 transition-all">
          Visit Store <ArrowRight className="h-4 w-4" />
        </span>
      </div>
    </Link>
  )
}
