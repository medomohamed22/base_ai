import Link from "next/link";
import { HALAL_BASKET, STOCKS } from "@/lib/stocks";

export default function Home() {
  const okCount = STOCKS.filter((s) => s.verdict === "ok").length;
  return (
    <>
      <section className="hero">
        <h1>استثمر في أسهم أمريكية حلال، بالعربي، من دولار واحد.</h1>
        <p className="sub">فلوسك في محفظتك. سهم بيشتريلك بانتظام وبالسعر العادل، وتقدر توقّفه في أي وقت.</p>
        <div className="row" style={{ marginTop: 20 }}>
          <Link href="/plan" className="btn">
            ابدأ بـ 5 دولار
          </Link>
          <Link href="/stocks" className="btn ghost">
            شوف الأسهم
          </Link>
        </div>
      </section>

      <section className="section grid">
        <div className="card">
          <h3>فلوسك في محفظتك</h3>
          <p className="muted">
            مفيش إيداع عندنا. بتدّي إذن صرف بسقف يومي ومدة (Spend Permission)، والسهم بيوصل محفظتك على Base مباشرة.
          </p>
        </div>
        <div className="card">
          <h3>بالسعر العادل بس</h3>
          <p className="muted">
            قبل كل شراء بنقارن السعر بالسوق. لو أغلى من العادل بأكتر من 0.3% أو السيولة ضعيفة، بنأجّل ساعة.
          </p>
        </div>
        <div className="card">
          <h3>فلتر حلال استرشادي</h3>
          <p className="muted">
            {okCount} سهم متوافق مبدئيًا حسب معايير AAOIFI من بيانات SEC. السلة الجاهزة: <span className="ltr">{HALAL_BASKET.join(" · ")}</span>.
          </p>
        </div>
      </section>

      <section className="section card">
        <h2>إزاي بيشتغل؟</h2>
        <ol className="muted">
          <li>ادخل بمحفظة Base (passkey، من غير كلمة سر ولا seed).</li>
          <li>اختار سهم أو السلة الحلال، والمبلغ ($1–$20)، والتكرار.</li>
          <li>وقّع إذن الصرف مرة واحدة. سقفه على السلسلة ومحدش يقدر يعدّيه.</li>
          <li>سهم بيشتري في ميعاده، ويكتبلك سبب كل قرار بالعربي.</li>
        </ol>
        <p className="small muted">سهم مش بيتنبأ بالسوق، والذكاء الاصطناعي عمره ما بيقرر صفقة. القرار بقواعد واضحة.</p>
      </section>
    </>
  );
}
