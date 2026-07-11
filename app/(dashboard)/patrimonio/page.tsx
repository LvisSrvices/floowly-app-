import { createServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import PatrimonioClient from './patrimonio-client'

export default async function PatrimonioPage() {
  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: items } = await supabase
    .from('net_worth_items')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at')

  return (
    <PatrimonioClient
      user={{ id: user.id, email: user.email! }}
      items={items || []}
    />
  )
}
