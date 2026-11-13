import { NextResponse } from "next/server";
import { formatEther } from "viem";
import { agentAddress, publicClient } from "@/lib/agent";
import { CHAIN, EXECUTOR } from "@/lib/chain";
import { dbEnabled } from "@/lib/db";
import { EXECUTOR_ABI } from "@/lib/onchain";

export const dynamic = "force-dynamic";

/** Public health check: which agent the server runs as vs. the one the contract trusts. No secrets. */
export async function GET() {
  const server = agentAddress();
  let onchain: string | null = null;
  let gas: string | null = null;
  try {
    if (EXECUTOR) onchain = (await publicClient.readContract({ address: EXECUTOR, abi: EXECUTOR_ABI, functionName: "agent" })) as string;
    if (server) gas = formatEther(await publicClient.getBalance({ address: server }));
  } catch {
    /* rpc hiccup */
  }
  return NextResponse.json({
    chain: CHAIN.id,
    executor: EXECUTOR || null,
    serverAgent: server,
    onchainAgent: onchain,
    agentMatches: !!server && !!onchain && server.toLowerCase() === onchain.toLowerCase(),
    agentGasEth: gas,
    db: dbEnabled(),
    ai: !!(process.env.LLAMA_API_KEY && process.env.LLAMA_MODEL),
    cronSecret: !!process.env.CRON_SECRET,
  });
}
