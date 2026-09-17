import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { loadEnv } from "vite";
import { publicEnvSchema } from "@/lib/env";

const loaded = loadEnv("test", process.cwd(), "");
Object.assign(process.env, loaded);

const parsed = publicEnvSchema.safeParse({
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  NEXT_PUBLIC_MAP_PROVIDER: process.env.NEXT_PUBLIC_MAP_PROVIDER || "maplibre",
});

const TENANT_A = "aaaaaaaa-0000-4000-8000-000000000001";
const TENANT_B = "aaaaaaaa-0000-4000-8000-000000000002";
const BOARD_A = "bbbbbbbb-0000-4000-8000-000000000003";
const PASSWORD = "Password123!";
const configured = parsed.success;

async function signIn(email: string): Promise<SupabaseClient> {
  if (!parsed.success) throw new Error("Missing public Supabase env");
  const supabase = createClient(parsed.data.NEXT_PUBLIC_SUPABASE_URL, parsed.data.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { error } = await supabase.auth.signInWithPassword({ email, password: PASSWORD });
  if (error) throw error;
  return supabase;
}

function anonClient(): SupabaseClient {
  if (!parsed.success) throw new Error("Missing public Supabase env");
  return createClient(parsed.data.NEXT_PUBLIC_SUPABASE_URL, parsed.data.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

describe.skipIf(!configured)("documented RPC surface", () => {
  const clients: SupabaseClient[] = [];
  let ownerA: SupabaseClient;
  let anon: SupabaseClient;

  beforeAll(async () => {
    ownerA = await signIn("owner@horizonoutdoor.com");
    anon = anonClient();
    clients.push(ownerA);
  }, 60_000);

  afterAll(async () => {
    await Promise.all(clients.map((client) => client.auth.signOut()));
  });

  it("resolves membership, role, and permission for the caller tenant only", async () => {
    const member = await ownerA.rpc("is_org_member", { _tenant: TENANT_A });
    expect(member.error).toBeNull();
    expect(member.data).toBe(true);

    const outsider = await ownerA.rpc("is_org_member", { _tenant: TENANT_B });
    expect(outsider.error).toBeNull();
    expect(outsider.data).toBe(false);

    const role = await ownerA.rpc("member_role", { _tenant: TENANT_A });
    expect(role.error).toBeNull();
    expect(role.data).toBe("OWNER");

    const canView = await ownerA.rpc("has_permission", { _tenant: TENANT_A, _permission: "boards.view" });
    expect(canView.error).toBeNull();
    expect(canView.data).toBe(true);

    const other = await ownerA.rpc("has_permission", { _tenant: TENANT_B, _permission: "boards.view" });
    expect(other.error).toBeNull();
    expect(other.data).toBe(false);
  });

  it("computes occupancy, compliance, eligibility, and available-from for a published face", async () => {
    const { data: listing, error: listingError } = await anon
      .from("marketplace_listings")
      .select("face_id, board_id")
      .eq("board_id", BOARD_A)
      .limit(1)
      .maybeSingle();
    expect(listingError).toBeNull();
    const face = listing ?? (await anon.from("marketplace_listings").select("face_id, board_id").limit(1).maybeSingle()).data;
    expect(face?.face_id).toBeTruthy();

    const occupancy = await ownerA.rpc("face_occupancy_dimension", { p_face_id: face!.face_id });
    expect(occupancy.error).toBeNull();
    expect(typeof occupancy.data).toBe("string");

    const compliance = await ownerA.rpc("board_compliance_dimension", { p_board_id: face!.board_id });
    expect(compliance.error).toBeNull();
    expect(compliance.data).toBeTruthy();

    const eligible = await ownerA.rpc("face_is_marketplace_eligible", { p_face_id: face!.face_id });
    expect(eligible.error).toBeNull();
    expect(eligible.data).toBe(true);

    const available = await ownerA.rpc("face_available_from", { p_face_id: face!.face_id });
    expect(available.error).toBeNull();
    expect(available.data).toBeTruthy();
  });

  it("returns dashboard stats and upcoming vacancies for the caller tenant", async () => {
    const stats = await ownerA.rpc("dashboard_stats", { p_tenant: TENANT_A });
    expect(stats.error).toBeNull();
    const row = Array.isArray(stats.data) ? stats.data[0] : stats.data;
    expect(row).toBeTruthy();

    const vacancies = await ownerA.rpc("dashboard_upcoming_vacancies", { p_tenant: TENANT_A, p_limit: 8 });
    expect(vacancies.error).toBeNull();
    expect(Array.isArray(vacancies.data) || vacancies.data == null).toBe(true);

    const denied = await ownerA.rpc("dashboard_stats", { p_tenant: TENANT_B });
    expect(denied.error).not.toBeNull();
  });

  it("lets anonymous users read marketplace views and denies tenant tables", async () => {
    const listings = await anon.from("marketplace_listings").select("face_id, card_rate").limit(5);
    expect(listings.error).toBeNull();
    expect((listings.data ?? []).length).toBeGreaterThan(0);
    expect(listings.data?.[0]).not.toHaveProperty("floor_rate");

    const photos = await anon.from("marketplace_photos").select("id, board_id").limit(5);
    expect(photos.error).toBeNull();

    const boards = await anon.from("boards").select("id").limit(1);
    expect(boards.data ?? []).toEqual([]);

    const member = await anon.rpc("is_org_member", { _tenant: TENANT_A });
    expect(member.error).toBeNull();
    expect(member.data).toBe(false);
  });

  it("looks up QR by slug for the caller's tenant and denies service-role ops to members", async () => {
    const { data: board } = await ownerA.from("boards").select("qr_slug").eq("id", BOARD_A).maybeSingle();
    expect(board?.qr_slug).toBeTruthy();

    const lookup = await ownerA.rpc("lookup_tenant_board_qr", { p_qr_slug: board!.qr_slug });
    expect(lookup.error).toBeNull();
    const row = Array.isArray(lookup.data) ? lookup.data[0] : lookup.data;
    expect(row?.qr_slug).toBe(board!.qr_slug);

    const staff = await ownerA.rpc("is_platform_staff");
    expect(staff.error).toBeNull();
    expect(staff.data).toBe(false);

    const alerts = await ownerA.rpc("refresh_operational_alerts");
    expect(alerts.error).not.toBeNull();
    const holds = await ownerA.rpc("expire_holds");
    expect(holds.error).not.toBeNull();
  });
});
