import { getRequisition, getAccountTransactions, detectSubscriptionsFromTransactions } from '@/lib/gocardless'
import { createServiceClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get('user_id')
  const country = req.nextUrl.searchParams.get('country') || 'ES'
  const ref = req.nextUrl.searchParams.get('ref')

  if (!userId) {
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/connect?error=missing_user`)
  }

  const supabase = createServiceClient()

  try {
    // Find the pending requisition for this user
    const { data: accounts } = await supabase
      .from('connected_accounts')
      .select('*')
      .eq('user_id', userId)
      .eq('type', 'bank')
      .order('connected_at', { ascending: false })
      .limit(1)

    if (!accounts || accounts.length === 0) {
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/connect?error=no_requisition`)
    }

    const requisitionId = accounts[0].access_token
    const requisition = await getRequisition(requisitionId)

    if (!requisition.accounts || requisition.accounts.length === 0) {
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/connect?error=no_accounts`)
    }

    // Log scan start
    const { data: scanLog } = await supabase.from('scan_logs').insert({
      user_id: userId,
      status: 'running',
      started_at: new Date().toISOString(),
    }).select().single()

    // Fetch transactions from all linked accounts
    let allTransactions: any[] = []
    for (const accountId of requisition.accounts) {
      try {
        const txs = await getAccountTransactions(accountId)
        allTransactions = allTransactions.concat(txs)
      } catch (e) {
        console.error(`Error fetching account ${accountId}:`, e)
      }
    }

    // Detect subscriptions
    const detected = detectSubscriptionsFromTransactions(allTransactions)

    // Upsert subscriptions
    if (detected.length > 0) {
      const rows = detected.map(s => ({
        user_id: userId,
        name: s.name,
        provider: s.provider,
        amount: s.amount,
        currency: s.currency,
        frequency: s.frequency,
        category: s.category,
        status: 'active',
        detected_via: 'bank',
        confidence: s.confidence,
        last_charge_date: s.last_charge_date,
      }))
      await supabase.from('subscriptions').upsert(rows, { onConflict: 'user_id,provider,name' })
    }

    // Update account with requisition details
    await supabase.from('connected_accounts').update({
      refresh_token: requisition.id,
      last_synced: new Date().toISOString(),
    }).eq('user_id', userId).eq('type', 'bank')

    // Complete scan log
    if (scanLog) {
      await supabase.from('scan_logs').update({
        status: 'completed',
        emails_scanned: allTransactions.length,
        subscriptions_found: detected.length,
        completed_at: new Date().toISOString(),
      }).eq('id', scanLog.id)
    }

    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?connected=bank`
    )
  } catch (e: any) {
    console.error('GoCardless callback error:', e)
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/connect?error=bank_failed`)
  }
}
