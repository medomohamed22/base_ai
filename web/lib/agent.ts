import "server-only";
import {
  createPublicClient,
  createWalletClient,
  decodeEventLog,
  encodeFunctionData,
  formatUnits,
  http,
  parseUnits,
  type Hex,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { CHAIN, EXECUTOR, SEPOLIA_MOCK, USDC, ERC20_ABI } from "./chain";
import { db, type PlanRow } from "./db";
import { builderSuffix, EXECUTOR_ABI, MOCK_ROUTER_ABI, SPM_ABI, toTuple } from "./onchain";
import { fetchQuotes, type Quotes } from "./prices";
import { SPEND_PERMISSION_MANAGER } from "./chain";
import { HALAL_BASKET, STOCKS } from "./stocks";

/**
 * Sahm agent. Rules decide every trade; no language model is involved here.
 *  1. Scheduled buy (amount + frequency chosen by the user).
 *  2. Fair-price guard: DEX price ≤ reference × 1.003, price impact ≤ 0.5%, else defer 1h (max 6 times per slot).
 *  3. Optional dip boost: ×1.5 when price ≤ 90% of the 30-day high, capped by the on-chain allowance.
 *  4. Holding is the default; the agent never sells.
 */

const MAX_GAP = 0.003;
const MAX_DEFERRALS = 6;
const HOUR = 3600_000;

const rpc = CHAIN.testnet ? process.env.BASE_SEPOLIA_RPC_URL || process.env.NEXT_PUBLIC_BASE_SEPOLIA_RPC_URL : process.env.BASE_RPC_URL || process.env.NEXT_PUBLIC_BASE_RPC_URL;
export const publicClient = createPublicClient({ chain: CHAIN, transport: http(rpc || undefined) });

function agentAccount() {
  const pk = process.env.AGENT_PRIVATE_KEY;
  if (!pk || !/^0x[0-9a-fA-F]{64}$/.test(pk)) return null;
  return privateKeyToAccount(pk as Hex);
}

export const agentAddress = () => agentAccount()?.address ?? null;

const slotAfter = (from: number, freq: PlanRow["frequency"]) => new Date(from + (freq === "daily" ? 24 : 24 * 7) * HOUR).toISOString();

async function high30d(ticker: string): Promise<number | null> {
  try {
    const end = Date.now();
    const r = await fetch("https://api.hyperliquid.xyz/info", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ type: "candleSnapshot", req: { coin: `xyz:${ticker}`, interval: "1d", startTime: end - 30 * 24 * HOUR, endTime: end } }),
      cache: "no-store",
    });
    const candles = (await r.json()) as { h: string }[];
    const hs = candles.map((c) => Number(c.h)).filter((x) => x > 0);
    return hs.length ? Math.max(...hs) : null;
  } catch {
    return null;
  }
}

type Outcome = { plan: string; decision: "executed" | "deferred" | "rejected" | "skipped"; tx?: string; note?: string };

export async function runTick(opts: { planId?: string } = {}): Promise<{ ok: boolean; processed: Outcome[]; error?: string }> {
  const account = agentAccount();
  if (!account) return { ok: false, processed: [], error: "AGENT_PRIVATE_KEY not configured" };
  if (!EXECUTOR) return { ok: false, processed: [], error: "executor not deployed on this chain" };
  if (!CHAIN.testnet) return { ok: false, processed: [], error: "mainnet routing is enabled in the mainnet stage" };

  const onchainAgent = (await publicClient.readContract({ address: EXECUTOR, abi: EXECUTOR_ABI, functionName: "agent" })) as string;
  if (onchainAgent.toLowerCase() !== account.address.toLowerCase()) {
    return { ok: false, processed: [], error: `contract agent is ${onchainAgent}, server agent is ${account.address}. Call setAgent from /deploy.` };
  }

  const plans = await db.claimDue(CHAIN.id, opts.planId);
  if (!plans.length) return { ok: true, processed: [] };

  let quotes: Quotes = {};
  try {
    quotes = await fetchQuotes();
  } catch {
    /* handled per plan */
  }

  const wallet = createWalletClient({ account, chain: CHAIN, transport: http(rpc || undefined) });
  const out: Outcome[] = [];
  for (const plan of plans) {
    try {
      out.push(await processPlan(plan, quotes, wallet));
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      await db.updatePlan(plan.id, { next_run: new Date(Date.now() + HOUR).toISOString() });
      await db.logExecution({
        plan_id: plan.id,
        wallet: plan.wallet,
        chain_id: plan.chain_id,
        ticker: null,
        decision: "deferred",
        reason_ar: "حصل خطأ تقني مؤقت. هنحاول تاني بعد ساعة.",
        reason_en: "A temporary technical error. We'll retry in an hour.",
      });
      out.push({ plan: plan.id, decision: "deferred", note: msg.slice(0, 200) });
    }
  }
  return { ok: true, processed: out };
}

