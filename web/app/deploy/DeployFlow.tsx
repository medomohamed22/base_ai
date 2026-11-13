"use client";

import { useEffect, useState } from "react";
import {
  concatHex,
  encodeDeployData,
  getContractAddress,
  isAddress,
  keccak256,
  stringToHex,
  type Address,
  type Hex,
} from "viem";
import { useAccount, useConfig, useConnect, useDisconnect } from "wagmi";
import {
  getBytecode,
  readContract,
  sendTransaction,
  switchChain,
  waitForTransactionReceipt,
  writeContract,
} from "wagmi/actions";
import { baseSepolia } from "wagmi/chains";
import { ARTIFACTS } from "@/lib/deploy-artifacts";
import { SPEND_PERMISSION_MANAGER, USDC, explorer } from "@/lib/chain";

/**
 * Deploys through the standard CREATE2 deployer (present on Base and Base Sepolia). Plain contract-creation
 * transactions don't work from smart wallets (Coinbase Smart Wallet, EIP-7702 accounts), but a normal call to this
 * factory does, from any wallet. Addresses are deterministic, so every step is checked on-chain and can be resumed.
 */
const CREATE2_FACTORY: Address = "0x4e59b44847b379578588920cA78FbF26c0B4956C";
const CHAIN_ID = baseSepolia.id;
const scan = explorer(CHAIN_ID);
const SALT = keccak256(stringToHex("sahm.sepolia.v1"));

type Plan = { routerInit: Hex; router: Address; executorInit: Hex; executor: Address };

function plan(owner: Address, agent: Address): Plan {
  const routerInit = encodeDeployData({
    abi: ARTIFACTS.MockRouter.abi,
    bytecode: ARTIFACTS.MockRouter.bytecode as Hex,
    args: [USDC[CHAIN_ID], owner, 180_000_000n, "Mock NVIDIA (testnet)", "tNVDA"],
  });
  const executorInit = encodeDeployData({
    abi: ARTIFACTS.SahmExecutor.abi,
    bytecode: ARTIFACTS.SahmExecutor.bytecode as Hex,
    args: [SPEND_PERMISSION_MANAGER, USDC[CHAIN_ID], owner, agent],
  });
  const at = (init: Hex) =>
    getContractAddress({ opcode: "CREATE2", from: CREATE2_FACTORY, salt: SALT, bytecode: init });
  return { routerInit, router: at(routerInit), executorInit, executor: at(executorInit) };
}

type Status = { router: boolean; executor: boolean; stock?: Address; stockSet: boolean; routerSet: boolean };

