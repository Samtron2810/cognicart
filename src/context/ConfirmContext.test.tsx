import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import { ConfirmProvider, useConfirm } from "./ConfirmContext"

function Subject({ onResult }: { onResult: (value: boolean) => void }) {
  const confirm = useConfirm()
  return (
    <button
      onClick={() => {
        void confirm({
          title: "Delete this product?",
          description: "This cannot be undone.",
          confirmLabel: "Delete product",
        }).then(onResult)
      }}
    >
      Delete
    </button>
  )
}

const setup = () => {
  const onResult = vi.fn()
  render(
    <ConfirmProvider>
      <Subject onResult={onResult} />
    </ConfirmProvider>,
  )
  const open = () => fireEvent.click(screen.getByRole("button", { name: "Delete" }))
  return { onResult, open }
}

describe("useConfirm", () => {
  it("stays closed until a confirmation is requested", () => {
    setup()
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument()
  })

  it("shows the title and description it was given", async () => {
    const { open } = setup()
    open()
    const dialog = await screen.findByRole("alertdialog")
    expect(dialog).toHaveTextContent("Delete this product?")
    expect(dialog).toHaveTextContent("This cannot be undone.")
  })

  it("resolves true when the confirm button is pressed", async () => {
    const { onResult, open } = setup()
    open()
    fireEvent.click(await screen.findByRole("button", { name: "Delete product" }))

    await waitFor(() => expect(onResult).toHaveBeenCalledWith(true))
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument()
  })

  it("resolves false when cancelled", async () => {
    const { onResult, open } = setup()
    open()
    fireEvent.click(await screen.findByRole("button", { name: "Cancel" }))

    await waitFor(() => expect(onResult).toHaveBeenCalledWith(false))
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument()
  })

  it("resolves false when Escape is pressed", async () => {
    const { onResult, open } = setup()
    open()
    await screen.findByRole("alertdialog")
    fireEvent.keyDown(document, { key: "Escape" })

    await waitFor(() => expect(onResult).toHaveBeenCalledWith(false))
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument()
  })

  it("restores page scrolling after it closes", async () => {
    const { open } = setup()
    open()
    await screen.findByRole("alertdialog")
    expect(document.body.style.overflow).toBe("hidden")

    fireEvent.click(screen.getByRole("button", { name: "Cancel" }))
    await waitFor(() => expect(document.body.style.overflow).not.toBe("hidden"))
  })
})
