import "server-only";

/**
 * Minimal Supabase PostgREST client (server only). Uses the service-role / secret key, so it must never be
 * imported from client components. Configure SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in Vercel.
 */
const URL_ = process.env.SUPABASE_URL || "https://cguxdschojoqbffdrlhm.supabase.co";
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY || "";

export const dbEnabled = () => !!KEY;

async function req<T>(path: string, init: RequestInit & { prefer?: string } = {}): Promise<T> {
  if (!KEY) throw new Error("db_not_configured");
  const r = await fetch(`${URL_}/rest/v1/${path}`, {
    ...init,
    cache: "no-store",
    headers: {
      apikey: KEY,
      authorization: `Bearer ${KEY}`,
      "content-type": "application/json",
      ...(init.prefer ? { prefer: init.prefer } : {}),
      ...(init.headers || {}),
    },
  });
  if (!r.ok) throw new Error(`db ${r.status}: ${(await r.text()).slice(0, 300)}`);
  const text = await r.text();
  return (text ? JSON.parse(text) : null) as T;
}

export type PlanRow = {
  id: string;
  wallet: string;
  chain_id: number;
  target: string;
  amount_usd: number;
  frequency: "daily" | "weekly";
  dip_boost: boolean;
  daily_cap_usd: number;
  permission: SpendPermissionJson;
  signature: string;
  permission_hash: string;
  status: "active" | "stopped" | "expired";
  next_run: string;
  attempts: number;
  runs: number;
  created_at: string;
};

export type SpendPermissionJson = {
  account: string;
  spender: string;
  token: string;
  allowance: string;
  period: number;
  start: number;
  end: number;
  salt: string;
  extraData: string;
};

export type ExecutionRow = {
  id?: number;
  plan_id: string | null;
  wallet: string;
  chain_id: number;
  ticker: string | null;
  decision: "executed" | "deferred" | "rejected";
  reason_ar: string;
  reason_en: string;
  usdc_in?: number | null;
  stock_out?: number | null;
  price?: number | null;
  ref_price?: number | null;
  gap_pct?: number | null;
  tx_hash?: string | null;
  created_at?: string;
};

export const db = {
  upsertUser: (wallet: string, lang: string) =>
    req("sahm_users?on_conflict=wallet", {
      method: "POST",
      prefer: "resolution=ignore-duplicates,return=minimal",
      body: JSON.stringify({ wallet, lang }),
    }),

  insertPlan: (row: Omit<PlanRow, "id" | "status" | "next_run" | "attempts" | "runs" | "created_at">) =>
    req<PlanRow[]>("sahm_plans?on_conflict=permission_hash", {
      method: "POST",
      prefer: "resolution=merge-duplicates,return=representation",
      body: JSON.stringify(row),
    }).then((r) => r[0]),

  plansFor: (wallet: string, chainId: number) =>
    req<PlanRow[]>(
      `sahm_plans?wallet=eq.${wallet}&chain_id=eq.${chainId}&order=created_at.desc&select=id,target,amount_usd,frequency,dip_boost,daily_cap_usd,status,next_run,runs,created_at,permission_hash`,
    ),

  plansFull: (wallet: string, chainId: number) => req<PlanRow[]>(`sahm_plans?wallet=eq.${wallet}&chain_id=eq.${chainId}`),

  updatePlan: (id: string, patch: Partial<PlanRow>) =>
    req(`sahm_plans?id=eq.${id}`, { method: "PATCH", prefer: "return=minimal", body: JSON.stringify(patch) }),

  stopPlans: (wallet: string, chainId: number) =>
    req(`sahm_plans?wallet=eq.${wallet}&chain_id=eq.${chainId}&status=eq.active`, {
      method: "PATCH",
      prefer: "return=minimal",
      body: JSON.stringify({ status: "stopped" }),
    }),

  claimDue: (chainId: number, planId?: string) =>
    req<PlanRow[]>("rpc/sahm_claim_due", {
      method: "POST",
      body: JSON.stringify({ p_chain: chainId, p_limit: 25, p_plan: planId ?? null }),
    }),

  logExecution: (row: ExecutionRow) =>
    req("sahm_executions", { method: "POST", prefer: "return=minimal", body: JSON.stringify(row) }),

  executionsFor: (wallet: string, chainId: number, limit = 30) =>
    req<ExecutionRow[]>(`sahm_executions?wallet=eq.${wallet}&chain_id=eq.${chainId}&order=created_at.desc&limit=${limit}`),

  recent: (chainId: number, limit = 20) =>
    req<ExecutionRow[]>(
      `sahm_executions?chain_id=eq.${chainId}&decision=eq.executed&order=created_at.desc&limit=${limit}&select=wallet,ticker,usdc_in,stock_out,tx_hash,created_at`,
    ),

  stats: (chainId: number) =>
    req<{ wallets: number; active_plans: number; buys: number; volume: number }>("rpc/sahm_stats", {
      method: "POST",
      body: JSON.stringify({ p_chain: chainId }),
    }),
};
