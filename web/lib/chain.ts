import { base, baseSepolia } from "wagmi/chains";
import type { Address } from "viem";

/** Which chain plans are signed on. Sepolia until the mainnet launch. */
export const CHAIN = process.env.NEXT_PUBLIC_CHAIN === "base" ? base : baseSepolia;

export const USDC: Record<number, Address> = {
  [base.id]: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
  [baseSepolia.id]: "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
};

export const SPEND_PERMISSION_MANAGER: Address = "0xf85210B21cC50302F477BA56686d2019dC9b67Ad";

/** SahmExecutor address on CHAIN. Empty until deployed. */
export const EXECUTOR = (process.env.NEXT_PUBLIC_EXECUTOR_ADDRESS || "") as Address | "";

/** Public Builder Code (ERC-8021), attached to every transaction. */
export const BUILDER_CODE = "bc_cs3y0r48";

export const explorer = (chainId: number) =>
  chainId === base.id ? "https://basescan.org" : "https://sepolia.basescan.org";

export const shortAddr = (a?: string) => (a ? `${a.slice(0, 6)}…${a.slice(-4)}` : "");

export const ERC20_ABI = [
  {
    type: "function",
    name: "balanceOf",
    stateMutability: "view",
    inputs: [{ name: "a", type: "address" }],
    outputs: [{ type: "uint256" }],
  },
] as const;

/** Coinbase tokenized stocks: 8 decimals, plus a corporate-action multiplier (1e18 = 1.0). */
export const STOCK_ABI = [
  ...ERC20_ABI,
  {
    type: "function",
    name: "uiMultiplier",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "uint256" }],
  },
] as const;
