'use client'

import { useState, useEffect, useMemo } from 'react'

type Institution = { id: string; name: string; bic: string; logo: string }

const POPULAR_IDS = [
  'BBVA', 'SANTANDER', 'CAIXABANK', 'ING', 'SABADELL',
  'BANKINTER', 'UNICAJA', 'KUTXABANK', 'IBERCAJA',
]

const COUNTRIES = [
  { code: 'ES', label: 'España' },
  { code: 'MX', label: 'México' },
  { code: 'CO', label: 'Colombia' },
  { code: 'AR', label: 'Argentina' },
  { code: 'CL', label: 'Chile' },
  { code: 'GB', label: 'Reino Unido' },
  { code: 'DE', label: 'Alemania' },
  { code: 'FR', label: 'Francia' },
]

export default function BankConnector({ userId }: { userId: string }) {
  const [country, setCountry]           = useState('ES')
  const [institutions, setInstitutions] = useState<Institution[]>([])
  const [loading, setLoading]           = useState(false)
  const [connectingId, setConnectingId] = useState<string | null>(null)
  const [search, setSearch]             = useState('')
  const [error, setError]               = useState('')
  const [expanded, setExpanded]         = useState(false)

  useEffect(() => {
    if (!expanded) return
    setLoading(true)
    setInstitutions([])
    setSearch('')
    setError('')
    fetch(`/api/bank/institutions?country=${country}`)
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) setInstitutions(data)
        else setError(data.error || 'No se pudieron cargar los bancos.')
      })
      .catch(() => setError('Error de red al cargar bancos.'))
      .finally(() => setLoading(false))
  }, [country, expanded])

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    let list = institutions
    if (q) return list.filter(i => i.name.toLowerCase().includes(q))
    // popular first
    const popular = list.filter(i => POPULAR_IDS.some(p => i.id.toUpperCase().includes(p)))
    const rest     = list.filter(i => !POPULAR_IDS.some(p => i.id.toUpperCase().includes(p)))
    return [...popular, ...rest]
  }, [institutions, search])

  async function handleSelect(inst: Institution) {
    if (connectingId) return
    setConnectingId(inst.id)
    setError('')
    try {
      const res  = await fetch('/api/bank/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ institution_id: inst.id, user_id: userId, country }),
      })
      const data = await res.json()
      if (data.link) {
        window.location.href = data.link
      } else {
        setError(data.error || 'Error al iniciar la conexión con el banco.')
        setConnectingId(null)
      }
    } catch {
      setError('Error de red. Inténtalo de nuevo.')
      setConnectingId(null)
    }
  }

  // Collapsed CTA
  if (!expanded) {
    return (
      <button onClick={() => setExpanded(true)} className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
        </svg>
        Seleccionar mi banco
      </button>
    )
  }

  return (
    <div>
      {/* Country + search row */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <select value={country} onChange={e => { setCountry(e.target.value); setSearch('') }}
          style={{ fontSize: 12, padding: '8px 10px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--card)', color: 'var(--txt)', cursor: 'pointer', flexShrink: 0 }}>
          {COUNTRIES.map(c => <option key={c.code} value={c.code}>{c.label}</option>)}
        </select>
        <div style={{ position: 'relative', flex: 1 }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--txt3)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Busca tu banco..." style={{ paddingLeft: 32, width: '100%', fontSize: 13 }} />
        </div>
      </div>

      {error && (
        <div style={{ fontSize: 12, color: '#B91C1C', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, padding: '10px 12px', marginBottom: 10 }}>
          {error}
        </div>
      )}

      {/* Skeleton loader */}
      {loading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {[...Array(6)].map((_, i) => (
            <div key={i} style={{ height: 52, borderRadius: 10, background: 'var(--bg)', opacity: 1 - i * 0.12 }}>
              <style>{`@keyframes shimmer{0%{background-position:-400px 0}100%{background-position:400px 0}}`}</style>
              <div style={{ height: '100%', borderRadius: 10, background: 'linear-gradient(90deg,var(--bg) 25%,var(--border2) 50%,var(--bg) 75%)', backgroundSize: '800px 100%', animation: 'shimmer 1.4s infinite' }} />
            </div>
          ))}
        </div>
      )}

      {/* Bank list */}
      {!loading && filtered.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 320, overflowY: 'auto', paddingRight: 2 }}>
          {!search && (
            <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--txt3)', padding: '4px 4px 6px' }}>
              Bancos populares
            </div>
          )}
          {filtered.map((inst, idx) => {
            const isPopular = !search && POPULAR_IDS.some(p => inst.id.toUpperCase().includes(p))
            const showDivider = !search && idx > 0 && !isPopular && POPULAR_IDS.some(p => filtered[idx - 1]?.id.toUpperCase().includes(p))
            return (
              <div key={inst.id}>
                {showDivider && (
                  <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--txt3)', padding: '10px 4px 6px' }}>
                    Todos los bancos
                  </div>
                )}
                <button
                  onClick={() => handleSelect(inst)}
                  disabled={connectingId !== null}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12, width: '100%',
                    padding: '10px 12px', borderRadius: 10, textAlign: 'left', cursor: connectingId ? 'not-allowed' : 'pointer',
                    background: connectingId === inst.id ? 'var(--accent-dim)' : 'var(--bg)',
                    border: `1px solid ${connectingId === inst.id ? 'var(--accent)' : 'var(--border2)'}`,
                    opacity: connectingId !== null && connectingId !== inst.id ? 0.45 : 1,
                    transition: 'all .12s',
                  }}
                  onMouseEnter={e => { if (!connectingId) { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.background = 'var(--accent-dim)' } }}
                  onMouseLeave={e => { if (!connectingId) { e.currentTarget.style.borderColor = 'var(--border2)'; e.currentTarget.style.background = 'var(--bg)' } }}
                >
                  <div style={{ width: 34, height: 34, borderRadius: 8, background: '#fff', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden' }}>
                    {inst.logo
                      ? <img src={inst.logo} alt={inst.name} width={26} height={26} style={{ objectFit: 'contain' }} />
                      : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--txt3)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>
                    }
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--txt)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {inst.name}
                  </span>
                  {connectingId === inst.id
                    ? <span style={{ fontSize: 11, color: 'var(--accent)', fontWeight: 700, flexShrink: 0 }}>Conectando…</span>
                    : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--txt3)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}><polyline points="9 18 15 12 9 6"/></svg>
                  }
                </button>
              </div>
            )
          })}
        </div>
      )}

      {!loading && filtered.length === 0 && !error && (
        <div style={{ textAlign: 'center', padding: '20px 0', fontSize: 13, color: 'var(--txt3)' }}>
          No se encontró "{search}"
        </div>
      )}

      <p style={{ fontSize: 11, color: 'var(--txt3)', marginTop: 12, lineHeight: 1.6 }}>
        Te redirigiremos a tu banco para autorizar el acceso de <strong>solo lectura</strong>. Nunca realizamos pagos ni almacenamos tus credenciales.
      </p>
    </div>
  )
}
