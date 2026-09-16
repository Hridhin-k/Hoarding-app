import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { geocodeNominatim, reverseGeocodeNominatim } from "@/lib/maps/geocode";

const searchSchema = z.object({
  q: z.string().trim().min(3).max(120),
});

const reverseSchema = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
});

const hits = new Map<string, { count: number; resetAt: number }>();

function rateLimit(key: string, limit = 30, windowMs = 60_000) {
  const now = Date.now();
  const row = hits.get(key);
  if (!row || row.resetAt < now) {
    hits.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (row.count >= limit) return false;
  row.count += 1;
  return true;
}

export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || user.id;
  if (!rateLimit(`geocode:${ip}`)) {
    return NextResponse.json({ error: "Too many geocode requests. Try again shortly." }, { status: 429 });
  }

  const { searchParams } = new URL(request.url);
  const lat = searchParams.get("lat");
  const lng = searchParams.get("lng");
  if (lat && lng) {
    const parsed = reverseSchema.safeParse({ lat, lng });
    if (!parsed.success) return NextResponse.json(null);
    const result = await reverseGeocodeNominatim(parsed.data.lat, parsed.data.lng);
    return NextResponse.json(result);
  }

  const parsed = searchSchema.safeParse({ q: searchParams.get("q") });
  if (!parsed.success) return NextResponse.json([]);
  const results = await geocodeNominatim(parsed.data.q);
  return NextResponse.json(results);
}
