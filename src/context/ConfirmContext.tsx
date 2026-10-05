import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from "react"
import { ConfirmDialog } from "../components/ui/ConfirmDialog"

export type ConfirmOptions = {
  title: string
  description?: string
  confirmLabel?: string
  cancelLabel?: string
}

export type ConfirmFn = (options: ConfirmOptions | string) => Promise<boolean>

const ConfirmContext = createContext<ConfirmFn | null>(null)

/**
 * Hosts the single confirmation modal for the whole app.
 *
 * One dialog instance is mounted here instead of per page, so a confirmation
 * can be requested from anywhere — including hooks and async handlers — without
 * each page carrying open/target state of its own.
 */
export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [options, setOptions] = useState<ConfirmOptions | null>(null)
  const resolverRef = useRef<((value: boolean) => void) | null>(null)

  const confirm = useCallback<ConfirmFn>((input) => {
    const next = typeof input === "string" ? { title: input } : input
    return new Promise<boolean>((resolve) => {
      // A new request while one is open resolves the old promise as "cancelled"
      // rather than leaving the caller awaiting forever.
      resolverRef.current?.(false)
      resolverRef.current = resolve
      setOptions(next)
    })
  }, [])

  const settle = useCallback((value: boolean) => {
    const resolve = resolverRef.current
    resolverRef.current = null
    setOptions(null)
    resolve?.(value)
  }, [])

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <ConfirmDialog
        open={options !== null}
        title={options?.title ?? ""}
        description={options?.description}
        confirmLabel={options?.confirmLabel}
        cancelLabel={options?.cancelLabel}
        onConfirm={() => settle(true)}
        onCancel={() => settle(false)}
      />
    </ConfirmContext.Provider>
  )
}

/**
 * Promise-based replacement for window.confirm().
 *
 *   const confirm = useConfirm()
 *
 *   const remove = async () => {
 *     const confirmed = await confirm({
 *       title: "Delete this product?",
 *       description: "This cannot be undone.",
 *       confirmLabel: "Delete product",
 *     })
 *     if (!confirmed) return
 *     ...
 *   }
 *
 * A bare string works too — confirm("Suspend this account?") — when a title
 * says everything that needs saying.
 */
export function useConfirm() {
  const context = useContext(ConfirmContext)
  if (!context) throw new Error("useConfirm must be used within ConfirmProvider")
  return context
}
