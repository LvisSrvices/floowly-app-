import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Negociador — Cancela y negocia tus suscripciones',
  description: 'Detecta todas tus suscripciones, cancela las que no usas y negocia mejores precios automáticamente.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  )
}
