import { describe, it, expect, beforeEach, afterEach } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import Contact from "./Contact"

// The form hands off to the device's mail app by assigning window.location.href.
// jsdom has no navigation, so swap location for a recorder.
let assigned = ""
const realLocation = window.location

beforeEach(() => {
  assigned = ""
  Object.defineProperty(window, "location", {
    configurable: true,
    value: {
      get href() { return assigned },
      set href(v: string) { assigned = v },
    },
  })
})

afterEach(() => {
  Object.defineProperty(window, "location", { configurable: true, value: realLocation })
})

function fillAndSubmit(name: string, contact: string, message: string) {
  render(<Contact />)
  fireEvent.change(screen.getByPlaceholderText("Amara"), { target: { value: name } })
  fireEvent.change(screen.getByPlaceholderText("+234 ... or you@mail.com"), { target: { value: contact } })
  fireEvent.change(screen.getByPlaceholderText(/need help connecting my Telegram bot/i), { target: { value: message } })
  fireEvent.click(screen.getByRole("button", { name: /send message/i }))
}

/** Pull the decoded subject/body back out of the generated mailto URL. */
function parseMailto(url: string) {
  const [scheme, query] = url.split("?")
  const params = new URLSearchParams(query)
  return {
    to: scheme.replace(/^mailto:/, ""),
    subject: params.get("subject") ?? "",
    body: params.get("body") ?? "",
  }
}

describe("Contact form -> mailto handoff", () => {
  it("opens the mail app addressed to the support inbox", () => {
    fillAndSubmit("Amara", "+234 801 234 5678", "Please help me connect my bot.")
    expect(assigned.startsWith("mailto:")).toBe(true)
    expect(parseMailto(assigned).to).toBe("trewallaffiliates@gmail.com")
  })

  it("uses a generic subject that suits any enquiry", () => {
    fillAndSubmit("Amara", "amara@example.com", "Hello")
    expect(parseMailto(assigned).subject).toBe("Chatstand support request")
  })

  it("carries name, contact and message into the body", () => {
    fillAndSubmit("Amara Obi", "+234 801 234 5678", "Please help me connect my bot.")
    const { body } = parseMailto(assigned)
    expect(body).toContain("Name: Amara Obi")
    expect(body).toContain("Phone or email: +234 801 234 5678")
    expect(body).toContain("Please help me connect my bot.")
  })

  it("survives characters that would otherwise break the URL", () => {
    // &, ?, # and newlines all terminate or corrupt a mailto query if unescaped.
    fillAndSubmit("A & B Ltd", "a+b@x.ng", "Line one\nLine two & #3 — 50% off?")
    const { to, subject, body } = parseMailto(assigned)
    expect(to).toBe("trewallaffiliates@gmail.com")
    expect(subject).toBe("Chatstand support request")
    expect(body).toContain("Name: A & B Ltd")
    expect(body).toContain("Phone or email: a+b@x.ng")
    expect(body).toContain("Line two & #3 — 50% off?")
  })

  it("does not claim the message was received, only that the app is opening", () => {
    fillAndSubmit("Amara", "amara@example.com", "Hello")
    expect(screen.getByRole("status").textContent).toMatch(/opening your email app/i)
  })

  it("will not submit while a required field is empty", () => {
    render(<Contact />)
    fireEvent.click(screen.getByRole("button", { name: /send message/i }))
    expect(assigned).toBe("")
  })
})