async function processPlan(plan: PlanRow, quotes: Quotes, wallet: ReturnType<typeof createWalletClient>): Promise<Outcome> {
  const p = toTuple(plan.permission);
  const now = Date.now();
  const log = (row: Partial<Parameters<typeof db.logExecution>[0]> & { decision: "executed" | "deferred" | "rejected"; reason_ar: string; reason_en: string }) =>
    db.logExecution({ plan_id: plan.id, wallet: plan.wallet, chain_id: plan.chain_id, ticker: null, ...row });

  // Lifecycle: expired or revoked plans stop for good.
  if (p.end * 1000 <= now) {
    await db.updatePlan(plan.id, { status: "expired" });
    return { plan: plan.id, decision: "skipped", note: "expired" };
  }
  const revoked = await publicClient.readContract({ address: SPEND_PERMISSION_MANAGER, abi: SPM_ABI, functionName: "isRevoked", args: [p] });
  if (revoked) {
    await db.updatePlan(plan.id, { status: "stopped" });
    return { plan: plan.id, decision: "skipped", note: "revoked" };
  }

  // Which stock this run (basket = round-robin).
  // Testnet: only a mock NVDA exists, so every plan buys it there.
  const ticker = CHAIN.testnet ? "NVDA" : plan.target === "HALAL" ? HALAL_BASKET[plan.runs % HALAL_BASKET.length] : plan.target;
  const stockMeta = STOCKS.find((s) => s.ticker === ticker);
  const ref = quotes[ticker]?.px;
  if (!stockMeta || !ref) {
    await db.updatePlan(plan.id, { next_run: new Date(now + HOUR).toISOString() });
    await log({ ticker, decision: "deferred", reason_ar: `سعر ${ticker} المرجعي مش متاح دلوقتي. هنحاول بعد ساعة.`, reason_en: `${ticker} reference price is unavailable. Retrying in an hour.` });
    return { plan: plan.id, decision: "deferred", note: "no reference price" };
  }

  // Amount (+ optional dip boost), capped by what's left in this period on-chain.
  let amountUsd = Number(plan.amount_usd);
  let boosted = false;
  if (plan.dip_boost) {
    const hi = await high30d(ticker);
    if (hi && ref <= hi * 0.9) {
      amountUsd = Math.min(amountUsd * 1.5, Number(plan.daily_cap_usd));
      boosted = true;
    }
  }
  let amount = parseUnits(amountUsd.toFixed(6), 6);
  const period = (await publicClient.readContract({ address: SPEND_PERMISSION_MANAGER, abi: SPM_ABI, functionName: "getCurrentPeriod", args: [p] })) as {
    start: number;
    end: number;
    spend: bigint;
  };
  const remaining = p.allowance - period.spend;
  if (remaining <= 0n) {
    await db.updatePlan(plan.id, { next_run: new Date((Number(period.end) + 1) * 1000).toISOString() });
    return { plan: plan.id, decision: "skipped", note: "period cap reached" };
  }
  if (amount > remaining) amount = remaining;

  const bal = (await publicClient.readContract({ address: USDC[CHAIN.id], abi: ERC20_ABI, functionName: "balanceOf", args: [p.account] })) as bigint;
  if (bal < amount) {
    await db.updatePlan(plan.id, { next_run: slotAfter(now, plan.frequency), attempts: 0 });
    const have = Number(formatUnits(bal, 6)).toFixed(2);
    const need = Number(formatUnits(amount, 6)).toFixed(2);
    await log({ ticker, decision: "rejected", reason_ar: `رصيد USDC (${have}) أقل من المبلغ (${need}). هنحاول في الميعاد الجاي.`, reason_en: `USDC balance (${have}) is below the amount (${need}). We'll try at the next slot.` });
    return { plan: plan.id, decision: "rejected", note: "insufficient balance" };
  }

  // Route. Testnet: the mock router at a fixed price; guard values are logged but the price check can't be
  // meaningful against a fixed mock price, so it is recorded, not enforced.
  const router = SEPOLIA_MOCK.router;
  const stock = SEPOLIA_MOCK.stock;
  const expectedOut = (await publicClient.readContract({ address: router, abi: MOCK_ROUTER_ABI, functionName: "quote", args: [amount] })) as bigint;
  const dexPx = Number(formatUnits(amount, 6)) / Number(formatUnits(expectedOut, 8));
  const gap = dexPx / ref - 1;
  const enforceGuard = !CHAIN.testnet;
  if (enforceGuard && gap > MAX_GAP) {
    const attempts = plan.attempts + 1;
    const giveUp = attempts >= MAX_DEFERRALS;
    await db.updatePlan(plan.id, { attempts: giveUp ? 0 : attempts, next_run: giveUp ? slotAfter(now, plan.frequency) : new Date(now + HOUR).toISOString() });
    const g = (gap * 100).toFixed(2);
    await log({
      ticker,
      decision: giveUp ? "rejected" : "deferred",
      price: dexPx,
      ref_price: ref,
      gap_pct: gap * 100,
      reason_ar: giveUp ? `السعر فضل أعلى من العادل بـ ${g}% 6 مرات. اتلغى شراء الميعاد ده.` : `السعر أعلى من العادل بـ ${g}%. هنحاول تاني بعد ساعة.`,
      reason_en: giveUp ? `Price stayed ${g}% above fair value 6 times. Skipped this slot.` : `Price is ${g}% above fair value. Retrying in an hour.`,
    });
    return { plan: plan.id, decision: giveUp ? "rejected" : "deferred" };
  }

  const minOut = (expectedOut * 995n) / 1000n;
  const isApproved = await publicClient.readContract({ address: SPEND_PERMISSION_MANAGER, abi: SPM_ABI, functionName: "isApproved", args: [p] });
  const swapData = encodeFunctionData({ abi: MOCK_ROUTER_ABI, functionName: "swapExactIn", args: [amount, p.account] });
  const args = [p, (isApproved ? "0x" : plan.signature) as Hex, amount, stock, minOut, router, swapData, BigInt(Math.floor(now / 1000) + 600)] as const;

  const { request } = await publicClient.simulateContract({ account: wallet.account!, address: EXECUTOR as Hex, abi: EXECUTOR_ABI, functionName: "execute", args });
  const hash = await wallet.writeContract({ ...request, dataSuffix: builderSuffix() });
  const receipt = await publicClient.waitForTransactionReceipt({ hash, timeout: 45_000 });
  if (receipt.status !== "success") throw new Error(`execute reverted ${hash}`);

  let stockOut = expectedOut;
  let usdcIn = amount;
  for (const l of receipt.logs) {
    try {
      const ev = decodeEventLog({ abi: EXECUTOR_ABI, data: l.data, topics: l.topics });
      if (ev.eventName === "Executed") {
        stockOut = ev.args.stockOut;
        usdcIn = ev.args.usdcIn;
      }
    } catch {
      /* other contracts' logs */
    }
  }

  const shares = Number(formatUnits(stockOut, 8));
  const usd = Number(formatUnits(usdcIn, 6));
  await db.updatePlan(plan.id, { runs: plan.runs + 1, attempts: 0, next_run: slotAfter(now, plan.frequency) });
  const name = { ar: stockMeta.nameAr, en: stockMeta.nameEn };
  const g = (gap * 100).toFixed(2);
  await log({
    ticker,
    decision: "executed",
    usdc_in: usd,
    stock_out: shares,
    price: dexPx,
    ref_price: ref,
    gap_pct: gap * 100,
    tx_hash: hash,
    reason_ar:
      `اشترينا ${shares.toFixed(6)} سهم ${name.ar} بـ $${usd.toFixed(2)}${boosted ? " (اشترينا أكتر لأن السعر نازل 10% عن أعلى سعر في 30 يوم)" : ""}.` +
      (CHAIN.testnet ? ` نسخة تجريبية: سهم وهمي بسعر ثابت $${dexPx.toFixed(2)}، والسعر الحقيقي $${ref.toFixed(2)} (فرق ${g}%).` : ` السعر في حدود العادل (فرق ${g}%).`),
    reason_en:
      `Bought ${shares.toFixed(6)} ${ticker} for $${usd.toFixed(2)}${boosted ? " (boosted: price is 10%+ below its 30-day high)" : ""}.` +
      (CHAIN.testnet ? ` Test version: mock stock at a fixed $${dexPx.toFixed(2)}; real price $${ref.toFixed(2)} (gap ${g}%).` : ` Price within fair range (gap ${g}%).`),
  });
  return { plan: plan.id, decision: "executed", tx: hash };
}
