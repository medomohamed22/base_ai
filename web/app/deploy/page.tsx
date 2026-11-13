import type { Metadata } from "next";
import DeployFlow from "./DeployFlow";

export const metadata: Metadata = { title: "نشر العقد | سهم", robots: { index: false, follow: false } };

export default function Deploy() {
  return (
    <>
      <h1>نشر عقد سهم على Base Sepolia</h1>
      <p className="muted">صفحة لصاحب المشروع بس. النشر بيتم من محفظتك، ومفتاحك عمره ما بيخرج منها.</p>
      <DeployFlow />
    </>
  );
}
