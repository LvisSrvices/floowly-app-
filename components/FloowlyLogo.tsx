type Variant = 'light' | 'dark'
type Size = 'sm' | 'md' | 'lg'

const SIZES: Record<Size, { icon: number; wordmarkH: number; gap: number }> = {
  sm: { icon: 28, wordmarkH: 14, gap: 8  },
  md: { icon: 38, wordmarkH: 18, gap: 10 },
  lg: { icon: 52, wordmarkH: 24, gap: 12 },
}

export function FloowlyIcon({ size = 36 }: { size?: number }) {
  return (
    <img
      src="/logo.png"
      alt="Floowly"
      width={size}
      height={size}
      style={{ display: 'block', objectFit: 'contain', flexShrink: 0 }}
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

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: s.gap }}>
      <FloowlyIcon size={s.icon} />
      <img
        src="/wordmark.png"
        alt="Floowly Money"
        style={{
          display: 'block',
          height: s.icon,
          width: 'auto',
          filter: variant === 'dark' ? 'brightness(0) invert(1)' : 'none',
          opacity: variant === 'dark' ? 0.9 : 1,
        }}
      />
    </div>
  )
}
