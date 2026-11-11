// Logs the price gap between Aerodrome (Base) tokenized stocks and Hyperliquid xyz stock perps.
// Usage: node scripts/gap-logger.mjs [out.csv]   (Node 18+, no dependencies)
import { appendFileSync, existsSync } from "node:fs";

const OUT = process.argv[2] ?? "data/gaps.csv";
// symbol -> Base B20 contract (from api.coinbase.com/v1/tokenized-stocks)
const STOCKS_API = "https://api.coinbase.com/v1/tokenized-stocks?page_size=500";
const TICKERS = ["NVDA", "GOOGL", "META", "AAPL", "MSFT", "AMD", "PLTR", "SNDK", "ORCL", "TSLA", "AMZN"];

const j = async (url, opts) => {
  const r = await fetch(url, { ...opts, headers: { "user-agent": "gap-logger", "content-type": "application/json", ...(opts?.headers ?? {}) } });
  if (!r.ok) throw new Error(`${url} -> ${r.status}`);
  return r.json();
};

// Regular US session: Mon-Fri 09:30-16:00 America/New_York (holidays ignored).
function usSession(d) {
  const ny = new Date(d.toLocaleString("en-US", { timeZone: "America/New_York" }));
  const day = ny.getDay(), mins = ny.getHours() * 60 + ny.getMinutes();
  if (day === 0 || day === 6) return "weekend";
  if (mins >= 570 && mins < 960) return "open";
  return "overnight";
}

const now = new Date();
const { tokens } = await j(STOCKS_API);
const addr = Object.fromEntries(tokens.filter(t => TICKERS.includes(t.symbol.replace(/c$/, ""))).map(t => [t.symbol.replace(/c$/, ""), t.contract_address.toLowerCase()]));
const pairs = await j(`https://api.dexscreener.com/tokens/v1/base/${Object.values(addr).join(",")}`);
const mids = await j("https://api.hyperliquid.xyz/info", { method: "POST", body: JSON.stringify({ type: "allMids", dex: "xyz" }) });

const rows = [];
for (const [tk, a] of Object.entries(addr)) {
  const best = pairs
    .filter(p => p.baseToken.address.toLowerCase() === a && p.quoteToken.symbol === "USDC")
    .sort((x, y) => (y.liquidity?.usd ?? 0) - (x.liquidity?.usd ?? 0))[0];
  const perp = Number(mids[`xyz:${tk}`]);
  if (!best || !perp) continue;
  const dex = Number(best.priceUsd);
  rows.push([now.toISOString(), usSession(now), tk, dex, perp, ((dex / perp - 1) * 100).toFixed(3), Math.round(best.liquidity?.usd ?? 0)].join(","));
}
if (!existsSync(OUT)) appendFileSync(OUT, "ts,session,ticker,dex_price,perp_price,gap_pct,dex_liq_usd\n");
appendFileSync(OUT, rows.join("\n") + "\n");
console.log(rows.join("\n"));
