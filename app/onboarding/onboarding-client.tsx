'use client'

import { useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import * as XLSX from 'xlsx'
import { createBrowserClient } from '@/lib/supabase/client'

type Step = 1 | 2 | 3 | 4 | 5 | 6

const NAV = [
  { n: 1 as Step, label: 'Objetivos' },
  { n: 2 as Step, label: 'Tu perfil' },
  { n: 3 as Step, label: 'Conectar' },
  { n: 4 as Step, label: 'Premium' },
  { n: 5 as Step, label: 'Activar' },
]

const ACCENT = '#0f9b8e'
const AL = '#e8f7f6'

// ── SVG Icon library ──────────────────────────────────────────────────────────

function Icon({ name, size = 20, color = 'currentColor', strokeWidth = 1.8 }: { name: string; size?: number; color?: string; strokeWidth?: number }) {
  const s = { width: size, height: size }
  const p = { fill: 'none', stroke: color, strokeWidth, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }
  const icons: Record<string, JSX.Element> = {
    check: <svg {...s} viewBox="0 0 24 24"><polyline {...p} points="20 6 9 17 4 12"/></svg>,
    chevronRight: <svg {...s} viewBox="0 0 24 24"><polyline {...p} points="9 18 15 12 9 6"/></svg>,
    arrowRight: <svg {...s} viewBox="0 0 24 24"><line {...p} x1="5" y1="12" x2="19" y2="12"/><polyline {...p} points="12 5 19 12 12 19"/></svg>,
    lock: <svg {...s} viewBox="0 0 24 24"><rect {...p} x="3" y="11" width="18" height="11" rx="2"/><path {...p} d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>,
    camera: <svg {...s} viewBox="0 0 24 24"><path {...p} d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle {...p} cx="12" cy="13" r="4"/></svg>,
    user: <svg {...s} viewBox="0 0 24 24"><path {...p} d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle {...p} cx="12" cy="7" r="4"/></svg>,
    cancel: <svg {...s} viewBox="0 0 24 24"><circle {...p} cx="12" cy="12" r="10"/><line {...p} x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>,
    savings: <svg {...s} viewBox="0 0 24 24"><line {...p} x1="12" y1="1" x2="12" y2="23"/><path {...p} d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>,
    chart: <svg {...s} viewBox="0 0 24 24"><line {...p} x1="18" y1="20" x2="18" y2="10"/><line {...p} x1="12" y1="20" x2="12" y2="4"/><line {...p} x1="6" y1="20" x2="6" y2="14"/></svg>,
    negotiate: <svg {...s} viewBox="0 0 24 24"><path {...p} d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
    shield: <svg {...s} viewBox="0 0 24 24"><path {...p} d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
    bank: <svg {...s} viewBox="0 0 24 24"><line {...p} x1="3" y1="22" x2="21" y2="22"/><line {...p} x1="6" y1="18" x2="6" y2="11"/><line {...p} x1="10" y1="18" x2="10" y2="11"/><line {...p} x1="14" y1="18" x2="14" y2="11"/><line {...p} x1="18" y1="18" x2="18" y2="11"/><polygon {...p} points="12 2 20 7 4 7"/></svg>,
    mail: <svg {...s} viewBox="0 0 24 24"><path {...p} d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline {...p} points="22,6 12,13 2,6"/></svg>,
    star: <svg {...s} viewBox="0 0 24 24"><polygon {...p} points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
    bell: <svg {...s} viewBox="0 0 24 24"><path {...p} d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path {...p} d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>,
    zap: <svg {...s} viewBox="0 0 24 24"><polygon {...p} points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>,
    file: <svg {...s} viewBox="0 0 24 24"><path {...p} d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><polyline {...p} points="13 2 13 9 20 9"/></svg>,
    calendar: <svg {...s} viewBox="0 0 24 24"><rect {...p} x="3" y="4" width="18" height="18" rx="2" ry="2"/><line {...p} x1="16" y1="2" x2="16" y2="6"/><line {...p} x1="8" y1="2" x2="8" y2="6"/><line {...p} x1="3" y1="10" x2="21" y2="10"/></svg>,
    headset: <svg {...s} viewBox="0 0 24 24"><path {...p} d="M3 18v-6a9 9 0 0 1 18 0v6"/><path {...p} d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"/></svg>,
    creditcard: <svg {...s} viewBox="0 0 24 24"><rect {...p} x="1" y="4" width="22" height="16" rx="2" ry="2"/><line {...p} x1="1" y1="10" x2="23" y2="10"/></svg>,
    tracking: <svg {...s} viewBox="0 0 24 24"><circle {...p} cx="12" cy="12" r="10"/><polyline {...p} points="12 6 12 12 16 14"/></svg>,
    globe: <svg {...s} viewBox="0 0 24 24"><circle {...p} cx="12" cy="12" r="10"/><line {...p} x1="2" y1="12" x2="22" y2="12"/><path {...p} d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>,
  }
  return icons[name] ?? null
}

// ── Services marquee ──────────────────────────────────────────────────────────

const SERVICES_ROW1 = [
  { name: 'Netflix',    file: 'netflix',    bg: '#E50914' },
  { name: 'Spotify',    file: 'spotify',    bg: '#1DB954' },
  { name: 'Amazon',     file: 'amazon',     bg: '#FF9900' },
  { name: 'Disney+',    file: 'disney',     bg: '#113CCF' },
  { name: 'HBO Max',    file: 'hbo',        bg: '#5822B4' },
  { name: 'YouTube',    file: 'youtube',    bg: '#FF0000' },
  { name: 'Adobe',      file: 'adobe',      bg: '#FA0F00' },
  { name: 'Microsoft',  file: 'microsoft',  bg: '#D83B01' },
  { name: 'Dropbox',    file: 'dropbox',    bg: '#0061FF' },
  { name: 'Notion',     file: 'notion',     bg: '#000000' },
]
const SERVICES_ROW2 = [
  { name: 'Twitch',     file: 'twitch',     bg: '#9146FF' },
  { name: 'Canva',      file: 'canva',      bg: '#7D2AE8' },
  { name: 'LinkedIn',   file: 'linkedin',   bg: '#0077B5' },
  { name: 'Slack',      file: 'slack',      bg: '#4A154B' },
  { name: 'Audible',    file: 'audible',    bg: '#F88F00' },
  { name: 'DAZN',       file: 'dazn',       bg: '#111111' },
  { name: 'iCloud',     file: 'icloud',     bg: '#1877F2' },
  { name: 'Movistar',   file: 'movistar',   bg: '#009BE8' },
  { name: 'Apple TV',   file: 'appletv',    bg: '#000000' },
  { name: 'Santander',  file: 'santander',  bg: '#E01022' },
]

function ServiceTile({ s }: { s: { name: string; file: string; bg: string } }) {
  return (
    <div style={{ width: 64, height: 64, borderRadius: 16, background: s.bg, flexShrink: 0, overflow: 'hidden', boxShadow: '0 2px 10px rgba(0,0,0,.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <img
        src={`/services/${s.file}.png`}
        alt={s.name}
        width={40}
        height={40}
        style={{ objectFit: 'contain', display: 'block' }}
        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
      />
    </div>
  )
}

function Marquee() {
  return (
    <div style={{ overflow: 'hidden', width: '100%' }}>
      <style>{`
        @keyframes mq-l { from{transform:translateX(0)} to{transform:translateX(-50%)} }
        @keyframes mq-r { from{transform:translateX(-50%)} to{transform:translateX(0)} }
        .mq-row { display:flex; gap:10px; width:max-content; }
        .mq-l   { animation:mq-l 24s linear infinite; }
        .mq-r   { animation:mq-r 28s linear infinite; margin-top:10px; }
      `}</style>
      <div className="mq-row mq-l">{[...SERVICES_ROW1,...SERVICES_ROW1].map((s,i)=><ServiceTile key={i} s={s}/>)}</div>
      <div className="mq-row mq-r">{[...SERVICES_ROW2,...SERVICES_ROW2].map((s,i)=><ServiceTile key={i} s={s}/>)}</div>
    </div>
  )
}

// ── Goal & purpose data ───────────────────────────────────────────────────────

const GOALS = [
  { id: 'cancel',    iconName: 'cancel',    title: 'Cancelar lo que no uso', desc: 'Eliminar suscripciones activas que ya no aprovecho' },
  { id: 'save',      iconName: 'savings',   title: 'Ahorrar más cada mes',   desc: 'Reducir mis gastos fijos y destinar más al ahorro' },
  { id: 'control',   iconName: 'chart',     title: 'Ver todos mis gastos',   desc: 'Tener visibilidad total de mis finanzas personales' },
  { id: 'negotiate', iconName: 'negotiate', title: 'Negociar mejores precios', desc: 'Obtener descuentos y condiciones más favorables' },
]

const PURPOSES = [
  { id: 'personal', iconName: 'user',       title: 'Finanzas personales', desc: 'Controlar mis gastos del día a día' },
  { id: 'family',   iconName: 'globe',      title: 'Gestión familiar',    desc: 'Administrar los gastos de toda la familia' },
  { id: 'business', iconName: 'chart',      title: 'Freelance / negocio', desc: 'Separar y controlar gastos profesionales' },
  { id: 'savings',  iconName: 'savings',    title: 'Plan de ahorro',      desc: 'Tengo un objetivo de ahorro claro que quiero cumplir' },
]

const PREMIUM_FEATURES = [
  { iconName: 'cancel',     title: 'Cancelación automática',        desc: 'Cancela cualquier suscripción con un clic, sin llamadas' },
  { iconName: 'negotiate',  title: 'Negociación con IA',            desc: 'Nuestra IA negocia mejores precios en tu nombre' },
  { iconName: 'zap',        title: 'Detección ilimitada',           desc: 'Analiza todos tus movimientos sin límite de transacciones' },
  { iconName: 'bell',       title: 'Alertas de renovación',         desc: 'Notificaciones antes de cada cargo automático' },
  { iconName: 'file',       title: 'Informes detallados',           desc: 'Resúmenes mensuales exportables en PDF y Excel' },
  { iconName: 'headset',    title: 'Soporte prioritario 24/7',      desc: 'Atención humana en menos de 2 horas' },
]

const SPEND_OPTIONS = [
  { id: '<30',    label: 'Menos de 30€ / mes' },
  { id: '30-60',  label: '30 – 60€ / mes' },
  { id: '60-100', label: '60 – 100€ / mes' },
  { id: '100+',   label: 'Más de 100€ / mes' },
]

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatCard(v: string) {
  return v.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim()
}
function formatExpiry(v: string) {
  const d = v.replace(/\D/g, '').slice(0, 4)
  return d.length > 2 ? `${d.slice(0,2)}/${d.slice(2)}` : d
}

// ── Main component ────────────────────────────────────────────────────────────

export default function OnboardingClient({ user }: { user: { id: string; email: string } }) {
  const [step, setStep] = useState<Step>(1)

  // Step 1 – goals
  const [goals, setGoals] = useState<string[]>([])

  // Step 2 – profile
  const [avatar, setAvatar] = useState<string | null>(null)
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName]   = useState('')
  const [birthdate, setBirthdate] = useState('')
  const [phone, setPhone]         = useState('')
  const [purpose, setPurpose]     = useState('')
  const [spend, setSpend]         = useState('')

  // Step 3 – connect
  const [csvStatus, setCsvStatus]   = useState<'idle'|'parsing'|'done'|'error'>('idle')
  const [csvMessage, setCsvMessage] = useState('')
  const [found, setFound]           = useState(0)
  const [bankAdded, setBankAdded]   = useState(false)
  const [gmailAdded, setGmailAdded] = useState(false)

  // Step 4 – premium
  const [cardNum, setCardNum]       = useState('')
  const [cardName, setCardName]     = useState('')
  const [cardExpiry, setCardExpiry] = useState('')
  const [cardCvv, setCardCvv]       = useState('')

  const fileAvatarRef = useRef<HTMLInputElement>(null)
  const fileCsvRef    = useRef<HTMLInputElement>(null)
  const router        = useRouter()
  const supabase      = createBrowserClient()

  function toggleGoal(id: string) {
    setGoals(prev => prev.includes(id) ? prev.filter(g => g !== id) : [...prev, id])
  }

  function handleAvatar(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => setAvatar(ev.target?.result as string)
    reader.readAsDataURL(file)
  }

  async function saveProfile() {
    await supabase.auth.updateUser({
      data: {
        onboarding_goals: goals,
        first_name: firstName,
        last_name: lastName,
        birthdate,
        phone,
        purpose,
        onboarding_spend: spend,
        ...(avatar ? { avatar_data_url: true } : {}),
      }
    })
    if (avatar) {
      const blob = await (await fetch(avatar)).blob()
      await supabase.storage.from('avatars').upload(`${user.id}.jpg`, blob, { upsert: true, contentType: 'image/jpeg' })
    }
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
        const buf = await file.arrayBuffer()
        const wb  = XLSX.read(buf, { type: 'array' })
        const ws  = wb.Sheets[wb.SheetNames[0]]
        csvText   = XLSX.utils.sheet_to_csv(ws, { FS: ';' })
      } else {
        csvText = await file.text()
      }
      const res  = await fetch('/api/bank/csv', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ csv: csvText, user_id: user.id }) })
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

  async function finish() {
    await supabase.auth.updateUser({ data: { onboarding_completed: true } })
    router.push('/dashboard')
  }

  const profileValid = firstName.trim().length > 0

  // ── Shared styles ──────────────────────────────────────────────────────────
  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '12px 14px', borderRadius: 10, border: '1.5px solid #E5E9F0',
    fontSize: 14, color: '#0A1629', background: '#fff', outline: 'none',
    fontFamily: 'inherit', boxSizing: 'border-box', transition: 'border-color .15s',
  }
  const labelStyle: React.CSSProperties = { fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 6, display: 'block', letterSpacing: '.02em' }
  const primaryBtn: React.CSSProperties = { width: '100%', padding: '14px', borderRadius: 12, border: 'none', background: '#0A1629', color: '#fff', fontSize: 15, fontWeight: 700, cursor: 'pointer' }
  const disabledBtn: React.CSSProperties = { ...primaryBtn, background: '#E2E8F0', color: '#94A3B8', cursor: 'default' }

  return (
    <div style={{ minHeight: '100vh', background: '#F7F8FA', fontFamily: "-apple-system,BlinkMacSystemFont,'Inter',system-ui,sans-serif", WebkitFontSmoothing: 'antialiased', display: 'flex', flexDirection: 'column' }}>

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header style={{ background: '#fff', borderBottom: '1px solid #E5E9F0' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 32px', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <img src="/logo.png" alt="Floowly" width={30} height={30} style={{ display: 'block' }} />
            <img src="/wordmark.png" alt="Floowly Money" style={{ height: 17, width: 'auto' }} />
          </div>

          <nav style={{ display: 'flex', alignItems: 'center' }}>
            {NAV.map((s, i) => (
              <div key={s.n} style={{ display: 'flex', alignItems: 'center' }}>
                <span onClick={() => step > s.n && setStep(s.n)} style={{ fontSize: 13, fontWeight: step === s.n ? 700 : 500, padding: '6px 14px', color: step === s.n ? ACCENT : step > s.n ? '#475569' : '#BCC5D3', borderBottom: step === s.n ? `2px solid ${ACCENT}` : '2px solid transparent', cursor: step > s.n ? 'pointer' : 'default', transition: 'all .2s' }}>
                  {s.label}
                </span>
                {i < NAV.length - 1 && <Icon name="chevronRight" size={14} color="#CBD5E0"/>}
              </div>
            ))}
          </nav>

          <button onClick={finish} style={{ fontSize: 12, color: '#94A3B8', background: 'none', border: 'none', cursor: 'pointer' }}>Omitir →</button>
        </div>
      </header>

      {/* ── Content ────────────────────────────────────────────────────────── */}
      <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px 20px' }}>

        {/* ══ Step 1: Objetivos ════════════════════════════════════════════ */}
        {step === 1 && (
          <div style={{ maxWidth: 860, width: '100%', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 56, alignItems: 'start' }}>
            <div>
              <h1 style={{ fontSize: 36, fontWeight: 900, color: '#0A1629', letterSpacing: '-.04em', lineHeight: 1.1, marginBottom: 16 }}>
                ¿Qué quieres<br/>conseguir?
              </h1>
              <p style={{ fontSize: 15, color: '#475569', lineHeight: 1.75, marginBottom: 32 }}>
                Detectamos todas tus suscripciones activas y te ayudamos a pagar solo por lo que de verdad usas.
              </p>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#F8FAFC', border: '1px solid #E5E9F0', borderRadius: 20, padding: '8px 16px' }}>
                <Icon name="shield" size={14} color="#475569"/>
                <span style={{ fontSize: 12, color: '#475569', fontWeight: 500 }}>Cifrado bancario de 256 bits</span>
              </div>
            </div>

            <div>
              <p style={{ fontSize: 13, color: '#94A3B8', marginBottom: 12, fontWeight: 500 }}>Selecciona todos los que quieras</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 9, marginBottom: 20 }}>
                {GOALS.map(g => (
                  <button key={g.id} onClick={() => toggleGoal(g.id)}
                    style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', background: '#fff', borderRadius: 12, border: `1.5px solid ${goals.includes(g.id) ? ACCENT : '#E5E9F0'}`, cursor: 'pointer', textAlign: 'left', transition: 'all .15s', boxShadow: goals.includes(g.id) ? `0 0 0 3px ${AL}` : '0 1px 3px rgba(0,0,0,.04)' }}>
                    <div style={{ width: 38, height: 38, borderRadius: 10, background: goals.includes(g.id) ? AL : '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'background .15s' }}>
                      <Icon name={g.iconName} size={18} color={goals.includes(g.id) ? ACCENT : '#64748B'}/>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: '#0A1629', marginBottom: 2 }}>{g.title}</div>
                      <div style={{ fontSize: 12, color: '#94A3B8', lineHeight: 1.4 }}>{g.desc}</div>
                    </div>
                    <div style={{ width: 20, height: 20, borderRadius: '50%', flexShrink: 0, background: goals.includes(g.id) ? ACCENT : '#F1F5F9', border: `2px solid ${goals.includes(g.id) ? ACCENT : '#CBD5E1'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all .15s' }}>
                      {goals.includes(g.id) && <Icon name="check" size={10} color="#fff" strokeWidth={3}/>}
                    </div>
                  </button>
                ))}
              </div>
              <button onClick={() => goals.length > 0 && setStep(2)} style={goals.length > 0 ? primaryBtn : disabledBtn}>
                Continuar
              </button>
            </div>
          </div>
        )}

        {/* ══ Step 2: Tu perfil ════════════════════════════════════════════ */}
        {step === 2 && (
          <div style={{ maxWidth: 900, width: '100%', display: 'grid', gridTemplateColumns: '1fr 1.3fr', gap: 56, alignItems: 'start' }}>
            <div>
              <h2 style={{ fontSize: 34, fontWeight: 900, color: '#0A1629', letterSpacing: '-.04em', lineHeight: 1.1, marginBottom: 14 }}>
                Crea tu perfil
              </h2>
              <p style={{ fontSize: 15, color: '#475569', lineHeight: 1.75, marginBottom: 28 }}>
                Tu información está protegida y nunca se comparte con terceros.
              </p>

              {/* Avatar */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 28 }}>
                <div
                  onClick={() => fileAvatarRef.current?.click()}
                  style={{ width: 80, height: 80, borderRadius: '50%', background: avatar ? 'transparent' : AL, border: `2px dashed ${avatar ? ACCENT : '#CBD5E1'}`, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0, transition: 'border-color .15s' }}>
                  {avatar ? (
                    <img src={avatar} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <Icon name="camera" size={24} color={ACCENT}/>
                  )}
                </div>
                <input ref={fileAvatarRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleAvatar}/>
                <div>
                  <button onClick={() => fileAvatarRef.current?.click()} style={{ fontSize: 13, fontWeight: 700, color: ACCENT, background: AL, border: 'none', borderRadius: 8, padding: '8px 16px', cursor: 'pointer', display: 'block', marginBottom: 4 }}>
                    {avatar ? 'Cambiar foto' : 'Subir foto'}
                  </button>
                  <span style={{ fontSize: 12, color: '#94A3B8' }}>JPG, PNG · opcional</span>
                </div>
              </div>

              {/* Purpose */}
              <p style={{ fontSize: 13, fontWeight: 700, color: '#475569', marginBottom: 10 }}>¿Para qué usarás Floowly?</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {PURPOSES.map(p => (
                  <button key={p.id} onClick={() => setPurpose(p.id)}
                    style={{ padding: '12px 14px', background: '#fff', borderRadius: 10, border: `1.5px solid ${purpose === p.id ? ACCENT : '#E5E9F0'}`, cursor: 'pointer', textAlign: 'left', transition: 'all .15s', boxShadow: purpose === p.id ? `0 0 0 3px ${AL}` : 'none' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <Icon name={p.iconName} size={14} color={purpose === p.id ? ACCENT : '#64748B'}/>
                      <span style={{ fontSize: 12, fontWeight: 700, color: '#0A1629' }}>{p.title}</span>
                    </div>
                    <div style={{ fontSize: 11, color: '#94A3B8', lineHeight: 1.4 }}>{p.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={labelStyle}>NOMBRE <span style={{ color: '#EF4444' }}>*</span></label>
                  <input style={inputStyle} value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="Luis" onFocus={e => (e.target.style.borderColor = ACCENT)} onBlur={e => (e.target.style.borderColor = '#E5E9F0')}/>
                </div>
                <div>
                  <label style={labelStyle}>APELLIDOS</label>
                  <input style={inputStyle} value={lastName} onChange={e => setLastName(e.target.value)} placeholder="Martínez" onFocus={e => (e.target.style.borderColor = ACCENT)} onBlur={e => (e.target.style.borderColor = '#E5E9F0')}/>
                </div>
              </div>

              <div>
                <label style={labelStyle}>FECHA DE NACIMIENTO</label>
                <div style={{ position: 'relative' }}>
                  <input type="date" style={{ ...inputStyle, paddingLeft: 38 }} value={birthdate} onChange={e => setBirthdate(e.target.value)} onFocus={e => (e.target.style.borderColor = ACCENT)} onBlur={e => (e.target.style.borderColor = '#E5E9F0')}/>
                  <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
                    <Icon name="calendar" size={16} color="#94A3B8"/>
                  </span>
                </div>
              </div>

              <div>
                <label style={labelStyle}>TELÉFONO</label>
                <input style={inputStyle} type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+34 600 000 000" onFocus={e => (e.target.style.borderColor = ACCENT)} onBlur={e => (e.target.style.borderColor = '#E5E9F0')}/>
              </div>

              <div>
                <label style={labelStyle}>GASTO MENSUAL ESTIMADO EN SUSCRIPCIONES</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  {SPEND_OPTIONS.map(s => (
                    <button key={s.id} onClick={() => setSpend(s.id)}
                      style={{ padding: '10px 12px', background: '#fff', borderRadius: 10, border: `1.5px solid ${spend === s.id ? ACCENT : '#E5E9F0'}`, cursor: 'pointer', fontSize: 13, fontWeight: spend === s.id ? 700 : 500, color: spend === s.id ? ACCENT : '#475569', transition: 'all .15s', boxShadow: spend === s.id ? `0 0 0 3px ${AL}` : 'none' }}>
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={async () => { if (profileValid) { await saveProfile(); setStep(3) } }}
                style={profileValid ? primaryBtn : disabledBtn}>
                Guardar y continuar
              </button>
              <p style={{ textAlign: 'center', margin: 0 }}>
                <button onClick={() => setStep(3)} style={{ fontSize: 12, color: '#94A3B8', background: 'none', border: 'none', cursor: 'pointer' }}>Completar más tarde</button>
              </p>
            </div>
          </div>
        )}

        {/* ══ Step 3: Conecta tus cuentas ════════════════════════════════ */}
        {step === 3 && (
          <div style={{ maxWidth: 900, width: '100%', display: 'grid', gridTemplateColumns: '1.1fr 1fr', gap: 56, alignItems: 'center' }}>
            <div>
              <div style={{ marginBottom: 28, overflow: 'hidden', borderRadius: 16 }}><Marquee/></div>
              <h2 style={{ fontSize: 32, fontWeight: 900, color: '#0A1629', letterSpacing: '-.04em', lineHeight: 1.1, marginBottom: 12 }}>
                Conecta tus cuentas
              </h2>
              <p style={{ fontSize: 15, color: '#475569', lineHeight: 1.7, marginBottom: 20 }}>
                Detectaremos todas tus suscripciones y encontraremos formas de ahorrarte dinero cada mes.
              </p>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#F8FAFC', border: '1px solid #E5E9F0', borderRadius: 20, padding: '8px 16px' }}>
                <Icon name="lock" size={13} color="#475569"/>
                <span style={{ fontSize: 12, color: '#475569', fontWeight: 500 }}>Cifrado bancario de 256 bits</span>
              </div>
            </div>

            <div>
              {csvStatus === 'error' && (
                <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 10, padding: '10px 14px', marginBottom: 12, fontSize: 13, color: '#DC2626' }}>{csvMessage}</div>
              )}

              {/* Bank */}
              <div style={{ background: '#fff', borderRadius: 14, border: `1.5px solid ${bankAdded ? ACCENT : '#E5E9F0'}`, padding: '18px 20px', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 14, boxShadow: bankAdded ? `0 0 0 3px ${AL}` : '0 1px 4px rgba(0,0,0,.05)' }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: bankAdded ? AL : '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon name="bank" size={20} color={bankAdded ? ACCENT : '#64748B'}/>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: '#0A1629' }}>Extracto bancario</span>
                    {!bankAdded && <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 20, background: AL, color: ACCENT }}>RECOMENDADO</span>}
                  </div>
                  <div style={{ fontSize: 12, color: '#94A3B8' }}>{bankAdded ? csvMessage : 'CSV o Excel · BBVA, Santander, CaixaBank, ING…'}</div>
                </div>
                {bankAdded ? (
                  <div style={{ width: 28, height: 28, borderRadius: '50%', background: ACCENT, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Icon name="check" size={12} color="#fff" strokeWidth={3}/>
                  </div>
                ) : (
                  <label style={{ fontSize: 13, fontWeight: 700, color: ACCENT, background: AL, border: `1px solid ${ACCENT}`, borderRadius: 8, padding: '7px 14px', cursor: 'pointer', flexShrink: 0, whiteSpace: 'nowrap' }}>
                    Añadir
                    <input ref={fileCsvRef} type="file" accept=".csv,.xls,.xlsx,.txt" style={{ display: 'none' }} onChange={handleCsvUpload}/>
                  </label>
                )}
              </div>

              {/* Gmail */}
              <div style={{ background: '#fff', borderRadius: 14, border: `1.5px solid ${gmailAdded ? ACCENT : '#E5E9F0'}`, padding: '18px 20px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 14, boxShadow: '0 1px 4px rgba(0,0,0,.05)' }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: '#FEF2F2', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon name="mail" size={20} color="#DC2626"/>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#0A1629', marginBottom: 3 }}>Gmail</div>
                  <div style={{ fontSize: 12, color: '#94A3B8' }}>Detecta facturas y confirmaciones de pago</div>
                </div>
                <button onClick={() => setGmailAdded(true)} style={{ fontSize: 13, fontWeight: 700, color: ACCENT, background: AL, border: `1px solid ${ACCENT}`, borderRadius: 8, padding: '7px 14px', cursor: 'pointer', flexShrink: 0 }}>
                  {gmailAdded ? 'Añadido' : 'Añadir'}
                </button>
              </div>

              <button onClick={() => setStep(4)} style={primaryBtn}>Continuar</button>
              <p style={{ textAlign: 'center', marginTop: 10, margin: '10px 0 0' }}>
                <button onClick={() => setStep(4)} style={{ fontSize: 12, color: '#94A3B8', background: 'none', border: 'none', cursor: 'pointer' }}>Omitir por ahora</button>
              </p>
            </div>
          </div>
        )}

        {/* ══ Step 4: Plan Premium ═════════════════════════════════════════ */}
        {step === 4 && (
          <div style={{ maxWidth: 900, width: '100%', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 48, alignItems: 'start' }}>
            {/* Left: features */}
            <div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'linear-gradient(135deg,#0f9b8e,#0c7a6f)', borderRadius: 20, padding: '6px 14px', marginBottom: 20 }}>
                <Icon name="star" size={12} color="#fff" strokeWidth={2}/>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#fff', letterSpacing: '.05em' }}>PLAN PREMIUM</span>
              </div>
              <h2 style={{ fontSize: 32, fontWeight: 900, color: '#0A1629', letterSpacing: '-.04em', lineHeight: 1.1, marginBottom: 14 }}>
                Desbloquea el<br/>control total
              </h2>
              <p style={{ fontSize: 15, color: '#475569', lineHeight: 1.7, marginBottom: 24 }}>
                Los usuarios Premium ahorran de media <strong style={{ color: '#0A1629' }}>87€ al mes</strong>. El plan se paga solo.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {PREMIUM_FEATURES.map(f => (
                  <div key={f.title} style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                    <div style={{ width: 34, height: 34, borderRadius: 9, background: AL, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
                      <Icon name={f.iconName} size={16} color={ACCENT}/>
                    </div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: '#0A1629', marginBottom: 2 }}>{f.title}</div>
                      <div style={{ fontSize: 12, color: '#475569', lineHeight: 1.5 }}>{f.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: card form */}
            <div style={{ background: '#fff', borderRadius: 18, border: '1px solid #E5E9F0', padding: '28px', boxShadow: '0 4px 20px rgba(0,0,0,.06)' }}>
              <div style={{ marginBottom: 22 }}>
                <div style={{ fontSize: 22, fontWeight: 900, color: '#0A1629', letterSpacing: '-.03em' }}>
                  3,99€<span style={{ fontSize: 14, fontWeight: 500, color: '#94A3B8' }}> / mes</span>
                </div>
                <div style={{ fontSize: 13, color: '#475569', marginTop: 4 }}>30 días gratis · Cancela cuando quieras</div>
              </div>

              <div style={{ background: 'linear-gradient(135deg,#0f9b8e,#0c6e64)', borderRadius: 14, padding: '20px', marginBottom: 22, position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: -20, right: -20, width: 100, height: 100, borderRadius: '50%', background: 'rgba(255,255,255,.06)' }}/>
                <div style={{ position: 'absolute', bottom: -30, right: 20, width: 80, height: 80, borderRadius: '50%', background: 'rgba(255,255,255,.04)' }}/>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,.6)', marginBottom: 16 }}>Número de tarjeta</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: '#fff', letterSpacing: '.1em', marginBottom: 16, fontVariantNumeric: 'tabular-nums' }}>
                  {cardNum || '•••• •••• •••• ••••'}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontSize: 10, color: 'rgba(255,255,255,.5)', marginBottom: 2 }}>TITULAR</div>
                    <div style={{ fontSize: 13, color: '#fff', fontWeight: 600 }}>{cardName || '—'}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 10, color: 'rgba(255,255,255,.5)', marginBottom: 2 }}>CADUCA</div>
                    <div style={{ fontSize: 13, color: '#fff', fontWeight: 600 }}>{cardExpiry || 'MM/AA'}</div>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div>
                  <label style={labelStyle}>NÚMERO DE TARJETA</label>
                  <div style={{ position: 'relative' }}>
                    <input style={{ ...inputStyle, paddingLeft: 38 }} value={cardNum} onChange={e => setCardNum(formatCard(e.target.value))} placeholder="1234 5678 9012 3456" onFocus={e => (e.target.style.borderColor = ACCENT)} onBlur={e => (e.target.style.borderColor = '#E5E9F0')}/>
                    <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }}>
                      <Icon name="creditcard" size={16} color="#94A3B8"/>
                    </span>
                  </div>
                </div>
                <div>
                  <label style={labelStyle}>NOMBRE EN LA TARJETA</label>
                  <input style={inputStyle} value={cardName} onChange={e => setCardName(e.target.value)} placeholder="Luis Martínez" onFocus={e => (e.target.style.borderColor = ACCENT)} onBlur={e => (e.target.style.borderColor = '#E5E9F0')}/>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <div>
                    <label style={labelStyle}>FECHA DE CADUCIDAD</label>
                    <input style={inputStyle} value={cardExpiry} onChange={e => setCardExpiry(formatExpiry(e.target.value))} placeholder="MM/AA" onFocus={e => (e.target.style.borderColor = ACCENT)} onBlur={e => (e.target.style.borderColor = '#E5E9F0')}/>
                  </div>
                  <div>
                    <label style={labelStyle}>CVV</label>
                    <input style={inputStyle} type="password" maxLength={4} value={cardCvv} onChange={e => setCardCvv(e.target.value.replace(/\D/g,'').slice(0,4))} placeholder="•••" onFocus={e => (e.target.style.borderColor = ACCENT)} onBlur={e => (e.target.style.borderColor = '#E5E9F0')}/>
                  </div>
                </div>

                <button onClick={() => setStep(5)} style={primaryBtn}>
                  Empezar prueba gratuita
                </button>

                <div style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'center' }}>
                  <Icon name="lock" size={12} color="#94A3B8"/>
                  <span style={{ fontSize: 11, color: '#94A3B8' }}>Pago seguro · No se cobra hasta el día 31</span>
                </div>
              </div>

              <div style={{ borderTop: '1px solid #F1F5F9', marginTop: 16, paddingTop: 14, textAlign: 'center' }}>
                <button onClick={() => setStep(5)} style={{ fontSize: 13, color: '#94A3B8', background: 'none', border: 'none', cursor: 'pointer' }}>
                  Continuar con el plan gratuito
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ══ Step 5: Activar ════════════════════════════════════════════ */}
        {step === 5 && (
          <div style={{ maxWidth: 860, width: '100%', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 56, alignItems: 'center' }}>
            <div>
              <div style={{ width: 64, height: 64, borderRadius: 20, background: ACCENT, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24, boxShadow: `0 10px 30px rgba(15,155,142,.3)` }}>
                <Icon name="check" size={30} color="#fff" strokeWidth={2.5}/>
              </div>
              <h2 style={{ fontSize: 34, fontWeight: 900, color: '#0A1629', letterSpacing: '-.04em', lineHeight: 1.1, marginBottom: 14 }}>
                Todo listo
              </h2>
              <p style={{ fontSize: 15, color: '#475569', lineHeight: 1.75, marginBottom: 28 }}>
                {found > 0
                  ? `Hemos detectado ${found} suscripciones activas. Revísalas en tu panel y decide qué hacer con cada una.`
                  : 'Tu cuenta está configurada. Empieza a explorar tu panel de control y conecta tus cuentas cuando quieras.'}
              </p>
              <button onClick={finish}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 10, fontSize: 15, fontWeight: 700, color: '#fff', background: '#0A1629', border: 'none', padding: '14px 28px', borderRadius: 12, cursor: 'pointer' }}>
                Ir al panel de control
                <Icon name="arrowRight" size={16} color="#fff"/>
              </button>
            </div>

            <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #E5E9F0', padding: '28px', boxShadow: '0 2px 12px rgba(0,0,0,.06)' }}>
              <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: '#94A3B8', marginBottom: 18 }}>Resumen de tu configuración</p>
              {[
                { iconName: 'cancel',     label: 'Objetivos',          value: goals.length > 0 ? `${goals.length} objetivo${goals.length > 1 ? 's' : ''} seleccionado${goals.length > 1 ? 's' : ''}` : 'Sin configurar' },
                { iconName: 'user',       label: 'Perfil',             value: firstName ? `${firstName}${lastName ? ' ' + lastName : ''}` : 'Sin completar' },
                { iconName: 'bank',       label: 'Cuenta bancaria',    value: bankAdded ? 'Extracto cargado' : 'No conectada' },
                { iconName: 'mail',       label: 'Gmail',              value: gmailAdded ? 'Conectado' : 'No conectado' },
                { iconName: 'savings',    label: 'Gasto estimado',     value: spend ? (SPEND_OPTIONS.find(s => s.id === spend)?.label ?? '—') : '—' },
              ].map((row, i, arr) => (
                <div key={row.label} style={{ display: 'flex', alignItems: 'center', gap: 12, paddingBottom: i < arr.length - 1 ? 14 : 0, marginBottom: i < arr.length - 1 ? 14 : 16, borderBottom: i < arr.length - 1 ? '1px solid #F1F5F9' : 'none' }}>
                  <div style={{ width: 34, height: 34, borderRadius: 9, background: '#F8FAFC', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Icon name={row.iconName} size={15} color="#64748B"/>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 11, color: '#94A3B8', marginBottom: 2 }}>{row.label}</div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#0A1629' }}>{row.value}</div>
                  </div>
                </div>
              ))}
              <div style={{ background: AL, borderRadius: 10, padding: '12px 14px', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <Icon name="shield" size={16} color={ACCENT}/>
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
