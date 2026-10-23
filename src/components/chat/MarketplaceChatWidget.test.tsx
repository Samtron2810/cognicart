import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { MemoryRouter } from "react-router-dom"
import { MarketplaceChatWidget } from "./MarketplaceChatWidget"
import { CartProvider } from "../../context/CartContext"
import { marketplaceChatService } from "../../services/marketplaceChatService"

const openPayload = {
  title: "Chatstand Assistant",
  subtitle: "Shopping across every store",
  messages: [],
  quickReplies: [{ label: "Browse stores", value: "STORES" }],
}

const renderAt = (path: string) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <CartProvider>
        <MarketplaceChatWidget />
      </CartProvider>
    </MemoryRouter>,
  )

describe("MarketplaceChatWidget", () => {
  beforeEach(() => {
    window.localStorage.clear()
    vi.spyOn(marketplaceChatService, "open").mockResolvedValue(openPayload)
  })

  afterEach(() => vi.restoreAllMocks())

  it("offers the assistant on a normal public page", () => {
    renderAt("/stores")
    expect(screen.getByRole("button", { name: /open the chatstand shopping assistant/i })).toBeInTheDocument()
  })

  it("is available on a store page too, not just the directory", () => {
    renderAt("/store/vivid-fashions")
    expect(screen.getByRole("button", { name: /open the chatstand shopping assistant/i })).toBeInTheDocument()
  })

  it("stays out of the way during checkout and sign-in", () => {
    for (const path of ["/cart", "/checkout", "/login", "/register"]) {
      const { unmount } = renderAt(path)
      expect(screen.queryByRole("button", { name: /open the chatstand/i })).toBeNull()
      unmount()
    }
  })

  it("loads the transcript only once opened", async () => {
    renderAt("/stores")
    expect(marketplaceChatService.open).not.toHaveBeenCalled()

    fireEvent.click(screen.getByRole("button", { name: /open the chatstand/i }))
    await waitFor(() => expect(marketplaceChatService.open).toHaveBeenCalledTimes(1))
    expect(screen.getByRole("dialog", { name: /chatstand assistant/i })).toBeInTheDocument()
  })

  it("shows found products as cards that add straight to the cart", async () => {
    vi.spyOn(marketplaceChatService, "send").mockResolvedValue({
      reply: "Found 1 match for sneakers.",
      intent: "search",
      quickReplies: [],
      stores: [],
      products: [
        {
          id: "p1",
          name: "Red Sneakers",
          price: 25000,
          currency: "NGN",
          image: "",
          category: "Shoes",
          sellerId: "seller-1",
          storeName: "Vivid Fashions",
          storeSlug: "vivid-fashions",
          stock: 4,
          hasVariants: false,
        },
      ],
    })

    renderAt("/stores")
    fireEvent.click(screen.getByRole("button", { name: /open the chatstand/i }))
    await waitFor(() => expect(marketplaceChatService.open).toHaveBeenCalled())

    fireEvent.change(screen.getByLabelText(/message the assistant/i), { target: { value: "sneakers" } })
    fireEvent.click(screen.getByRole("button", { name: /^send$/i }))

    await waitFor(() => expect(screen.getByText("Red Sneakers")).toBeInTheDocument())
    // The store is named, because a cross-store result is meaningless without it.
    expect(screen.getByText("Vivid Fashions")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /add red sneakers to cart/i })).toBeInTheDocument()
  })

  it("passes the store being viewed as context, without it narrowing anything", async () => {
    const send = vi.spyOn(marketplaceChatService, "send").mockResolvedValue({
      reply: "ok",
      intent: "search",
      quickReplies: [],
      products: [],
      stores: [],
    })

    renderAt("/store/vivid-fashions")
    fireEvent.click(screen.getByRole("button", { name: /open the chatstand/i }))
    await waitFor(() => expect(marketplaceChatService.open).toHaveBeenCalled())

    fireEvent.change(screen.getByLabelText(/message the assistant/i), { target: { value: "shoes" } })
    fireEvent.click(screen.getByRole("button", { name: /^send$/i }))

    await waitFor(() => expect(send).toHaveBeenCalledWith("shoes", "vivid-fashions"))
  })

  it("restores the shopper's message if sending fails", async () => {
    vi.spyOn(marketplaceChatService, "send").mockRejectedValue(new Error("network"))

    renderAt("/stores")
    fireEvent.click(screen.getByRole("button", { name: /open the chatstand/i }))
    await waitFor(() => expect(marketplaceChatService.open).toHaveBeenCalled())

    const input = screen.getByLabelText(/message the assistant/i) as HTMLInputElement
    fireEvent.change(input, { target: { value: "sneakers" } })
    fireEvent.click(screen.getByRole("button", { name: /^send$/i }))

    await waitFor(() => expect(screen.getByRole("alert")).toBeInTheDocument())
    // The text comes back so the shopper can retry rather than retype.
    expect(input.value).toBe("sneakers")
  })
})
