import { useEffect, useRef, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Package, Search, Store as StoreIcon } from "lucide-react"
import { storeService } from "../../services/storeService"
import { productPath, storePath } from "../../types/store"
import type { SearchResults } from "../../types/store"

const EMPTY: SearchResults = { query: "", sellers: [], products: [] }

/**
 * Header search with a type-ahead dropdown.
 *
 * Sellers and products share one box because on a seller-first marketplace a
 * buyer typing "lumo" wants a store and one typing "serum" wants a product,
 * and they should not have to pick a tab first. The backend caps results at
 * 3 sellers and 5 products so this stays a dropdown rather than a page.
 *
 * Keyboard: arrows move, Enter opens the highlighted row or runs a full
 * search, Escape closes. The listbox/option roles make that legible to a
 * screen reader instead of it announcing a pile of links.
 */
export function GlobalSearch({ onNavigate }: { onNavigate?: () => void }) {
  const navigate = useNavigate()
  const [term, setTerm] = useState("")
  const [results, setResults] = useState<SearchResults>(EMPTY)
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [highlight, setHighlight] = useState(-1)
  const containerRef = useRef<HTMLDivElement>(null)

  // One flat list so arrow keys can walk sellers and products as a unit.
  const rows = [
    ...results.sellers.map((seller) => ({ kind: "seller" as const, key: `s-${seller.sellerId}`, seller })),
    ...results.products.map((product) => ({ kind: "product" as const, key: `p-${product.id}`, product })),
  ]

  // Debounced: one request per pause in typing, not one per keystroke.
  useEffect(() => {
    const trimmed = term.trim()
    if (trimmed.length < 2) {
      setResults(EMPTY)
      setLoading(false)
      return
    }

    setLoading(true)
    const handle = setTimeout(() => {
      let active = true
      storeService
        .search(trimmed)
        .then((data) => {
          if (!active) return
          setResults(data)
          setHighlight(-1)
        })
        .catch(() => {
          if (active) setResults(EMPTY)
        })
        .finally(() => {
          if (active) setLoading(false)
        })
      return () => {
        active = false
      }
    }, 250)

    return () => clearTimeout(handle)
  }, [term])

  // Close when focus or a click leaves the component.
  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [])

  const go = (to: string) => {
    setOpen(false)
    setTerm("")
    setResults(EMPTY)
    onNavigate?.()
    navigate(to)
  }

  const openRow = (index: number) => {
    const row = rows[index]
    if (!row) return
    if (row.kind === "seller") go(storePath(row.seller))
    else go(productPath({ slug: row.product.storeSlug, sellerId: row.product.sellerId }, row.product.id))
  }

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Escape") {
      setOpen(false)
      return
    }
    if (event.key === "ArrowDown") {
      event.preventDefault()
      setOpen(true)
      setHighlight((current) => (rows.length ? (current + 1) % rows.length : -1))
      return
    }
    if (event.key === "ArrowUp") {
      event.preventDefault()
      setHighlight((current) => (rows.length ? (current <= 0 ? rows.length - 1 : current - 1) : -1))
      return
    }
    if (event.key === "Enter") {
      event.preventDefault()
      if (highlight >= 0) openRow(highlight)
      else if (term.trim()) go(`/search?q=${encodeURIComponent(term.trim())}`)
    }
  }

  const showDropdown = open && term.trim().length >= 2

  return (
    <div ref={containerRef} className="relative w-full">
      <label className="relative block">
        <span className="sr-only">Search stores and products</span>
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9a9a9a]" />
        <input
          value={term}
          onChange={(event) => {
            setTerm(event.target.value)
            setOpen(true)
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder="Search stores and products"
          autoComplete="off"
          role="combobox"
          aria-expanded={showDropdown}
          aria-controls="global-search-results"
          aria-autocomplete="list"
          className="w-full rounded-full border border-[#F3E6D3] bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-[#0B9C74] focus:ring-2 focus:ring-[#0B9C74]/15"
        />
      </label>

      {showDropdown && (
        <div
          id="global-search-results"
          role="listbox"
          aria-label="Search results"
          className="absolute left-0 right-0 top-full z-50 mt-2 max-h-[70vh] overflow-auto rounded-2xl border border-[#F3E6D3] bg-white p-2 shadow-[0_18px_40px_rgba(0,0,0,0.12)]"
        >
          {loading && rows.length === 0 ? (
            <p className="px-3 py-4 text-center text-sm text-[#9a9a9a]">Searching…</p>
          ) : rows.length === 0 ? (
            <p className="px-3 py-4 text-center text-sm text-[#6b6b6b]">
              Nothing matches “{term.trim()}”.
            </p>
          ) : (
            <>
              {results.sellers.length > 0 && (
                <>
                  <p className="px-3 pb-1 pt-2 text-[10px] font-bold tracking-widest text-[#9a9a9a]">STORES</p>
                  {results.sellers.map((seller, index) => (
                    <button
                      key={seller.sellerId}
                      type="button"
                      role="option"
                      aria-selected={highlight === index}
                      onMouseEnter={() => setHighlight(index)}
                      onClick={() => openRow(index)}
                      className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left ${
                        highlight === index ? "bg-[#FFF1DA]" : "hover:bg-[#FFFBF5]"
                      }`}
                    >
                      <span className="grid h-8 w-8 shrink-0 place-items-center overflow-hidden rounded-lg border border-[#F3E6D3] bg-[#FFF1DA]">
                        {seller.logo ? (
                          <img src={seller.logo} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <StoreIcon className="h-3.5 w-3.5 text-[#E85D26]" />
                        )}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-bold">{seller.name}</span>
                        <span className="block text-[11px] text-[#9a9a9a]">
                          {seller.productCount} products
                          {seller.rating !== null ? ` · ${seller.rating.toFixed(1)} ★` : ""}
                        </span>
                      </span>
                    </button>
                  ))}
                </>
              )}

              {results.products.length > 0 && (
                <>
                  <p className="px-3 pb-1 pt-2 text-[10px] font-bold tracking-widest text-[#9a9a9a]">PRODUCTS</p>
                  {results.products.map((product, index) => {
                    const rowIndex = results.sellers.length + index
                    return (
                      <button
                        key={product.id}
                        type="button"
                        role="option"
                        aria-selected={highlight === rowIndex}
                        onMouseEnter={() => setHighlight(rowIndex)}
                        onClick={() => openRow(rowIndex)}
                        className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left ${
                          highlight === rowIndex ? "bg-[#FFF1DA]" : "hover:bg-[#FFFBF5]"
                        }`}
                      >
                        <span className="grid h-8 w-8 shrink-0 place-items-center overflow-hidden rounded-lg border border-[#F3E6D3] bg-[#FFFBF5]">
                          {product.image ? (
                            <img src={product.image} alt="" className="h-full w-full object-contain p-0.5" />
                          ) : (
                            <Package className="h-3.5 w-3.5 text-[#0B9C74]" />
                          )}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-bold">{product.name}</span>
                          <span className="block truncate text-[11px] text-[#9a9a9a]">
                            ₦{product.price.toLocaleString()} · {product.storeName}
                          </span>
                        </span>
                      </button>
                    )
                  })}
                </>
              )}

              <button
                type="button"
                onClick={() => go(`/search?q=${encodeURIComponent(term.trim())}`)}
                className="mt-1 w-full rounded-xl border-t border-[#F3E6D3] px-3 py-2.5 text-center text-xs font-bold text-[#0B9C74] hover:bg-[#FFFBF5]"
              >
                See all results for “{term.trim()}”
              </button>
            </>
          )}
        </div>
      )}
    </div>
  )
}
