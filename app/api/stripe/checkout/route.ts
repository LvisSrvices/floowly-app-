import { stripe } from '@/lib/stripe'
import { createServerClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST() {
  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://shimmering-cactus-e983dc.netlify.app'

  // Retrieve or create Stripe customer
  let customerId: string = user.user_metadata?.stripe_customer_id ?? ''

  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email!,
      metadata: { supabase_uid: user.id },
    })
    customerId = customer.id
    await supabase.auth.updateUser({ data: { stripe_customer_id: customerId } })
  }

  // Create checkout session with a 30-day trial
  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [
      {
        price_data: {
          currency: 'eur',
          product_data: {
            name: 'Floowly Premium',
            description: 'Control total de tus suscripciones y facturas',
            images: [`${appUrl}/logo.png`],
          },
          unit_amount: 399, // 3,99€
          recurring: { interval: 'month' },
        },
        quantity: 1,
      },
    ],
    subscription_data: {
      trial_period_days: 30,
      metadata: { supabase_uid: user.id },
    },
    success_url: `${appUrl}/dashboard?premium=success`,
    cancel_url: `${appUrl}/onboarding?step=4`,
    allow_promotion_codes: true,
    locale: 'es',
    metadata: { supabase_uid: user.id },
  })

  return NextResponse.json({ url: session.url })
}
