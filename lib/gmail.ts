import { google } from 'googleapis'

const SUBSCRIPTION_KEYWORDS = [
  // Spanish
  'suscripción', 'suscripcion', 'factura', 'recibo', 'cargo', 'cobro', 'renovación',
  'renovacion', 'pago mensual', 'pago anual', 'se ha renovado', 'confirmación de pago',
  'tu factura', 'recibo de', 'aviso de cobro', 'domiciliación',
  // English
  'subscription', 'invoice', 'receipt', 'billing', 'payment confirmation',
  'your receipt', 'your invoice', 'has been renewed', 'renewal', 'monthly plan',
  'annual plan', 'your plan', 'membership',
  // Common providers
  'netflix', 'spotify', 'amazon', 'apple', 'google', 'microsoft', 'adobe',
  'movistar', 'vodafone', 'orange', 'jazztel', 'másmóvil', 'masmovil',
  'endesa', 'iberdrola', 'naturgy', 'repsol',
  'gym', 'gimnasio', 'clubhouse', 'disney', 'hbo', 'max', 'paramount',
  'chatgpt', 'openai', 'claude', 'midjourney', 'canva', 'dropbox',
  'linkedin', 'youtube premium', 'twitch',
]

export function getGmailAuthUrl(): string {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  )

  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: [
      'https://www.googleapis.com/auth/gmail.readonly',
      'https://www.googleapis.com/auth/userinfo.email',
    ],
  })
}

export async function exchangeCodeForTokens(code: string) {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  )

  const { tokens } = await oauth2Client.getToken(code)
  return tokens
}

export async function fetchSubscriptionEmails(accessToken: string, refreshToken: string) {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  )

  oauth2Client.setCredentials({ access_token: accessToken, refresh_token: refreshToken })

  const gmail = google.gmail({ version: 'v1', auth: oauth2Client })

  // Build query: subscription-related emails from the last 90 days
  const ninetyDaysAgo = new Date()
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)
  const dateStr = ninetyDaysAgo.toISOString().split('T')[0].replace(/-/g, '/')

  const query = `(${SUBSCRIPTION_KEYWORDS.slice(0, 20).join(' OR ')}) after:${dateStr}`

  const listResponse = await gmail.users.messages.list({
    userId: 'me',
    q: query,
    maxResults: 200,
  })

  const messages = listResponse.data.messages || []

  const emails = await Promise.all(
    messages.slice(0, 150).map(async (msg) => {
      try {
        const detail = await gmail.users.messages.get({
          userId: 'me',
          id: msg.id!,
          format: 'metadata',
          metadataHeaders: ['Subject', 'From', 'Date'],
        })

        const headers = detail.data.payload?.headers || []
        const getHeader = (name: string) => headers.find(h => h.name === name)?.value || ''

        return {
          id: msg.id!,
          subject: getHeader('Subject'),
          from: getHeader('From'),
          date: getHeader('Date'),
          snippet: detail.data.snippet || '',
        }
      } catch {
        return null
      }
    })
  )

  return emails.filter(Boolean) as {
    id: string
    subject: string
    from: string
    date: string
    snippet: string
  }[]
}
