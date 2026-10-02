import { Routes, Route } from "react-router-dom"
import Home from "../pages/Home"
import Login from "../pages/auth/Login"
import Register from "../pages/auth/Register"
import ForgotPassword from "../pages/auth/ForgotPassword"
import ResetPassword from "../pages/auth/ResetPassword"
import VerifyEmail from "../pages/auth/VerifyEmail"
import Dashboard from "../pages/dashboard/Dashboard"
import Products from "../pages/products/Products"
import CreateProduct from "../pages/products/CreateProduct"
import EditProduct from "../pages/products/EditProduct"
import Orders from "../pages/orders/Orders"
import OrderDetail from "../pages/orders/OrderDetail"
import Customers from "../pages/customers/Customers"
import Settings from "../pages/dashboard/Settings"
import Revenue from "../pages/dashboard/Revenue"
import TelegramPage from "../pages/telegram/Telegram"
import Campaigns from "../pages/campaigns/Campaigns"
import CampaignDetail from "../pages/campaigns/CampaignDetail"
import ManualOrderForm from "../pages/orders/ManualOrderForm"
import Storefront from "../pages/storefront/Storefront"
import ProductDetail from "../pages/storefront/ProductDetail"
import SellerStorefront from "../pages/storefront/SellerStorefront"
import { DashboardLayout } from "../layouts/DashboardLayout"
import { AdminLayout } from "../layouts/AdminLayout"
import { PublicLayout } from "../layouts/PublicLayout"
import { ProtectedRoute } from "./ProtectedRoute"
import { AdminRoute } from "./AdminRoute"
import { GuestRoute } from "./GuestRoute"
import About from "../pages/public/About"
import Contact from "../pages/public/Contact"
import Careers from "../pages/public/Careers"
import Privacy from "../pages/public/Privacy"
import Terms from "../pages/public/Terms"
import TelegramCommerce from "../pages/public/TelegramCommerce"
import Track from "../pages/buyer/Track"
import TrackOrder from "../pages/buyer/TrackOrder"
import Search from "../pages/Search"
import Cart from "../pages/Cart"
import Checkout from "../pages/Checkout"
import PaymentDone from "../pages/checkout/PaymentDone"
import AdminDashboard from "../pages/admin/Dashboard"
import AdminSellers from "../pages/admin/Sellers"
import AdminSellerDetails from "../pages/admin/SellerDetails"
import AdminOrders from "../pages/admin/Orders"
import AdminCustomers from "../pages/admin/Customers"
import AdminRevenue from "../pages/admin/Revenue"
import AdminPayments from "../pages/admin/Payments"
import AdminTelegram from "../pages/admin/Telegram"
import AdminSubscriptions from "../pages/admin/Subscriptions"
import AdminReports from "../pages/admin/Reports"
import AdminSettings from "../pages/admin/Settings"
import { Header } from "../components/layout/Header"
import { Footer } from "../components/layout/Footer"

function NotFound() {
  return (
    <div className="min-h-screen bg-[#FFFBF5] flex flex-col">
      <Header />
      <div className="flex-1 min-h-[50vh] grid place-items-center px-4 py-16">
        <div className="text-center">
          <h1 className="font-display text-3xl font-bold">404</h1>
          <p className="mt-2 text-sm text-[#6b6b6b]">Page not found.</p>
          <a href="/" className="mt-4 inline-flex rounded-full bg-[#0B9C74] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#0a8a66]">Go home</a>
        </div>
      </div>
      <Footer />
    </div>
  )
}

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<GuestRoute><Login /></GuestRoute>} />
      <Route path="/register" element={<GuestRoute><Register /></GuestRoute>} />
      <Route path="/forgot-password" element={<GuestRoute><ForgotPassword /></GuestRoute>} />
      <Route path="/reset-password" element={<GuestRoute><ResetPassword /></GuestRoute>} />
      <Route path="/verify-email" element={<VerifyEmail />} />

      <Route element={<PublicLayout />}>
        <Route path="/store" element={<Storefront />} />
        <Route path="/store/:id" element={<ProductDetail />} />
        <Route path="/store/seller/:sellerId" element={<SellerStorefront />} />
        <Route path="/s/:sellerId" element={<SellerStorefront />} />
        <Route path="/marketplace" element={<Storefront />} />

        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/careers" element={<Careers />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/telegram-commerce" element={<TelegramCommerce />} />
        <Route path="/track" element={<Track />} />
        <Route path="/track/orders/:id" element={<TrackOrder />} />
        <Route path="/search" element={<Search />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/checkout" element={<Checkout />} />
        {/* Lightweight payment return for Telegram bot orders — no header/footer/cart */}
        <Route path="/checkout/done" element={<PaymentDone />} />
      </Route>

      <Route
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/dashboard/products" element={<Products />} />
        <Route path="/dashboard/products/new" element={<CreateProduct />} />
        <Route path="/dashboard/products/:id/edit" element={<EditProduct />} />
        <Route path="/dashboard/orders" element={<Orders />} />
        <Route path="/dashboard/orders/manual/new" element={<ManualOrderForm />} />
        <Route path="/dashboard/orders/manual/:id/edit" element={<ManualOrderForm />} />
        <Route path="/dashboard/orders/:id" element={<OrderDetail />} />
        <Route path="/dashboard/customers" element={<Customers />} />
        <Route path="/dashboard/revenue" element={<Revenue />} />
        <Route path="/dashboard/settings" element={<Settings />} />
        <Route path="/dashboard/telegram" element={<TelegramPage />} />
        <Route path="/dashboard/campaigns" element={<Campaigns />} />
        <Route path="/dashboard/campaigns/:id" element={<CampaignDetail />} />
      </Route>

      <Route
        element={
          <AdminRoute>
            <AdminLayout />
          </AdminRoute>
        }
      >
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/sellers" element={<AdminSellers />} />
        <Route path="/admin/sellers/:id" element={<AdminSellerDetails />} />
        <Route path="/admin/orders" element={<AdminOrders />} />
        <Route path="/admin/customers" element={<AdminCustomers />} />
        <Route path="/admin/revenue" element={<AdminRevenue />} />
        <Route path="/admin/payments" element={<AdminPayments />} />
        <Route path="/admin/telegram" element={<AdminTelegram />} />
        <Route path="/admin/subscriptions" element={<AdminSubscriptions />} />
        <Route path="/admin/reports" element={<AdminReports />} />
        <Route path="/admin/settings" element={<AdminSettings />} />
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}
