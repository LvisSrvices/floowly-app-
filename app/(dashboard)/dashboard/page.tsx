import { createServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import DashboardClient from './dashboard-client'

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: { connected?: string }
}) {
  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: subscriptions }, { data: accounts }, { data: scanLog }] = await Promise.all([
    supabase.from('subscriptions').select('*').eq('user_id', user.id).order('amount', { ascending: false }),
    supabase.from('connected_accounts').select('provider, last_synced').eq('user_id', user.id),
    supabase.from('scan_logs').select('*').eq('user_id', user.id).order('started_at', { ascending: false }).limit(1).maybeSingle(),
  ])

  const hasGmail = accounts?.some(a => a.provider === 'gmail') ?? false
  const totalMonthly = (subscriptions || [])
    .filter(s => s.status === 'active' && s.frequency === 'monthly' && s.amount)
    .reduce((sum, s) => sum + (s.amount || 0), 0)

  return (
    <DashboardClient
      user={{ id: user.id, email: user.email!, user_metadata: user.user_metadata }}
      subscriptions={subscriptions || []}
      hasGmail={hasGmail}
      totalMonthly={totalMonthly}
      scanning={scanLog?.status === 'running'}
      justConnected={searchParams.connected === 'gmail'}
    />
  )
}
