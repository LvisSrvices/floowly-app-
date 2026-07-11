'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import * as XLSX from 'xlsx'

type Step = 1 | 2 | 3 | 4

const STEPS = [
  { n: 1, label: 'Bienvenido' },
  { n: 2, label: 'Conectar' },
  { n: 3, label: 'Escaneando' },
  { n: 4, label: 'Listo' },
]

export default function OnboardingClient({ user }: { user: { id: string; email: string } }) {
  const [step, setStep] = useState<Step>(1)
  const [csvStatus, setCsvStatus] = useState<'idle' | 'parsing' | 'done' | 'error'>('idle')
  const [csvMessage, setCsvMessage] = useState('')
  const [found, setFound] = useState(0)
  const router = useRouter()

  async function handleCsvUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setStep(3)
    setCsvStatus('parsing')
    setCsvMessage('Analizando tus movimientos con IA...')
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
      setCsvMessage(data.found > 0 ? `¡Hemos detectado ${data.found} suscripciones!` : 'No encontramos suscripciones claras en el extracto.')
      setTimeout(() => setStep(4), 1800)
    } catch (err: any) {
      setCsvStatus('error')
      setCsvMessage(err.message || 'Error al procesar el archivo.')
      setStep(2)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F8FAFD', display: 'flex', flexDirection: 'column', fontFamily: "-apple-system, BlinkMacSystemFont, 'Inter', system-ui, sans-serif", WebkitFontSmoothing: 'antialiased' }}>

      {/* Top bar */}
      <div style={{ background: '#fff', borderBottom: '1px solid #E2E8F2', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
          <div style={{ width: 30, height: 30, borderRadius: 9, background: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/>
              <path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/>
            </svg>
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 800, color: '#0F1C2E', letterSpacing: '-.02em', lineHeight: 1 }}>Rocket Money</div>
            <div style={{ fontSize: 8.5, fontWeight: 700, color: '#059669', letterSpacing: '.06em', textTransform: 'uppercase' }}>Spain</div>
          </div>
        </div>

        {/* Steps */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {STEPS.map((s, i) => (
            <div key={s.n} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 24, height: 24, borderRadius: '50%', background: step > s.n ? '#059669' : step === s.n ? '#059669' : '#E2E8F2', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all .3s' }}>
                  {step > s.n ? (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                  ) : (
                    <span style={{ fontSize: 10, fontWeight: 700, color: step === s.n ? '#fff' : '#8FA3BC' }}>{s.n}</span>
                  )}
                </div>
                <span style={{ fontSize: 12, fontWeight: 600, color: step === s.n ? '#0F1C2E' : '#8FA3BC', display: step < 3 ? 'block' : 'none' }}>{s.label}</span>
              </div>
              {i < STEPS.length - 1 && (
                <div style={{ width: 20, height: 1, background: step > s.n ? '#059669' : '#E2E8F2', transition: 'background .3s' }} />
              )}
            </div>
          ))}
        </div>

        <div style={{ fontSize: 12, color: '#8FA3BC' }}>{user.email}</div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px' }}>

        {/* ── Step 1: Welcome ── */}
        {step === 1 && (
          <div style={{ maxWidth: 560, width: '100%', textAlign: 'center' }}>
            <div style={{ width: 72, height: 72, borderRadius: 20, background: '#ECFDF5', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
              <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/>
                <path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/>
                <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"/>
                <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/>
              </svg>
            </div>
            <h1 style={{ fontSize: 32, fontWeight: 900, color: '#0F1C2E', letterSpacing: '-.03em', marginBottom: 14, lineHeight: 1.1 }}>
              Bienvenido a<br />Rocket Money Spain
            </h1>
            <p style={{ fontSize: 16, color: '#3D5166', lineHeight: 1.7, marginBottom: 36, maxWidth: 440, margin: '0 auto 36px' }}>
              En los próximos minutos vamos a detectar todas tus suscripciones activas y te mostraremos cuánto puedes ahorrar.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 36 }}>
              {[
                { icon: '🔍', title: 'Detectamos todo', desc: 'Suscripciones ocultas incluidas' },
                { icon: '✉️', title: 'Negociamos por ti', desc: 'Emails profesionales listos' },
                { icon: '💰', title: 'Tú ahorras', desc: 'Media de 87€/mes' },
              ].map(f => (
                <div key={f.title} style={{ background: '#fff', borderRadius: 14, padding: '18px 14px', border: '1px solid #E2E8F2', textAlign: 'center' }}>
                  <div style={{ fontSize: 24, marginBottom: 8 }}>{f.icon}</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#0F1C2E', marginBottom: 4 }}>{f.title}</div>
                  <div style={{ fontSize: 11, color: '#8FA3BC' }}>{f.desc}</div>
                </div>
              ))}
            </div>

            <button onClick={() => setStep(2)} style={{ display: 'inline-flex', alignItems: 'center', gap: 10, fontSize: 16, fontWeight: 700, color: '#fff', background: '#059669', border: 'none', padding: '14px 32px', borderRadius: 12, cursor: 'pointer' }}>
              Empezar →
            </button>
            <div style={{ marginTop: 16 }}>
              <button onClick={() => router.push('/dashboard')} style={{ fontSize: 13, color: '#8FA3BC', background: 'none', border: 'none', cursor: 'pointer' }}>
                Omitir por ahora
              </button>
            </div>
          </div>
        )}

        {/* ── Step 2: Connect ── */}
        {step === 2 && (
          <div style={{ maxWidth: 520, width: '100%' }}>
            <div style={{ textAlign: 'center', marginBottom: 36 }}>
              <h2 style={{ fontSize: 28, fontWeight: 900, color: '#0F1C2E', letterSpacing: '-.03em', marginBottom: 10 }}>
                ¿Cómo quieres conectar?
              </h2>
              <p style={{ fontSize: 15, color: '#3D5166' }}>
                Elige la opción que más te convenga para detectar tus suscripciones.
              </p>
            </div>

            {csvStatus === 'error' && (
              <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 10, padding: '12px 16px', marginBottom: 16, fontSize: 13, color: '#DC2626' }}>
                {csvMessage}
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>

              {/* CSV */}
              <label style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '18px 20px', background: '#fff', borderRadius: 14, border: '2px solid #E2E8F2', cursor: 'pointer', transition: 'border-color .15s, box-shadow .15s' }}
                onMouseEnter={e => { (e.currentTarget as HTMLLabelElement).style.borderColor = '#059669'; (e.currentTarget as HTMLLabelElement).style.boxShadow = '0 0 0 3px #ECFDF5' }}
                onMouseLeave={e => { (e.currentTarget as HTMLLabelElement).style.borderColor = '#E2E8F2'; (e.currentTarget as HTMLLabelElement).style.boxShadow = 'none' }}
              >
                <div style={{ width: 48, height: 48, borderRadius: 13, background: '#ECFDF5', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/></svg>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                    <span style={{ fontSize: 15, fontWeight: 700, color: '#0F1C2E' }}>Subir extracto bancario</span>
                    <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 8px', borderRadius: 20, background: '#ECFDF5', color: '#059669' }}>RECOMENDADO</span>
                  </div>
                  <div style={{ fontSize: 13, color: '#8FA3BC' }}>CSV o Excel · Santander, BBVA, CaixaBank, ING, Openbank…</div>
                </div>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#8FA3BC" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
                <input type="file" accept=".csv,.xls,.xlsx,.txt" style={{ display: 'none' }} onChange={handleCsvUpload} />
              </label>

              {/* Gmail */}
              <Link href="/connect" style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '18px 20px', background: '#fff', borderRadius: 14, border: '2px solid #E2E8F2', cursor: 'pointer', textDecoration: 'none', transition: 'border-color .15s' }}
              >
                <div style={{ width: 48, height: 48, borderRadius: 13, background: '#FEF2F2', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 22, fontWeight: 900, color: '#DC2626' }}>G</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: '#0F1C2E', marginBottom: 3 }}>Conectar Gmail</div>
                  <div style={{ fontSize: 13, color: '#8FA3BC' }}>Detecta suscripciones por facturas recibidas en tu email</div>
                </div>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#8FA3BC" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
              </Link>

              {/* Bank direct */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '18px 20px', background: '#F8FAFD', borderRadius: 14, border: '1px solid #E2E8F2', opacity: .55 }}>
                <div style={{ width: 48, height: 48, borderRadius: 13, background: '#F0F4F9', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#8FA3BC" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                    <span style={{ fontSize: 15, fontWeight: 700, color: '#0F1C2E' }}>Conexión bancaria directa</span>
                    <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 8px', borderRadius: 20, background: '#D97706', color: '#fff' }}>PRÓXIMAMENTE</span>
                  </div>
                  <div style={{ fontSize: 13, color: '#8FA3BC' }}>Open Banking · +2.300 bancos europeos</div>
                </div>
              </div>
            </div>

            <div style={{ textAlign: 'center', marginTop: 24 }}>
              <button onClick={() => router.push('/dashboard')} style={{ fontSize: 13, color: '#8FA3BC', background: 'none', border: 'none', cursor: 'pointer' }}>
                Omitir y explorar el dashboard →
              </button>
            </div>
          </div>
        )}

        {/* ── Step 3: Scanning ── */}
        {step === 3 && (
          <div style={{ maxWidth: 440, width: '100%', textAlign: 'center' }}>
            <div style={{ width: 80, height: 80, borderRadius: '50%', background: '#ECFDF5', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 28px', border: '3px solid #059669' }}>
              {csvStatus === 'done' ? (
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
              ) : csvStatus === 'error' ? (
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              ) : (
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ animation: 'spin 1.2s linear infinite' }}>
                  <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                </svg>
              )}
            </div>

            <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>

            <h2 style={{ fontSize: 26, fontWeight: 900, color: '#0F1C2E', letterSpacing: '-.03em', marginBottom: 10 }}>
              {csvStatus === 'done' ? '¡Análisis completado!' : csvStatus === 'error' ? 'Algo falló' : 'Analizando tu extracto…'}
            </h2>
            <p style={{ fontSize: 15, color: '#3D5166', lineHeight: 1.6, marginBottom: 24 }}>
              {csvMessage || 'La IA está procesando tus movimientos para detectar suscripciones activas.'}
            </p>

            {csvStatus === 'parsing' && (
              <div style={{ height: 4, background: '#E2E8F2', borderRadius: 2, overflow: 'hidden', maxWidth: 300, margin: '0 auto' }}>
                <div style={{ height: '100%', background: '#059669', borderRadius: 2, animation: 'progress 2s ease-in-out infinite alternate', width: '70%' }} />
              </div>
            )}
            <style>{`@keyframes progress { from { width: 20%; } to { width: 90%; } }`}</style>

            {csvStatus === 'done' && (
              <div style={{ display: 'flex', justifyContent: 'center', gap: 16, flexWrap: 'wrap', marginTop: 8 }}>
                {[
                  { icon: '🔍', label: `${found} suscripciones detectadas` },
                  { icon: '✓', label: 'Datos guardados' },
                ].map(s => (
                  <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#059669', fontWeight: 600 }}>
                    {s.icon} {s.label}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Step 4: Done ── */}
        {step === 4 && (
          <div style={{ maxWidth: 480, width: '100%', textAlign: 'center' }}>
            <div style={{ width: 80, height: 80, borderRadius: '50%', background: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 28px', boxShadow: '0 12px 32px rgba(5,150,105,.35)' }}>
              <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
            </div>

            <h2 style={{ fontSize: 30, fontWeight: 900, color: '#0F1C2E', letterSpacing: '-.03em', marginBottom: 10 }}>
              ¡Todo listo! 🎉
            </h2>
            <p style={{ fontSize: 16, color: '#3D5166', lineHeight: 1.65, marginBottom: 28, maxWidth: 380, margin: '0 auto 28px' }}>
              Hemos encontrado <strong style={{ color: '#059669' }}>{found} suscripciones</strong>. Revísalas en tu dashboard y decide cuáles negociar o cancelar.
            </p>

            <div style={{ background: '#F8FAFD', borderRadius: 14, padding: '18px 20px', marginBottom: 28, border: '1px solid #E2E8F2' }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#8FA3BC', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 12 }}>Lo que puedes hacer ahora</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, textAlign: 'left' }}>
                {[
                  { icon: '📋', text: 'Revisar tus suscripciones activas' },
                  { icon: '✉️', text: 'Generar emails de negociación o cancelación' },
                  { icon: '📊', text: 'Ver el desglose de gastos por categoría' },
                  { icon: '💡', text: 'Establecer presupuestos por categoría' },
                ].map(a => (
                  <div key={a.text} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, color: '#3D5166' }}>
                    <span>{a.icon}</span>{a.text}
                  </div>
                ))}
              </div>
            </div>

            <button onClick={() => router.push('/dashboard')} style={{ display: 'inline-flex', alignItems: 'center', gap: 10, fontSize: 16, fontWeight: 700, color: '#fff', background: '#059669', border: 'none', padding: '14px 32px', borderRadius: 12, cursor: 'pointer', boxShadow: '0 4px 16px rgba(5,150,105,.3)' }}>
              Ir a mi dashboard
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
            </button>
          </div>
        )}

      </div>
    </div>
  )
}
