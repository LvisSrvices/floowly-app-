type Variant = 'light' | 'dark'
type Size = 'sm' | 'md' | 'lg'

const SIZES: Record<Size, { icon: number; wordmark: number; gap: number }> = {
  sm: { icon: 28, wordmark: 72,  gap: 8  },
  md: { icon: 38, wordmark: 96,  gap: 10 },
  lg: { icon: 52, wordmark: 128, gap: 12 },
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
        height={s.icon * 0.55}
        style={{
          display: 'block',
          objectFit: 'contain',
          objectPosition: 'left center',
          filter: variant === 'dark' ? 'brightness(0) invert(1)' : 'none',
          opacity: variant === 'dark' ? 0.9 : 1,
        }}
      />
    </div>
  )
}
