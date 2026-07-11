'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Sidebar from '@/components/Sidebar'

type Subscription = {
  id: string; name: string; provider: string; amount: number | null
  currency: string; frequency: string; category: string; status: string
  confidence: string; detected_via: string; last_charge_date: string | null; created_at: string
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
  'amazon prime': 'amazon.es', apple: 'apple.com', icloud: 'apple.com',
  google: 'google.com', 'youtube premium': 'youtube.com', youtube: 'youtube.com',
  microsoft: 'microsoft.com', xbox: 'xbox.com', adobe: 'adobe.com',
  hbo: 'max.com', 'hbo max': 'max.com', max: 'max.com',
  disney: 'disneyplus.com', 'disney+': 'disneyplus.com', dazn: 'dazn.com',
  filmin: 'filmin.es', movistar: 'movistar.es', vodafone: 'vodafone.es',
  orange: 'orange.es', jazztel: 'jazztel.com', masmovil: 'masmovil.es',
  mapfre: 'mapfre.es', axa: 'axa.es', sanitas: 'sanitas.es',
  notion: 'notion.so', figma: 'figma.com', github: 'github.com',
  slack: 'slack.com', dropbox: 'dropbox.com', canva: 'canva.com',
  openai: 'openai.com', linkedin: 'linkedin.com', twitch: 'twitch.tv',
  nintendo: 'nintendo.com', playstation: 'playstation.com',
  paramount: 'paramountplus.com', duolingo: 'duolingo.com', zoom: 'zoom.us',
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

function SubLogo({ name, provider, category }: { name: string; provider: string; category: string }) {
  const [failed, setFailed] = useState(false)
  const domain = getLogoDomain(name, provider)
  const color = CAT_COLOR[category] || CAT_COLOR.other
  if (domain && !failed) {
    return (
      <div style={{ width: 42, height: 42, borderRadius: 11, background: '#fff', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, padding: 5 }}>
        <img src={`https://logo.clearbit.com/${domain}`} alt={name} width={30} height={30} style={{ objectFit: 'contain', borderRadius: 5 }} onError={() => setFailed(true)} />
      </div>
    )
  }
  return (
    <div style={{ width: 42, height: 42, borderRadius: 11, background: color + '15', border: `1px solid ${color}25`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 14, fontWeight: 800, color }}>
      {name.slice(0, 2).toUpperCase()}
    </div>
  )
}

function toMonthly(amount: number, frequency: string) {
  if (frequency === 'annual') return amount / 12
  if (frequency === 'weekly') return amount * 4.33
  return amount
}

const CATEGORIES = ['all', 'streaming', 'software', 'telecom', 'insurance', 'gym', 'news', 'other']

export default function RecurrentesClient({
  user, subscriptions,
}: {
  user: { id: string; email: string }
  subscriptions: Subscription[]
}) {
  const [subs, setSubs] = useState(subscriptions)
  const [catFilter, setCatFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState<'active' | 'cancelled' | 'all'>('active')
  const [sortBy, setSortBy] = useState<'amount' | 'name' | 'date'>('amount')
  const [emailDraft, setEmailDraft] = useState<{ subject: string; body: string } | null>(null)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [loadingAction, setLoadingAction] = useState<string | null>(null)
  const router = useRouter()

  const filtered = subs
    .filter(s => catFilter === 'all' || s.category === catFilter)
    .filter(s => statusFilter === 'all' || s.status === statusFilter)
    .sort((a, b) => {
      if (sortBy === 'amount') return toMonthly(b.amount || 0, b.frequency) - toMonthly(a.amount || 0, a.frequency)
      if (sortBy === 'name') return a.name.localeCompare(b.name)
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })

  const active = subs.filter(s => s.status === 'active')
  const monthlyTotal = active.reduce((s, sub) => s + (sub.amount ? toMonthly(sub.amount, sub.frequency) : 0), 0)
  const cancelledSavings = subs.filter(s => s.status === 'cancelled' && s.amount).reduce((s, sub) => s + toMonthly(sub.amount!, sub.frequency), 0)

  async function handleAction(subId: string, action: 'cancel_email' | 'negotiate_email') {
    setLoadingAction(`${subId}_${action}`)
    try {
      const res = await fetch('/api/subscriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, subscription_id: subId }),
      })
      const data = await res.json()
      if (data.email) { setEmailDraft(data.email); setActiveId(subId) }
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

  return (
    <div className="app-shell">
      <Sidebar email={user.email} />

      <div className="app-main">
        <header className="page-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div className="page-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--txt)', letterSpacing: '-.02em' }}>Recurrentes</div>
              <div style={{ fontSize: 12, color: 'var(--txt3)' }}>{active.length} activas · {monthlyTotal.toFixed(2)}€/mes</div>
            </div>
          </div>
          <select value={sortBy} onChange={e => setSortBy(e.target.value as any)} className="btn btn-secondary" style={{ fontSize: 12, padding: '7px 12px', cursor: 'pointer' }}>
            <option value="amount">Mayor importe</option>
            <option value="name">Nombre A-Z</option>
            <option value="date">Más recientes</option>
          </select>
        </header>

        <div className="page-content">

          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
            {[
              { label: 'Activas', value: active.length, note: 'suscripciones', color: 'var(--txt)' },
              { label: 'Total mensual', value: `${monthlyTotal.toFixed(2)}€`, note: 'al mes', color: 'var(--danger)' },
              { label: 'Total anual', value: `${(monthlyTotal * 12).toFixed(0)}€`, note: 'estimado', color: 'var(--warn)' },
              { label: 'Ahorrado', value: cancelledSavings > 0 ? `${cancelledSavings.toFixed(2)}€` : '—', note: 'cancelando', color: 'var(--accent)' },
            ].map(s => (
              <div key={s.label} className="stat-card" style={{ padding: '16px 18px' }}>
                <div className="stat-label">{s.label}</div>
                <div className="stat-value" style={{ fontSize: 20, color: s.color }}>{s.value}</div>
                <div className="stat-note">{s.note}</div>
              </div>
            ))}
          </div>

          {/* Status tabs */}
          <div style={{ display: 'flex', gap: 4, marginBottom: 16 }}>
            {(['active', 'cancelled', 'all'] as const).map(s => (
              <button key={s} onClick={() => setStatusFilter(s)} style={{ padding: '7px 16px', borderRadius: 9, border: '1px solid', fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'all .12s', borderColor: statusFilter === s ? 'var(--accent)' : 'var(--border)', background: statusFilter === s ? 'var(--accent-dim)' : 'var(--card)', color: statusFilter === s ? 'var(--accent)' : 'var(--txt2)' }}>
                {s === 'active' ? `Activas (${subs.filter(x => x.status === 'active').length})` : s === 'cancelled' ? `Canceladas (${subs.filter(x => x.status === 'cancelled').length})` : 'Todas'}
              </button>
            ))}
          </div>

          {/* Category filters */}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 20 }}>
            {CATEGORIES.map(cat => (
              <button key={cat} onClick={() => setCatFilter(cat)} style={{ padding: '5px 13px', borderRadius: 20, border: '1px solid', fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'all .12s', borderColor: catFilter === cat ? (CAT_COLOR[cat] || 'var(--accent)') : 'var(--border)', background: catFilter === cat ? ((CAT_COLOR[cat] || '#059669') + '15') : 'var(--card)', color: catFilter === cat ? (CAT_COLOR[cat] || 'var(--accent)') : 'var(--txt3)' }}>
                {cat === 'all' ? 'Todas' : CAT_LABEL[cat]}
              </button>
            ))}
          </div>

          {/* List */}
          {filtered.length === 0 ? (
            <div className="card" style={{ padding: '48px 24px', textAlign: 'center' }}>
              <div style={{ fontSize: 14, color: 'var(--txt3)' }}>No hay suscripciones en este filtro.</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {filtered.map(sub => (
                <div key={sub.id} className="sub-card">
                  <div className="sub-card-stripe" style={{ background: sub.status === 'cancelled' ? 'var(--border)' : (CAT_COLOR[sub.category] || CAT_COLOR.other) }} />
                  <div className="sub-card-body" style={{ opacity: sub.status === 'cancelled' ? .55 : 1 }}>
                    <SubLogo name={sub.name} provider={sub.provider} category={sub.category} />
                    <div style={{ flex: 1, minWidth: 140 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 3, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--txt)', textDecoration: sub.status === 'cancelled' ? 'line-through' : 'none' }}>{sub.name}</span>
                        <span className="badge badge-neutral">{CAT_LABEL[sub.category] || sub.category}</span>
                        {sub.status === 'cancelled' && <span className="badge badge-green">Cancelada</span>}
                        {sub.confidence === 'low' && <span className="badge badge-warn">Verificar</span>}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--txt3)', display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                        <span>{sub.provider}</span>
                        {sub.last_charge_date && <span>Último cargo: {sub.last_charge_date}</span>}
                        <span>{sub.detected_via === 'csv' ? 'Extracto bancario' : sub.detected_via === 'email' ? 'Gmail' : sub.detected_via}</span>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0, minWidth: 90 }}>
                      <div style={{ fontSize: 17, fontWeight: 800, color: sub.status === 'cancelled' ? 'var(--txt3)' : 'var(--txt)', fontVariantNumeric: 'tabular-nums', letterSpacing: '-.02em' }}>
                        {sub.amount ? `${sub.amount.toFixed(2)} ${sub.currency}` : '—'}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--txt3)' }}>
                        {sub.frequency === 'monthly' ? '/mes' : sub.frequency === 'annual' ? '/año' : sub.frequency === 'weekly' ? '/sem' : ''}
                      </div>
                    </div>
                    {sub.status === 'active' ? (
                      <div style={{ display: 'flex', gap: 7, flexShrink: 0 }}>
                        <button onClick={() => handleAction(sub.id, 'negotiate_email')} disabled={loadingAction !== null} className="btn btn-secondary" style={{ fontSize: 12, padding: '7px 13px' }}>
                          {loadingAction === `${sub.id}_negotiate_email` ? '…' : 'Negociar'}
                        </button>
                        <button onClick={() => handleAction(sub.id, 'cancel_email')} disabled={loadingAction !== null} className="btn btn-danger" style={{ fontSize: 12, padding: '7px 13px' }}>
                          {loadingAction === `${sub.id}_cancel_email` ? '…' : 'Cancelar'}
                        </button>
                      </div>
                    ) : (
                      <button onClick={() => handleStatusChange(sub.id, 'active')} className="btn btn-secondary" style={{ fontSize: 12, padding: '7px 13px' }}>
                        Reactivar
                      </button>
                    )}
                  </div>
                </div>
              ))}
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
                <button onClick={() => navigator.clipboard.writeText(`Asunto: ${emailDraft.subject}\n\n${emailDraft.body}`)} className="btn btn-secondary" style={{ flex: 1 }}>Copiar</button>
                <a href={`mailto:?subject=${encodeURIComponent(emailDraft.subject)}&body=${encodeURIComponent(emailDraft.body)}`} className="btn btn-primary" style={{ flex: 1, justifyContent: 'center', textDecoration: 'none' }}>Abrir en email →</a>
              </div>
              {activeId && (
                <button onClick={() => { handleStatusChange(activeId, 'cancelled'); setEmailDraft(null); setActiveId(null) }} style={{ fontSize: 12, color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}>
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
