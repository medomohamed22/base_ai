"use client";

import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { HALAL_BASKET, STOCKS } from "@/lib/stocks";

const AMOUNTS = [1, 5, 10, 20];
const FREQ = [
  { id: "daily", label: "يومي", perMonth: 30 },
  { id: "weekly", label: "أسبوعي", perMonth: 4 },
] as const;

export default function PlanForm() {
  const params = useSearchParams();
  const initial = params.get("stock");
  const options = STOCKS.filter((s) => s.verdict === "ok");
  const [target, setTarget] = useState<string>(
    initial && options.some((s) => s.ticker === initial) ? initial : "HALAL",
  );
  const [amount, setAmount] = useState(5);
  const [freq, setFreq] = useState<(typeof FREQ)[number]["id"]>("weekly");
  const [dip, setDip] = useState(false);

  // On-chain daily cap: the plan amount, or ×1.5 when the dip boost is on.
  const dailyCap = dip ? amount * 1.5 : amount;
  const f = FREQ.find((x) => x.id === freq)!;
  const monthly = amount * f.perMonth;
  const label = target === "HALAL" ? "السلة الحلال" : target;

  return (
    <div className="card section" style={{ maxWidth: 560 }}>
      <div className="field">
        <label htmlFor="target">تشتري إيه؟</label>
        <select id="target" value={target} onChange={(e) => setTarget(e.target.value)}>
          <option value="HALAL">السلة الحلال ({HALAL_BASKET.join(" · ")})</option>
          {options.map((s) => (
            <option key={s.ticker} value={s.ticker}>
              {s.nameAr} ({s.ticker})
            </option>
          ))}
        </select>
      </div>

      <div className="field">
        <span>المبلغ كل مرة</span>
        <div className="choices">
          {AMOUNTS.map((a) => (
            <button key={a} type="button" className="choice" aria-pressed={amount === a} onClick={() => setAmount(a)}>
              <span className="num">${a}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="field">
        <span>كل قد إيه؟</span>
        <div className="choices">
          {FREQ.map((x) => (
            <button key={x.id} type="button" className="choice" aria-pressed={freq === x.id} onClick={() => setFreq(x.id)}>
              {x.label}
            </button>
          ))}
        </div>
      </div>

      <div className="field">
        <label className="row" style={{ gap: 8 }}>
          <input type="checkbox" checked={dip} onChange={(e) => setDip(e.target.checked)} style={{ minHeight: 0 }} />
          اشتري أكتر لما ينزل
        </label>
        <span className="small muted">
          لو السعر أقل من أعلى سعر في 30 يوم بـ 10% أو أكتر، المبلغ يبقى ×1.5، في حدود السقف اللي على السلسلة.
        </span>
      </div>

      <div className="note">
        <strong>مراجعة:</strong> هتشتري {label} بـ <span className="num">${amount}</span> {f.label === "يومي" ? "كل يوم" : "كل أسبوع"}{" "}
        (حوالي <span className="num">${monthly}</span> في الشهر). هتصرف بحد أقصى{" "}
        <span className="num">${dailyCap}</span> في اليوم لمدة 30 يوم. توقفه في أي وقت.
      </div>

      <button className="btn" style={{ marginTop: 16, width: "100%" }} disabled>
        وقّع إذن الصرف (قريبًا)
      </button>
      <p className="small muted" style={{ marginTop: 8 }}>
        التوقيع بمحفظة Base هيتفعّل بعد نشر العقد على Base Sepolia.
      </p>
    </div>
  );
}
