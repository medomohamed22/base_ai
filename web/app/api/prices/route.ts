import { NextResponse } from "next/server";
import { fetchQuotes } from "@/lib/prices";

export const revalidate = 30;

export async function GET() {
  try {
    const quotes = await fetchQuotes();
    return NextResponse.json(
      { quotes, at: Date.now() },
      { headers: { "cache-control": "public, s-maxage=30, stale-while-revalidate=60" } },
    );
  } catch {
    return NextResponse.json({ quotes: {}, at: Date.now(), error: "unavailable" }, { status: 502 });
  }
}
