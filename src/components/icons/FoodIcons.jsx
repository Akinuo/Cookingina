/**
 * Premium line-art icon set for CookingINA.
 * Replaces emoji throughout the app with consistent, brand-colored SVGs.
 * All icons share a 24x24 viewBox, 1.6 stroke weight, round joins — matching lucide-react's style
 * so they sit naturally next to the rest of the icon system.
 */

const base = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.6,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
}

function Svg({ size = 20, className, style, children }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} style={style} {...base}>
      {children}
    </svg>
  )
}

/* ── Dish category icons ─────────────────────────────────────── */

export function IconMainDish(props) {
  return (
    <Svg {...props}>
      <ellipse cx="12" cy="15.5" rx="8.5" ry="3.2" />
      <path d="M4.2 15.5c0-4.5 2.3-9 5-9.8" />
      <path d="M19.8 15.5c0-3.4-1.3-6.7-3.1-8.5" />
      <path d="M9 6.4c0-1.7 1.3-3.1 3-3.1s3 1.4 3 3.1" />
    </Svg>
  )
}

export function IconSoup(props) {
  return (
    <Svg {...props}>
      <path d="M4 11h16l-.9 6.3a3 3 0 0 1-3 2.7H7.9a3 3 0 0 1-3-2.7L4 11Z" />
      <path d="M8.5 11c-.6-1.3-.4-2.6.6-3.6" />
      <path d="M12 11c-.6-1.6-.3-3 1-4.2" />
      <path d="M15.5 11c-.5-1-.4-1.9.2-2.8" />
      <path d="M2.5 13.2h1.8" />
      <path d="M19.7 13.2h1.8" />
    </Svg>
  )
}

export function IconNoodles(props) {
  return (
    <Svg {...props}>
      <path d="M4.5 10.5h15L18.4 18a2.5 2.5 0 0 1-2.47 2.1H8.07A2.5 2.5 0 0 1 5.6 18L4.5 10.5Z" />
      <path d="M7 10.2c0-2.6.3-4.7 1.6-6.4" />
      <path d="M12 10.2c0-2.9.2-5.1 1.3-6.9" />
      <path d="M16.4 10.2c.2-2 .6-3.6 1.5-5" />
      <path d="M8.6 14.2c1 .7 2 .7 3 0 1 .7 2 .7 3 0" />
    </Svg>
  )
}

export function IconRice(props) {
  return (
    <Svg {...props}>
      <path d="M5 10.5A7 6 0 0 1 12 5a7 6 0 0 1 7 5.5" />
      <path d="M3.6 10.5h16.8l-.5 3.4A3 3 0 0 1 16.9 16H7.1a3 3 0 0 1-3-2.1l-.5-3.4Z" />
      <path d="M8.5 19.5h7" />
      <path d="M7.5 16l-.6 1.7c-.3.9.4 1.8 1.4 1.8h7.4c1 0 1.7-.9 1.4-1.8L16.5 16" />
      <circle cx="9.6" cy="9" r=".4" fill="currentColor" stroke="none" />
      <circle cx="12.4" cy="8.2" r=".4" fill="currentColor" stroke="none" />
      <circle cx="14.6" cy="9.2" r=".4" fill="currentColor" stroke="none" />
    </Svg>
  )
}

export function IconSnack(props) {
  return (
    <Svg {...props}>
      <path d="M6.5 6.5 12 3l5.5 3.5-2 12h-7l-2-12Z" />
      <path d="M8 9.2h8" />
      <path d="M8.6 12.4h6.8" />
      <path d="M9.3 15.6h5.4" />
    </Svg>
  )
}

export function IconDessert(props) {
  return (
    <Svg {...props}>
      <path d="M5 10.5c0-3.6 3.1-6.5 7-6.5s7 2.9 7 6.5" />
      <path d="M4 10.5h16v6a3.3 3.3 0 0 1-3.3 3.3H7.3A3.3 3.3 0 0 1 4 16.5v-6Z" />
      <path d="M9 4.6c-.4-.8-.3-1.5.3-2.1" />
      <path d="M14.6 4.2c.5-.7.6-1.4.3-2.1" />
    </Svg>
  )
}

export function IconBreakfast(props) {
  return (
    <Svg {...props}>
      <circle cx="10.5" cy="12" r="7" />
      <path d="M17 8.3A7 7 0 0 1 17.6 17" />
      <path d="M8 10.1c1.6 1.6 3.4 1.6 5 0" />
      <path d="M7.4 13.6c1.9 1.9 4.1 1.9 6 0" />
    </Svg>
  )
}

