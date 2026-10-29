import { describe, expect, it, vi, beforeEach, afterEach } from "vitest"
import { render, screen, waitFor, fireEvent } from "@testing-library/react"
import { MemoryRouter, Route, Routes } from "react-router-dom"
import { CartProvider } from "../../context/CartContext"
import { productService } from "../../services/productService"
import { storeService } from "../../services/storeService"
import SellerStorefront from "./SellerStorefront"
import type { Product } from "../../types/product"

// The reviews block needs ShopperProvider and does its own fetching. It is
// not under test here, so it is stubbed out to keep this focused.
vi.mock("../../components/reviews/StoreReviews", () => ({
  StoreReviews: () => null,
}))

/**
 * The store page's category filter.
 *
 * The contract worth protecting: the chips come from the store's whole
 * catalog (not the filtered page), the choice lives in the URL, and picking
 * one re-queries the backend rather than slicing the page already on screen.
 */

const STORE = {
  sellerId: "seller-1",
  slug: "vivid-fashions",
  name: "Vivid Fashions",
  description: "Lagos label",
  logo: null,
  banner: null,
  phone: null,
  whatsapp: null,
  telegramBotUrl: null,
  address: null,
  isActive: true,
}

const product = (id: string, name: string, category: string): Product =>
  ({
    id,
    sellerId: "seller-1",
    name,
    description: "",
    price: 12000,
    stock: 7,
    category,
    images: [],
    variants: [],
    isActive: true,
    createdAt: new Date().toISOString(),
  }) as unknown as Product

const ALL = [product("p1", "Ankara wrap dress", "Dresses"), product("p2", "Leather tote", "Bags")]

function renderStore(initialPath = "/store/vivid-fashions") {
  return render(
    <CartProvider>
      <MemoryRouter initialEntries={[initialPath]}>
        <Routes>
          <Route path="/store/:identifier" element={<SellerStorefront />} />
        </Routes>
      </MemoryRouter>
    </CartProvider>,
  )
}

describe("SellerStorefront category filter", () => {
  let catalog: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    window.localStorage.clear()
    vi.spyOn(productService, "getStorefront").mockResolvedValue(STORE as never)
    vi.spyOn(storeService, "listOtherStores").mockResolvedValue([])
    catalog = vi.spyOn(productService, "listStorefrontCatalog").mockImplementation(
      async (_identifier: string, filters = {}) => ({
        // Mirror the backend: categories always describe the full catalog.
        products: filters.category ? ALL.filter((p) => p.category === filters.category) : ALL,
        categories: ["Bags", "Dresses"],
      }),
    ) as never
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it("renders a chip for every category the store sells, plus All", async () => {
    renderStore()
    expect(await screen.findByRole("button", { name: "Dresses" })).toBeTruthy()
    expect(screen.getByRole("button", { name: "Bags" })).toBeTruthy()
    expect(screen.getByRole("button", { name: "All" })).toBeTruthy()
  })

  it("marks All as the active chip before anything is chosen", async () => {
    renderStore()
    const all = await screen.findByRole("button", { name: "All" })
    expect(all.getAttribute("aria-pressed")).toBe("true")
  })

  it("re-queries the backend with the chosen category", async () => {
    renderStore()
    fireEvent.click(await screen.findByRole("button", { name: "Dresses" }))

    await waitFor(() => {
      expect(catalog).toHaveBeenCalledWith("vivid-fashions", { category: "Dresses" })
    })
  })

  it("shows only the matching products after filtering", async () => {
    renderStore()
    expect(await screen.findByText("Leather tote")).toBeTruthy()

    fireEvent.click(screen.getByRole("button", { name: "Dresses" }))

    await waitFor(() => {
      expect(screen.queryByText("Leather tote")).toBeNull()
    })
    expect(screen.getByText("Ankara wrap dress")).toBeTruthy()
  })

  it("reads the initial category from the URL", async () => {
    renderStore("/store/vivid-fashions?category=Bags")

    await waitFor(() => {
      expect(catalog).toHaveBeenCalledWith("vivid-fashions", { category: "Bags" })
    })
    expect(await screen.findByText("Leather tote")).toBeTruthy()
    expect(screen.queryByText("Ankara wrap dress")).toBeNull()
  })

  it("keeps every chip on screen while a filter is applied", async () => {
    // Deriving chips from the visible products would make the others vanish
    // and strand the shopper inside one category.
    renderStore("/store/vivid-fashions?category=Bags")
    expect(await screen.findByRole("button", { name: "Dresses" })).toBeTruthy()
    expect(screen.getByRole("button", { name: "Bags" })).toBeTruthy()
  })

  it("clears the filter through All", async () => {
    renderStore("/store/vivid-fashions?category=Bags")
    expect(await screen.findByText("Leather tote")).toBeTruthy()

    fireEvent.click(screen.getByRole("button", { name: "All" }))

    await waitFor(() => {
      expect(screen.getByText("Ankara wrap dress")).toBeTruthy()
    })
    expect(catalog).toHaveBeenLastCalledWith("vivid-fashions", { category: undefined })
  })

  it("offers a way out when a category is empty", async () => {
    vi.spyOn(productService, "listStorefrontCatalog").mockResolvedValue({
      products: [],
      categories: ["Bags", "Dresses"],
    })
    renderStore("/store/vivid-fashions?category=Dresses")

    expect(await screen.findByText(/Nothing in Dresses/)).toBeTruthy()
    expect(screen.getByRole("button", { name: "Show all products" })).toBeTruthy()
  })

  it("hides the filter when the store has only one category", async () => {
    vi.spyOn(productService, "listStorefrontCatalog").mockResolvedValue({
      products: [ALL[0]],
      categories: ["Dresses"],
    })
    renderStore()

    expect(await screen.findByText("Ankara wrap dress")).toBeTruthy()
    expect(screen.queryByRole("button", { name: "All" })).toBeNull()
  })

  it("survives a failed product fetch without blanking the store", async () => {
    vi.spyOn(productService, "listStorefrontCatalog").mockRejectedValue(new Error("offline"))
    renderStore()

    expect(await screen.findByText(/no active products yet/i)).toBeTruthy()
    // The name appears in both the header and the breadcrumb.
    expect(screen.getAllByText("Vivid Fashions").length).toBeGreaterThan(0)
  })
})
