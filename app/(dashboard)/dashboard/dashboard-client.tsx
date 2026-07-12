'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
import Link from 'next/link'
import { createBrowserClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import * as XLSX from 'xlsx'
import Sidebar from '@/components/Sidebar'

type Subscription = {
  id: string; name: string; provider: string; amount: number | null
  currency: string; frequency: string; category: string
  status: string; confidence: string; last_charge_date: string | null
}

const CAT_COLOR: Record<string, string> = {
  streaming: '#E11D48', software: '#7C3AED', telecom: '#0891B2',
  insurance: '#059669', gym: '#EA580C', news: '#92400E', other: '#6B7280',
}
const CAT_LABEL: Record<string, string> = {
  streaming: 'Streaming', software: 'Software', telecom: 'Telecom',
  insurance: 'Seguros', gym: 'Gimnasio', news: 'Prensa', other: 'Otro',
}
const DOMAIN_MAP: Record<string, string> = {
  netflix: 'netflix.com', spotify: 'spotify.com', amazon: 'amazon.es',
  'amazon prime': 'amazon.es', 'prime video': 'primevideo.com',
  apple: 'apple.com', 'apple tv': 'apple.com', icloud: 'apple.com',
  google: 'google.com', 'youtube premium': 'youtube.com', youtube: 'youtube.com',
  microsoft: 'microsoft.com', 'microsoft 365': 'microsoft.com', xbox: 'xbox.com',
  adobe: 'adobe.com', hbo: 'max.com', 'hbo max': 'max.com', max: 'max.com',
  disney: 'disneyplus.com', 'disney+': 'disneyplus.com', dazn: 'dazn.com',
  filmin: 'filmin.es', movistar: 'movistar.es', vodafone: 'vodafone.es',
  orange: 'orange.es', jazztel: 'jazztel.com', masmovil: 'masmovil.es',
  mapfre: 'mapfre.es', axa: 'axa.es', sanitas: 'sanitas.es', adeslas: 'adeslas.es',
  notion: 'notion.so', figma: 'figma.com', github: 'github.com',
  slack: 'slack.com', dropbox: 'dropbox.com', canva: 'canva.com',
  openai: 'openai.com', chatgpt: 'openai.com', linkedin: 'linkedin.com',
  'el pais': 'elpais.com', 'el país': 'elpais.com', 'el mundo': 'elmundo.es',
  mcfit: 'mcfit.com', 'basic-fit': 'basic-fit.com', basicfit: 'basic-fit.com',
  paramount: 'paramountplus.com', twitch: 'twitch.tv', nintendo: 'nintendo.com',
  playstation: 'playstation.com', 'ps plus': 'playstation.com',
  zoom: 'zoom.us', duolingo: 'duolingo.com', audible: 'audible.com',
}

function getLogoDomain(name: string, provider: string): string | null {
  const key = name.toLowerCase().trim()
  if (DOMAIN_MAP[key]) return DOMAIN_MAP[key]
  for (const [k, domain] of Object.entries(DOMAIN_MAP)) {
    if (key.includes(k) || k.includes(key)) return domain
  }
  const m = provider.match(/([a-z0-9-]+\.(com|es|net|org|io|tv|so))/i)
  return m ? m[1].toLowerCase() : null
}

function SubIcon({ name, category, provider, size = 40 }: { name: string; category: string; provider: string; size?: number }) {
  const [imgFailed, setImgFailed] = useState(false)
  const domain = getLogoDomain(name, provider)
  const logoUrl = domain ? `https://logo.clearbit.com/${domain}` : null
  const color = CAT_COLOR[category] || CAT_COLOR.other

  if (logoUrl && !imgFailed) {
    return (
      <div style={{ width: size, height: size, borderRadius: 12, background: '#fff', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden' }}>
        <img src={logoUrl} alt={name} width={size - 10} height={size - 10} style={{ objectFit: 'contain' }} onError={() => setImgFailed(true)} />
      </div>
    )
  }
  return (
    <div style={{ width: size, height: size, borderRadius: 12, background: color + '18', border: `1px solid ${color}25`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: size * 0.3, fontWeight: 800, color }}>
      {name.slice(0, 2).toUpperCase()}
    </div>
  )
}

function toMonthly(amount: number, frequency: string) {
  if (frequency === 'annual') return amount / 12
  if (frequency === 'weekly') return amount * 4.33
  return amount
}

function fmt(n: number) {
  return n.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

const DEFAULT_BUDGETS: Record<string, number> = {
  streaming: 30, software: 50, telecom: 60, insurance: 80, gym: 30, news: 20, other: 40,
}

export default function DashboardClient({
  user, subscriptions, hasGmail, totalMonthly: _totalMonthly, scanning, justConnected,
}: {
  user: { id: string; email: string; user_metadata?: Record<string, any> }
  subscriptions: Subscription[]
  hasGmail: boolean
  totalMonthly: number
  scanning: boolean
  justConnected: boolean
}) {
  const [subs, setSubs]                     = useState(subscriptions)
  const [emailDraft, setEmailDraft]         = useState<{ subject: string; body: string } | null>(null)
  const [activeId, setActiveId]             = useState<string | null>(null)
  const [loadingAction, setLoadingAction]   = useState<string | null>(null)
  const [scanningNow, setScanningNow]       = useState(scanning)
  const [csvStatus, setCsvStatus]           = useState<'idle' | 'parsing' | 'done' | 'error'>('idle')
  const [csvMessage, setCsvMessage]         = useState('')
  const [filterCat, setFilterCat]           = useState<string>('all')
  const [sortBy, setSortBy]                 = useState<'amount' | 'name' | 'date'>('amount')
  const [searchQuery, setSearchQuery]       = useState('')
  const [editingId, setEditingId]           = useState<string | null>(null)
  const [editAmount, setEditAmount]         = useState('')
  const [budgets, setBudgets]               = useState<Record<string, number>>(DEFAULT_BUDGETS)
  const [editingBudget, setEditingBudget]   = useState<string | null>(null)
  const [editBudgetVal, setEditBudgetVal]   = useState('')
  const [showBudgets, setShowBudgets]       = useState(false)
  const editRef = useRef<HTMLInputElement>(null)
  const supabase = createBrowserClient()
  const router   = useRouter()

  useEffect(() => { setSubs(subscriptions) }, [subscriptions])
  useEffect(() => { if (editingId && editRef.current) editRef.current.focus() }, [editingId])

  const firstName = user.user_metadata?.first_name ?? user.email.split('@')[0]

  const active    = useMemo(() => subs.filter(s => s.status === 'active'), [subs])
  const cancelled = useMemo(() => subs.filter(s => s.status === 'cancelled'), [subs])

  const monthlyTotal = useMemo(
    () => active.reduce((s, sub) => s + (sub.amount ? toMonthly(sub.amount, sub.frequency) : 0), 0),
    [active]
  )
  const savedTotal = useMemo(
    () => cancelled.reduce((s, sub) => s + (sub.amount ? toMonthly(sub.amount, sub.frequency) : 0), 0),
    [cancelled]
  )

  const catTotals = useMemo(() => {
    const map: Record<string, number> = {}
    active.forEach(s => {
      if (!s.amount) return
      const c = s.category || 'other'
      map[c] = (map[c] ?? 0) + toMonthly(s.amount, s.frequency)
    })
    return Object.entries(map).sort((a, b) => b[1] - a[1])
  }, [active])

  const maxCat = catTotals[0]?.[1] ?? 1

  const filtered = useMemo(() => {
    let list = active
    if (filterCat !== 'all') list = list.filter(s => s.category === filterCat)
    if (searchQuery.trim()) list = list.filter(s => s.name.toLowerCase().includes(searchQuery.toLowerCase()))
    if (sortBy === 'amount') list = [...list].sort((a, b) => toMonthly(b.amount ?? 0, b.frequency) - toMonthly(a.amount ?? 0, a.frequency))
    if (sortBy === 'name')   list = [...list].sort((a, b) => a.name.localeCompare(b.name))
    if (sortBy === 'date')   list = [...list].sort((a, b) => (b.last_charge_date ?? '').localeCompare(a.last_charge_date ?? ''))
    return list
  }, [active, filterCat, searchQuery, sortBy])

  async function handleCsvUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setCsvStatus('parsing')
    setCsvMessage('Analizando movimientos...')
    try {
      let csvText: string
      const ext = file.name.split('.').pop()?.toLowerCase()
      if (ext === 'xlsx' || ext === 'xls') {
        const buffer = await file.arrayBuffer()
        const wb     = XLSX.read(buffer, { type: 'array' })
        const sheet  = wb.Sheets[wb.SheetNames[0]]
        csvText = XLSX.utils.sheet_to_csv(sheet, { FS: ';' })
      } else {
        csvText = await file.text()
      }
      const res  = await fetch('/api/bank/csv', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ csv: csvText, user_id: user.id }) })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      if (data.found === 0) { setCsvStatus('error'); setCsvMessage('No se detectaron suscripciones. Asegúrate de que el archivo contiene movimientos de al menos 1-2 meses.'); return }
      setCsvStatus('done'); setCsvMessage(`${data.found} suscripciones detectadas.`)
      setTimeout(() => router.refresh(), 1500)
    } catch (err: any) { setCsvStatus('error'); setCsvMessage(err.message || 'Error al procesar el archivo.') }
  }

  async function handleScan() {
    setScanningNow(true)
    const res = await fetch('/api/scan', { method: 'POST', headers: { 'x-user-id': user.id } })
    setScanningNow(false)
    if (res.ok) router.refresh()
  }

  async function handleAction(subId: string, action: 'cancel_email' | 'negotiate_email') {
    setLoadingAction(`${subId}_${action}`)
    try {
      const res  = await fetch('/api/subscriptions', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action, subscription_id: subId }) })
      const data = await res.json()
      if (data.email) setEmailDraft(data.email)
      setActiveId(subId)
    } finally { setLoadingAction(null) }
  }

  async function handleStatusChange(subId: string, status: string) {
    const res = await fetch('/api/subscriptions', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: subId, status }) })
    if (res.ok) setSubs(prev => prev.map(s => s.id === subId ? { ...s, status } : s))
  }

  async function saveAmount(subId: string) {
    const val = parseFloat(editAmount.replace(',', '.'))
    if (isNaN(val) || val <= 0) { setEditingId(null); return }
    const res = await fetch('/api/subscriptions', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: subId, amount: val }) })
    if (res.ok) setSubs(prev => prev.map(s => s.id === subId ? { ...s, amount: val } : s))
    setEditingId(null)
  }

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Buenos días' : hour < 20 ? 'Buenas tardes' : 'Buenas noches'

  return (
    <div className="app-shell">
      <Sidebar email={user.email} />

      <div className="app-main">
        {/* ── Header ─────────────────────────────────────────────────────── */}
        <header className="page-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div className="page-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/></svg>
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--txt)', letterSpacing: '-.02em' }}>{greeting}, {firstName}</div>
              <div style={{ fontSize: 12, color: 'var(--txt3)' }}>Resumen de {new Date().toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {hasGmail && (
              <button onClick={handleScan} disabled={scanningNow} className="btn btn-secondary" style={{ fontSize: 12 }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-3.5"/></svg>
                {scanningNow ? 'Escaneando…' : 'Re-escanear'}
              </button>
            )}
            <label className="btn btn-primary" style={{ fontSize: 12, cursor: 'pointer' }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
              Subir extracto
              <input type="file" accept=".csv,.xls,.xlsx,.txt" style={{ display: 'none' }} onChange={handleCsvUpload} />
            </label>
          </div>
        </header>

        <div className="page-content">

          {/* Banners */}
          {justConnected && (
            <div style={{ background: '#ECFDF5', border: '1px solid #A7F3D0', borderRadius: 12, padding: '13px 18px', marginBottom: 22, fontSize: 13, color: '#065F46', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 10 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
              Cuenta conectada. {scanningNow ? 'Escaneando movimientos...' : 'Escaneo completado.'}
            </div>
          )}
          {csvStatus !== 'idle' && (
            <div style={{ marginBottom: 20, fontSize: 13, padding: '11px 16px', borderRadius: 10, background: csvStatus === 'error' ? '#FEF2F2' : csvStatus === 'done' ? '#ECFDF5' : 'var(--border2)', color: csvStatus === 'error' ? '#B91C1C' : csvStatus === 'done' ? '#065F46' : 'var(--txt2)', border: `1px solid ${csvStatus === 'error' ? '#FECACA' : csvStatus === 'done' ? '#A7F3D0' : 'var(--border)'}` }}>
              {csvMessage}
            </div>
          )}

          {/* ── Hero row ───────────────────────────────────────────────────── */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 12, marginBottom: 24 }}>

            {/* Big monthly spend */}
            <div className="card" style={{ padding: '22px 24px', gridColumn: 'span 2', background: 'linear-gradient(135deg, var(--accent) 0%, #0d7a6e 100%)', border: 'none', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', right: -20, top: -20, width: 120, height: 120, borderRadius: '50%', background: 'rgba(255,255,255,.07)' }} />
              <div style={{ position: 'absolute', right: 30, bottom: -30, width: 80, height: 80, borderRadius: '50%', background: 'rgba(255,255,255,.05)' }} />
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.1em', color: 'rgba(255,255,255,.7)', marginBottom: 8 }}>Gasto mensual total</div>
              <div style={{ fontSize: 42, fontWeight: 900, color: '#fff', letterSpacing: '-.04em', lineHeight: 1, marginBottom: 8, fontVariantNumeric: 'tabular-nums' }}>
                {fmt(monthlyTotal)}<span style={{ fontSize: 20, fontWeight: 600, marginLeft: 3 }}>€</span>
              </div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,.75)', display: 'flex', alignItems: 'center', gap: 6 }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18M3 12h18M3 18h18"/></svg>
                {active.length} suscripci{active.length === 1 ? 'ón' : 'ones'} activa{active.length === 1 ? '' : 's'}
              </div>
            </div>

            {/* Annual estimate */}
            <div className="stat-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--txt3)', marginBottom: 6 }}>Estimado anual</div>
              <div style={{ fontSize: 26, fontWeight: 900, color: 'var(--txt)', letterSpacing: '-.04em', fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>
                {Math.round(monthlyTotal * 12).toLocaleString('es-ES')}<span style={{ fontSize: 14, fontWeight: 600, color: 'var(--txt2)' }}>€</span>
              </div>
              <div style={{ fontSize: 11, color: 'var(--txt3)', marginTop: 5 }}>si no cambias nada</div>
            </div>

            {/* Savings */}
            <div className="stat-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--txt3)', marginBottom: 6 }}>Canceladas</div>
              <div style={{ fontSize: 26, fontWeight: 900, color: '#059669', letterSpacing: '-.04em', fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>
                +{fmt(savedTotal)}<span style={{ fontSize: 14, fontWeight: 600 }}>€</span>
              </div>
              <div style={{ fontSize: 11, color: 'var(--txt3)', marginTop: 5 }}>{cancelled.length} cancelada{cancelled.length !== 1 ? 's' : ''} · /mes ahorrado</div>
            </div>
          </div>

          {/* ── Two-column layout ──────────────────────────────────────────── */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 20, alignItems: 'start' }}>

            {/* LEFT: subscription list */}
            <div>

              {/* Filter + search + sort */}
              {active.length > 0 && (
                <div style={{ marginBottom: 16 }}>
                  {/* Category pills */}
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
                    {(['all', ...catTotals.map(([c]) => c)] as string[]).map(cat => (
                      <button key={cat} onClick={() => setFilterCat(cat)} style={{
                        padding: '5px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'all .12s',
                        background: filterCat === cat ? (cat === 'all' ? 'var(--accent)' : CAT_COLOR[cat] || 'var(--accent)') : 'var(--card)',
                        color: filterCat === cat ? '#fff' : 'var(--txt2)',
                        border: `1px solid ${filterCat === cat ? 'transparent' : 'var(--border)'}`,
                      }}>
                        {cat === 'all' ? `Todas (${active.length})` : `${CAT_LABEL[cat] ?? cat} (${active.filter(s => s.category === cat).length})`}
                      </button>
                    ))}
                  </div>

                  {/* Search + sort row */}
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <div style={{ position: 'relative', flex: 1 }}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--txt3)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
                        <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                      </svg>
                      <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Buscar suscripción..." style={{ paddingLeft: 32, width: '100%' }} />
                    </div>
                    <select value={sortBy} onChange={e => setSortBy(e.target.value as any)} style={{ fontSize: 12, padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--card)', color: 'var(--txt)', cursor: 'pointer', flexShrink: 0 }}>
                      <option value="amount">Mayor importe</option>
                      <option value="name">Nombre A-Z</option>
                      <option value="date">Último cobro</option>
                    </select>
                  </div>
                </div>
              )}

              {/* Empty state with connect options */}
              {subs.length === 0 && !scanningNow && (
                <div className="card" style={{ padding: 24, marginBottom: 20 }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--txt)', marginBottom: 4 }}>Detecta tus suscripciones</div>
                  <div style={{ fontSize: 13, color: 'var(--txt2)', marginBottom: 20 }}>Conecta una fuente para analizar tus gastos recurrentes automáticamente.</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', border: '1px solid var(--border2)', borderRadius: 12, opacity: .45 }}>
                      <div style={{ width: 38, height: 38, borderRadius: 10, background: 'var(--border2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--txt3)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--txt)' }}>Conectar banco directamente</span>
                          <span style={{ fontSize: 9, fontWeight: 800, padding: '2px 7px', borderRadius: 20, background: 'var(--accent)', color: '#fff', letterSpacing: '.06em' }}>PRONTO</span>
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--txt3)', marginTop: 2 }}>Santander, BBVA, CaixaBank, ING y +2.300 bancos</div>
                      </div>
                    </div>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', border: '1px solid var(--border)', borderRadius: 12, cursor: 'pointer' }}>
                      <div style={{ width: 38, height: 38, borderRadius: 10, background: 'var(--accent-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/></svg>
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--txt)' }}>Subir extracto bancario</div>
                        <div style={{ fontSize: 12, color: 'var(--txt3)', marginTop: 2 }}>CSV o Excel · Santander, BBVA, ING, CaixaBank…</div>
                      </div>
                      <span style={{ fontSize: 12, color: 'var(--accent)', fontWeight: 600, flexShrink: 0 }}>Subir →</span>
                      <input type="file" accept=".csv,.xls,.xlsx,.txt" style={{ display: 'none' }} onChange={handleCsvUpload} />
                    </label>
                    <Link href="/connect" style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', border: '1px solid var(--border2)', borderRadius: 12, textDecoration: 'none' }}>
                      <div style={{ width: 38, height: 38, borderRadius: 10, background: '#FEF2F2', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 14, fontWeight: 800, color: '#DC2626' }}>G</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--txt)' }}>Conectar Gmail</div>
                        <div style={{ fontSize: 12, color: 'var(--txt3)', marginTop: 2 }}>Detecta suscripciones a través de tus facturas por email</div>
                      </div>
                      <span style={{ color: 'var(--txt3)' }}>→</span>
                    </Link>
                  </div>
                </div>
              )}

              {/* All-cancelled state */}
              {active.length === 0 && subs.length > 0 && !scanningNow && (
                <div className="card" style={{ padding: '48px 24px', textAlign: 'center', marginBottom: 20 }}>
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--txt3)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block', margin: '0 auto 14px' }}><polyline points="20 6 9 17 4 12"/></svg>
                  <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--txt)', marginBottom: 5 }}>Todo bajo control</div>
                  <div style={{ fontSize: 13, color: 'var(--txt2)' }}>No tienes suscripciones activas. ¡Buen trabajo!</div>
                </div>
              )}

              {/* Subscription cards */}
              {filtered.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {filtered.map(sub => {
                    const monthly = sub.amount ? toMonthly(sub.amount, sub.frequency) : 0
                    const budgetLimit = budgets[sub.category] ?? 0
                    const isEditing = editingId === sub.id

                    return (
                      <div key={sub.id} className="card" style={{ padding: 0, overflow: 'hidden' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px' }}>

                          {/* Logo */}
                          <SubIcon name={sub.name} category={sub.category} provider={sub.provider} size={42} />

                          {/* Info */}
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 3, flexWrap: 'wrap' }}>
                              <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--txt)' }}>{sub.name}</span>
                              <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20, background: (CAT_COLOR[sub.category] || CAT_COLOR.other) + '18', color: CAT_COLOR[sub.category] || CAT_COLOR.other }}>
                                {CAT_LABEL[sub.category] || sub.category}
                              </span>
                              {sub.confidence === 'low' && <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20, background: '#FEF3C7', color: '#92400E' }}>Verificar</span>}
                            </div>
                            <div style={{ fontSize: 12, color: 'var(--txt3)' }}>
                              {sub.frequency === 'annual' ? 'Anual' : sub.frequency === 'weekly' ? 'Semanal' : 'Mensual'}
                              {sub.last_charge_date && ` · Último cobro: ${sub.last_charge_date}`}
                            </div>
                          </div>

                          {/* Amount (inline editable) */}
                          <div style={{ textAlign: 'right', flexShrink: 0 }}>
                            {isEditing ? (
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <input ref={editRef} value={editAmount} onChange={e => setEditAmount(e.target.value)}
                                  onKeyDown={e => { if (e.key === 'Enter') saveAmount(sub.id); if (e.key === 'Escape') setEditingId(null) }}
                                  style={{ width: 80, textAlign: 'right', fontVariantNumeric: 'tabular-nums', fontWeight: 800, fontSize: 15 }}
                                  type="text" />
                                <button onClick={() => saveAmount(sub.id)} className="btn btn-primary" style={{ fontSize: 11, padding: '5px 9px' }}>✓</button>
                                <button onClick={() => setEditingId(null)} className="btn btn-secondary" style={{ fontSize: 11, padding: '5px 9px' }}>✕</button>
                              </div>
                            ) : (
                              <button onClick={() => { setEditingId(sub.id); setEditAmount(sub.amount?.toString() ?? '') }}
                                title="Haz clic para editar"
                                style={{ background: 'none', border: 'none', cursor: 'pointer', textAlign: 'right', padding: '4px 6px', borderRadius: 6, transition: 'background .1s' }}
                                onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg)')}
                                onMouseLeave={e => (e.currentTarget.style.background = 'none')}>
                                <div style={{ fontSize: 18, fontWeight: 900, color: 'var(--txt)', fontVariantNumeric: 'tabular-nums', letterSpacing: '-.03em', lineHeight: 1 }}>
                                  {sub.amount ? `${fmt(sub.amount)}€` : '—'}
                                </div>
                                <div style={{ fontSize: 10, color: 'var(--txt3)', marginTop: 1 }}>
                                  {sub.frequency === 'annual' ? '/año' : sub.frequency === 'weekly' ? '/sem' : '/mes'}
                                  {sub.frequency !== 'monthly' && sub.amount && <span style={{ color: 'var(--txt3)', marginLeft: 3 }}>({fmt(monthly)}€/mes)</span>}
                                </div>
                              </button>
                            )}
                          </div>

                          {/* Actions */}
                          <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                            <button onClick={() => handleAction(sub.id, 'negotiate_email')} disabled={loadingAction !== null} className="btn btn-secondary" style={{ fontSize: 11, padding: '6px 10px' }}>
                              {loadingAction === `${sub.id}_negotiate_email` ? '…' : 'Negociar'}
                            </button>
                            <button onClick={() => handleAction(sub.id, 'cancel_email')} disabled={loadingAction !== null} className="btn btn-danger" style={{ fontSize: 11, padding: '6px 10px' }}>
                              {loadingAction === `${sub.id}_cancel_email` ? '…' : 'Cancelar'}
                            </button>
                          </div>
                        </div>

                        {/* Progress bar relative to budget */}
                        {budgetLimit > 0 && monthly > 0 && (
                          <div style={{ height: 3, background: 'var(--border2)', margin: '0 0 0 0' }}>
                            <div style={{ height: '100%', width: `${Math.min(100, (monthly / budgetLimit) * 100)}%`, background: monthly > budgetLimit ? '#E11D48' : 'var(--accent)', transition: 'width .3s', borderRadius: '0 2px 2px 0' }} />
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}

              {/* Cancelled section */}
              {cancelled.length > 0 && (
                <div style={{ marginTop: 28 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.07em', color: 'var(--txt3)', marginBottom: 10 }}>
                    Canceladas ({cancelled.length})
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {cancelled.map(sub => (
                      <div key={sub.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px', background: 'var(--card)', border: '1px solid var(--border2)', borderRadius: 12, opacity: .5 }}>
                        <div style={{ width: 3, height: 32, borderRadius: 2, background: 'var(--border)', flexShrink: 0 }} />
                        <span style={{ fontSize: 13, color: 'var(--txt)', flex: 1, textDecoration: 'line-through' }}>{sub.name}</span>
                        {sub.amount && <span style={{ fontSize: 12, color: '#059669', fontWeight: 700 }}>+{fmt(sub.amount)}€/mes ahorrado</span>}
                        <button onClick={() => handleStatusChange(sub.id, 'active')} className="btn btn-secondary" style={{ fontSize: 11, padding: '4px 10px' }}>Reactivar</button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* RIGHT: sidebar panels */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

              {/* Category breakdown */}
              {catTotals.length > 0 && (
                <div className="card" style={{ padding: 20 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--txt)' }}>Por categoría</div>
                    <span style={{ fontSize: 11, color: 'var(--txt3)' }}>este mes</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {catTotals.map(([cat, total]) => (
                      <button key={cat} onClick={() => setFilterCat(filterCat === cat ? 'all' : cat)}
                        style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', textAlign: 'left', width: '100%' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <div style={{ width: 8, height: 8, borderRadius: '50%', background: CAT_COLOR[cat] || CAT_COLOR.other, flexShrink: 0 }} />
                            <span style={{ fontSize: 12, fontWeight: filterCat === cat ? 700 : 500, color: filterCat === cat ? 'var(--txt)' : 'var(--txt2)' }}>
                              {CAT_LABEL[cat] || cat}
                            </span>
                          </div>
                          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--txt)', fontVariantNumeric: 'tabular-nums' }}>{fmt(total)}€</span>
                        </div>
                        <div style={{ height: 6, background: 'var(--bg)', borderRadius: 3, overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${(total / maxCat) * 100}%`, background: CAT_COLOR[cat] || CAT_COLOR.other, borderRadius: 3, opacity: filterCat === cat || filterCat === 'all' ? 1 : .4, transition: 'width .4s, opacity .2s' }} />
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Budget limits */}
              {catTotals.length > 0 && (
                <div className="card" style={{ padding: 20 }}>
                  <button onClick={() => setShowBudgets(p => !p)}
                    style={{ width: '100%', background: 'none', border: 'none', padding: 0, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: showBudgets ? 16 : 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--txt)' }}>Presupuestos por categoría</div>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--txt3)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transform: showBudgets ? 'rotate(180deg)' : 'none', transition: 'transform .2s' }}>
                      <polyline points="6 9 12 15 18 9"/>
                    </svg>
                  </button>
                  {showBudgets && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {catTotals.map(([cat, total]) => {
                        const limit = budgets[cat] ?? 0
                        const pct   = limit > 0 ? Math.min(100, (total / limit) * 100) : 0
                        const over  = limit > 0 && total > limit
                        return (
                          <div key={cat}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                              <span style={{ fontSize: 12, color: 'var(--txt2)', fontWeight: 500 }}>{CAT_LABEL[cat] || cat}</span>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <span style={{ fontSize: 12, fontWeight: 700, color: over ? '#E11D48' : 'var(--txt)', fontVariantNumeric: 'tabular-nums' }}>{fmt(total)}€</span>
                                {editingBudget === cat ? (
                                  <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                                    <span style={{ fontSize: 11, color: 'var(--txt3)' }}>/</span>
                                    <input value={editBudgetVal} onChange={e => setEditBudgetVal(e.target.value)}
                                      onKeyDown={e => {
                                        if (e.key === 'Enter') {
                                          const v = parseFloat(editBudgetVal.replace(',', '.'))
                                          if (!isNaN(v)) setBudgets(p => ({ ...p, [cat]: v }))
                                          setEditingBudget(null)
                                        }
                                        if (e.key === 'Escape') setEditingBudget(null)
                                      }}
                                      autoFocus
                                      style={{ width: 56, fontSize: 11, padding: '3px 6px', fontVariantNumeric: 'tabular-nums' }}
                                    />
                                    <span style={{ fontSize: 11, color: 'var(--txt3)' }}>€</span>
                                  </div>
                                ) : (
                                  <button onClick={() => { setEditingBudget(cat); setEditBudgetVal(limit.toString()) }}
                                    style={{ fontSize: 11, color: 'var(--txt3)', background: 'none', border: 'none', cursor: 'pointer', padding: '2px 4px', borderRadius: 4 }}
                                    title="Editar límite">
                                    /{limit > 0 ? `${limit}€` : 'sin límite'} ✎
                                  </button>
                                )}
                              </div>
                            </div>
                            <div style={{ height: 6, background: 'var(--bg)', borderRadius: 3, overflow: 'hidden' }}>
                              <div style={{ height: '100%', width: `${pct}%`, background: over ? '#E11D48' : 'var(--accent)', borderRadius: 3, transition: 'width .4s' }} />
                            </div>
                          </div>
                        )
                      })}
                      <div style={{ fontSize: 11, color: 'var(--txt3)', marginTop: 4 }}>
                        Haz clic en el límite para editarlo
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Opportunities */}
              {active.filter(s => s.amount && toMonthly(s.amount, s.frequency) > 15).length > 0 && (
                <div className="card" style={{ padding: 20 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--txt)', marginBottom: 4 }}>Oportunidades de ahorro</div>
                  <div style={{ fontSize: 12, color: 'var(--txt3)', marginBottom: 14 }}>Suscripciones con mayor potencial</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {[...active]
                      .filter(s => s.amount && toMonthly(s.amount, s.frequency) > 0)
                      .sort((a, b) => toMonthly(b.amount!, b.frequency) - toMonthly(a.amount!, a.frequency))
                      .slice(0, 3)
                      .map((sub, i) => {
                        const monthly = toMonthly(sub.amount!, sub.frequency)
                        return (
                          <div key={sub.id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{ width: 20, height: 20, borderRadius: '50%', background: i === 0 ? '#FEF3C7' : 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 800, color: i === 0 ? '#92400E' : 'var(--txt3)', flexShrink: 0 }}>
                              {i + 1}
                            </div>
                            <SubIcon name={sub.name} category={sub.category} provider={sub.provider} size={30} />
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--txt)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{sub.name}</div>
                            </div>
                            <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--txt)', fontVariantNumeric: 'tabular-nums', flexShrink: 0 }}>{fmt(monthly)}€</div>
                            <button onClick={() => handleAction(sub.id, 'negotiate_email')} disabled={loadingAction !== null} className="btn btn-secondary" style={{ fontSize: 10, padding: '4px 8px', flexShrink: 0 }}>
                              Negociar
                            </button>
                          </div>
                        )
                      })}
                  </div>
                </div>
              )}

              {/* Quick import */}
              <div className="card" style={{ padding: 20 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--txt)', marginBottom: 4 }}>Añadir suscripciones</div>
                <div style={{ fontSize: 12, color: 'var(--txt3)', marginBottom: 14 }}>Sube un extracto o conecta una cuenta</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <label className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', cursor: 'pointer' }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                    Subir extracto CSV / Excel
                    <input type="file" accept=".csv,.xls,.xlsx,.txt" style={{ display: 'none' }} onChange={handleCsvUpload} />
                  </label>
                  <Link href="/connect" className="btn btn-secondary" style={{ width: '100%', justifyContent: 'center', textDecoration: 'none' }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
                    Conectar Gmail o Banco
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Email modal ────────────────────────────────────────────────────── */}
      {emailDraft && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,28,46,.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, zIndex: 200, backdropFilter: 'blur(4px)' }}>
          <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 18, width: '100%', maxWidth: 520, maxHeight: '90vh', overflow: 'auto', boxShadow: 'var(--shadow-lg)' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--txt)' }}>Email generado por IA</h3>
                <div style={{ fontSize: 12, color: 'var(--txt3)', marginTop: 1 }}>Edita si quieres personalizar el mensaje</div>
              </div>
              <button onClick={() => { setEmailDraft(null); setActiveId(null) }} style={{ background: 'none', border: 'none', color: 'var(--txt3)', cursor: 'pointer', fontSize: 22, lineHeight: 1, padding: 4 }}>×</button>
            </div>
            <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div><label>Asunto</label><input type="text" value={emailDraft.subject} onChange={e => setEmailDraft({ ...emailDraft, subject: e.target.value })} /></div>
              <div><label>Mensaje</label><textarea value={emailDraft.body} onChange={e => setEmailDraft({ ...emailDraft, body: e.target.value })} style={{ height: 200, resize: 'vertical', lineHeight: 1.6 }} /></div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => navigator.clipboard.writeText(`Asunto: ${emailDraft.subject}\n\n${emailDraft.body}`)} className="btn btn-secondary" style={{ flex: 1 }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                  Copiar
                </button>
                <a href={`mailto:?subject=${encodeURIComponent(emailDraft.subject)}&body=${encodeURIComponent(emailDraft.body)}`} className="btn btn-primary" style={{ flex: 1, justifyContent: 'center', textDecoration: 'none' }}>
                  Abrir en email →
                </a>
              </div>
              {activeId && (
                <button onClick={() => { handleStatusChange(activeId, 'cancelled'); setEmailDraft(null); setActiveId(null) }}
                  style={{ fontSize: 12, color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer', padding: '2px 0', textAlign: 'left' }}>
                  ✓ Marcar como cancelada (ya envié el email)
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
