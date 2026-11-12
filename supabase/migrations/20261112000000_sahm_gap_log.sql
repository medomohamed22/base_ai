create extension if not exists pg_cron;
create extension if not exists pg_net;
create table if not exists public.sahm_gap_log (
  id bigint generated always as identity primary key,
  ts timestamptz not null default now(),
  session text not null,
  ticker text not null,
  dex_price numeric,
  perp_price numeric,
  gap_pct numeric,
  dex_liq_usd numeric
);
create index if not exists sahm_gap_log_ts_idx on public.sahm_gap_log (ts desc);
alter table public.sahm_gap_log enable row level security;
revoke all on public.sahm_gap_log from anon, authenticated;
-- schedule (run once, replace <project-ref>):
-- select cron.schedule('sahm-gap-logger', '*/5 * * * *',
--   $$select net.http_post(url:='https://<project-ref>.supabase.co/functions/v1/sahm-gap-logger',
--     headers:='{"content-type":"application/json"}'::jsonb, body:='{}'::jsonb, timeout_milliseconds:=20000)$$);
