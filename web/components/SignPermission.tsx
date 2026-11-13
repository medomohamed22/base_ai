"use client";

import { requestSpendPermission } from "@base-org/account/spend-permission/browser";
import type { ProviderInterface } from "@base-org/account";
import Link from "next/link";
import { useState } from "react";
import { parseUnits } from "viem";
import { useAccount, useSwitchChain } from "wagmi";
import ConnectButton from "./ConnectButton";
import { useUsdcBalance } from "./hooks";
import { useT } from "./LangProvider";
import { CHAIN, EXECUTOR, USDC } from "@/lib/chain";

export type PlanDraft = {
  target: string;
  amountUsd: number;
  frequency: "daily" | "weekly";
  dipBoost: boolean;
  dailyCapUsd: number;
};

const PLAN_DAYS = 30;

export default function SignPermission({ plan, disabled }: { plan: PlanDraft; disabled?: boolean }) {
  const { t, lang } = useT();
  const { address, isConnected, connector, chainId } = useAccount();
  const { switchChainAsync } = useSwitchChain();
  const { usd } = useUsdcBalance();
  const [state, setState] = useState<"idle" | "signing" | "done" | "error">("idle");
  const [msg, setMsg] = useState("");

  if (!isConnected || !address) {
    return (
      <div className="mt24">
        <ConnectButton big />
      </div>
    );
  }
  if (!EXECUTOR) {
    return (
      <>
        <button className="btn btn-lg btn-block mt24" disabled>{t.plan.sign}</button>
        <p className="small muted mt8">{t.plan.soon}</p>
      </>
    );
  }

  const sign = async () => {
    setState("signing");
    setMsg("");
    try {
      if (chainId !== CHAIN.id) await switchChainAsync({ chainId: CHAIN.id });
      const provider = (await connector!.getProvider()) as ProviderInterface;
      const permission = await requestSpendPermission({
        provider,
        account: address,
        spender: EXECUTOR,
        token: USDC[CHAIN.id],
        chainId: CHAIN.id,
        allowance: parseUnits(String(plan.dailyCapUsd), 6),
        periodInDays: 1,
        end: new Date(Date.now() + PLAN_DAYS * 86_400_000),
      });
      const r = await fetch("/api/plans", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ plan, permission, lang }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok || !j.ok) {
        setState("error");
        setMsg(t.plan.saveErr + (j.error ? ` (${j.error})` : ""));
        return;
      }
      setState("done");
    } catch (e) {
      setState("error");
      const m = e instanceof Error ? e.message : String(e);
      setMsg(`${t.plan.err} ${m.length < 120 ? m : ""}`);
    }
  };

  return (
    <>
      {usd !== undefined && usd < plan.amountUsd && state !== "done" && (
        <p className="note mt24">
          {t.plan.lowBal(usd.toFixed(2))} <Link href="/start" className="link">{t.plan.fund}</Link>
        </p>
      )}
      <button className="btn btn-lg btn-block mt24" disabled={disabled || state === "signing" || state === "done"} onClick={sign}>
        {state === "signing" ? t.plan.signing : state === "done" ? t.plan.signed : t.plan.sign}
      </button>
      {state === "done" && (
        <p className="small mt16">
          {t.plan.done(plan.dailyCapUsd)}{" "}
          <Link href="/portfolio" className="link">
            {t.nav.portfolio} <span className="arrow">→</span>
          </Link>
        </p>
      )}
      {state === "error" && <p className="err mt8 break">{msg}</p>}
    </>
  );
}
