// Logs Aerodrome (Base) tokenized-stock price vs Hyperliquid xyz perp price into public.sahm_gap_log.
// Called by pg_cron every 5 minutes. Public endpoint, but it ignores calls < 4 min apart,
// so extra calls can't spam the table.
import { createClient } from "jsr:@supabase/supabase-js@2";

const TICKERS = ["NVDA", "GOOGL", "META", "AAPL", "MSFT", "AMD", "PLTR", "SNDK", "ORCL", "TSLA", "AMZN", "SPCX", "AVGO", "CRCL"];
const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

const j = async (url: string, opts: RequestInit = {}) => {
  const r = await fetch(url, { ...opts, headers: { "content-type": "application/json", ...(opts.headers ?? {}) } });
  if (!r.ok) throw new Error(`${url} -> ${r.status}`);
  return r.json();
};

function usSession(d: Date) {
  const ny = new Date(d.toLocaleString("en-US", { timeZone: "America/New_York" }));
  const day = ny.getDay(), mins = ny.getHours() * 60 + ny.getMinutes();
  if (day === 0 || day === 6) return "weekend";
  if (mins >= 570 && mins < 960) return "open";
  return "overnight";
}

Deno.serve(async () => {
  try {
    const { data: last } = await db.from("sahm_gap_log").select("ts").order("ts", { ascending: false }).limit(1);
    if (last?.[0] && Date.now() - new Date(last[0].ts).getTime() < 4 * 60_000) {
      return Response.json({ skipped: "too soon" });
    }
    const now = new Date();
    const { tokens } = await j("https://api.coinbase.com/v1/tokenized-stocks?page_size=500");
    const addr: Record<string, string> = Object.fromEntries(
      tokens.filter((t: any) => TICKERS.includes(t.symbol.replace(/c$/, "")))
        .map((t: any) => [t.symbol.replace(/c$/, ""), t.contract_address.toLowerCase()]),
    );
    const [pairs, mids] = await Promise.all([
      j(`https://api.dexscreener.com/tokens/v1/base/${Object.values(addr).join(",")}`),
      j("https://api.hyperliquid.xyz/info", { method: "POST", body: JSON.stringify({ type: "allMids", dex: "xyz" }) }),
    ]);
    const rows = [];
    for (const [tk, a] of Object.entries(addr)) {
      const best = pairs
        .filter((p: any) => p.baseToken.address.toLowerCase() === a && p.quoteToken.symbol === "USDC")
        .sort((x: any, y: any) => (y.liquidity?.usd ?? 0) - (x.liquidity?.usd ?? 0))[0];
      const perp = Number(mids[`xyz:${tk}`]);
      if (!best || !perp) continue;
      const dex = Number(best.priceUsd);
      rows.push({
        ts: now.toISOString(), session: usSession(now), ticker: tk, dex_price: dex, perp_price: perp,
        gap_pct: Number(((dex / perp - 1) * 100).toFixed(3)), dex_liq_usd: Math.round(best.liquidity?.usd ?? 0),
      });
    }
    const { error } = await db.from("sahm_gap_log").insert(rows);
    if (error) throw error;
    return Response.json({ inserted: rows.length });
  } catch (e) {
    return Response.json({ error: String(e) }, { status: 500 });
  }
});
