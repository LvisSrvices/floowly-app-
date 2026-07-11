-- Negociador Automático — Schema
-- Ejecuta esto en el SQL Editor de tu proyecto Supabase

-- ── connected_accounts ────────────────────────────────────────────────────────
create table if not exists connected_accounts (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  type            text not null check (type in ('email', 'bank')),
  provider        text not null,          -- 'gmail', 'outlook', 'nordigen', 'belvo'
  access_token    text,
  refresh_token   text,
  expires_at      timestamptz,
  connected_at    timestamptz default now(),
  last_synced     timestamptz,
  unique(user_id, provider)
);

alter table connected_accounts enable row level security;
create policy "Users see own accounts" on connected_accounts
  for all using (auth.uid() = user_id);

-- ── subscriptions ─────────────────────────────────────────────────────────────
create table if not exists subscriptions (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references auth.users(id) on delete cascade,
  name             text not null,
  provider         text not null,
  amount           numeric(10,2),
  currency         text default 'EUR',
  frequency        text check (frequency in ('monthly','annual','weekly','unknown')) default 'unknown',
  category         text check (category in ('streaming','software','telecom','insurance','gym','news','other')) default 'other',
  status           text check (status in ('active','cancelled','paused','unknown')) default 'active',
  detected_via     text default 'email',
  confidence       text check (confidence in ('high','medium','low')) default 'medium',
  email_from       text,
  last_charge_date date,
  created_at       timestamptz default now(),
  updated_at       timestamptz default now(),
  unique(user_id, provider, name)
);

alter table subscriptions enable row level security;
create policy "Users manage own subscriptions" on subscriptions
  for all using (auth.uid() = user_id);

-- ── negotiations ──────────────────────────────────────────────────────────────
create table if not exists negotiations (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references auth.users(id) on delete cascade,
  subscription_id   uuid references subscriptions(id) on delete set null,
  channel           text not null check (channel in ('email_template','email_sent','voice_call')),
  action            text not null check (action in ('cancel_email','negotiate_email','cancel_call','negotiate_call')),
  status            text default 'template_generated',
  email_subject     text,
  email_body        text,
  saving_amount     numeric(10,2),
  notes             text,
  created_at        timestamptz default now()
);

alter table negotiations enable row level security;
create policy "Users manage own negotiations" on negotiations
  for all using (auth.uid() = user_id);

-- ── scan_logs ─────────────────────────────────────────────────────────────────
create table if not exists scan_logs (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null references auth.users(id) on delete cascade,
  status              text check (status in ('running','completed','failed')) default 'running',
  emails_scanned      int default 0,
  subscriptions_found int default 0,
  error               text,
  started_at          timestamptz default now(),
  completed_at        timestamptz
);

alter table scan_logs enable row level security;
create policy "Users see own scan logs" on scan_logs
  for all using (auth.uid() = user_id);
