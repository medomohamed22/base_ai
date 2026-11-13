import { STOCKS } from "./stocks";

export type Quote = { px: number; prev: number; chg: number };
export type Quotes = Record<string, Quote>;

/**
 * Fair-value reference: Hyperliquid "xyz" equity perps (trade 24/7). Used for display and by the agent's guard.
 * One POST returns every market; we keep only the tickers we list.
 */
export async function fetchQuotes(): Promise<Quotes> {
  const r = await fetch("https://api.hyperliquid.xyz/info", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ type: "metaAndAssetCtxs", dex: "xyz" }),
    next: { revalidate: 30 },
  });
  if (!r.ok) throw new Error(`hyperliquid ${r.status}`);
  const [meta, ctxs] = (await r.json()) as [
    { universe: { name: string }[] },
    { markPx?: string; oraclePx?: string; prevDayPx?: string }[],
  ];
  const want = new Set(STOCKS.map((s) => s.ticker));
  const out: Quotes = {};
  meta.universe.forEach((u, i) => {
    const tk = u.name.replace(/^xyz:/, "");
    const c = ctxs[i];
    if (!want.has(tk) || !c) return;
    const px = Number(c.markPx ?? c.oraclePx);
    const prev = Number(c.prevDayPx);
    if (!Number.isFinite(px) || px <= 0) return;
    out[tk] = { px, prev, chg: prev > 0 ? ((px - prev) / prev) * 100 : 0 };
  });
  return out;
}
