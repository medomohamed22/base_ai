"use client";

import { fetchPermissions, requestRevoke } from "@base-org/account/spend-permission/browser";
import type { ProviderInterface } from "@base-org/account";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { formatUnits } from "viem";
import { useAccount, useReadContracts } from "wagmi";
import ConnectButton from "./ConnectButton";
import { useUsdcBalance } from "./hooks";
import { useT } from "./LangProvider";
import { CHAIN, EXECUTOR, SEPOLIA_MOCK, STOCK_ABI, explorer } from "@/lib/chain";
import { STOCKS } from "@/lib/stocks";

type Exec = {
  id: number;
  ticker: string | null;
  decision: "executed" | "deferred" | "rejected";
  reason_ar: string;
  reason_en: string;
  usdc_in: number | null;
  tx_hash: string | null;
  created_at: string;
};

function Holdings({ address }: { address: `0x${string}` }) {
  const { t, lang } = useT();
  // Testnet holds the mock NVDA; mainnet reads every listed stock.
  const list = CHAIN.testnet
    ? [{ ...STOCKS.find((s) => s.ticker === "NVDA")!, address: SEPOLIA_MOCK.stock, ticker: "tNVDA" }]
    : STOCKS;
  const { data, isLoading } = useReadContracts({
    contracts: list.flatMap((s) => [
      { address: s.address, abi: STOCK_ABI, functionName: "balanceOf", args: [address], chainId: CHAIN.id },
      { address: s.address, abi: STOCK_ABI, functionName: "uiMultiplier", chainId: CHAIN.id },
    ]),
    query: { refetchInterval: 15_000 },
  });
  if (isLoading) return <p className="muted mt16">{t.portfolio.loading}</p>;
  const rows = list
    .map((s, i) => {
      const bal = data?.[2 * i]?.result as bigint | undefined;
      const mult = data?.[2 * i + 1]?.result as bigint | undefined;
      const tokens = bal ? Number(formatUnits(bal, 8)) : 0;
      return { s, shares: mult ? tokens * Number(formatUnits(mult, 18)) : tokens };
    })
    .filter((r) => r.shares > 0);

  if (!rows.length) return <p className="muted mt16">{t.portfolio.noStocks}</p>;
  return (
    <div className="table-wrap mt16">
      <table>
        <thead>
          <tr>
            <th>{t.portfolio.stock}</th>
            <th>{t.portfolio.shares}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(({ s, shares }) => (
            <tr key={s.ticker}>
              <td>
                <b>{lang === "ar" ? s.nameAr : s.nameEn}</b> <span className="tk">{s.ticker}</span>
              </td>
              <td className="num">{shares.toFixed(6)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Permissions({ address }: { address: `0x${string}` }) {
  const { t, lang } = useT();
  const { connector } = useAccount();
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");
  const q = useQuery({
    queryKey: ["perms", address, EXECUTOR],
    enabled: !!EXECUTOR && !!connector,
    queryFn: async () => {
      const provider = (await connector!.getProvider()) as ProviderInterface;
      const all = await fetchPermissions({ provider, account: address, chainId: CHAIN.id, spender: EXECUTOR });
      return all.filter((p) => p.permission.end * 1000 > Date.now());
    },
  });

  if (!EXECUTOR) return null;
  if (q.isLoading) return <p className="muted small mt16">{t.portfolio.loading}</p>;
  const perms = q.data ?? [];

  const stopAll = async () => {
    setBusy(true);
    setNote("");
    try {
      const provider = (await connector!.getProvider()) as ProviderInterface;
      for (const permission of perms) await requestRevoke({ provider, permission });
      await fetch("/api/plans/sync", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ wallet: address }) }).catch(() => {});
      setNote(t.portfolio.stopped);
      await q.refetch();
    } catch {
      setNote(t.portfolio.stopErr);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mt16">
      <p className="muted small">{t.portfolio.perms(perms.length)}</p>
      <ul style={{ listStyle: "none", padding: 0, margin: "12px 0 0", display: "grid", gap: 8 }}>
        {perms.map((p) => (
          <li key={p.permissionHash} className="summary small">
            {t.portfolio.capLine(
              String(Number(formatUnits(BigInt(p.permission.allowance), 6))),
              p.permission.period >= 604800 ? t.portfolio.week : t.portfolio.day,
              new Date(p.permission.end * 1000).toLocaleDateString(lang === "ar" ? "ar-EG" : "en-US"),
            )}
          </li>
        ))}
      </ul>
      {perms.length > 0 && (
        <button className="btn btn-danger mt16" disabled={busy} onClick={stopAll}>
          {busy ? t.portfolio.stopping : t.portfolio.stopAll}
        </button>
      )}
      {note && <p className="small mt8">{note}</p>}
    </div>
  );
}

function History({ address }: { address: string }) {
  const { t, lang } = useT();
  const q = useQuery({
    queryKey: ["history", address],
    queryFn: async () => (await (await fetch(`/api/plans?wallet=${address}`)).json()) as { executions: Exec[] },
    refetchInterval: 15_000,
  });
  const ex = q.data?.executions ?? [];
  if (q.isLoading) return <p className="muted small mt16">{t.portfolio.loading}</p>;
  if (!ex.length) return <p className="muted mt16">{t.portfolio.noHistory}</p>;
  const label = { executed: t.portfolio.executed, deferred: t.portfolio.deferred, rejected: t.portfolio.rejected };
  return (
    <ul style={{ listStyle: "none", padding: 0, margin: "16px 0 0", display: "grid", gap: 0 }}>
      {ex.map((e) => (
        <li key={e.id} style={{ padding: "16px 0", borderBottom: "1px solid var(--line)" }}>
          <div className="row between">
            <span className={`badge ${e.decision === "executed" ? "ok" : ""}`}>{label[e.decision]}</span>
            <span className="tiny muted num">{new Date(e.created_at).toLocaleString(lang === "ar" ? "ar-EG" : "en-US")}</span>
          </div>
          <p className="mt8">{lang === "ar" ? e.reason_ar : e.reason_en}</p>
          {e.tx_hash && (
            <a className="link small mt8" style={{ display: "inline-flex" }} href={`${explorer(CHAIN.id)}/tx/${e.tx_hash}`} target="_blank" rel="noreferrer">
              Basescan <span className="arrow">→</span>
            </a>
          )}
        </li>
      ))}
    </ul>
  );
}

export default function PortfolioView() {
  const { t } = useT();
  const { address, isConnected } = useAccount();
  const { usd } = useUsdcBalance(15_000);
  if (!isConnected || !address) {
    return (
      <div className="card mt40">
        <p className="muted">{t.portfolio.connectHint}</p>
        <div className="mt16">
          <ConnectButton big />
        </div>
      </div>
    );
  }
  return (
    <div className="grid-portfolio mt40" style={{ display: "grid", gap: 16, gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))" }}>
      <div className="card">
        <h3>{t.portfolio.holdings}</h3>
        <Holdings address={address} />
        <p className="small muted mt16">
          {t.portfolio.usdc}: <b className="num">{usd === undefined ? "…" : usd.toFixed(2)}</b>
        </p>
      </div>
      <div className="card">
        <h3>{t.portfolio.plans}</h3>
        <Permissions address={address} />
      </div>
      <div className="card" style={{ gridColumn: "1 / -1" }}>
        <h3>{t.portfolio.history}</h3>
        <History address={address} />
      </div>
    </div>
  );
}
