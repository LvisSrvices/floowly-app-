'use client'

import { useState, useRef, useEffect } from 'react'
import Sidebar from '@/components/Sidebar'

type Item = {
  id: string
  name: string
  type: 'asset' | 'liability'
  category: string
  amount: number
}

const ASSET_CATS    = ['Cuenta corriente', 'Ahorro', 'Inversiones', 'Inmuebles', 'Vehículos', 'Otros activos']
const LIABILITY_CATS = ['Tarjeta de crédito', 'Préstamo personal', 'Hipoteca', 'Préstamo auto', 'Otros pasivos']

const ASSET_COLOR: Record<string, string> = {
  'Cuenta corriente': '#0891B2', 'Ahorro': '#059669', 'Inversiones': '#7C3AED',
  'Inmuebles': '#EA580C', 'Vehículos': '#92400E', 'Otros activos': '#6B7280',
}
const LIABILITY_COLOR: Record<string, string> = {
  'Tarjeta de crédito': '#E11D48', 'Préstamo personal': '#DC2626',
  'Hipoteca': '#9F1239', 'Préstamo auto': '#B91C1C', 'Otros pasivos': '#7F1D1D',
}

function fmt(n: number) {
  return n.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + '€'
}

function GaugeBar({ assets, liabilities }: { assets: number; liabilities: number }) {
  const total = assets + liabilities
  if (total === 0) return null
  const ap = (assets / total) * 100
  const lp = (liabilities / total) * 100
  return (
    <div>
      <div style={{ height: 10, borderRadius: 5, overflow: 'hidden', display: 'flex', marginBottom: 8, background: 'var(--border2)' }}>
        <div style={{ width: `${ap}%`, background: '#059669', transition: 'width .5s' }} />
        <div style={{ width: `${lp}%`, background: '#E11D48', transition: 'width .5s' }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--txt3)' }}>
        <span><span style={{ color: '#059669' }}>●</span> Activos {ap.toFixed(0)}%</span>
        <span>Pasivos {lp.toFixed(0)}% <span style={{ color: '#E11D48' }}>●</span></span>
      </div>
    </div>
  )
}

type EditState = { id: string; field: 'name' | 'amount'; value: string }

