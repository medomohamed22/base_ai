import type { Metadata } from "next";
import AskChat from "@/components/AskChat";
import { getDict } from "@/lib/lang.server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getDict();
  return { title: t.ask.title };
}

export default async function Ask() {
  const { t } = await getDict();
  return (
    <div className="wrap narrow page">
      <div className="hero-in">
        <h1 className="h1">{t.ask.title}</h1>
        <p className="lead mt16">{t.ask.sub}</p>
      </div>
      <AskChat />
    </div>
  );
}
