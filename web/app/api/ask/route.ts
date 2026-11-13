import { NextResponse, type NextRequest } from "next/server";
import { fetchQuotes } from "@/lib/prices";
import { HALAL_AS_OF, STOCKS } from "@/lib/stocks";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * "Ask Sahm": research + education assistant on Meta Model API (api.meta.ai/v1, OpenAI-compatible chat completions).
 * It explains; it never places or recommends trades.
 * Env: MODEL_API_KEY (required); optional META_MODEL (default muse-spark-1.3-contributor), META_BASE_URL.
 */
const BASE = (process.env.META_BASE_URL || "https://api.meta.ai/v1").replace(/\/$/, "");
const MODEL = process.env.META_MODEL || "muse-spark-1.3-contributor";
const apiKey = () => process.env.MODEL_API_KEY || process.env.META_API_KEY || "";

type Msg = { role: "user" | "assistant"; content: string };

// Simple per-instance rate limit: 20 questions / 10 min per IP.
const hits = new Map<string, number[]>();
function limited(ip: string) {
  const now = Date.now();
  const arr = (hits.get(ip) || []).filter((t) => now - t < 600_000);
  arr.push(now);
  hits.set(ip, arr);
  return arr.length > 20;
}

export async function POST(req: NextRequest) {
  const key = apiKey();
  const model = MODEL;
  if (!key) return NextResponse.json({ ok: false, error: "not_configured" }, { status: 503 });

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "anon";
  if (limited(ip)) return NextResponse.json({ ok: false, error: "rate_limited" }, { status: 429 });

  const { messages, lang } = (await req.json().catch(() => ({}))) as { messages?: Msg[]; lang?: string };
  const history = (messages || [])
    .filter((m) => (m.role === "user" || m.role === "assistant") && typeof m.content === "string")
    .slice(-8)
    .map((m) => ({ role: m.role, content: m.content.slice(0, 2000) }));
  if (!history.length || history[history.length - 1].role !== "user") {
    return NextResponse.json({ ok: false, error: "bad_request" }, { status: 400 });
  }

  let prices = "";
  try {
    const q = await fetchQuotes();
    prices = STOCKS.filter((s) => q[s.ticker])
      .map((s) => `${s.ticker} ${q[s.ticker].px.toFixed(2)} USD (${q[s.ticker].chg >= 0 ? "+" : ""}${q[s.ticker].chg.toFixed(2)}% today)`)
      .join("; ");
  } catch {
    /* answer without live prices */
  }
  const screen = STOCKS.map(
    (s) => `${s.ticker} (${s.nameEn} / ${s.nameAr}): ${s.verdict}; debt ${s.debtPct ?? "n/a"}%, cash ${s.cashPct ?? "n/a"}%, interest/revenue ${s.intPct ?? "n/a"}%${s.noteEn ? `; ${s.noteEn}` : ""}`,
  ).join("\n");

  const system = [
    "You are Sahm's research assistant. Sahm is an app that buys Coinbase tokenized US stocks on Base on a schedule (dollar-cost averaging) for users outside the US, with an indicative halal screen.",
    `Answer in ${lang === "en" ? "English" : "simple Arabic (Gulf/Egyptian-friendly Modern Standard Arabic)"}. Be clear, short (under 180 words), and structured with short lines.`,
    "You educate and explain: what a company does, how it makes money, risks, what the halal ratios mean, how DCA works, how Sahm works.",
    "Never tell the user to buy or sell a specific stock, never predict prices, never promise returns. If asked for a recommendation, explain the factors to consider instead and remind them it isn't financial advice.",
    "The halal screen is indicative, not a fatwa: say so whenever you discuss compliance.",
    "Sahm's agent decides trades by fixed rules (schedule, fair-price guard vs. a reference price, optional dip boost). You do not make trading decisions.",
    `Halal screen (AAOIFI ratios from SEC filings, ${HALAL_AS_OF}; ok=compliant, edge=borderline, no=not compliant, na=not rated):\n${screen}`,
    prices ? `Live reference prices (Hyperliquid): ${prices}` : "",
  ]
    .filter(Boolean)
    .join("\n\n");

  try {
    const r = await fetch(`${BASE}/chat/completions`, {
      method: "POST",
      headers: { authorization: `Bearer ${key}`, "content-type": "application/json" },
      body: JSON.stringify({ model, messages: [{ role: "system", content: system }, ...history], temperature: 0.3, max_tokens: 600 }),
      signal: AbortSignal.timeout(45_000),
    });
    if (!r.ok) {
      const detail = (await r.text()).slice(0, 200);
      console.error("meta model api error", r.status, detail);
      return NextResponse.json({ ok: false, error: `upstream_${r.status}` }, { status: 502 });
    }
    const j = await r.json();
    const answer: string =
      j?.choices?.[0]?.message?.content ??
      "";
    if (!answer) return NextResponse.json({ ok: false, error: "empty" }, { status: 502 });
    return NextResponse.json({ ok: true, answer });
  } catch {
    return NextResponse.json({ ok: false, error: "timeout" }, { status: 504 });
  }
}

export async function GET() {
  return NextResponse.json({ enabled: !!apiKey(), model: MODEL });
}
