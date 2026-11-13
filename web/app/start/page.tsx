import type { Metadata } from "next";
import Link from "next/link";
import WalletFunding from "@/components/WalletFunding";

export const metadata: Metadata = { title: "إزاي أبدأ | سهم" };

const SOURCES = [
  {
    name: "Binance",
    steps: ["من المحفظة اختار USDC ثم سحب (Withdraw).", "الصق عنوان محفظتك في سهم.", "الشبكة: Base.", "أكّد السحب."],
  },
  {
    name: "Coinbase",
    steps: ["اختار USDC ثم إرسال (Send).", "الصق عنوان محفظتك في سهم.", "الشبكة: Base (غالبًا من غير رسوم).", "أكّد الإرسال."],
  },
  {
    name: "محفظة تانية",
    steps: ["افتح محفظتك (MetaMask أو غيرها).", "حوّل لشبكة Base.", "ابعت USDC لعنوان محفظتك في سهم."],
  },
];

export default function Start() {
  return (
    <>
      <h1>إزاي أحط USDC في محفظتي؟</h1>
      <p className="muted">سهم بيشتري بـ USDC (دولار رقمي) على شبكة Base. لو عندك USDC في منصة، حوّله لمحفظتك في 3 خطوات.</p>
      <p className="note">
        ⚠️ اختار شبكة <strong>Base</strong> بس. لو اخترت شبكة تانية الفلوس ممكن تضيع.
      </p>

      <div className="grid section">
        {SOURCES.map((s) => (
          <div className="card" key={s.name}>
            <h3>{s.name}</h3>
            <ol className="muted small">
              {s.steps.map((x) => (
                <li key={x}>{x}</li>
              ))}
            </ol>
          </div>
        ))}
      </div>

      <div className="section card">
        <h2>عنوان محفظتك</h2>
        <WalletFunding />
        <p style={{ marginTop: 16 }}>
          <Link href="/plan">كمّل للخطة ←</Link>
        </p>
      </div>
    </>
  );
}
