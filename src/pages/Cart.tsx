import { useEffect, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { ShoppingBag, Trash2, ArrowRight, CreditCard, Banknote } from "lucide-react"
import { productService } from "../services/productService"
import { orderService } from "../services/orderService"
import { paymentService } from "../services/paymentService"
import { getEffectivePrice, getTotalStock } from "../types/product"
import type { Product, ProductVariant } from "../types/product"

type CartEntry = { productId: string; variantId?: string }
type CartItem = { product: Product; variant: ProductVariant | null; effectivePrice: number }

export default function Cart() {
  const [items, setItems] = useState<CartItem[]>([])
  const [customer, setCustomer] = useState({ name: "", phone: "", email: "", address: "" })
  const [placing, setPlacing] = useState(false)
  const [paying, setPaying] = useState(false)
  const [success, setSuccess] = useState<{ id: string; reference?: string; paid: boolean } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()

  const load = async () => {
    productService.seedDemo()
    const raw = localStorage.getItem("cognicart_cart")
    let entries: CartEntry[] = []
    try {
      const parsed = raw ? JSON.parse(raw) : []
      entries = parsed.map((e: unknown) => (typeof e === "string" ? { productId: e } : (e as CartEntry)))
    } catch { entries = [] }
    const prods: CartItem[] = []
    for (const entry of entries) {
      try {
        const p = await productService.getById(entry.productId)
        const v = entry.variantId ? p.variants?.find((x) => x.id === entry.variantId) || null : null
        prods.push({ product: p, variant: v, effectivePrice: getEffectivePrice(p, v) })
      } catch { /* ignore */ }
    }
    setItems(prods)
  }

  useEffect(() => { load() }, [])

  const clear = () => {
    localStorage.removeItem("cognicart_cart")
    setItems([])
  }

  const remove = (idx: number) => {
    const next = items.filter((_, i) => i !== idx)
    localStorage.setItem("cognicart_cart", JSON.stringify(next.map((it) => ({ productId: it.product.id, variantId: it.variant?.id }))))
    setItems(next)
  }

  const total = items.reduce((sum, it) => sum + it.effectivePrice, 0)
  const deliveryFee = total > 20000 ? 0 : items.length ? 1500 : 0
  const grandTotal = total + deliveryFee

  const validate = () => {
    if (!customer.name || !customer.phone || !customer.address) {
      setError("Name, phone and delivery address are required")
      return false
    }
    if (items.length === 0) return false
    // stock check
    for (const it of items) {
      const stock = it.variant ? it.variant.stock : getTotalStock(it.product)
      if (stock === 0) {
        setError(`${it.product.name}${it.variant ? ` (${[it.variant.size, it.variant.color].filter(Boolean).join(" / ")})` : ""} is out of stock`)
        return false
      }
    }
    return true
  }

  const emailForPaystack = () => {
    if (customer.email && customer.email.includes("@")) return customer.email
    const digits = customer.phone.replace(/[^0-9]/g, "")
    return `customer_${digits || "cognicart"}@cognicart.test`
  }

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!validate()) return
    setPlacing(true)
    try {
      const order = await orderService.create({
        customer: { name: customer.name, phone: customer.phone, address: customer.address },
        items: items.map((it) => ({ productId: it.product.id, quantity: 1, variantId: it.variant?.id })),
        deliveryAddress: customer.address,
        deliveryFee,
        paymentStatus: "Pending",
      })
      localStorage.removeItem("cognicart_cart")
      setSuccess({ id: order.id, paid: false })
      setItems([])
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to place order")
    } finally {
      setPlacing(false)
    }
  }

  const handlePaystack = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!validate()) return
    setPaying(true)
    try {
      const order = await orderService.create({
        customer: { name: customer.name, phone: customer.phone, address: customer.address, whatsappId: customer.phone },
        items: items.map((it) => ({ productId: it.product.id, quantity: 1, variantId: it.variant?.id })),
        deliveryAddress: customer.address,
        deliveryFee,
        paymentStatus: "Pending",
      })
      const email = emailForPaystack()
      const reference = await paymentService.payWithPaystack({
        orderId: order.id,
        amount: order.total,
        email,
        sellerId: order.sellerId,
        subtotal: order.subtotal,
        deliveryFee: order.deliveryFee,
      })
      localStorage.removeItem("cognicart_cart")
      setSuccess({ id: order.id, reference, paid: true })
      setItems([])
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Payment failed"
      if (msg === "Payment closed") setError("Payment was closed. Your order is saved as Pending. You can pay from Orders.")
      else setError(msg)
    } finally {
      setPaying(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-[60vh] bg-[#FFFBF5] grid place-items-center px-4 py-10">
        <div className="max-w-md text-center rounded-[22px] bg-white border border-[#F3E6D3] p-8">
          <div className={`mx-auto h-12 w-12 rounded-full grid place-items-center ${success.paid ? "bg-[#E6F7F1] border border-[#0B9C74]/20 text-[#0B9C74]" : "bg-[#FFF1DA] border border-[#F3E6D3] text-[#E85D26]"}`}>{success.paid ? "✓" : "○"}</div>
          <h1 className="font-display text-2xl font-bold mt-3">{success.paid ? "Payment successful" : "Order placed"}</h1>
          <p className="text-sm text-[#6b6b6b] mt-1">
            Order <span className="font-mono font-bold">#{success.id.slice(-6).toUpperCase()}</span> is {success.paid ? "Paid" : "Pending"}.
            {success.reference && <><br />Ref <span className="font-mono font-bold">{success.reference}</span></>}
            {success.paid ? " The seller will see it as Paid in Revenue and Orders." : " The seller will see it in Orders and can confirm."}
          </p>
          <div className="mt-4 rounded-2xl bg-[#FFF1DA] border border-[#F3E6D3] p-3 text-xs leading-5">Discounted prices and variant stock were checked at order time. Platform fee {success.paid ? "has been split" : "will be split on payment"}.</div>
          <div className="mt-5 flex flex-col sm:flex-row gap-3 justify-center">
            <button onClick={() => navigate("/store")} className="rounded-full bg-[#0B9C74] px-6 py-3 text-sm font-bold text-white hover:bg-[#0a8a66]">Continue shopping</button>
            <Link to="/dashboard/orders" className="rounded-full bg-white border border-[#F3E6D3] px-6 py-3 text-sm font-bold hover:bg-[#FFF1DA]">View in dashboard</Link>
          </div>
        </div>
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="min-h-[60vh] bg-[#FFFBF5] grid place-items-center px-4 py-10">
        <div className="text-center max-w-md">
          <div className="mx-auto h-12 w-12 rounded-full bg-[#FFF1DA] border border-[#F3E6D3] grid place-items-center"><ShoppingBag className="h-6 w-6 text-[#E85D26]" /></div>
          <h1 className="font-display text-2xl font-bold mt-3">Cart is empty</h1>
          <p className="text-sm text-[#6b6b6b] mt-1">Add from the storefront selecting size/color if needed. Discounted prices verified from same database.</p>
          <Link to="/store" className="mt-4 inline-flex rounded-full bg-[#0B9C74] px-6 py-3 text-sm font-bold text-white hover:bg-[#0a8a66]">Browse store</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#FFFBF5]">
      <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8 py-10">
        <h1 className="font-display text-[34px] font-bold tracking-tight">Cart</h1>
        <p className="text-sm text-[#6b6b6b]">{items.length} items • Variant-aware pricing • Pay with Paystack or pay on delivery</p>
        {error && <div className="mt-3 rounded-xl bg-red-50 border border-red-200 px-3 py-2.5 text-sm text-red-700">{error}</div>}

        <div className="mt-6 grid lg:grid-cols-[1.7fr_0.9fr] gap-6">
          <div className="space-y-3">
            {items.map((it, idx) => {
              const label = it.variant ? [it.variant.size, it.variant.color].filter(Boolean).join(" / ") || it.variant.sku : ""
              const original = it.product.price
              const hasDisc = it.effectivePrice < original || (it.variant?.price !== undefined && it.effectivePrice < (it.variant.price ?? original))
              return (
                <div key={idx} className="rounded-2xl bg-white border border-[#F3E6D3] p-4 flex gap-4 items-center">
                  <img src={it.variant?.image || it.product.images[0]} alt={it.product.name} className="h-16 w-16 rounded-xl object-cover bg-[#FFFBF5] border border-[#F3E6D3]" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-bold leading-tight truncate">{it.product.name}</div>
                    {label && <div className="text-xs font-bold text-[#0B9C74]">{label}{it.variant?.sku ? ` • ${it.variant.sku}` : ""}</div>}
                    <div className="text-xs text-[#6b6b6b]">{it.product.category} • Stock {it.variant ? it.variant.stock : getTotalStock(it.product)}{it.product.discount?.active ? " • Sale" : ""}</div>
                    <div className="text-sm font-bold">{hasDisc ? <><span className="text-[#E85D26]">₦{it.effectivePrice.toLocaleString()}</span> <span className="text-xs line-through text-[#9a9a9a]">₦{original.toLocaleString()}</span></> : `₦${it.effectivePrice.toLocaleString()}`}</div>
                  </div>
                  <button onClick={() => remove(idx)} className="h-9 w-9 grid place-items-center rounded-full bg-white border border-red-200 text-red-600 hover:bg-red-50"><Trash2 className="h-4 w-4" /></button>
                </div>
              )
            })}
            <button onClick={clear} className="text-xs font-bold text-[#6b6b6b] hover:text-[#1a1a1a] underline">Clear cart</button>
          </div>

          <div className="space-y-4">
            <div className="rounded-[22px] bg-white border border-[#F3E6D3] p-6 h-fit">
              <div className="text-sm font-bold">Order summary</div>
              <div className="mt-3 space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-[#6b6b6b]">Subtotal</span><span className="font-bold">₦{total.toLocaleString()}</span></div>
                <div className="flex justify-between"><span className="text-[#6b6b6b]">Delivery</span><span className="text-xs">{deliveryFee === 0 ? "Free" : `₦${deliveryFee.toLocaleString()}`}</span></div>
                <div className="pt-2 border-t border-[#F3E6D3] flex justify-between text-base font-bold"><span>Total</span><span>₦{grandTotal.toLocaleString()}</span></div>
              </div>

              <div className="mt-5 space-y-3">
                <div className="text-xs font-bold">Customer</div>
                <input value={customer.name} onChange={(e) => setCustomer({ ...customer, name: e.target.value })} placeholder="Full name" className="w-full rounded-xl border border-[#F3E6D3] px-3 py-2.5 text-sm focus:border-[#0B9C74] outline-none" />
                <input value={customer.phone} onChange={(e) => setCustomer({ ...customer, phone: e.target.value })} placeholder="Phone e.g. +2348010000001" className="w-full rounded-xl border border-[#F3E6D3] px-3 py-2.5 text-sm focus:border-[#0B9C74] outline-none" />
                <input value={customer.email} onChange={(e) => setCustomer({ ...customer, email: e.target.value })} placeholder="Email for Paystack receipt (optional)" className="w-full rounded-xl border border-[#F3E6D3] px-3 py-2.5 text-sm focus:border-[#0B9C74] outline-none" />
                <input value={customer.address} onChange={(e) => setCustomer({ ...customer, address: e.target.value })} placeholder="Delivery address" className="w-full rounded-xl border border-[#F3E6D3] px-3 py-2.5 text-sm focus:border-[#0B9C74] outline-none" />

                <button onClick={handlePaystack} disabled={paying || placing} className="w-full flex justify-center items-center gap-2 rounded-full bg-[#0B9C74] px-6 py-3 text-sm font-bold text-white hover:bg-[#0a8a66] disabled:opacity-60">
                  <CreditCard className="h-4 w-4" /> {paying ? "Opening Paystack..." : `Pay ₦${grandTotal.toLocaleString()} with Paystack`}
                </button>

                <button onClick={handlePlaceOrder} disabled={paying || placing} className="w-full flex justify-center items-center gap-2 rounded-full bg-white border border-[#F3E6D3] px-6 py-3 text-sm font-bold hover:bg-[#FFF1DA] disabled:opacity-60">
                  <Banknote className="h-4 w-4" /> {placing ? "Placing..." : "Place order — Pay on delivery"} <ArrowRight className="h-4 w-4" />
                </button>

                <p className="text-xs text-[#9a9a9a] leading-5">Discounts and variant stock verified server-side. WhatsApp AI uses identical pricing.</p>
              </div>

              <div className="mt-4 pt-4 border-t border-[#F3E6D3] flex flex-col gap-2">
                <Link to="/checkout" className="w-full flex justify-center items-center gap-2 rounded-full bg-[#1a1a1a] px-6 py-2.5 text-sm font-bold text-white hover:bg-black">Checkout on WhatsApp</Link>
                <Link to="/store" className="text-center text-xs font-bold text-[#0B9C74] hover:underline">Continue shopping</Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
