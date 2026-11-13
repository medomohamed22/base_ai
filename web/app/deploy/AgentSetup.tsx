"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { isAddress, type Address } from "viem";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import { useAccount, useConfig } from "wagmi";
import { switchChain, waitForTransactionReceipt, writeContract } from "wagmi/actions";
import { CHAIN, EXECUTOR } from "@/lib/chain";
import { EXECUTOR_ABI } from "@/lib/onchain";

type Status = {
  serverAgent: string | null;
  onchainAgent: string | null;
  agentMatches: boolean;
  agentGasEth: string | null;
  db: boolean;
  ai: boolean;
  cronSecret: boolean;
};

const Row = ({ ok, label, value }: { ok: boolean; label: string; value?: string | null }) => (
  <tr>
    <td>{ok ? "✅" : "⏳"} {label}</td>
    <td className="num small break">{value ?? ""}</td>
  </tr>
);

/** Owner-only helper: create the agent wallet in this browser, then point the contract at it. */
export default function AgentSetup() {
  const config = useConfig();
  const { address, chainId } = useAccount();
  const st = useQuery({ queryKey: ["agent-status"], queryFn: async () => (await (await fetch("/api/agent/status")).json()) as Status, refetchInterval: 10_000 });
  const [pk, setPk] = useState<`0x${string}` | null>(null);
  const [shown, setShown] = useState(false);
  const [target, setTarget] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const s = st.data;

  const gen = () => {
    const k = generatePrivateKey();
    setPk(k);
    setShown(false);
    setTarget(privateKeyToAccount(k).address);
  };

  const setAgent = async () => {
    if (!isAddress(target) || !EXECUTOR) return;
    setBusy(true);
    setMsg("");
    try {
      if (chainId !== CHAIN.id) await switchChain(config, { chainId: CHAIN.id });
      const hash = await writeContract(config, { address: EXECUTOR, abi: EXECUTOR_ABI, functionName: "setAgent", args: [target as Address], chainId: CHAIN.id });
      await waitForTransactionReceipt(config, { hash, chainId: CHAIN.id });
      setMsg("✅ اتغيّر الـ agent على العقد.");
      st.refetch();
    } catch (e) {
      setMsg((e instanceof Error ? e.message : String(e)).slice(0, 200));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="card mt24">
      <h3>محفظة الـ agent (السيرفر)</h3>
      <p className="small muted mt8">الـ agent هو اللي بينفّذ الشراء كل ساعة. محتاج محفظة خاصة بيه، مفتاحها في Vercel بس.</p>

      <table className="mt16">
        <tbody>
          <Row ok={!!s?.serverAgent} label="مفتاح الـ agent في Vercel" value={s?.serverAgent} />
          <Row ok={!!s?.agentMatches} label="العقد بيثق في نفس الـ agent" value={s?.onchainAgent} />
          <Row ok={!!s?.agentGasEth && Number(s.agentGasEth) > 0.0001} label="ETH للغاز عند الـ agent" value={s?.agentGasEth} />
          <Row ok={!!s?.db} label="Supabase متوصّل" />
          <Row ok={!!s?.ai} label="Meta AI متفعّل" />
          <Row ok={!!s?.cronSecret} label="CRON_SECRET" />
        </tbody>
      </table>

      <h4 className="mt24">1) اعمل محفظة agent جديدة</h4>
      <p className="small muted mt8">المفتاح بيتعمل هنا في متصفحك ومش بيتبعت لأي حد. انسخه وحطه في Vercel باسم AGENT_PRIVATE_KEY.</p>
      <button className="btn btn-ghost mt16" onClick={gen}>اعمل محفظة جديدة</button>
      {pk && (
        <div className="summary mt16">
          <p className="small">العنوان: <b className="num break">{privateKeyToAccount(pk).address}</b></p>
          <p className="small mt8">المفتاح الخاص (سرّي، ما تبعتهوش لحد):</p>
          <p className="num small break mt8" style={{ filter: shown ? "none" : "blur(6px)" }}>{pk}</p>
          <div className="row mt8">
            <button className="pill" onClick={() => setShown((v) => !v)}>{shown ? "إخفاء" : "إظهار"}</button>
            <button className="pill" onClick={() => navigator.clipboard.writeText(pk).catch(() => {})}>نسخ المفتاح</button>
          </div>
        </div>
      )}

      <h4 className="mt24">2) خلّي العقد يثق في الـ agent</h4>
      <div className="field mt8">
        <input className="num" value={target} onChange={(e) => setTarget(e.target.value.trim())} placeholder="0x… عنوان الـ agent" />
      </div>
      <button className="btn" disabled={busy || !address || !isAddress(target)} onClick={setAgent}>
        {busy ? "وافق في المحفظة…" : "setAgent"}
      </button>
      {!address && <p className="small muted mt8">اتصل بمحفظة الـ owner فوق الأول.</p>}
      {msg && <p className="small mt8 break">{msg}</p>}
      <p className="small muted mt16">3) ابعت شوية ETH تجريبي لعنوان الـ agent علشان يدفع الغاز (0.0005 يكفي مئات العمليات).</p>
    </div>
  );
}
