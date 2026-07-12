import Stripe from 'stripe'

const stripeKey = process.env.STRIPE_SECRET_KEY || process.env.STRIPE_KEY || ''

export const stripe = new Stripe(stripeKey, {
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
