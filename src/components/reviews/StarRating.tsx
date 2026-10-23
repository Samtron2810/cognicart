import { Star } from "lucide-react"

type StarRatingProps = {
  value: number
  /** Pixel size of each star. */
  size?: number
  className?: string
}

/**
 * Read-only star display. Rounds to the nearest half so a 4.3 does not claim
 * to be a 4.5, and exposes the number to assistive tech rather than leaving
 * it as decorative icons.
 */
export function StarRating({ value, size = 14, className = "" }: StarRatingProps) {
  const rounded = Math.round(value * 2) / 2

  return (
    <span
      className={`inline-flex items-center gap-0.5 ${className}`}
      role="img"
      aria-label={`${value.toFixed(1)} out of 5 stars`}
    >
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = rounded >= star
        const half = !filled && rounded >= star - 0.5
        return (
          <span key={star} className="relative inline-block" style={{ width: size, height: size }}>
            <Star className="absolute inset-0 text-[#E0D5C4]" style={{ width: size, height: size }} />
            {(filled || half) && (
              <span
                className="absolute inset-0 overflow-hidden"
                style={{ width: half ? size / 2 : size, height: size }}
              >
                <Star
                  className="fill-[#E85D26] text-[#E85D26]"
                  style={{ width: size, height: size }}
                />
              </span>
            )}
          </span>
        )
      })}
    </span>
  )
}

type StarPickerProps = {
  value: number
  onChange: (value: number) => void
  disabled?: boolean
}

/**
 * Interactive 1-5 picker. Real radio inputs underneath, so it is keyboard
 * reachable and announces itself correctly instead of being a row of divs.
 */
export function StarPicker({ value, onChange, disabled = false }: StarPickerProps) {
  return (
    <fieldset className="flex items-center gap-1" disabled={disabled}>
      <legend className="sr-only">Your rating</legend>
      {[1, 2, 3, 4, 5].map((star) => (
        <label
          key={star}
          className={`cursor-pointer rounded p-0.5 focus-within:ring-2 focus-within:ring-[#0B9C74]/40 ${
            disabled ? "cursor-not-allowed opacity-60" : ""
          }`}
          title={`${star} star${star > 1 ? "s" : ""}`}
        >
          <input
            type="radio"
            name="rating"
            value={star}
            checked={value === star}
            disabled={disabled}
            onChange={() => onChange(star)}
            className="sr-only"
          />
          <Star
            className={`h-7 w-7 transition ${
              star <= value ? "fill-[#E85D26] text-[#E85D26]" : "text-[#E0D5C4] hover:text-[#E85D26]"
            }`}
          />
          <span className="sr-only">
            {star} star{star > 1 ? "s" : ""}
          </span>
        </label>
      ))}
    </fieldset>
  )
}
