"use client";

import { useState } from "react";
import { useAccount } from "wagmi";
import ConnectButton from "./ConnectButton";
import { useUsdcBalance } from "./hooks";
import { useT } from "./LangProvider";
import { CHAIN, explorer } from "@/lib/chain";

export default function WalletFunding() {
  const { t } = useT();
  const { address, isConnected } = useAccount();
  const { usd } = useUsdcBalance(10_000);
  const [copied, setCopied] = useState(false);

  if (!isConnected || !address) {
    return (
      <>
        <p className="muted">{t.start.connectHint}</p>
        <div className="mt16">
          <ConnectButton big />
        </div>
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
      <p className="num break" style={{ fontSize: 17, fontWeight: 600 }}>{address}</p>
      <div className="row mt16">
        <button className="btn" type="button" onClick={copy}>
          {copied ? t.start.copied : t.start.copy}
        </button>
        <a className="btn btn-ghost" href={`${explorer(CHAIN.id)}/address/${address}`} target="_blank" rel="noreferrer">
          {t.start.scan}
        </a>
      </div>
      <p className="small muted mt16">
        {t.start.network}: <b>{CHAIN.name}</b>
      </p>
      <p className="summary mt16">
        {usd === undefined ? t.start.checking : usd > 0 ? t.start.arrived(usd.toFixed(2)) : t.start.waiting}
      </p>
    </>
  );
}
