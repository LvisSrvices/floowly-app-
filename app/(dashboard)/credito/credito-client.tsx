'use client'

import Sidebar from '@/components/Sidebar'

type Subscription = {
  id: string; name: string; amount: number | null; frequency: string
  category: string; status: string; confidence: string
}
type Budget = { category: string; amount: number }

function toMonthly(amount: number, frequency: string) {
  if (frequency === 'annual') return amount / 12
  if (frequency === 'weekly') return amount * 4.33
  return amount
}

type Factor = {
  label: string
  score: number
  max: number
  status: 'good' | 'warn' | 'bad' | 'neutral'
  detail: string
  tip: string | null
}

function calcScore(subs: Subscription[], budgets: Budget[]): { total: number; factors: Factor[] } {
  const active = subs.filter(s => s.status === 'active')
  const totalMonthly = active.reduce((s, sub) => s + (sub.amount ? toMonthly(sub.amount, sub.frequency) : 0), 0)
  const categories = new Set(active.map(s => s.category))
  const totalBudget = budgets.reduce((s, b) => s + b.amount, 0)

  // Factor 1: Número de suscripciones (ideal: 3-8)
  const subCount = active.length
  const subScore = subCount === 0 ? 0 : subCount <= 8 ? 25 : subCount <= 12 ? 15 : 5
  const subStatus: Factor['status'] = subCount <= 8 ? 'good' : subCount <= 12 ? 'warn' : 'bad'

  // Factor 2: Diversificación de categorías
  const catCount = categories.size
  const catScore = catCount >= 3 ? 25 : catCount === 2 ? 18 : catCount === 1 ? 10 : 0
  const catStatus: Factor['status'] = catCount >= 3 ? 'good' : catCount >= 2 ? 'warn' : 'neutral'

  // Factor 3: Control de presupuesto
  let budgetScore = 0
  let budgetStatus: Factor['status'] = 'neutral'
  let budgetDetail = 'Sin presupuestos configurados'
  if (budgets.length > 0) {
    const overBudgetCount = budgets.filter(b => {
      const spent = active.filter(s => s.category === b.category).reduce((sum, s) => sum + (s.amount ? toMonthly(s.amount, s.frequency) : 0), 0)
      return spent > b.amount
    }).length
    const adherence = 1 - overBudgetCount / budgets.length
    budgetScore = Math.round(adherence * 25)
    budgetStatus = adherence === 1 ? 'good' : adherence >= 0.6 ? 'warn' : 'bad'
    budgetDetail = overBudgetCount === 0 ? 'Todos los presupuestos bajo control' : `${overBudgetCount} categoría${overBudgetCount > 1 ? 's' : ''} sobre el límite`
  }

  // Factor 4: Confianza de detección
  const highConf = active.filter(s => s.confidence === 'high').length
  const confScore = active.length === 0 ? 0 : Math.round((highConf / active.length) * 25)
  const confStatus: Factor['status'] = confScore >= 20 ? 'good' : confScore >= 12 ? 'warn' : 'neutral'

  const total = subScore + catScore + budgetScore + confScore

  return {
    total,
    factors: [
      {
        label: 'Carga de suscripciones',
        score: subScore, max: 25,
        status: subStatus,
        detail: subCount === 0 ? 'Sin suscripciones detectadas' : `${subCount} suscripcion${subCount !== 1 ? 'es' : ''} activa${subCount !== 1 ? 's' : ''}`,
        tip: subCount > 8 ? 'Tienes demasiadas suscripciones. Considera cancelar las que menos uses.' : null,
      },
      {
        label: 'Diversificación de gastos',
        score: catScore, max: 25,
        status: catStatus,
        detail: catCount === 0 ? 'Sin datos' : `${catCount} categoría${catCount !== 1 ? 's' : ''} diferente${catCount !== 1 ? 's' : ''}`,
        tip: catCount < 2 ? 'Diversificar tus gastos es señal de hábitos financieros más equilibrados.' : null,
      },
      {
        label: 'Control de presupuesto',
        score: budgetScore, max: 25,
        status: budgetStatus,
        detail: budgetDetail,
        tip: budgets.length === 0 ? 'Configura presupuestos en la sección Presupuestos para mejorar este factor.' : null,
      },
      {
        label: 'Calidad de datos',
        score: confScore, max: 25,
        status: confStatus,
        detail: active.length === 0 ? 'Sin datos' : `${highConf} de ${active.length} suscripciones con alta confianza`,
        tip: confScore < 12 ? 'Conecta tu banco o sube un extracto completo para mejorar la detección.' : null,
      },
    ],
  }
}

