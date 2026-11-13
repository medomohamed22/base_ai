import type { Metadata } from "next";
import Link from "next/link";
import { HALAL_AS_OF, STOCKS, type Verdict } from "@/lib/stocks";

export const metadata: Metadata = { title: "الأسهم | سهم" };

const LABEL: Record<Verdict, string> = {
  ok: "✅ متوافق مبدئيًا",
  edge: "⚠️ على الحد أو مختلف عليه",
  no: "❌ غير متوافق",
  na: "⚪ غير مصنّف",
};

const pct = (v: number | null) => (v == null ? "—" : `${v.toFixed(2)}%`);

export default function Stocks() {
  return (
    <>
      <h1>الأسهم</h1>
      <p className="muted">
        أسهم Coinbase المرمّزة على Base. فحص الحلال حسب AAOIFI (الديون والنقد أقل من 30% من القيمة السوقية، وإيراد
        الفوايد أقل من 5%)، من بيانات SEC بتاريخ {HALAL_AS_OF}.
      </p>
      <p className="note small">فحص استرشادي، مش فتوى. راجع عالم أو هيئة شرعية تثق فيها.</p>

      <div className="grid section">
        {STOCKS.map((s) => (
          <div className="card" key={s.ticker}>
            <div className="row" style={{ justifyContent: "space-between" }}>
              <h3>{s.nameAr}</h3>
              <span className="num muted">{s.ticker}</span>
            </div>
            <p className="small muted">{s.activityAr}</p>
            <span className={`badge ${s.verdict}`}>{LABEL[s.verdict]}</span>
            {s.noteAr && <p className="small muted" style={{ marginTop: 6 }}>{s.noteAr}</p>}
            <table style={{ marginTop: 8 }}>
              <tbody>
                <tr><td>الديون</td><td className="num">{pct(s.debtPct)}</td></tr>
                <tr><td>النقد</td><td className="num">{pct(s.cashPct)}</td></tr>
                <tr><td>الفوايد/الإيراد</td><td className="num">{pct(s.intPct)}</td></tr>
              </tbody>
            </table>
            {s.verdict === "ok" && (
              <Link className="btn ghost" style={{ marginTop: 12, width: "100%" }} href={`/plan?stock=${s.ticker}`}>
                اشتري بانتظام
              </Link>
            )}
          </div>
        ))}
      </div>
    </>
  );
}
