import { createServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import SettingsClient from './settings-client'

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: { tab?: string }
}) {
  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: accounts } = await supabase
    .from('connected_accounts')
    .select('provider, last_synced, type')
    .eq('user_id', user.id)

  return (
    <SettingsClient
      user={{ id: user.id, email: user.email!, user_metadata: user.user_metadata ?? {} }}
      connectedAccounts={accounts || []}
      initialTab={searchParams.tab || 'perfil'}
    />
  )
}
