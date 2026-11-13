import { NextResponse } from "next/server";
import { CHAIN } from "@/lib/chain";
import { db, dbEnabled } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!dbEnabled()) return NextResponse.json({ ok: true, stats: null, recent: [] });
  try {
    const [stats, recent] = await Promise.all([db.stats(CHAIN.id), db.recent(CHAIN.id)]);
    return NextResponse.json({ ok: true, stats, recent }, { headers: { "cache-control": "public, s-maxage=60" } });
  } catch {
    return NextResponse.json({ ok: false, stats: null, recent: [] }, { status: 502 });
  }
}
