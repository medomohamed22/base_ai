import "server-only";

/**
 * Supabase access (server only). Every call goes through public.sahm_api(), which checks SAHM_DB_SECRET inside the
 * database. The REST key is the public publishable key, so no service-role key is needed anywhere.
 */
const URL_ = process.env.SUPABASE_URL || "https://cguxdschojoqbffdrlhm.supabase.co";
const KEY = process.env.SUPABASE_PUBLISHABLE_KEY || "sb_publishable_6xtVxiosxF2T6qlB68eCGg_wiNdkdX_";
const SECRET = process.env.SAHM_DB_SECRET || "";

export const dbEnabled = () => SECRET.length >= 32;

async function api<T>(op: string, args: Record<string, unknown> = {}): Promise<T> {
  if (!dbEnabled()) throw new Error("db_not_configured");
  const r = await fetch(`${URL_}/rest/v1/rpc/sahm_api`, {
    method: "POST",
    cache: "no-store",
    headers: { apikey: KEY, authorization: `Bearer ${KEY}`, "content-type": "application/json" },
    body: JSON.stringify({ p_secret: SECRET, p_op: op, p_args: args }),
  });
  if (!r.ok) throw new Error(`db ${op} ${r.status}: ${(await r.text()).slice(0, 300)}`);
  return (await r.json()) as T;
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
  upsertUser: (wallet: string, lang: string) => api("upsert_user", { wallet, lang }),

  insertPlan: (row: Omit<PlanRow, "id" | "status" | "next_run" | "attempts" | "runs" | "created_at">) =>
    api<PlanRow>("insert_plan", row),

  plansFor: (wallet: string, chainId: number) => api<PlanRow[]>("plans_for", { wallet, chain_id: chainId }),

  plansFull: (wallet: string, chainId: number) => api<PlanRow[]>("plans_full", { wallet, chain_id: chainId }),

  updatePlan: (id: string, patch: Partial<PlanRow>) => api("update_plan", { id, patch }),

  claimDue: (chainId: number, planId?: string) => api<PlanRow[]>("claim_due", { chain_id: chainId, plan_id: planId ?? null }),

  logExecution: (row: ExecutionRow) => api("log_execution", row),

  executionsFor: (wallet: string, chainId: number, limit = 30) =>
    api<ExecutionRow[]>("executions_for", { wallet, chain_id: chainId, limit }),

  recent: (chainId: number, limit = 20) => api<ExecutionRow[]>("recent", { chain_id: chainId, limit }),

  stats: (chainId: number) =>
    api<{ wallets: number; active_plans: number; buys: number; volume: number }>("stats", { chain_id: chainId }),
};
