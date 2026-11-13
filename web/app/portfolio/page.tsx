import type { Metadata } from "next";
import PortfolioView from "@/components/PortfolioView";
import { getDict } from "@/lib/lang.server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getDict();
  return { title: t.portfolio.title };
}

export default async function Portfolio() {
  const { t } = await getDict();
  return (
    <div className="wrap page">
      <h1 className="h1 hero-in">{t.portfolio.title}</h1>
      <PortfolioView />
    </div>
  );
}
