import type { Metadata } from "next";
import Link from "next/link";
import Reveal from "@/components/Reveal";
import WalletFunding from "@/components/WalletFunding";
import { CHAIN } from "@/lib/chain";
import { getDict } from "@/lib/lang.server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getDict();
  return { title: t.nav.start };
}

export default async function Start() {
  const { t } = await getDict();
  const sources: [string, string[]][] = [
    ["Binance", t.start.steps.binance],
    ["Coinbase", t.start.steps.coinbase],
    [t.start.other, t.start.steps.other],
  ];
  return (
    <div className="wrap page">
      <div className="hero-in" style={{ maxWidth: 720 }}>
        <h1 className="h1">{t.start.title}</h1>
        <p className="lead mt16">{t.start.sub}</p>
        <p className="note mt24">⚠️ {t.start.warn}</p>
        {CHAIN.testnet && <p className="note mt8">{t.start.testnetFaucet}</p>}
      </div>

      <div className="grid-3 mt40">
        {sources.map(([name, steps], i) => (
          <Reveal key={name} className="card" delay={i * 80}>
            <h3>{name}</h3>
            <ol className="muted small mt16" style={{ paddingInlineStart: 18, margin: "16px 0 0", lineHeight: 1.9 }}>
              {steps.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ol>
          </Reveal>
        ))}
      </div>

      <Reveal className="card mt24" delay={100}>
        <h2 className="h2" style={{ fontSize: 26 }}>{t.start.yourAddr}</h2>
        <div className="mt16">
          <WalletFunding />
        </div>
        <p className="mt24">
          <Link href="/plan" className="link">
            {t.start.next} <span className="arrow">→</span>
          </Link>
        </p>
      </Reveal>
    </div>
  );
}
