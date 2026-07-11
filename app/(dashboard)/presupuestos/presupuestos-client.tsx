'use client'

import { useState } from 'react'
import Sidebar from '@/components/Sidebar'

type Subscription = { id: string; name: string; amount: number | null; frequency: string; category: string }
type Budget = { id: string; category: string; amount: number }

const CAT_COLOR: Record<string, string> = {
  streaming: '#E11D48', software: '#7C3AED', telecom: '#0891B2',
  insurance: '#059669', gym: '#EA580C', news: '#92400E', other: '#6B7280',
}
const CAT_LABEL: Record<string, string> = {
  streaming: 'Streaming', software: 'Software', telecom: 'Telecom',
  insurance: 'Seguros', gym: 'Gimnasio', news: 'Prensa', other: 'Otro',
}
const ALL_CATS = Object.keys(CAT_LABEL)

function toMonthly(amount: number, frequency: string) {
  if (frequency === 'annual') return amount / 12
  if (frequency === 'weekly') return amount * 4.33
  return amount
}

function ProgressBar({ spent, budget, color }: { spent: number; budget: number; color: string }) {
  const pct = budget > 0 ? Math.min((spent / budget) * 100, 100) : 0
  const over = budget > 0 && spent > budget
  return (
    <div style={{ height: 8, background: 'var(--border2)', borderRadius: 4, overflow: 'hidden' }}>
      <div style={{
        height: '100%',
        width: `${pct}%`,
        background: over ? 'var(--danger)' : pct > 80 ? 'var(--warn)' : color,
        borderRadius: 4,
        transition: 'width .4s ease',
      }} />
    </div>
  )
}

