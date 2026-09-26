import { ArrowRight, Heart, Star, ShoppingBag, Check } from "lucide-react"
import { Link } from "react-router-dom"

type Product = {
  name: string
  price: string
  old?: string
  rating: string
  img: string
  tag?: string | null
  color?: string
  id: string
}

const products: Product[] = [
  {
    id: "prod-elixir",
    name: "Elixir Glow Serum",
    price: "₦8,500",
    old: "₦10,000",
    rating: "4.9 (212)",
    img: "https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=600&h=600&fit=crop",
    tag: "Bestseller",
    color: "bg-[#E6F7F1] text-[#0B9C74]",
  },
  {
    id: "prod-hoodie",
    name: "Cozy Knit Hoodie",
    price: "₦14,000",
    rating: "4.8 (98)",
    img: "https://images.unsplash.com/photo-1578768079052-aa76e52ff62e?w=600&h=600&fit=crop",
    tag: "New drop",
    color: "bg-[#FFF1DA] text-[#E85D26]",
  },
  {
    id: "prod-juice",
    name: "Citrus Cold Press",
    price: "₦2,200",
    rating: "5.0 (44)",
    img: "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=600&h=600&fit=crop",
    tag: null,
    color: "",
  },
  {
    id: "prod-tote",
    name: "Market Tote Canvas",
    price: "₦6,500",
    rating: "4.9 (301)",
    img: "https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=600&h=600&fit=crop",
    tag: "Handmade",
    color: "bg-[#1a1a1a] text-white",
  },
]

function ProductCard({ product }: { product: Product }) {
  const to = product.id.startsWith("prod-") ? "/store" : `/store/${product.id}`
  return (
    <div className="group relative rounded-[20px] bg-white border border-[#F3E6D3] overflow-hidden hover:shadow-[0_12px_30px_rgba(0,0,0,0.08)] hover:-translate-y-0.5 transition">
      <div className="absolute left-2 top-2 z-10 flex items-center gap-1.5">
        <span className="h-6 w-6 rounded-full bg-white border border-[#F3E6D3] grid place-items-center shadow-sm">
          <Check className="h-3.5 w-3.5 text-[#0B9C74]" />
        </span>
        {product.tag && <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${product.color}`}>{product.tag}</span>}
      </div>
      <Link to={to} aria-label="Wishlist" className="absolute right-2 top-2 z-10 h-8 w-8 rounded-full bg-white border border-[#F3E6D3] grid place-items-center shadow-sm hover:bg-[#FFF1DA] transition">
        <Heart className="h-4 w-4 text-[#1a1a1a]" />
      </Link>
      <Link to={to} className="block">
        <div className="aspect-square bg-[#FFFBF5] p-4 flex items-center justify-center">
          <img src={product.img} alt={product.name} className="h-full w-full object-contain mix-blend-multiply group-hover:scale-[1.02] transition" />
        </div>
      </Link>
      <div className="p-3.5">
        <Link to={to} className="text-[13px] font-bold leading-tight line-clamp-1 hover:text-[#0B9C74]">{product.name}</Link>
        <div className="mt-1 flex items-center gap-1 text-xs">
          <Star className="h-3 w-3 fill-[#E85D26] text-[#E85D26]" />
          <span className="font-medium">{product.rating}</span>
        </div>
        <div className="mt-2 flex items-center justify-between">
          <div>
            <span className="text-sm font-bold">{product.price}</span>
            {product.old && <span className="ml-1 text-xs line-through text-[#9a9a9a]">{product.old}</span>}
          </div>
          <Link to={to} aria-label="Add to cart" className="h-8 w-8 rounded-full bg-[#1a1a1a] text-white grid place-items-center hover:bg-black transition">
            <ShoppingBag className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  )
}

export function Marketplace() {
  return (
    <section id="marketplace" className="bg-[#FFFBF5]">
      <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8 py-10 lg:py-14">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
          <div>
            <h2 className="font-display text-[34px] sm:text-[42px] font-bold tracking-tight leading-none">Marketplace</h2>
            <p className="mt-2 text-sm text-[#6b6b6b]">Fresh drops from sellers you follow. Chat to buy in one message.</p>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/store" className="rounded-full bg-white border border-[#F3E6D3] px-4 py-2 text-sm font-bold hover:bg-[#FFF1DA] transition">All</Link>
            <Link to="/store?category=Beauty" className="rounded-full bg-[#1a1a1a] text-white px-4 py-2 text-sm font-bold">Beauty</Link>
            <Link to="/store?category=Fashion" className="rounded-full bg-white border border-[#F3E6D3] px-4 py-2 text-sm font-bold hover:bg-[#FFF1DA] transition hidden sm:inline-flex">Fashion</Link>
            <Link to="/store?category=Food" className="rounded-full bg-white border border-[#F3E6D3] px-4 py-2 text-sm font-bold hover:bg-[#FFF1DA] transition hidden sm:inline-flex">Home</Link>
            <Link to="/store" className="ml-2 inline-flex items-center gap-1 text-sm font-bold text-[#0B9C74] hover:gap-1.5 transition">
              View all <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          {products.map((p) => (
            <ProductCard key={p.name} product={p} />
          ))}
        </div>
        <div className="mt-6 flex justify-center">
          <Link to="/store" className="inline-flex items-center gap-2 rounded-full bg-white border border-[#F3E6D3] px-6 py-3 text-sm font-bold hover:bg-[#FFF1DA] transition">Browse full store <ArrowRight className="h-4 w-4" /></Link>
        </div>
      </div>
    </section>
  )
}
