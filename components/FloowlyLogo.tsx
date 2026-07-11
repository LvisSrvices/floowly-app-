// Shared Floowly Money logo component — icon from brand SVG concept

type Variant = 'light' | 'dark'
type Size = 'sm' | 'md' | 'lg'

const SIZES: Record<Size, { box: number; name: number; sub: number; gap: number }> = {
  sm: { box: 28, name: 13, sub: 8,  gap: 8  },
  md: { box: 36, name: 15, sub: 9,  gap: 10 },
  lg: { box: 46, name: 20, sub: 11, gap: 12 },
}

export function FloowlyIcon({ size = 36 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {/* Background rounded square */}
      <rect width="120" height="120" rx="28" fill="#0f9b8e" />

      {/* Flow wave line */}
      <path
        d="M24 80 C 44 40, 64 40, 76 60 C 84 74, 92 74, 100 58"
        stroke="#eef5f4"
        strokeWidth="7"
        strokeLinecap="round"
        fill="none"
      />

      {/* Coin circle */}
      <circle cx="100" cy="58" r="10" fill="#eef5f4" />

      {/* Dollar sign inside coin */}
      <text
        x="100"
        y="58"
        textAnchor="middle"
        dominantBaseline="central"
        fontSize="13"
        fill="#0f9b8e"
        fontWeight="700"
        fontFamily="system-ui, -apple-system, sans-serif"
      >
        $
      </text>
    </svg>
  )
}

export default function FloowlyLogo({
  variant = 'light',
  size = 'md',
}: {
  variant?: Variant
  size?: Size
}) {
  const s = SIZES[size]
  const nameColor = variant === 'dark' ? '#fff' : '#0F1C2E'
  const moneyColor = variant === 'dark' ? '#5eead4' : '#0f9b8e'

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: s.gap }}>
      <FloowlyIcon size={s.box} />
      <div style={{ lineHeight: 1 }}>
        <div style={{
          fontSize: s.name,
          fontWeight: 900,
          color: nameColor,
          letterSpacing: '-.03em',
          lineHeight: 1,
          fontFamily: "-apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', system-ui, sans-serif",
        }}>
          floowly
        </div>
        <div style={{
          fontSize: s.sub,
          fontWeight: 700,
          color: moneyColor,
          letterSpacing: '.1em',
          textTransform: 'uppercase' as const,
          marginTop: 2,
        }}>
          money
        </div>
      </div>
    </div>
  )
}
