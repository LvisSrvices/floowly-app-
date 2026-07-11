'use client'

import Sidebar from '@/components/Sidebar'

type Subscription = {
  id: string
  name: string
  amount: number | null
  currency: string
  frequency: string
  category: string
  status: string
}

const CAT_COLOR: Record<string, string> = {
  streaming: '#E11D48', software: '#7C3AED', telecom: '#0891B2',
  insurance: '#059669', gym: '#EA580C', news: '#92400E', other: '#6B7280',
}
const CAT_LABEL: Record<string, string> = {
  streaming: 'Streaming', software: 'Software', telecom: 'Telecom',
  insurance: 'Seguros', gym: 'Gimnasio', news: 'Prensa', other: 'Otro',
}

function toMonthly(amount: number, frequency: string): number {
  if (frequency === 'annual') return amount / 12
  if (frequency === 'weekly') return amount * 4.33
  return amount
}

function DonutChart({ data }: { data: { label: string; value: number; color: string }[] }) {
  const total = data.reduce((s, d) => s + d.value, 0)
  if (total === 0) return null

  const r = 70
  const cx = 90
  const cy = 90
  const circumference = 2 * Math.PI * r
  let offset = 0

  const slices = data.map(d => {
    const pct = d.value / total
    const dash = pct * circumference
    const slice = { ...d, dash, offset, pct }
    offset += dash
    return slice
  })

  return (
    <svg width="180" height="180" viewBox="0 0 180 180">
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--border)" strokeWidth="22" />
      {slices.map((s, i) => (
        <circle
          key={i}
          cx={cx} cy={cy} r={r}
          fill="none"
          stroke={s.color}
          strokeWidth="22"
          strokeDasharray={`${s.dash} ${circumference - s.dash}`}
          strokeDashoffset={-s.offset + circumference / 4}
          style={{ transition: 'stroke-dasharray .4s ease' }}
        />
      ))}
      <text x={cx} y={cy - 6} textAnchor="middle" fontSize="13" fontWeight="800" fill="var(--txt)" style={{ fontVariantNumeric: 'tabular-nums' }}>
        {total.toFixed(0)}€
      </text>
      <text x={cx} y={cy + 10} textAnchor="middle" fontSize="10" fill="var(--txt3)">al mes</text>
    </svg>
  )
}

