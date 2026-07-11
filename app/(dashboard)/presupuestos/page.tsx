import { createServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import PresupuestosClient from './presupuestos-client'

export default async function PresupuestosPage() {
  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: subscriptions }, { data: budgets }] = await Promise.all([
    supabase.from('subscriptions').select('*').eq('user_id', user.id).eq('status', 'active'),
    supabase.from('budgets').select('*').eq('user_id', user.id),
  ])

  return (
    <PresupuestosClient
      user={{ id: user.id, email: user.email! }}
      subscriptions={subscriptions || []}
      budgets={budgets || []}
    />
  )
}
