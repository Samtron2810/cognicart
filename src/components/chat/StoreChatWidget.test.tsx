import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { StoreChatWidget } from "./StoreChatWidget"
import { storeChatService } from "../../services/storeChatService"

/**
 * The widget's job is to be a store-scoped shop front for the agent. These
 * pin the parts that would be a privacy incident if they regressed: that
 * every call is addressed to the store it was mounted for, and that the
 * seller is never sent from the client.
 */

const openPayload = {
  storeName: "Vivid Fashions",
  storeLogo: "",
  title: "Chat with Vivid Fashions Bot",
  messages: [],
  quickReplies: [
    { label: "View all products", value: "View all products" },
    { label: "Search", value: "Search" },
  ],
  persisted: true,
}

beforeEach(() => {
  vi.spyOn(storeChatService, "open").mockResolvedValue({ ...openPayload })
  vi.spyOn(storeChatService, "send").mockResolvedValue({
    reply: "We have three linen shirts in stock.",
    intent: "products_listed",
    quickReplies: [{ label: "Buy now", value: "buy:1" }],
    toolCalls: [],
  })
  vi.spyOn(storeChatService, "clear").mockResolvedValue()
})

afterEach(() => vi.restoreAllMocks())

const openWidget = async () => {
  render(<StoreChatWidget identifier="vivid-fashions" storeName="Vivid Fashions" />)
  fireEvent.click(screen.getByRole("button", { name: /chat with vivid fashions/i }))
  await waitFor(() => expect(storeChatService.open).toHaveBeenCalled())
}

describe("StoreChatWidget", () => {
  it("shows a launcher before it is opened, and no dialog", () => {
    render(<StoreChatWidget identifier="vivid-fashions" storeName="Vivid Fashions" />)
    expect(screen.getByRole("button", { name: /chat with vivid fashions/i })).toBeInTheDocument()
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
  })

  it("does not call the API until the buyer actually opens it", () => {
    render(<StoreChatWidget identifier="vivid-fashions" storeName="Vivid Fashions" />)
    expect(storeChatService.open).not.toHaveBeenCalled()
  })

  it("addresses every call to the store it was mounted for", async () => {
    await openWidget()
    expect(storeChatService.open).toHaveBeenCalledWith("vivid-fashions")

    fireEvent.change(screen.getByLabelText(/message vivid fashions/i), {
      target: { value: "linen shirt" },
    })
    fireEvent.click(screen.getByRole("button", { name: /send message/i }))

    await waitFor(() =>
      expect(storeChatService.send).toHaveBeenCalledWith("vivid-fashions", "linen shirt"),
    )
    // The seller is resolved server-side from the identifier; the client
    // sends only the identifier and the message.
    expect(storeChatService.send).toHaveBeenCalledTimes(1)
  })

  it("titles the window with the store name", async () => {
    await openWidget()
    await waitFor(() =>
      expect(screen.getByRole("dialog", { name: /chat with vivid fashions bot/i })).toBeInTheDocument(),
    )
  })

  it("renders the button menu when there is no OpenAI key", async () => {
    await openWidget()
    await waitFor(() => {
      expect(screen.getByRole("button", { name: "View all products" })).toBeInTheDocument()
      expect(screen.getByRole("button", { name: "Search" })).toBeInTheDocument()
    })
  })

  it("sends a quick reply's value, not its label", async () => {
    await openWidget()
    await waitFor(() => screen.getByRole("button", { name: "View all products" }))
    fireEvent.click(screen.getByRole("button", { name: "View all products" }))

    await waitFor(() =>
      expect(storeChatService.send).toHaveBeenCalledWith("vivid-fashions", "View all products"),
    )
  })

  it("shows the reply and the menu that came with it", async () => {
    await openWidget()
    fireEvent.change(screen.getByLabelText(/message vivid fashions/i), {
      target: { value: "shirts" },
    })
    fireEvent.click(screen.getByRole("button", { name: /send message/i }))

    await waitFor(() =>
      expect(screen.getByText(/three linen shirts in stock/i)).toBeInTheDocument(),
    )
    expect(screen.getByRole("button", { name: "Buy now" })).toBeInTheDocument()
  })

  it("restores a saved transcript when reopened", async () => {
    vi.spyOn(storeChatService, "open").mockResolvedValue({
      ...openPayload,
      messages: [
        { role: "user", content: "do you have ankara?" },
        { role: "assistant", content: "Yes, four designs.", quickReplies: [] },
      ],
    })
    await openWidget()
    await waitFor(() => {
      expect(screen.getByText("do you have ankara?")).toBeInTheDocument()
      expect(screen.getByText("Yes, four designs.")).toBeInTheDocument()
    })
  })

  it("rolls the message back and restores the draft when sending fails", async () => {
    vi.spyOn(storeChatService, "send").mockRejectedValue(new Error("network"))
    await openWidget()

    const input = screen.getByLabelText(/message vivid fashions/i) as HTMLInputElement
    fireEvent.change(input, { target: { value: "are you open?" } })
    fireEvent.click(screen.getByRole("button", { name: /send message/i }))

    // A message that never reached the bot must not be left sitting in the
    // transcript looking delivered.
    await waitFor(() => expect(screen.queryByText("are you open?")).not.toBeInTheDocument())
    expect(input.value).toBe("are you open?")
  })

  it("warns when the browser blocked the cookie that saves history", async () => {
    vi.spyOn(storeChatService, "open").mockResolvedValue({
      ...openPayload,
      persisted: false,
      messages: [{ role: "assistant", content: "Hello", quickReplies: [] }],
    })
    await openWidget()
    await waitFor(() =>
      expect(screen.getByText(/will not be saved/i)).toBeInTheDocument(),
    )
  })

  it("clears the conversation for this store only", async () => {
    await openWidget()
    fireEvent.click(screen.getByRole("button", { name: /start a new conversation/i }))
    await waitFor(() => expect(storeChatService.clear).toHaveBeenCalledWith("vivid-fashions"))
  })
})
