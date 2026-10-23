import { useEffect, useState } from "react"
import { Navigate, useParams } from "react-router-dom"
import { productService } from "../services/productService"
import { productPath } from "../types/store"

/**
 * Old seller-store URLs (/store/seller/:id and /s/:id) now redirect to the
 * canonical /store/:identifier. Kept so links already shared, bookmarked, or
 * sitting in a Telegram message keep working.
 */
export function SellerStoreRedirect() {
  const { sellerId } = useParams<{ sellerId: string }>()
  return <Navigate to={`/store/${sellerId}`} replace />
}

/**
 * Short product link (/p/:productId) → the canonical nested product URL.
 *
 * Products live under their store, so the seller has to be resolved before we
 * can build the target. One lookup, then a replace so the shortlink never
 * lands in the back-button history.
 */
export function ProductRedirect() {
  const { productId } = useParams<{ productId: string }>()
  const [target, setTarget] = useState<string | null>(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    if (!productId) return
    let active = true
    productService
      .getById(productId)
      .then((product) => {
        if (active) setTarget(productPath({ sellerId: product.sellerId }, product.id))
      })
      .catch(() => {
        if (active) setFailed(true)
      })
    return () => {
      active = false
    }
  }, [productId])

  if (failed) return <Navigate to="/stores" replace />
  if (!target) {
    return (
      <div className="grid min-h-[50vh] place-items-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#0B9C74] border-t-transparent" />
      </div>
    )
  }
  return <Navigate to={target} replace />
}
