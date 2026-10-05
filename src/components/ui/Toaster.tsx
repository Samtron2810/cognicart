import { Toaster } from "sonner"

/**
 * App-wide toast host (sonner), mounted once in App.tsx.
 *
 * Replaces alert(). Anywhere in the app:
 *
 *   import { toast } from "sonner"
 *   toast.success("Product deleted")
 *   toast.error("Please select size and color")
 *
 * richColors gives success/error/warning their own palette, which keeps toasts
 * readable on the cream background without per-call styling.
 */
export function AppToaster() {
  return (
    <Toaster
      position="top-right"
      richColors
      closeButton
      duration={4000}
      toastOptions={{
        style: {
          fontFamily: "var(--font-sans)",
          borderRadius: "16px",
        },
      }}
    />
  )
}
