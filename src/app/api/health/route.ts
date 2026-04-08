import { NextResponse } from "next/server";

/** Liveness: no I/O — safe for frequent Docker / LB probes. */
export async function GET() {
  return NextResponse.json({ ok: true as const });
}
