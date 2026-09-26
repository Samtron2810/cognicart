import { useEffect, useState } from "react"
import { useParams, useNavigate, Link } from "react-router-dom"
import { productService } from "../../services/productService"
import { PRODUCT_CATEGORIES } from "../../types/product"
import type { ProductDiscount, ProductVariant } from "../../types/product"
import { Upload, X, ArrowLeft, Plus, Trash2, Tag, Palette } from "lucide-react"

export default function EditProduct() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: "", description: "", price: "", stock: "", category: "Beauty", isActive: true })
  const [images, setImages] = useState<string[]>([])
  const [discountActive, setDiscountActive] = useState(false)
  const [discountType, setDiscountType] = useState<"percentage" | "fixed">("percentage")
  const [discountValue, setDiscountValue] = useState("")
  const [hasVariants, setHasVariants] = useState(false)
  const [variants, setVariants] = useState<ProductVariant[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    productService
      .getById(id)
      .then((p) => {
        setForm({ name: p.name, description: p.description, price: String(p.price), stock: String(p.stock), category: p.category, isActive: p.isActive })
        setImages(p.images)
        if (p.discount) {
          setDiscountActive(!!p.discount.active)
          setDiscountType(p.discount.type)
          setDiscountValue(String(p.discount.value))
        }
        if (p.variants && p.variants.length > 0) {
          setHasVariants(true)
          setVariants(p.variants)
        }
      })
      .catch(() => setError("Product not found"))
      .finally(() => setInitialLoading(false))
  }, [id])

  const handleImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return
    Array.from(files).forEach((file) => {
      if (images.length >= 4) return
      const reader = new FileReader()
      reader.onload = () => {
        if (typeof reader.result === "string") setImages((prev) => [...prev, reader.result as string].slice(0, 4))
      }
      reader.readAsDataURL(file)
    })
    e.target.value = ""
  }

  const addVariant = () => {
    if (variants.length >= 20) return
    setVariants((v) => [...v, { id: `var_${Date.now()}_${v.length}`, size: "", color: "", sku: "", stock: 0, price: undefined }])
  }
  const updateVariant = (idx: number, patch: Partial<ProductVariant>) => {
    setVariants((prev) => prev.map((v, i) => (i === idx ? { ...v, ...patch } : v)))
  }
  const removeVariant = (idx: number) => setVariants((prev) => prev.filter((_, i) => i !== idx))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!id) return
    setError(null)
    const price = Number(form.price)
    const stock = hasVariants ? variants.reduce((s, v) => s + (Number(v.stock) || 0), 0) : Number(form.stock)
    if (!form.name || Number.isNaN(price) || price <= 0) {
      setError("Name and valid price are required")
      return
    }
    if (!hasVariants && (!Number.isInteger(stock) || stock < 0)) {
      setError("Stock must be 0 or more")
      return
    }
    if (hasVariants) {
      if (variants.length === 0) {
        setError("Add at least one variant")
        return
      }
      for (let i = 0; i < variants.length; i++) {
        const v = variants[i]
        if (!v.size && !v.color && !v.sku) {
          setError(`Variant ${i + 1}: fill at least size, color or SKU`)
          return
        }
      }
    }
    if (images.length === 0) {
      setError("Add at least one image")
      return
    }
    if (discountActive) {
      const dv = Number(discountValue)
      if (!Number.isFinite(dv) || dv <= 0) {
        setError("Discount value must be > 0")
        return
      }
      if (discountType === "percentage" && (dv < 1 || dv > 90)) {
        setError("Percentage must be 1 - 90")
        return
      }
    }
    setLoading(true)
    try {
      // if user disabled, keep discount inactive but preserve value; or clear if never had discount
      const finalDiscount = discountActive ? { active: true, type: discountType, value: Math.round(Number(discountValue)) } : (() => {
        // if previously had discount and now off, persist inactive
        if (discountValue) return { active: false, type: discountType, value: Math.round(Number(discountValue)) } as ProductDiscount
        return undefined
      })()
      const payloadVariants = hasVariants ? variants.map((v) => ({ id: v.id, size: v.size || undefined, color: v.color || undefined, sku: v.sku || undefined, stock: Number(v.stock), price: v.price ? Number(v.price) : undefined })) : []
      await productService.update(id, {
        name: form.name,
        description: form.description,
        price,
        stock,
        category: form.category,
        images,
        isActive: form.isActive,
        discount: finalDiscount,
        variants: hasVariants ? (payloadVariants as ProductVariant[]) : [],
      })
      navigate("/dashboard/products")
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to update"
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  const previewPrice = (() => {
    const base = Number(form.price) || 0
    if (!discountActive || !discountValue) return null
    const dv = Number(discountValue)
    if (!Number.isFinite(dv)) return null
    return discountType === "percentage" ? Math.max(1, Math.round(base * (1 - dv / 100))) : Math.max(1, base - dv)
  })()

  if (initialLoading) {
    return (
      <div className="grid place-items-center py-16">
        <div className="h-8 w-8 rounded-full border-2 border-[#0B9C74] border-t-transparent animate-spin" />
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Link to="/dashboard/products" className="inline-flex items-center gap-2 text-sm font-medium text-[#6b6b6b] hover:text-[#1a1a1a]">
        <ArrowLeft className="h-4 w-4" /> Back to products
      </Link>

      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight">Edit product</h1>
        <p className="text-sm text-[#6b6b6b]">Discount toggle and size/color update immediately for WhatsApp AI.</p>
      </div>

      {error && <div className="rounded-xl bg-red-50 border border-red-200 px-3 py-2.5 text-sm text-red-700">{error}</div>}

      <form onSubmit={handleSubmit} className="rounded-2xl bg-white border border-[#F3E6D3] p-6 space-y-7">
        <div className="grid sm:grid-cols-2 gap-4">
          <label className="sm:col-span-2">
            <span className="text-xs font-bold">Product name</span>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="mt-1 w-full rounded-xl border border-[#F3E6D3] px-3 py-2.5 text-sm focus:border-[#0B9C74] focus:ring-2 focus:ring-[#0B9C74]/15 outline-none" />
          </label>
          <label className="sm:col-span-2">
            <span className="text-xs font-bold">Description</span>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} className="mt-1 w-full rounded-xl border border-[#F3E6D3] px-3 py-2.5 text-sm focus:border-[#0B9C74] focus:ring-2 focus:ring-[#0B9C74]/15 outline-none resize-none" />
          </label>
          <label>
            <span className="text-xs font-bold">Price (NGN)</span>
            <input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className="mt-1 w-full rounded-xl border border-[#F3E6D3] px-3 py-2.5 text-sm focus:border-[#0B9C74] focus:ring-2 focus:ring-[#0B9C74]/15 outline-none" />
          </label>
          {!hasVariants && (
            <label>
              <span className="text-xs font-bold">Stock</span>
              <input type="number" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} className="mt-1 w-full rounded-xl border border-[#F3E6D3] px-3 py-2.5 text-sm focus:border-[#0B9C74] focus:ring-2 focus:ring-[#0B9C74]/15 outline-none" />
            </label>
          )}
          {hasVariants && (
            <div className="rounded-xl bg-[#FFFBF5] border border-[#F3E6D3] px-3 py-2.5 flex items-center gap-2">
              <span className="text-xs font-bold">Total stock</span>
              <span className="ml-auto text-sm font-bold">{variants.reduce((s, v) => s + (Number(v.stock) || 0), 0)} units</span>
            </div>
          )}
          <label>
            <span className="text-xs font-bold">Category</span>
            <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="mt-1 w-full rounded-xl border border-[#F3E6D3] bg-white px-3 py-2.5 text-sm focus:border-[#0B9C74] outline-none">
              {PRODUCT_CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </label>
          <label className="flex items-center gap-3 pt-6">
            <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} className="h-4 w-4 rounded border-[#F3E6D3] text-[#0B9C74] focus:ring-[#0B9C74]" />
            <span className="text-sm font-medium">Active</span>
          </label>
        </div>

        <div className="rounded-2xl border border-[#F3E6D3] bg-[#FFFBF5] p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Tag className="h-4 w-4 text-[#E85D26]" />
              <span className="text-sm font-bold">Discount</span>
              {previewPrice !== null && Number(form.price) > 0 && (
                <span className="ml-2 rounded-full bg-[#0B9C74] text-white text-xs font-bold px-2.5 py-1">₦{Number(form.price).toLocaleString()} → ₦{previewPrice.toLocaleString()}</span>
              )}
            </div>
            <label className="flex items-center gap-2 text-sm font-medium">
              <input type="checkbox" checked={discountActive} onChange={(e) => setDiscountActive(e.target.checked)} className="h-4 w-4 rounded border-[#F3E6D3] text-[#0B9C74]" />
              Active
            </label>
          </div>
          {discountActive && (
            <div className="grid sm:grid-cols-3 gap-3">
              <label>
                <span className="text-xs font-bold">Type</span>
                <select value={discountType} onChange={(e) => setDiscountType(e.target.value as never)} className="mt-1 w-full rounded-xl border border-[#F3E6D3] bg-white px-3 py-2.5 text-sm">
                  <option value="percentage">Percentage %</option>
                  <option value="fixed">Fixed NGN</option>
                </select>
              </label>
              <label className="sm:col-span-2">
                <span className="text-xs font-bold">Value</span>
                <input type="number" value={discountValue} onChange={(e) => setDiscountValue(e.target.value)} placeholder={discountType === "percentage" ? "15" : "1000"} className="mt-1 w-full rounded-xl border border-[#F3E6D3] px-3 py-2.5 text-sm focus:border-[#0B9C74] outline-none" />
              </label>
            </div>
          )}
          {!discountActive && discountValue && (
            <p className="text-xs text-[#6b6b6b]">Discount is deactivated. Stored {discountType} {discountValue} will be ignored until reactivated.</p>
          )}
        </div>

        <div className="rounded-2xl border border-[#F3E6D3] p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Palette className="h-4 w-4 text-[#0B9C74]" />
              <span className="text-sm font-bold">Size and Color variants</span>
            </div>
            <label className="flex items-center gap-2 text-sm font-medium">
              <input type="checkbox" checked={hasVariants} onChange={(e) => setHasVariants(e.target.checked)} className="h-4 w-4 rounded border-[#F3E6D3] text-[#0B9C74]" />
              Has variants
            </label>
          </div>
          {!hasVariants ? (
            <p className="text-xs text-[#6b6b6b]">Turn on for fashion products that need size/color.</p>
          ) : (
            <>
              <div className="space-y-2">
                {variants.map((v, idx) => (
                  <div key={v.id} className="grid grid-cols-12 gap-2 items-end rounded-xl bg-[#FFFBF5] border border-[#F3E6D3] p-3">
                    <label className="col-span-3 sm:col-span-2">
                      <span className="text-[11px] font-bold">Size</span>
                      <input value={v.size || ""} onChange={(e) => updateVariant(idx, { size: e.target.value })} placeholder="M" className="mt-1 w-full rounded-lg border border-[#F3E6D3] px-2 py-2 text-sm outline-none" />
                    </label>
                    <label className="col-span-3 sm:col-span-2">
                      <span className="text-[11px] font-bold">Color</span>
                      <input value={v.color || ""} onChange={(e) => updateVariant(idx, { color: e.target.value })} placeholder="Black" className="mt-1 w-full rounded-lg border border-[#F3E6D3] px-2 py-2 text-sm outline-none" />
                    </label>
                    <label className="col-span-6 sm:col-span-2">
                      <span className="text-[11px] font-bold">SKU</span>
                      <input value={v.sku || ""} onChange={(e) => updateVariant(idx, { sku: e.target.value })} placeholder="HOD-M-BLK" className="mt-1 w-full rounded-lg border border-[#F3E6D3] px-2 py-2 text-sm outline-none" />
                    </label>
                    <label className="col-span-4 sm:col-span-2">
                      <span className="text-[11px] font-bold">Stock</span>
                      <input type="number" value={v.stock} onChange={(e) => updateVariant(idx, { stock: Number(e.target.value) || 0 })} className="mt-1 w-full rounded-lg border border-[#F3E6D3] px-2 py-2 text-sm outline-none" />
                    </label>
                    <label className="col-span-4 sm:col-span-2">
                      <span className="text-[11px] font-bold">Price override</span>
                      <input type="number" value={v.price || ""} onChange={(e) => updateVariant(idx, { price: e.target.value ? Number(e.target.value) : undefined })} placeholder="base" className="mt-1 w-full rounded-lg border border-[#F3E6D3] px-2 py-2 text-sm outline-none" />
                    </label>
                    <button type="button" onClick={() => removeVariant(idx)} className="col-span-4 sm:col-span-2 flex items-center justify-center gap-1 rounded-lg border border-red-200 bg-white px-2 py-2 text-xs font-bold text-red-600 hover:bg-red-50">
                      <Trash2 className="h-3 w-3" /> Remove
                    </button>
                  </div>
                ))}
              </div>
              <button type="button" onClick={addVariant} className="inline-flex items-center gap-2 rounded-full border border-[#0B9C74] text-[#0B9C74] bg-white px-4 py-2 text-xs font-bold hover:bg-[#E6F7F1]">
                <Plus className="h-4 w-4" /> Add variant
              </button>
            </>
          )}
        </div>

        <div>
          <span className="text-xs font-bold">Images</span>
          <div className="mt-2 grid grid-cols-2 sm:grid-cols-4 gap-3">
            {images.map((src, idx) => (
              <div key={idx} className="relative rounded-xl overflow-hidden border border-[#F3E6D3] bg-[#FFFBF5] h-28">
                <img src={src} alt="" className="h-full w-full object-cover" />
                <button type="button" onClick={() => setImages(images.filter((_, i) => i !== idx))} className="absolute top-1 right-1 h-6 w-6 rounded-full bg-white border border-[#F3E6D3] grid place-items-center">
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
            {images.length < 4 && (
              <label className="h-28 rounded-xl border-2 border-dashed border-[#F3E6D3] bg-[#FFFBF5] grid place-items-center cursor-pointer hover:bg-[#FFF1DA] text-sm font-medium text-[#6b6b6b]">
                <span className="flex flex-col items-center gap-1">
                  <Upload className="h-5 w-5" /> Upload
                </span>
                <input type="file" accept="image/*" multiple onChange={handleImage} className="hidden" />
              </label>
            )}
          </div>
        </div>

        <div className="flex gap-3">
          <button type="submit" disabled={loading} className="rounded-full bg-[#1a1a1a] px-6 py-2.5 text-sm font-bold text-white hover:bg-black disabled:opacity-60">
            {loading ? "Saving..." : "Save changes"}
          </button>
          <Link to="/dashboard/products" className="rounded-full border border-[#F3E6D3] bg-white px-6 py-2.5 text-sm font-bold hover:bg-[#FFF1DA]">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  )
}
