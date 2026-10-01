import { useEffect, useMemo, useState } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"
import { ArrowLeft, Package, PencilLine, Plus, Trash2, User } from "lucide-react"
import { orderService } from "../../services/orderService"
import { productService } from "../../services/productService"
import { getEffectivePrice } from "../../types/product"
import type { Product } from "../../types/product"
import {
  MANUAL_CHANNELS,
  MANUAL_CHANNEL_LABELS,
  ORDER_STATUSES,
  PAYMENT_METHODS,
  PAYMENT_METHOD_LABELS,
  PAYMENT_STATUSES,
} from "../../types/order"
import type { ManualChannel, Order, OrderStatus, PaymentMethod, PaymentStatus } from "../../types/order"
import { getApiErrorMessage } from "../../services/apiError"
import {
  buildManualOrderPayload,
  buildManualOrderUpdatePayload,
  emptyManualItem,
  emptyManualOrderDraft,
  estimateManualOrderTotals,
  validateManualOrderDraft,
  type ManualOrderDraft,
} from "../../utils/manualOrder"

function draftFromOrder(order: Order): ManualOrderDraft {
  return {
    customerName: order.customerName,
    customerPhone: order.customerPhone,
    customerEmail: order.customerEmail || "",
    deliveryAddress: order.deliveryAddress || "",
    items: order.items.map((item) => ({
      productId: item.productId || undefined,
      variantId: item.variantId || undefined,
      name: item.name,
      price: String(item.price),
      quantity: String(item.quantity),
      image: item.image,
      isCustom: !item.productId,
    })),
    deliveryFee: String(order.deliveryFee ?? 0),
    sourceChannel: (order.sourceChannel || "other") as ManualChannel,
    sourceNote: order.sourceNote || "",
    notes: order.notes || "",
    expectedDeliveryDate: order.expectedDeliveryDate ? order.expectedDeliveryDate.slice(0, 10) : "",
    orderStatus: order.orderStatus,
    paymentStatus: order.paymentStatus,
    paymentMethod: order.paymentMethod || "bank_transfer",
    paymentReference: order.paymentReference || "",
    adjustInventory: order.inventoryAdjusted === true,
  }
}

