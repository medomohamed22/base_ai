"use client";

import { useState } from "react";
import { useAccount } from "wagmi";
import ConnectButton from "./ConnectButton";
import { useUsdcBalance } from "./hooks";
import { CHAIN, explorer } from "@/lib/chain";

export default function WalletFunding() {
  const { address, isConnected } = useAccount();
  const { usd } = useUsdcBalance(10_000);
  const [copied, setCopied] = useState(false);

  if (!isConnected || !address) {
    return (
      <>
        <p className="muted">ادخل بمحفظة Base علشان يظهر عنوانك. المحفظة بتتعمل بالـ passkey (بصمة أو Face ID)، من غير كلمة سر.</p>
        <ConnectButton big />
      </>
    );
  }

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard blocked: the address is still selectable */
    }
  };

  return (
    <>
      <p className="num" style={{ wordBreak: "break-all", fontSize: 15 }}>{address}</p>
      <div className="row">
        <button className="btn" type="button" onClick={copy}>
          {copied ? "اتنسخ ✅" : "انسخ العنوان"}
        </button>
        <a className="btn ghost" href={`${explorer(CHAIN.id)}/address/${address}`} target="_blank" rel="noreferrer">
          شوفه على Basescan
        </a>
      </div>
      <p className="small muted" style={{ marginTop: 8 }}>
        الشبكة: <strong>{CHAIN.name}</strong>
      </p>
      <div className="note" style={{ marginTop: 12 }}>
        {usd === undefined
          ? "بنشوف رصيدك…"
          : usd > 0
            ? `وصلت ✅ رصيدك ${usd.toFixed(2)} USDC`
            : "مستني الفلوس… الصفحة بتتحدّث لوحدها كل 10 ثواني."}
      </div>
    </>
  );
}