export default function DeployFlow() {
  const config = useConfig();
  const { address, isConnected, chainId } = useAccount();
  const { connect, connectors, isPending, error: connectError } = useConnect();
  const { disconnect } = useDisconnect();
  const [agent, setAgent] = useState("");
  const [status, setStatus] = useState<Status | null>(null);
  const [step, setStep] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const injectedConnector = connectors.find((c) => c.type === "injected");
  const baseConnector = connectors.find((c) => c.type !== "injected");

  useEffect(() => {
    if (address && !agent) setAgent(address);
  }, [address, agent]);

  const p = address && isAddress(agent) ? plan(address, agent as Address) : null;

  const check = async (pl: Plan): Promise<Status> => {
    const has = async (a: Address) => ((await getBytecode(config, { address: a, chainId: CHAIN_ID })) ?? "0x") !== "0x";
    const router = await has(pl.router);
    const executor = await has(pl.executor);
    const stock = router
      ? ((await readContract(config, {
          address: pl.router,
          abi: ARTIFACTS.MockRouter.abi,
          functionName: "stock",
          chainId: CHAIN_ID,
        })) as Address)
      : undefined;
    const flag = async (fn: "allowedStock" | "allowedRouter", arg?: Address) =>
      executor && arg
        ? ((await readContract(config, {
            address: pl.executor,
            abi: ARTIFACTS.SahmExecutor.abi,
            functionName: fn,
            args: [arg],
            chainId: CHAIN_ID,
          })) as boolean)
        : false;
    const s = { router, executor, stock, stockSet: await flag("allowedStock", stock), routerSet: await flag("allowedRouter", pl.router) };
    setStatus(s);
    return s;
  };

  useEffect(() => {
    if (p) check(p).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [address, agent]);

  const run = async () => {
    if (!p) return;
    setBusy(true);
    setErr("");
    try {
      if (chainId !== CHAIN_ID) {
        setStep("بنحوّل المحفظة لشبكة Base Sepolia…");
        await switchChain(config, { chainId: CHAIN_ID });
      }
      const wait = async (hash: Hex, label: string) => {
        setStep(`${label}: مستنيين التأكيد على السلسلة…`);
        const r = await waitForTransactionReceipt(config, { hash, chainId: CHAIN_ID });
        if (r.status !== "success") throw new Error(`${label}: المعاملة فشلت على السلسلة`);
      };

      let s = await check(p);
      if (!s.router) {
        setStep("1/4 وافق في المحفظة: نشر السهم الوهمي tNVDA…");
        const hash = await sendTransaction(config, {
          to: CREATE2_FACTORY,
          data: concatHex([SALT, p.routerInit]),
          chainId: CHAIN_ID,
        });
        await wait(hash, "1/4");
        s = await check(p);
        if (!s.router) throw new Error("1/4: العقد ما اتنشرش. ابعت screenshot في الشات.");
      }
      if (!s.executor) {
        setStep("2/4 وافق في المحفظة: نشر عقد سهم SahmExecutor…");
        const hash = await sendTransaction(config, {
          to: CREATE2_FACTORY,
          data: concatHex([SALT, p.executorInit]),
          chainId: CHAIN_ID,
        });
        await wait(hash, "2/4");
        s = await check(p);
        if (!s.executor) throw new Error("2/4: العقد ما اتنشرش. ابعت screenshot في الشات.");
      }
      if (!s.stockSet) {
        setStep("3/4 وافق في المحفظة: السماح بالسهم tNVDA…");
        const hash = await writeContract(config, {
          address: p.executor,
          abi: ARTIFACTS.SahmExecutor.abi,
          functionName: "setStock",
          args: [s.stock!, true],
          chainId: CHAIN_ID,
        });
        await wait(hash, "3/4");
      }
      if (!s.routerSet) {
        setStep("4/4 وافق في المحفظة: السماح بالراوتر…");
        const hash = await writeContract(config, {
          address: p.executor,
          abi: ARTIFACTS.SahmExecutor.abi,
          functionName: "setRouter",
          args: [p.router, true],
          chainId: CHAIN_ID,
        });
        await wait(hash, "4/4");
      }
      s = await check(p);
      setStep(s.stockSet && s.routerSet ? "خلصنا ✅" : "فيه خطوة ما كملتش. دوس كمّل النشر.");
    } catch (e) {
      const m = e instanceof Error ? e.message : String(e);
      setErr(/reject|denied|cancel/i.test(m) ? "اترفضت في المحفظة. دوس كمّل النشر وكمّل من نفس الخطوة." : m.slice(0, 240));
    } finally {
      setBusy(false);
    }
  };

  if (!isConnected || !address) {
    return (
      <div className="card section">
        <p className="muted">افتح الصفحة دي من المتصفح اللي جوه محفظتك، وبعدين دوس اتصال.</p>
        <div className="row">
          {injectedConnector && (
            <button
              className="btn"
              disabled={isPending}
              onClick={() => connect({ connector: injectedConnector, chainId: CHAIN_ID })}
            >
              {isPending ? "بنتصل…" : "اتصل بمحفظتي"}
            </button>
          )}
          {baseConnector && (
            <button className="btn ghost" disabled={isPending} onClick={() => connect({ connector: baseConnector })}>
              محفظة Base
            </button>
          )}
        </div>
        {connectError && <p className="small break" style={{ color: "var(--no)" }}>{connectError.message.slice(0, 160)}</p>}
      </div>
    );
  }

  const finished = status?.router && status.executor && status.stockSet && status.routerSet;
  const started = status?.router || status?.executor;

  return (
    <div className="card section">
      <div className="row" style={{ justifyContent: "space-between" }}>
        <p className="small muted">المحفظة المتصلة (هتبقى الـ owner):</p>
        <button className="choice" onClick={() => disconnect()}>تغيير</button>
      </div>
      <p className="num small break">{address}</p>

      <div className="field" style={{ marginTop: 12 }}>
        <label htmlFor="agent">عنوان محفظة الـ agent</label>
        <input id="agent" className="num" value={agent} onChange={(e) => setAgent(e.target.value.trim())} disabled={!!started} />
        {!isAddress(agent) && agent && <span className="small" style={{ color: "var(--no)" }}>العنوان مش صحيح</span>}
      </div>

      {!finished && (
        <button className="btn" style={{ width: "100%" }} disabled={busy || !p} onClick={run}>
          {busy ? "شغالين…" : started ? "كمّل النشر" : "انشر على Base Sepolia"}
        </button>
      )}
      <p className="small muted" style={{ marginTop: 8 }}>
        هتوافق على 4 معاملات في المحفظة. التكلفة أقل من 0.0001 ETH تجريبي.
      </p>
      {step && <p className="note small">{step}</p>}
      {err && <p className="small break" style={{ color: "var(--no)" }}>{err}</p>}

      {p && status && (
        <table style={{ marginTop: 12 }}>
          <tbody>
            {[
              ["SahmExecutor", p.executor, status.executor],
              ["tNVDA", status.stock, !!status.stock],
              ["MockRouter", p.router, status.router],
            ].map(([label, a, ok]) =>
              a ? (
                <tr key={label as string}>
                  <td>{ok ? "✅" : "⏳"} {label as string}</td>
                  <td>
                    <a className="num break" href={`${scan}/address/${a}`} target="_blank" rel="noreferrer">{a as string}</a>
                  </td>
                </tr>
              ) : null,
            )}
          </tbody>
        </table>
      )}
      {finished && <p style={{ marginTop: 12 }}>✅ اتنشر. ابعت screenshot في الشات.</p>}
    </div>
  );
}
