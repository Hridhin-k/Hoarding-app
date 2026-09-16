import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { describe, expect, it } from "vitest";
import { loadEnv } from "vite";
import { publicEnvSchema } from "@/lib/env";

const loaded = loadEnv("test", process.cwd(), "");
Object.assign(process.env, loaded);

const parsed = publicEnvSchema.safeParse({
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  NEXT_PUBLIC_MAP_PROVIDER: process.env.NEXT_PUBLIC_MAP_PROVIDER || "maplibre",
});

const configured = parsed.success;

function anonClient(): SupabaseClient {
  if (!parsed.success) throw new Error("Missing public Supabase env");
  return createClient(parsed.data.NEXT_PUBLIC_SUPABASE_URL, parsed.data.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

describe.skipIf(!configured)("public marketplace listings", () => {
  it("exposes only eligible faces to anonymous users", async () => {
    const supabase = anonClient();
    const { data, error } = await supabase
      .from("marketplace_listings")
      .select("face_id, board_id, board_name, board_code, occupancy_dimension, card_rate, available_from")
      .limit(100);

    expect(error).toBeNull();
    expect((data ?? []).length).toBeGreaterThan(0);

    // Unpublished / expired / retired / blocked boards from seed must not appear.
    const codes = new Set((data ?? []).map((row) => row.board_code));
    expect(codes.has("H360-HZN-008")).toBe(false); // expired compliance / unpublished
    expect(codes.has("H360-HZN-012")).toBe(false); // blocked + unpublished
    expect(codes.has("H360-HZN-010")).toBe(false); // not published
    expect(codes.has("H360-HZN-011")).toBe(false); // draft / no faces

    // Public payload must not include floor_rate or tenant_id.
    const sample = data?.[0] as Record<string, unknown> | undefined;
    expect(sample).toBeTruthy();
    expect(sample).not.toHaveProperty("floor_rate");
    expect(sample).not.toHaveProperty("tenant_id");
    expect(sample).not.toHaveProperty("compliance_dimension");
  });

  it("keeps tenant A and tenant B inventory visible only as public listings without org leakage", async () => {
    const supabase = anonClient();
    const { data } = await supabase.from("marketplace_listings").select("board_code, board_name").limit(200);
    const payload = JSON.stringify(data ?? []);
    expect(payload).not.toMatch(/horizonoutdoor\.com/i);
    expect(payload).not.toMatch(/malabarmedia\.com/i);
    expect(payload).not.toMatch(/tenant_id/i);
    expect(payload).not.toMatch(/floor_rate/i);
  });

  it("rejects marketplace enquiry for ineligible faces", async () => {
    const supabase = anonClient();
    const { data: faces } = await supabase
      .from("board_faces")
      .select("id, boards!inner(board_code)")
      .eq("boards.board_code", "H360-HZN-008")
      .limit(1);

    // Anon cannot read board_faces directly — expect empty or error.
    expect((faces ?? []).length).toBe(0);

    const { error } = await supabase.rpc("submit_marketplace_enquiry", {
      p_face_id: "00000000-0000-4000-8000-000000000099",
      p_name: "Spam Bot",
      p_company_name: "",
      p_email: "spam@example.com",
      p_phone: "9876543210",
      p_message: "test",
      p_start: null,
      p_end: null,
      p_ip_hash: "phase6-test-hash",
    });
    expect(error).not.toBeNull();
  });

  it("lists available and upcoming vacancy faces when published", async () => {
    const supabase = anonClient();
    const { data } = await supabase
      .from("marketplace_listings")
      .select("occupancy_dimension, available_from, board_code")
      .in("occupancy_dimension", ["vacant", "becoming_vacant", "occupied", "booked_future"])
      .limit(50);

    expect((data ?? []).length).toBeGreaterThan(0);
    expect((data ?? []).every((row) => row.available_from)).toBe(true);
    expect((data ?? []).every((row) => row.occupancy_dimension !== "blocked")).toBe(true);
  });
});
