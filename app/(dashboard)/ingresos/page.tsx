import { createServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import IngresosClient from './ingresos-client'

export default async function IngresosPage() {
  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: items }, { data: subs }] = await Promise.all([
    supabase.from('income_items').select('*').eq('user_id', user.id).order('created_at'),
    supabase.from('subscriptions').select('id,name,amount,frequency,category').eq('user_id', user.id).eq('status', 'active'),
  ])

  return (
    <IngresosClient
      user={{ id: user.id, email: user.email! }}
      items={items || []}
      subscriptions={subs || []}
    />
  )
}
