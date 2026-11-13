import Link from "next/link";
import Reveal from "@/components/Reveal";
import Tape from "@/components/Tape";
import { getDict } from "@/lib/lang.server";
import { fetchQuotes, type Quotes } from "@/lib/prices";

const Icon = ({ d }: { d: string }) => (
  <span className="feature-ic" aria-hidden>
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d={d} />
    </svg>
  </span>
);

export default async function Home() {
  const { t } = await getDict();
  let quotes: Quotes = {};
  try {
    quotes = await fetchQuotes();
  } catch {
    /* tape hydrates on the client */
  }

  return (
    <>
      <section className="hero wrap">
        <div className="hero-in">
          <p className="eyebrow">{t.home.eyebrow}</p>
          <h1 className="display" style={{ marginTop: 18 }}>
            {t.home.title1}
            <br />
            <span className="dim">{t.home.title2}</span>
          </h1>
          <p className="lead">{t.home.sub}</p>
          <div className="row">
            <Link href="/plan" className="btn btn-lg">
              {t.home.cta}
            </Link>
            <Link href="/stocks" className="btn btn-lg btn-ghost">
              {t.home.cta2}
            </Link>
          </div>
        </div>
      </section>

      <Tape initial={quotes} label={t.home.pricesT} />

      <section className="section wrap">
        <div className="grid-3">
          <Reveal className="card tile">
            <Icon d="M3 7h18v12H3zM3 7l3-4h12l3 4M16 13h2" />
            <h3>{t.home.f1t}</h3>
            <p className="muted">{t.home.f1d}</p>
          </Reveal>
          <Reveal className="card tile" delay={80}>
            <Icon d="M12 3v18M5 8l7-5 7 5M5 8l-2 6h4zM19 8l-2 6h4z" />
            <h3>{t.home.f2t}</h3>
            <p className="muted">{t.home.f2d}</p>
          </Reveal>
          <Reveal className="card tile" delay={160}>
            <Icon d="M20 6 9 17l-5-5" />
            <h3>{t.home.f3t}</h3>
            <p className="muted">{t.home.f3d}</p>
          </Reveal>
        </div>
      </section>

      <section className="section wrap" style={{ paddingTop: 0 }}>
        <Reveal className="section-head">
          <h2 className="h2">{t.home.howT}</h2>
        </Reveal>
        <ol className="steps">
          {t.home.how.map(([h, p], i) => (
            <Reveal as="li" key={h} delay={i * 90}>
              <h3>{h}</h3>
              <p>{p}</p>
            </Reveal>
          ))}
        </ol>
      </section>

      <section className="section wrap" style={{ paddingTop: 0 }}>
        <Reveal className="invert">
          <h2 className="h2">{t.home.aiT}</h2>
          <p className="lead mt16">{t.home.aiD}</p>
          <div className="mt24">
            <Link href="/ask" className="btn btn-lg">
              {t.home.aiCta}
            </Link>
          </div>
        </Reveal>
      </section>
    </>
  );
}
