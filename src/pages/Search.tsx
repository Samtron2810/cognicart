import { useEffect, useState } from "react"
import { Link, useSearchParams } from "react-router-dom"
import { Search as SearchIcon, ArrowRight } from "lucide-react"
import { productService } from "../services/productService"
import type { Product } from "../types/product"

export default function Search() {
  const [params, setParams] = useSearchParams()
  const q = params.get("q") || ""
  const [input, setInput] = useState(q)
  const [results, setResults] = useState<Product[]>([])

  useEffect(() => { setInput(q) }, [q])

  useEffect(() => {
    productService.seedDemo()
    if (!q) { setResults([]); return }
    productService.listPublic({ search: q }).then((data) => setResults(data.filter((p) => p.isActive))).catch(() => setResults([]))
  }, [q])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const next = new URLSearchParams(params)
    if (input) next.set("q", input)
    else next.delete("q")
    setParams(next)
  }

  return (
    <div className="min-h-screen bg-[#FFFBF5]">
      <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8 py-10">
        <h1 className="font-display text-[34px] font-bold tracking-tight">Search</h1>
        <p className="mt-2 text-sm text-[#5a5a5a]">Search the public storefront. Same results AI uses inside WhatsApp.</p>

        <form onSubmit={handleSubmit} className="mt-6 flex gap-2 rounded-2xl bg-white border border-[#F3E6D3] p-3">
          <div className="relative flex-1">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9a9a9a]" />
            <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Try serum, hoodie, tote" className="w-full rounded-xl border border-[#F3E6D3] pl-9 pr-3 py-2.5 text-sm focus:border-[#0B9C74] outline-none" />
          </div>
          <button type="submit" className="rounded-full bg-[#0B9C74] px-6 py-2.5 text-sm font-bold text-white hover:bg-[#0a8a66]">Search</button>
        </form>

        {q && <div className="mt-4 text-sm"><span className="font-bold">{results.length}</span> results for <span className="font-bold">"{q}"</span></div>}

        {q && results.length === 0 ? (
          <div className="mt-6 rounded-2xl bg-white border border-[#F3E6D3] p-10 text-center">
            <div className="font-bold">No results</div>
            <div className="text-sm text-[#6b6b6b]">Try another term or <Link to="/store" className="font-bold text-[#0B9C74] underline">browse all</Link></div>
          </div>
        ) : (
          <div className="mt-6 grid grid-cols-2 lg:grid-cols-4 gap-4">
            {results.map((p) => (
              <Link key={p.id} to={`/store/${p.id}`} className="rounded-[20px] bg-white border border-[#F3E6D3] overflow-hidden hover:shadow-[0_12px_30px_rgba(0,0,0,0.08)] transition">
                <div className="aspect-square bg-[#FFFBF5] p-4 flex items-center justify-center"><img src={p.images[0]} alt={p.name} className="h-full w-full object-contain mix-blend-multiply" /></div>
                <div className="p-3.5"><div className="text-[13px] font-bold line-clamp-1">{p.name}</div><div className="text-xs text-[#6b6b6b]">{p.category}</div><div className="mt-2 flex items-center justify-between"><span className="text-sm font-bold">₦{p.price.toLocaleString()}</span><span className="inline-flex items-center gap-1 text-xs font-bold text-[#0B9C74]">View <ArrowRight className="h-3 w-3" /></span></div></div>
              </Link>
            ))}
          </div>
        )}

        {!q && (
          <div className="mt-6 flex flex-wrap gap-2 text-sm">
            <span className="text-[#6b6b6b]">Try:</span>
            {["serum", "hoodie", "tote", "beauty"].map((t) => <button key={t} onClick={() => setParams({ q: t })} className="rounded-full bg-white border border-[#F3E6D3] px-3 py-1.5 font-bold hover:bg-[#FFF1DA]">{t}</button>)}
          </div>
        )}
      </div>
    </div>
  )
}
