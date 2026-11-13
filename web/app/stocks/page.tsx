import type { Metadata } from "next";
import StocksGrid from "@/components/StocksGrid";
import { getDict } from "@/lib/lang.server";
import { fetchQuotes, type Quotes } from "@/lib/prices";
import { HALAL_AS_OF } from "@/lib/stocks";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getDict();
  return { title: t.stocks.title };
}

export default async function Stocks() {
  const { t } = await getDict();
  let quotes: Quotes = {};
  try {
    quotes = await fetchQuotes();
  } catch {
    /* client refetches */
  }
  return (
    <div className="wrap page">
      <div className="hero-in">
        <h1 className="h1">{t.stocks.title}</h1>
        <p className="lead mt16">{t.stocks.sub}</p>
        <p className="small muted mt8">
          {t.stocks.disclaimer} <span className="num">· SEC {HALAL_AS_OF}</span>
        </p>
      </div>
      <StocksGrid initial={quotes} />
    </div>
  );
}
