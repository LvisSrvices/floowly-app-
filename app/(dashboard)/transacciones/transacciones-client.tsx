'use client'

import { useState, useMemo } from 'react'
import Sidebar from '@/components/Sidebar'

type Subscription = {
  id: string
  name: string
  amount: number | null
  currency: string
  frequency: string
  category: string
  status: string
  last_charge_date: string | null
}

type Transaction = {
  key: string
  name: string
  amount: number
  category: string
  date: Date
  isPast: boolean
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

function intervalDays(frequency: string) {
  if (frequency === 'annual') return 365
  if (frequency === 'weekly') return 7
  return 30
}

function generateTransactions(subs: Subscription[]): Transaction[] {
  const now = new Date()
  const windowStart = new Date(now)
  windowStart.setMonth(windowStart.getMonth() - 3)
  const windowEnd = new Date(now)
  windowEnd.setMonth(windowEnd.getMonth() + 2)

  const txs: Transaction[] = []

  for (const sub of subs) {
    if (!sub.amount) continue
    const days = intervalDays(sub.frequency)
    const base = sub.last_charge_date ? new Date(sub.last_charge_date) : new Date(now.getFullYear(), now.getMonth(), 1)

    // Walk backwards to window start, then forward
    let cursor = new Date(base)
    while (cursor > windowStart) cursor.setDate(cursor.getDate() - days)
    cursor.setDate(cursor.getDate() + days)

    while (cursor <= windowEnd) {
      txs.push({
        key: `${sub.id}-${cursor.getTime()}`,
        name: sub.name,
        amount: sub.amount,
        category: sub.category,
        date: new Date(cursor),
        isPast: cursor <= now,
        status: sub.status,
      })
      cursor.setDate(cursor.getDate() + days)
    }
  }

  return txs.sort((a, b) => b.date.getTime() - a.date.getTime())
}

function fmtDate(d: Date) {
  return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })
}

function fmtMonth(d: Date) {
  return d.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })
}

