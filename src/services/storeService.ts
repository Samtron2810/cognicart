import api from "./api"
import type { PromotedProduct, SearchResults, StoreListResponse, StoreSort, StoreSummary } from "../types/store"

type ListStoresParams = {
  page?: number
  limit?: number
  q?: string
  sort?: StoreSort
  includeEmpty?: boolean
}

/**
 * The public seller directory: /api/stores lists stores, where
 * /api/storefront/:identifier serves one store's catalog.
 */
export const storeService = {
  async list(params: ListStoresParams = {}): Promise<StoreListResponse> {
    const { data } = await api.get<StoreListResponse>("/stores", { params })
    return data
  },

  /** The small strip above the seller list. Backend caps this at 8. */
  async listPromotedProducts(limit = 8): Promise<PromotedProduct[]> {
    const { data } = await api.get<{ products: PromotedProduct[] }>("/stores/promoted-products", {
      params: { limit },
    })
    return data.products
  },

  /** "Other Stores" quick-jump bar shown inside a store page. */
  /**
   * Global search across sellers and products.
   *
   * The backend caps results at 3 sellers and 5 products so the dropdown
   * stays a dropdown. The full /search page asks for more.
   */
  async search(q: string, sellerLimit?: number, productLimit?: number): Promise<SearchResults> {
    const { data } = await api.get<SearchResults>("/search", { params: { q, sellerLimit, productLimit } })
    return data
  },

  async listOtherStores(excludeSellerId: string, limit = 10): Promise<StoreSummary[]> {
    const { data } = await api.get<{ stores: StoreSummary[] }>("/stores/others", {
      params: { exclude: excludeSellerId, limit },
    })
    return data.stores
  },
}
