"use client";

import { useAccount, useConnect, useDisconnect } from "wagmi";
import { shortAddr } from "@/lib/chain";

export default function ConnectButton({ big = false }: { big?: boolean }) {
  const { address, isConnected } = useAccount();
  const { connect, connectors, isPending, error } = useConnect();
  const { disconnect } = useDisconnect();

  if (isConnected) {
    return (
      <span className="row" style={{ gap: 8 }}>
        <span className="num small">{shortAddr(address)}</span>
        <button className="choice" type="button" onClick={() => disconnect()}>
          خروج
        </button>
      </span>
    );
  }

  return (
    <span>
      <button
        className={big ? "btn" : "choice"}
        type="button"
        disabled={isPending}
        onClick={() => connect({ connector: connectors[0] })}
      >
        {isPending ? "بنفتح المحفظة…" : "ادخل بمحفظة Base"}
      </button>
      {error && big && <p className="small muted">ما قدرناش نفتح المحفظة. جرّب تاني.</p>}
    </span>
  );
}
