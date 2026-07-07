import { useState } from 'react'

/**
 * Interactive 1–5 star picker. Uncontrolled-ish: shows `value` until the
 * user hovers, then previews the hovered star count; calls onRate(n) on click.
 */
export default function RatingInput({ value = 0, onRate, disabled }) {
  const [hover, setHover] = useState(0)
  const display = hover || value

  return (
    <div className={`rating-input${disabled ? ' disabled' : ''}`} onMouseLeave={() => setHover(0)}>
      {[1, 2, 3, 4, 5].map(n => (
        <button
          key={n}
          type="button"
          className="rating-input-star"
          disabled={disabled}
          aria-label={`Rate ${n} star${n > 1 ? 's' : ''}`}
          onMouseEnter={() => setHover(n)}
          onClick={() => onRate?.(n)}
        >
          <svg width="22" height="22" viewBox="0 0 24 24">
            <path
              d="M12 2.8l2.7 6.4 6.9.6-5.2 4.6 1.6 6.8L12 17.6l-6 3.6 1.6-6.8-5.2-4.6 6.9-.6L12 2.8z"
              fill={n <= display ? 'currentColor' : 'none'}
              stroke="currentColor"
              strokeWidth="1.4"
              strokeLinejoin="round"
              className={n <= display ? 'rating-star-on' : 'rating-star-off'}
            />
          </svg>
        </button>
      ))}
    </div>
  )
}
