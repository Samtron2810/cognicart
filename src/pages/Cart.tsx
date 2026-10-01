import { useEffect, useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { CreditCard, Minus, PackageSearch, Plus, ShoppingBag, Trash2, UserCheck } from "lucide-react"
import { useCart } from "../context/CartContext"
import { useShopper } from "../context/ShopperContext"
import { orderService } from "../services/orderService"
import { paymentService } from "../services/paymentService"
import { productService } from "../services/productService"
import { buildCheckoutPayload, validateCheckoutCustomer } from "../utils/checkout"
import { getEffectivePrice, getTotalStock } from "../types/product"
import type { Product, ProductVariant } from "../types/product"
import { getApiErrorMessage } from "../services/apiError"

type CartItem = { product: Product; variant: ProductVariant | null; effectivePrice: number; quantity: number; maxStock: number }

export default function Cart() {
  const { items: entries, removeItem, setQuantity, clear } = useCart()
  const { shopper } = useShopper()
  const [items, setItems] = useState<CartItem[]>([])
  const [customer, setCustomer] = useState({ name: "", phone: "", email: "", address: "" })
  const [prefilled, setPrefilled] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    const load = async () => {
      const liveItems = await Promise.all(entries.map(async (entry) => {
        const product = await productService.getById(entry.productId)
        const variant = entry.variantId ? product.variants?.find((value) => value.id === entry.variantId) || null : null
        const maxStock = variant ? variant.stock : getTotalStock(product)
        return { product, variant, effectivePrice: getEffectivePrice(product, variant), quantity: entry.quantity, maxStock }
      }))
      if (active) setItems(liveItems)
    }
    void load().catch(() => active && setError("Some cart items are no longer available."))
    return () => { active = false }
  }, [entries])

  // A verified buyer session is optional: it only pre-fills the form.
  // Guests continue exactly as before — no signup, no password, ever.
  useEffect(() => {
    if (!shopper || prefilled) return
    setCustomer((current) => ({
      name: current.name || shopper.name || "",
      phone: current.phone || shopper.phone || "",
      email: current.email || shopper.email || "",
      address: current.address || shopper.addresses?.[0] || "",
    }))
    setPrefilled(true)
  }, [shopper, prefilled])

  const sellerId = entries[0]?.sellerId
  const containsMultipleStores = entries.some((entry) => entry.sellerId !== sellerId)
  const subtotal = useMemo(() => items.reduce((sum, item) => sum + item.effectivePrice * item.quantity, 0), [items])
  const total = subtotal

  const validate = () => {
    if (containsMultipleStores) {
      setError("Checkout supports one store at a time. Remove items from the other store first.")
      return false
    }
    const customerProblem = validateCheckoutCustomer(customer)
    if (customerProblem) {
      setError(customerProblem)
      return false
    }
    if (!items.length || !sellerId) {
      setError("Your cart is empty.")
      return false
    }
    if (items.some((item) => item.maxStock < 1)) {
      setError("One or more items are out of stock. Please update your cart.")
      return false
    }
    const overStocked = items.find((item) => item.quantity > item.maxStock)
    if (overStocked) {
      setError(`Only ${overStocked.maxStock} unit${overStocked.maxStock === 1 ? "" : "s"} of "${overStocked.product.name}" ${overStocked.maxStock === 1 ? "is" : "are"} available. Please reduce the quantity.`)
      return false
    }
    return true
  }

  const createOrder = () => orderService.create(buildCheckoutPayload(
    sellerId!,
    customer,
    items.map((item) => ({ productId: item.product.id, variantId: item.variant?.id, quantity: item.quantity })),
  ))

  const handlePay = async (event: React.FormEvent) => {
    event.preventDefault()
    setError(null)
    if (!validate()) return
    setSubmitting(true)
    try {
      const order = await createOrder()
      await paymentService.payWithPaystack({
        sellerId: order.sellerId,
        orderId: order.id,
        amount: order.total,
        email: customer.email,
        subtotal: order.subtotal,
        deliveryFee: order.deliveryFee,
      })
      clear()
    } catch (reason) {
      setError(getApiErrorMessage(reason, "Unable to start checkout."))
    } finally {
      setSubmitting(false)
    }
  }

  if (!entries.length) {
    return <div className="min-h-[60vh] bg-[#FFFBF5] grid place-items-center px-4 py-10"><div className="text-center max-w-md"><div className="mx-auto h-12 w-12 rounded-full bg-[#FFF1DA] border border-[#F3E6D3] grid place-items-center"><ShoppingBag className="h-6 w-6 text-[#E85D26]" /></div><h1 className="font-display text-2xl font-bold mt-3">Cart is empty</h1><p className="text-sm text-[#6b6b6b] mt-1">Just completed a payment? Your order is confirmed — a receipt and tracking link are on their way to your email.</p><div className="mt-4 flex flex-wrap justify-center gap-2"><Link to="/track" className="inline-flex items-center gap-2 rounded-full bg-[#0B9C74] px-6 py-3 text-sm font-bold text-white hover:bg-[#0a8a66]"><PackageSearch className="h-4 w-4" /> Track my order</Link><Link to="/store" className="inline-flex rounded-full bg-white border border-[#F3E6D3] px-6 py-3 text-sm font-bold hover:bg-[#FFF1DA]">Browse stores</Link></div></div></div>
  }

  return <div className="min-h-screen bg-[#FFFBF5] py-10"><div className="mx-auto max-w-[1000px] px-4 sm:px-6"><div className="flex items-center justify-between gap-3"><div><h1 className="font-display text-[34px] font-bold tracking-tight">Cart</h1><p className="text-sm text-[#6b6b6b]">Prices and stock are checked against the live catalog at checkout. No account needed — checkout as a guest.</p></div><div className="flex flex-wrap gap-2"><Link to="/track" className="inline-flex items-center gap-2 rounded-full bg-white border border-[#F3E6D3] px-4 py-2 text-sm font-bold hover:bg-[#FFF1DA]"><PackageSearch className="h-4 w-4" /> Track orders</Link><button onClick={clear} className="inline-flex items-center gap-2 rounded-full bg-white border border-[#F3E6D3] px-4 py-2 text-sm font-bold hover:bg-[#FFF1DA]"><Trash2 className="h-4 w-4" /> Clear cart</button></div></div>{error && <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">{error}</div>}<div className="mt-6 grid gap-6 lg:grid-cols-[1.25fr_0.75fr]"><div className="space-y-3">{items.map((item, index) => <div key={`${item.product.id}-${item.variant?.id || "base"}-${index}`} className="flex gap-4 rounded-2xl border border-[#F3E6D3] bg-white p-4"><img src={item.variant?.image || item.product.images[0]} alt={item.product.name} className="h-16 w-16 rounded-xl border border-[#F3E6D3] bg-[#FFFBF5] object-cover"/><div className="min-w-0 flex-1"><div className="font-bold">{item.product.name}</div><div className="text-xs text-[#6b6b6b]">{[item.variant?.size, item.variant?.color].filter(Boolean).join(" / ") || item.product.category}</div><div className="mt-1 text-sm font-bold">₦{item.effectivePrice.toLocaleString()}{item.quantity > 1 && <span className="ml-1 font-normal text-xs text-[#6b6b6b]">× {item.quantity} = ₦{(item.effectivePrice * item.quantity).toLocaleString()}</span>}</div><div className="mt-2 flex items-center gap-2"><button type="button" onClick={() => setQuantity(index, item.quantity - 1)} aria-label={`Decrease quantity of ${item.product.name}`} className="grid h-7 w-7 place-items-center rounded-full border border-[#F3E6D3] hover:bg-[#FFF1DA]"><Minus className="h-3.5 w-3.5" /></button><span className="min-w-[2ch] text-center text-sm font-bold">{item.quantity}</span><button type="button" onClick={() => setQuantity(index, item.quantity + 1)} disabled={item.quantity >= item.maxStock} aria-label={`Increase quantity of ${item.product.name}`} className="grid h-7 w-7 place-items-center rounded-full border border-[#F3E6D3] hover:bg-[#FFF1DA] disabled:cursor-not-allowed disabled:opacity-40"><Plus className="h-3.5 w-3.5" /></button><span className="text-[11px] text-[#9a9a9a]">{item.maxStock} available</span>{item.quantity > item.maxStock && <span className="rounded-full bg-red-50 border border-red-200 px-2 py-0.5 text-[11px] font-bold text-red-700">Only {item.maxStock} left</span>}</div></div><button onClick={() => removeItem(index)} aria-label={`Remove ${item.product.name}`} className="h-9 w-9 rounded-full border border-[#F3E6D3] grid place-items-center hover:bg-red-50 hover:text-red-700"><Trash2 className="h-4 w-4"/></button></div>)}</div><form onSubmit={handlePay} className="rounded-2xl border border-[#F3E6D3] bg-white p-5 space-y-3"><h2 className="font-bold">Secure guest checkout</h2>{shopper && <div className="flex items-center gap-2 rounded-xl border border-[#0B9C74]/20 bg-[#E6F7F1] px-3 py-2 text-xs text-[#0B9C74]"><UserCheck className="h-4 w-4"/>Signed in as {shopper.email || shopper.phone} — details pre-filled.</div>}<input required value={customer.name} onChange={(event) => setCustomer({ ...customer, name: event.target.value })} placeholder="Full name" className="w-full rounded-xl border border-[#F3E6D3] px-3 py-2.5 text-sm outline-none focus:border-[#0B9C74]"/><input required value={customer.phone} onChange={(event) => setCustomer({ ...customer, phone: event.target.value })} placeholder="Phone" className="w-full rounded-xl border border-[#F3E6D3] px-3 py-2.5 text-sm outline-none focus:border-[#0B9C74]"/><input required type="email" value={customer.email} onChange={(event) => setCustomer({ ...customer, email: event.target.value })} placeholder="Email for receipt & order tracking" className="w-full rounded-xl border border-[#F3E6D3] px-3 py-2.5 text-sm outline-none focus:border-[#0B9C74]"/><textarea required value={customer.address} onChange={(event) => setCustomer({ ...customer, address: event.target.value })} placeholder="Delivery address" rows={3} className="w-full resize-none rounded-xl border border-[#F3E6D3] px-3 py-2.5 text-sm outline-none focus:border-[#0B9C74]"/><div className="space-y-1 border-t border-[#F3E6D3] pt-3 text-sm"><div className="flex justify-between"><span>Subtotal</span><span>₦{subtotal.toLocaleString()}</span></div><div className="flex justify-between"><span>Delivery</span><span>Calculated by store</span></div><div className="flex justify-between text-base font-bold"><span>Items subtotal</span><span>₦{total.toLocaleString()}</span></div></div><button disabled={submitting || containsMultipleStores} className="flex w-full items-center justify-center gap-2 rounded-full bg-[#0B9C74] px-5 py-3 text-sm font-bold text-white hover:bg-[#0a8a66] disabled:opacity-60"><CreditCard className="h-4 w-4"/>{submitting ? "Opening payment…" : "Continue to Paystack"}</button><p className="text-xs leading-5 text-[#6b6b6b]">Your email is used for the Paystack receipt and Brevo order updates — no signup or password required. Already ordered before? <Link to="/track" className="font-bold text-[#0B9C74] hover:underline">Track your orders</Link>.</p></form></div></div></div>
}
