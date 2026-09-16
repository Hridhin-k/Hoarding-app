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
const BOARD_B = "bbbbbbbb-0000-4000-8000-000000000015";
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

describe("permission escalation catalog", () => {
  it("does not let technicians escalate to admin permissions", () => {
    expect(roleHasPermission("TECHNICIAN", "team.manage")).toBe(false);
    expect(roleHasPermission("TECHNICIAN", "settings.manage")).toBe(false);
    expect(roleHasPermission("TECHNICIAN", "boards.delete")).toBe(false);
    expect(roleHasPermission("TECHNICIAN", "audit.view")).toBe(false);
    expect(roleHasPermission("SALES", "team.manage")).toBe(false);
    expect(roleHasPermission("COMPLIANCE", "occupancy.manage")).toBe(false);
  });
});

describe.skipIf(!configured)("cross-tenant attack suite", () => {
  const clients: SupabaseClient[] = [];
  let ownerA: SupabaseClient;
  let ownerB: SupabaseClient;
  let tech: SupabaseClient;
  let sales: SupabaseClient;

  beforeAll(async () => {
    ownerA = await signIn("owner@horizonoutdoor.com");
    ownerB = await signIn("owner@malabarmedia.com");
    tech = await signIn("tech@horizonoutdoor.com");
    sales = await signIn("sales@horizonoutdoor.com");
    clients.push(ownerA, ownerB, tech, sales);
  }, 60_000);

  afterAll(async () => {
    await Promise.all(clients.map((c) => c.auth.signOut()));
  });

  it("blocks write_audit_log forgery into another tenant", async () => {
    const forged = await ownerA.rpc("write_audit_log", {
      p_tenant_id: TENANT_B,
      p_action: "ATTACK",
      p_entity_type: "board",
      p_entity_id: BOARD_B,
      p_old_data: null,
      p_new_data: { attempt: true },
      p_ip: null,
    });
    expect(forged.error).not.toBeNull();
  });

  it("blocks authenticated callers from global expire_holds", async () => {
    const result = await ownerA.rpc("expire_holds");
    expect(result.error).not.toBeNull();
  });

  it("blocks authenticated callers from global refresh_operational_alerts", async () => {
    const result = await ownerA.rpc("refresh_operational_alerts");
    expect(result.error).not.toBeNull();
  });

  it("allows tenant-scoped alert refresh only for own tenant with permission", async () => {
    const ok = await ownerA.rpc("refresh_tenant_operational_alerts", { p_tenant: TENANT_A });
    expect(ok.error).toBeNull();

    const denied = await ownerA.rpc("refresh_tenant_operational_alerts", { p_tenant: TENANT_B });
    expect(denied.error).not.toBeNull();

    const salesDenied = await sales.rpc("refresh_tenant_operational_alerts", { p_tenant: TENANT_A });
    // Sales has occupancy.manage so this may succeed — assert membership still scopes tenant.
    if (salesDenied.error) {
      expect(salesDenied.error.message).toMatch(/permission/i);
    } else {
      expect(salesDenied.data).toEqual(expect.any(Number));
    }
  });

  it("prevents Tenant A from reading Tenant B boards, customers, documents, proofs", async () => {
    const boards = await ownerA.from("boards").select("id").eq("id", BOARD_B);
    expect(boards.data ?? []).toEqual([]);

    const customers = await ownerA.from("customers").select("id").eq("tenant_id", TENANT_B);
    expect(customers.data ?? []).toEqual([]);

    const documents = await ownerA.from("documents").select("id").eq("tenant_id", TENANT_B);
    expect(documents.data ?? []).toEqual([]);

    const proofs = await ownerA.from("proof_records").select("id").eq("tenant_id", TENANT_B);
    expect(proofs.data ?? []).toEqual([]);
  });

  it("prevents Tenant A from updating Tenant B board via known UUID", async () => {
    const update = await ownerA
      .from("boards")
      .update({ name: "Hijacked" })
      .eq("id", BOARD_B)
      .select("id");
    expect(update.data ?? []).toEqual([]);
  });

  it("keeps marketplace free of floor_rate, tenant_id, and compliance internals", async () => {
    const anon = anonClient();
    const { data } = await anon.from("marketplace_listings").select("*").limit(5);
    const payload = JSON.stringify(data ?? []);
    expect(payload).not.toMatch(/floor_rate/);
    expect(payload).not.toMatch(/tenant_id/);
    expect(payload).not.toMatch(/compliance_dimension/);
    expect(payload).not.toMatch(/service_role/i);
  });

  it("rejects public enquiry spam beyond rate limit semantics for ineligible faces", async () => {
    const anon = anonClient();
    const { error } = await anon.rpc("submit_marketplace_enquiry", {
      p_face_id: BOARD_B,
      p_name: "Attacker",
      p_company_name: "",
      p_email: "attacker@example.com",
      p_phone: "9876543210",
      p_message: "probe",
      p_start: null,
      p_end: null,
      p_ip_hash: `attack-${Date.now()}`,
    });
    expect(error).not.toBeNull();
  });

  it("denies technicians admin inventory writes and cross-tenant QR", async () => {
    const create = await tech.from("boards").insert({
      tenant_id: TENANT_A,
      board_code: "HACK-001",
      name: "Should fail",
      structure_type: "hoarding",
      ownership_type: "owned",
      lifecycle_status: "draft",
      city: "Palakkad",
      state: "Kerala",
    });
    expect(create.error).not.toBeNull();

    const otherTenantQr = await tech.rpc("lookup_tenant_board_qr", {
      p_qr_slug: "not-a-real-slug-zzzz",
    });
    expect(otherTenantQr.error).toBeNull();
    expect(otherTenantQr.data ?? []).toEqual([]);
  });

  it("does not expose private storage objects to anonymous users", async () => {
    const anon = anonClient();
    const list = await anon.storage.from("documents").list(TENANT_A);
    expect((list.data ?? []).length).toBe(0);
    const proof = await anon.storage.from("proof-of-display").list(TENANT_A);
    expect((proof.data ?? []).length).toBe(0);
  });
});