export default function PatrimonioClient({
  user, items: initial,
}: {
  user: { id: string; email: string }
  items: Item[]
}) {
  const [items, setItems]   = useState<Item[]>(initial)
  const [adding, setAdding] = useState<'asset' | 'liability' | null>(null)
  const [form, setForm]     = useState({ name: '', category: '', amount: '' })
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting]   = useState<string | null>(null)
  const [editing, setEditing]     = useState<EditState | null>(null)
  const [savingEdit, setSavingEdit] = useState(false)
  const [error, setError]   = useState<string | null>(null)
  const editRef = useRef<HTMLInputElement>(null)

  useEffect(() => { if (editing && editRef.current) editRef.current.focus() }, [editing])

  const assets      = items.filter(i => i.type === 'asset')
  const liabilities = items.filter(i => i.type === 'liability')
  const totalAssets      = assets.reduce((s, i) => s + i.amount, 0)
  const totalLiabilities = liabilities.reduce((s, i) => s + i.amount, 0)
  const netWorth = totalAssets - totalLiabilities

  function groupByCategory(list: Item[], colors: Record<string, string>) {
    const groups: Record<string, { items: Item[]; total: number; color: string }> = {}
    for (const item of list) {
      if (!groups[item.category])
        groups[item.category] = { items: [], total: 0, color: colors[item.category] || '#6B7280' }
      groups[item.category].items.push(item)
      groups[item.category].total += item.amount
    }
    return Object.entries(groups)
  }

  async function handleAdd() {
    if (!adding || !form.name || !form.category || !form.amount) return
    setError(null)
    setSaving(true)
    try {
      const res  = await fetch('/api/patrimonio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name.trim(),
          type: adding,
          category: form.category,
          amount: parseFloat(form.amount.replace(',', '.')),
        }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Error al guardar. ¿Existe la tabla en Supabase?'); return }
      setItems(prev => [...prev, data])
      setForm({ name: '', category: '', amount: '' })
      setAdding(null)
    } finally { setSaving(false) }
  }

  async function handleDelete(id: string) {
    setError(null)
    setDeleting(id)
    try {
      const res = await fetch('/api/patrimonio', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })
      if (!res.ok) { const d = await res.json(); setError(d.error || 'Error al eliminar'); return }
      setItems(prev => prev.filter(i => i.id !== id))
    } finally { setDeleting(null) }
  }

  async function commitEdit() {
    if (!editing) return
    const item = items.find(i => i.id === editing.id)
    if (!item) return

    const updated = { ...item }
    if (editing.field === 'name') {
      updated.name = editing.value.trim() || item.name
    } else {
      const val = parseFloat(editing.value.replace(',', '.'))
      if (!isNaN(val) && val >= 0) updated.amount = val
    }

    if (updated.name === item.name && updated.amount === item.amount) { setEditing(null); return }

    setError(null)
    setSavingEdit(true)
    try {
      const res  = await fetch('/api/patrimonio', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: item.id, name: updated.name, category: updated.category, amount: updated.amount }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Error al actualizar'); return }
      setItems(prev => prev.map(i => i.id === editing.id ? data : i))
    } finally { setSavingEdit(false); setEditing(null) }
  }

  const renderSection = (
    type: 'asset' | 'liability',
    list: Item[],
    colors: Record<string, string>,
    cats: string[]
  ) => {
    const groups     = groupByCategory(list, colors)
    const isAsset    = type === 'asset'
    const accentColor = isAsset ? '#059669' : '#E11D48'

    return (
      <div>
        {groups.map(([cat, g]) => (
          <div key={cat} style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 4px', marginBottom: 4 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: g.color }} />
                <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--txt3)', textTransform: 'uppercase', letterSpacing: '.6px' }}>{cat}</span>
              </div>
              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--txt)', fontVariantNumeric: 'tabular-nums' }}>{fmt(g.total)}</span>
            </div>

            {g.items.map(item => {
              const editingName   = editing?.id === item.id && editing.field === 'name'
              const editingAmount = editing?.id === item.id && editing.field === 'amount'

              return (
                <div key={item.id} className="card" style={{ padding: '11px 14px', marginBottom: 5, display: 'flex', alignItems: 'center', gap: 10 }}>

                  {/* Name — click to edit */}
                  {editingName ? (
                    <input ref={editRef} value={editing!.value}
                      onChange={e => setEditing({ ...editing!, value: e.target.value })}
                      onKeyDown={e => { if (e.key === 'Enter') commitEdit(); if (e.key === 'Escape') setEditing(null) }}
                      onBlur={commitEdit}
                      style={{ flex: 1, fontSize: 13, fontWeight: 600, padding: '3px 7px', borderRadius: 6 }}
                    />
                  ) : (
                    <button onClick={() => setEditing({ id: item.id, field: 'name', value: item.name })}
                      title="Clic para editar nombre"
                      style={{ flex: 1, background: 'none', border: 'none', padding: '2px 4px', borderRadius: 5, cursor: 'text', textAlign: 'left', fontSize: 13, fontWeight: 600, color: 'var(--txt)' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--bg)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'none'}>
                      {item.name} {savingEdit && editing?.id === item.id ? <span style={{ fontSize: 10, color: 'var(--txt3)' }}>…</span> : null}
                    </button>
                  )}

                  {/* Amount — click to edit */}
                  {editingAmount ? (
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                      <input ref={editRef} value={editing!.value}
                        onChange={e => setEditing({ ...editing!, value: e.target.value })}
                        onKeyDown={e => { if (e.key === 'Enter') commitEdit(); if (e.key === 'Escape') setEditing(null) }}
                        onBlur={commitEdit}
                        style={{ width: 90, fontSize: 14, fontWeight: 700, textAlign: 'right', padding: '3px 7px', borderRadius: 6, fontVariantNumeric: 'tabular-nums' }}
                        type="text"
                      />
                      <span style={{ fontSize: 12, color: 'var(--txt3)' }}>€</span>
                    </div>
                  ) : (
                    <button onClick={() => setEditing({ id: item.id, field: 'amount', value: item.amount.toString() })}
                      title="Clic para editar importe"
                      style={{ background: 'none', border: 'none', padding: '2px 6px', borderRadius: 5, cursor: 'text', fontSize: 14, fontWeight: 700, color: accentColor, fontVariantNumeric: 'tabular-nums' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--bg)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'none'}>
                      {isAsset ? '' : '−'}{fmt(item.amount)}
                    </button>
                  )}

                  {/* Delete */}
                  <button onClick={() => handleDelete(item.id)} disabled={deleting === item.id}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--txt3)', padding: 4, borderRadius: 4, flexShrink: 0, lineHeight: 0 }}>
                    {deleting === item.id ? <span style={{ fontSize: 12 }}>…</span> : (
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                        <path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                      </svg>
                    )}
                  </button>
                </div>
              )
            })}
          </div>
        ))}

        {/* Add form */}
        {adding === type ? (
          <div className="card" style={{ padding: 14, marginTop: 8, border: `1px dashed ${accentColor}` }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
              <input autoFocus type="text"
                placeholder={isAsset ? 'Ej: BBVA Cuenta Corriente' : 'Ej: Visa Santander'}
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              />
              <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                <option value="">Selecciona categoría…</option>
                {cats.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <div style={{ position: 'relative' }}>
                <input type="text" inputMode="decimal"
                  placeholder="Importe (€)"
                  value={form.amount}
                  onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                  onKeyDown={e => { if (e.key === 'Enter') handleAdd(); if (e.key === 'Escape') setAdding(null) }}
                  style={{ paddingRight: 28 }}
                />
                <span style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 13, color: 'var(--txt3)', pointerEvents: 'none' }}>€</span>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={handleAdd} disabled={saving || !form.name || !form.category || !form.amount}
                  className="btn btn-primary" style={{ flex: 1, fontSize: 13 }}>
                  {saving ? 'Guardando…' : 'Añadir'}
                </button>
                <button onClick={() => { setAdding(null); setForm({ name: '', category: '', amount: '' }) }}
                  className="btn btn-secondary" style={{ fontSize: 13 }}>
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        ) : (
          <button onClick={() => { setAdding(type); setForm({ name: '', category: cats[0], amount: '' }) }}
            style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px dashed var(--border)', background: 'transparent', color: 'var(--txt3)', cursor: 'pointer', fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 8 }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Añadir {isAsset ? 'activo' : 'pasivo'}
          </button>
        )}
      </div>
    )
  }

  return (
    <div className="app-shell">
      <Sidebar email={user.email} />

      <div className="app-main">
        <header className="page-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div className="page-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--txt)', letterSpacing: '-.02em' }}>Patrimonio neto</div>
              <div style={{ fontSize: 12, color: 'var(--txt3)' }}>Activos menos pasivos = tu riqueza real</div>
            </div>
          </div>
        </header>

        <div className="page-content">

          {/* Error banner */}
          {error && (
            <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 10, padding: '12px 16px', marginBottom: 20, fontSize: 13, color: '#B91C1C', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginTop: 1, flexShrink: 0 }}>
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              <div style={{ flex: 1 }}>
                {error}
                {error.includes('tabla') && (
                  <div style={{ marginTop: 6, fontSize: 12, color: '#7F1D1D' }}>
                    Ejecuta el SQL de creación de tabla en el panel de Supabase (SQL Editor).
                  </div>
                )}
              </div>
              <button onClick={() => setError(null)} style={{ background: 'none', border: 'none', color: '#B91C1C', cursor: 'pointer', fontSize: 18, lineHeight: 1, padding: 0 }}>×</button>
            </div>
          )}

          {/* Hero */}
          <div className="card" style={{ padding: '28px 32px', marginBottom: 20, background: 'linear-gradient(135deg, #F0FDF8 0%, #DCFCE7 100%)' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--txt3)', textTransform: 'uppercase', letterSpacing: '.8px', marginBottom: 6 }}>Patrimonio Neto Total</div>
            <div style={{ fontSize: 42, fontWeight: 900, color: netWorth >= 0 ? 'var(--accent)' : '#E11D48', fontVariantNumeric: 'tabular-nums', letterSpacing: '-1.5px', marginBottom: 18 }}>
              {netWorth >= 0 ? '' : '−'}{fmt(Math.abs(netWorth))}
            </div>
            <GaugeBar assets={totalAssets} liabilities={totalLiabilities} />
          </div>

          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 28 }}>
            <div className="stat-card" style={{ borderTop: '3px solid #059669' }}>
              <div className="stat-label">Total Activos</div>
              <div className="stat-value" style={{ fontSize: 22, color: '#059669' }}>{fmt(totalAssets)}</div>
              <div className="stat-note">{assets.length} elemento{assets.length !== 1 ? 's' : ''}</div>
            </div>
            <div className="stat-card" style={{ borderTop: '3px solid #E11D48' }}>
              <div className="stat-label">Total Pasivos</div>
              <div className="stat-value" style={{ fontSize: 22, color: '#E11D48' }}>{fmt(totalLiabilities)}</div>
              <div className="stat-note">{liabilities.length} elemento{liabilities.length !== 1 ? 's' : ''}</div>
            </div>
          </div>

          {items.length === 0 && !adding && (
            <div style={{ textAlign: 'center', padding: '32px 24px', color: 'var(--txt3)', fontSize: 13, marginBottom: 24 }}>
              Añade tus cuentas, inversiones, deudas y préstamos para calcular tu patrimonio neto real.
            </div>
          )}

          {/* Columns */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, alignItems: 'start' }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#059669', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 7 }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>
                Activos
              </div>
              {renderSection('asset', assets, ASSET_COLOR, ASSET_CATS)}
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#E11D48', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 7 }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 18 13.5 8.5 8.5 13.5 1 6"/><polyline points="17 18 23 18 23 12"/></svg>
                Pasivos
              </div>
              {renderSection('liability', liabilities, LIABILITY_COLOR, LIABILITY_CATS)}
            </div>
          </div>

          {/* Tip */}
          <div style={{ marginTop: 28, fontSize: 11, color: 'var(--txt3)', textAlign: 'center' }}>
            Haz clic en cualquier nombre o importe para editarlo directamente
          </div>

        </div>
      </div>
    </div>
  )
}
