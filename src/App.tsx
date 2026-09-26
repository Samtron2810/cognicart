import { BrowserRouter } from "react-router-dom"
import { AuthProvider } from "./context/AuthContext"
import { BusinessProvider } from "./context/BusinessContext"
import { CartProvider } from "./context/CartContext"
import { AppRoutes } from "./routes/AppRoutes"
import { ErrorBoundary } from "./components/ErrorBoundary"

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <BusinessProvider>
            <CartProvider>
              <AppRoutes />
            </CartProvider>
          </BusinessProvider>
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  )
}
