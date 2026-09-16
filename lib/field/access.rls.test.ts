import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { loadEnv } from "vite";
import { publicEnvSchema } from "@/lib/env";
import { roleHasPermission } from "@/lib/permissions/catalog";

const loaded = loadEnv("test", process.cwd(), "");
Object.assign(process.env, loaded);

const parsed = publicEnvSchema.safeParse({
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  NEXT_PUBLIC_MAP_PROVIDER: process.env.NEXT_PUBLIC_MAP_PROVIDER || "maplibre",
});

const TENANT_A = "aaaaaaaa-0000-4000-8000-000000000001";
const TENANT_B = "aaaaaaaa-0000-4000-8000-000000000002";
const TECH_JOB = "ffffffff-0000-4000-8000-000000000001";
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

describe("field technician permissions", () => {
  it("grants technicians field.view only", () => {
    expect(roleHasPermission("TECHNICIAN", "field.view")).toBe(true);
    expect(roleHasPermission("TECHNICIAN", "field.manage")).toBe(false);
    expect(roleHasPermission("TECHNICIAN", "boards.view")).toBe(false);
    expect(roleHasPermission("TECHNICIAN", "occupancy.manage")).toBe(false);
    expect(roleHasPermission("TECHNICIAN", "settings.manage")).toBe(false);
  });
});

describe.skipIf(!configured)("field jobs and proof RLS", () => {
  const clients: SupabaseClient[] = [];
  let tech: SupabaseClient;
  let sales: SupabaseClient;
  let ownerB: SupabaseClient;

  beforeAll(async () => {
    tech = await signIn("tech@horizonoutdoor.com");
    sales = await signIn("sales@horizonoutdoor.com");
    ownerB = await signIn("owner@malabarmedia.com");
    clients.push(tech, sales, ownerB);
  }, 60_000);

  afterAll(async () => {
    await Promise.all(clients.map((c) => c.auth.signOut()));
  });

  it("lets technicians read only their assigned tenant jobs", async () => {
    const { data } = await tech.from("field_jobs").select("id, tenant_id, assigned_to");
    expect((data ?? []).length).toBeGreaterThan(0);
    expect((data ?? []).every((row) => row.tenant_id === TENANT_A)).toBe(true);

    const { data: leaked } = await tech.from("field_jobs").select("id").eq("tenant_id", TENANT_B);
    expect(leaked ?? []).toEqual([]);
  });

  it("denies technicians from creating field jobs", async () => {
    const { data: board } = await tech.from("boards").select("id").eq("tenant_id", TENANT_A).limit(1).maybeSingle();
    // Technicians may lack boards.view — insert should still fail on field.manage.
    const insert = await tech.from("field_jobs").insert({
      tenant_id: TENANT_A,
      board_id: board?.id ?? "bbbbbbbb-0000-4000-8000-000000000001",
      job_type: "inspection",
      title: "Unauthorized create",
      status: "pending",
      priority: "low",
    });
    expect(insert.error).not.toBeNull();
  });

  it("blocks sales from reading technician-assigned jobs without field.manage", async () => {
    // Sales does not have field.view or field.manage in catalog.
    expect(roleHasPermission("SALES", "field.view")).toBe(false);
    const { data } = await sales.from("field_jobs").select("id");
    expect(data ?? []).toEqual([]);
  });

  it("rejects proof insert from another tenant user", async () => {
    const insert = await ownerB.from("proof_records").insert({
      tenant_id: TENANT_A,
      field_job_id: TECH_JOB,
      board_id: "bbbbbbbb-0000-4000-8000-000000000011",
      photo_storage_path: `${TENANT_A}/proof/fake.jpg`,
      captured_at: new Date().toISOString(),
      latitude: 11.25,
      longitude: 75.78,
      accuracy_meters: 12,
      captured_by: "10000000-0000-4000-8000-000000000099",
    });
    expect(insert.error).not.toBeNull();
  });

  it("allows technician to start their assigned job", async () => {
    const update = await tech
      .from("field_jobs")
      .update({ status: "in_progress", started_at: new Date().toISOString() })
      .eq("id", TECH_JOB)
      .eq("tenant_id", TENANT_A)
      .select("id, status")
      .maybeSingle();
    expect(update.error).toBeNull();
    expect(update.data?.status).toBe("in_progress");

    // Restore assigned so the seed job stays usable for app smoke.
    await tech
      .from("field_jobs")
      .update({ status: "assigned", started_at: null })
      .eq("id", TECH_JOB);
  });

  it("looks up board QR via tenant RPC without requiring boards.view", async () => {
    expect(roleHasPermission("TECHNICIAN", "boards.view")).toBe(false);
    const owner = await signIn("owner@horizonoutdoor.com");
    clients.push(owner);
    const { data: board } = await owner
      .from("boards")
      .select("qr_slug")
      .eq("tenant_id", TENANT_A)
      .limit(1)
      .single();
    expect(board?.qr_slug).toBeTruthy();

    const { data, error } = await tech.rpc("lookup_tenant_board_qr", {
      p_qr_slug: board!.qr_slug,
    });
    expect(error).toBeNull();
    expect(Array.isArray(data) ? data[0]?.qr_slug : data?.qr_slug).toBe(board!.qr_slug);

    const cross = await tech.rpc("lookup_tenant_board_qr", {
      p_qr_slug: "does-not-exist-slug",
    });
    expect(cross.error).toBeNull();
    expect(cross.data ?? []).toEqual([]);
  });
});
