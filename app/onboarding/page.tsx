import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import OnboardingClient from './onboarding-client'

export default async function OnboardingPage() {
  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  return <OnboardingClient user={{ id: user.id, email: user.email! }} />
}
