import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

// ── 1. CSV PARSER ──────────────────────────────────────────────────────────────

type RawTx = { date: string; concept: string; amount: number; currency: string }

function parseCsv(raw: string): RawTx[] {
  // Detect separator
  const firstLine = raw.split('\n')[0] ?? ''
  const sep = firstLine.split(';').length > firstLine.split(',').length ? ';' : ','

  const lines = raw
    .split('\n')
    .map(l => l.trim().replace(/\r$/, ''))
    .filter(Boolean)

  if (lines.length < 2) return []

  // Parse header to find column positions
  const header = lines[0].split(sep).map(h => h.trim().toLowerCase().replace(/"/g, ''))

  const dateIdx    = header.findIndex(h => /fecha|date|día|dia/.test(h))
  const conceptIdx = header.findIndex(h => /concepto|descripci|description|detail|movimiento|referencia/.test(h))
  // Some banks use separate debit/credit columns; others use a single signed amount
  const amountIdx  = header.findIndex(h => /^importe$|^amount$|^importe.*eur|^saldo.*movimiento|cuantía|cuantia/.test(h))
  const debitIdx   = header.findIndex(h => /cargo|debe|debito|débito|salida|out/.test(h))
  const creditIdx  = header.findIndex(h => /abono|haber|credito|crédito|entrada|in/.test(h))

  const results: RawTx[] = []

  for (let i = 1; i < lines.length; i++) {
    const cols = splitCsvLine(lines[i], sep)

    const rawDate    = dateIdx >= 0    ? cols[dateIdx]    ?? '' : cols[0] ?? ''
    const rawConcept = conceptIdx >= 0 ? cols[conceptIdx] ?? '' : cols[1] ?? ''

    let amount = 0
    if (amountIdx >= 0) {
      amount = parseEuropeanNumber(cols[amountIdx] ?? '')
    } else if (debitIdx >= 0) {
      const debit  = parseEuropeanNumber(cols[debitIdx]  ?? '')
      const credit = parseEuropeanNumber(cols[creditIdx] ?? '')
      amount = credit - debit  // negative = expense
    }

    if (!rawConcept || amount === 0) continue

    results.push({
      date:    normalizeDate(rawDate),
      concept: rawConcept.trim().replace(/"/g, ''),
      amount,
      currency: 'EUR',
    })
  }

  return results
}

function splitCsvLine(line: string, sep: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false
  for (const ch of line) {
    if (ch === '"') { inQuotes = !inQuotes; continue }
    if (ch === sep && !inQuotes) { result.push(current.trim()); current = ''; continue }
    current += ch
  }
  result.push(current.trim())
  return result
}

function parseEuropeanNumber(s: string): number {
  const clean = s.trim().replace(/"/g, '').replace(/\s/g, '')
  if (!clean) return 0
  // European: 1.234,56 → 1234.56
  if (/^-?[\d.]+,\d{1,2}$/.test(clean)) {
    return parseFloat(clean.replace(/\./g, '').replace(',', '.'))
  }
  // US: 1,234.56
  if (/^-?[\d,]+\.\d{1,2}$/.test(clean)) {
    return parseFloat(clean.replace(/,/g, ''))
  }
  return parseFloat(clean) || 0
}

function normalizeDate(s: string): string {
  const clean = s.trim().replace(/"/g, '')
  // DD/MM/YYYY or DD-MM-YYYY
  const m1 = clean.match(/^(\d{1,2})[/\-](\d{1,2})[/\-](\d{4})$/)
  if (m1) return `${m1[3]}-${m1[2].padStart(2, '0')}-${m1[1].padStart(2, '0')}`
  // YYYY-MM-DD already ISO
  if (/^\d{4}-\d{2}-\d{2}$/.test(clean)) return clean
  return clean
}

// ── 2. ALGORITHMIC RECURRING DETECTION ────────────────────────────────────────

// Keywords that strongly suggest a subscription even on a single occurrence
const SUB_KEYWORDS = [
  // Explicit subscription markers
  'suscripcion', 'suscripción', 'subscription', 'renovacion', 'renovación',
  'renewal', 'cuota', 'mensualidad', 'tarifa', 'plan', 'premium',
  // SEPA direct debit prefixes (banks show these for recurring charges)
  'rcur', 'sepa', 'adeudo directo', 'domiciliacion', 'domiciliación',
  // Streaming
  'netflix', 'spotify', 'amazon prime', 'primevideo', 'prime video',
  'hbo', 'max.com', 'disney', 'dazn', 'filmin', 'youtube premium',
  'apple tv', 'apple one', 'appletv', 'paramount', 'crunchyroll', 'twitch',
  'apple music', 'apple arcade', 'apple icloud',
  // Software & cloud
  'microsoft', 'office 365', 'microsoft 365', 'adobe', 'creative cloud',
  'dropbox', 'notion', 'github', 'figma', 'slack', 'canva', 'openai',
  'chatgpt', 'google one', 'google storage', 'icloud', 'linkedin',
  'duolingo', 'babbel', 'audible', 'kindle',
  // Telecom & internet (WiFi, móvil, fibra)
  'movistar', 'vodafone', 'orange', 'jazztel', 'masmovil', 'más móvil',
  'digi', 'simyo', 'pepephone', 'lowi', 'yoigo', 'euskaltel', 'r cable',
  'telecable', 'fibra', 'adsl', 'internet', 'wifi', 'banda ancha',
  // Gym & fitness
  'mcfit', 'basic-fit', 'basicfit', 'anytime fitness', 'holmes place',
  'go fit', 'gofit', 'viva gym', 'vivagym', 'fitness', 'gimnasio', 'gym ',
  'sport', 'crossfit', 'pilates', 'yoga',
  // Banks / fintech subscriptions
  'n26', 'revolut', 'wise', 'paypal', 'klarna',
  // Insurance
  'axa', 'mapfre', 'zurich', 'allianz', 'sanitas', 'adeslas', 'asisa',
  'cigna', 'generali', 'seguro', 'segur',
  // News & media
  'el pais', 'el país', 'el mundo', 'expansion', 'marca', 'diario',
  'nytimes', 'economist', 'medium', 'substack',
  // Other known subscriptions
  'amazon', 'apple', 'google', 'nintendo', 'playstation', 'xbox',
  'ps plus', 'ps now', 'ea play',
]

function normalizeConcept(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '') // strip accents
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 60)
}

function conceptKey(concept: string): string {
  const n = normalizeConcept(concept)
  // Remove common noise prefixes banks add
  return n
    .replace(/^(rcur|frct|nrcr|ooff|sepa|adeudo directo|pago con tarjeta|compra|comision|comisión)\s*/i, '')
    .replace(/\s*(s\.?a\.?|s\.?l\.?|slp|ltd|inc|gmbh|srl)\s*$/i, '')
    .trim()
}

type Candidate = {
  concept: string          // representative raw concept
  normalizedKey: string    // for grouping
  amount: number
  currency: string
  dates: string[]          // all dates this charge appeared
  occurrences: number
  isKnown: boolean         // matched a known subscription keyword
}

function findCandidates(txs: RawTx[]): Candidate[] {
  // Only look at debits (negative = expense out of account, or in some formats positive debits)
  const expenses = txs.filter(tx => tx.amount < 0)

  const map = new Map<string, Candidate>()

  for (const tx of expenses) {
    const key      = `${conceptKey(tx.concept)}|${Math.abs(tx.amount).toFixed(2)}`
    const existing = map.get(key)
    const isKnown  = SUB_KEYWORDS.some(kw => normalizeConcept(tx.concept).includes(kw.toLowerCase()))

    if (existing) {
      existing.occurrences++
      existing.dates.push(tx.date)
      if (isKnown) existing.isKnown = true
    } else {
      map.set(key, {
        concept: tx.concept,
        normalizedKey: key,
        amount: Math.abs(tx.amount),
        currency: tx.currency,
        dates: [tx.date],
        occurrences: 1,
        isKnown,
      })
    }
  }

  // Keep: appears 2+ times (recurring), OR known service even if seen once
  // Exclude: single occurrence of unknown + amount > 80€ (likely one-time purchase)
  const results: Candidate[] = []
  for (const c of Array.from(map.values())) {
    if (c.occurrences >= 2) {
      results.push(c)
    } else if (c.isKnown && c.amount <= 200) {
      results.push(c)
    }
  }

  // Sort by occurrences desc, then by amount desc
  return results.sort((a, b) => b.occurrences - a.occurrences || b.amount - a.amount)
}

// ── 3. CLAUDE ENRICHMENT ───────────────────────────────────────────────────────

type EnrichedSub = {
  name: string; provider: string; amount: number; currency: string
  frequency: 'monthly' | 'annual' | 'weekly' | 'unknown'
  category: 'streaming' | 'software' | 'telecom' | 'insurance' | 'gym' | 'news' | 'other'
  last_charge_date: string; confidence: 'high' | 'medium' | 'low'
  is_subscription: boolean
}

async function enrichCandidates(candidates: Candidate[]): Promise<EnrichedSub[]> {
  if (candidates.length === 0) return []

  const list = candidates.map((c, i) =>
    `${i + 1}. concepto="${c.concept}" | importe=${c.amount.toFixed(2)}€ | aparece=${c.occurrences} veces | fechas=${c.dates.slice(0, 3).join(', ')}`
  ).join('\n')

  const prompt = `Eres un experto en suscripciones y gastos recurrentes.
Te doy una lista de transacciones bancarias que un algoritmo ha detectado como potencialmente recurrentes.
Tu trabajo es:
1. Confirmar si cada una es una suscripción/gasto recurrente REAL (gimnasio, telecom, streaming, software, seguro, etc.)
2. Descartar pagos que NO son suscripciones: compras únicas, transferencias, nóminas, alquileres, supermercados, restaurantes, gasolina, etc.
3. Limpiar el nombre y categorizar correctamente.

LISTA DE CANDIDATOS:
${list}

Para cada entrada, devuelve un objeto JSON. Si NO es suscripción, pon "is_subscription": false.

Array JSON (una entrada por candidato, mismo orden):
[
  {
    "name": "nombre limpio del servicio (ej: 'Gimnasio Holmes Place', 'Orange Fibra', 'Netflix')",
    "provider": "concepto exacto como aparece en el extracto",
    "amount": 12.99,
    "currency": "EUR",
    "frequency": "monthly",
    "category": "streaming|software|telecom|insurance|gym|news|other",
    "last_charge_date": "YYYY-MM-DD",
    "confidence": "high|medium|low",
    "is_subscription": true
  }
]

Categorías:
- streaming: Netflix, Spotify, HBO, Disney+, DAZN, Twitch, YouTube Premium, Apple TV, Apple Music
- software: Microsoft, Adobe, Dropbox, Notion, GitHub, Canva, Google One, iCloud, LinkedIn, OpenAI, Duolingo
- telecom: cualquier compañía de móvil, fibra, internet, WiFi (Movistar, Vodafone, Orange, Jazztel, DIGI, Lowi, MásMóvil...)
- gym: cualquier gimnasio, fitness, pilates, yoga, crossfit, McFit, Basic-Fit, GoFit, VivaGym, Anytime Fitness
- insurance: seguros (Axa, Mapfre, Sanitas, Adeslas...)
- news: periódicos y revistas digitales
- other: el resto de suscripciones válidas

IMPORTANTE: Sé estricto con "is_subscription: false" para evitar falsos positivos.
Si ves "MERCADONA", "REPSOL", "BIZUM", "TRANSFERENCIA", "NOMINA", "ALQUILER" → is_subscription: false.
SOLO devuelve el array JSON, sin texto adicional.`

  const response = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 4096,
    messages: [{ role: 'user', content: prompt }],
  })

  const text = response.content[0].type === 'text' ? response.content[0].text : ''
  const jsonMatch = text.match(/\[[\s\S]*\]/)
  if (!jsonMatch) return []

  const enriched: EnrichedSub[] = JSON.parse(jsonMatch[0])
  return enriched.filter(s => s.is_subscription !== false)
}

// ── 4. ROUTE HANDLER ──────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const { csv, user_id } = await req.json()
  if (!csv || !user_id) return NextResponse.json({ error: 'Faltan datos' }, { status: 400 })

  try {
    // Step 1: Parse all transactions
    const transactions = parseCsv(csv)
    console.log(`Parsed ${transactions.length} transactions`)

    if (transactions.length === 0) {
      return NextResponse.json({
        error: 'No se pudieron leer las transacciones. Asegúrate de exportar el archivo desde tu banco como CSV o Excel (no una captura de pantalla).',
      }, { status: 400 })
    }

    // Step 2: Algorithmic detection
    const candidates = findCandidates(transactions)
    console.log(`Found ${candidates.length} candidates`)

    if (candidates.length === 0) {
      return NextResponse.json({
        error: 'No se detectaron pagos recurrentes. Asegúrate de exportar al menos 2-3 meses de historial.',
      }, { status: 400 })
    }

    // Step 3: Claude enrichment (cap at 60 candidates to avoid huge prompts)
    const enriched = await enrichCandidates(candidates.slice(0, 60))
    console.log(`Enriched to ${enriched.length} confirmed subscriptions`)

    if (enriched.length === 0) {
      return NextResponse.json({ found: 0 })
    }

    // Step 4: Save to Supabase
    const supabase = createServiceClient()
    const rows = enriched.map(s => ({
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

    await supabase
      .from('subscriptions')
      .upsert(rows, { onConflict: 'user_id,provider,name' })

    return NextResponse.json({ found: enriched.length })
  } catch (e: any) {
    console.error('CSV detection error:', e)
    return NextResponse.json({
      error: 'Error al analizar el archivo. Si el problema persiste, contacta con soporte.',
    }, { status: 500 })
  }
}