export default function TransaccionesClient({
  user, subscriptions,
}: {
  user: { id: string; email: string }
  subscriptions: Subscription[]
}) {
  const [filter, setFilter] = useState<'all' | 'past' | 'upcoming'>('all')
  const [catFilter, setCatFilter] = useState('all')

  const all = useMemo(() => generateTransactions(subscriptions), [subscriptions])

  const filtered = useMemo(() => {
    return all.filter(t => {
      if (filter === 'past' && !t.isPast) return false
      if (filter === 'upcoming' && t.isPast) return false
      if (catFilter !== 'all' && t.category !== catFilter) return false
      return true
    })
  }, [all, filter, catFilter])

  // Group by month
  const grouped = useMemo(() => {
    const groups: Record<string, Transaction[]> = {}
    for (const tx of filtered) {
      const key = `${tx.date.getFullYear()}-${tx.date.getMonth()}`
      if (!groups[key]) groups[key] = []
      groups[key].push(tx)
    }
    return Object.entries(groups).sort(([a], [b]) => b.localeCompare(a))
  }, [filtered])

  const totalPast = all.filter(t => t.isPast).reduce((s, t) => s + t.amount, 0)
  const totalUpcoming = all.filter(t => !t.isPast).reduce((s, t) => s + t.amount, 0)

  const categories = Array.from(new Set(all.map(t => t.category)))

  return (
    <div className="app-shell">
      <Sidebar email={user.email} />

      <div className="app-main">
        <header className="page-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div className="page-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--txt)', letterSpacing: '-.02em' }}>Transacciones</div>
              <div style={{ fontSize: 12, color: 'var(--txt3)' }}>Cobros pasados y próximos de tus suscripciones</div>
            </div>
          </div>
        </header>

        <div className="page-content">

          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 24 }}>
            <div className="stat-card">
              <div className="stat-label">Cobrado (3 meses)</div>
              <div className="stat-value" style={{ fontSize: 20, color: 'var(--danger)' }}>{totalPast.toFixed(2)}€</div>
              <div className="stat-note">{all.filter(t => t.isPast).length} transacciones</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Próximos cobros</div>
              <div className="stat-value" style={{ fontSize: 20, color: 'var(--txt)' }}>{totalUpcoming.toFixed(2)}€</div>
              <div className="stat-note">próximos 2 meses</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Suscripciones activas</div>
              <div className="stat-value" style={{ fontSize: 20, color: 'var(--accent)' }}>
                {subscriptions.filter(s => s.status === 'active').length}
              </div>
              <div className="stat-note">generando cobros</div>
            </div>
          </div>

          {/* Filters */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
            {(['all', 'past', 'upcoming'] as const).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                style={{
                  padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'all .15s',
                  background: filter === f ? 'var(--accent)' : 'var(--card)',
                  color: filter === f ? '#fff' : 'var(--txt2)',
                  border: `1px solid ${filter === f ? 'var(--accent)' : 'var(--border)'}`,
                }}
              >
                {{ all: 'Todos', past: 'Cobrados', upcoming: 'Próximos' }[f]}
              </button>
            ))}
            <div style={{ width: 1, height: 20, background: 'var(--border)', margin: '0 4px' }} />
            <select
              value={catFilter}
              onChange={e => setCatFilter(e.target.value)}
              style={{ padding: '6px 12px', borderRadius: 20, fontSize: 12, border: '1px solid var(--border)', background: 'var(--card)', color: 'var(--txt)', cursor: 'pointer' }}
            >
              <option value="all">Todas las categorías</option>
              {categories.map(c => <option key={c} value={c}>{CAT_LABEL[c] || c}</option>)}
            </select>
          </div>

          {subscriptions.length === 0 ? (
            <div className="card" style={{ padding: '48px 24px', textAlign: 'center' }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--txt)', marginBottom: 6 }}>Sin transacciones</div>
              <div style={{ fontSize: 13, color: 'var(--txt3)' }}>Conecta tu banco o sube un extracto para ver las transacciones.</div>
            </div>
          ) : filtered.length === 0 ? (
            <div className="card" style={{ padding: '32px 24px', textAlign: 'center' }}>
              <div style={{ fontSize: 13, color: 'var(--txt3)' }}>No hay transacciones con este filtro.</div>
            </div>
          ) : (
            grouped.map(([monthKey, txs]) => (
              <div key={monthKey} style={{ marginBottom: 24 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--txt3)', textTransform: 'uppercase', letterSpacing: '.6px' }}>
                    {fmtMonth(txs[0].date)}
                  </div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--txt)', fontVariantNumeric: 'tabular-nums' }}>
                    {txs.reduce((s, t) => s + t.amount, 0).toFixed(2)}€
                  </div>
                </div>

                <div className="card" style={{ overflow: 'hidden' }}>
                  {txs.map((tx, i) => (
                    <div
                      key={tx.key}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 14, padding: '13px 18px',
                        borderBottom: i < txs.length - 1 ? '1px solid var(--border2)' : 'none',
                        opacity: tx.status === 'cancelled' ? .5 : 1,
                      }}
                    >
                      {/* Color dot */}
                      <div style={{ width: 36, height: 36, borderRadius: 10, background: (CAT_COLOR[tx.category] || '#6B7280') + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <div style={{ width: 10, height: 10, borderRadius: '50%', background: CAT_COLOR[tx.category] || '#6B7280' }} />
                      </div>

                      {/* Name + date */}
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--txt)' }}>{tx.name}</div>
                        <div style={{ fontSize: 11, color: 'var(--txt3)', marginTop: 1 }}>
                          {fmtDate(tx.date)} · {CAT_LABEL[tx.category] || tx.category}
                        </div>
                      </div>

                      {/* Status badge */}
                      {!tx.isPast && (
                        <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 20, background: '#FEF9C3', color: '#92400E', flexShrink: 0 }}>
                          PRÓXIMO
                        </span>
                      )}

                      {/* Amount */}
                      <div style={{ fontSize: 14, fontWeight: 700, color: tx.isPast ? 'var(--danger)' : 'var(--txt)', fontVariantNumeric: 'tabular-nums', minWidth: 70, textAlign: 'right' }}>
                        −{tx.amount.toFixed(2)}€
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
