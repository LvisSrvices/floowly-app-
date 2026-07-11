import { getGmailAuthUrl } from '@/lib/gmail'
import { createServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import CsvImporter from './csv-importer'

export default async function ConnectPage({
  searchParams,
}: {
  searchParams: { error?: string }
}) {
  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const gmailUrl = getGmailAuthUrl()

  return (
    <main style={{ minHeight: '100vh', background: 'var(--bg)', padding: '40px 20px' }}>
      <div style={{ maxWidth: 560, margin: '0 auto' }}>

        <Link href="/dashboard" style={{ fontSize: 13, color: 'var(--txt3)', textDecoration: 'none', display: 'block', marginBottom: 32 }}>
          ← Volver al dashboard
        </Link>

        <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-.02em', color: 'var(--txt)', marginBottom: 8 }}>
          Conecta tus cuentas
        </h1>
        <p style={{ color: 'var(--txt2)', marginBottom: 32, lineHeight: 1.6 }}>
          Detectamos tus suscripciones analizando tus movimientos. Elige cómo conectar.
        </p>

        {searchParams.error && (
          <div style={{ background: 'var(--danger-bg)', border: '1px solid var(--danger)', borderRadius: 8, padding: '12px 16px', marginBottom: 20, fontSize: 13, color: 'var(--danger)' }}>
            {searchParams.error === 'gmail_denied' && 'Acceso denegado. Necesitamos acceso de solo lectura a Gmail.'}
            {searchParams.error === 'gmail_failed' && 'Error al conectar Gmail. Inténtalo de nuevo.'}
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

          {/* Bank direct — coming soon */}
          <div style={{ position: 'relative', borderRadius: 12, overflow: 'hidden' }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 16,
              padding: '18px 20px', background: 'var(--card)',
              border: '1px solid var(--border)', borderRadius: 12,
              opacity: .5, cursor: 'not-allowed',
            }}>
              <div style={{ width: 40, height: 40, background: '#EFF6FF', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>
                🏦
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--txt)' }}>Conectar banco directamente</span>
                  <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 20, background: 'var(--accent)', color: '#fff', letterSpacing: '.04em' }}>PRONTO</span>
                </div>
                <div style={{ fontSize: 12, color: 'var(--txt3)', marginTop: 2 }}>Santander, BBVA, CaixaBank, ING y +2.300 bancos</div>
              </div>
            </div>
          </div>

          {/* CSV import */}
          <div className="card" style={{ padding: '18px 20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
              <div style={{ width: 40, height: 40, background: '#F0FDF4', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>
                📄
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--txt)' }}>Subir extracto bancario</div>
                <div style={{ fontSize: 12, color: 'var(--txt3)', marginTop: 2 }}>Sube el CSV o Excel de tu banco — lo analizamos al instante</div>
              </div>
            </div>
            <CsvImporter userId={user.id} />
          </div>

          {/* Gmail */}
          <a href={gmailUrl} style={{
            display: 'flex', alignItems: 'center', gap: 16,
            padding: '18px 20px', background: 'var(--card)',
            border: '1px solid var(--border)', borderRadius: 12, textDecoration: 'none',
          }}>
            <div style={{ width: 40, height: 40, background: '#FEF2F2', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>
              G
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--txt)' }}>Conectar Gmail</div>
              <div style={{ fontSize: 12, color: 'var(--txt3)', marginTop: 2 }}>Detecta suscripciones por facturas recibidas</div>
            </div>
            <span style={{ color: 'var(--txt3)' }}>→</span>
          </a>

        </div>

        <div style={{ marginTop: 24, padding: '14px 18px', background: 'var(--accent-dim)', border: '1px solid var(--accent)', borderRadius: 10 }}>
          <p style={{ fontSize: 13, color: 'var(--txt2)', margin: 0, lineHeight: 1.5 }}>
            <strong style={{ color: 'var(--txt)' }}>Solo lectura.</strong>{' '}
            Nunca realizamos pagos ni transferencias. Tus datos no se almacenan en ningún servidor externo.
          </p>
        </div>

      </div>
    </main>
  )
}
