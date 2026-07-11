import { createServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import RecurrentesClient from './recurrentes-client'

export default async function RecurrentesPage() {
  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: subscriptions } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', user.id)
    .order('amount', { ascending: false })

  return (
    <RecurrentesClient
      user={{ id: user.id, email: user.email! }}
      subscriptions={subscriptions || []}
    />
  )
}
