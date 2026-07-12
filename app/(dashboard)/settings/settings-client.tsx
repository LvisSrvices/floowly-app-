'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Sidebar from '@/components/Sidebar'
import { createBrowserClient } from '@/lib/supabase/client'

type Tab = 'perfil' | 'alertas' | 'cuentas' | 'plan'

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: 'perfil',   label: 'Mi perfil',
    icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg> },
  { id: 'alertas',  label: 'Alertas',
    icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg> },
  { id: 'cuentas',  label: 'Cuentas conectadas',
    icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg> },
  { id: 'plan',     label: 'Mi plan',
    icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg> },
]

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button onClick={() => onChange(!value)}
      style={{ width: 44, height: 24, borderRadius: 12, background: value ? 'var(--accent)' : 'var(--border)', border: 'none', cursor: 'pointer', position: 'relative', transition: 'background .2s', flexShrink: 0 }}>
      <div style={{ width: 18, height: 18, borderRadius: '50%', background: '#fff', position: 'absolute', top: 3, left: value ? 23 : 3, transition: 'left .2s', boxShadow: '0 1px 3px rgba(0,0,0,.2)' }} />
    </button>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 32 }}>
      <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--txt3)', marginBottom: 12 }}>{title}</div>
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>{children}</div>
    </div>
  )
}

function Row({ label, sublabel, children, last }: { label: string; sublabel?: string; children: React.ReactNode; last?: boolean }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, padding: '14px 20px', borderBottom: last ? 'none' : '1px solid var(--border2)' }}>
      <div>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--txt)' }}>{label}</div>
        {sublabel && <div style={{ fontSize: 12, color: 'var(--txt3)', marginTop: 2 }}>{sublabel}</div>}
      </div>
      <div style={{ flexShrink: 0 }}>{children}</div>
    </div>
  )
}

