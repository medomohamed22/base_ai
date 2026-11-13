"use client";

import { useSearchParams } from "next/navigation";
import { useState } from "react";
import SignPermission from "@/components/SignPermission";
import { useT } from "@/components/LangProvider";
import { HALAL_BASKET, STOCKS } from "@/lib/stocks";
import { CHAIN } from "@/lib/chain";

const AMOUNTS = [1, 5, 10, 20];
const PER_MONTH = { daily: 30, weekly: 4 } as const;

export default function PlanForm() {
  const { t, lang } = useT();
  const params = useSearchParams();
  const initial = params.get("stock");
  const options = STOCKS.filter((s) => s.verdict === "ok");
  const [target, setTarget] = useState<string>(initial && options.some((s) => s.ticker === initial) ? initial : "HALAL");
  const [amount, setAmount] = useState(5);
  const [freq, setFreq] = useState<"daily" | "weekly">("weekly");
  const [dip, setDip] = useState(false);
  const [eligible, setEligible] = useState(false);

  const dailyCap = dip ? amount * 1.5 : amount;
  const name = (tk: string) => {
    const s = STOCKS.find((x) => x.ticker === tk);
    return s ? (lang === "ar" ? s.nameAr : s.nameEn) : tk;
  };
  const what = target === "HALAL" ? t.plan.basket : name(target);

  return (
    <div className="card mt40" style={{ padding: "clamp(20px, 4vw, 36px)" }}>
      <div className="field">
        <label htmlFor="target">{t.plan.what}</label>
        <select id="target" value={target} onChange={(e) => setTarget(e.target.value)}>
          <option value="HALAL">
            {t.plan.basket} · {HALAL_BASKET.join(" · ")}
          </option>
          {options.map((s) => (
            <option key={s.ticker} value={s.ticker}>
              {name(s.ticker)} · {s.ticker}
            </option>
          ))}
        </select>
      </div>

      <div className="field">
        <span className="label">{t.plan.amount}</span>
        <div className="choices">
          {AMOUNTS.map((a) => (
            <button key={a} type="button" className="choice num" aria-pressed={amount === a} onClick={() => setAmount(a)}>
              ${a}
            </button>
          ))}
        </div>
      </div>

      <div className="field">
        <span className="label">{t.plan.freq}</span>
        <div className="choices">
          {(["daily", "weekly"] as const).map((f) => (
            <button key={f} type="button" className="choice" aria-pressed={freq === f} onClick={() => setFreq(f)}>
              {t.plan[f]}
            </button>
          ))}
        </div>
      </div>

      <div className="field">
        <label className="check">
          <input type="checkbox" checked={dip} onChange={(e) => setDip(e.target.checked)} />
          <span>
            <b>{t.plan.dip}</b>
            <span className="small muted" style={{ display: "block" }}>{t.plan.dipD}</span>
          </span>
        </label>
      </div>

      <div className="summary">
        <b>{t.plan.review}</b>
        <p className="mt8">{t.plan.reviewTxt(what, amount, freq === "daily" ? t.plan.everyDay : t.plan.everyWeek, amount * PER_MONTH[freq], dailyCap)}</p>
      </div>

      {CHAIN.testnet && <p className="note mt16">{t.plan.testnetNote}</p>}

      <label className="check mt24">
        <input type="checkbox" checked={eligible} onChange={(e) => setEligible(e.target.checked)} />
        <span className="small">{t.plan.eligible}</span>
      </label>

      <SignPermission plan={{ target, amountUsd: amount, frequency: freq, dipBoost: dip, dailyCapUsd: dailyCap }} disabled={!eligible} />
    </div>
  );
}