export default function PresupuestosClient({
  user, subscriptions, budgets: initialBudgets,
}: {
  user: { id: string; email: string }
  subscriptions: Subscription[]
  budgets: Budget[]
}) {
  const [budgets, setBudgets] = useState<Record<string, number>>(
    Object.fromEntries(initialBudgets.map(b => [b.category, b.amount]))
  )
  const [editing, setEditing] = useState<string | null>(null)
  const [editVal, setEditVal] = useState('')
  const [saving, setSaving] = useState(false)

  // Spending per category from subscriptions
  const spending: Record<string, number> = {}
  for (const sub of subscriptions) {
    if (!sub.amount) continue
    const cat = sub.category
    spending[cat] = (spending[cat] || 0) + toMonthly(sub.amount, sub.frequency)
  }

  // All categories that either have spending or a budget
  const activeCats = Array.from(new Set([...Object.keys(spending), ...Object.keys(budgets), ...ALL_CATS]))

  const totalSpent = Object.values(spending).reduce((s, v) => s + v, 0)
  const totalBudget = Object.values(budgets).reduce((s, v) => s + v, 0)
  const overBudgetCats = activeCats.filter(c => budgets[c] && (spending[c] || 0) > budgets[c])

  async function saveBudget(cat: string, amount: number) {
    setSaving(true)
    try {
      const res = await fetch('/api/budgets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category: cat, amount }),
      })
      if (res.ok) setBudgets(prev => ({ ...prev, [cat]: amount }))
    } finally {
      setSaving(false)
      setEditing(null)
    }
  }

  return (
    <div className="app-shell">
      <Sidebar email={user.email} />

      <div className="app-main">
        <header className="page-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div className="page-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--txt)', letterSpacing: '-.02em' }}>Presupuestos</div>
              <div style={{ fontSize: 12, color: 'var(--txt3)' }}>Establece límites por categoría y controla tus gastos</div>
            </div>
          </div>
        </header>

        <div className="page-content">

          {/* Summary */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 28 }}>
            <div className="stat-card">
              <div className="stat-label">Gasto mensual</div>
              <div className="stat-value" style={{ fontSize: 22, color: 'var(--danger)' }}>{totalSpent.toFixed(2)}€</div>
              <div className="stat-note">en suscripciones</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Presupuesto total</div>
              <div className="stat-value" style={{ fontSize: 22, color: totalBudget > 0 ? 'var(--txt)' : 'var(--txt3)' }}>
                {totalBudget > 0 ? `${totalBudget.toFixed(2)}€` : '—'}
              </div>
              <div className="stat-note">límite mensual</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Categorías sobre límite</div>
              <div className="stat-value" style={{ fontSize: 22, color: overBudgetCats.length > 0 ? 'var(--danger)' : 'var(--accent)' }}>
                {overBudgetCats.length}
              </div>
              <div className="stat-note">{overBudgetCats.length === 0 ? 'todo bajo control' : 'revisar'}</div>
            </div>
          </div>

          {/* Budget cards */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {activeCats.map(cat => {
              const spent = spending[cat] || 0
              const budget = budgets[cat] || 0
              const color = CAT_COLOR[cat] || CAT_COLOR.other
              const over = budget > 0 && spent > budget
              const pct = budget > 0 ? Math.min((spent / budget) * 100, 100) : 0
              const isEditing = editing === cat

              return (
                <div key={cat} className="card" style={{ padding: '18px 22px', borderLeft: `4px solid ${color}` }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 12, flexWrap: 'wrap' }}>

                    {/* Category */}
                    <div style={{ flex: 1, minWidth: 120 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--txt)' }}>{CAT_LABEL[cat] || cat}</div>
                      <div style={{ fontSize: 12, color: 'var(--txt3)', marginTop: 1 }}>
                        {(subscriptions.filter(s => s.category === cat)).length} suscripción{subscriptions.filter(s => s.category === cat).length !== 1 ? 'es' : ''}
                      </div>
                    </div>

                    {/* Spent */}
                    <div style={{ textAlign: 'center', minWidth: 80 }}>
                      <div style={{ fontSize: 11, color: 'var(--txt3)', marginBottom: 2 }}>GASTO</div>
                      <div style={{ fontSize: 16, fontWeight: 800, color: over ? 'var(--danger)' : 'var(--txt)', fontVariantNumeric: 'tabular-nums' }}>
                        {spent.toFixed(2)}€
                      </div>
                    </div>

                    <div style={{ color: 'var(--txt3)', fontSize: 16 }}>/</div>

                    {/* Budget input */}
                    <div style={{ textAlign: 'center', minWidth: 100 }}>
                      <div style={{ fontSize: 11, color: 'var(--txt3)', marginBottom: 2 }}>LÍMITE</div>
                      {isEditing ? (
                        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                          <input
                            type="number"
                            value={editVal}
                            onChange={e => setEditVal(e.target.value)}
                            autoFocus
                            style={{ width: 80, padding: '4px 8px', fontSize: 14, textAlign: 'center' }}
                            onKeyDown={e => {
                              if (e.key === 'Enter') saveBudget(cat, parseFloat(editVal) || 0)
                              if (e.key === 'Escape') setEditing(null)
                            }}
                          />
                          <button onClick={() => saveBudget(cat, parseFloat(editVal) || 0)} disabled={saving} className="btn btn-primary" style={{ padding: '4px 10px', fontSize: 12 }}>
                            {saving ? '…' : 'OK'}
                          </button>
                        </div>
                      ) : (
                        <button onClick={() => { setEditing(cat); setEditVal(budget > 0 ? budget.toString() : '') }} style={{ fontSize: 16, fontWeight: 800, color: budget > 0 ? 'var(--txt)' : 'var(--txt3)', background: 'none', border: 'none', cursor: 'pointer', fontVariantNumeric: 'tabular-nums', padding: 0, borderBottom: '1px dashed var(--border)' }}>
                          {budget > 0 ? `${budget.toFixed(2)}€` : '+ Añadir'}
                        </button>
                      )}
                    </div>

                    {/* Status badge */}
                    {budget > 0 && (
                      <div style={{ minWidth: 70, textAlign: 'right' }}>
                        {over ? (
                          <span className="badge badge-danger">+{(spent - budget).toFixed(2)}€</span>
                        ) : (
                          <span className="badge badge-green">{(budget - spent).toFixed(2)}€ libre</span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Progress bar */}
                  {budget > 0 && (
                    <div>
                      <ProgressBar spent={spent} budget={budget} color={color} />
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 5 }}>
                        <span style={{ fontSize: 11, color: over ? 'var(--danger)' : 'var(--txt3)' }}>
                          {pct.toFixed(0)}% usado
                        </span>
                        <span style={{ fontSize: 11, color: 'var(--txt3)' }}>
                          {budget.toFixed(2)}€/mes
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          <p style={{ fontSize: 12, color: 'var(--txt3)', marginTop: 20 }}>
            Haz clic en el límite de cada categoría para editarlo. Los gastos se calculan a partir de tus suscripciones activas.
          </p>
        </div>
      </div>
    </div>
  )
}
