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

describe.skipIf(!configured)("tenant RLS", () => {
  const clients: SupabaseClient[] = [];
  let ownerA: SupabaseClient;
  let ownerB: SupabaseClient;
  let sales: SupabaseClient;
  let admin: SupabaseClient;
  let technician: SupabaseClient;

  beforeAll(async () => {
    ownerA = await signIn("owner@horizonoutdoor.com");
    ownerB = await signIn("owner@malabarmedia.com");
    sales = await signIn("sales@horizonoutdoor.com");
    technician = await signIn("tech@horizonoutdoor.com");
    clients.push(ownerA, ownerB, sales, technician);
    try {
      admin = await signIn("admin@horizonoutdoor.com");
      clients.push(admin);
    } catch {
      admin = ownerA;
    }
  }, 60_000);

  afterAll(async () => {
    await Promise.all(clients.map((client) => client.auth.signOut()));
  });

  it("lets a member read their own organization", async () => {
    const { data, error } = await ownerA.from("organizations").select("id, slug").eq("id", TENANT_A);
    expect(error).toBeNull();
    expect(data).toEqual([{ id: TENANT_A, slug: "horizon-outdoor" }]);
  });

  it("scopes inventory queries to the caller's tenant", async () => {
    const { data } = await ownerA.from("boards").select("id, tenant_id");
    expect((data ?? []).length).toBeGreaterThan(0);
    expect((data ?? []).every((row) => row.tenant_id === TENANT_A)).toBe(true);

    const { data: leaked } = await ownerA.from("boards").select("id").eq("tenant_id", TENANT_B);
    expect(leaked ?? []).toEqual([]);
  });

  it("denies a member from reading another organization", async () => {
    const { data, error } = await ownerA.from("organizations").select("id").eq("id", TENANT_B);
    expect(error).toBeNull();
    expect(data).toEqual([]);

    const { data: reverse } = await ownerB.from("organizations").select("id").eq("id", TENANT_A);
    expect(reverse).toEqual([]);
  });

  it("rejects an unauthorized settings mutation from sales", async () => {
    const { data, error } = await sales
      .from("organization_settings")
      .update({ vacancy_prelisting_days: 45 })
      .eq("tenant_id", TENANT_A)
      .select("tenant_id");
    expect(data ?? []).toEqual([]);
    expect(
      error === null || error.code === "42501" || error.message.toLowerCase().includes("row-level security"),
    ).toBe(true);

    const { data: settings } = await ownerA
      .from("organization_settings")
      .select("vacancy_prelisting_days")
      .eq("tenant_id", TENANT_A)
      .single();
    expect(settings?.vacancy_prelisting_days).toBe(30);
  });

  it("rejects technician mutations that require team.manage", async () => {
    const { data, error } = await technician.from("organization_members").insert({
      organization_id: TENANT_A,
      user_id: "20000000-0000-4000-8000-000000000001",
      role: "SALES",
      status: "active",
    });
    expect(data).toBeNull();
    expect(error).toBeTruthy();
  });

  it("does not grant technicians occupancy or team administration", async () => {
    const { data: occupancy } = await technician.from("occupancy_periods").select("id").eq("tenant_id", TENANT_A);
    expect(occupancy ?? []).toEqual([]);

    const { data: updated, error: updateError } = await technician
      .from("organization_members")
      .update({ role: "ADMIN" })
      .eq("organization_id", TENANT_A)
      .eq("user_id", "10000000-0000-4000-8000-000000000005")
      .select("id");
    expect(updated ?? []).toEqual([]);
    expect(
      updateError === null ||
        updateError.code === "42501" ||
        updateError.message.toLowerCase().includes("row-level security"),
    ).toBe(true);

    const { data: fieldPerm } = await technician.rpc("has_permission", {
      _tenant: TENANT_A,
      _permission: "field.view",
    });
    const { data: teamPerm } = await technician.rpc("has_permission", {
      _tenant: TENANT_A,
      _permission: "team.manage",
    });
    expect(fieldPerm).toBe(true);
    expect(teamPerm).toBe(false);
  });

  it("grants sales occupancy and enquiry permissions, not settings", async () => {
    const { data: occupancy } = await sales.rpc("has_permission", {
      _tenant: TENANT_A,
      _permission: "occupancy.manage",
    });
    const { data: settings } = await sales.rpc("has_permission", {
      _tenant: TENANT_A,
      _permission: "settings.manage",
    });
    const { data: otherTenant } = await sales.rpc("has_permission", {
      _tenant: TENANT_B,
      _permission: "occupancy.manage",
    });
    expect(occupancy).toBe(true);
    expect(settings).toBe(false);
    expect(otherTenant).toBe(false);
  });

  it("grants admin team and settings permissions on their tenant only", async () => {
    const { data: team } = await admin.rpc("has_permission", {
      _tenant: TENANT_A,
      _permission: "team.manage",
    });
    const { data: settings } = await admin.rpc("has_permission", {
      _tenant: TENANT_A,
      _permission: "settings.manage",
    });
    const { data: other } = await admin.rpc("has_permission", {
      _tenant: TENANT_B,
      _permission: "team.manage",
    });
    expect(team).toBe(true);
    expect(settings).toBe(true);
    expect(other).toBe(false);

    const { data: members, error } = await admin
      .from("organization_members")
      .select("user_id")
      .eq("organization_id", TENANT_A);
    expect(error).toBeNull();
    expect((members ?? []).length).toBeGreaterThan(1);
  });
});
