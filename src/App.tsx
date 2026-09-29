import { BrowserRouter } from "react-router-dom"
import { AuthProvider } from "./context/AuthContext"
import { BusinessProvider } from "./context/BusinessContext"
import { CartProvider } from "./context/CartContext"
import { ShopperProvider } from "./context/ShopperContext"
import { AppRoutes } from "./routes/AppRoutes"
import { ErrorBoundary } from "./components/ErrorBoundary"

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <BusinessProvider>
            <ShopperProvider>
              <CartProvider>
                <AppRoutes />
              </CartProvider>
            </ShopperProvider>
          </BusinessProvider>
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  )
}
