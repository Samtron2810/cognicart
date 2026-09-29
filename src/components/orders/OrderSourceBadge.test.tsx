import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import { OrderSourceBadge } from "./OrderSourceBadge"

describe("OrderSourceBadge", () => {
  it("renders an unmistakable storefront badge", () => {
    render(<OrderSourceBadge source="storefront" />)
    expect(screen.getByTestId("order-source-badge")).toHaveTextContent("Storefront")
  })

  it("renders an unmistakable telegram badge", () => {
    render(<OrderSourceBadge source="telegram" />)
    expect(screen.getByTestId("order-source-badge")).toHaveTextContent("Telegram")
  })

  it("renders manual orders with their original sales channel", () => {
    render(<OrderSourceBadge source="manual" sourceChannel="whatsapp" />)
    const badge = screen.getByTestId("order-source-badge")
    expect(badge).toHaveTextContent("Manual")
    expect(badge).toHaveTextContent("WhatsApp")
  })

  it("renders manual orders without a channel as plain manual", () => {
    render(<OrderSourceBadge source="manual" />)
    expect(screen.getByTestId("order-source-badge")).toHaveTextContent(/^Manual$/)
  })
})
