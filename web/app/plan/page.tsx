import type { Metadata } from "next";
import { Suspense } from "react";
import { getDict } from "@/lib/lang.server";
import PlanForm from "./PlanForm";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getDict();
  return { title: t.plan.title };
}

export default async function Plan() {
  const { t } = await getDict();
  return (
    <div className="wrap narrow page">
      <div className="hero-in">
        <h1 className="h1">{t.plan.title}</h1>
        <p className="lead mt16">{t.plan.sub}</p>
      </div>
      <Suspense>
        <PlanForm />
      </Suspense>
    </div>
  );
}
