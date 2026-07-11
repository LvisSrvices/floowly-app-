import { createServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import GastosClient from './gastos-client'

export default async function GastosPage() {
  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: subscriptions } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .order('amount', { ascending: false })

  return <GastosClient user={{ id: user.id, email: user.email! }} subscriptions={subscriptions || []} />
}
