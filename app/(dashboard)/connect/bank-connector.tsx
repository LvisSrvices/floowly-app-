'use client'

import { useState, useEffect } from 'react'

type Institution = {
  id: string
  name: string
  bic: string
  logo: string
}

const COUNTRIES = [
  { code: 'ES', label: 'España' },
  { code: 'MX', label: 'México' },
  { code: 'CO', label: 'Colombia' },
  { code: 'AR', label: 'Argentina' },
  { code: 'CL', label: 'Chile' },
  { code: 'PE', label: 'Perú' },
  { code: 'BR', label: 'Brasil' },
]

export default function BankConnector({ userId }: { userId: string }) {
  const [country, setCountry] = useState('ES')
  const [institutions, setInstitutions] = useState<Institution[]>([])
  const [loading, setLoading] = useState(false)
  const [connecting, setConnecting] = useState(false)
  const [search, setSearch] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    setLoading(true)
    setInstitutions([])
    setSearch('')
    fetch(`/api/bank/institutions?country=${country}`)
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) setInstitutions(data)
        else setError('No se pudieron cargar los bancos.')
      })
      .catch(() => setError('Error al cargar bancos.'))
      .finally(() => setLoading(false))
  }, [country])

  async function handleSelect(institutionId: string) {
    setConnecting(true)
    setError('')
    try {
      const res = await fetch('/api/bank/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ institution_id: institutionId, user_id: userId, country }),
      })
      const data = await res.json()
      if (data.link) {
        window.location.href = data.link
      } else {
        setError(data.error || 'Error al conectar banco.')
        setConnecting(false)
      }
    } catch {
      setError('Error de red.')
      setConnecting(false)
    }
  }

  const filtered = institutions.filter(i =>
    i.name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="card" style={{ padding: 20 }}>
      {/* Country selector */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
        {COUNTRIES.map(c => (
          <button
            key={c.code}
            onClick={() => setCountry(c.code)}
            style={{
              padding: '5px 12px',
              borderRadius: 20,
              border: '1px solid var(--border)',
              background: country === c.code ? 'var(--accent)' : 'var(--surface)',
              color: country === c.code ? '#fff' : 'var(--txt2)',
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            {c.label}
          </button>
        ))}
      </div>

      {/* Search */}
      <input
        type="text"
        placeholder="Busca tu banco..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        style={{ marginBottom: 12 }}
      />

      {error && (
        <div style={{ fontSize: 13, color: 'var(--danger)', marginBottom: 12 }}>{error}</div>
      )}

      {/* Institution list */}
      {loading ? (
        <div style={{ fontSize: 13, color: 'var(--txt3)', textAlign: 'center', padding: '20px 0' }}>
          Cargando bancos...
        </div>
      ) : (
        <div style={{ maxHeight: 280, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
          {filtered.slice(0, 40).map(inst => (
            <button
              key={inst.id}
              onClick={() => handleSelect(inst.id)}
              disabled={connecting}
              style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '10px 12px', borderRadius: 8,
                border: '1px solid var(--border2)', background: 'var(--surface)',
                cursor: 'pointer', textAlign: 'left', width: '100%',
                opacity: connecting ? .5 : 1,
              }}
            >
              {inst.logo ? (
                <img src={inst.logo} alt={inst.name} style={{ width: 28, height: 28, borderRadius: 6, objectFit: 'contain', flexShrink: 0 }} />
              ) : (
                <div style={{ width: 28, height: 28, borderRadius: 6, background: 'var(--border)', flexShrink: 0 }} />
              )}
              <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--txt)' }}>{inst.name}</span>
              <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--txt3)' }}>→</span>
            </button>
          ))}
          {filtered.length === 0 && !loading && (
            <div style={{ fontSize: 13, color: 'var(--txt3)', textAlign: 'center', padding: '16px 0' }}>
              No se encontró "{search}"
            </div>
          )}
        </div>
      )}

      {connecting && (
        <div style={{ fontSize: 13, color: 'var(--accent)', textAlign: 'center', marginTop: 12 }}>
          Redirigiendo a tu banco...
        </div>
      )}
    </div>
  )
}
