"use client";

import { formatUnits } from "viem";
import { useAccount, useReadContract } from "wagmi";
import { CHAIN, ERC20_ABI, USDC } from "@/lib/chain";

/** USDC balance on CHAIN, polled so the guide can say "it arrived". */
export function useUsdcBalance(pollMs = 0) {
  const { address } = useAccount();
  const q = useReadContract({
    address: USDC[CHAIN.id],
    abi: ERC20_ABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    chainId: CHAIN.id,
    query: { enabled: !!address, refetchInterval: pollMs || false },
  });
  const raw = q.data as bigint | undefined;
  return { ...q, raw, usd: raw === undefined ? undefined : Number(formatUnits(raw, 6)) };
}
