import { NextResponse, type NextRequest } from "next/server";
import { runTick } from "@/lib/agent";
import { dbEnabled } from "@/lib/db";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/** Hourly trigger (Supabase pg_cron → here). Protected by CRON_SECRET when it is set. */
async function handle(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret && req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  if (!dbEnabled()) return NextResponse.json({ ok: false, error: "db not configured" }, { status: 503 });
  const res = await runTick();
  return NextResponse.json(res, { status: res.ok ? 200 : 500 });
}

export const GET = handle;
export const POST = handle;
