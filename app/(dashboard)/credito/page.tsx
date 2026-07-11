import { createServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import CreditoClient from './credito-client'

export default async function CreditoPage() {
  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: subscriptions }, { data: budgets }] = await Promise.all([
    supabase.from('subscriptions').select('*').eq('user_id', user.id),
    supabase.from('budgets').select('*').eq('user_id', user.id),
  ])

  return (
    <CreditoClient
      user={{ id: user.id, email: user.email! }}
      subscriptions={subscriptions || []}
      budgets={budgets || []}
    />
  )
}
