/** A seller as shown on the public directory at /stores. */
export type StoreCard = {
  sellerId: string
  slug: string
  name: string
  description: string
  logo: string
  productCount: number
  /**
   * null when the store has no ratings yet. Deliberately not 0: "not rated"
   * and "rated zero" mean very different things to a buyer, and the card has
   * to be able to tell them apart.
   */
  rating: number | null
  ratingCount: number
  isSponsored: boolean
  /** Registered within the new-seller window, so the card shows a "New" badge. */
  isNew: boolean
  deliveryTime: string
  createdAt: string
}

export type StorePagination = {
  total: number
  page: number
  limit: number
  totalPages: number
  hasMore: boolean
}

export type StoreListResponse = {
  stores: StoreCard[]
  pagination: StorePagination
}

/** An item in the small promoted strip above the seller list. */
export type PromotedProduct = {
  id: string
  name: string
  price: number
  currency: string
  image: string
  discount?: { active: boolean; type: "percentage" | "fixed"; value: number } | null
  sellerId: string
  storeName: string
  storeSlug: string
  storeLogo: string
}

export type StoreSummary = {
  sellerId: string
  slug: string
  name: string
  logo: string
  productCount: number
}

export type StoreSort = "ranked" | "newest" | "name" | "products"

/**
 * Canonical public URL for a store.
 *
 * The slug is preferred because it is readable and shareable; the sellerId is
 * the fallback for a profile that has not been given one yet. Both resolve on
 * the backend, which matches on either.
 */
export function storePath(store: { slug?: string; sellerId: string }): string {
  return `/store/${store.slug || store.sellerId}`
}

/**
 * Canonical public URL for a product, nested under its store.
 *
 * Products live under their seller on purpose: it is the shape the backend
 * sitemap and SEO metadata already advertise, and it keeps the whole site
 * seller-first rather than bolting a store page onto a flat product catalog.
 */
export function productPath(store: { slug?: string; sellerId: string } | string, productId: string): string {
  const identifier = typeof store === "string" ? store : store.slug || store.sellerId
  return `/store/${identifier}/products/${productId}`
}

/** Discounted price for a promoted strip item. */
export function promotedPrice(item: PromotedProduct): number {
  const d = item.discount
  if (!d || !d.active || !d.value) return item.price
  if (d.type === "percentage") {
    const pct = Math.min(Math.max(d.value, 0), 90)
    return Math.max(1, Math.round(item.price * (1 - pct / 100)))
  }
  return Math.max(1, item.price - Math.min(d.value, item.price - 1))
}

/** A seller row in the global search dropdown. */
export type SearchSeller = {
  sellerId: string
  slug: string
  name: string
  logo: string
  productCount: number
  rating: number | null
}

/** A product row in the global search dropdown. */
export type SearchProduct = {
  id: string
  name: string
  price: number
  currency: string
  image: string
  category: string
  sellerId: string
  storeName: string
  storeSlug: string
}

export type SearchResults = {
  query: string
  sellers: SearchSeller[]
  products: SearchProduct[]
}
