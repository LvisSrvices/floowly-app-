const BASE_URL = 'https://bankaccountdata.gocardless.com/api/v2'

let cachedToken: { access: string; expires: number } | null = null

async function getAccessToken(): Promise<string> {
  if (cachedToken && Date.now() < cachedToken.expires - 60_000) {
    return cachedToken.access
  }
  const res = await fetch(`${BASE_URL}/token/new/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      secret_id: process.env.GOCARDLESS_SECRET_ID,
      secret_key: process.env.GOCARDLESS_SECRET_KEY,
    }),
  })
  if (!res.ok) throw new Error(`GoCardless auth failed: ${res.status}`)
  const data = await res.json()
  cachedToken = { access: data.access, expires: Date.now() + data.access_expires * 1000 }
  return data.access
}

async function gc<T>(path: string, options?: RequestInit): Promise<T> {
  const token = await getAccessToken()
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...(options?.headers || {}),
    },
  })
  if (!res.ok) {
    const err = await res.text()
    throw new Error(`GoCardless ${path} → ${res.status}: ${err}`)
  }
  return res.json()
}

export type Institution = {
  id: string
  name: string
  bic: string
  logo: string
  countries: string[]
}

export async function getInstitutions(country: string): Promise<Institution[]> {
  return gc(`/institutions/?country=${country}`)
}

export type Requisition = {
  id: string
  link: string
  status: string
  accounts: string[]
}

export async function createRequisition(
  institutionId: string,
  redirectUrl: string,
  reference: string
): Promise<Requisition> {
  return gc('/requisitions/', {
    method: 'POST',
    body: JSON.stringify({
      redirect: redirectUrl,
      institution_id: institutionId,
      reference,
      user_language: 'ES',
    }),
  })
}

export async function getRequisition(requisitionId: string): Promise<Requisition> {
  return gc(`/requisitions/${requisitionId}/`)
}

export type Transaction = {
  transactionId: string
  bookingDate: string
  transactionAmount: { amount: string; currency: string }
  creditorName?: string
  remittanceInformationUnstructured?: string
  proprietaryBankTransactionCode?: string
}

export async function getAccountTransactions(accountId: string): Promise<Transaction[]> {
  const data = await gc<{ transactions: { booked: Transaction[] } }>(
    `/accounts/${accountId}/transactions/`
  )
  return data.transactions.booked || []
}

type DetectedSub = {
  name: string
  provider: string
  amount: number
  currency: string
  frequency: 'monthly' | 'annual' | 'weekly' | 'unknown'
  category: string
  last_charge_date: string
  confidence: 'high' | 'medium' | 'low'
}

export function detectSubscriptionsFromTransactions(transactions: Transaction[]): DetectedSub[] {
  // Group by creditor name + amount to find recurring patterns
  const groups: Record<string, Transaction[]> = {}

  for (const tx of transactions) {
    const amount = parseFloat(tx.transactionAmount.amount)
    if (amount >= 0) continue // only debits (negative amounts are expenses)

    const creditor = (
      tx.creditorName ||
      tx.remittanceInformationUnstructured ||
      'Desconocido'
    ).trim()

    const key = `${creditor}|${Math.abs(amount).toFixed(2)}|${tx.transactionAmount.currency}`
    if (!groups[key]) groups[key] = []
    groups[key].push(tx)
  }

  const results: DetectedSub[] = []

  for (const [key, txs] of Object.entries(groups)) {
    if (txs.length < 1) continue

    const [creditor, amountStr, currency] = key.split('|')
    const amount = parseFloat(amountStr)

    // Determine frequency from how often charge appears
    let frequency: DetectedSub['frequency'] = 'unknown'
    let confidence: DetectedSub['confidence'] = 'low'

    if (txs.length >= 3) {
      frequency = 'monthly'
      confidence = 'high'
    } else if (txs.length === 2) {
      // Check if ~30 days apart → monthly, ~365 → annual
      const dates = txs.map(t => new Date(t.bookingDate).getTime()).sort()
      const diffDays = (dates[1] - dates[0]) / (1000 * 60 * 60 * 24)
      if (diffDays >= 25 && diffDays <= 35) { frequency = 'monthly'; confidence = 'high' }
      else if (diffDays >= 340 && diffDays <= 390) { frequency = 'annual'; confidence = 'high' }
      else { frequency = 'monthly'; confidence = 'medium' }
    } else {
      // Single charge — only include if it looks like a known subscription
      const name = creditor.toLowerCase()
      const knownSubs = ['netflix', 'spotify', 'amazon', 'apple', 'google', 'microsoft',
        'adobe', 'dropbox', 'hbo', 'disney', 'youtube', 'linkedin', 'slack',
        'notion', 'figma', 'github', 'openai', 'canva', 'movistar', 'vodafone',
        'orange', 'jazztel', 'masmovil', 'dazn', 'filmin', 'nytimes']
      if (knownSubs.some(s => name.includes(s))) {
        confidence = 'medium'
        frequency = 'monthly'
      } else {
        continue // skip single unknown charges
      }
    }

    const category = categorize(creditor)
    const lastTx = txs.sort((a, b) =>
      new Date(b.bookingDate).getTime() - new Date(a.bookingDate).getTime()
    )[0]

    results.push({
      name: formatName(creditor),
      provider: creditor,
      amount,
      currency,
      frequency,
      category,
      last_charge_date: lastTx.bookingDate,
      confidence,
    })
  }

  return results
}

function categorize(name: string): string {
  const n = name.toLowerCase()
  if (['netflix', 'hbo', 'disney', 'spotify', 'dazn', 'filmin', 'youtube', 'amazon prime', 'apple tv', 'paramount'].some(s => n.includes(s))) return 'streaming'
  if (['movistar', 'vodafone', 'orange', 'jazztel', 'masmovil', 'o2', 'yoigo'].some(s => n.includes(s))) return 'telecom'
  if (['adobe', 'microsoft', 'google', 'github', 'notion', 'figma', 'slack', 'dropbox', 'canva', 'openai', 'linkedin'].some(s => n.includes(s))) return 'software'
  if (['seguro', 'seguros', 'axa', 'mapfre', 'zurich', 'allianz', 'sanitas', 'adeslas'].some(s => n.includes(s))) return 'insurance'
  if (['gym', 'gimnasio', 'fitness', 'mcfit', 'anytime', 'basic-fit'].some(s => n.includes(s))) return 'gym'
  if (['el pais', 'el mundo', 'expansion', 'nytimes', 'economist', 'medium'].some(s => n.includes(s))) return 'news'
  return 'other'
}

function formatName(raw: string): string {
  return raw
    .replace(/\*.*$/, '') // remove Stripe-style suffixes
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ')
}
