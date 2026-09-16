import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { loadEnv } from "vite";
import { publicEnvSchema } from "@/lib/env";
import { OCCUPANCY_OVERLAP_MESSAGE } from "@/lib/occupancy/constants";

const loaded = loadEnv("test", process.cwd(), "");
Object.assign(process.env, loaded);

const TENANT_A = "aaaaaaaa-0000-4000-8000-000000000001";
const PASSWORD = "Password123!";
const configured = publicEnvSchema.safeParse({
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  NEXT_PUBLIC_MAP_PROVIDER: process.env.NEXT_PUBLIC_MAP_PROVIDER || "maplibre",
}).success;

async function signIn(email: string): Promise<SupabaseClient> {
  const parsed = publicEnvSchema.parse({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_MAP_PROVIDER: process.env.NEXT_PUBLIC_MAP_PROVIDER || "maplibre",
  });
  const supabase = createClient(parsed.NEXT_PUBLIC_SUPABASE_URL, parsed.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { error } = await supabase.auth.signInWithPassword({ email, password: PASSWORD });
  if (error) throw error;
  return supabase;
}

describe.skipIf(!configured)("occupancy database overlap", () => {
  let sales: SupabaseClient;
  let faceId: string;
  const created: string[] = [];

  beforeAll(async () => {
    sales = await signIn("sales@horizonoutdoor.com");
    const { data: face } = await sales
      .from("board_faces")
      .select("id")
      .eq("tenant_id", TENANT_A)
      .eq("face_label", "Face B")
      .limit(1)
      .maybeSingle();
    if (!face?.id) throw new Error("Seed face missing for overlap tests");
    faceId = face.id;
  });

  afterAll(async () => {
    if (created.length) {
      await sales.from("occupancy_periods").delete().in("id", created);
    }
  });

  it("rejects overlapping occupied and booked_future at the database", async () => {
    const start = "2031-06-01";
    const end = "2031-06-30";

    const first = await sales
      .from("occupancy_periods")
      .insert({
        tenant_id: TENANT_A,
        face_id: faceId,
        start_date: start,
        end_date: end,
        state: "occupied",
        source: "manual",
      })
      .select("id")
      .single();
    expect(first.error).toBeNull();
    if (first.data?.id) created.push(first.data.id);

    const second = await sales.from("occupancy_periods").insert({
      tenant_id: TENANT_A,
      face_id: faceId,
      start_date: "2031-06-15",
      end_date: "2031-07-15",
      state: "booked_future",
      source: "manual",
    });

    expect(second.error).not.toBeNull();
    expect(second.error?.message ?? "").toMatch(/occupancy_periods_no_overlap|exclusion/i);
  });

  it("allows adjacent reservation periods", async () => {
    const first = await sales
      .from("occupancy_periods")
      .insert({
        tenant_id: TENANT_A,
        face_id: faceId,
        start_date: "2032-01-01",
        end_date: "2032-01-31",
        state: "occupied",
        source: "manual",
      })
      .select("id")
      .single();
    expect(first.error).toBeNull();
    if (first.data?.id) created.push(first.data.id);

    const second = await sales
      .from("occupancy_periods")
      .insert({
        tenant_id: TENANT_A,
        face_id: faceId,
        start_date: "2032-02-01",
        end_date: "2032-02-28",
        state: "booked_future",
        source: "manual",
      })
      .select("id")
      .single();
    expect(second.error).toBeNull();
    if (second.data?.id) created.push(second.data.id);
  });
});

describe("overlap message contract", () => {
  it("uses the product copy for reservation conflicts", () => {
    expect(OCCUPANCY_OVERLAP_MESSAGE).toBe(
      "This face already has an occupied or reserved period during these dates.",
    );
  });
});
