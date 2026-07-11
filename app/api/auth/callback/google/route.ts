import { NextRequest, NextResponse } from 'next/server'
import { exchangeCodeForTokens } from '@/lib/gmail'
import { createServerClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const error = searchParams.get('error')

  if (error || !code) {
    return NextResponse.redirect(new URL('/connect?error=gmail_denied', request.url))
  }

  try {
    const supabase = createServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.redirect(new URL('/login', request.url))
    }

    const tokens = await exchangeCodeForTokens(code)

    // Store tokens encrypted in Supabase
    const { error: dbError } = await supabase
      .from('connected_accounts')
      .upsert({
        user_id: user.id,
        type: 'email',
        provider: 'gmail',
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        expires_at: tokens.expiry_date ? new Date(tokens.expiry_date).toISOString() : null,
        connected_at: new Date().toISOString(),
      }, { onConflict: 'user_id,provider' })

    if (dbError) throw dbError

    // Trigger background scan
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    fetch(`${appUrl}/api/scan`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-user-id': user.id },
    }).catch(() => {}) // Fire and forget

    return NextResponse.redirect(new URL('/dashboard?connected=gmail', request.url))

  } catch (err) {
    console.error('Gmail callback error:', err)
    return NextResponse.redirect(new URL('/connect?error=gmail_failed', request.url))
  }
}