export default function GastosClient({
  user, subscriptions,
}: {
  user: { id: string; email: string }
  subscriptions: Subscription[]
}) {
  // Group by category
  const byCategory: Record<string, { total: number; count: number; subs: Subscription[] }> = {}
  for (const sub of subscriptions) {
    if (!sub.amount) continue
    const monthly = toMonthly(sub.amount, sub.frequency)
    if (!byCategory[sub.category]) byCategory[sub.category] = { total: 0, count: 0, subs: [] }
    byCategory[sub.category].total += monthly
    byCategory[sub.category].count++
    byCategory[sub.category].subs.push(sub)
  }

  const totalMonthly = Object.values(byCategory).reduce((s, c) => s + c.total, 0)

  const chartData = Object.entries(byCategory)
    .map(([cat, data]) => ({ label: CAT_LABEL[cat] || cat, value: data.total, color: CAT_COLOR[cat] || CAT_COLOR.other }))
    .sort((a, b) => b.value - a.value)

  const top5 = [...subscriptions]
    .filter(s => s.amount)
    .sort((a, b) => toMonthly(b.amount!, b.frequency) - toMonthly(a.amount!, a.frequency))
    .slice(0, 5)

  return (
    <div className="app-shell">
      <Sidebar email={user.email} />

      <div className="app-main">
        <header className="page-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div className="page-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--txt)', letterSpacing: '-.02em' }}>Gastos</div>
              <div style={{ fontSize: 12, color: 'var(--txt3)' }}>Desglose de tus suscripciones activas</div>
            </div>
          </div>
        </header>

        <div className="page-content">

          {subscriptions.length === 0 ? (
            <div className="card" style={{ padding: '48px 24px', textAlign: 'center' }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--txt)', marginBottom: 6 }}>Sin datos de gastos</div>
              <div style={{ fontSize: 13, color: 'var(--txt3)' }}>Conecta tu banco o sube un extracto para ver el desglose de gastos.</div>
            </div>
          ) : (
            <>
              {/* Summary cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 28 }}>
                {[
                  { label: 'Total mensual', value: `${totalMonthly.toFixed(2)}€`, note: '/mes' },
                  { label: 'Total anual', value: `${(totalMonthly * 12).toFixed(0)}€`, note: '/año' },
                  { label: 'Suscripciones', value: subscriptions.length, note: 'activas' },
                ].map(s => (
                  <div key={s.label} className="stat-card">
                    <div className="stat-label">{s.label}</div>
                    <div className="stat-value" style={{ fontSize: 24, color: 'var(--txt)' }}>{s.value}</div>
                    <div className="stat-note">{s.note}</div>
                  </div>
                ))}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 28 }}>

                {/* Donut chart */}
                <div className="card" style={{ padding: 24 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--txt)', marginBottom: 20 }}>Por categoría</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
                    <DonutChart data={chartData} />
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, flex: 1 }}>
                      {chartData.map(d => (
                        <div key={d.label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ width: 10, height: 10, borderRadius: '50%', background: d.color, flexShrink: 0 }} />
                          <span style={{ fontSize: 12, color: 'var(--txt2)', flex: 1 }}>{d.label}</span>
                          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--txt)', fontVariantNumeric: 'tabular-nums' }}>{d.value.toFixed(2)}€</span>
                          <span style={{ fontSize: 11, color: 'var(--txt3)', minWidth: 32, textAlign: 'right' }}>{((d.value / totalMonthly) * 100).toFixed(0)}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Top 5 */}
                <div className="card" style={{ padding: 24 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--txt)', marginBottom: 20 }}>Top 5 más caras</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    {top5.map((sub, i) => {
                      const monthly = toMonthly(sub.amount!, sub.frequency)
                      const pct = (monthly / totalMonthly) * 100
                      return (
                        <div key={sub.id}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                              <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--txt3)', minWidth: 14 }}>{i + 1}</span>
                              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--txt)' }}>{sub.name}</span>
                            </div>
                            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--txt)', fontVariantNumeric: 'tabular-nums' }}>
                              {monthly.toFixed(2)}€<span style={{ fontSize: 10, color: 'var(--txt3)', fontWeight: 400 }}>/mes</span>
                            </span>
                          </div>
                          <div style={{ height: 5, background: 'var(--border2)', borderRadius: 3, overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${pct}%`, background: CAT_COLOR[sub.category] || CAT_COLOR.other, borderRadius: 3, transition: 'width .4s ease' }} />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>

              {/* Category breakdown detail */}
              <div className="card" style={{ padding: 24 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--txt)', marginBottom: 16 }}>Desglose por categoría</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                  {Object.entries(byCategory).sort(([,a],[,b]) => b.total - a.total).map(([cat, data], i, arr) => (
                    <div key={cat}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 0' }}>
                        <div style={{ width: 32, height: 32, borderRadius: 8, background: (CAT_COLOR[cat] || '#6B7280') + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <div style={{ width: 10, height: 10, borderRadius: '50%', background: CAT_COLOR[cat] || '#6B7280' }} />
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--txt)' }}>{CAT_LABEL[cat] || cat}</div>
                          <div style={{ fontSize: 11, color: 'var(--txt3)', marginTop: 1 }}>{data.count} suscripción{data.count !== 1 ? 'es' : ''}</div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--txt)', fontVariantNumeric: 'tabular-nums' }}>{data.total.toFixed(2)}€<span style={{ fontSize: 11, fontWeight: 400, color: 'var(--txt3)' }}>/mes</span></div>
                          <div style={{ fontSize: 11, color: 'var(--txt3)' }}>{((data.total / totalMonthly) * 100).toFixed(0)}% del total</div>
                        </div>
                      </div>
                      {/* Sub-list */}
                      <div style={{ paddingLeft: 44, paddingBottom: 8 }}>
                        {data.subs.map(sub => (
                          <div key={sub.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: 12, color: 'var(--txt2)' }}>
                            <span>{sub.name}</span>
                            <span style={{ fontVariantNumeric: 'tabular-nums', color: 'var(--txt)' }}>{toMonthly(sub.amount!, sub.frequency).toFixed(2)}€/mes</span>
                          </div>
                        ))}
                      </div>
                      {i < arr.length - 1 && <div style={{ height: 1, background: 'var(--border2)' }} />}
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
