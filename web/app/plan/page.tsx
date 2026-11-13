import type { Metadata } from "next";
import { Suspense } from "react";
import PlanForm from "./PlanForm";

export const metadata: Metadata = { title: "خطتي | سهم" };

export default function Plan() {
  return (
    <>
      <h1>اعمل خطتك</h1>
      <p className="muted">سهم مش بيتنبأ بالسوق. بيشتريلك بانتظام وبالسعر العادل.</p>
      <Suspense>
        <PlanForm />
      </Suspense>
    </>
  );
}
