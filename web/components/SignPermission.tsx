"use client";

import { requestSpendPermission } from "@base-org/account/spend-permission/browser";
import type { ProviderInterface } from "@base-org/account";
import { useState } from "react";
import { parseUnits } from "viem";
import { useAccount, useSwitchChain } from "wagmi";
import ConnectButton from "./ConnectButton";
import { useUsdcBalance } from "./hooks";
import { CHAIN, EXECUTOR, USDC } from "@/lib/chain";

export type PlanDraft = {
  target: string; // ticker or "HALAL"
  amountUsd: number;
  frequency: "daily" | "weekly";
  dipBoost: boolean;
  dailyCapUsd: number;
};

const PLAN_DAYS = 30;

export default function SignPermission({ plan }: { plan: PlanDraft }) {
  const { address, isConnected, connector, chainId } = useAccount();
  const { switchChainAsync } = useSwitchChain();
  const { usd } = useUsdcBalance();
  const [state, setState] = useState<"idle" | "signing" | "done" | "error">("idle");
  const [msg, setMsg] = useState("");

  if (!isConnected || !address) {
    return (
      <div style={{ marginTop: 16 }}>
        <ConnectButton big />
      </div>
    );
  }

  if (!EXECUTOR) {
    return (
      <>
        <button className="btn" style={{ marginTop: 16, width: "100%" }} disabled>
          وقّع إذن الصرف (قريبًا)
        </button>
        <p className="small muted" style={{ marginTop: 8 }}>
          التوقيع هيتفعّل أول ما عقد سهم يتنشر على {CHAIN.name}.
        </p>
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
      // Saved locally until the plans API (Supabase sahm_plans) is wired up.
      try {
        const all = JSON.parse(localStorage.getItem("sahm.plans") || "[]");
        all.push({ plan, permission, createdAt: Date.now() });
        localStorage.setItem("sahm.plans", JSON.stringify(all));
      } catch {
        /* storage blocked */
      }
      setState("done");
    } catch (e) {
      setState("error");
      setMsg(e instanceof Error ? e.message : String(e));
    }
  };

  return (
    <>
      {usd !== undefined && usd < plan.amountUsd && (
        <p className="note small" style={{ marginTop: 16 }}>
          رصيدك {usd.toFixed(2)} USDC، أقل من أول شراء. <a href="/start">حط USDC الأول</a>.
        </p>
      )}
      <button
        className="btn"
        style={{ marginTop: 16, width: "100%" }}
        disabled={state === "signing" || state === "done"}
        onClick={sign}
      >
        {state === "signing" ? "وقّع في المحفظة…" : state === "done" ? "اتوقّع ✅" : "وقّع إذن الصرف"}
      </button>
      {state === "done" && (
        <p className="small muted" style={{ marginTop: 8 }}>
          تمام! الإذن اتوقّع بسقف ${plan.dailyCapUsd} في اليوم لمدة {PLAN_DAYS} يوم. تقدر تلغيه من محفظتي في أي وقت.
        </p>
      )}
      {state === "error" && (
        <p className="small" style={{ marginTop: 8, color: "var(--no)" }}>
          التوقيع ما كملش. {msg.length < 120 ? msg : ""}
        </p>
      )}
    </>
  );
}