export default function SettingsClient({
  user, connectedAccounts, initialTab,
}: {
  user: { id: string; email: string; user_metadata: Record<string, any> }
  connectedAccounts: { provider: string; last_synced: string | null; type: string }[]
  initialTab: string
}) {
  const [tab, setTab]           = useState<Tab>(initialTab as Tab || 'perfil')
  const [profile, setProfile]   = useState({
    first_name:  user.user_metadata.first_name  || '',
    last_name:   user.user_metadata.last_name   || '',
    phone:       user.user_metadata.phone       || '',
    birthdate:   user.user_metadata.birthdate   || '',
    purpose:     user.user_metadata.purpose     || '',
  })
  const [alerts, setAlerts]     = useState({
    email_alerts:      user.user_metadata.alert_email     ?? true,
    inapp_alerts:      user.user_metadata.alert_inapp     ?? true,
    days_before:       user.user_metadata.alert_days      ?? 7,
    weekly_digest:     user.user_metadata.alert_digest    ?? true,
    unusual_charges:   user.user_metadata.alert_unusual   ?? true,
    renewal_reminder:  user.user_metadata.alert_renewal   ?? true,
  })
  const [saving, setSaving]     = useState(false)
  const [saved, setSaved]       = useState(false)
  const [error, setError]       = useState<string | null>(null)
  const [changingPw, setChangingPw] = useState(false)
  const [pwForm, setPwForm]     = useState({ current: '', next: '', confirm: '' })
  const [pwError, setPwError]   = useState<string | null>(null)
  const [pwSaved, setPwSaved]   = useState(false)
  const supabase = createBrowserClient()
  const router   = useRouter()

  const isPremium = user.user_metadata.is_premium === true

  async function saveProfile() {
    setSaving(true); setError(null); setSaved(false)
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          first_name:  profile.first_name,
          last_name:   profile.last_name,
          phone:       profile.phone,
          birthdate:   profile.birthdate,
          purpose:     profile.purpose,
        }),
      })
      if (!res.ok) { const d = await res.json(); setError(d.error); return }
      setSaved(true); setTimeout(() => setSaved(false), 3000)
    } finally { setSaving(false) }
  }

  async function saveAlerts() {
    setSaving(true); setError(null); setSaved(false)
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          alert_email:   alerts.email_alerts,
          alert_inapp:   alerts.inapp_alerts,
          alert_days:    alerts.days_before,
          alert_digest:  alerts.weekly_digest,
          alert_unusual: alerts.unusual_charges,
          alert_renewal: alerts.renewal_reminder,
        }),
      })
      if (!res.ok) { const d = await res.json(); setError(d.error); return }
      setSaved(true); setTimeout(() => setSaved(false), 3000)
    } finally { setSaving(false) }
  }

  async function changePassword() {
    if (pwForm.next !== pwForm.confirm) { setPwError('Las contraseñas no coinciden'); return }
    if (pwForm.next.length < 6) { setPwError('Mínimo 6 caracteres'); return }
    setPwError(null)
    const { error } = await supabase.auth.updateUser({ password: pwForm.next })
    if (error) { setPwError(error.message); return }
    setPwSaved(true); setChangingPw(false); setPwForm({ current: '', next: '', confirm: '' })
    setTimeout(() => setPwSaved(false), 3000)
  }

  async function disconnectAccount(provider: string) {
    await fetch('/api/subscriptions', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ provider }),
    })
    router.refresh()
  }

  async function openBillingPortal() {
    const res  = await fetch('/api/stripe/portal', { method: 'POST' })
    const data = await res.json()
    if (data.url) window.location.href = data.url
    else setError(data.error || 'No se pudo abrir el portal de facturación')
  }

  const initials = (profile.first_name?.[0] || user.email[0]).toUpperCase() +
                   (profile.last_name?.[0]  || user.email[1]).toUpperCase()

  return (
    <div className="app-shell">
      <Sidebar email={user.email} />

      <div className="app-main">
        <header className="page-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div className="page-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14"/></svg>
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--txt)', letterSpacing: '-.02em' }}>Configuración</div>
              <div style={{ fontSize: 12, color: 'var(--txt3)' }}>Gestiona tu cuenta y preferencias</div>
            </div>
          </div>
        </header>

        <div className="page-content" style={{ maxWidth: 720 }}>

          {/* Tabs */}
          <div style={{ display: 'flex', gap: 4, background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, padding: 4, marginBottom: 28 }}>
            {TABS.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)}
                style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, padding: '9px 12px', borderRadius: 9, fontSize: 13, fontWeight: 600, cursor: 'pointer', border: 'none', transition: 'all .15s',
                  background: tab === t.id ? 'var(--accent)' : 'transparent',
                  color: tab === t.id ? '#fff' : 'var(--txt2)',
                }}>
                {t.icon}{t.label}
              </button>
            ))}
          </div>

          {/* Status messages */}
          {saved && (
            <div style={{ background: '#ECFDF5', border: '1px solid #A7F3D0', borderRadius: 10, padding: '11px 16px', marginBottom: 20, fontSize: 13, color: '#065F46', display: 'flex', gap: 8, alignItems: 'center' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
              Cambios guardados correctamente
            </div>
          )}
          {error && (
            <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 10, padding: '11px 16px', marginBottom: 20, fontSize: 13, color: '#B91C1C' }}>
              {error}
            </div>
          )}

          {/* ── PERFIL ───────────────────────────────────────────────────── */}
          {tab === 'perfil' && (
            <div>
              {/* Avatar */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 20, padding: '20px 24px', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 16, marginBottom: 24 }}>
                <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, fontWeight: 800, color: '#fff', flexShrink: 0 }}>
                  {initials}
                </div>
                <div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--txt)' }}>
                    {profile.first_name || profile.last_name ? `${profile.first_name} ${profile.last_name}`.trim() : user.email.split('@')[0]}
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--txt3)', marginTop: 3 }}>{user.email}</div>
                  {isPremium && (
                    <div style={{ marginTop: 8, display: 'inline-flex', alignItems: 'center', gap: 5, background: 'linear-gradient(135deg, #F59E0B, #D97706)', color: '#fff', fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20 }}>
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                      PREMIUM
                    </div>
                  )}
                </div>
              </div>

              <Section title="Información personal">
                <div style={{ padding: '20px 24px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--txt3)', display: 'block', marginBottom: 5 }}>Nombre</label>
                    <input value={profile.first_name} onChange={e => setProfile(p => ({ ...p, first_name: e.target.value }))} placeholder="Tu nombre" />
                  </div>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--txt3)', display: 'block', marginBottom: 5 }}>Apellidos</label>
                    <input value={profile.last_name} onChange={e => setProfile(p => ({ ...p, last_name: e.target.value }))} placeholder="Tus apellidos" />
                  </div>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--txt3)', display: 'block', marginBottom: 5 }}>Teléfono</label>
                    <input value={profile.phone} onChange={e => setProfile(p => ({ ...p, phone: e.target.value }))} placeholder="+34 600 000 000" type="tel" />
                  </div>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--txt3)', display: 'block', marginBottom: 5 }}>Fecha de nacimiento</label>
                    <input value={profile.birthdate} onChange={e => setProfile(p => ({ ...p, birthdate: e.target.value }))} type="date" />
                  </div>
                  <div style={{ gridColumn: 'span 2' }}>
                    <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--txt3)', display: 'block', marginBottom: 5 }}>Correo electrónico</label>
                    <input value={user.email} disabled style={{ opacity: .5, cursor: 'not-allowed' }} />
                  </div>
                  <div style={{ gridColumn: 'span 2' }}>
                    <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--txt3)', display: 'block', marginBottom: 5 }}>¿Para qué usas Floowly?</label>
                    <select value={profile.purpose} onChange={e => setProfile(p => ({ ...p, purpose: e.target.value }))}>
                      <option value="">Selecciona una opción</option>
                      <option value="ahorro">Ahorrar dinero</option>
                      <option value="control">Tener el control de mis gastos</option>
                      <option value="cancelar">Cancelar suscripciones que no uso</option>
                      <option value="negociar">Negociar mejores tarifas</option>
                      <option value="patrimonio">Gestionar mi patrimonio</option>
                    </select>
                  </div>
                </div>
                <div style={{ padding: '0 24px 20px', display: 'flex', gap: 10 }}>
                  <button onClick={saveProfile} disabled={saving} className="btn btn-primary" style={{ fontSize: 13 }}>
                    {saving ? 'Guardando…' : 'Guardar cambios'}
                  </button>
                </div>
              </Section>

              <Section title="Seguridad">
                {!changingPw ? (
                  <>
                    <Row label="Contraseña" sublabel="Última actualización: no disponible">
                      <button onClick={() => setChangingPw(true)} className="btn btn-secondary" style={{ fontSize: 12 }}>Cambiar</button>
                    </Row>
                    {pwSaved && (
                      <div style={{ padding: '10px 20px', fontSize: 12, color: '#065F46' }}>✓ Contraseña actualizada</div>
                    )}
                  </>
                ) : (
                  <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <input type="password" placeholder="Nueva contraseña" value={pwForm.next}
                      onChange={e => setPwForm(p => ({ ...p, next: e.target.value }))} />
                    <input type="password" placeholder="Confirmar nueva contraseña" value={pwForm.confirm}
                      onChange={e => setPwForm(p => ({ ...p, confirm: e.target.value }))} />
                    {pwError && <div style={{ fontSize: 12, color: '#B91C1C' }}>{pwError}</div>}
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button onClick={changePassword} className="btn btn-primary" style={{ fontSize: 13 }}>Actualizar</button>
                      <button onClick={() => { setChangingPw(false); setPwError(null) }} className="btn btn-secondary" style={{ fontSize: 13 }}>Cancelar</button>
                    </div>
                  </div>
                )}
                <Row label="Eliminar cuenta" sublabel="Borrar todos tus datos permanentemente" last>
                  <button className="btn btn-danger" style={{ fontSize: 12 }}
                    onClick={() => alert('Para eliminar tu cuenta contacta con soporte@floowly.com')}>
                    Eliminar
                  </button>
                </Row>
              </Section>
            </div>
          )}

          {/* ── ALERTAS ──────────────────────────────────────────────────── */}
          {tab === 'alertas' && (
            <div>
              <Section title="Canales de notificación">
                <Row label="Alertas por email" sublabel={user.email}>
                  <Toggle value={alerts.email_alerts} onChange={v => setAlerts(a => ({ ...a, email_alerts: v }))} />
                </Row>
                <Row label="Notificaciones en la app" sublabel="Aparecen al abrir Floowly" last>
                  <Toggle value={alerts.inapp_alerts} onChange={v => setAlerts(a => ({ ...a, inapp_alerts: v }))} />
                </Row>
              </Section>

              <Section title="Tipos de alerta">
                <Row label="Recordatorio de renovación" sublabel="Antes de que se cobre una suscripción">
                  <Toggle value={alerts.renewal_reminder} onChange={v => setAlerts(a => ({ ...a, renewal_reminder: v }))} />
                </Row>
                <Row label="Cargos inusuales" sublabel="Cuando detectamos un pago diferente a lo habitual">
                  <Toggle value={alerts.unusual_charges} onChange={v => setAlerts(a => ({ ...a, unusual_charges: v }))} />
                </Row>
                <Row label="Resumen semanal" sublabel="Resumen de tus gastos cada lunes" last>
                  <Toggle value={alerts.weekly_digest} onChange={v => setAlerts(a => ({ ...a, weekly_digest: v }))} />
                </Row>
              </Section>

              <Section title="Anticipación del recordatorio">
                <div style={{ padding: '16px 20px' }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--txt)', marginBottom: 12 }}>
                    Avisar con cuántos días de antelación
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {[3, 7, 14, 30].map(days => (
                      <button key={days} onClick={() => setAlerts(a => ({ ...a, days_before: days }))}
                        style={{ flex: 1, padding: '10px 0', borderRadius: 10, border: `2px solid ${alerts.days_before === days ? 'var(--accent)' : 'var(--border)'}`, background: alerts.days_before === days ? 'var(--accent-dim)' : 'var(--card)', color: alerts.days_before === days ? 'var(--accent)' : 'var(--txt2)', fontSize: 13, fontWeight: 700, cursor: 'pointer', transition: 'all .15s' }}>
                        {days}d
                      </button>
                    ))}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--txt3)', marginTop: 10 }}>
                    Recibirás el aviso {alerts.days_before} día{alerts.days_before !== 1 ? 's' : ''} antes del próximo cobro
                  </div>
                </div>
              </Section>

              <button onClick={saveAlerts} disabled={saving} className="btn btn-primary">
                {saving ? 'Guardando…' : 'Guardar preferencias'}
              </button>
            </div>
          )}

          {/* ── CUENTAS CONECTADAS ───────────────────────────────────────── */}
          {tab === 'cuentas' && (
            <div>
              <Section title="Cuentas activas">
                {connectedAccounts.length === 0 ? (
                  <div style={{ padding: '24px 20px', textAlign: 'center', color: 'var(--txt3)', fontSize: 13 }}>
                    No tienes cuentas conectadas todavía
                  </div>
                ) : connectedAccounts.map((acc, i) => {
                  const isLast = i === connectedAccounts.length - 1
                  const label = acc.provider.startsWith('gocardless_')
                    ? acc.provider.replace('gocardless_', '').replace(/_/g, ' ')
                    : acc.provider === 'gmail' ? 'Gmail' : acc.provider
                  const icon  = acc.provider === 'gmail'
                    ? <div style={{ width: 34, height: 34, borderRadius: 8, background: '#FEF2F2', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 900, color: '#DC2626' }}>G</div>
                    : <div style={{ width: 34, height: 34, borderRadius: 8, background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>
                      </div>
                  return (
                    <Row key={acc.provider} label={label} sublabel={acc.last_synced ? `Último sync: ${new Date(acc.last_synced).toLocaleDateString('es-ES')}` : 'Conectada'} last={isLast}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#059669' }} />
                        <span style={{ fontSize: 11, color: '#059669', fontWeight: 600 }}>Activa</span>
                      </div>
                    </Row>
                  )
                })}
              </Section>

              <Section title="Añadir cuenta">
                <Row label="Conectar banco" sublabel="Acceso de solo lectura vía PSD2">
                  <a href="/connect" className="btn btn-primary" style={{ fontSize: 12, textDecoration: 'none' }}>Conectar →</a>
                </Row>
                <Row label="Conectar Gmail" sublabel="Detecta facturas en tu email" last>
                  <a href="/connect" className="btn btn-secondary" style={{ fontSize: 12, textDecoration: 'none' }}>Conectar →</a>
                </Row>
              </Section>
            </div>
          )}

          {/* ── PLAN ─────────────────────────────────────────────────────── */}
          {tab === 'plan' && (
            <div>
              <div className="card" style={{ padding: '28px 32px', marginBottom: 20, background: isPremium ? 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)' : 'var(--card)', position: 'relative', overflow: 'hidden' }}>
                {isPremium && <div style={{ position: 'absolute', right: -30, top: -30, width: 120, height: 120, borderRadius: '50%', background: 'rgba(245,158,11,.1)' }} />}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                  {isPremium
                    ? <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'linear-gradient(135deg,#F59E0B,#D97706)', color: '#fff', fontSize: 12, fontWeight: 800, padding: '5px 14px', borderRadius: 20 }}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                        PLAN PREMIUM
                      </div>
                    : <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--txt2)', fontSize: 12, fontWeight: 700, padding: '5px 14px', borderRadius: 20 }}>
                        PLAN GRATUITO
                      </div>
                  }
                </div>
                <div style={{ fontSize: isPremium ? 28 : 24, fontWeight: 900, color: isPremium ? '#fff' : 'var(--txt)', letterSpacing: '-.03em', marginBottom: 8 }}>
                  {isPremium ? '3,99€ / mes' : 'Gratis'}
                </div>
                <div style={{ fontSize: 13, color: isPremium ? 'rgba(255,255,255,.7)' : 'var(--txt3)', marginBottom: 20 }}>
                  {isPremium ? 'Suscripción activa con 30 días de prueba gratuita' : 'Acceso básico — actualiza para desbloquear todo'}
                </div>
                {isPremium ? (
                  <button onClick={openBillingPortal} className="btn btn-secondary" style={{ fontSize: 13, background: 'rgba(255,255,255,.1)', color: '#fff', border: '1px solid rgba(255,255,255,.2)' }}>
                    Gestionar suscripción →
                  </button>
                ) : (
                  <a href="/onboarding?step=4" className="btn btn-primary" style={{ fontSize: 14, padding: '10px 24px', textDecoration: 'none' }}>
                    Actualizar a Premium →
                  </a>
                )}
              </div>

              <Section title="Qué incluye Premium">
                {[
                  ['Detección ilimitada de suscripciones', isPremium],
                  ['Negociación de facturas con IA', isPremium],
                  ['Cancelación automática de suscripciones', isPremium],
                  ['Alertas de renovación anticipadas', true],
                  ['Informes mensuales en PDF y Excel', isPremium],
                  ['Soporte prioritario 24/7', isPremium],
                  ['Historial de patrimonio neto', isPremium],
                  ['Análisis de ingresos y gastos fijos', isPremium],
                ].map(([feat, active], i, arr) => (
                  <Row key={String(feat)} label={String(feat)} last={i === arr.length - 1}>
                    {active
                      ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                      : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--txt3)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/></svg>
                    }
                  </Row>
                ))}
              </Section>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
