-- Sahm core tables. Tables are locked (RLS on, no policies, no grants). The web server reaches them only through
-- public.sahm_api(), a SECURITY DEFINER function that checks a server-side secret stored in public.sahm_config.
-- So the server only needs the public (publishable) key + SAHM_DB_SECRET, never the service-role key.

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


create table if not exists public.sahm_config (key text primary key, value text not null);
alter table public.sahm_config enable row level security;
revoke all on public.sahm_config from anon, authenticated;
-- Set once, out of band (never commit the value):
--   insert into public.sahm_config values ('api_secret', '<long random>') on conflict (key) do update set value = excluded.value;

create or replace function public.sahm_api(p_secret text, p_op text, p_args jsonb default '{}'::jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  a jsonb := coalesce(p_args, '{}'::jsonb);
  expected text;
  res jsonb;
begin
  select value into expected from public.sahm_config where key = 'api_secret';
  if expected is null or length(expected) < 32 or p_secret is distinct from expected then
    raise exception 'unauthorized' using errcode = '28000';
  end if;

  case p_op
  when 'upsert_user' then
    insert into sahm_users (wallet, lang) values (a->>'wallet', coalesce(a->>'lang', 'ar')) on conflict (wallet) do nothing;
    res := '{}'::jsonb;

  when 'insert_plan' then
    insert into sahm_plans (wallet, chain_id, target, amount_usd, frequency, dip_boost, daily_cap_usd, permission, signature, permission_hash)
    values (a->>'wallet', (a->>'chain_id')::int, a->>'target', (a->>'amount_usd')::numeric, a->>'frequency',
            coalesce((a->>'dip_boost')::boolean, false), (a->>'daily_cap_usd')::numeric, a->'permission', a->>'signature', a->>'permission_hash')
    on conflict (permission_hash) do update set status = 'active'
    returning to_jsonb(sahm_plans.*) into res;

  when 'plans_for' then
    select coalesce(jsonb_agg(to_jsonb(p) - 'permission' - 'signature' order by p.created_at desc), '[]'::jsonb) into res
      from sahm_plans p where p.wallet = a->>'wallet' and p.chain_id = (a->>'chain_id')::int;

  when 'plans_full' then
    select coalesce(jsonb_agg(to_jsonb(p)), '[]'::jsonb) into res
      from sahm_plans p where p.wallet = a->>'wallet' and p.chain_id = (a->>'chain_id')::int;

  when 'update_plan' then
    update sahm_plans set
      status = coalesce(a->'patch'->>'status', status),
      next_run = coalesce((a->'patch'->>'next_run')::timestamptz, next_run),
      attempts = coalesce((a->'patch'->>'attempts')::int, attempts),
      runs = coalesce((a->'patch'->>'runs')::int, runs)
    where id = (a->>'id')::uuid;
    res := '{}'::jsonb;

  when 'claim_due' then
    with c as (
      update sahm_plans p set next_run = now() + interval '15 minutes'
       where p.id in (
         select id from sahm_plans
          where status = 'active' and chain_id = (a->>'chain_id')::int and next_run <= now()
            and (a->>'plan_id' is null or id = (a->>'plan_id')::uuid)
          order by next_run limit coalesce((a->>'limit')::int, 25)
          for update skip locked)
      returning p.*)
    select coalesce(jsonb_agg(to_jsonb(c)), '[]'::jsonb) into res from c;

  when 'log_execution' then
    insert into sahm_executions (plan_id, wallet, chain_id, ticker, decision, reason_ar, reason_en, usdc_in, stock_out, price, ref_price, gap_pct, tx_hash)
    values ((a->>'plan_id')::uuid, a->>'wallet', (a->>'chain_id')::int, a->>'ticker', a->>'decision', a->>'reason_ar', a->>'reason_en',
            (a->>'usdc_in')::numeric, (a->>'stock_out')::numeric, (a->>'price')::numeric, (a->>'ref_price')::numeric, (a->>'gap_pct')::numeric, a->>'tx_hash');
    res := '{}'::jsonb;

  when 'executions_for' then
    select coalesce(jsonb_agg(to_jsonb(e) order by e.created_at desc), '[]'::jsonb) into res from (
      select * from sahm_executions where wallet = a->>'wallet' and chain_id = (a->>'chain_id')::int
      order by created_at desc limit coalesce((a->>'limit')::int, 30)) e;

  when 'recent' then
    select coalesce(jsonb_agg(jsonb_build_object('wallet', e.wallet, 'ticker', e.ticker, 'usdc_in', e.usdc_in, 'stock_out', e.stock_out,
                                                 'tx_hash', e.tx_hash, 'created_at', e.created_at) order by e.created_at desc), '[]'::jsonb) into res from (
      select * from sahm_executions where chain_id = (a->>'chain_id')::int and decision = 'executed'
      order by created_at desc limit coalesce((a->>'limit')::int, 20)) e;

  when 'stats' then
    select jsonb_build_object(
      'wallets', (select count(distinct wallet) from sahm_plans where chain_id = (a->>'chain_id')::int),
      'active_plans', (select count(*) from sahm_plans where chain_id = (a->>'chain_id')::int and status = 'active'),
      'buys', (select count(*) from sahm_executions where chain_id = (a->>'chain_id')::int and decision = 'executed'),
      'volume', (select coalesce(sum(usdc_in), 0) from sahm_executions where chain_id = (a->>'chain_id')::int and decision = 'executed')
    ) into res;

  else
    raise exception 'unknown op %', p_op;
  end case;
  return res;
end;
$$;
revoke all on function public.sahm_api(text, text, jsonb) from public;
grant execute on function public.sahm_api(text, text, jsonb) to anon, authenticated;

-- Hourly agent tick (run once after deploying; replace the URL and secret):
-- select cron.schedule('sahm-agent-tick', '7 * * * *',
--   $$select net.http_post(url:='https://<your-domain>/api/agent/tick',
--     headers:=jsonb_build_object('content-type','application/json','authorization','Bearer <CRON_SECRET>'),
--     body:='{}'::jsonb, timeout_milliseconds:=55000)$$);
