'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { createBrowserClient } from '@/lib/supabase/client'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Suspense } from 'react'
import FloowlyLogo from '@/components/FloowlyLogo'

function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const supabase = createBrowserClient()
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    if (searchParams.get('mode') === 'register') setMode('register')
  }, [searchParams])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      if (mode === 'register') {
        const { error } = await supabase.auth.signUp({ email, password })
        if (error) throw error
        setSent(true)
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        router.push('/dashboard')
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al iniciar sesión')
    } finally {
      setLoading(false)
    }
  }

  if (sent) {
    return (
      <div style={boxStyle}>
        <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#ECFDF5', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', fontSize: 28 }}>✉️</div>
        <h2 style={{ ...titleStyle, textAlign: 'center' }}>Revisa tu email</h2>
        <p style={{ color: 'var(--txt2)', textAlign: 'center', fontSize: 14, lineHeight: 1.6 }}>
          Hemos enviado un enlace de confirmación a<br /><strong>{email}</strong>
        </p>
        <p style={{ color: 'var(--txt3)', textAlign: 'center', fontSize: 13, marginTop: 14 }}>
          Después de confirmar, accede con tus credenciales.
        </p>
        <button onClick={() => { setSent(false); setMode('login') }} style={{ width: '100%', marginTop: 20, padding: '11px 16px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--txt)', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
          Iniciar sesión →
        </button>
      </div>
    )
  }

  return (
    <div style={boxStyle}>
      {/* Logo */}
      <Link href="/" style={{ textDecoration: 'none', marginBottom: 28, display: 'inline-block' }}>
        <FloowlyLogo size="md" variant="light" />
      </Link>

      <h1 style={titleStyle}>
        {mode === 'login' ? 'Iniciar sesión' : 'Crear cuenta gratis'}
      </h1>
      <p style={{ fontSize: 14, color: 'var(--txt3)', marginTop: -16, marginBottom: 24 }}>
        {mode === 'login' ? 'Bienvenido de nuevo.' : 'Empieza a controlar tus suscripciones.'}
      </p>

      {error && (
        <div style={{ background: 'var(--danger-bg)', border: '1px solid #FECACA', borderRadius: 10, padding: '11px 14px', marginBottom: 18, fontSize: 13, color: 'var(--danger)' }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div>
          <label>Email</label>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="tu@email.com" required />
        </div>
        <div>
          <label>Contraseña</label>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required minLength={8} />
        </div>
        <button type="submit" className="btn btn-primary" disabled={loading} style={{ justifyContent: 'center', marginTop: 4, padding: '13px 16px', fontSize: 15, borderRadius: 10 }}>
          {loading ? 'Cargando…' : mode === 'login' ? 'Entrar →' : 'Crear cuenta →'}
        </button>
      </form>

      <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--txt3)', marginTop: 22 }}>
        {mode === 'login' ? '¿No tienes cuenta? ' : '¿Ya tienes cuenta? '}
        <button onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError('') }}
          style={{ color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 13 }}>
          {mode === 'login' ? 'Regístrate gratis' : 'Iniciar sesión'}
        </button>
      </p>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 20 }}>
        <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
        <span style={{ fontSize: 11, color: 'var(--txt3)' }}>seguro y privado</span>
        <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'center', gap: 18, marginTop: 14 }}>
        {['🔒 SSL', '🇪🇺 RGPD', '👁 Solo lectura'].map(t => (
          <span key={t} style={{ fontSize: 11.5, color: 'var(--txt3)', fontWeight: 500 }}>{t}</span>
        ))}
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, background: 'var(--bg)' }}>
      <Suspense fallback={<div style={boxStyle}><div style={{ fontSize: 14, color: 'var(--txt3)' }}>Cargando…</div></div>}>
        <LoginForm />
      </Suspense>
    </main>
  )
}

const boxStyle: React.CSSProperties = {
  width: '100%',
  maxWidth: 400,
  background: 'var(--card)',
  border: '1px solid var(--border)',
  borderRadius: 18,
  padding: '32px 28px',
  boxShadow: '0 8px 32px rgba(15,28,46,.08)',
}

const titleStyle: React.CSSProperties = {
  fontSize: 24,
  fontWeight: 900,
  letterSpacing: '-.03em',
  color: 'var(--txt)',
  marginBottom: 6,
}
