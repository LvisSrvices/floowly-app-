# Setup — Negociador Automático

## 1. Instalar dependencias
```bash
cd ~/Desktop/negociador-app
npm install
```

## 2. Variables de entorno
```bash
cp .env.local.example .env.local
```
Rellena cada variable (instrucciones abajo).

## 3. Supabase
1. Ve a supabase.com → New project
2. Copia `URL` y `anon key` de Settings → API
3. Ve a SQL Editor → New query → pega el contenido de `supabase/schema.sql` → Run

## 4. Google OAuth (para Gmail)
1. console.cloud.google.com → New project
2. APIs & Services → Enable APIs → busca "Gmail API" → Enable
3. Credentials → Create Credentials → OAuth 2.0 Client ID
4. Application type: Web application
5. Authorized redirect URIs: `http://localhost:3000/api/auth/callback/google`
6. Copia Client ID y Client Secret al `.env.local`

## 5. Arrancar en local
```bash
npm run dev
```
Abre http://localhost:3000

## 6. Flujo de prueba
1. Regístrate con tu email
2. Confirma el email (revisa bandeja)
3. Inicia sesión → ve a /connect
4. Conecta Gmail
5. Espera ~15s mientras escanea
6. El dashboard muestra tus suscripciones detectadas

## Variables de entorno explicadas

| Variable | Dónde encontrarla |
|----------|-------------------|
| NEXT_PUBLIC_SUPABASE_URL | Supabase → Settings → API → Project URL |
| NEXT_PUBLIC_SUPABASE_ANON_KEY | Supabase → Settings → API → anon public |
| SUPABASE_SERVICE_ROLE_KEY | Supabase → Settings → API → service_role |
| ANTHROPIC_API_KEY | console.anthropic.com → API Keys |
| GOOGLE_CLIENT_ID | Google Cloud Console → Credentials |
| GOOGLE_CLIENT_SECRET | Google Cloud Console → Credentials |
| STRIPE_SECRET_KEY | dashboard.stripe.com → Developers → API Keys |
