import { describe, expect, it, vi } from "vitest"
import { fireEvent, render, screen } from "@testing-library/react"
import { StarPicker, StarRating } from "./StarRating"

describe("StarRating", () => {
  it("exposes the numeric score to assistive tech, not just icons", () => {
    render(<StarRating value={4.3} />)
    expect(screen.getByRole("img", { name: "4.3 out of 5 stars" })).toBeInTheDocument()
  })

  it("reports the exact value even though stars round to the nearest half", () => {
    // 4.3 displays as four and a half stars, but a screen reader should hear
    // the real number rather than the rounded one.
    render(<StarRating value={4.3} />)
    expect(screen.getByRole("img", { name: /4\.3 out of 5/ })).toBeInTheDocument()
  })

  it("renders an unrated store without crashing", () => {
    render(<StarRating value={0} />)
    expect(screen.getByRole("img", { name: "0.0 out of 5 stars" })).toBeInTheDocument()
  })
})

describe("StarPicker", () => {
  it("renders five keyboard-reachable radio inputs", () => {
    render(<StarPicker value={0} onChange={() => {}} />)
    expect(screen.getAllByRole("radio")).toHaveLength(5)
  })

  it("reports the chosen rating", () => {
    const onChange = vi.fn()
    render(<StarPicker value={0} onChange={onChange} />)
    fireEvent.click(screen.getByRole("radio", { name: "4 stars" }))
    expect(onChange).toHaveBeenCalledWith(4)
  })

  it("marks the current value as checked", () => {
    render(<StarPicker value={3} onChange={() => {}} />)
    expect(screen.getByRole("radio", { name: "3 stars" })).toBeChecked()
    expect(screen.getByRole("radio", { name: "5 stars" })).not.toBeChecked()
  })

  it("singularises one star", () => {
    render(<StarPicker value={1} onChange={() => {}} />)
    expect(screen.getByRole("radio", { name: "1 star" })).toBeInTheDocument()
  })

  it("disables every input while a submission is in flight", () => {
    // Asserting the DOM state rather than that onChange stays silent:
    // React routes radio onChange through the click event, so
    // fireEvent.click fires the handler even on a disabled input. A real
    // user cannot click a disabled control, so `disabled` is the contract
    // that actually holds in a browser.
    render(<StarPicker value={0} onChange={vi.fn()} disabled />)
    for (const radio of screen.getAllByRole("radio")) {
      expect(radio).toBeDisabled()
    }
  })
})
