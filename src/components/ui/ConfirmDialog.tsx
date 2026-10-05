import { useEffect, useId, useRef } from "react"
import { createPortal } from "react-dom"
import { TriangleAlert } from "lucide-react"

export type ConfirmDialogProps = {
  open: boolean
  title: string
  description?: string
  confirmLabel?: string
  cancelLabel?: string
  onConfirm: () => void
  onCancel: () => void
}

/**
 * Accessible stand-in for window.confirm().
 *
 * Rendered through a portal so it can never be clipped by a card, table row or
 * sticky layout, and it keeps the blocking behaviour people expect from the
 * native dialog: Escape cancels, the backdrop cancels, Tab stays inside the
 * panel and the page behind it cannot scroll.
 *
 * Every confirmation in the app is a "are you sure" for something destructive
 * or irreversible, so the primary action is always the red button and focus
 * starts on Cancel.
 *
 * Drive it with useConfirm() instead of mounting it by hand.
 */
export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const panelRef = useRef<HTMLDivElement>(null)
  const cancelRef = useRef<HTMLButtonElement>(null)
  const titleId = useId()
  const descriptionId = useId()

  // The safe action takes focus, and focus goes back where it came from on close.
  useEffect(() => {
    if (!open) return
    const previouslyFocused = document.activeElement as HTMLElement | null
    cancelRef.current?.focus()
    return () => previouslyFocused?.focus?.()
  }, [open])

  useEffect(() => {
    if (!open) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault()
        onCancel()
        return
      }
      if (event.key !== "Tab") return
      const focusables = panelRef.current?.querySelectorAll<HTMLElement>("button:not([disabled])")
      if (!focusables?.length) return
      const first = focusables[0]
      const last = focusables[focusables.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }
    document.addEventListener("keydown", onKeyDown)
    return () => document.removeEventListener("keydown", onKeyDown)
  }, [open, onCancel])

  useEffect(() => {
    if (!open) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => { document.body.style.overflow = previousOverflow }
  }, [open])

  if (!open) return null

  return createPortal(
    <div className="fixed inset-0 z-[100] grid place-items-center p-4">
      <div className="absolute inset-0 bg-[#1a1a1a]/45 backdrop-blur-[2px] cc-fade-in" onClick={onCancel} aria-hidden="true" />
      <div
        ref={panelRef}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        className="relative w-full max-w-md rounded-[22px] border border-[#F3E6D3] bg-white p-6 shadow-[0_24px_60px_-20px_rgba(26,26,26,0.45)] cc-pop-in"
      >
        <div className="flex gap-3">
          <div className="h-10 w-10 shrink-0 grid place-items-center rounded-full border border-red-200 bg-red-50">
            <TriangleAlert className="h-5 w-5 text-red-600" />
          </div>
          <div className="min-w-0">
            <h2 id={titleId} className="font-display text-lg font-bold leading-tight">{title}</h2>
            {description && <p id={descriptionId} className="mt-1.5 text-sm text-[#6b6b6b]">{description}</p>}
          </div>
        </div>

        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            ref={cancelRef}
            type="button"
            onClick={onCancel}
            className="rounded-full border border-[#F3E6D3] bg-white px-5 py-2.5 text-sm font-bold hover:bg-[#FFF1DA] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1a1a1a]/20"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="rounded-full bg-red-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-red-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-600/40"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
