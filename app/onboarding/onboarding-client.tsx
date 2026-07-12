'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import * as XLSX from 'xlsx'
import { createBrowserClient } from '@/lib/supabase/client'

type Step = 1 | 2 | 3 | 4

const NAV_STEPS = [
  { n: 1 as Step, label: 'Elige tus objetivos' },
  { n: 2 as Step, label: 'Conecta tus cuentas' },
  { n: 3 as Step, label: 'Cuéntanos más' },
  { n: 4 as Step, label: 'Activar' },
]

const GOALS = [
  { id: 'cancel',  icon: '🗑️', title: 'Cancelar lo que no uso' },
  { id: 'save',    icon: '💰', title: 'Ahorrar más cada mes' },
  { id: 'control', icon: '📊', title: 'Ver todos mis gastos' },
  { id: 'bills',   icon: '📉', title: 'Negociar mejores precios' },
]

const SPEND = [
  { id: '<30',    label: 'Menos de 30€' },
  { id: '30-60',  label: '30 – 60€' },
  { id: '60-100', label: '60 – 100€' },
  { id: '100+',   label: 'Más de 100€' },
]

const SERVICES = [
  { name: 'Netflix',   bg: '#E50914', color: '#fff',    letter: 'N' },
  { name: 'Spotify',   bg: '#1DB954', color: '#fff',    letter: 'S' },
  { name: 'Amazon',    bg: '#FF9900', color: '#fff',    letter: 'a' },
  { name: 'Disney+',   bg: '#113CCF', color: '#fff',    letter: 'D+' },
  { name: 'HBO',       bg: '#5822B4', color: '#fff',    letter: 'H' },
  { name: 'YouTube',   bg: '#FF0000', color: '#fff',    letter: '▶' },
  { name: 'Apple TV',  bg: '#000000', color: '#fff',    letter: '🍎' },
  { name: 'Adobe',     bg: '#FA0F00', color: '#fff',    letter: 'A' },
  { name: 'Movistar',  bg: '#009BE8', color: '#fff',    letter: 'M+' },
  { name: 'DAZN',      bg: '#222222', color: '#F5FF00', letter: 'D' },
  { name: 'Dropbox',   bg: '#0061FF', color: '#fff',    letter: 'Db' },
  { name: 'LinkedIn',  bg: '#0077B5', color: '#fff',    letter: 'in' },
  { name: 'Slack',     bg: '#4A154B', color: '#fff',    letter: 'S' },
  { name: 'Microsoft', bg: '#D83B01', color: '#fff',    letter: 'M' },
  { name: 'Audible',   bg: '#F88F00', color: '#fff',    letter: 'Au' },
  { name: 'iCloud',    bg: '#1877F2', color: '#fff',    letter: '☁' },
  { name: '1Password', bg: '#1A8EF0', color: '#fff',    letter: '1P' },
  { name: 'Twitch',    bg: '#9146FF', color: '#fff',    letter: 'T' },
  { name: 'Canva',     bg: '#7D2AE8', color: '#fff',    letter: 'C' },
  { name: 'Notion',    bg: '#000000', color: '#fff',    letter: 'N' },
]

const ACCENT = '#0f9b8e'
const ACCENT_LIGHT = '#e8f7f6'

function ServiceIcon({ s }: { s: typeof SERVICES[0] }) {
  return (
    <div style={{
      width: 60, height: 60, borderRadius: 16, background: s.bg, color: s.color,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: s.letter.length > 1 ? 13 : 20, fontWeight: 900, flexShrink: 0,
      boxShadow: '0 2px 8px rgba(0,0,0,.12)',
    }}>
      {s.letter}
    </div>
  )
}

function Marquee() {
  const row1 = SERVICES.slice(0, 10)
  const row2 = SERVICES.slice(10)
  return (
    <div style={{ overflow: 'hidden', width: '100%' }}>
      <style>{`
        @keyframes scroll-left  { from{transform:translateX(0)} to{transform:translateX(-50%)} }
        @keyframes scroll-right { from{transform:translateX(-50%)} to{transform:translateX(0)} }
        .mq-row { display:flex; gap:12px; width:max-content; }
        .mq-r1  { animation:scroll-left  22s linear infinite; }
        .mq-r2  { animation:scroll-right 26s linear infinite; margin-top:12px; }
      `}</style>
      <div className="mq-row mq-r1">{[...row1,...row1].map((s,i)=><ServiceIcon key={i} s={s}/>)}</div>
      <div className="mq-row mq-r2">{[...row2,...row2].map((s,i)=><ServiceIcon key={i} s={s}/>)}</div>
    </div>
  )
}

