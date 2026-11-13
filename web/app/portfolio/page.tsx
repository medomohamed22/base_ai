import type { Metadata } from "next";
import PortfolioView from "@/components/PortfolioView";

export const metadata: Metadata = { title: "محفظتي | سهم" };

export default function Portfolio() {
  return (
    <>
      <h1>محفظتي</h1>
      <PortfolioView />
    </>
  );
}
