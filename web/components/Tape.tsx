"use client";

import type { Quotes } from "@/lib/prices";
import { STOCKS } from "@/lib/stocks";
import { fmtPct, fmtUsd, useQuotes } from "./useQuotes";

export default function Tape({ initial, label }: { initial: Quotes; label: string }) {
  const { data } = useQuotes(initial);
  const q = data ?? initial;
  const items = STOCKS.filter((s) => q[s.ticker]);
  if (!items.length) return null;
  const row = items.map((s) => (
    <span className="tape-item" key={s.ticker}>
      <b>{s.ticker}</b>
      <span className="num">{fmtUsd(q[s.ticker].px)}</span>
      <span className={`num ${q[s.ticker].chg >= 0 ? "up" : "down"}`}>{fmtPct(q[s.ticker].chg)}</span>
    </span>
  ));
  return (
    <div className="tape" aria-label={label}>
      <div className="tape-track">
        {row}
        <span aria-hidden style={{ display: "contents" }}>{row}</span>
      </div>
    </div>
  );
}
