import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Floowly Money — Controla tus suscripciones y finanzas',
  description: 'Detecta todas tus suscripciones, cancela las que no usas y negocia mejores precios automáticamente.',
  icons: {
    icon: '/logo.png',
    apple: '/logo.png',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  )
}
