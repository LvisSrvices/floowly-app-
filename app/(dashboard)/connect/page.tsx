import { getGmailAuthUrl } from '@/lib/gmail'
import { createServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import CsvImporter from './csv-importer'
import BankConnector from './bank-connector'

export default async function ConnectPage({
  searchParams,
}: {
  searchParams: { error?: string }
}) {
  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const gmailUrl       = getGmailAuthUrl()
  const bankEnabled    = !!(process.env.GOCARDLESS_SECRET_ID && process.env.GOCARDLESS_SECRET_KEY)

  return (
    <main style={{ minHeight: '100vh', background: 'var(--bg)', padding: '40px 20px' }}>
      <div style={{ maxWidth: 580, margin: '0 auto' }}>

        <Link href="/dashboard" style={{ fontSize: 13, color: 'var(--txt3)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 32 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
          Volver al dashboard
        </Link>

        <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-.02em', color: 'var(--txt)', marginBottom: 8 }}>
          Conecta tus cuentas
        </h1>
        <p style={{ color: 'var(--txt2)', marginBottom: 32, lineHeight: 1.6 }}>
          Detectamos tus suscripciones analizando tus movimientos. Cuanto más completo el acceso, más precisa la detección.
        </p>

        {searchParams.error && (
          <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 10, padding: '12px 16px', marginBottom: 20, fontSize: 13, color: '#B91C1C' }}>
            {searchParams.error === 'gmail_denied'    && 'Acceso denegado. Necesitamos acceso de solo lectura a Gmail.'}
            {searchParams.error === 'gmail_failed'    && 'Error al conectar Gmail. Inténtalo de nuevo.'}
            {searchParams.error === 'bank_failed'     && 'Error al conectar el banco. Inténtalo de nuevo.'}
            {searchParams.error === 'no_accounts'     && 'El banco no devolvió cuentas. Asegúrate de autorizar el acceso completo.'}
            {searchParams.error === 'missing_user'    && 'Sesión expirada. Vuelve a intentarlo.'}
            {searchParams.error === 'no_requisition'  && 'No se encontró la solicitud de conexión. Inténtalo de nuevo.'}
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

          {/* ── Banco directo ───────────────────────────────────────────── */}
          {bankEnabled ? (
            <div className="card" style={{ padding: '18px 20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
                <div style={{ width: 42, height: 42, background: '#EFF6FF', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
                  </svg>
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--txt)' }}>Conectar banco directamente</div>
                  <div style={{ fontSize: 12, color: 'var(--txt3)', marginTop: 2 }}>Santander, BBVA, CaixaBank, ING y +2.300 bancos europeos</div>
                </div>
              </div>
              <BankConnector userId={user.id} />
            </div>
          ) : (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 16,
              padding: '18px 20px', background: 'var(--card)',
              border: '1px solid var(--border2)', borderRadius: 12,
              opacity: .5,
            }}>
              <div style={{ width: 42, height: 42, background: '#EFF6FF', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
                </svg>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--txt)' }}>Conectar banco directamente</span>
                  <span style={{ fontSize: 10, fontWeight: 800, padding: '2px 8px', borderRadius: 20, background: 'var(--accent)', color: '#fff', letterSpacing: '.06em' }}>PRONTO</span>
                </div>
                <div style={{ fontSize: 12, color: 'var(--txt3)', marginTop: 2 }}>Santander, BBVA, CaixaBank, ING y +2.300 bancos europeos</div>
              </div>
            </div>
          )}

          {/* ── CSV / Excel ─────────────────────────────────────────────── */}
          <div className="card" style={{ padding: '18px 20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
              <div style={{ width: 42, height: 42, background: '#F0FDF4', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
                  <line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/>
                </svg>
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--txt)' }}>Subir extracto bancario</div>
                <div style={{ fontSize: 12, color: 'var(--txt3)', marginTop: 2 }}>CSV o Excel exportado desde tu banco · funciona ahora mismo</div>
              </div>
            </div>
            <CsvImporter userId={user.id} />
          </div>

          {/* ── Gmail ───────────────────────────────────────────────────── */}
          <a href={gmailUrl} style={{
            display: 'flex', alignItems: 'center', gap: 16,
            padding: '18px 20px', background: 'var(--card)',
            border: '1px solid var(--border)', borderRadius: 12, textDecoration: 'none',
          }}>
            <div style={{ width: 42, height: 42, background: '#FEF2F2', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 18, fontWeight: 900, color: '#DC2626' }}>
              G
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--txt)' }}>Conectar Gmail</div>
              <div style={{ fontSize: 12, color: 'var(--txt3)', marginTop: 2 }}>Detecta suscripciones a través de tus facturas por email</div>
            </div>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--txt3)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6"/>
            </svg>
          </a>

        </div>

        {/* Security note */}
        <div style={{ marginTop: 24, padding: '14px 18px', background: 'var(--accent-dim)', border: '1px solid var(--accent)', borderRadius: 10, display: 'flex', gap: 10, alignItems: 'flex-start' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginTop: 1, flexShrink: 0 }}>
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
          </svg>
          <p style={{ fontSize: 13, color: 'var(--txt2)', margin: 0, lineHeight: 1.5 }}>
            <strong style={{ color: 'var(--txt)' }}>Solo lectura.</strong>{' '}
            Nunca realizamos pagos ni transferencias. Tus datos no se almacenan en ningún servidor externo.
          </p>
        </div>

      </div>
    </main>
  )
}
