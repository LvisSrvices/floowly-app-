'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createBrowserClient } from '@/lib/supabase/client'

export default function Sidebar({ email }: { email: string }) {
  const pathname = usePathname()
  const router   = useRouter()
  const supabase = createBrowserClient()

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/')
  }

  const initials = email ? email.slice(0, 2).toUpperCase() : 'FL'

  const mainLinks = [
    { href: '/dashboard',    label: 'Dashboard',
      icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/></svg> },
    { href: '/recurrentes',  label: 'Suscripciones',
      icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg> },
  ]

  const financeLinks = [
    { href: '/ingresos',     label: 'Ingresos y gastos',
      icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg> },
    { href: '/presupuestos', label: 'Presupuestos',
      icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg> },
    { href: '/patrimonio',   label: 'Patrimonio neto',
      icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg> },
    { href: '/transacciones',label: 'Transacciones',
      icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg> },
    { href: '/credito',      label: 'Salud financiera',
      icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg> },
  ]

  const supportLinks = [
    { href: '/connect',  label: 'Conectar cuentas', external: false,
      icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg> },
    { href: '/settings', label: 'Configuración', external: false,
      icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14"/></svg> },
    { href: `mailto:soporte@floowly.com`, label: 'Ayuda y soporte', external: true,
      icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg> },
  ]

  return (
    <aside className="sidebar">

      {/* ── Logo ──────────────────────────────────────────────────────── */}
      <div className="sidebar-logo" style={{ gap: 8, paddingLeft: 16 }}>
        <img src="/logo.png" alt="Floowly" width={36} height={36} style={{ display: 'block', flexShrink: 0 }} />
        <span style={{
          fontSize: 22, fontWeight: 900, color: 'var(--txt)',
          letterSpacing: '-.05em', lineHeight: 1,
        }}>
          Floowly
        </span>
      </div>

      {/* ── Navigation ────────────────────────────────────────────────── */}
      <nav className="sidebar-nav">
        <div className="sidebar-section">Principal</div>
        {mainLinks.map(l => (
          <Link key={l.href} href={l.href} className={`nav-item ${pathname === l.href ? 'active' : ''}`}>
            {l.icon}{l.label}
          </Link>
        ))}

        <div className="sidebar-section">Finanzas</div>
        {financeLinks.map(l => (
          <Link key={l.href} href={l.href} className={`nav-item ${pathname === l.href ? 'active' : ''}`}>
            {l.icon}{l.label}
          </Link>
        ))}

        <div className="sidebar-section">Cuenta</div>
        {supportLinks.map(l =>
          l.external ? (
            <a key={l.href} href={l.href} className="nav-item" style={{ textDecoration: 'none' }}>
              {l.icon}{l.label}
            </a>
          ) : (
            <Link key={l.href} href={l.href} className={`nav-item ${pathname === l.href ? 'active' : ''}`}>
              {l.icon}{l.label}
            </Link>
          )
        )}
      </nav>

      {/* ── User footer ───────────────────────────────────────────────── */}
      <div className="sidebar-footer">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 6px 10px' }}>
          <div className="avatar">{initials}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--txt)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {email.split('@')[0]}
            </div>
            <div style={{ fontSize: 10.5, color: 'var(--txt3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {email}
            </div>
          </div>
        </div>
        <button onClick={handleSignOut}
          style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', borderRadius: 9, background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--txt2)', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
            <polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
          Cerrar sesión
        </button>
      </div>
    </aside>
  )
}
