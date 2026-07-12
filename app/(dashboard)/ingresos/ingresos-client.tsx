'use client'

import { useState, useMemo } from 'react'
import Sidebar from '@/components/Sidebar'

type IncomeItem = {
  id: string; name: string; type: 'income' | 'fixed_expense'
  category: string; amount: number; frequency: string
}
type Sub = { id: string; name: string; amount: number | null; frequency: string; category: string }

const INCOME_CATS   = ['Nómina', 'Autónomo / Freelance', 'Alquiler cobrado', 'Dividendos', 'Pensión', 'Otros ingresos']
const EXPENSE_CATS  = ['Alquiler / Hipoteca', 'Suministros', 'Transporte', 'Educación', 'Alimentación', 'Otros gastos fijos']
const INCOME_COLORS: Record<string, string> = {
  'Nómina': '#059669', 'Autónomo / Freelance': '#0891B2', 'Alquiler cobrado': '#7C3AED',
  'Dividendos': '#EA580C', 'Pensión': '#92400E', 'Otros ingresos': '#6B7280',
}
const EXPENSE_COLORS: Record<string, string> = {
  'Alquiler / Hipoteca': '#9F1239', 'Suministros': '#B91C1C', 'Transporte': '#DC2626',
  'Educación': '#E11D48', 'Alimentación': '#F43F5E', 'Otros gastos fijos': '#7F1D1D',
}

function toMonthly(amount: number, freq: string) {
  if (freq === 'annual') return amount / 12
  if (freq === 'weekly') return amount * 4.33
  return amount
}
function fmt(n: number) {
  return n.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + '€'
}

type AddingState = { type: 'income' | 'fixed_expense'; name: string; category: string; amount: string; frequency: string } | null

