"use client";

import { useQuery } from "@tanstack/react-query";
import type { Quotes } from "@/lib/prices";

export function useQuotes(initial?: Quotes) {
  return useQuery({
    queryKey: ["quotes"],
    queryFn: async (): Promise<Quotes> => (await (await fetch("/api/prices")).json()).quotes ?? {},
    initialData: initial && Object.keys(initial).length ? initial : undefined,
    refetchInterval: 30_000,
    staleTime: 20_000,
  });
}

export const fmtUsd = (n: number) =>
  n.toLocaleString("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2, maximumFractionDigits: 2 });
export const fmtPct = (n: number) => `${n >= 0 ? "+" : ""}${n.toFixed(2)}%`;
