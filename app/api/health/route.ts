import { NextResponse } from "next/server";
import { hasPublicEnv } from "@/lib/env";

/** Lightweight liveness probe for hosting platforms. Does not touch the database. */
export async function GET() {
  return NextResponse.json({
    ok: true,
    service: "hoardings360",
    envConfigured: hasPublicEnv(),
    timestamp: new Date().toISOString(),
  });
}
