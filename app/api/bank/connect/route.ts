import { createRequisition } from '@/lib/gocardless'
import { createServiceClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const { institution_id, user_id, country } = await req.json()

  if (!institution_id || !user_id) {
    return NextResponse.json({ error: 'Missing params' }, { status: 400 })
  }

  const redirectUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/callback/gocardless?user_id=${user_id}&country=${country || 'ES'}`

  try {
    const requisition = await createRequisition(institution_id, redirectUrl, `neg-${user_id.slice(0, 8)}`)

    // Store requisition ID so we can retrieve accounts on callback
    const supabase = createServiceClient()
    await supabase.from('connected_accounts').upsert({
      user_id,
      type: 'bank',
      provider: `gocardless_${institution_id}`,
      access_token: requisition.id, // we store requisition_id here temporarily
      connected_at: new Date().toISOString(),
    }, { onConflict: 'user_id,provider' })

    return NextResponse.json({ link: requisition.link })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