export function IconAllDishes(props) {
  return (
    <Svg {...props}>
      <path d="M5 3v6a2.5 2.5 0 0 0 5 0V3" />
      <path d="M7.5 9v12" />
      <path d="M16.5 3c-1.7 0-3 2-3 5s1.3 5 3 5" />
      <path d="M16.5 3v18" />
    </Svg>
  )
}

/* ── Grocery / price category icons ──────────────────────────── */

export function IconVegetables(props) {
  return (
    <Svg {...props}>
      <path d="M12 8c-3.3 0-6 2.9-6 6.5S8.2 21 12 21s6-2.9 6-6.5S15.3 8 12 8Z" />
      <path d="M12 8c0-2.2.9-3.9 2.6-5" />
      <path d="M12 8c0-1.7-.6-3-1.8-4" />
      <path d="M9 15.2c.9-1 1.9-1 3 0 .9-1 1.9-1 3 0" />
    </Svg>
  )
}

export function IconMeat(props) {
  return (
    <Svg {...props}>
      <path d="M8.5 15.5 16 8a3.8 3.8 0 1 0-5.4-5.4L3 10c-1.3 1.3-1.3 3.5.3 5.1 1.6 1.6 3.8 1.6 5.2.4Z" />
      <path d="M4 20 8.5 15.5" />
      <path d="M13.6 6 16 8.4" />
    </Svg>
  )
}

export function IconSeafood(props) {
  return (
    <Svg {...props}>
      <path d="M3 12c2.5-3.3 6-5 9.5-5S19 8.7 21 12c-2 3.3-5 5-8.5 5S5 15.3 3 12Z" />
      <path d="M17.5 9.2 21 6" />
      <path d="M17.5 14.8 21 18" />
      <circle cx="9.5" cy="11" r=".5" fill="currentColor" stroke="none" />
    </Svg>
  )
}

export function IconCanned(props) {
  return (
    <Svg {...props}>
      <rect x="6" y="6.5" width="12" height="14" rx="1.5" />
      <path d="M6 10.5h12" />
      <path d="M8 6.5V5a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v1.5" />
      <path d="M9.5 14h5" />
      <path d="M9.5 16.8h3.2" />
    </Svg>
  )
}

export function IconGrains(props) {
  return (
    <Svg {...props}>
      <path d="M12 2.5c1.6 2 1.6 4.3 0 6.6-1.6-2.3-1.6-4.6 0-6.6Z" />
      <path d="M12 9.1v12.4" />
      <path d="M12 12c2.2-.6 3.9.1 5 2-2.2.7-3.9 0-5-2Z" />
      <path d="M12 15.4c-2.2-.6-3.9.1-5 2 2.2.7 3.9 0 5-2Z" />
    </Svg>
  )
}

export function IconCondiments(props) {
  return (
    <Svg {...props}>
      <path d="M9.5 3h5v3.4l1.6 2.4c.6.9.9 2 .9 3.1V19a2 2 0 0 1-2 2h-6a2 2 0 0 1-2-2v-7.1c0-1.1.3-2.2.9-3.1l1.6-2.4V3Z" />
      <path d="M9 13.5h6" />
      <path d="M9.5 6.4h5" />
    </Svg>
  )
}

export function IconDairy(props) {
  return (
    <Svg {...props}>
      <path d="M10 2.5h4v3.8l2 2.7c.4.6.6 1.3.6 2V19a2.5 2.5 0 0 1-2.5 2.5h-4.2A2.5 2.5 0 0 1 7.4 19v-8c0-.7.2-1.4.6-2l2-2.7V2.5Z" />
      <path d="M7.6 13.5h8.8" />
    </Svg>
  )
}

export function IconSpices(props) {
  return (
    <Svg {...props}>
      <path d="M12 3c2.8 3.6 4.2 6.9 4.2 10a4.2 4.2 0 1 1-8.4 0C7.8 9.9 9.2 6.6 12 3Z" />
      <path d="M12 13.4v3.6" />
    </Svg>
  )
}

/* ── Misc UI-replacement icons (formerly emoji) ──────────────── */

export function IconChefHat(props) {
  return (
    <Svg {...props}>
      <path d="M7.5 10.2a4.2 4.2 0 0 1 1.2-6.6 4.4 4.4 0 0 1 6.6 0 4.2 4.2 0 0 1 1.2 6.6" />
      <path d="M6.5 10c-2 0-3.5 1.6-3.5 3.5S5 17 7 17h10c2 0 3.5-1.6 3.5-3.5S19 10 17 10c-.4-2.6-2.4-4.6-5-4.6S7 7.4 6.5 10Z" />
      <path d="M8 17v3.5h8V17" />
    </Svg>
  )
}

