import { stringToHex, concatHex, numberToHex, size, type Hex } from "viem";
import { BUILDER_CODE } from "./chain";
import type { SpendPermissionJson } from "./db";

/** ERC-8021 schema 0 data suffix: codes ∥ codesLength(1) ∥ schemaId(1)=0 ∥ 0x8021…8021 (16 bytes). */
export function builderSuffix(codes: string[] = [BUILDER_CODE]): Hex {
  const codesHex = stringToHex(codes.join(","));
  return concatHex([codesHex, numberToHex(size(codesHex), { size: 1 }), "0x00", "0x80218021802180218021802180218021"]);
}

export const PERMISSION_TUPLE = {
  name: "p",
  type: "tuple",
  components: [
    { name: "account", type: "address" },
    { name: "spender", type: "address" },
    { name: "token", type: "address" },
    { name: "allowance", type: "uint160" },
    { name: "period", type: "uint48" },
    { name: "start", type: "uint48" },
    { name: "end", type: "uint48" },
    { name: "salt", type: "uint256" },
    { name: "extraData", type: "bytes" },
  ],
} as const;

export const SPM_ABI = [
  { type: "function", name: "getHash", stateMutability: "view", inputs: [PERMISSION_TUPLE], outputs: [{ type: "bytes32" }] },
  { type: "function", name: "isApproved", stateMutability: "view", inputs: [PERMISSION_TUPLE], outputs: [{ type: "bool" }] },
  { type: "function", name: "isRevoked", stateMutability: "view", inputs: [PERMISSION_TUPLE], outputs: [{ type: "bool" }] },
  {
    type: "function",
    name: "getCurrentPeriod",
    stateMutability: "view",
    inputs: [PERMISSION_TUPLE],
    outputs: [
      {
        type: "tuple",
        components: [
          { name: "start", type: "uint48" },
          { name: "end", type: "uint48" },
          { name: "spend", type: "uint160" },
        ],
      },
    ],
  },
] as const;

export const EXECUTOR_ABI = [
  {
    type: "function",
    name: "execute",
    stateMutability: "nonpayable",
    inputs: [
      PERMISSION_TUPLE,
      { name: "signature", type: "bytes" },
      { name: "amount", type: "uint160" },
      { name: "stock", type: "address" },
      { name: "minOut", type: "uint256" },
      { name: "router", type: "address" },
      { name: "swapData", type: "bytes" },
      { name: "deadline", type: "uint256" },
    ],
    outputs: [],
  },
  { type: "function", name: "agent", stateMutability: "view", inputs: [], outputs: [{ type: "address" }] },
  { type: "function", name: "owner", stateMutability: "view", inputs: [], outputs: [{ type: "address" }] },
  { type: "function", name: "setAgent", stateMutability: "nonpayable", inputs: [{ name: "a", type: "address" }], outputs: [] },
  {
    type: "event",
    name: "Executed",
    inputs: [
      { name: "user", type: "address", indexed: true },
      { name: "stock", type: "address", indexed: true },
      { name: "usdcIn", type: "uint256", indexed: false },
      { name: "stockOut", type: "uint256", indexed: false },
      { name: "refund", type: "uint256", indexed: false },
    ],
  },
] as const;

export const MOCK_ROUTER_ABI = [
  { type: "function", name: "quote", stateMutability: "view", inputs: [{ name: "amountIn", type: "uint256" }], outputs: [{ type: "uint256" }] },
  { type: "function", name: "priceUsdc", stateMutability: "view", inputs: [], outputs: [{ type: "uint256" }] },
  {
    type: "function",
    name: "swapExactIn",
    stateMutability: "nonpayable",
    inputs: [
      { name: "amountIn", type: "uint256" },
      { name: "recipient", type: "address" },
    ],
    outputs: [{ type: "uint256" }],
  },
] as const;

export const toTuple = (p: SpendPermissionJson) => ({
  account: p.account as Hex,
  spender: p.spender as Hex,
  token: p.token as Hex,
  allowance: BigInt(p.allowance),
  period: Number(p.period),
  start: Number(p.start),
  end: Number(p.end),
  salt: BigInt(p.salt),
  extraData: (p.extraData || "0x") as Hex,
});

export const isAddr = (a: unknown): a is string => typeof a === "string" && /^0x[0-9a-fA-F]{40}$/.test(a);