export default function OnboardingClient({ user }: { user: { id: string; email: string } }) {
  const [step, setStep] = useState<Step>(1)
  const [goals, setGoals] = useState<string[]>([])
  const [spend, setSpend] = useState('')
  const [csvStatus, setCsvStatus] = useState<'idle'|'parsing'|'done'|'error'>('idle')
  const [csvMessage, setCsvMessage] = useState('')
  const [found, setFound] = useState(0)
  const [bankAdded, setBankAdded] = useState(false)
  const [gmailAdded, setGmailAdded] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const router = useRouter()
  const supabase = createBrowserClient()

  function toggleGoal(id: string) {
    setGoals(prev => prev.includes(id) ? prev.filter(g => g !== id) : [...prev, id])
  }

  async function advance(next: Step) {
    if (next === 3) await supabase.auth.updateUser({ data: { onboarding_goals: goals } })
    if (next === 4) await supabase.auth.updateUser({ data: { onboarding_spend: spend } })
    setStep(next)
  }

  async function finish() {
    await supabase.auth.updateUser({ data: { onboarding_completed: true } })
    router.push('/dashboard')
  }

  async function handleCsvUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setCsvStatus('parsing')
    setCsvMessage('Analizando tus movimientos…')
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
      setFound(data.found || 0)
      setCsvStatus('done')
      setBankAdded(true)
      setCsvMessage(`${data.found} suscripciones encontradas`)
    } catch (err: any) {
      setCsvStatus('error')
      setCsvMessage(err.message || 'Error al procesar el archivo.')
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F7F8FA', fontFamily: "-apple-system,BlinkMacSystemFont,'Inter',system-ui,sans-serif", WebkitFontSmoothing: 'antialiased', display: 'flex', flexDirection: 'column' }}>

      {/* Top bar — Rocket Money style */}
      <header style={{ background: '#fff', borderBottom: '1px solid #E5E9F0' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 32px', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <img src="/logo.png" alt="Floowly" width={30} height={30} style={{ display: 'block' }} />
            <img src="/wordmark.png" alt="Floowly Money" style={{ height: 17, width: 'auto' }} />
          </div>

          <nav style={{ display: 'flex', alignItems: 'center' }}>
            {NAV_STEPS.map((s, i) => (
              <div key={s.n} style={{ display: 'flex', alignItems: 'center' }}>
                <span
                  onClick={() => step > s.n && setStep(s.n)}
                  style={{
                    fontSize: 13, fontWeight: step === s.n ? 700 : 500, padding: '6px 16px',
                    color: step === s.n ? ACCENT : step > s.n ? '#475569' : '#BCC5D3',
                    borderBottom: step === s.n ? `2px solid ${ACCENT}` : '2px solid transparent',
                    cursor: step > s.n ? 'pointer' : 'default', transition: 'all .2s',
                  }}>
                  {s.label}
                </span>
                {i < NAV_STEPS.length - 1 && (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#CBD5E0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
                )}
              </div>
            ))}
          </nav>

          <button onClick={finish} style={{ fontSize: 12, color: '#94A3B8', background: 'none', border: 'none', cursor: 'pointer' }}>
            Omitir →
          </button>
        </div>
      </header>

      {/* Content */}
      <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px 20px' }}>

        {/* ── Step 1: Elige tus objetivos ── */}
        {step === 1 && (
          <div style={{ maxWidth: 860, width: '100%', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 56, alignItems: 'start' }}>
            <div>
              <h1 style={{ fontSize: 36, fontWeight: 900, color: '#0A1629', letterSpacing: '-.04em', lineHeight: 1.1, marginBottom: 16 }}>
                ¿Qué quieres<br/>conseguir?
              </h1>
              <p style={{ fontSize: 15, color: '#475569', lineHeight: 1.7, marginBottom: 32 }}>
                Detéctalo todo: Netflix, Spotify, seguros, gimnasios… y paga solo por lo que realmente usas.
              </p>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#F8FAFC', border: '1px solid #E5E9F0', borderRadius: 20, padding: '8px 16px' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                <span style={{ fontSize: 12, color: '#475569', fontWeight: 500 }}>Cifrado bancario de 256 bits</span>
              </div>
            </div>

            <div>
              <p style={{ fontSize: 13, color: '#94A3B8', marginBottom: 12 }}>Puedes elegir más de uno</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 9, marginBottom: 20 }}>
                {GOALS.map(g => (
                  <button key={g.id} onClick={() => toggleGoal(g.id)}
                    style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '15px 18px', background: '#fff', borderRadius: 12, border: `1.5px solid ${goals.includes(g.id) ? ACCENT : '#E5E9F0'}`, cursor: 'pointer', textAlign: 'left', transition: 'all .15s', boxShadow: goals.includes(g.id) ? `0 0 0 3px ${ACCENT_LIGHT}` : '0 1px 3px rgba(0,0,0,.05)' }}>
                    <span style={{ fontSize: 20, flexShrink: 0 }}>{g.icon}</span>
                    <span style={{ fontSize: 14, fontWeight: 600, color: '#0A1629', flex: 1 }}>{g.title}</span>
                    <div style={{ width: 20, height: 20, borderRadius: '50%', flexShrink: 0, background: goals.includes(g.id) ? ACCENT : '#F1F5F9', border: `2px solid ${goals.includes(g.id) ? ACCENT : '#CBD5E1'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all .15s' }}>
                      {goals.includes(g.id) && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>}
                    </div>
                  </button>
                ))}
              </div>
              <button onClick={() => goals.length > 0 && advance(2)} disabled={goals.length === 0}
                style={{ width: '100%', padding: '14px', borderRadius: 12, border: 'none', background: goals.length > 0 ? '#0A1629' : '#E2E8F0', color: goals.length > 0 ? '#fff' : '#94A3B8', fontSize: 15, fontWeight: 700, cursor: goals.length > 0 ? 'pointer' : 'default', transition: 'background .15s' }}>
                Continuar
              </button>
            </div>
          </div>
        )}

        {/* ── Step 2: Conecta tus cuentas ── */}
        {step === 2 && (
          <div style={{ maxWidth: 900, width: '100%', display: 'grid', gridTemplateColumns: '1.1fr 1fr', gap: 56, alignItems: 'center' }}>
            <div>
              <div style={{ marginBottom: 28, overflow: 'hidden', borderRadius: 16 }}><Marquee /></div>
              <h2 style={{ fontSize: 32, fontWeight: 900, color: '#0A1629', letterSpacing: '-.04em', lineHeight: 1.1, marginBottom: 12 }}>
                Conecta tus cuentas
              </h2>
              <p style={{ fontSize: 15, color: '#475569', lineHeight: 1.7, marginBottom: 20 }}>
                Detectaremos todas tus suscripciones y encontraremos formas de ahorrarte dinero.
              </p>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#F8FAFC', border: '1px solid #E5E9F0', borderRadius: 20, padding: '8px 16px' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                <span style={{ fontSize: 12, color: '#475569', fontWeight: 500 }}>Cifrado bancario de 256 bits</span>
              </div>
            </div>

            <div>
              {csvStatus === 'error' && (
                <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 10, padding: '10px 14px', marginBottom: 12, fontSize: 13, color: '#DC2626' }}>{csvMessage}</div>
              )}

              {/* Bank card */}
              <div style={{ background: '#fff', borderRadius: 14, border: `1.5px solid ${bankAdded ? ACCENT : '#E5E9F0'}`, padding: '18px 20px', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 14, boxShadow: bankAdded ? `0 0 0 3px ${ACCENT_LIGHT}` : '0 1px 4px rgba(0,0,0,.06)' }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: bankAdded ? ACCENT_LIGHT : '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={bankAdded ? ACCENT : '#64748B'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="3" y1="22" x2="21" y2="22"/><line x1="6" y1="18" x2="6" y2="11"/><line x1="10" y1="18" x2="10" y2="11"/><line x1="14" y1="18" x2="14" y2="11"/><line x1="18" y1="18" x2="18" y2="11"/><polygon points="12 2 20 7 4 7"/>
                  </svg>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#0A1629' }}>Extracto bancario</div>
                  <div style={{ fontSize: 12, color: '#94A3B8', marginTop: 2 }}>{bankAdded ? csvMessage : 'CSV o Excel · BBVA, Santander, ING…'}</div>
                </div>
                {bankAdded ? (
                  <div style={{ width: 28, height: 28, borderRadius: '50%', background: ACCENT, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                  </div>
                ) : (
                  <label style={{ fontSize: 13, fontWeight: 700, color: ACCENT, background: ACCENT_LIGHT, border: `1px solid ${ACCENT}`, borderRadius: 8, padding: '6px 14px', cursor: 'pointer', flexShrink: 0 }}>
                    Añadir
                    <input ref={fileRef} type="file" accept=".csv,.xls,.xlsx,.txt" style={{ display: 'none' }} onChange={handleCsvUpload} />
                  </label>
                )}
              </div>

              {/* Gmail card */}
              <div style={{ background: '#fff', borderRadius: 14, border: `1.5px solid ${gmailAdded ? ACCENT : '#E5E9F0'}`, padding: '18px 20px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 14, boxShadow: '0 1px 4px rgba(0,0,0,.06)' }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: '#FEF2F2', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 17, fontWeight: 900, color: '#DC2626' }}>G</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#0A1629' }}>Gmail</div>
                  <div style={{ fontSize: 12, color: '#94A3B8', marginTop: 2 }}>Detecta facturas y confirmaciones</div>
                </div>
                <button onClick={() => setGmailAdded(true)} style={{ fontSize: 13, fontWeight: 700, color: gmailAdded ? ACCENT : ACCENT, background: ACCENT_LIGHT, border: `1px solid ${ACCENT}`, borderRadius: 8, padding: '6px 14px', cursor: 'pointer', flexShrink: 0 }}>
                  {gmailAdded ? '✓ Añadido' : 'Añadir'}
                </button>
              </div>

              {!bankAdded && !gmailAdded && (
                <p style={{ fontSize: 12, color: '#F59E0B', marginBottom: 12, textAlign: 'center' }}>Conecta al menos una fuente para continuar</p>
              )}

              <button onClick={() => (bankAdded || gmailAdded) && advance(3)}
                style={{ width: '100%', padding: '14px', borderRadius: 12, border: 'none', background: (bankAdded || gmailAdded) ? '#0A1629' : '#E2E8F0', color: (bankAdded || gmailAdded) ? '#fff' : '#94A3B8', fontSize: 15, fontWeight: 700, cursor: (bankAdded || gmailAdded) ? 'pointer' : 'default', transition: 'background .15s' }}>
                Continuar
              </button>
              <p style={{ textAlign: 'center', marginTop: 10 }}>
                <button onClick={() => advance(3)} style={{ fontSize: 12, color: '#94A3B8', background: 'none', border: 'none', cursor: 'pointer' }}>Omitir por ahora</button>
              </p>
            </div>
          </div>
        )}

        {/* ── Step 3: Cuéntanos más ── */}
        {step === 3 && (
          <div style={{ maxWidth: 860, width: '100%', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 56, alignItems: 'start' }}>
            <div>
              <h2 style={{ fontSize: 34, fontWeight: 900, color: '#0A1629', letterSpacing: '-.04em', lineHeight: 1.1, marginBottom: 16 }}>
                Una última<br/>pregunta
              </h2>
              <p style={{ fontSize: 15, color: '#475569', lineHeight: 1.7, marginBottom: 28 }}>
                Esto nos ayuda a personalizar tu panel y mostrarte cuánto puedes ahorrar frente a personas similares.
              </p>
              <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #E5E9F0', padding: '20px', boxShadow: '0 1px 4px rgba(0,0,0,.05)' }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: ACCENT, marginBottom: 6 }}>¿Sabías que?</div>
                <div style={{ fontSize: 14, color: '#475569', lineHeight: 1.6 }}>
                  Los usuarios de Floowly ahorran de media <strong style={{ color: '#0A1629' }}>87€/mes</strong> cancelando o negociando sus suscripciones.
                </div>
              </div>
            </div>

            <div>
              <p style={{ fontSize: 14, fontWeight: 700, color: '#0A1629', marginBottom: 14 }}>¿Cuánto crees que gastas en suscripciones al mes?</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 9, marginBottom: 20 }}>
                {SPEND.map(s => (
                  <button key={s.id} onClick={() => setSpend(s.id)}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', background: '#fff', borderRadius: 12, border: `1.5px solid ${spend === s.id ? ACCENT : '#E5E9F0'}`, cursor: 'pointer', transition: 'all .15s', boxShadow: spend === s.id ? `0 0 0 3px ${ACCENT_LIGHT}` : '0 1px 3px rgba(0,0,0,.05)' }}>
                    <span style={{ fontSize: 14, fontWeight: 600, color: '#0A1629' }}>{s.label}</span>
                    <div style={{ width: 20, height: 20, borderRadius: '50%', flexShrink: 0, background: spend === s.id ? ACCENT : '#F1F5F9', border: `2px solid ${spend === s.id ? ACCENT : '#CBD5E1'}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {spend === s.id && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>}
                    </div>
                  </button>
                ))}
              </div>
              <button onClick={() => spend && advance(4)} disabled={!spend}
                style={{ width: '100%', padding: '14px', borderRadius: 12, border: 'none', background: spend ? '#0A1629' : '#E2E8F0', color: spend ? '#fff' : '#94A3B8', fontSize: 15, fontWeight: 700, cursor: spend ? 'pointer' : 'default', transition: 'background .15s' }}>
                Continuar
              </button>
            </div>
          </div>
        )}

        {/* ── Step 4: Activar ── */}
        {step === 4 && (
          <div style={{ maxWidth: 860, width: '100%', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 56, alignItems: 'center' }}>
            <div>
              <div style={{ width: 64, height: 64, borderRadius: 20, background: ACCENT, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24, boxShadow: `0 10px 30px rgba(15,155,142,.3)` }}>
                <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
              </div>
              <h2 style={{ fontSize: 34, fontWeight: 900, color: '#0A1629', letterSpacing: '-.04em', lineHeight: 1.1, marginBottom: 14 }}>
                ¡Todo listo!
              </h2>
              <p style={{ fontSize: 15, color: '#475569', lineHeight: 1.7, marginBottom: 28 }}>
                {found > 0
                  ? `Hemos detectado ${found} suscripciones. Revísalas en tu panel y decide qué negociar o cancelar.`
                  : 'Tu cuenta está configurada. Empieza a explorar tu panel de control.'}
              </p>
              <button onClick={finish}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 10, fontSize: 15, fontWeight: 700, color: '#fff', background: '#0A1629', border: 'none', padding: '14px 28px', borderRadius: 12, cursor: 'pointer' }}>
                Ir a mi panel
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
              </button>
            </div>

            <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #E5E9F0', padding: '28px', boxShadow: '0 2px 12px rgba(0,0,0,.06)' }}>
              <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: '#94A3B8', marginBottom: 16 }}>Tu configuración</p>
              {[
                { icon: '🎯', label: 'Objetivos', value: goals.length > 0 ? `${goals.length} objetivo${goals.length > 1 ? 's' : ''} elegido${goals.length > 1 ? 's' : ''}` : 'Sin configurar' },
                { icon: '🏦', label: 'Cuenta bancaria', value: bankAdded ? 'Extracto cargado ✓' : 'No conectada' },
                { icon: '📧', label: 'Gmail', value: gmailAdded ? 'Conectado ✓' : 'No conectado' },
                { icon: '💶', label: 'Gasto estimado', value: spend ? (SPEND.find(s => s.id === spend)?.label ?? '—') : '—' },
              ].map((row, i) => (
                <div key={row.label} style={{ display: 'flex', alignItems: 'center', gap: 12, paddingBottom: i < 3 ? 14 : 0, marginBottom: i < 3 ? 14 : 16, borderBottom: i < 3 ? '1px solid #F1F5F9' : 'none' }}>
                  <span style={{ fontSize: 20 }}>{row.icon}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 11, color: '#94A3B8', marginBottom: 2 }}>{row.label}</div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#0A1629' }}>{row.value}</div>
                  </div>
                </div>
              ))}
              <div style={{ background: ACCENT_LIGHT, borderRadius: 10, padding: '12px 14px', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <span style={{ fontSize: 16 }}>💡</span>
                <p style={{ fontSize: 13, color: '#0A1629', lineHeight: 1.5, margin: 0 }}>
                  Puedes conectar más cuentas en cualquier momento desde <strong>Ajustes</strong>.
                </p>
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  )
}
