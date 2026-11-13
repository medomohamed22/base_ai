"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { Quotes } from "@/lib/prices";
import { STOCKS, type Verdict } from "@/lib/stocks";
import { useT } from "./LangProvider";
import { fmtPct, fmtUsd, useQuotes } from "./useQuotes";

type Filter = "all" | Verdict;

const pct = (v: number | null) => (v == null ? "—" : `${v.toFixed(1)}%`);

export default function StocksGrid({ initial }: { initial: Quotes }) {
  const { t, lang } = useT();
  const { data } = useQuotes(initial);
  const q = data ?? initial;
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");

  const list = useMemo(() => {
    const s = query.trim().toLowerCase();
    return STOCKS.filter((x) => filter === "all" || x.verdict === filter).filter(
      (x) => !s || x.ticker.toLowerCase().includes(s) || x.nameEn.toLowerCase().includes(s) || x.nameAr.includes(query.trim()),
    );
  }, [query, filter]);

  const filters: [Filter, string][] = [
    ["all", t.stocks.all],
    ["ok", t.stocks.halal],
    ["edge", t.stocks.edge],
    ["no", t.stocks.no],
  ];

  return (
    <>
      <div className="toolbar">
        <label className="search">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" />
          </svg>
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t.stocks.search} aria-label={t.stocks.search} />
        </label>
        <div className="seg" role="group">
          {filters.map(([k, label]) => (
            <button key={k} type="button" aria-pressed={filter === k} onClick={() => setFilter(k)}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {list.length === 0 && <p className="muted">{t.stocks.empty}</p>}

      <div className="grid">
        {list.map((s, i) => {
          const quote = q[s.ticker];
          return (
            <article key={s.ticker} className="card card-hover stock" style={{ animation: `rise .35s ease-out ${Math.min(i, 8) * 20}ms both` }}>
              <div className="stock-top">
                <div>
                  <div className="tk">{s.ticker}</div>
                  <h3 style={{ marginTop: 4 }}>{lang === "ar" ? s.nameAr : s.nameEn.replace(/,? Inc\.?$| Corporation$| Corp\.?$/, "")}</h3>
                  <p className="small muted" style={{ marginTop: 2 }}>{lang === "ar" ? s.activityAr : s.activityEn}</p>
                </div>
                <span className={`badge ${s.verdict}`}>{t.stocks.verdict[s.verdict]}</span>
              </div>

              <div className="row" style={{ alignItems: "baseline", gap: 10 }}>
                {quote ? (
                  <>
                    <span className="px num">{fmtUsd(quote.px)}</span>
                    <span className={`chg num ${quote.chg >= 0 ? "up" : "down"}`}>{fmtPct(quote.chg)}</span>
                    <span className="tiny muted">{t.stocks.day}</span>
                  </>
                ) : (
                  <span className="skeleton px" />
                )}
              </div>

              {(lang === "ar" ? s.noteAr : s.noteEn) && <p className="small muted">{lang === "ar" ? s.noteAr : s.noteEn}</p>}

              <div className="ratios">
                <div>{t.stocks.debt}<b>{pct(s.debtPct)}</b></div>
                <div>{t.stocks.cash}<b>{pct(s.cashPct)}</b></div>
                <div>{t.stocks.interest}<b>{pct(s.intPct)}</b></div>
              </div>

              {s.verdict === "ok" && (
                <Link className="btn btn-ghost btn-block" href={`/plan?stock=${s.ticker}`}>
                  {t.stocks.buy}
                </Link>
              )}
            </article>
          );
        })}
      </div>
    </>
  );
}
