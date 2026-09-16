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

describe("manage CRM permissions", () => {
  it("gives sales enquiry/customer/campaign manage without settings", () => {
    expect(roleHasPermission("SALES", "enquiries.manage")).toBe(true);
    expect(roleHasPermission("SALES", "customers.manage")).toBe(true);
    expect(roleHasPermission("SALES", "campaigns.manage")).toBe(true);
    expect(roleHasPermission("SALES", "settings.manage")).toBe(false);
  });

  it("keeps technicians off CRM surfaces", () => {
    expect(roleHasPermission("TECHNICIAN", "enquiries.view")).toBe(false);
    expect(roleHasPermission("TECHNICIAN", "customers.view")).toBe(false);
    expect(roleHasPermission("TECHNICIAN", "campaigns.view")).toBe(false);
  });

  it("lets ops view customers/campaigns but not manage them", () => {
    expect(roleHasPermission("OPS_MANAGER", "customers.view")).toBe(true);
    expect(roleHasPermission("OPS_MANAGER", "customers.manage")).toBe(false);
    expect(roleHasPermission("OPS_MANAGER", "campaigns.manage")).toBe(false);
    expect(roleHasPermission("OPS_MANAGER", "enquiries.manage")).toBe(false);
  });
});

describe.skipIf(!configured)("customers enquiries campaigns RLS", () => {
  const clients: SupabaseClient[] = [];
  let sales: SupabaseClient;
  let ownerB: SupabaseClient;
  let technician: SupabaseClient;
  const createdCustomerIds: string[] = [];
  const createdCampaignIds: string[] = [];

  beforeAll(async () => {
    sales = await signIn("sales@horizonoutdoor.com");
    ownerB = await signIn("owner@malabarmedia.com");
    technician = await signIn("tech@horizonoutdoor.com");
    clients.push(sales, ownerB, technician);
  }, 60_000);

  afterAll(async () => {
    if (createdCampaignIds.length) {
      await sales.from("campaigns").delete().in("id", createdCampaignIds);
    }
    if (createdCustomerIds.length) {
      await sales.from("customers").delete().in("id", createdCustomerIds);
    }
    await Promise.all(clients.map((c) => c.auth.signOut()));
  });

  it("scopes customers to the caller's tenant", async () => {
    const { data } = await sales.from("customers").select("id, tenant_id");
    expect((data ?? []).every((row) => row.tenant_id === TENANT_A)).toBe(true);

    const { data: leaked } = await sales.from("customers").select("id").eq("tenant_id", TENANT_B);
    expect(leaked ?? []).toEqual([]);
  });

  it("scopes enquiries to the caller's tenant", async () => {
    const { data } = await sales.from("enquiries").select("id, tenant_id");
    expect((data ?? []).every((row) => row.tenant_id === TENANT_A)).toBe(true);

    const { data: leaked } = await sales.from("enquiries").select("id").eq("tenant_id", TENANT_B);
    expect(leaked ?? []).toEqual([]);
  });

  it("rejects technician CRM reads", async () => {
    const customers = await technician.from("customers").select("id");
    expect(customers.data ?? []).toEqual([]);

    const enquiries = await technician.from("enquiries").select("id");
    expect(enquiries.data ?? []).toEqual([]);

    const campaigns = await technician.from("campaigns").select("id");
    expect(campaigns.data ?? []).toEqual([]);
  });

  it("lets sales create a customer and campaign with face links", async () => {
    const customer = await sales
      .from("customers")
      .insert({
        tenant_id: TENANT_A,
        name: "Phase5 Test Advertiser",
        type: "advertiser",
        email: "phase5-test@example.com",
      })
      .select("id")
      .single();
    expect(customer.error).toBeNull();
    if (customer.data?.id) createdCustomerIds.push(customer.data.id);

    const { data: face } = await sales
      .from("board_faces")
      .select("id")
      .eq("tenant_id", TENANT_A)
      .is("archived_at", null)
      .limit(1)
      .maybeSingle();
    expect(face?.id).toBeTruthy();

    const campaign = await sales
      .from("campaigns")
      .insert({
        tenant_id: TENANT_A,
        name: "Phase5 Test Campaign",
        customer_id: customer.data?.id,
        status: "draft",
      })
      .select("id")
      .single();
    expect(campaign.error).toBeNull();
    if (campaign.data?.id) createdCampaignIds.push(campaign.data.id);

    const link = await sales.from("campaign_faces").insert({
      tenant_id: TENANT_A,
      campaign_id: campaign.data!.id,
      face_id: face!.id,
    });
    expect(link.error).toBeNull();

    const crossTenant = await sales.from("customers").insert({
      tenant_id: TENANT_B,
      name: "Should Fail",
      type: "agency",
    });
    expect(crossTenant.error).not.toBeNull();
  });

  it("returns dashboard stats only for the caller's membership", async () => {
    const ok = await sales.rpc("dashboard_stats", { p_tenant: TENANT_A });
    expect(ok.error).toBeNull();
    expect(ok.data).toMatchObject({
      boards: expect.any(Number),
      faces: expect.any(Number),
      marketplace_enquiries: expect.any(Number),
      jobs_pending: expect.any(Number),
    });

    const denied = await sales.rpc("dashboard_stats", { p_tenant: TENANT_B });
    expect(denied.error).not.toBeNull();
  });
});
