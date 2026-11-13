import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "محفظتي | سهم" };

export default function Portfolio() {
  return (
    <>
      <h1>محفظتي</h1>
      <div className="card section">
        <p className="muted">ادخل بمحفظة Base علشان تشوف أسهمك، وخطتك، وسجل كل عملية بسببها ورابطها على Basescan.</p>
        <p className="small muted">
          مثال من السجل: &quot;اتأجّل شراء النهارده: السعر كان أعلى من العادل بـ 0.4%. هنحاول تاني بعد ساعة.&quot;
        </p>
        <div className="row" style={{ marginTop: 12 }}>
          <button className="btn" disabled>ادخل بمحفظة Base (قريبًا)</button>
          <Link href="/plan" className="btn ghost">اعمل خطة</Link>
        </div>
      </div>
    </>
  );
}
