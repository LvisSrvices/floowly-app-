'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import * as XLSX from 'xlsx'

export default function CsvImporter({ userId }: { userId: string }) {
  const [status, setStatus] = useState<'idle' | 'parsing' | 'done' | 'error'>('idle')
  const [message, setMessage] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  async function handleFile(file: File) {
    if (!file) return
    setStatus('parsing')
    setMessage('Leyendo archivo...')

    try {
      let csvText: string

      const ext = file.name.split('.').pop()?.toLowerCase()

      if (ext === 'xlsx' || ext === 'xls') {
        // Parse Excel → convert to CSV text
        const buffer = await file.arrayBuffer()
        const workbook = XLSX.read(buffer, { type: 'array' })
        const sheetName = workbook.SheetNames[0]
        const sheet = workbook.Sheets[sheetName]
        csvText = XLSX.utils.sheet_to_csv(sheet, { FS: ';' })
      } else {
        csvText = await file.text()
      }

      setMessage('Analizando movimientos con IA...')

      const res = await fetch('/api/bank/csv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ csv: csvText, user_id: userId }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error procesando el archivo')

      if (data.found === 0) {
        setStatus('error')
        setMessage('No se detectaron suscripciones. Asegúrate de que el archivo es un extracto de movimientos (no un resumen) y que contiene al menos 1-2 meses de historial.')
        return
      }

      setStatus('done')
      setMessage(`Se encontraron ${data.found} suscripciones.`)
      setTimeout(() => router.push('/dashboard?connected=csv'), 1500)

    } catch (e: any) {
      setStatus('error')
      setMessage(e.message || 'Error al procesar el archivo.')
    }
  }

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept=".csv,.xls,.xlsx,.txt"
        style={{ display: 'none' }}
        onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])}
      />

      {status === 'idle' && (
        <div>
          <button
            onClick={() => inputRef.current?.click()}
            className="btn btn-primary"
            style={{ width: '100%', justifyContent: 'center' }}
          >
            Seleccionar archivo
          </button>
          <p style={{ fontSize: 11, color: 'var(--txt3)', marginTop: 10, lineHeight: 1.6 }}>
            En Santander: <strong>Mi Banco → Mis cuentas → Movimientos → Exportar</strong><br />
            Formatos válidos: CSV, Excel (.xls/.xlsx), TXT
          </p>
        </div>
      )}

      {status === 'parsing' && (
        <div style={{ textAlign: 'center', padding: '12px 0' }}>
          <div style={{ fontSize: 22, marginBottom: 8 }}>⏳</div>
          <div style={{ fontSize: 13, color: 'var(--txt2)' }}>{message}</div>
        </div>
      )}

      {status === 'done' && (
        <div style={{ textAlign: 'center', padding: '12px 0' }}>
          <div style={{ fontSize: 22, marginBottom: 8 }}>✓</div>
          <div style={{ fontSize: 13, color: 'var(--success)', fontWeight: 600 }}>{message}</div>
          <div style={{ fontSize: 12, color: 'var(--txt3)', marginTop: 4 }}>Redirigiendo al dashboard...</div>
        </div>
      )}

      {status === 'error' && (
        <div>
          <div style={{ fontSize: 13, color: 'var(--danger)', marginBottom: 10, lineHeight: 1.5 }}>{message}</div>
          <button onClick={() => { setStatus('idle'); setMessage('') }} className="btn btn-secondary" style={{ fontSize: 12 }}>
            Intentar con otro archivo
          </button>
        </div>
      )}
    </div>
  )
}
