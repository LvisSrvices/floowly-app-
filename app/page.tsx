import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import Link from 'next/link'
import FloowlyLogo, { FloowlyIcon } from '@/components/FloowlyLogo'

export default async function LandingPage() {
  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (user) redirect('/dashboard')

  return (
    <div style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', system-ui, sans-serif", WebkitFontSmoothing: 'antialiased' }}>
      <style>{`
        * { box-sizing: border-box; }
        .feat-card { background:#fff; border-radius:16px; padding:28px 26px; border:1px solid #E2E8F2; transition:box-shadow .2s,transform .2s; cursor:default; }
        .feat-card:hover { box-shadow:0 12px 40px rgba(15,28,46,.1); transform:translateY(-3px); }
        .review-card { background:#fff; border-radius:18px; padding:26px; border:1px solid #E2E8F2; transition:box-shadow .2s; }
        .review-card:hover { box-shadow:0 8px 32px rgba(15,28,46,.09); }
        .faq-item { border-bottom:1px solid #E2E8F2; }
        .faq-item summary { list-style:none; cursor:pointer; padding:21px 0; font-size:16px; font-weight:700; color:#0F1C2E; display:flex; justify-content:space-between; align-items:center; gap:16px; user-select:none; }
        .faq-item summary::-webkit-details-marker { display:none; }
        .faq-item[open] summary { color:#0f9b8e; }
        .faq-chevron { font-size:22px; font-weight:300; color:#B0BFCC; flex-shrink:0; transition:transform .2s; line-height:1; }
        .faq-item[open] .faq-chevron { transform:rotate(45deg); color:#0f9b8e; }
        .faq-answer { padding:0 0 22px; font-size:15px; color:#3D5166; line-height:1.75; max-width:640px; }
        .press-item { opacity:.4; transition:opacity .2s; cursor:default; }
        .press-item:hover { opacity:.7; }
        .nav-cta:hover { opacity:.9; }
        .pill-btn:hover { background:#0F1C2E; color:#fff; }
        .nav-link-btn { font-size:14px; font-weight:600; color:#3D5166; background:none; border:none; cursor:pointer; padding:9px 14px; border-radius:8px; display:inline-flex; align-items:center; gap:5px; transition:background .12s; text-decoration:none; }
        .nav-link-btn:hover { background:#F3F4F6; color:#0F1C2E; }
        .nav-dropdown { position:relative; }
        .nav-dropdown-menu { visibility:hidden; opacity:0; pointer-events:none; position:absolute; top:calc(100% + 10px); left:50%; transform:translateX(-50%); background:#fff; border:1px solid #E2E8F2; border-radius:18px; box-shadow:0 24px 64px rgba(15,28,46,.14); padding:10px; width:500px; display:grid; grid-template-columns:1fr 1fr; gap:2px; z-index:500; transition:opacity .15s,visibility .15s; }
        .nav-dropdown:hover .nav-dropdown-menu { visibility:visible; opacity:1; pointer-events:auto; }
        .nav-dropdown-menu::before { content:''; position:absolute; top:-6px; left:50%; transform:translateX(-50%); width:12px; height:12px; background:#fff; border-left:1px solid #E2E8F2; border-top:1px solid #E2E8F2; transform:translateX(-50%) rotate(45deg); }
        .nav-dd-item { display:flex; gap:12px; align-items:flex-start; padding:13px 14px; border-radius:12px; text-decoration:none; transition:background .12s; }
        .nav-dd-item:hover { background:#F8FAFD; }
        .nav-dd-item.featured { background:#F3F4F6; }
        @media (max-width:900px) {
          .hero-grid { grid-template-columns:1fr !important; }
          .hero-mockup { display:none !important; }
          .stats-grid { grid-template-columns:repeat(2,1fr) !important; }
          .steps-grid { grid-template-columns:1fr !important; }
          .steps-connector { display:none !important; }
          .feat-row { grid-template-columns:1fr !important; }
          .reviews-grid { grid-template-columns:1fr !important; }
          .security-grid { grid-template-columns:1fr !important; }
          .footer-cols { grid-template-columns:1fr 1fr !important; }
        }
        @media (max-width:560px) {
          .stats-grid { grid-template-columns:1fr 1fr !important; }
          .press-bar { gap:20px !important; }
        }
      `}</style>

      {/* ── Navbar ──────────────────────────────────────────────────── */}
      <nav style={{ position:'sticky', top:0, zIndex:100, background:'rgba(255,255,255,.97)', backdropFilter:'blur(14px)', WebkitBackdropFilter:'blur(14px)', borderBottom:'1px solid #E2E8F2', height:72, display:'flex', alignItems:'center', padding:'0 clamp(20px,5vw,72px)', justifyContent:'space-between', gap:24 }}>

        {/* Left: Logo */}
        <Link href="/" style={{ textDecoration:'none', flexShrink:0, marginLeft:16 }}>
          <FloowlyLogo size="lg" variant="light" />
        </Link>

        {/* Center: Nav links */}
        <div style={{ display:'flex', alignItems:'center', gap:2 }}>

          {/* Funciones dropdown */}
          <div className="nav-dropdown">
            <button className="nav-link-btn">
              Funciones
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </button>
            <div className="nav-dropdown-menu">
              {[
                { icon:<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><circle cx="12" cy="12" r="2"/></svg>, title:'Gestionar Suscripciones', desc:'Detectamos y rastreamos tus suscripciones automáticamente.', featured:true },
                { icon:<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>, title:'Metas Financieras', desc:'Ahorra dinero sin tener que pensar en ello.', featured:false },
                { icon:<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M21.21 15.89A10 10 0 1 1 8 2.83"/><path d="M22 12A10 10 0 0 0 12 2v10z"/></svg>, title:'Análisis de Gastos', desc:'Controla tus gastos en todas tus cuentas en un solo lugar.', featured:false },
                { icon:<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>, title:'Salud Crediticia', desc:'Controla tu crédito y obtén tu puntuación financiera gratis.', featured:false },
                { icon:<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>, title:'Negociación de Facturas', desc:'Generamos emails para negociar tus facturas.', featured:false },
                { icon:<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/></svg>, title:'Presupuestos', desc:'Controla los gastos y fija metas por categoría.', featured:false },
                { icon:<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>, title:'Patrimonio Neto', desc:'Vincula activos y deudas para ver tu situación real.', featured:false },
                { icon:<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="2" width="14" height="20" rx="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>, title:'Widgets', desc:'Controla tus finanzas desde la pantalla de inicio.', featured:false },
              ].map((item, i) => (
                <a key={i} href="/login?mode=register" className={`nav-dd-item${item.featured?' featured':''}`}>
                  <div style={{ width:36, height:36, borderRadius:10, background:item.featured?'#fff':'#F3F4F6', border:item.featured?'1px solid #E2E8F2':'none', display:'flex', alignItems:'center', justifyContent:'center', color:'#3D5166', flexShrink:0 }}>
                    {item.icon}
                  </div>
                  <div>
                    <div style={{ fontSize:13, fontWeight:700, color:'#0F1C2E', lineHeight:1.3 }}>{item.title}</div>
                    <div style={{ fontSize:11.5, color:'#8FA3BC', marginTop:3, lineHeight:1.4 }}>{item.desc}</div>
                  </div>
                </a>
              ))}
            </div>
          </div>

          {/* Aprende */}
          <a href="#" className="nav-link-btn">Aprende</a>

        </div>

        {/* Right: Auth buttons */}
        <div style={{ display:'flex', alignItems:'center', gap:6, flexShrink:0 }}>
          <Link href="/login" style={{ fontSize:14, fontWeight:600, color:'#3D5166', textDecoration:'none', padding:'9px 18px', borderRadius:8 }}>
            Iniciar sesión
          </Link>
          <Link href="/login?mode=register" className="nav-cta" style={{ fontSize:14, fontWeight:700, color:'#fff', background:'#0f9b8e', textDecoration:'none', padding:'10px 22px', borderRadius:9, boxShadow:'0 2px 10px rgba(15,155,142,.32)', transition:'opacity .15s' }}>
            Empezar gratis →
          </Link>
        </div>

      </nav>

      {/* ── Hero ────────────────────────────────────────────────────── */}
      <section style={{ background:'linear-gradient(155deg, #091624 0%, #0C2318 60%, #091624 100%)', padding:'clamp(64px,10vw,108px) clamp(20px,5vw,80px)', display:'flex', alignItems:'center' }}>
        <div className="hero-grid" style={{ maxWidth:1240, margin:'0 auto', width:'100%', display:'grid', gridTemplateColumns:'5fr 7fr', gap:56, alignItems:'center' }}>

          {/* Left */}
          <div>
            <div style={{ display:'inline-flex', alignItems:'center', gap:8, background:'rgba(15,155,142,.13)', border:'1px solid rgba(15,155,142,.32)', borderRadius:24, padding:'6px 16px', marginBottom:30 }}>
              <div style={{ width:6, height:6, borderRadius:'50%', background:'#34D399', boxShadow:'0 0 6px #34D399' }} />
              <span style={{ fontSize:11.5, fontWeight:700, color:'#34D399', letterSpacing:'.06em' }}>DISPONIBLE EN ESPAÑA Y LATINOAMÉRICA</span>
            </div>

            <h1 style={{ fontSize:'clamp(38px,5.2vw,64px)', fontWeight:900, color:'#fff', lineHeight:1.05, letterSpacing:'-.04em', marginBottom:22 }}>
              Deja de pagar<br />
              por lo que no usas.<br />
              <span style={{ color:'#34D399' }}>Floowly te ahorra.</span>
            </h1>

            <p style={{ fontSize:18, color:'rgba(255,255,255,.58)', lineHeight:1.7, marginBottom:40, maxWidth:460 }}>
              Descubre todas tus suscripciones en 3 minutos. Negocia mejores precios o cancela con un clic. Sin contraseñas bancarias.
            </p>

            <div style={{ display:'flex', gap:12, flexWrap:'wrap', marginBottom:34 }}>
              <Link href="/login?mode=register" style={{ display:'inline-flex', alignItems:'center', gap:9, fontSize:16, fontWeight:700, color:'#fff', background:'#0f9b8e', textDecoration:'none', padding:'15px 32px', borderRadius:12, boxShadow:'0 4px 22px rgba(15,155,142,.42)' }}>
                Empezar gratis
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
              </Link>
              <Link href="/login" style={{ display:'inline-flex', alignItems:'center', gap:8, fontSize:15, fontWeight:600, color:'rgba(255,255,255,.6)', textDecoration:'none', padding:'15px 24px', borderRadius:12, border:'1px solid rgba(255,255,255,.11)' }}>
                Ya tengo cuenta
              </Link>
            </div>

            {/* Social proof */}
            <div style={{ display:'flex', alignItems:'center', gap:16, marginBottom:18, flexWrap:'wrap' }}>
              <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                <Stars count={5} size={16} />
                <span style={{ fontSize:14, fontWeight:800, color:'#fff' }}>4.8</span>
                <span style={{ fontSize:13, color:'rgba(255,255,255,.38)' }}>· 2.400+ reseñas</span>
              </div>
            </div>

            <div style={{ display:'flex', gap:22, flexWrap:'wrap' }}>
              {[
                { icon:<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>, text:'Sin contraseñas bancarias' },
                { icon:<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>, text:'100% gratis para siempre' },
                { icon:<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>, text:'RGPD compliant' },
              ].map((t, i) => (
                <div key={i} style={{ display:'flex', alignItems:'center', gap:7, fontSize:12.5, color:'rgba(255,255,255,.38)' }}>
                  {t.icon}{t.text}
                </div>
              ))}
            </div>
          </div>

          {/* Right — app mockup */}
          <div className="hero-mockup" style={{ display:'flex', justifyContent:'center', alignItems:'center' }}>
            <AppMockup />
          </div>
        </div>
      </section>

      {/* ── Social proof + Press ────────────────────────────────────── */}
      <section style={{ background:'#fff', padding:'clamp(52px,7vw,80px) clamp(20px,5vw,80px)', borderBottom:'1px solid #EDF2FA' }}>
        <div style={{ maxWidth:820, margin:'0 auto', textAlign:'center' }}>
          <h2 style={{ fontSize:'clamp(22px,3.5vw,36px)', fontWeight:400, color:'#0F1C2E', lineHeight:1.35, letterSpacing:'-.02em', marginBottom:44, fontFamily:"Georgia,'Times New Roman',serif" }}>
            Hemos trabajado duro ahorrando a nuestros<br />
            usuarios más de <strong style={{ fontWeight:700 }}>2,5 millones de euros*</strong> y contando.
          </h2>

          <p style={{ fontSize:11, fontWeight:600, color:'#B0BFCC', letterSpacing:'.12em', textTransform:'uppercase', marginBottom:32 }}>Destacado en</p>

          <div className="press-bar" style={{ display:'flex', justifyContent:'center', alignItems:'center', gap:'clamp(32px,5vw,64px)', flexWrap:'wrap', marginBottom:48 }}>

            {/* TechCrunch — HTML, never clips */}
            <div style={{ display:'flex', alignItems:'center', fontFamily:"'Arial Black','Helvetica Neue',Arial,sans-serif", fontSize:30, fontWeight:900, color:'#0F1C2E', lineHeight:1, letterSpacing:-1, userSelect:'none' }}>
              T<span style={{ display:'inline-block', width:2.5, height:26, background:'#0F1C2E', margin:'0 2px 0 2px', verticalAlign:'middle', flexShrink:0 }} />C
            </div>

            {/* Money */}
            <span style={{ fontFamily:"'Georgia','Times New Roman',serif", fontSize:29, fontWeight:700, color:'#0F1C2E', lineHeight:1, userSelect:'none' }}>Money</span>

            {/* Forbes — italic serif */}
            <span style={{ fontFamily:"'Georgia','Times New Roman',serif", fontSize:29, fontWeight:700, fontStyle:'italic', color:'#0F1C2E', lineHeight:1, userSelect:'none' }}>Forbes</span>

            {/* WSJ */}
            <span style={{ fontFamily:"'Georgia','Times New Roman',serif", fontSize:36, fontWeight:700, color:'#0F1C2E', lineHeight:1, userSelect:'none' }}>WSJ</span>

            {/* Apple New Apps We Love */}
            <div style={{ display:'flex', alignItems:'center', gap:7 }}>
              <svg width="14" height="42" viewBox="0 0 14 42" fill="none">
                <path d="M7 40 C5 36,3 30,4 24 C3 28,2 33,4 37" stroke="#0F1C2E" strokeWidth="1.1" strokeLinecap="round" fill="none"/>
                <path d="M4 24 C1 21,0 25,2 27" stroke="#0F1C2E" strokeWidth="1.1" strokeLinecap="round" fill="none"/>
                <path d="M5 30 C2 28,1 32,3 33" stroke="#0F1C2E" strokeWidth="1.1" strokeLinecap="round" fill="none"/>
                <path d="M6 36 C3 35,3 38,5 39" stroke="#0F1C2E" strokeWidth="1.1" strokeLinecap="round" fill="none"/>
                <path d="M5 18 C2 18,1 22,3 23" stroke="#0F1C2E" strokeWidth="1.1" strokeLinecap="round" fill="none"/>
                <path d="M7 12 C4 13,4 17,6 18" stroke="#0F1C2E" strokeWidth="1.1" strokeLinecap="round" fill="none"/>
              </svg>
              <div style={{ textAlign:'center', lineHeight:1.35 }}>
                <div style={{ fontSize:7.5, fontWeight:800, letterSpacing:'.14em', color:'#0F1C2E', textTransform:'uppercase' }}>APPLE</div>
                <div style={{ fontSize:10, fontWeight:600, color:'#0F1C2E' }}>New Apps</div>
                <div style={{ fontSize:10, fontWeight:600, color:'#0F1C2E' }}>We Love</div>
              </div>
              <svg width="14" height="42" viewBox="0 0 14 42" fill="none" style={{ transform:'scaleX(-1)' }}>
                <path d="M7 40 C5 36,3 30,4 24 C3 28,2 33,4 37" stroke="#0F1C2E" strokeWidth="1.1" strokeLinecap="round" fill="none"/>
                <path d="M4 24 C1 21,0 25,2 27" stroke="#0F1C2E" strokeWidth="1.1" strokeLinecap="round" fill="none"/>
                <path d="M5 30 C2 28,1 32,3 33" stroke="#0F1C2E" strokeWidth="1.1" strokeLinecap="round" fill="none"/>
                <path d="M6 36 C3 35,3 38,5 39" stroke="#0F1C2E" strokeWidth="1.1" strokeLinecap="round" fill="none"/>
                <path d="M5 18 C2 18,1 22,3 23" stroke="#0F1C2E" strokeWidth="1.1" strokeLinecap="round" fill="none"/>
                <path d="M7 12 C4 13,4 17,6 18" stroke="#0F1C2E" strokeWidth="1.1" strokeLinecap="round" fill="none"/>
              </svg>
            </div>

          </div>

          <p style={{ fontSize:12, color:'#B0BFCC', lineHeight:1.7, maxWidth:680, margin:'0 auto' }}>
            *Los 2,5 millones de euros representan ahorros de negociaciones de facturas tras comisiones, cancelaciones de suscripciones en base anualizada y depósitos en ahorro inteligente. La cifra total es bruta y puede no reflejar el ahorro neto de cada usuario individual. Este cálculo se basa en datos internos y no ha sido verificado de forma independiente.
          </p>
        </div>
      </section>



      {/* ── Feature: Suscripciones ──────────────────────────────────── */}
      <section style={{ background:'#fff', padding:'clamp(64px,9vw,104px) clamp(20px,5vw,80px)' }}>
        <div className="feat-row" style={{ maxWidth:1200, margin:'0 auto', display:'grid', gridTemplateColumns:'1fr 1fr', gap:'clamp(40px,8vw,100px)', alignItems:'center' }}>

          {/* Left — photo + floating card */}
          <div style={{ position:'relative' }}>
            <div style={{ borderRadius:28, overflow:'hidden', aspectRatio:'4/3', position:'relative' }}>
              <img src="/images/woman.png" alt="Mujer gestionando sus suscripciones con Floowly" style={{ width:'100%', height:'100%', objectFit:'cover', objectPosition:'center top', display:'block' }} />
            </div>

            {/* Floating subscription list card */}
            <div style={{ position:'absolute', bottom:-28, right:-20, background:'#fff', borderRadius:20, boxShadow:'0 20px 60px rgba(0,0,0,.14)', padding:'8px 0', width:300, zIndex:2 }}>
              <div style={{ padding:'10px 18px 8px', borderBottom:'1px solid #F0F4FA' }}>
                <div style={{ fontSize:11, fontWeight:700, color:'#8FA3BC', textTransform:'uppercase', letterSpacing:'.08em' }}>Suscripciones detectadas</div>
              </div>
              {[
                {
                  name:'Netflix', freq:'Mensual', price:'15,99€',
                  icon:<svg width="36" height="36" viewBox="0 0 36 36"><rect width="36" height="36" rx="8" fill="#141414"/>
                    {/* Netflix N: left bar + diagonal + right bar */}
                    <rect x="8" y="8" width="6" height="20" fill="#E50914"/>
                    <polygon points="14,8 20,8 22,28 16,28" fill="#E50914"/>
                    <rect x="22" y="8" width="6" height="20" fill="#E50914"/>
                  </svg>,
                },
                {
                  name:'Spotify', freq:'Mensual', price:'10,99€',
                  icon:<svg width="36" height="36" viewBox="0 0 36 36"><circle cx="18" cy="18" r="18" fill="#1DB954"/>
                    <path d="M9 15.5 C14 12.5,22 12.5,27 15.5" stroke="white" strokeWidth="2.8" fill="none" strokeLinecap="round"/>
                    <path d="M10.5 20 C15 17.5,21 17.5,25.5 20" stroke="white" strokeWidth="2.4" fill="none" strokeLinecap="round"/>
                    <path d="M12 24 C15.5 22,20.5 22,24 24" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round"/>
                  </svg>,
                },
                {
                  name:'Amazon Prime', freq:'Anual', price:'49,90€',
                  icon:<svg width="36" height="36" viewBox="0 0 36 36"><rect width="36" height="36" rx="8" fill="#131921"/>
                    <text x="18" y="20" textAnchor="middle" fill="#FF9900" fontSize="17" fontWeight="900" fontFamily="'Times New Roman',Georgia,serif" dominantBaseline="middle">a</text>
                    <path d="M10 27 Q18 33 26 27" stroke="#FF9900" strokeWidth="2.2" fill="none" strokeLinecap="round"/>
                    <path d="M24 25 L26.5 27 L23.5 27.5" stroke="#FF9900" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>,
                },
                {
                  name:'Adobe CC', freq:'Mensual', price:'29,99€',
                  icon:<svg width="36" height="36" viewBox="0 0 36 36"><rect width="36" height="36" rx="8" fill="#EB1000"/>
                    {/* Adobe CC: left A-triangle + right A-triangle with crossbar cutout */}
                    <path d="M7 27 L13.5 9 L20 27 Z" fill="white"/>
                    <path d="M16 27 L22.5 9 L29 27 Z" fill="white"/>
                    <rect x="10" y="20.5" width="16" height="3" fill="#EB1000"/>
                  </svg>,
                },
              ].map((s, i) => (
                <div key={s.name} style={{ display:'flex', alignItems:'center', gap:12, padding:'11px 18px', borderBottom:i<3?'1px solid #F7F9FC':'none' }}>
                  <div style={{ flexShrink:0, lineHeight:0 }}>{s.icon}</div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:13.5, fontWeight:700, color:'#0F1C2E' }}>{s.name}</div>
                    <div style={{ fontSize:11.5, color:'#8FA3BC' }}>{s.freq}</div>
                  </div>
                  <div style={{ fontSize:13.5, fontWeight:700, color:'#0F1C2E', fontVariantNumeric:'tabular-nums' }}>{s.price}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Right — text */}
          <div style={{ paddingBottom:28 }}>
            <h2 style={{ fontSize:'clamp(30px,4vw,48px)', fontWeight:900, color:'#0F1C2E', letterSpacing:'-.04em', lineHeight:1.08, marginBottom:18 }}>
              Controla cada<br />suscripción
            </h2>
            <p style={{ fontSize:17, color:'#3D5166', lineHeight:1.75, marginBottom:32, maxWidth:460 }}>
              Floowly encuentra y rastrea automáticamente todas tus suscripciones. Estamos ahí cuando necesitas cancelar un servicio para que no tengas que hacerlo tú solo.
            </p>
            <PillButton href="/login?mode=register">Gestionar mis suscripciones</PillButton>
          </div>
        </div>
      </section>



      {/* ── Feature: Gastos diarios ─────────────────────────────────── */}
      <section style={{ background:'#fff', padding:'clamp(64px,9vw,104px) clamp(20px,5vw,80px)' }}>
        <div className="feat-row" style={{ maxWidth:1200, margin:'0 auto', display:'grid', gridTemplateColumns:'1fr 1fr', gap:'clamp(40px,8vw,100px)', alignItems:'center' }}>

          {/* Left — text */}
          <div>
            <h2 style={{ fontSize:'clamp(30px,4vw,48px)', fontWeight:900, color:'#0F1C2E', letterSpacing:'-.04em', lineHeight:1.08, marginBottom:18 }}>
              Controla tus<br />gastos del día a día
            </h2>
            <p style={{ fontSize:17, color:'#3D5166', lineHeight:1.75, marginBottom:32, maxWidth:460 }}>
              Obtén un desglose automático de tus finanzas para ver a dónde va tu dinero y cómo mejorar. Te avisamos de los eventos importantes para que nunca te pille por sorpresa.
            </p>
            <PillButton href="/login?mode=register">Rastrear mis gastos</PillButton>
          </div>

          {/* Right — photo + floating alerts card */}
          <div style={{ position:'relative', paddingBottom:40, paddingRight:20 }}>
            {/* Background card — placeholder photo (swap with <img> when ready) */}
            <div id="img-spending" style={{ borderRadius:28, overflow:'hidden', aspectRatio:'4/3', position:'relative' }}>
              <img src="/images/woman2.png" alt="Mujer controlando sus gastos con Floowly" style={{ width:'100%', height:'100%', objectFit:'cover', objectPosition:'center top', display:'block' }} />
            </div>

            {/* Floating alerts card */}
            <div style={{ position:'absolute', bottom:0, left:-10, background:'#fff', borderRadius:20, boxShadow:'0 20px 60px rgba(0,0,0,.13)', padding:'8px 0', width:310, zIndex:2 }}>
              {[
                {
                  icon:<svg width="38" height="38" viewBox="0 0 38 38" fill="none"><rect width="38" height="38" rx="12" fill="#F3F4F6"/><path d="M12 14h14v10a4 4 0 0 1-4 4h-6a4 4 0 0 1-4-4V14z" stroke="#6B7280" strokeWidth="1.8" fill="none"/><path d="M15 11v3M19 11v3M23 11v3" stroke="#6B7280" strokeWidth="1.8" strokeLinecap="round"/><path d="M24 14h1a3 3 0 0 1 0 6h-1" stroke="#6B7280" strokeWidth="1.8" strokeLinecap="round"/></svg>,
                  name:'Presupuesto de café',
                  sub:'Has gastado 8€ menos de lo habitual', value:'36€', valueColor:'#0F1C2E',
                },
                {
                  icon:<svg width="38" height="38" viewBox="0 0 38 38" fill="none"><rect width="38" height="38" rx="12" fill="#131921"/><text x="19" y="22" textAnchor="middle" fill="#FF9900" fontSize="15" fontWeight="800" fontFamily="Georgia,serif" dominantBaseline="middle">a</text><path d="M11 28 Q19 33 27 28" stroke="#FF9900" strokeWidth="1.8" fill="none" strokeLinecap="round"/><path d="M25 26.5 L27 28 L24.5 28.5" stroke="#FF9900" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>,
                  name:'Amazon',
                  sub:'198€ este mes, media 25€ por compra', value:'8x', valueColor:'#0F1C2E',
                },
                {
                  icon:<svg width="38" height="38" viewBox="0 0 38 38" fill="none"><rect width="38" height="38" rx="12" fill="#FEF2F2"/><rect x="6" y="11" width="26" height="17" rx="3" stroke="#DC2626" strokeWidth="1.8" fill="none"/><line x1="6" y1="17" x2="32" y2="17" stroke="#DC2626" strokeWidth="1.8"/><circle cx="12" cy="23" r="2" fill="#DC2626"/><path d="M27 21v4M27 21h-2l1 2h-2" stroke="#DC2626" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>,
                  name:'Alerta de saldo',
                  sub:'Atención. Tu saldo en cuenta está bajo.', value:'36€', valueColor:'#DC2626',
                },
              ].map((item, i) => (
                <div key={i} style={{ display:'flex', alignItems:'center', gap:12, padding:'13px 18px', borderBottom:i<2?'1px solid #F7F9FC':'none' }}>
                  <div style={{ flexShrink:0, lineHeight:0 }}>
                    {item.icon}
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:13.5, fontWeight:700, color:'#0F1C2E' }}>{item.name}</div>
                    <div style={{ fontSize:11.5, color:'#8FA3BC', marginTop:1, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{item.sub}</div>
                  </div>
                  <div style={{ fontSize:14, fontWeight:700, color:item.valueColor, fontVariantNumeric:'tabular-nums', flexShrink:0 }}>{item.value}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Feature: Metas de ahorro ─────────────────────────────────── */}
      <section style={{ background:'#F8FAFD', padding:'clamp(64px,9vw,104px) clamp(20px,5vw,80px)' }}>
        <div className="feat-row" style={{ maxWidth:1200, margin:'0 auto', display:'grid', gridTemplateColumns:'1fr 1fr', gap:'clamp(40px,8vw,100px)', alignItems:'center' }}>

          {/* Left — photo + floating goals card */}
          <div style={{ position:'relative', paddingBottom:40, paddingLeft:10 }}>
            {/* Background card — placeholder photo (swap with <img> when ready) */}
            <div id="img-goals" style={{ borderRadius:28, overflow:'hidden', aspectRatio:'4/3', position:'relative' }}>
              <img src="/images/men.png" alt="Hombre alcanzando sus metas de ahorro con Floowly" style={{ width:'100%', height:'100%', objectFit:'cover', objectPosition:'center top', display:'block' }} />
            </div>

            {/* Floating goals card */}
            <div style={{ position:'absolute', bottom:0, right:-10, background:'#fff', borderRadius:20, boxShadow:'0 20px 60px rgba(0,0,0,.13)', padding:'20px 20px 16px', width:300, zIndex:2 }}>
              {[
                {
                  icon:<svg width="38" height="38" viewBox="0 0 38 38" fill="none"><rect width="38" height="38" rx="12" fill="#F3F4F6"/><rect x="10" y="12" width="18" height="15" rx="2" stroke="#4B5563" strokeWidth="1.8" fill="none"/><line x1="10" y1="17" x2="28" y2="17" stroke="#4B5563" strokeWidth="1.8"/><text x="19" y="25" textAnchor="middle" fill="#4B5563" fontSize="8" fontWeight="800" fontFamily="Arial,sans-serif">$</text></svg>,
                  name:'Fondo de emergencia', sub:'Próximo depósito en 3 días', value:'750€', pct:62,
                },
                {
                  icon:<svg width="38" height="38" viewBox="0 0 38 38" fill="none"><rect width="38" height="38" rx="12" fill="#F3F4F6"/><circle cx="19" cy="19" r="9" stroke="#4B5563" strokeWidth="1.8" fill="none"/><path d="M19 10v2M19 26v2M10 19h2M26 19h2" stroke="#4B5563" strokeWidth="1.5" strokeLinecap="round"/><circle cx="19" cy="19" r="3" fill="#4B5563"/></svg>,
                  name:'Vacaciones', sub:'Próximo depósito en 1 día', value:'425€', pct:38,
                },
              ].map((goal, i) => (
                <div key={i} style={{ marginBottom:i===0?20:16 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:8 }}>
                    <div style={{ flexShrink:0, lineHeight:0 }}>{goal.icon}</div>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:13.5, fontWeight:700, color:'#0F1C2E' }}>{goal.name}</div>
                      <div style={{ fontSize:11.5, color:'#8FA3BC' }}>{goal.sub}</div>
                    </div>
                    <div style={{ fontSize:14, fontWeight:700, color:'#0F1C2E' }}>{goal.value}</div>
                  </div>
                  {/* Progress bar */}
                  <div style={{ height:5, background:'#F0F4FA', borderRadius:3, overflow:'hidden', marginLeft:50 }}>
                    <div style={{ height:'100%', width:`${goal.pct}%`, background:'#DC2626', borderRadius:3 }} />
                  </div>
                </div>
              ))}
              {/* + Nueva meta button */}
              <button style={{ width:'100%', padding:'11px', borderRadius:100, border:'1.5px solid #E2E8F2', background:'#fff', fontSize:14, fontWeight:700, color:'#0F1C2E', cursor:'pointer', marginTop:6 }}>
                + Nueva meta
              </button>
            </div>
          </div>

          {/* Right — text */}
          <div>
            <h2 style={{ fontSize:'clamp(30px,4vw,48px)', fontWeight:900, color:'#0F1C2E', letterSpacing:'-.04em', lineHeight:1.08, marginBottom:18 }}>
              Pon tus metas<br />en piloto automático
            </h2>
            <p style={{ fontSize:17, color:'#3D5166', lineHeight:1.75, marginBottom:32, maxWidth:460 }}>
              Activa el ahorro automático y deja que Floowly gestione tu dinero sin que tengas que pensar en ello. Ahorra la cantidad correcta en el momento adecuado y evita quedarte en descubierto.
            </p>
            <PillButton href="/login?mode=register">Automatizar mis ahorros</PillButton>
          </div>
        </div>
      </section>

      {/* ── Premium ─────────────────────────────────────────────────── */}
      <section style={{ background:'#EDEEF0', padding:'clamp(64px,9vw,104px) clamp(20px,5vw,80px)' }}>
        <div style={{ maxWidth:1100, margin:'0 auto' }}>

          {/* Header */}
          <div style={{ textAlign:'center', marginBottom:56 }}>
            <h2 style={{ fontSize:'clamp(28px,4vw,52px)', fontWeight:900, color:'#0F1C2E', letterSpacing:'-.03em', lineHeight:1.1, marginBottom:20 }}>
              Obtén más de tus finanzas<br />con Floowly Premium
            </h2>
            <p style={{ fontSize:17, color:'#3D5166', lineHeight:1.75, maxWidth:580, margin:'0 auto' }}>
              ¡Premium es más que solo funcionalidades de software! Tendrás acceso real a personas que pueden ayudarte a cancelar suscripciones, reducir tus facturas o resolver cualquier duda sobre tus finanzas personales.
            </p>
          </div>

          {/* Two-column comparison */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20, alignItems:'stretch' }}>

            {/* Left: sin Premium */}
            <div style={{ background:'rgba(255,255,255,.55)', borderRadius:24, overflow:'hidden', display:'flex', flexDirection:'column' }}>
              <div style={{ background:'rgba(255,255,255,.7)', padding:'28px 36px 26px', borderBottom:'1px solid rgba(15,28,46,.06)' }}>
                <span style={{ fontSize:11, fontWeight:800, letterSpacing:'.1em', textTransform:'uppercase', color:'#8FA3BC', display:'block', marginBottom:6 }}>Plan gratuito</span>
                <h3 style={{ fontSize:22, fontWeight:800, color:'#0F1C2E', margin:0 }}>sin Premium</h3>
              </div>
              <div style={{ flex:1, padding:'8px 36px 36px' }}>
                {[
                  { title:'Vinculación de cuentas', desc:'Vincula tus cuentas corrientes, de ahorros, tarjetas de crédito e inversiones para verlo todo en un solo lugar.' },
                  { title:'Alertas de saldo', desc:'Recibe una alerta cuando tu cuenta corriente caiga por debajo de un saldo seguro o cuando tu gasto de crédito sea demasiado alto.' },
                  { title:'Gestión de suscripciones', desc:'Nuestro algoritmo detecta todas tus suscripciones y facturas recurrentes automáticamente.' },
                  { title:'Seguimiento de gastos', desc:'Con todas tus cuentas en un solo lugar, comprende tus tendencias de gasto.' },
                ].map((item, i, arr) => (
                  <div key={i} style={{ display:'flex', gap:14, padding:'18px 0', borderBottom: i < arr.length-1 ? '1px solid rgba(15,28,46,.07)' : 'none' }}>
                    <div style={{ width:22, height:22, borderRadius:6, border:'1.5px solid #CBD5E1', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, marginTop:1 }}>
                      <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="2 6 5 9 10 3"/></svg>
                    </div>
                    <div>
                      <div style={{ fontSize:14.5, fontWeight:700, color:'#0F1C2E', marginBottom:4 }}>{item.title}</div>
                      <div style={{ fontSize:13.5, color:'#5A6A7E', lineHeight:1.7 }}>{item.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: con Premium */}
            <div style={{ background:'#fff', borderRadius:24, overflow:'hidden', boxShadow:'0 12px 48px rgba(15,28,46,.12)', display:'flex', flexDirection:'column' }}>
              {/* Accent header */}
              <div style={{ background:'linear-gradient(135deg, #0c5249 0%, #0f9b8e 100%)', padding:'28px 36px 26px' }}>
                <span style={{ fontSize:11, fontWeight:800, letterSpacing:'.1em', textTransform:'uppercase', color:'rgba(255,255,255,.6)', display:'block', marginBottom:6 }}>Todo lo del gratuito, más:</span>
                <h3 style={{ fontSize:22, fontWeight:800, color:'#fff', margin:0 }}>con Premium</h3>
              </div>
              {/* Items */}
              <div style={{ padding:'8px 36px 36px', flex:1 }}>
                {[
                  {
                    icon:<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="9" y1="15" x2="15" y2="15"/></svg>,
                    title:'Asistente de cancelación',
                    desc:'Cancelamos tus suscripciones por ti — sin esperas, sin formularios, sin llamadas.',
                  },
                  {
                    icon:<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>,
                    title:'Plan de ahorro automatizado',
                    desc:'Establece metas y deja que Floowly mueva dinero automáticamente hacia ellas.',
                  },
                  {
                    icon:<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.4 2 2 0 0 1 3.6 1.23h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.8A16 16 0 0 0 16 16.86l.45-.45a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>,
                    title:'Negociación de facturas',
                    desc:'Nuestro equipo llama a las compañías por ti para reducir tus facturas de móvil, luz o internet.',
                  },
                  {
                    icon:<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
                    title:'Soporte con asesores reales',
                    desc:'Acceso directo a un asesor financiero personal cuando lo necesites, por chat o llamada.',
                  },
                  {
                    icon:<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>,
                    title:'Patrimonio neto en tiempo real',
                    desc:'Visualiza el valor total de tus activos y pasivos actualizado al instante.',
                  },
                ].map((item, i, arr) => (
                  <div key={i} style={{ display:'flex', gap:14, padding:'18px 0', borderBottom: i < arr.length-1 ? '1px solid #F0F4F9' : 'none', alignItems:'flex-start' }}>
                    <div style={{ width:40, height:40, borderRadius:11, background:'#FEF2F2', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                      {item.icon}
                    </div>
                    <div>
                      <div style={{ fontSize:14.5, fontWeight:700, color:'#0F1C2E', marginBottom:4 }}>{item.title}</div>
                      <div style={{ fontSize:13.5, color:'#5A6A7E', lineHeight:1.7 }}>{item.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── Reviews ─────────────────────────────────────────────────── */}
      <section style={{ background:'#F8FAFD', padding:'clamp(64px,9vw,100px) clamp(20px,5vw,80px)' }}>
        <div style={{ maxWidth:1240, margin:'0 auto' }}>
          <div style={{ textAlign:'center', marginBottom:60 }}>
            <Stars count={5} size={26} gap={3} center />
            <h2 style={{ fontSize:'clamp(28px,4vw,46px)', fontWeight:900, color:'#0F1C2E', letterSpacing:'-.035em', lineHeight:1.1, marginTop:16 }}>
              Más de 52.000 personas<br />ya controlan su dinero
            </h2>
            <p style={{ fontSize:15, color:'#8FA3BC', marginTop:12 }}>Valoración media de 4.8/5 en más de 2.400 reseñas verificadas</p>
          </div>

          <div className="reviews-grid" style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:20 }}>
            {[
              { name:'Ana García',     city:'Madrid',      av:'AG', c:'#7C3AED', text:'Increíble. En 3 minutos vi que pagaba 127€/mes en suscripciones que ya no usaba. Cancelé 4 y ahora ahorro 43€ al mes sin hacer nada.', date:'hace 2 semanas' },
              { name:'Carlos Mendoza', city:'México DF',   av:'CM', c:'#0f9b8e', text:'La función de negociación de emails es genial. Le escribí a Spotify y me bajaron el precio un 30%. No podría haberlo hecho sin Floowly.', date:'hace 1 mes' },
              { name:'Laura Fernández',city:'Barcelona',   av:'LF', c:'#E11D48', text:'Por fin una app que de verdad funciona para gestionar suscripciones. El dashboard es clarísimo y los presupuestos me han cambiado la vida.', date:'hace 3 semanas' },
              { name:'Miguel Torres',  city:'Buenos Aires',av:'MT', c:'#D97706', text:'Llevaba meses pagando una suscripción de gimnasio que creía haber cancelado. Floowly la detectó al instante. Es imprescindible.', date:'hace 1 semana' },
              { name:'Sofía Ruiz',     city:'Valencia',    av:'SR', c:'#0891B2', text:'La sección de patrimonio neto me ha sorprendido. Por primera vez tengo una visión real de mi situación financiera. Lo recomiendo al 100%.', date:'hace 2 meses' },
              { name:'Javier Blanco',  city:'Bilbao',      av:'JB', c:'#0f9b8e', text:'Muy fácil de usar. Subí el CSV de mi banco y en 2 minutos ya tenía todas mis suscripciones detectadas. El email de cancelación es perfecto.', date:'hace 5 días' },
            ].map((r, i) => (
              <div key={i} className="review-card">
                <Stars count={5} size={14} gap={2} />
                <p style={{ fontSize:14.5, color:'#3D5166', lineHeight:1.75, margin:'16px 0 20px' }}>"{r.text}"</p>
                <div>
                  <div style={{ fontSize:13.5, fontWeight:700, color:'#0F1C2E' }}>{r.name}</div>
                  <div style={{ fontSize:11.5, color:'#8FA3BC', marginTop:2 }}>{r.city}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Security ────────────────────────────────────────────────── */}
      <section style={{ background:'#fff', padding:'clamp(64px,9vw,100px) clamp(20px,5vw,80px)' }}>
        <div className="security-grid" style={{ maxWidth:1100, margin:'0 auto', display:'grid', gridTemplateColumns:'1fr 1fr', gap:72, alignItems:'center' }}>
          <div>
            <div style={{ fontSize:12, fontWeight:800, color:'#0f9b8e', letterSpacing:'.1em', textTransform:'uppercase', marginBottom:12 }}>Seguridad</div>
            <h2 style={{ fontSize:'clamp(24px,3.5vw,40px)', fontWeight:900, color:'#0F1C2E', letterSpacing:'-.035em', marginBottom:16, lineHeight:1.12 }}>
              Tu dinero es tuyo.<br />Nosotros solo miramos.
            </h2>
            <p style={{ fontSize:15, color:'#3D5166', lineHeight:1.8, marginBottom:34 }}>
              Nunca pedimos contraseñas bancarias ni acceso de escritura. Solo analizamos los datos que tú nos compartes.
            </p>
            <div style={{ display:'flex', flexDirection:'column', gap:18 }}>
              {[
                { icon:<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>, title:'Sin credenciales bancarias', desc:'Subir un extracto no requiere login en tu banco' },
                { icon:<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>, title:'Solo lectura', desc:'No realizamos ningún cargo ni movimiento' },
                { icon:<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>, title:'RGPD compliant', desc:'Datos en servidores europeos (Frankfurt, Irlanda)' },
                { icon:<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>, title:'Elimina tus datos', desc:'Borra todo cuando quieras desde tu perfil' },
              ].map(s => (
                <div key={s.title} style={{ display:'flex', gap:14, alignItems:'flex-start' }}>
                  <div style={{ width:42, height:42, borderRadius:12, background:'#F8FAFD', border:'1px solid #E2E8F2', display:'flex', alignItems:'center', justifyContent:'center', fontSize:19, flexShrink:0 }}>{s.icon}</div>
                  <div>
                    <div style={{ fontSize:14.5, fontWeight:700, color:'#0F1C2E' }}>{s.title}</div>
                    <div style={{ fontSize:13, color:'#8FA3BC', marginTop:2 }}>{s.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ background:'#F8FAFD', borderRadius:22, padding:'32px 30px', border:'1px solid #E2E8F2' }}>
            <div style={{ fontSize:13, fontWeight:800, color:'#0F1C2E', letterSpacing:'-.01em', marginBottom:24 }}>Fuentes de datos compatibles</div>
            {[
              {
                icon:<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="8" y1="13" x2="16" y2="13"/><line x1="8" y1="17" x2="16" y2="17"/></svg>,
                iconBg:'#e8f7f6', iconColor:'#0f9b8e',
                name:'Extracto bancario CSV/Excel', desc:'Santander, BBVA, CaixaBank, ING, Openbank...', badge:'Disponible',
              },
              {
                icon:<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>,
                iconBg:'#FEF2F2', iconColor:'#DC2626',
                name:'Gmail', desc:'Facturas y confirmaciones de pago', badge:'Disponible',
              },
              {
                icon:<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="22" x2="21" y2="22"/><line x1="6" y1="18" x2="6" y2="11"/><line x1="10" y1="18" x2="10" y2="11"/><line x1="14" y1="18" x2="14" y2="11"/><line x1="18" y1="18" x2="18" y2="11"/><polygon points="12 2 20 7 4 7"/></svg>,
                iconBg:'#FEF3C7', iconColor:'#D97706',
                name:'Open Banking', desc:'PSD2 · +2.300 bancos en Europa', badge:'Próximamente',
              },
            ].map((s, i) => (
              <div key={s.name} style={{ display:'flex', alignItems:'center', gap:14, padding:'16px 0', borderBottom: i < 2 ? '1px solid #EDF2FA' : 'none' }}>
                <div style={{ width:40, height:40, borderRadius:11, background:s.iconBg, color:s.iconColor, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                  {s.icon}
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:13.5, fontWeight:700, color:'#0F1C2E' }}>{s.name}</div>
                  <div style={{ fontSize:11.5, color:'#8FA3BC', marginTop:2 }}>{s.desc}</div>
                </div>
                <span style={{ fontSize:10.5, fontWeight:700, padding:'5px 12px', borderRadius:20, background:s.badge==='Disponible'?'#e8f7f6':'#FEF3C7', color:s.badge==='Disponible'?'#0f9b8e':'#D97706', whiteSpace:'nowrap', flexShrink:0 }}>
                  {s.badge}
                </span>
              </div>
            ))}
            <div style={{ marginTop:24, background:'linear-gradient(135deg,#0c5249 0%,#0f9b8e 100%)', borderRadius:14, padding:'22px 20px', textAlign:'center' }}>
              <div style={{ display:'flex', justifyContent:'center', alignItems:'center', gap:10, marginBottom:6 }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,.7)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                <div style={{ fontSize:26, fontWeight:900, color:'#fff', letterSpacing:'-.04em', lineHeight:1 }}>256-bit SSL</div>
              </div>
              <div style={{ fontSize:12, color:'rgba(255,255,255,.65)' }}>Cifrado de nivel bancario en toda la plataforma</div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Explorar características ────────────────────────────────── */}
      <section style={{ background:'#fff', padding:'clamp(64px,9vw,104px) clamp(20px,5vw,80px)' }}>
        <div style={{ maxWidth:1100, margin:'0 auto' }}>
          <div style={{ textAlign:'center', marginBottom:64 }}>
            <h2 style={{ fontSize:'clamp(28px,4vw,48px)', fontWeight:900, color:'#0F1C2E', letterSpacing:'-.035em', lineHeight:1.1 }}>
              Explorar más características<br />de Floowly
            </h2>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0', rowGap:0 }}>
            {[
              {
                icon:<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>,
                title:'Realiza un seguimiento de tu puntuación de crédito',
                desc:'Accede a tu informe crediticio completo y recibe alertas ante cambios importantes que afecten a tu puntuación.',
                cta:'Comprobar mi puntuación',
              },
              {
                icon:<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.4 2 2 0 0 1 3.6 1.23h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.8A16 16 0 0 0 16 16.86l.45-.45a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>,
                title:'Obtén las mejores tarifas en tus facturas actuales',
                desc:'Nuestro equipo identificará las facturas que se pueden reducir y negociará en tu nombre las mejores condiciones disponibles.',
                cta:'Bajar mis facturas',
              },
              {
                icon:<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>,
                title:'Crea un presupuesto que funcione para ti',
                desc:'Establece un presupuesto que supervise automáticamente tu gasto por categoría y te mantenga en el camino hacia tus objetivos.',
                cta:'Construir mi presupuesto',
              },
              {
                icon:<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>,
                title:'Comprende y haz crecer tu patrimonio neto',
                desc:'Obtén una imagen completa de tus activos y deudas en un solo lugar. Realiza un seguimiento de tu evolución financiera a lo largo del tiempo.',
                cta:'Calcular mi patrimonio neto',
              },
            ].map((item, i) => (
              <div key={i} style={{ padding:'clamp(32px,4vw,52px) clamp(24px,4vw,52px)', borderTop: i >= 2 ? '1px solid #EDF2FA' : 'none', borderRight: i % 2 === 0 ? '1px solid #EDF2FA' : 'none' }}>
                <div style={{ width:52, height:52, borderRadius:14, background:'#FEF2F2', display:'flex', alignItems:'center', justifyContent:'center', marginBottom:28 }}>
                  {item.icon}
                </div>
                <h3 style={{ fontSize:'clamp(18px,2vw,22px)', fontWeight:800, color:'#0F1C2E', letterSpacing:'-.02em', lineHeight:1.25, marginBottom:16 }}>{item.title}</h3>
                <p style={{ fontSize:15, color:'#5A6A7E', lineHeight:1.75, marginBottom:24 }}>{item.desc}</p>
                <Link href="/login?mode=register" style={{ fontSize:14, fontWeight:700, color:'#0F1C2E', textDecoration:'underline', textUnderlineOffset:3 }}>{item.cta}</Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ─────────────────────────────────────────────────────── */}
      <section style={{ background:'#F8FAFD', padding:'clamp(64px,9vw,100px) clamp(20px,5vw,80px)' }}>
        <div style={{ maxWidth:740, margin:'0 auto' }}>
          <div style={{ textAlign:'center', marginBottom:56 }}>
            <div style={{ fontSize:12, fontWeight:800, color:'#0f9b8e', letterSpacing:'.1em', textTransform:'uppercase', marginBottom:12 }}>FAQ</div>
            <h2 style={{ fontSize:'clamp(26px,4vw,42px)', fontWeight:900, color:'#0F1C2E', letterSpacing:'-.035em' }}>Preguntas frecuentes</h2>
          </div>
          {[
            { q:'¿Es realmente gratis?', a:'Sí. El plan gratuito incluye detección ilimitada de suscripciones, dashboard completo, presupuestos básicos y generación de emails de cancelación. Sin tarjeta de crédito ni compromisos.' },
            { q:'¿Necesito dar mi contraseña bancaria?', a:'No. Nunca. Puedes subir un extracto bancario en CSV o PDF, o conectar tu Gmail para analizar correos de cobro. En ningún caso pedimos acceso directo a tu banco.' },
            { q:'¿Cómo detecta Floowly mis suscripciones?', a:'Nuestro motor de IA analiza los movimientos de tu extracto o los correos de confirmación de pago de Gmail. Detecta patrones recurrentes y los clasifica automáticamente por categoría, importe y frecuencia.' },
            { q:'¿Qué bancos son compatibles?', a:'Cualquier banco que permita descargar el extracto en CSV o Excel: Santander, BBVA, CaixaBank, ING, Openbank, Bankinter, Sabadell, HSBC, Banamex... Si puedes exportar tu extracto, Floowly lo analiza.' },
            { q:'¿Los emails de negociación funcionan de verdad?', a:'Sí. Los emails están redactados para cada empresa y muchos usuarios consiguen descuentos del 20–40% o retenciones con precio reducido antes de cancelar. El éxito depende de cada empresa.' },
            { q:'¿Mis datos están seguros?', a:'Totalmente. Usamos cifrado 256-bit SSL, almacenamiento en servidores europeos y cumplimos el RGPD. Puedes eliminar todos tus datos en cualquier momento desde tu perfil.' },
          ].map((faq, i) => (
            <details key={i} className="faq-item">
              <summary>
                {faq.q}
                <span className="faq-chevron">+</span>
              </summary>
              <div className="faq-answer">{faq.a}</div>
            </details>
          ))}
        </div>
      </section>

      {/* ── CTA ─────────────────────────────────────────────────────── */}
      <section style={{ background:'linear-gradient(135deg, #0a3d38 0%, #0c5249 100%)', padding:'clamp(72px,10vw,112px) clamp(20px,5vw,80px)', textAlign:'center' }}>
        <div style={{ maxWidth:640, margin:'0 auto' }}>
          <Stars count={5} size={24} gap={3} center />
          <h2 style={{ fontSize:'clamp(30px,5vw,54px)', fontWeight:900, color:'#fff', letterSpacing:'-.04em', margin:'20px 0 18px', lineHeight:1.06 }}>
            ¿Cuánto estás<br />pagando de más?
          </h2>
          <p style={{ fontSize:18, color:'rgba(255,255,255,.6)', marginBottom:44, lineHeight:1.68, maxWidth:480, margin:'0 auto 44px' }}>
            Únete a más de 52.000 personas que ya controlan sus suscripciones con Floowly. Empieza en menos de 3 minutos.
          </p>
          <Link href="/login?mode=register" style={{ display:'inline-flex', alignItems:'center', gap:10, fontSize:17, fontWeight:700, color:'#0a3d38', background:'#fff', textDecoration:'none', padding:'17px 44px', borderRadius:14, boxShadow:'0 6px 28px rgba(0,0,0,.22)' }}>
            Empezar gratis ahora
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
          </Link>
          <div style={{ display:'flex', justifyContent:'center', gap:28, marginTop:28, flexWrap:'wrap' }}>
            {['✓ Gratis para siempre', '✓ Sin tarjeta de crédito', '✓ Cancela cuando quieras'].map(t => (
              <span key={t} style={{ fontSize:13, color:'rgba(255,255,255,.44)', fontWeight:500 }}>{t}</span>
            ))}
          </div>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────────────── */}
      <footer style={{ background:'#0B1829', padding:'64px clamp(20px,5vw,80px) 0' }}>
        <div style={{ maxWidth:1280, margin:'0 auto' }}>

          {/* Main footer grid */}
          <div style={{ display:'grid', gridTemplateColumns:'1.8fr 1fr 1fr 1fr 1fr', gap:32, marginBottom:56 }}>

            {/* Brand column */}
            <div>
              <div style={{ marginBottom:20 }}><FloowlyLogo size="md" variant="dark" /></div>
              <p style={{ fontSize:13, color:'rgba(255,255,255,.36)', maxWidth:240, lineHeight:1.85, marginBottom:24 }}>
                Gestiona tus suscripciones, negocia mejores precios y controla tu patrimonio. Todo en un solo lugar.
              </p>
              <div style={{ display:'flex', alignItems:'center', gap:7, marginBottom:28 }}>
                <Stars count={5} size={13} gap={2} />
                <span style={{ fontSize:12, color:'rgba(255,255,255,.32)' }}>4.8 · 2.400+ reseñas</span>
              </div>
              {/* App stores */}
              <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                {[
                  { label:'App Store', sub:'iPhone & iPad', icon:<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/></svg> },
                  { label:'Google Play', sub:'Android', icon:<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="m3.609 1.814-10.214 10.215 10.214 10.214L14 18.059l-5.845-5.845v-.428L14 5.941zM14 8l1.5 1.5L4 8zM14 16l1.5-1.5L4 16z" transform="translate(6)"/><path d="M3 1.5 14.5 12 3 22.5V1.5z"/></svg> },
                ].map(s => (
                  <div key={s.label} style={{ display:'flex', alignItems:'center', gap:10, background:'rgba(255,255,255,.06)', border:'1px solid rgba(255,255,255,.09)', borderRadius:10, padding:'9px 14px', cursor:'pointer' }}>
                    <span style={{ color:'rgba(255,255,255,.5)' }}>{s.icon}</span>
                    <div>
                      <div style={{ fontSize:10, color:'rgba(255,255,255,.3)', lineHeight:1 }}>{s.sub}</div>
                      <div style={{ fontSize:12, fontWeight:700, color:'rgba(255,255,255,.65)', marginTop:2 }}>{s.label}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Características */}
            <div>
              <div style={{ fontSize:10.5, fontWeight:800, color:'rgba(255,255,255,.28)', letterSpacing:'.1em', textTransform:'uppercase', marginBottom:20 }}>Características</div>
              {['Gestionar suscripciones','Alertas de gasto','Presupuesto','Patrimonio neto','Puntuación crediticia','Negociación de facturas','Transacciones','Metas de ahorro'].map(l => (
                <div key={l} style={{ marginBottom:12 }}>
                  <Link href="/login" style={{ fontSize:13, color:'rgba(255,255,255,.42)', textDecoration:'none', fontWeight:500, lineHeight:1.4 }}>{l}</Link>
                </div>
              ))}
            </div>

            {/* Comparar */}
            <div>
              <div style={{ fontSize:10.5, fontWeight:800, color:'rgba(255,255,255,.28)', letterSpacing:'.1em', textTransform:'uppercase', marginBottom:20 }}>Comparar</div>
              {['Fintonic','Spendee','Monefy','YNAB','Copilot','Monarch Money','Wallet by BudgetBakers','Money Manager'].map(l => (
                <div key={l} style={{ marginBottom:12 }}>
                  <Link href="/login" style={{ fontSize:13, color:'rgba(255,255,255,.42)', textDecoration:'none', fontWeight:500, lineHeight:1.4 }}>{l}</Link>
                </div>
              ))}
            </div>

            {/* Empresa */}
            <div>
              <div style={{ fontSize:10.5, fontWeight:800, color:'rgba(255,255,255,.28)', letterSpacing:'.1em', textTransform:'uppercase', marginBottom:20 }}>Empresa</div>
              {['Sobre Floowly','Blog financiero','Trabaja con nosotros','Actualizaciones','Notas de prensa','Afiliados','Inversores'].map(l => (
                <div key={l} style={{ marginBottom:12 }}>
                  <Link href="/login" style={{ fontSize:13, color:'rgba(255,255,255,.42)', textDecoration:'none', fontWeight:500, lineHeight:1.4 }}>{l}</Link>
                </div>
              ))}
            </div>

            {/* Soporte */}
            <div>
              <div style={{ fontSize:10.5, fontWeight:800, color:'rgba(255,255,255,.28)', letterSpacing:'.1em', textTransform:'uppercase', marginBottom:20 }}>Soporte</div>
              {['Seguridad','Contacto','Centro de ayuda','Preguntas frecuentes','Condiciones del servicio','Política de privacidad','Gestión de cookies','RGPD · Datos personales'].map(l => (
                <div key={l} style={{ marginBottom:12 }}>
                  <Link href="/login" style={{ fontSize:13, color:'rgba(255,255,255,.42)', textDecoration:'none', fontWeight:500, lineHeight:1.4 }}>{l}</Link>
                </div>
              ))}
            </div>

          </div>

          {/* Divider + bottom bar */}
          <div style={{ borderTop:'1px solid rgba(255,255,255,.07)', padding:'24px 0 32px', display:'flex', justifyContent:'space-between', flexWrap:'wrap', gap:14, alignItems:'center' }}>
            <div style={{ display:'flex', gap:20, flexWrap:'wrap', alignItems:'center' }}>
              <span style={{ fontSize:12, color:'rgba(255,255,255,.2)' }}>© 2026 Floowly Money S.L. Todos los derechos reservados.</span>
              <span style={{ fontSize:12, color:'rgba(255,255,255,.2)' }}>España & Latinoamérica</span>
            </div>
            <div style={{ display:'flex', gap:20 }}>
              {['Privacidad','Términos','Cookies','RGPD'].map(l => (
                <Link key={l} href="/login" style={{ fontSize:12, color:'rgba(255,255,255,.22)', textDecoration:'none' }}>{l}</Link>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

/* ── Shared components ─────────────────────────────────────────────────── */

function Stars({ count, size, gap = 2, center = false }: { count: number; size: number; gap?: number; center?: boolean }) {
  return (
    <div style={{ display:'flex', gap, justifyContent:center ? 'center' : 'flex-start' }}>
      {Array.from({ length: count }).map((_, i) => (
        <span key={i} style={{ fontSize:size, color:'#FBBF24', lineHeight:1 }}>★</span>
      ))}
    </div>
  )
}

function AppMockup() {
  const subs = [
    { name:'Netflix',       cat:'Streaming', price:'15.99€', color:'#E11D48', initials:'NF' },
    { name:'Spotify',       cat:'Música',    price:'10.99€', color:'#1DB954', initials:'SP' },
    { name:'Adobe CC',      cat:'Software',  price:'29.99€', color:'#FF0000', initials:'AD' },
    { name:'Microsoft 365', cat:'Software',  price:'8.99€',  color:'#0078D4', initials:'MS' },
  ]
  return (
    <div style={{ background:'#fff', borderRadius:20, boxShadow:'0 28px 80px rgba(0,0,0,.35), 0 0 0 1px rgba(255,255,255,.08)', overflow:'hidden', width:'100%', maxWidth:620 }}>
      {/* Top bar */}
      <div style={{ background:'#F8FAFD', borderBottom:'1px solid #E2E8F2', padding:'10px 16px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <FloowlyIcon size={22} />
          <span style={{ fontSize:11, fontWeight:800, color:'#0F1C2E', letterSpacing:'-.01em' }}>Floowly Dashboard</span>
        </div>
        <div style={{ display:'flex', gap:12 }}>
          {['Suscripciones','Gastos','Patrimonio','Presupuesto'].map((t,i) => (
            <span key={t} style={{ fontSize:9, fontWeight:700, color: i===0 ? '#0f9b8e' : '#B0BFCC', cursor:'pointer', paddingBottom:2, borderBottom: i===0 ? '1.5px solid #0f9b8e' : 'none' }}>{t}</span>
          ))}
        </div>
      </div>

      {/* Body */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:0 }}>
        {/* Left panel */}
        <div style={{ padding:14, borderRight:'1px solid #EDF2FA' }}>
          {/* Stats row */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:6, marginBottom:12 }}>
            {[
              { l:'Activas', v:'7',      c:'#0F1C2E' },
              { l:'Mensual', v:'87€',    c:'#DC2626' },
              { l:'Ahorro',  v:'43€',    c:'#0f9b8e' },
            ].map(s => (
              <div key={s.l} style={{ background:'#F8FAFD', borderRadius:8, padding:'8px 9px', border:'1px solid #E2E8F2' }}>
                <div style={{ fontSize:7.5, fontWeight:700, color:'#8FA3BC', textTransform:'uppercase', marginBottom:3 }}>{s.l}</div>
                <div style={{ fontSize:14, fontWeight:800, color:s.c, letterSpacing:'-.02em' }}>{s.v}</div>
              </div>
            ))}
          </div>

          {/* Savings callout */}
          <div style={{ background:'#e8f7f6', border:'1px solid #A7F3D0', borderRadius:8, padding:'8px 10px', marginBottom:12, display:'flex', alignItems:'center', gap:7 }}>
            <span style={{ fontSize:13 }}>💡</span>
            <div>
              <div style={{ fontSize:8.5, fontWeight:800, color:'#0f9b8e' }}>OPORTUNIDAD DE AHORRO</div>
              <div style={{ fontSize:8, color:'#0c5249', marginTop:1 }}>Podrías ahorrar 43€/mes cancelando 2 apps</div>
            </div>
          </div>

          {/* Sub list */}
          <div style={{ fontSize:8, fontWeight:700, color:'#8FA3BC', textTransform:'uppercase', letterSpacing:'.07em', marginBottom:7 }}>Suscripciones activas</div>
          <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
            {subs.map(s => (
              <div key={s.name} style={{ display:'flex', alignItems:'center', gap:7, padding:'6px 9px', background:'#F8FAFD', borderRadius:8, border:'1px solid #E2E8F2' }}>
                <div style={{ width:24, height:24, borderRadius:6, background:s.color+'18', display:'flex', alignItems:'center', justifyContent:'center', fontSize:7.5, fontWeight:800, color:s.color, flexShrink:0 }}>{s.initials}</div>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:9.5, fontWeight:700, color:'#0F1C2E' }}>{s.name}</div>
                  <div style={{ fontSize:7.5, color:'#8FA3BC' }}>{s.cat}</div>
                </div>
                <div style={{ fontSize:9.5, fontWeight:800, color:'#0F1C2E' }}>{s.price}</div>
                <div style={{ fontSize:7, padding:'2px 6px', borderRadius:4, background:'#e8f7f6', color:'#0f9b8e', fontWeight:700 }}>Neg.</div>
              </div>
            ))}
          </div>
        </div>

        {/* Right panel — spending chart */}
        <div style={{ padding:14 }}>
          <div style={{ fontSize:9, fontWeight:800, color:'#0F1C2E', marginBottom:10 }}>Gasto mensual por categoría</div>
          {[
            { cat:'Streaming',  pct:38, amt:'33€',  color:'#E11D48' },
            { cat:'Software',   pct:45, amt:'39€',  color:'#0078D4' },
            { cat:'Música',     pct:13, amt:'11€',  color:'#1DB954' },
            { cat:'Otros',      pct:4,  amt:'4€',   color:'#D97706' },
          ].map(r => (
            <div key={r.cat} style={{ marginBottom:9 }}>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:3 }}>
                <span style={{ fontSize:8, fontWeight:600, color:'#3D5166' }}>{r.cat}</span>
                <span style={{ fontSize:8, fontWeight:800, color:'#0F1C2E' }}>{r.amt}</span>
              </div>
              <div style={{ height:6, background:'#EDF2FA', borderRadius:4, overflow:'hidden' }}>
                <div style={{ width:`${r.pct}%`, height:'100%', background:r.color, borderRadius:4 }} />
              </div>
            </div>
          ))}

          {/* Mini trend */}
          <div style={{ marginTop:14, background:'#F8FAFD', borderRadius:9, padding:'10px 12px', border:'1px solid #E2E8F2' }}>
            <div style={{ fontSize:8, fontWeight:700, color:'#8FA3BC', marginBottom:6 }}>TENDENCIA 6 MESES</div>
            <svg width="100%" height="36" viewBox="0 0 160 36">
              <polyline points="0,28 26,22 52,24 78,18 104,20 130,12 160,8" fill="none" stroke="#0f9b8e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <polyline points="0,28 26,22 52,24 78,18 104,20 130,12 160,8 160,36 0,36" fill="rgba(15,155,142,.08)" stroke="none"/>
              <circle cx="160" cy="8" r="3" fill="#0f9b8e"/>
            </svg>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ── Feature section helpers ───────────────────────────────────────────── */

function PillButton({ href, children }: { href: string; children: string }) {
  return (
    <Link
      href={href}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 8,
        fontSize: 15, fontWeight: 700, color: '#0F1C2E',
        textDecoration: 'none',
        padding: '13px 28px',
        borderRadius: 100,
        border: '2px solid #0F1C2E',
        transition: 'background .15s, color .15s',
      }}
      className="pill-btn"
    >
      {children}
    </Link>
  )
}

function PersonIllustration() {
  return (
    <svg width="100%" viewBox="0 0 320 240" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ position:'absolute', inset:0, width:'100%', height:'100%', opacity:.9 }}>
      {/* Subtle grid background */}
      <defs>
        <pattern id="grid" width="32" height="32" patternUnits="userSpaceOnUse">
          <path d="M 32 0 L 0 0 0 32" fill="none" stroke="rgba(255,255,255,.06)" strokeWidth="1"/>
        </pattern>
      </defs>
      <rect width="320" height="240" fill="url(#grid)" />

      {/* Person body/torso */}
      <rect x="120" y="130" width="80" height="90" rx="12" fill="rgba(255,255,255,.08)" />
      {/* Jacket */}
      <path d="M110 145 Q120 130 160 130 Q200 130 210 145 L210 220 L110 220 Z" fill="rgba(0,0,0,.3)" />
      {/* Inner shirt */}
      <rect x="145" y="130" width="30" height="50" fill="rgba(255,255,255,.12)" />

      {/* Neck */}
      <rect x="150" y="112" width="20" height="22" rx="8" fill="rgba(255,220,180,.85)" />
      {/* Head */}
      <ellipse cx="160" cy="95" rx="28" ry="32" fill="rgba(255,220,180,.9)" />
      {/* Hair */}
      <path d="M132 85 Q135 55 160 52 Q185 55 188 85 Q185 70 160 68 Q135 70 132 85Z" fill="rgba(180,110,50,.9)" />
      {/* Headband */}
      <path d="M136 82 Q160 75 184 82" stroke="rgba(200,130,180,.9)" strokeWidth="5" strokeLinecap="round" fill="none" />
      {/* Headphones */}
      <path d="M133 90 Q132 65 160 62 Q188 65 187 90" stroke="rgba(220,80,100,.9)" strokeWidth="5" strokeLinecap="round" fill="none" />
      <rect x="128" y="88" width="10" height="16" rx="5" fill="rgba(220,80,100,.9)" />
      <rect x="182" y="88" width="10" height="16" rx="5" fill="rgba(220,80,100,.9)" />
      {/* Eyes */}
      <ellipse cx="151" cy="95" rx="4" ry="4.5" fill="rgba(80,50,30,.9)" />
      <ellipse cx="169" cy="95" rx="4" ry="4.5" fill="rgba(80,50,30,.9)" />
      {/* Subtle smile */}
      <path d="M153 107 Q160 112 167 107" stroke="rgba(180,110,80,.6)" strokeWidth="2" strokeLinecap="round" fill="none" />

      {/* Phone in hand */}
      <rect x="168" y="162" width="36" height="60" rx="7" fill="rgba(30,30,30,.9)" />
      <rect x="171" y="166" width="30" height="48" rx="5" fill="rgba(15,155,142,.6)" />
      {/* Screen content lines */}
      <rect x="174" y="170" width="16" height="3" rx="1.5" fill="rgba(255,255,255,.6)" />
      <rect x="174" y="176" width="22" height="2" rx="1" fill="rgba(255,255,255,.3)" />
      <rect x="174" y="181" width="18" height="2" rx="1" fill="rgba(255,255,255,.3)" />

      {/* Decorative dots */}
      <circle cx="60" cy="40" r="4" fill="rgba(255,255,255,.1)" />
      <circle cx="270" cy="60" r="6" fill="rgba(255,255,255,.07)" />
      <circle cx="40" cy="180" r="8" fill="rgba(255,255,255,.06)" />
      <circle cx="280" cy="190" r="5" fill="rgba(255,255,255,.08)" />
    </svg>
  )
}

function SpendingIllustration() {
  return (
    <svg width="100%" viewBox="0 0 320 240" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ position:'absolute', inset:0, width:'100%', height:'100%' }}>
      <defs>
        <pattern id="grid2" width="28" height="28" patternUnits="userSpaceOnUse">
          <path d="M 28 0 L 0 0 0 28" fill="none" stroke="rgba(255,255,255,.08)" strokeWidth="1"/>
        </pattern>
      </defs>
      <rect width="320" height="240" fill="url(#grid2)" />
      {/* Couch shape */}
      <rect x="30" y="160" width="260" height="60" rx="16" fill="rgba(100,70,50,.3)" />
      <rect x="20" y="150" width="50" height="70" rx="12" fill="rgba(100,70,50,.35)" />
      <rect x="250" y="150" width="50" height="70" rx="12" fill="rgba(100,70,50,.35)" />
      <rect x="35" y="135" width="250" height="35" rx="12" fill="rgba(120,85,60,.35)" />
      {/* Person sitting */}
      {/* Body */}
      <rect x="125" y="120" width="70" height="55" rx="14" fill="rgba(100,140,90,.7)" />
      {/* Legs */}
      <rect x="120" y="165" width="35" height="40" rx="8" fill="rgba(200,170,190,.6)" />
      <rect x="165" y="165" width="35" height="40" rx="8" fill="rgba(200,170,190,.6)" />
      {/* Neck */}
      <rect x="150" y="105" width="20" height="20" rx="8" fill="rgba(240,200,170,.85)" />
      {/* Head */}
      <ellipse cx="160" cy="88" rx="26" ry="28" fill="rgba(240,200,170,.9)" />
      {/* Hair — short gray */}
      <path d="M134 80 Q136 55 160 53 Q184 55 186 80 Q182 62 160 60 Q138 62 134 80Z" fill="rgba(180,180,180,.85)" />
      {/* Eyes looking down at phone */}
      <ellipse cx="151" cy="91" rx="3.5" ry="3" fill="rgba(60,40,20,.8)" />
      <ellipse cx="169" cy="91" rx="3.5" ry="3" fill="rgba(60,40,20,.8)" />
      {/* Smile */}
      <path d="M152 102 Q160 108 168 102" stroke="rgba(180,110,80,.5)" strokeWidth="2" strokeLinecap="round" fill="none" />
      {/* Phone */}
      <rect x="155" y="140" width="38" height="62" rx="7" fill="rgba(20,20,20,.85)" />
      <rect x="158" y="144" width="32" height="50" rx="5" fill="rgba(15,155,142,.5)" />
      {/* Screen lines */}
      <rect x="161" y="148" width="18" height="3" rx="1.5" fill="rgba(255,255,255,.7)" />
      <rect x="161" y="154" width="24" height="2" rx="1" fill="rgba(255,255,255,.35)" />
      <rect x="161" y="159" width="20" height="2" rx="1" fill="rgba(255,255,255,.35)" />
      {/* Arm holding phone */}
      <path d="M145 148 Q150 155 155 160" stroke="rgba(240,200,170,.8)" strokeWidth="12" strokeLinecap="round" fill="none" />
      {/* Decorative lights */}
      <circle cx="50" cy="50" r="30" fill="rgba(255,250,230,.06)" />
      <circle cx="270" cy="190" r="20" fill="rgba(255,250,230,.04)" />
    </svg>
  )
}

function GoalsIllustration() {
  return (
    <svg width="100%" viewBox="0 0 320 240" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ position:'absolute', inset:0, width:'100%', height:'100%' }}>
      {/* Sky gradient */}
      <rect width="320" height="240" fill="rgba(100,130,150,.15)" />
      {/* Mountain shapes */}
      <path d="M0 240 L80 80 L160 160 L240 40 L320 140 L320 240 Z" fill="rgba(90,105,115,.5)" />
      <path d="M0 240 L60 130 L120 180 L200 90 L280 160 L320 200 L320 240 Z" fill="rgba(70,85,95,.4)" />
      <path d="M0 240 L40 170 L90 200 L150 140 L220 190 L320 220 L320 240 Z" fill="rgba(50,65,75,.35)" />
      {/* Sun/light source */}
      <circle cx="260" cy="50" r="40" fill="rgba(255,240,210,.12)" />
      <circle cx="260" cy="50" r="25" fill="rgba(255,240,210,.15)" />
      {/* Person on mountain — arms raised */}
      {/* Body */}
      <rect x="148" y="130" width="24" height="36" rx="8" fill="rgba(60,80,110,.8)" />
      {/* Shorts */}
      <rect x="144" y="158" width="14" height="22" rx="5" fill="rgba(40,60,90,.7)" />
      <rect x="162" y="158" width="14" height="22" rx="5" fill="rgba(40,60,90,.7)" />
      {/* Left arm raised */}
      <path d="M148 138 L128 108" stroke="rgba(60,80,110,.8)" strokeWidth="10" strokeLinecap="round" />
      {/* Right arm raised */}
      <path d="M172 138 L192 108" stroke="rgba(60,80,110,.8)" strokeWidth="10" strokeLinecap="round" />
      {/* Head */}
      <ellipse cx="160" cy="120" rx="14" ry="15" fill="rgba(240,200,170,.85)" />
      {/* Hair — dark */}
      <path d="M146 117 Q148 104 160 102 Q172 104 174 117 Q172 108 160 106 Q148 108 146 117Z" fill="rgba(40,25,10,.8)" />
      {/* Backpack */}
      <rect x="168" y="132" width="14" height="22" rx="6" fill="rgba(80,100,130,.6)" />
      {/* Mist/fog at base */}
      <rect x="0" y="200" width="320" height="40" fill="rgba(200,210,215,.12)" />
      {/* Stars */}
      <circle cx="30" cy="30" r="1.5" fill="rgba(255,255,255,.5)" />
      <circle cx="80" cy="15" r="1" fill="rgba(255,255,255,.4)" />
      <circle cx="200" cy="20" r="1.5" fill="rgba(255,255,255,.45)" />
      <circle cx="300" cy="35" r="1" fill="rgba(255,255,255,.35)" />
    </svg>
  )
}

/* ── SVG icon helpers ──────────────────────────────────────────────────── */
const ic = (d: string) => <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" dangerouslySetInnerHTML={{ __html: d }} />

function SearchIcon() { return ic('<circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>') }
function MailIcon()   { return ic('<path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>') }
function DollarIcon() { return ic('<line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>') }
function ChartIcon()  { return ic('<polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>') }
function CardIcon()   { return ic('<rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/>') }
function BellIcon()   { return ic('<path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>') }
function LinkIcon()   { return ic('<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>') }
function ScanIcon()   { return ic('<path d="M12 2a10 10 0 0 1 10 10"/><path d="M12 6a6 6 0 0 1 6 6"/><path d="M12 10a2 2 0 0 1 2 2"/><circle cx="12" cy="12" r="1"/>') }
function CheckIcon()  { return ic('<polyline points="20 6 9 17 4 12"/>') }
