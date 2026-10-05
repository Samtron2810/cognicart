import { BrowserRouter } from "react-router-dom"
import { AuthProvider } from "./context/AuthContext"
import { BusinessProvider } from "./context/BusinessContext"
import { CartProvider } from "./context/CartContext"
import { ShopperProvider } from "./context/ShopperContext"
import { ConfirmProvider } from "./context/ConfirmContext"
import { AppRoutes } from "./routes/AppRoutes"
import { ErrorBoundary } from "./components/ErrorBoundary"
import { AppToaster } from "./components/ui/Toaster"

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <BusinessProvider>
            <ShopperProvider>
              <CartProvider>
                {/* Confirmation modal + toasts replace window.confirm() and alert() app-wide. */}
                <ConfirmProvider>
                  <AppRoutes />
                  <AppToaster />
                </ConfirmProvider>
              </CartProvider>
            </ShopperProvider>
          </BusinessProvider>
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  )
}
