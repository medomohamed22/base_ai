-- Sahm core tables. Server-only access (service role); RLS on with no public policies.

create table if not exists public.sahm_users (
  wallet text primary key,                       -- lowercase 0x address
  lang text not null default 'ar',
  created_at timestamptz not null default now()
);

create table if not exists public.sahm_plans (
  id uuid primary key default gen_random_uuid(),
  wallet text not null references public.sahm_users(wallet),
  chain_id integer not null,
  target text not null,                          -- ticker, or 'HALAL' for the basket
  amount_usd numeric(12,2) not null check (amount_usd > 0 and amount_usd <= 100),
  frequency text not null check (frequency in ('daily','weekly')),
  dip_boost boolean not null default false,
  daily_cap_usd numeric(12,2) not null,
  permission jsonb not null,                     -- SpendPermission struct (strings for uint fields)
  signature text not null,
  permission_hash text not null unique,
  status text not null default 'active' check (status in ('active','stopped','expired')),
  next_run timestamptz not null default now(),
  attempts integer not null default 0,           -- consecutive guard deferrals in the current slot
  runs integer not null default 0,               -- executed buys (round-robin index for baskets)
  created_at timestamptz not null default now()
);
create index if not exists sahm_plans_due_idx on public.sahm_plans (status, next_run);
create index if not exists sahm_plans_wallet_idx on public.sahm_plans (wallet);

create table if not exists public.sahm_executions (
  id bigint generated always as identity primary key,
  plan_id uuid references public.sahm_plans(id),
  wallet text not null,
  chain_id integer not null,
  ticker text,
  decision text not null check (decision in ('executed','deferred','rejected')),
  reason_ar text not null,
  reason_en text not null,
  usdc_in numeric(18,6),
  stock_out numeric(28,8),
  price numeric(18,6),
  ref_price numeric(18,6),
  gap_pct numeric(8,4),
  tx_hash text,
  created_at timestamptz not null default now()
);
create index if not exists sahm_exec_wallet_idx on public.sahm_executions (wallet, created_at desc);
create index if not exists sahm_exec_created_idx on public.sahm_executions (created_at desc);

alter table public.sahm_users enable row level security;
alter table public.sahm_plans enable row level security;
alter table public.sahm_executions enable row level security;
revoke all on public.sahm_users, public.sahm_plans, public.sahm_executions from anon, authenticated;

-- Atomically claim due plans so overlapping ticks never execute the same plan twice.
create or replace function public.sahm_claim_due(p_chain integer, p_limit integer default 25, p_plan uuid default null)
returns setof public.sahm_plans
language sql
security definer
set search_path = public
as $$
  update public.sahm_plans p
     set next_run = now() + interval '15 minutes'
   where p.id in (
     select id from public.sahm_plans
      where status = 'active' and chain_id = p_chain and next_run <= now()
        and (p_plan is null or id = p_plan)
      order by next_run
      limit p_limit
      for update skip locked)
  returning p.*;
$$;
revoke all on function public.sahm_claim_due(integer, integer, uuid) from public, anon, authenticated;

-- Public, aggregate-only stats.
create or replace function public.sahm_stats(p_chain integer)
returns json
language sql
security definer
set search_path = public
stable
as $$
  select json_build_object(
    'wallets', (select count(distinct wallet) from public.sahm_plans where chain_id = p_chain),
    'active_plans', (select count(*) from public.sahm_plans where chain_id = p_chain and status = 'active'),
    'buys', (select count(*) from public.sahm_executions where chain_id = p_chain and decision = 'executed'),
    'volume', (select coalesce(sum(usdc_in), 0) from public.sahm_executions where chain_id = p_chain and decision = 'executed')
  );
$$;
revoke all on function public.sahm_stats(integer) from public, anon, authenticated;

-- Hourly agent tick (run once after deploying the web app; replace the URL and secret):
-- select cron.schedule('sahm-agent-tick', '7 * * * *',
--   $$select net.http_post(url:='https://<your-domain>/api/agent/tick',
--     headers:=jsonb_build_object('content-type','application/json','authorization','Bearer <CRON_SECRET>'),
--     body:='{}'::jsonb, timeout_milliseconds:=55000)$$);
