import { createServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import TransaccionesClient from './transacciones-client'

export default async function TransaccionesPage() {
  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: subscriptions } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', user.id)
    .order('name')

  return (
    <TransaccionesClient
      user={{ id: user.id, email: user.email! }}
      subscriptions={subscriptions || []}
    />
  )
}
