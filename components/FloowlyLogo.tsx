type Variant = 'light' | 'dark'
type Size = 'sm' | 'md' | 'lg'

const SIZES: Record<Size, { box: number; name: number; sub: number; gap: number }> = {
  sm: { box: 28, name: 13, sub: 8,  gap: 8  },
  md: { box: 36, name: 15, sub: 9,  gap: 10 },
  lg: { box: 46, name: 20, sub: 11, gap: 12 },
}

export function FloowlyIcon({ size = 36 }: { size?: number }) {
  return (
    <img
      src="/logo.png"
      alt="Floowly"
      width={size}
      height={size}
      style={{ display: 'block', objectFit: 'contain' }}
    />
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
