import { NextResponse, type NextRequest } from "next/server";
import { publicClient } from "@/lib/agent";
import { CHAIN, SPEND_PERMISSION_MANAGER } from "@/lib/chain";
import { db, dbEnabled } from "@/lib/db";
import { isAddr, SPM_ABI, toTuple } from "@/lib/onchain";

export const dynamic = "force-dynamic";

/** After the user revokes in their wallet: mark plans stopped, but only those actually revoked on-chain. */
export async function POST(req: NextRequest) {
  if (!dbEnabled()) return NextResponse.json({ ok: true, stopped: 0 });
  const { wallet } = (await req.json().catch(() => ({}))) as { wallet?: string };
  if (!isAddr(wallet)) return NextResponse.json({ ok: false, error: "bad wallet" }, { status: 400 });
  const plans = await db.plansFull(wallet.toLowerCase(), CHAIN.id);
  let stopped = 0;
  for (const pl of plans.filter((x) => x.status === "active")) {
    const revoked = await publicClient.readContract({
      address: SPEND_PERMISSION_MANAGER,
      abi: SPM_ABI,
      functionName: "isRevoked",
      args: [toTuple(pl.permission)],
    });
    if (revoked) {
      await db.updatePlan(pl.id, { status: "stopped" });
      stopped++;
    }
  }
  return NextResponse.json({ ok: true, stopped });
}
