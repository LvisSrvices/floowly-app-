import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export interface EmailSnippet {
  id: string
  subject: string
  from: string
  date: string
  snippet: string
}

export interface DetectedSubscription {
  name: string
  provider: string
  amount: number | null
  currency: string
  frequency: 'monthly' | 'annual' | 'weekly' | 'unknown'
  category: 'streaming' | 'software' | 'telecom' | 'insurance' | 'gym' | 'news' | 'other'
  email_from: string
  last_charge_date: string
  confidence: 'high' | 'medium' | 'low'
  raw_subject: string
}

export async function detectSubscriptions(emails: EmailSnippet[]): Promise<DetectedSubscription[]> {
  if (emails.length === 0) return []

  const emailsText = emails
    .slice(0, 150) // Max 150 emails per scan to control cost
    .map(e => `[${e.date}] FROM: ${e.from} | SUBJECT: ${e.subject} | PREVIEW: ${e.snippet}`)
    .join('\n')

  const response = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 4000,
    messages: [
      {
        role: 'user',
        content: `Analiza estos emails y extrae todas las suscripciones y cargos recurrentes que encuentres.

EMAILS:
${emailsText}

Devuelve SOLO un JSON válido con este formato exacto, sin texto adicional:
{
  "subscriptions": [
    {
      "name": "nombre del servicio (ej: Netflix, Spotify, Movistar Fibra)",
      "provider": "empresa que cobra",
      "amount": 9.99,
      "currency": "EUR",
      "frequency": "monthly",
      "category": "streaming",
      "email_from": "email remitente",
      "last_charge_date": "2024-01-15",
      "confidence": "high",
      "raw_subject": "asunto original del email"
    }
  ]
}

Reglas:
- Solo incluye suscripciones reales con cobros recurrentes
- Si no encuentras el importe exacto, pon null
- frequency: "monthly", "annual", "weekly" o "unknown"
- category: "streaming", "software", "telecom", "insurance", "gym", "news" u "other"
- confidence: "high" (importe + frecuencia claros), "medium" (uno de los dos), "low" (solo reconoces el servicio)
- Agrupa duplicados (mismo servicio, mismo proveedor) en uno solo con la fecha más reciente
- Detecta tanto en español como en inglés`,
      },
    ],
  })

  const text = response.content[0].type === 'text' ? response.content[0].text : ''

  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) return []
    const parsed = JSON.parse(jsonMatch[0])
    return parsed.subscriptions || []
  } catch {
    console.error('Error parsing Claude response:', text)
    return []
  }
}

export async function generateCancellationEmail(subscription: {
  name: string
  provider: string
  userEmail: string
}): Promise<{ subject: string; body: string }> {
  const response = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 600,
    messages: [
      {
        role: 'user',
        content: `Redacta un email formal y directo para cancelar la suscripción a "${subscription.name}" de "${subscription.provider}".

El email lo envía: ${subscription.userEmail}

Devuelve SOLO JSON válido:
{
  "subject": "Solicitud de baja de suscripción — [Nombre del servicio]",
  "body": "Estimados señores de [Proveedor],\\n\\nMe dirijo a ustedes para solicitar la cancelación inmediata de mi suscripción...\\n\\nAtentamente,\\n[Usuario]"
}

El email debe:
- Ser formal pero directo
- Pedir confirmación de la baja por escrito
- Mencionar que no se autoricen más cargos
- Estar en español
- Ser conciso (máximo 150 palabras)`,
      },
    ],
  })

  const text = response.content[0].type === 'text' ? response.content[0].text : ''

  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error('No JSON found')
    return JSON.parse(jsonMatch[0])
  } catch {
    return {
      subject: `Solicitud de baja — ${subscription.name}`,
      body: `Estimados señores de ${subscription.provider},\n\nSolicito la cancelación inmediata de mi suscripción y confirmo que no autorizo ningún cargo futuro.\n\nRuego confirmación por escrito.\n\nAtentamente,\n${subscription.userEmail}`,
    }
  }
}

export async function generateNegotiationEmail(subscription: {
  name: string
  provider: string
  amount: number
  currency: string
  userEmail: string
}): Promise<{ subject: string; body: string }> {
  const response = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 700,
    messages: [
      {
        role: 'user',
        content: `Redacta un email para negociar un descuento en la suscripción a "${subscription.name}" de "${subscription.provider}".
Tarifa actual: ${subscription.amount} ${subscription.currency}/mes.
Lo envía: ${subscription.userEmail}

La estrategia: mencionar que llevan tiempo como cliente, que han visto tarifas mejores para nuevos clientes, y que si no hay mejora considerarán cancelar.

Devuelve SOLO JSON válido:
{
  "subject": "Revisión de tarifa — [Nombre del servicio]",
  "body": "..."
}

El email debe ser cordial pero firme, máximo 180 palabras, en español.`,
      },
    ],
  })

  const text = response.content[0].type === 'text' ? response.content[0].text : ''

  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error('No JSON found')
    return JSON.parse(jsonMatch[0])
  } catch {
    return {
      subject: `Revisión de tarifa — ${subscription.name}`,
      body: `Estimados señores de ${subscription.provider},\n\nSoy cliente de ${subscription.name} y me gustaría revisar mi tarifa actual de ${subscription.amount} ${subscription.currency}/mes.\n\nHe visto que ofrecen mejores condiciones a nuevos clientes y me gustaría beneficiarme de una oferta similar como cliente fiel.\n\nDe no ser posible, me veré obligado a valorar otras opciones.\n\nAtentamente,\n${subscription.userEmail}`,
    }
  }
}
