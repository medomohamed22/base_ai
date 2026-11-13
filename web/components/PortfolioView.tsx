"use client";

import { fetchPermissions, requestRevoke } from "@base-org/account/spend-permission/browser";
import type { ProviderInterface } from "@base-org/account";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { formatUnits } from "viem";
import { useAccount, useReadContracts } from "wagmi";
import { base } from "wagmi/chains";
import ConnectButton from "./ConnectButton";
import { useUsdcBalance } from "./hooks";
import { CHAIN, EXECUTOR, STOCK_ABI } from "@/lib/chain";
import { STOCKS } from "@/lib/stocks";

function Holdings({ address }: { address: `0x${string}` }) {
  // Tokenized stocks live on Base mainnet only.
  const { data, isLoading } = useReadContracts({
    contracts: STOCKS.flatMap((s) => [
      { address: s.address, abi: STOCK_ABI, functionName: "balanceOf", args: [address], chainId: base.id },
      { address: s.address, abi: STOCK_ABI, functionName: "uiMultiplier", chainId: base.id },
    ]),
  });
  if (isLoading) return <p className="muted">بنحمّل أسهمك…</p>;
  const rows = STOCKS.map((s, i) => {
    const bal = data?.[2 * i]?.result as bigint | undefined;
    const mult = data?.[2 * i + 1]?.result as bigint | undefined;
    const tokens = bal ? Number(formatUnits(bal, 8)) : 0;
    const shares = mult ? tokens * Number(formatUnits(mult, 18)) : tokens;
    return { s, shares };
  }).filter((r) => r.shares > 0);

  if (!rows.length) return <p className="muted">لسه ما عندكش أسهم. أول شراء هيظهر هنا.</p>;
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr><th>السهم</th><th>عدد الأسهم</th></tr>
        </thead>
        <tbody>
          {rows.map(({ s, shares }) => (
            <tr key={s.ticker}>
              <td>{s.nameAr} <span className="num muted">{s.ticker}</span></td>
              <td className="num">{shares.toFixed(6)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Permissions({ address }: { address: `0x${string}` }) {
  const { connector } = useAccount();
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");
  const q = useQuery({
    queryKey: ["perms", address, EXECUTOR],
    enabled: !!EXECUTOR && !!connector,
    queryFn: async () => {
      const provider = (await connector!.getProvider()) as ProviderInterface;
      return fetchPermissions({ provider, account: address, chainId: CHAIN.id, spender: EXECUTOR });
    },
  });

  if (!EXECUTOR) return <p className="muted small">مفيش خطط شغالة لسه.</p>;
  if (q.isLoading) return <p className="muted small">بنشوف أذونات الصرف…</p>;
  const perms = q.data ?? [];

  const stopAll = async () => {
    setBusy(true);
    setNote("");
    try {
      const provider = (await connector!.getProvider()) as ProviderInterface;
      for (const permission of perms) await requestRevoke({ provider, permission });
      setNote("اتوقف كل حاجة ✅ محدش يقدر يسحب من محفظتك تاني.");
      await q.refetch();
    } catch {
      setNote("الإيقاف ما كملش. جرّب تاني.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <p className="muted small">
        {perms.length ? `عندك ${perms.length} إذن صرف شغال.` : "مفيش أذونات صرف شغالة."}
      </p>
      {perms.map((p) => (
        <p key={p.permissionHash} className="small">
          سقف <span className="num">${Number(formatUnits(BigInt(p.permission.allowance), 6))}</span> كل{" "}
          {p.permission.period >= 604800 ? "أسبوع" : "يوم"}، لحد{" "}
          <span className="num">{new Date(p.permission.end * 1000).toLocaleDateString("ar-EG")}</span>
        </p>
      ))}
      {perms.length > 0 && (
        <button className="btn" style={{ background: "var(--no)" }} disabled={busy} onClick={stopAll}>
          {busy ? "بنوقف…" : "إيقاف كل حاجة"}
        </button>
      )}
      {note && <p className="small" style={{ marginTop: 8 }}>{note}</p>}
    </>
  );
}

export default function PortfolioView() {
  const { address, isConnected } = useAccount();
  const { usd } = useUsdcBalance();
  if (!isConnected || !address) {
    return (
      <div className="card section">
        <p className="muted">ادخل بمحفظة Base علشان تشوف أسهمك وخطتك وسجل كل عملية.</p>
        <ConnectButton big />
      </div>
    );
  }
  return (
    <>
      <div className="card section">
        <h2>أسهمي</h2>
        <Holdings address={address} />
        <p className="small muted" style={{ marginTop: 8 }}>
          رصيد USDC ({CHAIN.name}): <span className="num">{usd === undefined ? "…" : usd.toFixed(2)}</span>
        </p>
      </div>
      <div className="card section">
        <h2>خطتي</h2>
        <Permissions address={address} />
      </div>
    </>
  );
}
