import { getInstitutions } from '@/lib/gocardless'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const country = req.nextUrl.searchParams.get('country') || 'ES'
  try {
    const institutions = await getInstitutions(country)
    return NextResponse.json(institutions)
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
