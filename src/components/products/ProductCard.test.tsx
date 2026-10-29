import { beforeEach, describe, expect, it } from "vitest"
import { fireEvent, render, screen } from "@testing-library/react"
import { MemoryRouter } from "react-router-dom"
import { ProductCard } from "./ProductCard"
import { CartProvider, useCart } from "../../context/CartContext"
import type { Product } from "../../types/product"

const baseProduct = {
  id: "p1",
  sellerId: "seller-1",
  name: "Ankara Tote Bag",
  description: "Hand-stitched.",
  price: 12000,
  currency: "NGN",
  stock: 5,
  category: "Bags",
  images: ["https://example.test/tote.jpg"],
  isActive: true,
} as unknown as Product

/** Reads the cart so a test can assert on what the button actually did. */
function CartProbe() {
  const { items } = useCart()
  return <div data-testid="cart">{items.map((item) => `${item.productId}:${item.sellerId}:${item.quantity}`).join("|")}</div>
}

const renderCard = (product: Partial<Product> = {}, props: Record<string, unknown> = {}) =>
  render(
    <MemoryRouter>
      <CartProvider>
        <ProductCard product={{ ...baseProduct, ...product } as Product} {...props} />
        <CartProbe />
      </CartProvider>
    </MemoryRouter>,
  )

describe("ProductCard", () => {
  beforeEach(() => window.localStorage.clear())

  it("adds to the cart without leaving the page", () => {
    renderCard()
    fireEvent.click(screen.getByRole("button", { name: /add ankara tote bag to cart/i }))
    expect(screen.getByTestId("cart").textContent).toBe("p1:seller-1:1")
  })

  it("confirms the add so the shopper knows it worked", () => {
    renderCard()
    fireEvent.click(screen.getByRole("button", { name: /add ankara tote bag to cart/i }))
    expect(screen.getByText("Added")).toBeInTheDocument()
  })

  it("links the image and the title to the product page", () => {
    renderCard()
    const links = screen.getAllByRole("link")
    // Both the image and the name must open the product — clicking the card
    // anywhere other than the button is how the rest of the site behaves.
    expect(links.length).toBeGreaterThanOrEqual(2)
    for (const link of links) {
      expect(link.getAttribute("href")).toBe("/store/seller-1/products/p1")
    }
  })

  it("prefers the store slug in the URL when one is given", () => {
    renderCard({}, { storeIdentifier: "vivid-fashions" })
    expect(screen.getAllByRole("link")[0].getAttribute("href")).toBe("/store/vivid-fashions/products/p1")
  })

  it("sends a variant product to its page instead of guessing a variant", () => {
    renderCard({ variants: [{ id: "v1", name: "Red", stock: 3 }] } as unknown as Partial<Product>)
    const button = screen.getByRole("button", { name: /choose options/i })
    fireEvent.click(button)
    // Nothing may enter the cart: size and colour have not been chosen.
    expect(screen.getByTestId("cart").textContent).toBe("")
  })

  it("disables the button when the product is sold out", () => {
    renderCard({ stock: 0 })
    const button = screen.getByRole("button")
    expect(button).toBeDisabled()
    fireEvent.click(button)
    expect(screen.getByTestId("cart").textContent).toBe("")
  })

  it("shows the store name in cross-store listings and the category otherwise", () => {
    const { unmount } = renderCard({}, { storeName: "Vivid Fashions" })
    expect(screen.getByText("Vivid Fashions")).toBeInTheDocument()
    unmount()

    renderCard()
    expect(screen.getByText("Bags")).toBeInTheDocument()
  })

  it("keeps adding from different sellers into one cart", () => {
    render(
      <MemoryRouter>
        <CartProvider>
          <ProductCard product={baseProduct} />
          <ProductCard product={{ ...baseProduct, id: "p2", sellerId: "seller-2", name: "Beaded Sandals" } as Product} />
          <CartProbe />
        </CartProvider>
      </MemoryRouter>,
    )

    fireEvent.click(screen.getByRole("button", { name: /add ankara tote bag to cart/i }))
    fireEvent.click(screen.getByRole("button", { name: /add beaded sandals to cart/i }))
    expect(screen.getByTestId("cart").textContent).toBe("p1:seller-1:1|p2:seller-2:1")
  })

  it("clamps a long name to two lines so one card cannot stretch the grid", () => {
    // The whole point of the fixed-height card: content length must not
    // change the card's height.
    renderCard({
      ...baseProduct,
      name: "Hand-dyed Ankara wrap dress with adjustable waist tie and matching head wrap, made to order in Aba",
    })

    const title = screen.getAllByText(/Hand-dyed Ankara wrap dress/)[0]
    expect(title.className).toContain("line-clamp-2")
    expect(title.className).toContain("h-[2.1rem]")
  })

  it("gives the image a fixed height rather than a width-driven square", () => {
    // An aspect-ratio box grows with the column and made cards enormous on
    // a desktop; a pixel height keeps every card the same size.
    const { container } = renderCard(baseProduct)
    const imageBox = container.querySelector("a[aria-label]")
    expect(imageBox?.className).toContain("h-32")
    expect(imageBox?.className).not.toContain("aspect-square")
  })

  it("flags low stock without blocking the add", () => {
    renderCard({ ...baseProduct, stock: 3 })
    expect(screen.getByText("Low stock")).toBeTruthy()
    const button = screen.getByRole("button", { name: /add .* to cart/i }) as HTMLButtonElement
    expect(button.disabled).toBe(false)
  })

  it("does not flag low stock at comfortable levels", () => {
    renderCard({ ...baseProduct, stock: 40 })
    expect(screen.queryByText("Low stock")).toBeNull()
  })
})