export default function IngresosClient({
  user, items: initial, subscriptions,
}: {
  user: { id: string; email: string }
  items: IncomeItem[]
  subscriptions: Sub[]
}) {
  const [items, setItems]   = useState<IncomeItem[]>(initial)
  const [adding, setAdding] = useState<AddingState>(null)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [error, setError]   = useState<string | null>(null)

  const incomes    = items.filter(i => i.type === 'income')
  const fixedItems = items.filter(i => i.type === 'fixed_expense')

  const totalIncome = useMemo(
    () => incomes.reduce((s, i) => s + toMonthly(i.amount, i.frequency), 0),
    [incomes]
  )
  const totalFixed = useMemo(
    () => fixedItems.reduce((s, i) => s + toMonthly(i.amount, i.frequency), 0),
    [fixedItems]
  )
  const totalSubs  = useMemo(
    () => subscriptions.reduce((s, sub) => s + (sub.amount ? toMonthly(sub.amount, sub.frequency) : 0), 0),
    [subscriptions]
  )
  const disposable = totalIncome - totalFixed - totalSubs
  const savingRate = totalIncome > 0 ? ((disposable / totalIncome) * 100) : 0

  async function handleAdd() {
    if (!adding || !adding.name || !adding.category || !adding.amount) return
    setError(null); setSaving(true)
    try {
      const res  = await fetch('/api/ingresos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: adding.name.trim(), type: adding.type,
          category: adding.category, frequency: adding.frequency,
          amount: parseFloat(adding.amount.replace(',', '.')),
        }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error); return }
      setItems(prev => [...prev, data])
      setAdding(null)
    } finally { setSaving(false) }
  }

  async function handleDelete(id: string) {
    setDeleting(id)
    const res = await fetch('/api/ingresos', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    if (res.ok) setItems(prev => prev.filter(i => i.id !== id))
    else setError('Error al eliminar')
    setDeleting(null)
  }

  function startAdding(type: 'income' | 'fixed_expense') {
    const cats = type === 'income' ? INCOME_CATS : EXPENSE_CATS
    setAdding({ type, name: '', category: cats[0], amount: '', frequency: 'monthly' })
  }

  const renderList = (
    list: IncomeItem[],
    type: 'income' | 'fixed_expense',
    cats: string[],
    colors: Record<string, string>
  ) => {
    const isIncome  = type === 'income'
    const accentColor = isIncome ? '#059669' : '#E11D48'
    const grouped   = cats.reduce<Record<string, IncomeItem[]>>((acc, cat) => {
      acc[cat] = list.filter(i => i.category === cat)
      return acc
    }, {})

    return (
      <div>
        {Object.entries(grouped).filter(([, g]) => g.length > 0).map(([cat, g]) => (
          <div key={cat} style={{ marginBottom: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 2px', marginBottom: 6 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: colors[cat] || '#6B7280' }} />
                <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.07em', color: 'var(--txt3)' }}>{cat}</span>
              </div>
              <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--txt)', fontVariantNumeric: 'tabular-nums' }}>
                {fmt(g.reduce((s, i) => s + toMonthly(i.amount, i.frequency), 0))}/mes
              </span>
            </div>
            {g.map(item => (
              <div key={item.id} className="card" style={{ padding: '10px 14px', marginBottom: 5, display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ flex: 1, fontSize: 13, fontWeight: 600, color: 'var(--txt)' }}>{item.name}</div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: accentColor, fontVariantNumeric: 'tabular-nums' }}>
                    {isIncome ? '+' : '−'}{fmt(item.amount)}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--txt3)' }}>
                    /{item.frequency === 'monthly' ? 'mes' : item.frequency === 'annual' ? 'año' : 'sem'}
                    {item.frequency !== 'monthly' && <span style={{ marginLeft: 4, color: 'var(--txt3)' }}>({fmt(toMonthly(item.amount, item.frequency))}/mes)</span>}
                  </div>
                </div>
                <button onClick={() => handleDelete(item.id)} disabled={deleting === item.id}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--txt3)', padding: 4, borderRadius: 4, lineHeight: 0 }}>
                  {deleting === item.id ? '…' : (
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                      <path d="M10 11v6"/><path d="M14 11v6"/>
                    </svg>
                  )}
                </button>
              </div>
            ))}
          </div>
        ))}

        {/* Add form */}
        {adding?.type === type ? (
          <div className="card" style={{ padding: 14, marginTop: 8, border: `1px dashed ${accentColor}` }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
              <input autoFocus value={adding.name} onChange={e => setAdding(a => a ? { ...a, name: e.target.value } : a)}
                placeholder={isIncome ? 'Ej: Nómina empresa' : 'Ej: Alquiler piso'} />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <select value={adding.category} onChange={e => setAdding(a => a ? { ...a, category: e.target.value } : a)}>
                  {cats.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <select value={adding.frequency} onChange={e => setAdding(a => a ? { ...a, frequency: e.target.value } : a)}>
                  <option value="monthly">Mensual</option>
                  <option value="annual">Anual</option>
                  <option value="weekly">Semanal</option>
                </select>
              </div>
              <div style={{ position: 'relative' }}>
                <input type="text" inputMode="decimal" placeholder="Importe" value={adding.amount}
                  onChange={e => setAdding(a => a ? { ...a, amount: e.target.value } : a)}
                  onKeyDown={e => { if (e.key === 'Enter') handleAdd(); if (e.key === 'Escape') setAdding(null) }}
                  style={{ paddingRight: 28 }} />
                <span style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 13, color: 'var(--txt3)', pointerEvents: 'none' }}>€</span>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={handleAdd} disabled={saving || !adding.name || !adding.amount}
                  className="btn btn-primary" style={{ flex: 1, fontSize: 13 }}>
                  {saving ? 'Guardando…' : `Añadir ${isIncome ? 'ingreso' : 'gasto'}`}
                </button>
                <button onClick={() => setAdding(null)} className="btn btn-secondary" style={{ fontSize: 13 }}>Cancelar</button>
              </div>
            </div>
          </div>
        ) : (
          <button onClick={() => startAdding(type)}
            style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px dashed var(--border)', background: 'transparent', color: 'var(--txt3)', cursor: 'pointer', fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 8 }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Añadir {isIncome ? 'ingreso' : 'gasto fijo'}
          </button>
        )}
      </div>
    )
  }

  // Cash flow bar
  const fixedPct = totalIncome > 0 ? Math.min(100, (totalFixed / totalIncome) * 100) : 0
  const subsPct  = totalIncome > 0 ? Math.min(100, (totalSubs  / totalIncome) * 100) : 0
  const freePct  = Math.max(0, 100 - fixedPct - subsPct)

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
              <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--txt)', letterSpacing: '-.02em' }}>Ingresos y gastos fijos</div>
              <div style={{ fontSize: 12, color: 'var(--txt3)' }}>Tu flujo de caja mensual</div>
            </div>
          </div>
        </header>

        <div className="page-content">
          {error && (
            <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 10, padding: '12px 16px', marginBottom: 20, fontSize: 13, color: '#B91C1C', display: 'flex', justifyContent: 'space-between' }}>
              {error}<button onClick={() => setError(null)} style={{ background: 'none', border: 'none', color: '#B91C1C', cursor: 'pointer', fontSize: 18, padding: 0 }}>×</button>
            </div>
          )}

          {/* Hero stats */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 12, marginBottom: 24 }}>
            <div className="card" style={{ padding: '20px 22px', background: 'linear-gradient(135deg, #059669, #047857)', border: 'none' }}>
              <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.1em', color: 'rgba(255,255,255,.7)', marginBottom: 6 }}>Ingresos</div>
              <div style={{ fontSize: 28, fontWeight: 900, color: '#fff', fontVariantNumeric: 'tabular-nums', letterSpacing: '-.03em' }}>
                {fmt(totalIncome)}<span style={{ fontSize: 12, fontWeight: 400, marginLeft: 2 }}>/mes</span>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Gastos fijos</div>
              <div style={{ fontSize: 22, fontWeight: 900, color: '#E11D48', fontVariantNumeric: 'tabular-nums', letterSpacing: '-.03em' }}>{fmt(totalFixed)}</div>
              <div className="stat-note">{fixedItems.length} concepto{fixedItems.length !== 1 ? 's' : ''}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Suscripciones</div>
              <div style={{ fontSize: 22, fontWeight: 900, color: '#7C3AED', fontVariantNumeric: 'tabular-nums', letterSpacing: '-.03em' }}>{fmt(totalSubs)}</div>
              <div className="stat-note">{subscriptions.length} activas</div>
            </div>
            <div className="stat-card" style={{ borderTop: `3px solid ${disposable >= 0 ? 'var(--accent)' : '#E11D48'}` }}>
              <div className="stat-label">Libre disponible</div>
              <div style={{ fontSize: 22, fontWeight: 900, color: disposable >= 0 ? 'var(--accent)' : '#E11D48', fontVariantNumeric: 'tabular-nums', letterSpacing: '-.03em' }}>
                {disposable >= 0 ? '' : '−'}{fmt(Math.abs(disposable))}
              </div>
              <div className="stat-note">{savingRate > 0 ? `${savingRate.toFixed(0)}% de tus ingresos` : '—'}</div>
            </div>
          </div>

          {/* Cash flow bar */}
          {totalIncome > 0 && (
            <div className="card" style={{ padding: '18px 22px', marginBottom: 24 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--txt)', marginBottom: 12 }}>Distribución mensual</div>
              <div style={{ height: 12, borderRadius: 6, overflow: 'hidden', display: 'flex', marginBottom: 12 }}>
                <div style={{ width: `${fixedPct}%`, background: '#E11D48', transition: 'width .5s' }} title="Gastos fijos" />
                <div style={{ width: `${subsPct}%`, background: '#7C3AED', transition: 'width .5s' }} title="Suscripciones" />
                <div style={{ width: `${freePct}%`, background: '#059669', transition: 'width .5s' }} title="Disponible" />
              </div>
              <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                {[
                  { label: 'Gastos fijos', pct: fixedPct, color: '#E11D48', val: totalFixed },
                  { label: 'Suscripciones', pct: subsPct, color: '#7C3AED', val: totalSubs },
                  { label: 'Libre disponible', pct: freePct, color: '#059669', val: disposable },
                ].map(s => (
                  <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: s.color }} />
                    <span style={{ fontSize: 12, color: 'var(--txt2)' }}>{s.label}</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--txt)', fontVariantNumeric: 'tabular-nums' }}>{s.pct.toFixed(0)}%</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Two columns */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, alignItems: 'start' }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#059669', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 7 }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>
                Ingresos recurrentes
              </div>
              {renderList(incomes, 'income', INCOME_CATS, INCOME_COLORS)}
            </div>

            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#E11D48', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 7 }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 18 13.5 8.5 8.5 13.5 1 6"/><polyline points="17 18 23 18 23 12"/></svg>
                Gastos fijos
              </div>

              {/* Subscriptions (auto) */}
              {subscriptions.length > 0 && (
                <div style={{ marginBottom: 14 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 2px', marginBottom: 6 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#7C3AED' }} />
                    <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.07em', color: 'var(--txt3)' }}>Suscripciones detectadas</span>
                    <span style={{ fontSize: 11, color: 'var(--txt3)', marginLeft: 'auto', fontVariantNumeric: 'tabular-nums' }}>{fmt(totalSubs)}/mes</span>
                  </div>
                  {subscriptions.slice(0, 5).map(sub => sub.amount ? (
                    <div key={sub.id} style={{ padding: '9px 14px', marginBottom: 5, background: 'var(--card)', border: '1px solid var(--border2)', borderRadius: 10, display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ flex: 1, fontSize: 13, fontWeight: 500, color: 'var(--txt2)' }}>{sub.name}</div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#7C3AED', fontVariantNumeric: 'tabular-nums' }}>−{fmt(toMonthly(sub.amount, sub.frequency))}/mes</div>
                    </div>
                  ) : null)}
                  {subscriptions.length > 5 && (
                    <div style={{ fontSize: 12, color: 'var(--txt3)', padding: '6px 4px' }}>
                      +{subscriptions.length - 5} más — <a href="/recurrentes" style={{ color: 'var(--accent)', textDecoration: 'none' }}>ver todas</a>
                    </div>
                  )}
                </div>
              )}

              {renderList(fixedItems, 'fixed_expense', EXPENSE_CATS, EXPENSE_COLORS)}
            </div>
          </div>

          {/* Empty state */}
          {items.length === 0 && (
            <div style={{ textAlign: 'center', padding: '32px', color: 'var(--txt3)', fontSize: 13, marginTop: 8 }}>
              Añade tu nómina y gastos fijos (alquiler, hipoteca, suministros…) para calcular cuánto tienes disponible cada mes.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
