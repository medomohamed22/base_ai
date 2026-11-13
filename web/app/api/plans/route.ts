import { after, NextResponse, type NextRequest } from "next/server";
import { type Hex } from "viem";
import { publicClient, runTick } from "@/lib/agent";
import { CHAIN, EXECUTOR, SPEND_PERMISSION_MANAGER, USDC } from "@/lib/chain";
import { db, dbEnabled, type SpendPermissionJson } from "@/lib/db";
import { isAddr, SPM_ABI, toTuple } from "@/lib/onchain";
import { STOCKS } from "@/lib/stocks";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

type Body = {
  plan: { target: string; amountUsd: number; frequency: "daily" | "weekly"; dipBoost: boolean; dailyCapUsd: number };
  permission: { signature: string; permission: SpendPermissionJson };
  lang?: string;
};

const bad = (error: string, status = 400) => NextResponse.json({ ok: false, error }, { status });

/** Save a signed plan. The signature is verified on-chain (ERC-1271 / ERC-6492) before anything is stored. */
export async function POST(req: NextRequest) {
  if (!dbEnabled()) return bad("db not configured", 503);
  let body: Body;
  try {
    body = await req.json();
  } catch {
    return bad("invalid json");
  }
  const { plan, permission, lang } = body;
  const perm = permission?.permission;
  if (!plan || !perm || !permission.signature) return bad("missing fields");
  if (!isAddr(perm.account) || !isAddr(perm.spender) || !isAddr(perm.token)) return bad("bad addresses");
  if (perm.spender.toLowerCase() !== EXECUTOR.toLowerCase()) return bad("wrong spender");
  if (perm.token.toLowerCase() !== USDC[CHAIN.id].toLowerCase()) return bad("wrong token");
  if (!(plan.target === "HALAL" || STOCKS.some((s) => s.ticker === plan.target && s.verdict === "ok"))) return bad("bad target");
  if (!(plan.amountUsd > 0 && plan.amountUsd <= 100)) return bad("bad amount");
  if (plan.frequency !== "daily" && plan.frequency !== "weekly") return bad("bad frequency");

  const p = toTuple(perm);
  const hash = (await publicClient.readContract({ address: SPEND_PERMISSION_MANAGER, abi: SPM_ABI, functionName: "getHash", args: [p] })) as Hex;
  const valid = await publicClient.verifyHash({ address: p.account, hash, signature: permission.signature as Hex }).catch(() => false);
  if (!valid) return bad("invalid signature", 401);

  const wallet = perm.account.toLowerCase();
  await db.upsertUser(wallet, lang === "en" ? "en" : "ar");
  const row = await db.insertPlan({
    wallet,
    chain_id: CHAIN.id,
    target: plan.target,
    amount_usd: plan.amountUsd,
    frequency: plan.frequency,
    dip_boost: !!plan.dipBoost,
    daily_cap_usd: Number(BigInt(perm.allowance)) / 1e6,
    permission: { ...perm, allowance: String(perm.allowance), salt: String(perm.salt), extraData: perm.extraData || "0x" },
    signature: permission.signature,
    permission_hash: hash,
  });

  // First buy right away, after the response is sent.
  after(async () => {
    try {
      await runTick({ planId: row.id });
    } catch {
      /* the hourly tick retries */
    }
  });

  return NextResponse.json({ ok: true, id: row.id });
}

/** A wallet's plans and history. Everything here is also public on-chain. */
export async function GET(req: NextRequest) {
  if (!dbEnabled()) return NextResponse.json({ ok: true, plans: [], executions: [], db: false });
  const w = req.nextUrl.searchParams.get("wallet") || "";
  if (!isAddr(w)) return bad("bad wallet");
  const wallet = w.toLowerCase();
  const [plans, executions] = await Promise.all([db.plansFor(wallet, CHAIN.id), db.executionsFor(wallet, CHAIN.id)]);
  return NextResponse.json({ ok: true, plans, executions, db: true });
}
