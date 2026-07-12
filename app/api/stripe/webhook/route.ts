import { stripe } from '@/lib/stripe'
import { createServiceClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig  = req.headers.get('stripe-signature')!

  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 })
  }

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET)
  } catch (err: any) {
    return NextResponse.json({ error: `Webhook error: ${err.message}` }, { status: 400 })
  }

  const supabase = createServiceClient()

  async function updateUserPremium(customerId: string, isPremium: boolean, subscriptionId?: string) {
    const customer = await stripe.customers.retrieve(customerId) as Stripe.Customer
    const uid = customer.metadata?.supabase_uid
    if (!uid) return

    await supabase.auth.admin.updateUserById(uid, {
      user_metadata: {
        is_premium: isPremium,
        stripe_customer_id: customerId,
        stripe_subscription_id: subscriptionId ?? null,
        premium_since: isPremium ? new Date().toISOString() : null,
      }
    })
  }

  switch (event.type) {
    case 'customer.subscription.created':
    case 'customer.subscription.updated': {
      const sub = event.data.object as Stripe.Subscription
      const active = ['active', 'trialing'].includes(sub.status)
      await updateUserPremium(sub.customer as string, active, sub.id)
      break
    }
    case 'customer.subscription.deleted': {
      const sub = event.data.object as Stripe.Subscription
      await updateUserPremium(sub.customer as string, false)
      break
    }
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.CheckoutSession
      if (session.mode === 'subscription' && session.subscription) {
        const sub = await stripe.subscriptions.retrieve(session.subscription as string)
        const active = ['active', 'trialing'].includes(sub.status)
        await updateUserPremium(session.customer as string, active, sub.id)
      }
      break
    }
  }

  return NextResponse.json({ received: true })
}
