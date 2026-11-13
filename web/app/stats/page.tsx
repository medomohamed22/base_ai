import type { Metadata } from "next";
import Reveal from "@/components/Reveal";
import { CHAIN, explorer, shortAddr } from "@/lib/chain";
import { db, dbEnabled } from "@/lib/db";
import { getDict } from "@/lib/lang.server";

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getDict();
  return { title: t.stats.title };
}

export default async function Stats() {
  const { t, lang } = await getDict();
  let stats: { wallets: number; active_plans: number; buys: number; volume: number } | null = null;
  let recent: Awaited<ReturnType<typeof db.recent>> = [];
  if (dbEnabled()) {
    try {
      [stats, recent] = await Promise.all([db.stats(CHAIN.id), db.recent(CHAIN.id)]);
    } catch {
      /* show dashes */
    }
  }
  const cards: [string, string][] = [
    [t.stats.wallets, stats ? String(stats.wallets) : "—"],
    [t.stats.plans, stats ? String(stats.active_plans) : "—"],
    [t.stats.txs, stats ? String(stats.buys) : "—"],
    [t.stats.volume, stats ? `$${Number(stats.volume).toFixed(2)}` : "—"],
  ];
  return (
    <div className="wrap page">
      <div className="hero-in">
        <h1 className="h1">{t.stats.title}</h1>
        <p className="lead mt16">
          {t.stats.sub} <span className="num">({CHAIN.name})</span>
        </p>
      </div>
      <div className="grid-4 mt40">
        {cards.map(([label, v], i) => (
          <Reveal key={label} className="card tile" delay={i * 35}>
            <div className="small muted">{label}</div>
            <div className="stat-v num">{v}</div>
          </Reveal>
        ))}
      </div>
      <Reveal className="card mt24">
        <h3>{t.stats.recent}</h3>
        {recent.length === 0 ? (
          <p className="muted mt16">{t.stats.none}</p>
        ) : (
          <div className="table-wrap mt16">
            <table>
              <tbody>
                {recent.map((r, i) => (
                  <tr key={i}>
                    <td className="num">{shortAddr(r.wallet)}</td>
                    <td>
                      <b>{r.ticker}</b>
                    </td>
                    <td className="num">${Number(r.usdc_in).toFixed(2)}</td>
                    <td className="num muted small">{new Date(r.created_at!).toLocaleDateString(lang === "ar" ? "ar-EG" : "en-US")}</td>
                    <td>
                      {r.tx_hash && (
                        <a className="link small" href={`${explorer(CHAIN.id)}/tx/${r.tx_hash}`} target="_blank" rel="noreferrer">
                          tx <span className="arrow">→</span>
                        </a>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Reveal>
    </div>
  );
}
