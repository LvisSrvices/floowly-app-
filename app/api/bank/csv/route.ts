import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

function normalizeCsv(raw: string): string {
  // Detect separator
  const sep = raw.includes(';') ? ';' : ','

  // Normalize European decimals (1.234,56 → 1234.56) only in numeric fields
  const lines = raw.split('\n').map(line => {
    return line
      .split(sep)
      .map(cell => {
        const trimmed = cell.trim().replace(/^"|"$/g, '')
        // If it looks like a European number (digits, dots as thousands, comma as decimal)
        if (/^-?[\d.]+,\d{2}$/.test(trimmed)) {
          return trimmed.replace(/\./g, '').replace(',', '.')
        }
        return trimmed
      })
      .join('|')
  })
  return lines.join('\n')
}

export async function POST(req: NextRequest) {
  const { csv, user_id } = await req.json()
  if (!csv || !user_id) return NextResponse.json({ error: 'Faltan datos' }, { status: 400 })

  const normalized = normalizeCsv(csv)
  const sample = normalized.slice(0, 10000)

  const prompt = `Eres un analizador de extractos bancarios españoles. Analiza el siguiente extracto del Banco Santander (u otro banco español) y detecta TODAS las suscripciones y pagos recurrentes.

El extracto está normalizado con | como separador. Las columnas típicas son: Fecha | Concepto | Importe | Saldo (u orden similar).
Los importes negativos son gastos (salidas de dinero) — estos son los que nos interesan.
Las fechas están en formato DD/MM/YYYY o similar.

EXTRACTO:
${sample}

Instrucciones:
1. Busca cargos con nombres de servicios conocidos: Netflix, Spotify, Amazon Prime, Apple, Google, Microsoft, Adobe, HBO, Disney+, YouTube Premium, Movistar, Vodafone, Orange, Jazztel, MásMóvil, gimnasios, seguros, periódicos digitales, etc.
2. También incluye cualquier cargo que aparezca más de una vez con el mismo concepto e importe — son pagos recurrentes aunque no reconozcas el nombre.
3. Incluye cargos únicos si el concepto claramente indica una suscripción (ej: "SUSCRIPCION", "SUBSCRIPTION", "RENEWAL", "RENOVACION").

Devuelve SOLO un array JSON. Cada objeto:
{
  "name": "nombre limpio del servicio (ej: Netflix)",
  "provider": "concepto exacto como aparece en el extracto",
  "amount": 12.99,
  "currency": "EUR",
  "frequency": "monthly" | "annual" | "weekly" | "unknown",
  "category": "streaming" | "software" | "telecom" | "insurance" | "gym" | "news" | "other",
  "last_charge_date": "YYYY-MM-DD",
  "confidence": "high" | "medium" | "low"
}

Si no encuentras ninguna suscripción, devuelve [].
SOLO el JSON, sin explicaciones ni texto adicional.`

  try {
    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 4096,
      messages: [{ role: 'user', content: prompt }],
    })

    const text = response.content[0].type === 'text' ? response.content[0].text : ''
    console.log('Claude CSV response:', text.slice(0, 500))

    const jsonMatch = text.match(/\[[\s\S]*\]/)
    if (!jsonMatch) {
      console.log('No JSON array found in response')
      return NextResponse.json({ found: 0 })
    }

    const subscriptions: any[] = JSON.parse(jsonMatch[0])
    console.log(`Detected ${subscriptions.length} subscriptions from CSV`)

    if (subscriptions.length > 0) {
      const supabase = createServiceClient()
      const rows = subscriptions.map(s => ({
        user_id,
        name: s.name,
        provider: s.provider,
        amount: typeof s.amount === 'number' ? s.amount : parseFloat(String(s.amount).replace(',', '.')),
        currency: s.currency || 'EUR',
        frequency: s.frequency || 'monthly',
        category: s.category || 'other',
        status: 'active',
        detected_via: 'csv',
        confidence: s.confidence || 'medium',
        last_charge_date: s.last_charge_date || null,
      }))
      await supabase.from('subscriptions').upsert(rows, { onConflict: 'user_id,provider,name' })
    }

    return NextResponse.json({ found: subscriptions.length })
  } catch (e: any) {
    console.error('CSV parse error:', e)
    return NextResponse.json({
      error: 'No se pudo analizar el archivo. Asegúrate de que es un extracto bancario en formato CSV o Excel exportado desde tu banco.',
    }, { status: 500 })
  }
}