export function IconBowlEmpty(props) {
  return (
    <Svg {...props}>
      <path d="M4 12h16l-1.2 6.4a3 3 0 0 1-3 2.6H8.2a3 3 0 0 1-3-2.6L4 12Z" />
      <path d="M8 12a4 5.5 0 0 1 8 0" />
    </Svg>
  )
}

export function IconOpenBook(props) {
  return (
    <Svg {...props}>
      <path d="M12 6.4C10.6 5 8.6 4.3 6 4.3c-.8 0-1.5.6-1.5 1.4v11c0 .8.7 1.4 1.5 1.4 2.6 0 4.6.7 6 2.1" />
      <path d="M12 6.4C13.4 5 15.4 4.3 18 4.3c.8 0 1.5.6 1.5 1.4v11c0 .8-.7 1.4-1.5 1.4-2.6 0-4.6.7-6 2.1" />
      <path d="M12 6.4v14.2" />
    </Svg>
  )
}

export function IconHeartEmpty(props) {
  return (
    <Svg {...props}>
      <path d="M12 20.2S3.5 15.3 3.5 9.3A4.8 4.8 0 0 1 12 6.2a4.8 4.8 0 0 1 8.5 3.1c0 6-8.5 10.9-8.5 10.9Z" />
    </Svg>
  )
}

export function IconCalendarPlan(props) {
  return (
    <Svg {...props}>
      <rect x="4" y="5.5" width="16" height="15" rx="2" />
      <path d="M4 10h16" />
      <path d="M8.5 3.5v3.4" />
      <path d="M15.5 3.5v3.4" />
      <path d="M8.5 13.5h1.6" />
      <path d="M12.2 13.5h1.6" />
      <path d="M15.9 13.5h1.6" />
      <path d="M8.5 16.9h1.6" />
      <path d="M12.2 16.9h1.6" />
    </Svg>
  )
}

export function IconStorefront(props) {
  return (
    <Svg {...props}>
      <path d="M4 4.5h16l1.3 5.3a2 2 0 0 1-2 2.5 2.2 2.2 0 0 1-2.2-1.8 2.2 2.2 0 0 1-4.3 0 2.2 2.2 0 0 1-4.3 0 2.2 2.2 0 0 1-4.4 0 2 2 0 0 1-2-2.5L4 4.5Z" />
      <path d="M5.5 12.2V19a1 1 0 0 0 1 1H10v-4.5a1.6 1.6 0 0 1 1.6-1.6h.8A1.6 1.6 0 0 1 14 15.5V20h3.5a1 1 0 0 0 1-1v-6.8" />
    </Svg>
  )
}

export function IconTrash(props) {
  return (
    <Svg {...props}>
      <path d="M5 7h14" />
      <path d="M9.5 7V5a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1v2" />
      <path d="M7 7l1 12.5a1.5 1.5 0 0 0 1.5 1.5h5A1.5 1.5 0 0 0 16 19.5L17 7" />
      <path d="M10.3 11v6" />
      <path d="M13.7 11v6" />
    </Svg>
  )
}

export function IconLightbulb(props) {
  return (
    <Svg {...props}>
      <path d="M9 18.5h6" />
      <path d="M10 21.5h4" />
      <path d="M8 14.5A5.5 5.5 0 1 1 16 14.5c0 1.6-.7 2.5-1.5 3.3-.5.5-.7 1-.7 1.7H10.2c0-.7-.2-1.2-.7-1.7-.8-.8-1.5-1.7-1.5-3.3Z" />
    </Svg>
  )
}

export function IconWarningTriangle(props) {
  return (
    <Svg {...props}>
      <path d="M10.3 4.3 2.9 17.5A1.6 1.6 0 0 0 4.3 20h15.4a1.6 1.6 0 0 0 1.4-2.5L13.7 4.3a1.6 1.6 0 0 0-2.8 0Z" />
      <path d="M12 10v3.6" />
      <circle cx="12" cy="16.6" r=".5" fill="currentColor" stroke="none" />
    </Svg>
  )
}

export function IconShoppingCart(props) {
  return (
    <Svg {...props}>
      <path d="M3.5 4.5h2l2 12h11" />
      <path d="M7.5 16.5h10.2l1.8-8.3H6.4" />
      <circle cx="9.5" cy="20" r="1.2" />
      <circle cx="17" cy="20" r="1.2" />
    </Svg>
  )
}
