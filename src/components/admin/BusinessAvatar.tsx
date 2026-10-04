import { useEffect, useState } from "react"

type BusinessAvatarProps = {
  /** Cloudinary URL from `business.logo`; empty for sellers who never set one. */
  logo?: string | null
  /** Used for the initial, and as the image's alt text. */
  name?: string
  /** Tailwind sizing/rounding for the frame. */
  className?: string
}

/**
 * Seller logo with an initial fallback.
 *
 * Admin and platform-owner accounts have no Business document at all, and a
 * logo can also 404 after its Cloudinary asset is deleted out of band - both
 * cases fall back to the same initial rather than rendering a broken image.
 */
export function BusinessAvatar({ logo, name, className = "h-10 w-10 rounded-xl" }: BusinessAvatarProps) {
  const [failed, setFailed] = useState(false)

  // A row can be recycled onto a different seller as the list refetches, so a
  // previous load failure must not stick to the next logo.
  useEffect(() => { setFailed(false) }, [logo])

  const initial = name?.trim()?.charAt(0)?.toUpperCase() || "S"
  const showImage = Boolean(logo) && !failed

  return (
    <div className={`shrink-0 overflow-hidden bg-[#1a1a1a] text-white grid place-items-center font-bold ${className}`}>
      {showImage ? (
        <img
          src={logo as string}
          alt={name ? `${name} logo` : "Business logo"}
          loading="lazy"
          onError={() => setFailed(true)}
          className="h-full w-full object-cover"
        />
      ) : (
        initial
      )}
    </div>
  )
}
