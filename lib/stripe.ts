import Stripe from 'stripe'

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not set')
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-06-20',
})

export const PLANS = {
  premium: {
    name: 'Floowly Premium',
    priceMonthly: 399, // cents — 3,99€
    features: [
      'Cancelación automática de suscripciones',
      'Negociación de facturas con IA',
      'Detección ilimitada de movimientos',
      'Alertas de renovación anticipadas',
      'Informes mensuales en PDF y Excel',
      'Soporte prioritario 24/7',
    ],
  },
} as const