function ScoreRing({ score }: { score: number }) {
  const r = 70
  const circ = 2 * Math.PI * r
  const fill = (score / 100) * circ
  const color = score >= 70 ? '#059669' : score >= 45 ? '#D97706' : '#E11D48'
  const label = score >= 70 ? 'Buena' : score >= 45 ? 'Regular' : 'Mejorable'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <svg width="180" height="180" viewBox="0 0 180 180">
        <circle cx="90" cy="90" r={r} fill="none" stroke="var(--border2)" strokeWidth="18" />
        <circle
          cx="90" cy="90" r={r}
          fill="none" stroke={color} strokeWidth="18"
          strokeDasharray={`${fill} ${circ - fill}`}
          strokeDashoffset={circ / 4}
          strokeLinecap="round"
          style={{ transition: 'stroke-dasharray .6s ease' }}
        />
        <text x="90" y="83" textAnchor="middle" fontSize="32" fontWeight="900" fill={color} style={{ fontVariantNumeric: 'tabular-nums' }}>{score}</text>
        <text x="90" y="103" textAnchor="middle" fontSize="13" fontWeight="700" fill={color}>{label}</text>
        <text x="90" y="119" textAnchor="middle" fontSize="10" fill="var(--txt3)">de 100</text>
      </svg>
    </div>
  )
}

const STATUS_COLOR = { good: '#059669', warn: '#D97706', bad: '#E11D48', neutral: '#6B7280' }
const STATUS_BG = { good: '#D1FAE5', warn: '#FEF3C7', bad: '#FEE2E2', neutral: '#F3F4F6' }
const STATUS_LABEL = { good: 'Bueno', warn: 'Mejorable', bad: 'Atención', neutral: 'Sin datos' }

export default function CreditoClient({
  user, subscriptions, budgets,
}: {
  user: { id: string; email: string }
  subscriptions: Subscription[]
  budgets: Budget[]
}) {
  const { total, factors } = calcScore(subscriptions, budgets)

  return (
    <div className="app-shell">
      <Sidebar email={user.email} />

      <div className="app-main">
        <header className="page-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div className="page-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--txt)', letterSpacing: '-.02em' }}>Salud financiera</div>
              <div style={{ fontSize: 12, color: 'var(--txt3)' }}>Puntuación basada en tus hábitos de suscripción</div>
            </div>
          </div>
        </header>

        <div className="page-content">

          {/* Score + factors */}
          <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: 24, marginBottom: 28, alignItems: 'start' }}>

            {/* Ring */}
            <div className="card" style={{ padding: 24, textAlign: 'center' }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--txt3)', textTransform: 'uppercase', letterSpacing: '.6px', marginBottom: 12 }}>Tu puntuación</div>
              <ScoreRing score={total} />
              <div style={{ fontSize: 12, color: 'var(--txt3)', marginTop: 8 }}>
                Basada en {subscriptions.filter(s => s.status === 'active').length} suscripciones activas
              </div>
            </div>

            {/* Factors */}
            <div className="card" style={{ padding: 24 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--txt)', marginBottom: 18 }}>Factores analizados</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {factors.map(f => (
                  <div key={f.label}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--txt)' }}>{f.label}</div>
                        <div style={{ fontSize: 11, color: 'var(--txt3)', marginTop: 1 }}>{f.detail}</div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                        <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 9px', borderRadius: 20, background: STATUS_BG[f.status], color: STATUS_COLOR[f.status] }}>
                          {STATUS_LABEL[f.status]}
                        </span>
                        <span style={{ fontSize: 14, fontWeight: 800, color: STATUS_COLOR[f.status], fontVariantNumeric: 'tabular-nums', minWidth: 40, textAlign: 'right' }}>
                          {f.score}/{f.max}
                        </span>
                      </div>
                    </div>
                    <div style={{ height: 6, background: 'var(--border2)', borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${(f.score / f.max) * 100}%`, background: STATUS_COLOR[f.status], borderRadius: 3, transition: 'width .4s ease' }} />
                    </div>
                    {f.tip && (
                      <div style={{ fontSize: 11, color: '#92400E', background: '#FEF3C7', padding: '6px 10px', borderRadius: 6, marginTop: 7 }}>
                        💡 {f.tip}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Real credit score info */}
          <div className="card" style={{ padding: 24 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--txt)', marginBottom: 4 }}>Consulta tu puntuación de crédito real</div>
            <div style={{ fontSize: 12, color: 'var(--txt3)', marginBottom: 18 }}>
              Nuestra puntuación mide tus hábitos con suscripciones. Para tu historial crediticio real, consulta estas fuentes oficiales:
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
              {[
                { name: 'Equifax España', desc: 'Informe de crédito gratuito una vez al año', badge: 'España', color: '#DC2626' },
                { name: 'ASNEF (Equifax)', desc: 'Registro de morosos más usado por bancos españoles', badge: 'España', color: '#DC2626' },
                { name: 'Banco de España · CIRBE', desc: 'Central de Información de Riesgos — todos tus préstamos', badge: 'Oficial', color: '#059669' },
                { name: 'TransUnion · Experian', desc: 'Historial crediticio internacional y score FICO', badge: 'Internacional', color: '#7C3AED' },
              ].map(s => (
                <div key={s.name} className="card" style={{ padding: '14px 16px', background: 'var(--bg)', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: s.color, marginTop: 4, flexShrink: 0 }} />
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--txt)' }}>{s.name}</span>
                      <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 20, background: s.color + '18', color: s.color }}>{s.badge}</span>
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--txt3)', lineHeight: 1.4 }}>{s.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
