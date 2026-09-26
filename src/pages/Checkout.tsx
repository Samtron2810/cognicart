import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { CreditCard, ShoppingBag } from "lucide-react"
import { productService } from "../services/productService"
import { orderService } from "../services/orderService"
import { paymentService } from "../services/paymentService"
import { getEffectivePrice, getTotalStock } from "../types/product"
import type { Product, ProductVariant } from "../types/product"

type CartEntry = { productId: string; variantId?: string }
type CartItem = { product: Product; variant: ProductVariant | null; effectivePrice: number }

export default function Checkout() {
  const [items, setItems] = useState<CartItem[]>([])
  const [customer, setCustomer] = useState({ name: "", phone: "", email: "", address: "" })
  const [paying, setPaying] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<{ id: string; reference: string } | null>(null)

  useEffect(() => {
    productService.seedDemo()
    const raw = localStorage.getItem("cognicart_cart")
    let entries: CartEntry[] = []
    try {
      const parsed = raw ? JSON.parse(raw) : []
      entries = parsed.map((e: unknown) => (typeof e === "string" ? { productId: e } : (e as CartEntry)))
    } catch { entries = [] }
    const load = async () => {
      const prods: CartItem[] = []
      for (const ent of entries) {
        try {
          const p = await productService.getById(ent.productId)
          const v = ent.variantId ? p.variants?.find((x) => x.id === ent.variantId) || null : null
          prods.push({ product: p, variant: v, effectivePrice: getEffectivePrice(p, v) })
        } catch {}
      }
      setItems(prods)
    }
    load()
  }, [])

  const total = items.reduce((sum, it) => sum + it.effectivePrice, 0)
  const deliveryFee = total > 20000 ? 0 : items.length ? 1500 : 0
  const grandTotal = total + deliveryFee

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!customer.name || !customer.phone || !customer.address) {
      setError("Name, phone and address required")
      return
    }
    if (items.length === 0) {
      setError("Cart empty")
      return
    }
    for (const it of items) {
      const stock = it.variant ? it.variant.stock : getTotalStock(it.product)
      if (stock === 0) {
        setError(`${it.product.name} is out of stock`)
        return
      }
    }
    setPaying(true)
    try {
      const order = await orderService.create({
        customer: { name: customer.name, phone: customer.phone, address: customer.address },
        items: items.map((it) => ({ productId: it.product.id, quantity: 1, variantId: it.variant?.id })),
        deliveryAddress: customer.address,
        deliveryFee,
        paymentStatus: "Pending",
      })
      const email = customer.email.includes("@") ? customer.email : `customer_${customer.phone.replace(/[^0-9]/g, "")}@cognicart.test`
      const ref = await paymentService.payWithPaystack({
        orderId: order.id,
        amount: order.total,
        email,
        sellerId: order.sellerId,
        subtotal: order.subtotal,
        deliveryFee: order.deliveryFee,
      })
      localStorage.removeItem("cognicart_cart")
      setItems([])
      setSuccess({ id: order.id, reference: ref })
    } catch (err) {
      setError(err instanceof Error ? err.message : "Payment failed")
    } finally {
      setPaying(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-[60vh] bg-[#FFFBF5] grid place-items-center px-4 py-10">
        <div className="max-w-md text-center rounded-[22px] bg-white border border-[#F3E6D3] p-8">
          <div className="mx-auto h-12 w-12 rounded-full bg-[#E6F7F1] border border-[#0B9C74]/20 grid place-items-center text-[#0B9C74]">✓</div>
          <h1 className="font-display text-2xl font-bold mt-3">Paid on Paystack</h1>
          <p className="text-sm text-[#6b6b6b] mt-1">Order <span className="font-mono font-bold">#{success.id.slice(-6).toUpperCase()}</span> Paid. Ref <span className="font-mono font-bold">{success.reference}</span>. Seller sees fee split in Revenue.</p>
          <div className="mt-5 flex gap-3 justify-center">
            <Link to="/store" className="rounded-full bg-[#0B9C74] px-6 py-3 text-sm font-bold text-white">Continue shopping</Link>
            <Link to="/dashboard/orders" className="rounded-full bg-white border border-[#F3E6D3] px-6 py-3 text-sm font-bold">Seller orders</Link>
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
          <h1 className="font-display text-2xl font-bold mt-3">No items to checkout</h1>
          <p className="text-sm text-[#6b6b6b] mt-1">Add products from the store selecting size/color. Checkout creates a real order and pays via Paystack with platform fee split.</p>
          <Link to="/store" className="mt-4 inline-flex rounded-full bg-[#0B9C74] px-6 py-3 text-sm font-bold text-white">Browse store</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#FFFBF5] py-10">
      <div className="mx-auto max-w-[640px] px-4 sm:px-6">
        <h1 className="font-display text-[34px] font-bold tracking-tight">Checkout with Paystack</h1>
        <p className="text-sm text-[#6b6b6b]">Discounted variant price verified at order time. If VITE_PAYSTACK_PUBLIC_KEY is not set, mock success is simulated.</p>
        {error && <div className="mt-3 rounded-xl bg-red-50 border border-red-200 px-3 py-2.5 text-sm text-red-700">{error}</div>}

        <div className="mt-6 rounded-[22px] bg-white border border-[#F3E6D3] p-6">
          <div className="text-sm font-bold">{items.length} items • Total ₦{grandTotal.toLocaleString()}</div>
          <div className="mt-2 space-y-2">
            {items.map((it, idx) => {
              const label = it.variant ? [it.variant.size, it.variant.color].filter(Boolean).join(" / ") : ""
              return (
                <div key={idx} className="flex justify-between text-sm border-b border-[#F3E6D3] py-2">
                  <span className="truncate">{it.product.name}{label ? ` (${label})` : ""}</span><span className="font-bold">₦{it.effectivePrice.toLocaleString()}</span>
                </div>
              )
            })}
          </div>
          <div className="mt-3 flex justify-between text-sm"><span className="text-[#6b6b6b]">Subtotal</span><span>₦{total.toLocaleString()}</span></div>
          <div className="flex justify-between text-sm"><span className="text-[#6b6b6b]">Delivery</span><span>{deliveryFee === 0 ? "Free" : `₦${deliveryFee.toLocaleString()}`}</span></div>
          <div className="flex justify-between text-base font-bold pt-2 border-t border-[#F3E6D3] mt-2"><span>Total</span><span>₦{grandTotal.toLocaleString()}</span></div>

          <form onSubmit={handlePay} className="mt-6 space-y-3">
            <input value={customer.name} onChange={(e) => setCustomer({ ...customer, name: e.target.value })} placeholder="Full name" className="w-full rounded-xl border border-[#F3E6D3] px-3 py-2.5 text-sm focus:border-[#0B9C74] outline-none" />
            <input value={customer.phone} onChange={(e) => setCustomer({ ...customer, phone: e.target.value })} placeholder="Phone" className="w-full rounded-xl border border-[#F3E6D3] px-3 py-2.5 text-sm focus:border-[#0B9C74] outline-none" />
            <input value={customer.email} onChange={(e) => setCustomer({ ...customer, email: e.target.value })} placeholder="Email for receipt (optional)" className="w-full rounded-xl border border-[#F3E6D3] px-3 py-2.5 text-sm focus:border-[#0B9C74] outline-none" />
            <input value={customer.address} onChange={(e) => setCustomer({ ...customer, address: e.target.value })} placeholder="Delivery address" className="w-full rounded-xl border border-[#F3E6D3] px-3 py-2.5 text-sm focus:border-[#0B9C74] outline-none" />
            <button disabled={paying} className="w-full flex justify-center items-center gap-2 rounded-full bg-[#0B9C74] px-6 py-3 text-sm font-bold text-white hover:bg-[#0a8a66] disabled:opacity-60">
              <CreditCard className="h-4 w-4" /> {paying ? "Processing..." : `Pay ₦${grandTotal.toLocaleString()} now`}
            </button>
            <p className="text-xs text-[#9a9a9a] leading-5">Creates order as Pending then verifies Paystack and marks Paid with discounted total.</p>
          </form>
        </div>

        <div className="mt-4 text-center">
          <Link to="/cart" className="text-sm font-bold text-[#0B9C74] hover:underline">Back to cart</Link>
        </div>
      </div>
    </div>
  )
}
