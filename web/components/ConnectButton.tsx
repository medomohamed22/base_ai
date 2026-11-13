"use client";

import { useAccount, useConnect, useDisconnect } from "wagmi";
import { shortAddr } from "@/lib/chain";
import { useT } from "./LangProvider";

export default function ConnectButton({ big = false }: { big?: boolean }) {
  const { t } = useT();
  const { address, isConnected } = useAccount();
  const { connect, connectors, isPending, error } = useConnect();
  const { disconnect } = useDisconnect();
  const base = connectors.find((c) => c.type !== "injected") ?? connectors[0];

  if (isConnected) {
    if (big) return null;
    return (
      <button className="pill" type="button" onClick={() => disconnect()} title={t.wallet.out}>
        <span className="dot" aria-hidden />
        <span className="num">{shortAddr(address)}</span>
      </button>
    );
  }

  return (
    <span>
      <button
        className={big ? "btn btn-lg" : "pill pill-solid"}
        type="button"
        disabled={isPending}
        onClick={() => connect({ connector: base })}
      >
        {isPending ? t.wallet.connecting : big ? t.wallet.connectBig : t.wallet.connect}
      </button>
      {error && big && <p className="small muted mt8">{t.wallet.failed}</p>}
    </span>
  );
}
