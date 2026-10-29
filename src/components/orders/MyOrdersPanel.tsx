import { Link } from "react-router-dom"
import { Package, Star, Store } from "lucide-react"
import { productPath, storePath } from "../../types/store"
import type { ShopperOrder } from "../../types/shopper"

type MyOrdersPanelProps = {
  orders: ShopperOrder[]
  loading?: boolean
  /** Highlighted as "viewing" and never linked to itself. */
  activeOrderId?: string
  /** Compact sidebar rendering for the order-tracking page. */
  compact?: boolean
  title?: string
}

/**
 * The buyer's orders, broken down into the products inside them.
 *
 * Shared by the orders list at /track and the tracking page at
 * /track/orders/:id so both show the same thing — a buyer who can rate an
 * item from one page is confused to find they cannot from the other.
 *
 * A delivered order can be rated two ways, and both are offered here
 * because both feed the store's rating and therefore its position in the
 * directory: "Rate this product" per item, and "Rate this store" once per
 * order. Leaving the store form only on the store page made the two
 * unequally discoverable, which quietly biased the ranking signal toward
 * whichever one had a button.
 *
 * Both link out with ?review=1, which scrolls the target page's form into
 * view. They are only shortcuts: the server decides who may actually post,
 * so a stale button cannot grant anyone anything.
 */
export function MyOrdersPanel({
  orders,
  loading = false,
  activeOrderId,
  compact = false,
  title = "My orders",
}: MyOrdersPanelProps) {
  return (
    <div className="rounded-2xl border border-[#F3E6D3] bg-white p-5">
      <h2 className="flex items-center gap-2 font-bold">
        <Package className="h-4 w-4 text-[#0B9C74]" />
        {title}
      </h2>

      {loading ? (
        <div className="grid place-items-center py-10">
          <div className="h-7 w-7 animate-spin rounded-full border-2 border-[#0B9C74] border-t-transparent" />
        </div>
      ) : orders.length === 0 ? (
        <div className="py-8 text-center">
          <p className="text-sm text-[#6b6b6b]">No orders linked to this profile yet.</p>
          <Link
            to="/stores"
            className="mt-3 inline-flex rounded-full bg-[#0B9C74] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#0a8a66]"
          >
            Browse stores
          </Link>
        </div>
      ) : (
        <ul className={`mt-3 space-y-3 ${compact ? "max-h-[520px] overflow-y-auto pr-1" : ""}`}>
          {orders.map((order) => {
            const isActive = order.id === activeOrderId
            const delivered = order.orderStatus === "Delivered"
            const storeKey = order.store?.slug || order.sellerId

            return (
              <li
                key={order.id}
                className={`rounded-xl border p-3 ${
                  isActive ? "border-[#0B9C74] bg-[#E6F7F1]" : "border-[#F3E6D3]"
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="text-sm font-bold">
                      {isActive ? (
                        <span>{order.reference || `#${order.id.slice(-6).toUpperCase()}`}</span>
                      ) : (
                        <Link to={`/track/orders/${order.id}`} className="hover:text-[#0B9C74]">
                          {order.reference || `#${order.id.slice(-6).toUpperCase()}`}
                        </Link>
                      )}
                      {order.store ? (
                        <span className="font-normal text-[#6b6b6b]"> • {order.store.name}</span>
                      ) : null}
                    </div>
                    <div className="text-xs text-[#9a9a9a]">
                      {new Date(order.createdAt).toLocaleDateString()}
                      {isActive ? " • viewing" : ""}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold">₦{order.total.toLocaleString()}</span>
                    <span
                      className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-bold ${
                        delivered
                          ? "border-[#0B9C74]/20 bg-[#E6F7F1] text-[#0B9C74]"
                          : order.orderStatus === "Cancelled"
                            ? "border-red-200 bg-red-50 text-red-700"
                            : "border-[#F3E6D3] bg-white"
                      }`}
                    >
                      {order.orderStatus}
                    </span>
                  </div>
                </div>

                {delivered && storeKey && (
                  <Link
                    to={`${storePath({ slug: order.store?.slug, sellerId: order.sellerId })}?review=1`}
                    className="mt-2 inline-flex items-center gap-1 rounded-full border border-[#F3E6D3] bg-[#FFFBF5] px-2.5 py-1 text-[11px] font-bold text-[#4a4a4a] transition hover:border-[#0B9C74] hover:text-[#0B9C74]"
                  >
                    <Store className="h-3 w-3" />
                    Rate {order.store?.name || "this store"}
                  </Link>
                )}

                {/* The ordered products themselves. */}
                <ul className="mt-2 space-y-1.5 border-t border-[#F3E6D3] pt-2">
                  {order.items.map((item, index) => (
                    <li
                      key={`${order.id}-${item.productId || item.name}-${index}`}
                      className="flex flex-wrap items-center gap-2"
                    >
                      {item.image ? (
                        <img
                          src={item.image}
                          alt=""
                          className="h-8 w-8 shrink-0 rounded-lg border border-[#F3E6D3] bg-[#FFFBF5] object-cover"
                        />
                      ) : (
                        <div className="h-8 w-8 shrink-0 rounded-lg border border-[#F3E6D3] bg-[#FFFBF5]" />
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-xs font-bold">{item.name}</div>
                        <div className="text-[11px] text-[#9a9a9a]">
                          {item.variantLabel ? `${item.variantLabel} • ` : ""}
                          {"\u20a6"}
                          {item.price.toLocaleString()} × {item.quantity}
                        </div>
                      </div>

                      {/* Only a delivered catalog item can be rated. A custom
                          line typed in by the seller has no product page. */}
                      {delivered && item.productId && (
                        <Link
                          to={`${productPath(storeKey, item.productId)}?review=1`}
                          className="inline-flex shrink-0 items-center gap-1 rounded-full border border-[#0B9C74] bg-white px-2.5 py-1 text-[11px] font-bold text-[#0B9C74] transition hover:bg-[#E6F7F1]"
                        >
                          <Star className="h-3 w-3" />
                          Rate this product
                        </Link>
                      )}
                    </li>
                  ))}
                </ul>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
