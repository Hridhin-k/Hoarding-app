import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

async function runOperations(request: Request) {
  const secret = process.env.CRON_SECRET;
  const header = request.headers.get("authorization");
  if (!secret || header !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase.rpc("refresh_operational_alerts");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const holds = await supabase.rpc("expire_holds");
  if (holds.error) {
    return NextResponse.json({ error: holds.error.message, alerts: data }, { status: 500 });
  }
  return NextResponse.json({
    ok: true,
    alerts: data,
    ranAt: new Date().toISOString(),
  });
}

/** Vercel Cron invokes GET with Authorization: Bearer $CRON_SECRET */
export async function GET(request: Request) {
  return runOperations(request);
}

export async function POST(request: Request) {
  return runOperations(request);
}
