import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { generateCancellationEmail, generateNegotiationEmail } from '@/lib/claude'

export async function GET() {
  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', user.id)
    .order('amount', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function PATCH(request: NextRequest) {
  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { id, status } = body

  const { data, error } = await supabase
    .from('subscriptions')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(request: NextRequest) {
  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { action, subscription_id } = body

  if (!['cancel_email', 'negotiate_email'].includes(action)) {
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  }

  const { data: sub, error: subError } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('id', subscription_id)
    .eq('user_id', user.id)
    .single()

  if (subError || !sub) return NextResponse.json({ error: 'Subscription not found' }, { status: 404 })

  let email: { subject: string; body: string }

  if (action === 'cancel_email') {
    email = await generateCancellationEmail({
      name: sub.name,
      provider: sub.provider,
      userEmail: user.email!,
    })
  } else {
    email = await generateNegotiationEmail({
      name: sub.name,
      provider: sub.provider,
      amount: sub.amount || 0,
      currency: sub.currency || 'EUR',
      userEmail: user.email!,
    })
  }

  // Log the action
  await supabase.from('negotiations').insert({
    user_id: user.id,
    subscription_id,
    channel: 'email_template',
    action,
    status: 'template_generated',
    email_subject: email.subject,
    email_body: email.body,
  })

  return NextResponse.json({ email })
}
