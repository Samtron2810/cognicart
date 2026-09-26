import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { Search, Plus, Pencil, Trash2, Power, Package, Tag, Palette } from "lucide-react"
import { productService } from "../../services/productService"
import { PRODUCT_CATEGORIES } from "../../types/product"
import { getDisplayPrice, getTotalStock } from "../../types/product"
import type { Product } from "../../types/product"

export default function Products() {
  const [products, setProducts] = useState<Product[]>([])
  const [search, setSearch] = useState("")
  const [category, setCategory] = useState("")
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    const data = await productService.list({ search: search || undefined, category: category || undefined })
    setProducts(data)
    setLoading(false)
  }

  useEffect(() => {
    productService.seedDemo()
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const t = setTimeout(load, 300)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, category])

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this product? This cannot be undone.")) return
    await productService.remove(id)
    load()
  }

  const handleToggle = async (p: Product) => {
    await productService.toggleActive(p.id, !p.isActive)
    load()
  }

  const handleToggleDiscount = async (p: Product) => {
    if (!p.discount) {
      alert("No discount configured. Edit product to add discount.")
      return
    }
    await productService.toggleDiscount(p.id, { ...p.discount, active: !p.discount.active })
    load()
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight">Products</h1>
          <p className="text-sm text-[#6b6b6b]">Manage catalog, discounts and size/color. Discount when active shows everywhere including WhatsApp AI.</p>
        </div>
        <Link to="/dashboard/products/new" className="inline-flex items-center gap-2 rounded-full bg-[#0B9C74] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#0a8a66]">
          <Plus className="h-4 w-4" /> Add product
        </Link>
      </div>

      <div className="rounded-2xl bg-white border border-[#F3E6D3] p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9a9a9a]" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name or variant (size, color)" className="w-full rounded-xl border border-[#F3E6D3] bg-white pl-9 pr-3 py-2.5 text-sm focus:border-[#0B9C74] focus:ring-2 focus:ring-[#0B9C74]/15 outline-none" />
          </div>
          <select value={category} onChange={(e) => setCategory(e.target.value)} className="rounded-xl border border-[#F3E6D3] bg-white px-3 py-2.5 text-sm focus:border-[#0B9C74] outline-none">
            <option value="">All categories</option>
            {PRODUCT_CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="grid place-items-center py-16">
          <div className="h-8 w-8 rounded-full border-2 border-[#0B9C74] border-t-transparent animate-spin" />
        </div>
      ) : products.length === 0 ? (
        <div className="rounded-2xl bg-white border border-[#F3E6D3] p-10 text-center">
          <div className="mx-auto h-12 w-12 rounded-full bg-[#FFF1DA] grid place-items-center">
            <Package className="h-6 w-6 text-[#E85D26]" />
          </div>
          <div className="mt-3 font-bold">No products found</div>
          <div className="text-sm text-[#6b6b6b]">Try a different search or create a new product.</div>
          <Link to="/dashboard/products/new" className="mt-4 inline-flex rounded-full bg-[#1a1a1a] px-5 py-2.5 text-sm font-bold text-white hover:bg-black">
            Add product
          </Link>
        </div>
      ) : (
        <div className="grid gap-4">
          <div className="hidden lg:grid grid-cols-[64px_1fr_150px_110px_130px_150px] gap-3 px-4 text-xs font-bold tracking-widest text-[#9a9a9a]">
            <span>IMAGE</span>
            <span>PRODUCT</span>
            <span>PRICE</span>
            <span>STOCK</span>
            <span>STATUS</span>
            <span className="text-right">ACTIONS</span>
          </div>

          {products.map((p) => {
            const { original, sale, hasDiscount } = getDisplayPrice(p)
            const totalStock = getTotalStock(p)
            return (
              <div key={p.id} className="rounded-2xl bg-white border border-[#F3E6D3] p-4 lg:py-3 lg:grid lg:grid-cols-[64px_1fr_150px_110px_130px_150px] lg:items-center gap-4">
                <img src={p.images[0] || "https://via.placeholder.com/80"} alt={p.name} className="hidden lg:block h-12 w-12 rounded-xl object-cover bg-[#FFFBF5] border border-[#F3E6D3]" />
                <div className="flex gap-3 lg:contents">
                  <img src={p.images[0] || "https://via.placeholder.com/80"} alt={p.name} className="lg:hidden h-14 w-14 rounded-xl object-cover bg-[#FFFBF5] border border-[#F3E6D3]" />
                  <div className="min-w-0">
                    <div className="text-sm font-bold leading-tight truncate flex items-center gap-1.5 flex-wrap">
                      <span className="truncate">{p.name}</span>
                      {hasDiscount && <span className="inline-flex items-center gap-1 rounded-full bg-[#E85D26] px-2 py-0.5 text-[11px] font-bold text-white"><Tag className="h-3 w-3" /> Sale</span>}
                      {p.variants && p.variants.length > 0 && <span className="inline-flex items-center gap-1 rounded-full bg-[#FFFBF5] border border-[#F3E6D3] px-2 py-0.5 text-[11px] font-bold"><Palette className="h-3 w-3" /> {p.variants.length} variants</span>}
                    </div>
                    <div className="text-xs text-[#6b6b6b] truncate">{p.category} • {p.description.slice(0, 60)}</div>
                    {p.variants && p.variants.length > 0 && (
                      <div className="mt-1 text-[11px] text-[#6b6b6b] truncate">
                        {p.variants.slice(0, 3).map((v) => [v.size, v.color].filter(Boolean).join("/")).join(" • ")}{p.variants.length > 3 ? ` +${p.variants.length - 3}` : ""}
                      </div>
                    )}
                    <div className="lg:hidden mt-2 flex items-center gap-2 text-xs flex-wrap">
                      {hasDiscount ? (
                        <span className="flex items-center gap-1"><span className="line-through text-[#9a9a9a]">₦{original.toLocaleString()}</span><span className="font-bold text-[#E85D26]">₦{sale!.toLocaleString()}</span></span>
                      ) : (
                        <span className="font-bold">₦{original.toLocaleString()}</span>
                      )}
                      <span className={`rounded-full px-2 py-0.5 font-bold ${totalStock === 0 ? "bg-red-50 text-red-700 border border-red-200" : totalStock <= 5 ? "bg-[#FFF1DA] text-[#E85D26] border border-[#F3E6D3]" : "bg-[#E6F7F1] text-[#0B9C74] border border-[#0B9C74]/20"}`}>
                        Stock {totalStock}
                      </span>
                      <span className={`rounded-full px-2 py-0.5 font-bold ${p.isActive ? "bg-[#1a1a1a] text-white" : "bg-white border border-[#F3E6D3]"}`}>{p.isActive ? "Active" : "Inactive"}</span>
                    </div>
                  </div>
                </div>

                <div className="hidden lg:block text-sm">
                  {hasDiscount ? (
                    <div>
                      <span className="font-bold text-[#E85D26]">₦{sale!.toLocaleString()}</span> <span className="text-xs line-through text-[#9a9a9a]">₦{original.toLocaleString()}</span>
                      <div className="text-[11px] text-[#E85D26] font-bold">{p.discount?.type === "percentage" ? `${p.discount.value}% OFF` : `₦${p.discount?.value.toLocaleString()} OFF`}</div>
                    </div>
                  ) : (
                    <span className="font-bold">₦{original.toLocaleString()}</span>
                  )}
                </div>
                <div className="hidden lg:block">
                  <span className={`rounded-full px-2.5 py-1 text-xs font-bold border ${totalStock === 0 ? "bg-red-50 text-red-700 border-red-200" : totalStock <= 5 ? "bg-[#FFF1DA] text-[#E85D26] border-[#F3E6D3]" : "bg-[#E6F7F1] text-[#0B9C74] border-[#0B9C74]/20"}`}>
                    {totalStock === 0 ? "Out of stock" : `Stock ${totalStock}`}
                  </span>
                </div>
                <div className="hidden lg:block">
                  <span className={`rounded-full px-3 py-1 text-xs font-bold ${p.isActive ? "bg-[#1a1a1a] text-white" : "bg-white border border-[#F3E6D3] text-[#6b6b6b]"}`}>{p.isActive ? "Active" : "Inactive"}</span>
                  {hasDiscount && <div className="mt-1 text-[11px] font-bold text-[#E85D26]">{p.discount?.active ? "Discount ON" : "Discount OFF"}</div>}
                </div>

                <div className="mt-3 lg:mt-0 flex items-center justify-end gap-1.5">
                  {p.discount && (
                    <button onClick={() => handleToggleDiscount(p)} title={p.discount.active ? "Deactivate discount" : "Activate discount"} className={`h-8 w-8 grid place-items-center rounded-full border ${p.discount.active ? "bg-[#E85D26] text-white border-[#E85D26]" : "bg-white border-[#F3E6D3] text-[#9a9a9a] hover:bg-[#FFF1DA]"}`}>
                      <Tag className="h-4 w-4" />
                    </button>
                  )}
                  <button onClick={() => handleToggle(p)} title={p.isActive ? "Deactivate" : "Activate"} className="h-8 w-8 grid place-items-center rounded-full border border-[#F3E6D3] bg-white hover:bg-[#FFF1DA]">
                    <Power className={`h-4 w-4 ${p.isActive ? "text-[#0B9C74]" : "text-[#9a9a9a]"}`} />
                  </button>
                  <Link to={`/dashboard/products/${p.id}/edit`} className="h-8 w-8 grid place-items-center rounded-full bg-white border border-[#F3E6D3] hover:bg-[#FFF1DA]">
                    <Pencil className="h-4 w-4" />
                  </Link>
                  <button onClick={() => handleDelete(p.id)} className="h-8 w-8 grid place-items-center rounded-full bg-white border border-red-200 text-red-600 hover:bg-red-50">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
