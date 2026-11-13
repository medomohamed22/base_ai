"use client";

import { useEffect, useState } from "react";
import { isAddress, type Address, type Hex } from "viem";
import { useAccount, useConfig, useConnect, useDisconnect } from "wagmi";
import { deployContract, readContract, switchChain, waitForTransactionReceipt, writeContract } from "wagmi/actions";
import { baseSepolia } from "wagmi/chains";
import { ARTIFACTS } from "@/lib/deploy-artifacts";
import { SPEND_PERMISSION_MANAGER, USDC, explorer } from "@/lib/chain";

type Deployed = { router?: Address; stock?: Address; executor?: Address; stockSet?: boolean; routerSet?: boolean };

const KEY = "sahm.deploy.sepolia";
const load = (): Deployed => {
  try {
    return JSON.parse(localStorage.getItem(KEY) || "{}");
  } catch {
    return {};
  }
};
const save = (d: Deployed) => {
  try {
    localStorage.setItem(KEY, JSON.stringify(d));
  } catch {
    /* storage blocked: progress just won't survive a reload */
  }
};

const CHAIN_ID = baseSepolia.id;
const scan = explorer(CHAIN_ID);

export default function DeployFlow() {
  const config = useConfig();
  const { address, isConnected, chainId, connector } = useAccount();
  const { connect, connectors, isPending, error: connectError } = useConnect();
  const { disconnect } = useDisconnect();
  const [agent, setAgent] = useState("");
  const [done, setDone] = useState<Deployed>({});
  const [step, setStep] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const injectedConnector = connectors.find((c) => c.type === "injected");

  useEffect(() => setDone(load()), []);
  useEffect(() => {
    if (address && !agent) setAgent(address);
  }, [address, agent]);

  const update = (d: Deployed) => {
    setDone(d);
    save(d);
  };

  const run = async () => {
    if (!address || !isAddress(agent)) return;
    setBusy(true);
    setErr("");
    let d = { ...done };
    try {
      if (chainId !== CHAIN_ID) {
        setStep("بنحوّل المحفظة لشبكة Base Sepolia…");
        await switchChain(config, { chainId: CHAIN_ID });
      }
      const wait = async (hash: Hex, label: string) => {
        setStep(`${label}: مستنيين التأكيد على السلسلة…`);
        const r = await waitForTransactionReceipt(config, { hash, chainId: CHAIN_ID });
        if (r.status !== "success") throw new Error(`${label} failed`);
        return r;
      };

      if (!d.router) {
        setStep("1/4 وافق في المحفظة: نشر السهم الوهمي tNVDA…");
        const hash = await deployContract(config, {
          abi: ARTIFACTS.MockRouter.abi,
          bytecode: ARTIFACTS.MockRouter.bytecode as Hex,
          args: [USDC[CHAIN_ID], 180_000_000n, "Mock NVIDIA (testnet)", "tNVDA"],
          chainId: CHAIN_ID,
        });
        const r = await wait(hash, "1/4");
        const router = r.contractAddress as Address;
        const stock = (await readContract(config, {
          address: router,
          abi: ARTIFACTS.MockRouter.abi,
          functionName: "stock",
          chainId: CHAIN_ID,
        })) as Address;
        d = { ...d, router, stock };
        update(d);
      }

      if (!d.executor) {
        setStep("2/4 وافق في المحفظة: نشر عقد سهم SahmExecutor…");
        const hash = await deployContract(config, {
          abi: ARTIFACTS.SahmExecutor.abi,
          bytecode: ARTIFACTS.SahmExecutor.bytecode as Hex,
          args: [SPEND_PERMISSION_MANAGER, USDC[CHAIN_ID], address, agent as Address],
          chainId: CHAIN_ID,
        });
        const r = await wait(hash, "2/4");
        d = { ...d, executor: r.contractAddress as Address };
        update(d);
      }

      if (!d.stockSet) {
        setStep("3/4 وافق في المحفظة: السماح بالسهم tNVDA…");
        const hash = await writeContract(config, {
          address: d.executor!,
          abi: ARTIFACTS.SahmExecutor.abi,
          functionName: "setStock",
          args: [d.stock!, true],
          chainId: CHAIN_ID,
        });
        await wait(hash, "3/4");
        d = { ...d, stockSet: true };
        update(d);
      }

      if (!d.routerSet) {
        setStep("4/4 وافق في المحفظة: السماح بالراوتر…");
        const hash = await writeContract(config, {
          address: d.executor!,
          abi: ARTIFACTS.SahmExecutor.abi,
          functionName: "setRouter",
          args: [d.router!, true],
          chainId: CHAIN_ID,
        });
        await wait(hash, "4/4");
        d = { ...d, routerSet: true };
        update(d);
      }
      setStep("خلصنا ✅");
    } catch (e) {
      const m = e instanceof Error ? e.message : String(e);
      setErr(/reject|denied|cancel/i.test(m) ? "اترفضت في المحفظة. دوس انشر تاني وكمّل من نفس الخطوة." : m.slice(0, 200));
    } finally {
      setBusy(false);
    }
  };

  const finished = done.executor && done.stockSet && done.routerSet;

  if (!isConnected || connector?.type !== "injected") {
    return (
      <div className="card section">
        <p className="muted">
          افتح الصفحة دي من المتصفح اللي جوه محفظتك (MetaMask أو Coinbase Wallet أو Trust)، وبعدين دوس اتصال.
        </p>
        {isConnected && connector?.type !== "injected" && (
          <button className="choice" onClick={() => disconnect()} style={{ marginBottom: 12 }}>
            اخرج من محفظة Base الأول
          </button>
        )}
        <button
          className="btn"
          disabled={!injectedConnector || isPending}
          onClick={() => injectedConnector && connect({ connector: injectedConnector, chainId: CHAIN_ID })}
        >
          {isPending ? "بنتصل…" : "اتصل بمحفظتي"}
        </button>
        {connectError && <p className="small" style={{ color: "var(--no)" }}>{connectError.message.slice(0, 160)}</p>}
      </div>
    );
  }

  return (
    <div className="card section">
      <p className="small muted">المحفظة المتصلة (هتبقى الـ owner):</p>
      <p className="num small break">{address}</p>

      <div className="field" style={{ marginTop: 12 }}>
        <label htmlFor="agent">عنوان محفظة الـ agent</label>
        <input id="agent" className="num" value={agent} onChange={(e) => setAgent(e.target.value.trim())} disabled={!!done.executor} />
        {!isAddress(agent) && agent && <span className="small" style={{ color: "var(--no)" }}>العنوان مش صحيح</span>}
      </div>

      {!finished && (
        <button className="btn" style={{ width: "100%" }} disabled={busy || !isAddress(agent)} onClick={run}>
          {busy ? "شغالين…" : done.router ? "كمّل النشر" : "انشر على Base Sepolia"}
        </button>
      )}
      <p className="small muted" style={{ marginTop: 8 }}>
        هتوافق على 4 معاملات في المحفظة. التكلفة أقل من 0.0001 ETH تجريبي.
      </p>
      {step && <p className="note small">{step}</p>}
      {err && <p className="small break" style={{ color: "var(--no)" }}>{err}</p>}

      {(done.router || done.executor) && (
        <table style={{ marginTop: 12 }}>
          <tbody>
            {done.executor && (
              <tr>
                <td>SahmExecutor</td>
                <td><a className="num break" href={`${scan}/address/${done.executor}`} target="_blank" rel="noreferrer">{done.executor}</a></td>
              </tr>
            )}
            {done.stock && (
              <tr>
                <td>tNVDA</td>
                <td><a className="num break" href={`${scan}/address/${done.stock}`} target="_blank" rel="noreferrer">{done.stock}</a></td>
              </tr>
            )}
            {done.router && (
              <tr>
                <td>MockRouter</td>
                <td><a className="num break" href={`${scan}/address/${done.router}`} target="_blank" rel="noreferrer">{done.router}</a></td>
              </tr>
            )}
          </tbody>
        </table>
      )}
      {finished && <p style={{ marginTop: 12 }}>✅ اتنشر. ابعت عنوان SahmExecutor في الشات.</p>}
    </div>
  );
}
