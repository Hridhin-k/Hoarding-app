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

describe.skipIf(!configured)("platform staff isolation", () => {
  const clients: SupabaseClient[] = [];
  let ownerA: SupabaseClient;
  let staff: SupabaseClient;

  beforeAll(async () => {
    ownerA = await signIn("owner@horizonoutdoor.com");
    staff = await signIn("platform@hoardings360.com");
    clients.push(ownerA, staff);
  }, 60_000);

  afterAll(async () => {
    await Promise.all(clients.map((client) => client.auth.signOut()));
  });

  it("lets platform staff read overview and tenant list", async () => {
    const overview = await staff.rpc("platform_overview");
    expect(overview.error).toBeNull();
    const overviewRow = Array.isArray(overview.data) ? overview.data[0] : overview.data;
    expect(Number((overviewRow as { tenant_count?: number } | null)?.tenant_count)).toBeGreaterThan(0);

    const tenants = await staff.rpc("platform_list_tenants");
    expect(tenants.error).toBeNull();
    const ids = (tenants.data ?? []).map((row: { id: string }) => row.id);
    expect(ids).toContain(TENANT_A);
    expect(ids).toContain(TENANT_B);
  });

  it("denies tenant owners platform RPCs and platform audit rows", async () => {
    const overview = await ownerA.rpc("platform_overview");
    expect(overview.error).not.toBeNull();

    const tenants = await ownerA.rpc("platform_list_tenants");
    expect(tenants.error).not.toBeNull();

    const inspect = await ownerA.rpc("platform_start_inspect", {
      p_tenant: TENANT_B,
      p_reason: "Trying to inspect another tenant",
    });
    expect(inspect.error).not.toBeNull();

    const { data: audit } = await ownerA.from("platform_audit_logs").select("id").limit(5);
    expect(audit ?? []).toEqual([]);
  });

  it("denies anonymous platform RPCs", async () => {
    const anon = anonClient();
    const overview = await anon.rpc("platform_overview");
    expect(overview.error).not.toBeNull();
  });

  it("does not let platform staff read tenant tables without an inspect session", async () => {
    const { data: boards } = await staff.from("boards").select("id, tenant_id");
    expect(boards ?? []).toEqual([]);

    const { data: members } = await staff.from("organization_members").select("user_id").eq("organization_id", TENANT_A);
    expect(members ?? []).toEqual([]);

    const { data: orgs } = await staff.from("organizations").select("id");
    expect(orgs ?? []).toEqual([]);
  });

  it("requires a reason and returns inspect detail only for that session", async () => {
    const shortReason = await staff.rpc("platform_start_inspect", {
      p_tenant: TENANT_A,
      p_reason: "short",
    });
    expect(shortReason.error).not.toBeNull();

    const started = await staff.rpc("platform_start_inspect", {
      p_tenant: TENANT_A,
      p_reason: "Owner reported missing listings",
    });
    expect(started.error).toBeNull();
    expect(started.data).toBeTruthy();

    const detail = await staff.rpc("platform_tenant_detail", { p_session: started.data });
    expect(detail.error).toBeNull();
    expect(detail.data?.organization?.id).toBe(TENANT_A);
    expect(Array.isArray(detail.data?.members)).toBe(true);
    expect(Array.isArray(detail.data?.boards)).toBe(true);
  });

  it("hides tenant B listings after suspend and restores them on reactivate", async () => {
    const anon = anonClient();
    const before = await anon.from("marketplace_listings").select("board_code").eq("board_code", "MLB-KNR-001");
    const hadListing = (before.data ?? []).length > 0;

    const suspended = await staff.rpc("platform_set_tenant_status", {
      p_tenant: TENANT_B,
      p_status: "suspended",
      p_reason: "Isolation test suspend tenant B",
    });
    expect(suspended.error).toBeNull();

    try {
      const hidden = await anon.from("marketplace_listings").select("board_code").eq("board_code", "MLB-KNR-001");
      expect(hidden.data ?? []).toEqual([]);
    } finally {
      const restored = await staff.rpc("platform_set_tenant_status", {
        p_tenant: TENANT_B,
        p_status: "active",
        p_reason: "Isolation test restore tenant B",
      });
      expect(restored.error).toBeNull();
    }

    if (hadListing) {
      const after = await anon.from("marketplace_listings").select("board_code").eq("board_code", "MLB-KNR-001");
      expect((after.data ?? []).length).toBeGreaterThan(0);
    }
  });
});
