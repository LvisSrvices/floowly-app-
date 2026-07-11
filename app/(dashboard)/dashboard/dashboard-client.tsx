'use client'

import { useState, useEffect } from 'react'
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

function SubIcon({ name, category, provider }: { name: string; category: string; provider: string }) {
  const [imgFailed, setImgFailed] = useState(false)
  const domain = getLogoDomain(name, provider)
  const logoUrl = domain ? `https://logo.clearbit.com/${domain}` : null
  const color = CAT_COLOR[category] || CAT_COLOR.other

  if (logoUrl && !imgFailed) {
    return (
      <div className="sub-icon" style={{ background: '#fff', border: '1px solid var(--border)', padding: 5 }}>
        <img src={logoUrl} alt={name} width={28} height={28} style={{ objectFit: 'contain', borderRadius: 4 }} onError={() => setImgFailed(true)} />
      </div>
    )
  }
  return (
    <div className="sub-icon" style={{ background: color + '18', color, border: `1px solid ${color}25` }}>
      {name.slice(0, 2).toUpperCase()}
    </div>
  )
}

function toMonthly(amount: number, frequency: string) {
  if (frequency === 'annual') return amount / 12
  if (frequency === 'weekly') return amount * 4.33
  return amount
}

export default function DashboardClient({
  user, subscriptions, hasGmail, totalMonthly, scanning, justConnected,
}: {
  user: { id: string; email: string }
  subscriptions: Subscription[]
  hasGmail: boolean
  totalMonthly: number
  scanning: boolean
  justConnected: boolean
}) {
  const [subs, setSubs] = useState(subscriptions)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [emailDraft, setEmailDraft] = useState<{ subject: string; body: string } | null>(null)
  const [loadingAction, setLoadingAction] = useState<string | null>(null)
  const [scanningNow, setScanningNow] = useState(scanning)
  const [csvStatus, setCsvStatus] = useState<'idle' | 'parsing' | 'done' | 'error'>('idle')
  const [csvMessage, setCsvMessage] = useState('')
  const supabase = createBrowserClient()
  const router = useRouter()

  useEffect(() => { setSubs(subscriptions) }, [subscriptions])

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
        const workbook = XLSX.read(buffer, { type: 'array' })
        const sheet = workbook.Sheets[workbook.SheetNames[0]]
        csvText = XLSX.utils.sheet_to_csv(sheet, { FS: ';' })
      } else {
        csvText = await file.text()
      }
      const res = await fetch('/api/bank/csv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ csv: csvText, user_id: user.id }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      if (data.found === 0) {
        setCsvStatus('error')
        setCsvMessage('No se detectaron suscripciones. Asegúrate de que el archivo contiene movimientos de al menos 1-2 meses.')
        return
      }
      setCsvStatus('done')
      setCsvMessage(`${data.found} suscripciones detectadas.`)
      setTimeout(() => router.refresh(), 1500)
    } catch (err: any) {
      setCsvStatus('error')
      setCsvMessage(err.message || 'Error al procesar el archivo.')
    }
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
      const res = await fetch('/api/subscriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, subscription_id: subId }),
      })
      const data = await res.json()
      if (data.email) setEmailDraft(data.email)
      setActiveId(subId)
    } finally { setLoadingAction(null) }
  }

  async function handleStatusChange(subId: string, status: string) {
    const res = await fetch('/api/subscriptions', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: subId, status }),
    })
    if (res.ok) setSubs(prev => prev.map(s => s.id === subId ? { ...s, status } : s))
  }

  const active = subs.filter(s => s.status === 'active')
  const cancelled = subs.filter(s => s.status === 'cancelled')
  const monthlyTotal = active.reduce((s, sub) => s + (sub.amount ? toMonthly(sub.amount, sub.frequency) : 0), 0)
  const top3 = [...active].filter(s => s.amount).sort((a, b) => toMonthly(b.amount!, b.frequency) - toMonthly(a.amount!, a.frequency)).slice(0, 3)

  return (
    <div className="app-shell">
      <Sidebar email={user.email} />

      <div className="app-main">
        {/* Header */}
        <header className="page-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div className="page-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/></svg>
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--txt)', letterSpacing: '-.02em' }}>Dashboard</div>
              <div style={{ fontSize: 12, color: 'var(--txt3)' }}>Resumen de tus suscripciones</div>
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

          {/* Alert banner */}
          {justConnected && (
            <div style={{ background: 'var(--success-bg)', border: '1px solid #A7F3D0', borderRadius: 12, padding: '13px 18px', marginBottom: 22, fontSize: 13, color: 'var(--success)', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 10 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
              Cuenta conectada. {scanningNow ? 'Escaneando movimientos...' : 'Escaneo completado.'}
            </div>
          )}

          {/* CSV status */}
          {csvStatus !== 'idle' && (
            <div style={{ marginBottom: 20, fontSize: 13, padding: '11px 16px', borderRadius: 10, background: csvStatus === 'error' ? 'var(--danger-bg)' : csvStatus === 'done' ? 'var(--success-bg)' : 'var(--border2)', color: csvStatus === 'error' ? 'var(--danger)' : csvStatus === 'done' ? 'var(--success)' : 'var(--txt2)', border: `1px solid ${csvStatus === 'error' ? '#FECACA' : csvStatus === 'done' ? '#A7F3D0' : 'var(--border)'}` }}>
              {csvMessage}
            </div>
          )}

          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: 28 }}>
            {[
              { label: 'Suscripciones activas', value: active.length, note: 'detectadas', color: 'var(--txt)' },
              { label: 'Coste mensual', value: `${monthlyTotal.toFixed(2)}€`, note: 'al mes', color: 'var(--danger)' },
              { label: 'Coste anual', value: `${(monthlyTotal * 12).toFixed(0)}€`, note: 'estimado', color: 'var(--warn)' },
              { label: 'Canceladas', value: cancelled.length, note: `${cancelled.filter(s => s.amount).reduce((s, sub) => s + toMonthly(sub.amount!, sub.frequency), 0).toFixed(0)}€/mes ahorrado`, color: 'var(--accent)' },
            ].map(s => (
              <div key={s.label} className="stat-card">
                <div className="stat-label">{s.label}</div>
                <div className="stat-value" style={{ color: s.color }}>{s.value}</div>
                <div className="stat-note">{s.note}</div>
              </div>
            ))}
          </div>

          {/* Connect banner */}
          {subs.length === 0 && !scanningNow && (
            <div className="card" style={{ padding: 24, marginBottom: 28 }}>
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

                <label style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', border: '1px solid var(--border)', borderRadius: 12, cursor: 'pointer', transition: 'border-color .12s, box-shadow .12s' }}>
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

                <Link href="/connect" style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', border: '1px solid var(--border2)', borderRadius: 12, textDecoration: 'none', transition: 'border-color .12s' }}>
                  <div style={{ width: 38, height: 38, borderRadius: 10, background: '#FEF2F2', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 14, fontWeight: 800, color: '#DC2626' }}>G</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--txt)' }}>Conectar Gmail</div>
                    <div style={{ fontSize: 12, color: 'var(--txt3)', marginTop: 2 }}>Detecta suscripciones a través de tus facturas por email</div>
                  </div>
                  <span style={{ color: 'var(--txt3)', flexShrink: 0 }}>→</span>
                </Link>

              </div>
            </div>
          )}

          {/* Savings opportunities */}
          {top3.length > 0 && (
            <div className="card" style={{ padding: 22, marginBottom: 28 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--txt)' }}>Oportunidades de ahorro</div>
                  <div style={{ fontSize: 12, color: 'var(--txt3)', marginTop: 1 }}>Tus suscripciones más costosas</div>
                </div>
                <Link href="/recurrentes" style={{ fontSize: 12, color: 'var(--accent)', fontWeight: 600, textDecoration: 'none' }}>Ver todas →</Link>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {top3.map((sub, i) => {
                  const monthly = toMonthly(sub.amount!, sub.frequency)
                  return (
                    <div key={sub.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', background: 'var(--bg)', borderRadius: 10 }}>
                      <div style={{ width: 22, height: 22, borderRadius: '50%', background: i === 0 ? '#FEF3C7' : 'var(--border2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 800, color: i === 0 ? '#92400E' : 'var(--txt3)', flexShrink: 0 }}>
                        {i + 1}
                      </div>
                      <SubIcon name={sub.name} category={sub.category} provider={sub.provider} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--txt)' }}>{sub.name}</div>
                        <div style={{ fontSize: 11, color: 'var(--txt3)' }}>{CAT_LABEL[sub.category]}</div>
                      </div>
                      <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--txt)', fontVariantNumeric: 'tabular-nums', flexShrink: 0 }}>
                        {monthly.toFixed(2)}€<span style={{ fontSize: 10, fontWeight: 400, color: 'var(--txt3)' }}>/mes</span>
                      </div>
                      <button onClick={() => handleAction(sub.id, 'negotiate_email')} disabled={loadingAction !== null} className="btn btn-secondary" style={{ fontSize: 11, padding: '5px 10px' }}>
                        Negociar
                      </button>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Subscription list */}
          {active.length > 0 && (
            <div style={{ marginBottom: 32 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                <h2 style={{ fontSize: 14, fontWeight: 700, color: 'var(--txt)' }}>Suscripciones activas</h2>
                <span style={{ fontSize: 12, color: 'var(--txt3)' }}>{active.length} encontradas</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {active.map(sub => (
                  <div key={sub.id} className="sub-card">
                    <div className="sub-card-stripe" style={{ background: CAT_COLOR[sub.category] || CAT_COLOR.other }} />
                    <div className="sub-card-body">
                      <SubIcon name={sub.name} category={sub.category} provider={sub.provider} />
                      <div style={{ flex: 1, minWidth: 140 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 2, flexWrap: 'wrap' }}>
                          <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--txt)' }}>{sub.name}</span>
                          <span className="badge badge-neutral">{CAT_LABEL[sub.category] || sub.category}</span>
                          {sub.confidence === 'low' && <span className="badge badge-warn">Verificar</span>}
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--txt3)' }}>
                          {sub.provider}{sub.last_charge_date && ` · ${sub.last_charge_date}`}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right', flexShrink: 0, minWidth: 80 }}>
                        <div style={{ fontSize: 17, fontWeight: 800, color: 'var(--txt)', fontVariantNumeric: 'tabular-nums', letterSpacing: '-.02em' }}>
                          {sub.amount ? `${sub.amount.toFixed(2)} ${sub.currency}` : '—'}
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--txt3)' }}>
                          {sub.frequency === 'monthly' ? '/mes' : sub.frequency === 'annual' ? '/año' : ''}
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 7, flexShrink: 0 }}>
                        <button onClick={() => handleAction(sub.id, 'negotiate_email')} disabled={loadingAction !== null} className="btn btn-secondary" style={{ fontSize: 12, padding: '7px 13px' }}>
                          {loadingAction === `${sub.id}_negotiate_email` ? '…' : 'Negociar'}
                        </button>
                        <button onClick={() => handleAction(sub.id, 'cancel_email')} disabled={loadingAction !== null} className="btn btn-danger" style={{ fontSize: 12, padding: '7px 13px' }}>
                          {loadingAction === `${sub.id}_cancel_email` ? '…' : 'Cancelar'}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Empty state */}
          {active.length === 0 && subs.length > 0 && !scanningNow && (
            <div className="card" style={{ padding: '48px 24px', textAlign: 'center' }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--txt3)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block', margin: '0 auto 14px' }}><polyline points="20 6 9 17 4 12"/></svg>
              <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--txt)', marginBottom: 5 }}>Todo bajo control</div>
              <div style={{ fontSize: 13, color: 'var(--txt2)' }}>No tienes suscripciones activas. ¡Buen trabajo!</div>
            </div>
          )}

          {/* Cancelled */}
          {cancelled.length > 0 && (
            <div>
              <h3 style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.07em', color: 'var(--txt3)', marginBottom: 10 }}>
                Canceladas ({cancelled.length})
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {cancelled.map(sub => (
                  <div key={sub.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px', background: 'var(--card)', border: '1px solid var(--border2)', borderRadius: 12, opacity: .6 }}>
                    <div style={{ width: 3, height: 32, borderRadius: 2, background: 'var(--border)', flexShrink: 0 }} />
                    <span style={{ fontSize: 13, color: 'var(--txt)', flex: 1, textDecoration: 'line-through' }}>{sub.name}</span>
                    {sub.amount && <span style={{ fontSize: 12, color: 'var(--accent)', fontWeight: 700 }}>+{sub.amount.toFixed(2)}€/mes</span>}
                    <button onClick={() => handleStatusChange(sub.id, 'active')} className="btn btn-secondary" style={{ fontSize: 11, padding: '4px 10px' }}>Reactivar</button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Email modal */}
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
                <button onClick={() => { handleStatusChange(activeId, 'cancelled'); setEmailDraft(null); setActiveId(null) }} style={{ fontSize: 12, color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer', padding: '2px 0', textAlign: 'left' }}>
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
