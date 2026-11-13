import type { Metadata } from "next";

export const metadata: Metadata = { title: "الأرقام | سهم" };

const STATS = [
  { label: "محافظ", en: "Wallets" },
  { label: "معاملات", en: "Transactions" },
  { label: "الحجم (USDC)", en: "Volume" },
  { label: "مستخدمين متكررين", en: "Repeat users" },
];

export default function Stats() {
  return (
    <>
      <h1>الأرقام</h1>
      <p className="muted">أرقام سهم على Base mainnet، علنية ومن السلسلة مباشرة. Public onchain stats.</p>
      <div className="grid section">
        {STATS.map((s) => (
          <div className="card" key={s.en}>
            <div className="muted small">
              {s.label} <span className="ltr">· {s.en}</span>
            </div>
            <div className="stat num">—</div>
          </div>
        ))}
      </div>
      <p className="small muted section">الأرقام هتبدأ تظهر بعد الإطلاق على mainnet.</p>
    </>
  );
}
