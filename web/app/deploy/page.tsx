import type { Metadata } from "next";
import AgentSetup from "./AgentSetup";
import DeployFlow from "./DeployFlow";

export const metadata: Metadata = { title: "Admin", robots: { index: false, follow: false } };

export default function Deploy() {
  return (
    <div className="wrap narrow page">
      <h1 className="h1">إعداد سهم</h1>
      <p className="lead mt16">صفحة لصاحب المشروع بس. كل معاملة بتتم من محفظتك، ومفتاحك عمره ما بيخرج منها.</p>
      <DeployFlow />
      <AgentSetup />
    </div>
  );
}