export default function ManualOrderForm() {
  const { id } = useParams<{ id: string }>()
  const isEdit = Boolean(id)
  const navigate = useNavigate()

  const [draft, setDraft] = useState<ManualOrderDraft>(emptyManualOrderDraft())
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    let active = true
    const load = async () => {
      try {
        const catalog = await productService.list()
        if (active) setProducts(catalog)
        if (id) {
          const order = await orderService.getById(id)
          if (!active) return
          if (order.source !== "manual") {
            // Automatic (storefront/Telegram) orders can never be edited here.
            setNotFound(true)
            return
          }
          setDraft(draftFromOrder(order))
        }
      } catch {
        if (active && id) setNotFound(true)
      } finally {
        if (active) setLoading(false)
      }
    }
    void load()
    return () => { active = false }
  }, [id])

  const catalogPrices = useMemo(() => {
    const map = new Map<string, number>()
    for (const product of products) {
      map.set(`${product.id}::`, getEffectivePrice(product))
      for (const variant of product.variants || []) {
        map.set(`${product.id}::${variant.id}`, getEffectivePrice(product, variant))
      }
    }
    return map
  }, [products])

  const totals = useMemo(() => estimateManualOrderTotals(draft, catalogPrices), [draft, catalogPrices])

  const update = (patch: Partial<ManualOrderDraft>) => setDraft((current) => ({ ...current, ...patch }))

  const updateItem = (index: number, patch: Partial<ManualOrderDraft["items"][number]>) =>
    setDraft((current) => ({
      ...current,
      items: current.items.map((item, i) => (i === index ? { ...item, ...patch } : item)),
    }))

  const removeItem = (index: number) =>
    setDraft((current) => ({ ...current, items: current.items.filter((_, i) => i !== index) }))

  const selectProduct = (index: number, productId: string) => {
    const product = products.find((p) => p.id === productId)
    updateItem(index, {
      productId: productId || undefined,
      variantId: undefined,
      name: product?.name || "",
      image: product?.images?.[0],
    })
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    const problem = validateManualOrderDraft(draft)
    if (problem) {
      setError(problem)
      return
    }
    setSubmitting(true)
    setError(null)
    try {
      const order = isEdit && id
        ? await orderService.updateManual(id, buildManualOrderUpdatePayload(draft))
        : await orderService.createManual(buildManualOrderPayload(draft))
      navigate(`/dashboard/orders/${order.id}`)
    } catch (reason) {
      setError(getApiErrorMessage(reason, "Unable to save the order."))
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <div className="grid place-items-center py-16"><div className="h-8 w-8 animate-spin rounded-full border-2 border-[#0B9C74] border-t-transparent" /></div>

  if (notFound) {
    return (
      <div className="rounded-2xl border border-[#F3E6D3] bg-white p-8 text-center">
        <div className="font-bold">Manual order not found</div>
        <p className="mt-1 text-sm text-[#6b6b6b]">Only manually logged orders can be edited. Storefront and Telegram orders are automatic and keep their backend-computed details.</p>
        <Link to="/dashboard/orders" className="mt-4 inline-flex rounded-full bg-[#0B9C74] px-5 py-2.5 text-sm font-bold text-white">Back to orders</Link>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Link to="/dashboard/orders" className="inline-flex items-center gap-2 text-sm font-medium text-[#6b6b6b] hover:text-[#1a1a1a]"><ArrowLeft className="h-4 w-4" /> Back to orders</Link>

      <div>
        <h1 className="flex items-center gap-2 font-display text-2xl font-bold tracking-tight"><PencilLine className="h-5 w-5 text-[#E85D26]" />{isEdit ? "Edit manual order" : "Log a manual order"}</h1>
        <p className="text-sm text-[#6b6b6b]">Record a sale you made outside the automatic channels — Instagram DM, WhatsApp chat, a phone call, a walk-in, anywhere. You control the prices; the backend recomputes the totals.</p>
      </div>

      {error && <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700" role="alert">{error}</div>}

      <form onSubmit={handleSubmit} className="space-y-6">
        <section className="rounded-2xl border border-[#F3E6D3] bg-white p-5">
          <h2 className="flex items-center gap-2 font-bold"><User className="h-4 w-4 text-[#0B9C74]" />Customer</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <input required value={draft.customerName} onChange={(e) => update({ customerName: e.target.value })} placeholder="Full name *" className="rounded-xl border border-[#F3E6D3] px-3 py-2.5 text-sm outline-none focus:border-[#0B9C74]" />
            <input required value={draft.customerPhone} onChange={(e) => update({ customerPhone: e.target.value })} placeholder="Phone number *" className="rounded-xl border border-[#F3E6D3] px-3 py-2.5 text-sm outline-none focus:border-[#0B9C74]" />
            <input type="email" value={draft.customerEmail} onChange={(e) => update({ customerEmail: e.target.value })} placeholder="Email (optional — enables receipts)" className="rounded-xl border border-[#F3E6D3] px-3 py-2.5 text-sm outline-none focus:border-[#0B9C74]" />
            <input value={draft.deliveryAddress} onChange={(e) => update({ deliveryAddress: e.target.value })} placeholder="Delivery address" className="rounded-xl border border-[#F3E6D3] px-3 py-2.5 text-sm outline-none focus:border-[#0B9C74]" />
          </div>
        </section>

        <section className="rounded-2xl border border-[#F3E6D3] bg-white p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="flex items-center gap-2 font-bold"><Package className="h-4 w-4 text-[#0B9C74]" />Items</h2>
            <div className="flex gap-2">
              <button type="button" onClick={() => setDraft((c) => ({ ...c, items: [...c.items, emptyManualItem(false)] }))} className="inline-flex items-center gap-1 rounded-full border border-[#F3E6D3] bg-white px-3.5 py-2 text-xs font-bold hover:bg-[#FFF1DA]"><Plus className="h-3.5 w-3.5" /> Catalog item</button>
              <button type="button" onClick={() => setDraft((c) => ({ ...c, items: [...c.items, emptyManualItem(true)] }))} className="inline-flex items-center gap-1 rounded-full border border-[#F3E6D3] bg-white px-3.5 py-2 text-xs font-bold hover:bg-[#FFF1DA]"><Plus className="h-3.5 w-3.5" /> Custom item</button>
            </div>
          </div>

          <div className="mt-3 space-y-3">
            {draft.items.length === 0 && <p className="rounded-xl bg-[#FFFBF5] p-4 text-center text-sm text-[#6b6b6b]">Add catalog products (with variants) or custom off-catalog items.</p>}
            {draft.items.map((item, index) => {
              const product = products.find((p) => p.id === item.productId)
              const catalogPrice = catalogPrices.get(`${item.productId || ""}::${item.variantId || ""}`)
              return (
                <div key={index} className="rounded-xl border border-[#F3E6D3] bg-[#FFFBF5] p-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${item.isCustom ? "bg-[#FFF1DA] text-[#E85D26]" : "bg-[#E6F7F1] text-[#0B9C74]"}`}>{item.isCustom ? "Custom item" : "Catalog item"}</span>
                    <button type="button" onClick={() => removeItem(index)} aria-label={`Remove item ${index + 1}`} className="grid h-8 w-8 place-items-center rounded-full border border-[#F3E6D3] bg-white hover:bg-red-50 hover:text-red-700"><Trash2 className="h-3.5 w-3.5" /></button>
                  </div>
                  <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                    {item.isCustom ? (
                      <input value={item.name} onChange={(e) => updateItem(index, { name: e.target.value })} placeholder="Item name *" className="rounded-xl border border-[#F3E6D3] bg-white px-3 py-2 text-sm outline-none focus:border-[#0B9C74] lg:col-span-2" />
                    ) : (
                      <>
                        <select value={item.productId || ""} onChange={(e) => selectProduct(index, e.target.value)} aria-label="Product" className="rounded-xl border border-[#F3E6D3] bg-white px-3 py-2 text-sm outline-none focus:border-[#0B9C74]">
                          <option value="">Select product *</option>
                          {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                        <select
                          value={item.variantId || ""}
                          onChange={(e) => updateItem(index, { variantId: e.target.value || undefined })}
                          disabled={!product?.variants?.length}
                          aria-label="Variant"
                          className="rounded-xl border border-[#F3E6D3] bg-white px-3 py-2 text-sm outline-none focus:border-[#0B9C74] disabled:opacity-50"
                        >
                          <option value="">{product?.variants?.length ? "Base / no variant" : "No variants"}</option>
                          {(product?.variants || []).map((v) => <option key={v.id} value={v.id}>{[v.size, v.color, v.sku].filter(Boolean).join(" / ")}</option>)}
                        </select>
                      </>
                    )}
                    <input
                      inputMode="decimal"
                      value={item.price}
                      onChange={(e) => updateItem(index, { price: e.target.value })}
                      placeholder={item.isCustom ? "Price (₦) *" : catalogPrice !== undefined ? `Catalog ₦${catalogPrice.toLocaleString()} (override?)` : "Negotiated price (₦)"}
                      aria-label="Price"
                      className="rounded-xl border border-[#F3E6D3] bg-white px-3 py-2 text-sm outline-none focus:border-[#0B9C74]"
                    />
                    <input inputMode="numeric" value={item.quantity} onChange={(e) => updateItem(index, { quantity: e.target.value })} placeholder="Qty *" aria-label="Quantity" className="rounded-xl border border-[#F3E6D3] bg-white px-3 py-2 text-sm outline-none focus:border-[#0B9C74]" />
                  </div>
                  {!item.isCustom && item.price === "" && catalogPrice !== undefined && (
                    <p className="mt-1 text-[11px] text-[#9a9a9a]">Leave price blank to bill the current catalog price (₦{catalogPrice.toLocaleString()}), or type the negotiated amount.</p>
                  )}
                </div>
              )
            })}
          </div>

          <label className="mt-4 flex items-start gap-2 rounded-xl border border-[#F3E6D3] bg-white p-3 text-sm">
            <input type="checkbox" checked={draft.adjustInventory} onChange={(e) => update({ adjustInventory: e.target.checked })} className="mt-0.5 h-4 w-4 accent-[#0B9C74]" />
            <span>
              <span className="font-bold">Deduct catalog stock</span>
              <span className="block text-xs text-[#6b6b6b]">Adjust inventory for the catalog items above. Custom items never affect stock.</span>
            </span>
          </label>
        </section>

        <section className="rounded-2xl border border-[#F3E6D3] bg-white p-5">
          <h2 className="font-bold">Source & delivery</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <label className="text-xs font-bold text-[#6b6b6b]">
              Where did this sale happen? *
              <select value={draft.sourceChannel} onChange={(e) => update({ sourceChannel: e.target.value as ManualChannel })} className="mt-1 w-full rounded-xl border border-[#F3E6D3] bg-white px-3 py-2.5 text-sm font-normal outline-none focus:border-[#0B9C74]">
                {MANUAL_CHANNELS.map((c) => <option key={c} value={c}>{MANUAL_CHANNEL_LABELS[c]}</option>)}
              </select>
            </label>
            <label className="text-xs font-bold text-[#6b6b6b]">
              Expected delivery date
              <input type="date" value={draft.expectedDeliveryDate} onChange={(e) => update({ expectedDeliveryDate: e.target.value })} className="mt-1 w-full rounded-xl border border-[#F3E6D3] bg-white px-3 py-2.5 text-sm font-normal outline-none focus:border-[#0B9C74]" />
            </label>
            <label className="text-xs font-bold text-[#6b6b6b]">
              Delivery fee (₦)
              <input inputMode="decimal" value={draft.deliveryFee} onChange={(e) => update({ deliveryFee: e.target.value })} className="mt-1 w-full rounded-xl border border-[#F3E6D3] bg-white px-3 py-2.5 text-sm font-normal outline-none focus:border-[#0B9C74]" />
            </label>
            <label className="text-xs font-bold text-[#6b6b6b]">
              Fulfilment status
              <select value={draft.orderStatus} onChange={(e) => update({ orderStatus: e.target.value as OrderStatus })} className="mt-1 w-full rounded-xl border border-[#F3E6D3] bg-white px-3 py-2.5 text-sm font-normal outline-none focus:border-[#0B9C74]">
                {ORDER_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </label>
            <input value={draft.sourceNote} onChange={(e) => update({ sourceNote: e.target.value })} maxLength={300} placeholder='Source note, e.g. "DM from @adaobi_thrifts"' className="rounded-xl border border-[#F3E6D3] px-3 py-2.5 text-sm outline-none focus:border-[#0B9C74] sm:col-span-2" />
            <textarea value={draft.notes} onChange={(e) => update({ notes: e.target.value })} maxLength={1000} rows={2} placeholder="Internal notes (only you see these)" className="resize-none rounded-xl border border-[#F3E6D3] px-3 py-2.5 text-sm outline-none focus:border-[#0B9C74] sm:col-span-2" />
          </div>
        </section>

        {!isEdit && (
          <section className="rounded-2xl border border-[#F3E6D3] bg-white p-5">
            <h2 className="font-bold">Offline payment</h2>
            <p className="mt-1 text-xs text-[#6b6b6b]">Record how the customer paid (or will pay). Only manual orders support seller-recorded payment — storefront and Telegram orders are reconciled by Paystack.</p>
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              <label className="text-xs font-bold text-[#6b6b6b]">
                Payment status
                <select value={draft.paymentStatus} onChange={(e) => update({ paymentStatus: e.target.value as PaymentStatus })} className="mt-1 w-full rounded-xl border border-[#F3E6D3] bg-white px-3 py-2.5 text-sm font-normal outline-none focus:border-[#0B9C74]">
                  {PAYMENT_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </label>
              <label className="text-xs font-bold text-[#6b6b6b]">
                Method
                <select value={draft.paymentMethod} onChange={(e) => update({ paymentMethod: e.target.value as PaymentMethod })} className="mt-1 w-full rounded-xl border border-[#F3E6D3] bg-white px-3 py-2.5 text-sm font-normal outline-none focus:border-[#0B9C74]">
                  {PAYMENT_METHODS.filter((m) => m !== "paystack").map((m) => <option key={m} value={m}>{PAYMENT_METHOD_LABELS[m]}</option>)}
                </select>
              </label>
              <label className="text-xs font-bold text-[#6b6b6b]">
                Reference
                <input value={draft.paymentReference} onChange={(e) => update({ paymentReference: e.target.value })} placeholder="Transfer ref, receipt no…" className="mt-1 w-full rounded-xl border border-[#F3E6D3] px-3 py-2.5 text-sm font-normal outline-none focus:border-[#0B9C74]" />
              </label>
            </div>
          </section>
        )}

        <div className="flex flex-col items-stretch justify-between gap-3 rounded-2xl bg-[#1a1a1a] p-5 text-white sm:flex-row sm:items-center">
          <div className="text-sm">
            <div className="flex gap-4">
              <span>Subtotal <span className="font-bold">₦{totals.subtotal.toLocaleString()}</span></span>
              <span>Delivery <span className="font-bold">₦{totals.deliveryFee.toLocaleString()}</span></span>
              <span>Total <span className="font-bold">₦{totals.total.toLocaleString()}</span></span>
            </div>
            <p className="mt-1 text-xs text-white/60">Estimated — the backend recomputes exact totals from the saved line items.</p>
          </div>
          <button disabled={submitting} className="rounded-full bg-[#E85D26] px-6 py-3 text-sm font-bold text-white hover:bg-[#d55422] disabled:opacity-60">{submitting ? "Saving…" : isEdit ? "Save corrections" : "Log order"}</button>
        </div>
      </form>
    </div>
  )
}
