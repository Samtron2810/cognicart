import { useEffect, useState } from "react"
import { Link, useSearchParams } from "react-router-dom"
import { ChevronRight, Search, ShoppingBag, Store as StoreIcon } from "lucide-react"
import { storeService } from "../../services/storeService"
import { PromotedStrip } from "../../components/stores/PromotedStrip"
import { StoreCard } from "../../components/stores/StoreCard"
import { ProductCard } from "../../components/products/ProductCard"
import { productService } from "../../services/productService"
import { useSEO } from "../../hooks/useSEO"
import type { PromotedProduct, StoreCard as StoreCardType, StorePagination, StoreSort } from "../../types/store"
import type { Product } from "../../types/product"

const SORTS: { value: StoreSort; label: string }[] = [
  { value: "ranked", label: "Recommended" },
  { value: "newest", label: "Newest" },
  { value: "products", label: "Biggest catalog" },
  { value: "name", label: "A–Z" },
]

/**
 * The seller-first storefront.
 *
 * /stores lists stores, not products. A buyer picks a seller, then browses
 * that seller's catalog — which is also what makes the per-store chatbot and
 * the per-seller order split coherent later on.
 */
export default function Stores() {
  const [searchParams, setSearchParams] = useSearchParams()
  const q = searchParams.get("q") || ""
  const sort = (searchParams.get("sort") as StoreSort) || "ranked"
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10) || 1)

  const [stores, setStores] = useState<StoreCardType[]>([])
  const [promoted, setPromoted] = useState<PromotedProduct[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [pagination, setPagination] = useState<StorePagination | null>(null)
  const [loading, setLoading] = useState(true)
  const [failed, setFailed] = useState(false)
  // Local mirror of the query box so typing stays responsive; the URL is only
  // rewritten when the debounce fires.
  const [term, setTerm] = useState(q)

  const title = q ? `Stores matching "${q}" | Chatstand` : "Browse Stores — Shop Verified Sellers | Chatstand"
  const desc =
    "Browse every seller on Chatstand. Each store has its own catalog, its own delivery terms and its own assistant — pick a store and shop it directly."
  const canonical = typeof window !== "undefined" ? window.location.href : "https://chatstand.ng/stores"

  useSEO({
    title,
    description: desc,
    canonical,
    ogTitle: title,
    ogDescription: desc,
    ogUrl: canonical,
    ogType: "website",
  })

  useEffect(() => {
    setTerm(q)
  }, [q])

  // Debounced search: one request per pause in typing, not one per keystroke.
  useEffect(() => {
    if (term === q) return
    const handle = setTimeout(() => {
      const next = new URLSearchParams(searchParams)
      if (term) next.set("q", term)
      else next.delete("q")
      next.delete("page")
      setSearchParams(next, { replace: true })
    }, 350)
    return () => clearTimeout(handle)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [term])

  useEffect(() => {
    let active = true
    setLoading(true)
    setFailed(false)

    storeService
      .list({ q: q || undefined, sort, page })
      .then((data) => {
        if (!active) return
        setStores(data.stores)
        setPagination(data.pagination)
      })
      .catch(() => {
        if (active) setFailed(true)
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [q, sort, page])

  // A query searches products as well as stores. Full Product objects are
  // used rather than the lighter /search projection so the cards know about
  // stock and variants and can add to the cart correctly.
  useEffect(() => {
    if (!q) {
      setProducts([])
      return
    }
    let active = true
    productService
      .listPublic({ search: q })
      .then((data) => {
        if (active) setProducts(data.filter((item) => item.isActive))
      })
      .catch(() => {
        // Products are a bonus here; a failure must not break the directory.
        if (active) setProducts([])
      })
    return () => {
      active = false
    }
  }, [q])

  // The promoted strip is independent of the seller query: it never filters
  // down to nothing just because someone searched for one shop.
  useEffect(() => {
    let active = true
    storeService
      .listPromotedProducts(8)
      .then((items) => {
        if (active) setPromoted(items)
      })
      .catch(() => {
        // A failed strip must not take the directory down with it.
        if (active) setPromoted([])
      })
    return () => {
      active = false
    }
  }, [])

  // Products can belong to sellers outside the current page of store
  // results, in which case the card falls back to the sellerId URL and
  // shows its category instead of a store name.
  const storeSlugFor = (sellerId: string) => stores.find((store) => store.sellerId === sellerId)?.slug || sellerId
  const storeNameFor = (sellerId: string) => stores.find((store) => store.sellerId === sellerId)?.name

  const setParam = (key: string, value: string | null) => {
    const next = new URLSearchParams(searchParams)
    if (value) next.set(key, value)
    else next.delete(key)
    if (key !== "page") next.delete("page")
    setSearchParams(next)
  }

  return (
    <div className="min-h-screen bg-[#FFFBF5]">
      <div className="mx-auto max-w-[1280px] px-4 py-8 sm:px-6 lg:px-8">
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-[#6b6b6b]">
          <Link to="/" className="hover:text-[#1a1a1a]">Home</Link>
          <ChevronRight className="h-3 w-3" />
          <span className="font-bold text-[#1a1a1a]">Stores</span>
        </nav>

        <div className="mt-3 flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
          <div>
            <h1 className="font-display text-[34px] font-bold leading-none tracking-tight sm:text-[40px]">
              Browse stores
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-[#6b6b6b]">
              Every seller on Chatstand has their own store, their own catalog and their own assistant. Pick a store to
              shop it directly.
            </p>
          </div>
          <Link
            to="/cart"
            className="hidden items-center gap-2 rounded-full bg-[#1a1a1a] px-5 py-2.5 text-sm font-bold text-white hover:bg-black lg:inline-flex"
          >
            <ShoppingBag className="h-4 w-4" /> View cart
          </Link>
        </div>

        <PromotedStrip items={promoted} />

        <div className="mt-6 flex flex-col gap-3 rounded-2xl border border-[#F3E6D3] bg-white p-4 sm:flex-row">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9a9a9a]" />
            <input
              value={term}
              onChange={(event) => setTerm(event.target.value)}
              placeholder="Search stores and products"
              aria-label="Search stores and products"
              className="w-full rounded-xl border border-[#F3E6D3] py-2.5 pl-9 pr-3 text-sm outline-none focus:border-[#0B9C74] focus:ring-2 focus:ring-[#0B9C74]/15"
            />
          </div>
          <div className="flex items-center gap-2 overflow-x-auto">
            {SORTS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setParam("sort", option.value === "ranked" ? null : option.value)}
                className={`whitespace-nowrap rounded-full border px-4 py-2 text-sm font-bold ${
                  sort === option.value
                    ? "border-[#1a1a1a] bg-[#1a1a1a] text-white"
                    : "border-[#F3E6D3] bg-white hover:bg-[#FFF1DA]"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="grid place-items-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#0B9C74] border-t-transparent" />
          </div>
        ) : failed ? (
          <div className="mt-6 rounded-2xl border border-[#F3E6D3] bg-white p-10 text-center">
            <div className="font-bold">Could not load stores</div>
            <p className="mt-1 text-sm text-[#6b6b6b]">The backend did not respond. Try again in a moment.</p>
          </div>
        ) : stores.length === 0 && products.length === 0 ? (
          <div className="mt-6 rounded-2xl border border-[#F3E6D3] bg-white p-10 text-center">
            <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-[#E6F7F1]">
              <StoreIcon className="h-6 w-6 text-[#0B9C74]" />
            </span>
            <div className="mt-3 font-bold">{q ? `Nothing matches "${q}"` : "No stores yet"}</div>
            <p className="mt-1 text-sm text-[#6b6b6b]">
              {q ? "No stores or products with that name. Try a different term." : "Stores appear here once a seller publishes their first product."}
            </p>
            {q && (
              <button
                type="button"
                onClick={() => setParam("q", null)}
                className="mt-4 rounded-full bg-[#0B9C74] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#0a8a66]"
              >
                Clear search
              </button>
            )}
          </div>
        ) : (
          <>
            {stores.length > 0 && (
              <>
                <div className="mt-6 flex items-baseline justify-between">
                  <p className="text-sm text-[#6b6b6b]">
                    {pagination?.total ?? stores.length}{" "}
                    {(pagination?.total ?? stores.length) === 1 ? "store" : "stores"}
                    {q ? " matching" : ""}
                  </p>
                </div>

                <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {stores.map((store) => (
                    <StoreCard key={store.sellerId} store={store} />
                  ))}
                </div>
              </>
            )}

            {pagination && pagination.totalPages > 1 && (
              <div className="mt-8 flex items-center justify-center gap-3">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setParam("page", String(page - 1))}
                  className="rounded-full border border-[#F3E6D3] bg-white px-5 py-2.5 text-sm font-bold disabled:cursor-not-allowed disabled:opacity-40 hover:bg-[#FFF1DA]"
                >
                  Previous
                </button>
                <span className="text-sm text-[#6b6b6b]">
                  Page {pagination.page} of {pagination.totalPages}
                </span>
                <button
                  type="button"
                  disabled={!pagination.hasMore}
                  onClick={() => setParam("page", String(page + 1))}
                  className="rounded-full border border-[#F3E6D3] bg-white px-5 py-2.5 text-sm font-bold disabled:cursor-not-allowed disabled:opacity-40 hover:bg-[#FFF1DA]"
                >
                  Next
                </button>
              </div>
            )}

            {q && products.length > 0 && (
              <section className="mt-10">
                <div className="flex items-baseline justify-between">
                  <h2 className="font-display text-xl font-bold">
                    {products.length} {products.length === 1 ? "product" : "products"} matching &ldquo;{q}&rdquo;
                  </h2>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-4 lg:grid-cols-4">
                  {products.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      storeIdentifier={storeSlugFor(product.sellerId)}
                      storeName={storeNameFor(product.sellerId)}
                    />
                  ))}
                </div>
              </section>
            )}
          </>
        )}

        <div className="mt-10 flex flex-col items-center justify-between gap-4 rounded-2xl border border-[#F3E6D3] bg-white p-6 lg:flex-row">
          <div className="text-sm">
            <span className="font-bold">Looking for something specific?</span>{" "}
            <span className="text-[#6b6b6b]">Browse every product across all stores instead.</span>
          </div>
          <Link
            to="/marketplace"
            className="rounded-full bg-[#0B9C74] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#0a8a66]"
          >
            Browse all products
          </Link>
        </div>
      </div>
    </div>
  )
}
