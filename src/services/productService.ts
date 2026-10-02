import api from "./api"
import type { CreateProductPayload, Product, UpdateProductPayload } from "../types/product"
import type { StorefrontProfile } from "../types/business"
import { getIdempotencyKey } from "../utils/idempotency"

type ProductFilters = {
  search?: string
  category?: string
  isActive?: boolean
  sellerId?: string
}

export const productService = {
  async list(filters: ProductFilters = {}): Promise<Product[]> {
    const { data } = await api.get<Product[]>("/products", { params: filters })
    return data
  },

  async listPublic(filters: ProductFilters = {}): Promise<Product[]> {
    const { data } = await api.get<Product[]>("/products", { params: { ...filters, public: true } })
    return data
  },

  async getById(id: string, isPublic = true): Promise<Product> {
    const { data } = await api.get<Product>(`/products/${id}`, { params: isPublic ? { public: true } : undefined })
    return data
  },

  async getStorefront(identifier: string): Promise<StorefrontProfile> {
    const { data } = await api.get<StorefrontProfile>(`/storefront/${identifier}`)
    return data
  },

  async listStorefrontProducts(identifier: string, filters: ProductFilters = {}): Promise<Product[]> {
    const { data } = await api.get<{ products: Product[] }>(`/storefront/${identifier}/products`, { params: filters })
    return data.products
  },

  async getStorefrontProduct(identifier: string, productId: string): Promise<{ store: StorefrontProfile; product: Product; relatedProducts: Product[] }> {
    const { data } = await api.get<{ store: StorefrontProfile; product: Product; relatedProducts: Product[] }>(`/storefront/${identifier}/products/${productId}`)
    return data
  },

  async create(payload: CreateProductPayload): Promise<Product> {
    const { data } = await api.post<Product>("/products", payload, {
      headers: { "X-Idempotency-Key": getIdempotencyKey("product") },
    })
    return data
  },

  async update(id: string, payload: UpdateProductPayload): Promise<Product> {
    const { data } = await api.patch<Product>(`/products/${id}`, payload)
    return data
  },

  async remove(id: string): Promise<void> {
    await api.delete(`/products/${id}`)
  },

  async toggleActive(id: string, isActive: boolean): Promise<Product> {
    return this.update(id, { isActive })
  },

  async toggleDiscount(id: string, discount: NonNullable<Product["discount"]>): Promise<Product> {
    return this.update(id, { discount })
  },
}
