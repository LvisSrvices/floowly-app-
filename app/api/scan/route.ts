import { NextRequest, NextResponse } from 'next/server'
import { fetchSubscriptionEmails } from '@/lib/gmail'
import { detectSubscriptions } from '@/lib/claude'
import { createServiceClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  const userId = request.headers.get('x-user-id')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = createServiceClient()

  try {
    // Get Gmail tokens
    const { data: account, error: accountError } = await supabase
      .from('connected_accounts')
      .select('access_token, refresh_token')
      .eq('user_id', userId)
      .eq('provider', 'gmail')
      .single()

    if (accountError || !account) {
      return NextResponse.json({ error: 'No Gmail account connected' }, { status: 400 })
    }

    // Mark scan as in progress
    await supabase.from('scan_logs').insert({
      user_id: userId,
      status: 'running',
      started_at: new Date().toISOString(),
    })

    // Fetch emails from Gmail
    const emails = await fetchSubscriptionEmails(account.access_token, account.refresh_token)

    // Detect subscriptions with Claude
    const detected = await detectSubscriptions(emails)

    // Upsert to database
    if (detected.length > 0) {
      const rows = detected.map(sub => ({
        user_id: userId,
        name: sub.name,
        provider: sub.provider,
        amount: sub.amount,
        currency: sub.currency || 'EUR',
        frequency: sub.frequency,
        category: sub.category,
        email_from: sub.email_from,
        last_charge_date: sub.last_charge_date || null,
        status: 'active',
        detected_via: 'email',
        confidence: sub.confidence,
      }))

      await supabase.from('subscriptions').upsert(rows, {
        onConflict: 'user_id,provider,name',
        ignoreDuplicates: false,
      })
    }

    // Update scan log
    await supabase.from('scan_logs').update({
      status: 'completed',
      emails_scanned: emails.length,
      subscriptions_found: detected.length,
      completed_at: new Date().toISOString(),
    }).eq('user_id', userId).eq('status', 'running')

    // Update last scan time
    await supabase.from('connected_accounts')
      .update({ last_synced: new Date().toISOString() })
      .eq('user_id', userId)
      .eq('provider', 'gmail')

    return NextResponse.json({
      success: true,
      emails_scanned: emails.length,
      subscriptions_found: detected.length,
    })

  } catch (err) {
    console.error('Scan error:', err)

    await supabase.from('scan_logs').update({
      status: 'failed',
      error: err instanceof Error ? err.message : 'Unknown error',
      completed_at: new Date().toISOString(),
    }).eq('user_id', userId).eq('status', 'running')

    return NextResponse.json({ error: 'Scan failed' }, { status: 500 })
  }
}
